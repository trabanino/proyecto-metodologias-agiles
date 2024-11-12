const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3001;

const jwtSecret = '8c20f7077ddcbf3131a328142c708c0ccde6323d353727681f36bfe7a1c643ee136f8cb979485be8a590df61b60eb27b7d8f1f42d08d498ae7cd40406ea11e1d6b2b100032a8994c8dc05d79c2345879c02a911fce83d91fa51aba9c5e8f8ecf39ddc3b17d08c059d3a15afc87d9bfaf23e76bb4c3467488dea187c1da3075fd0c4ba6481adf10b9769f1522b31d30f97d91afd2a4612e34171004f588e9cb79cd9179c69cd24431d442608f50cc63e4f8707f711ec758c456724ce0f75fcae524a063053ed89cb23d18dd5c6d297c07ca6507d2f821a8e23cdd8722ebf73b3d58eea383d12ba22639bf536c3bc201832f8fad16027aa64d4cd28c5ea430b81b055fa0912e66c576c366d372187d41c3d9a9e45fdb8091b18e6bbebfa3cb1db02d5220b38e4322c6886665978cbe5947bb40060a4411fc0c56259a56388c366c5419a1f78e5fb1bb0322ad3b5bc5e29efcee070ad4c16f115e96bdeb65a10aa8b41cf9da383b564126cd6679442fc45bdad7ea1f69e23f328265270149b5b932116e99d0b3365792c29108a5e7fc34d367659a71b90787c934fb862bb3a22a375117a263dca9a6996f70b905d7c84a3e3ecbc9ba2c4963cf2a97073b4ed2339f98c452bf4f251861957fb5f27820c4a8e35aa7b0063c6a18aa19077122095a7409e4ec4241b285453c53bd9305af0576958ecbab2d10d3dd58299c81b8769335';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const url = 'mongodb://esen.trabanino.xyz:27017';
const dbName = 'gestion_proyectos';

async function main() {
    const client = new MongoClient(url);

    try {
        await client.connect();

        const db = client.db(dbName);

        const usersCollection = db.collection('usuarios');
        const projectsCollection = db.collection('proyectos');

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        app.get('/home', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
        });

        app.get('/login', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'login.html'));
        });

        app.get('/register', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'register.html'));
        });

        app.get('/kanban', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'kanban.html'));
        });

        app.get('/scrum', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'scrum_view.html'));
        });

        app.post('/api/register', async (req, res) => {
            const { nombre, correo, contraseña } = req.body;
            const usuarioExistente = await usersCollection.findOne({ correo });
            if (usuarioExistente) {
                return res.status(400).json({ mensaje: 'El correo ya está registrado' });
            }
            const contraseñaHash = await bcrypt.hash(contraseña, 10);
            const nuevoUsuario = { nombre, correo, contraseña: contraseñaHash, rol: 'miembro' };
            await usersCollection.insertOne(nuevoUsuario);
            res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
        });

        app.post('/api/login', async (req, res) => {
            const { correo, contraseña } = req.body;
            const usuario = await usersCollection.findOne({ correo });
            if (!usuario) {
                return res.status(400).json({ mensaje: 'Correo o contraseña incorrectos' });
            }
            const esContraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
            if (!esContraseñaValida) {
                return res.status(400).json({ mensaje: 'Correo o contraseña incorrectos' });
            }
            const token = jwt.sign({ id: usuario._id.toString(), rol: usuario.rol }, jwtSecret, { expiresIn: '1h' });
            res.json({ mensaje: 'Inicio de sesión exitoso', token });
        });

        function verificarToken(req, res, next) {
            const token = req.headers['authorization'];
            if (!token) {
                return res.status(401).json({ mensaje: 'Acceso denegado. Se requiere token' });
            }
            try {
                const verificado = jwt.verify(token, jwtSecret);
                req.usuario = verificado;
                next();
            } catch (error) {
                res.status(400).json({ mensaje: 'Token inválido' });
            }
        }

        function generateProjectCode() {
            return Math.random().toString(36).substr(2, 8);
        }

        app.get('/api/projects', verificarToken, async (req, res) => {
            const userId = req.usuario.id;
            const projects = await projectsCollection.find({ miembros: userId }).toArray();
            res.send(projects);
        });

        app.post('/api/projects', verificarToken, async (req, res) => {
            const userId = req.usuario.id;
            const { nombre, descripcion, miembrosInvitados, tipo } = req.body;
            const miembros = [userId];
            let invitacionesPendientes = [];

            if (!['kanban', 'scrum'].includes(tipo)) {
                return res.status(400).json({ mensaje: 'Tipo de proyecto inválido' });
            }

            if (miembrosInvitados && miembrosInvitados.length > 0) {
                const usuariosInvitados = await usersCollection.find({ correo: { $in: miembrosInvitados } }).toArray();
                const invitadosIds = usuariosInvitados.map(usuario => usuario._id.toString());
                invitacionesPendientes.push(...invitadosIds);

                const correosEncontrados = usuariosInvitados.map(usuario => usuario.correo);
                const correosNoEncontrados = miembrosInvitados.filter(email => !correosEncontrados.includes(email));

                if (correosNoEncontrados.length > 0) {
                    return res.status(400).json({ mensaje: `Los siguientes correos no están registrados: ${correosNoEncontrados.join(', ')}` });
                }
            }

            const nuevoProyecto = {
                nombre,
                descripcion,
                owner: userId,
                miembros,
                codigo: generateProjectCode(),
                tipo,
                admins: [userId],
                invitacionesPendientes
            };

            const result = await projectsCollection.insertOne(nuevoProyecto);
            const insertedProject = await projectsCollection.findOne({ _id: result.insertedId });
            res.send(insertedProject);
        });

        app.post('/api/projects/join', verificarToken, async (req, res) => {
            const userId = req.usuario.id;
            const { projectCode } = req.body;

            const project = await projectsCollection.findOne({ codigo: projectCode });

            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }

            if (project.miembros.includes(userId)) {
                return res.status(400).json({ mensaje: 'Ya eres miembro de este proyecto' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $push: { miembros: userId } }
            );

            res.json({ mensaje: 'Te has unido al proyecto' });
        });

        app.delete('/api/projects/:id', verificarToken, async (req, res) => {
            const projectId = req.params.id;
            const userId = req.usuario.id;
            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (project.owner.toString() !== userId) {
                return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este proyecto' });
            }
            await projectsCollection.deleteOne({ _id: new ObjectId(projectId) });
            res.json({ mensaje: 'Proyecto eliminado' });
        });

        app.get('/api/projects/:id', verificarToken, async (req, res) => {
            const projectId = req.params.id;
            const userId = req.usuario.id;
            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }
            res.send(project);
        });

        app.post('/api/projects/:id/invite', verificarToken, async (req, res) => {
            const projectId = req.params.id;
            const userId = req.usuario.id;
            const { email } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.owner.toString() !== userId && !project.admins.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes permiso para invitar miembros' });
            }

            const userToInvite = await usersCollection.findOne({ correo: email });
            if (!userToInvite) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }

            if (project.miembros.includes(userToInvite._id.toString())) {
                return res.status(400).json({ mensaje: 'El usuario ya es miembro del proyecto' });
            }

            if (project.invitacionesPendientes && project.invitacionesPendientes.includes(userToInvite._id.toString())) {
                return res.status(400).json({ mensaje: 'Ya has enviado una invitación a este usuario' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $addToSet: { invitacionesPendientes: userToInvite._id.toString() } }
            );

            res.json({ mensaje: 'Invitación enviada' });
        });

        app.get('/api/invites', verificarToken, async (req, res) => {
            const userId = req.usuario.id;
            const projects = await projectsCollection.find({ invitacionesPendientes: userId }).toArray();
            res.send(projects);
        });

        app.get('/api/projects/:projectId/invitations', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.owner.toString() !== userId && !project.admins.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes permiso para ver las invitaciones' });
            }

            const invitations = project.invitacionesPendientes || [];
            const users = await usersCollection.find({ _id: { $in: invitations.map(id => new ObjectId(id)) } }).toArray();

            res.send(users);
        });

        app.delete('/api/projects/:projectId/invitations/:userId', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const invitedUserId = req.params.userId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.owner.toString() !== userId && !project.admins.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes permiso para cancelar invitaciones' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $pull: { invitacionesPendientes: invitedUserId } }
            );

            res.json({ mensaje: 'Invitación cancelada' });
        });

        app.post('/api/invites/:projectId/accept', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (!project.invitacionesPendientes || !project.invitacionesPendientes.includes(userId)) {
                return res.status(400).json({ mensaje: 'No tienes una invitación pendiente para este proyecto' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                {
                    $pull: { invitacionesPendientes: userId },
                    $addToSet: { miembros: userId }
                }
            );

            res.json({ mensaje: 'Invitación aceptada' });
        });

        app.post('/api/invites/:projectId/decline', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (!project.invitacionesPendientes || !project.invitacionesPendientes.includes(userId)) {
                return res.status(400).json({ mensaje: 'No tienes una invitación pendiente para este proyecto' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $pull: { invitacionesPendientes: userId } }
            );

            res.json({ mensaje: 'Invitación rechazada' });
        });

        app.delete('/api/projects/:projectId/members/:memberId', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const memberId = req.params.memberId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.owner.toString() !== userId && !project.admins.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes permiso para eliminar miembros' });
            }
            if (project.owner.toString() === memberId) {
                return res.status(400).json({ mensaje: 'No puedes eliminar al propietario del proyecto' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $pull: { miembros: memberId, admins: memberId } }
            );

            res.json({ mensaje: 'Miembro eliminado' });
        });

        app.post('/api/projects/:projectId/members/:memberId/role', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const memberId = req.params.memberId;
            const userId = req.usuario.id;
            const { role } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.owner.toString() !== userId) {
                return res.status(403).json({ mensaje: 'Solo el propietario puede asignar roles' });
            }

            if (role === 'admin') {
                await projectsCollection.updateOne(
                    { _id: project._id },
                    { $addToSet: { admins: memberId } }
                );
            } else if (role === 'miembro') {
                await projectsCollection.updateOne(
                    { _id: project._id },
                    { $pull: { admins: memberId } }
                );
            } else {
                return res.status(400).json({ mensaje: 'Rol inválido' });
            }

            res.json({ mensaje: 'Rol actualizado' });
        });

        app.get('/api/users/:id', verificarToken, async (req, res) => {
            const userId = req.params.id;

            let objectId;
            try {
                objectId = new ObjectId(userId);
            } catch (error) {
                return res.status(400).json({ mensaje: 'Formato de ID de usuario inválido' });
            }

            const usuario = await usersCollection.findOne({ _id: objectId }, { projection: { contraseña: 0 } });
            if (!usuario) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }
            res.send(usuario);
        });

        app.post('/api/projects/:projectId/deadline', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const userId = req.usuario.id;
            const { deadline } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.owner.toString() !== userId && !project.admins.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes permiso para establecer el plazo' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $set: { deadline } }
            );

            res.json({ mensaje: 'Fecha límite actualizada' });
        });

        app.get('/api/projects/:projectId/kanban', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.tipo !== 'kanban') {
                return res.status(400).json({ mensaje: 'Este proyecto no es de tipo Kanban' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            const kanbanBoard = project.kanbanBoard || { columns: [] };
            res.json(kanbanBoard);
        });

        app.post('/api/projects/:projectId/kanban/columns', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const userId = req.usuario.id;
            const { title } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.tipo !== 'kanban') {
                return res.status(400).json({ mensaje: 'Este proyecto no es de tipo Kanban' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            const columnId = new ObjectId().toString();
            const newColumn = {
                id: columnId,
                title,
                tasks: []
            };

            await projectsCollection.updateOne(
                { _id: project._id },
                { $push: { 'kanbanBoard.columns': newColumn } }
            );

            res.json({ mensaje: 'Columna añadida', column: newColumn });
        });

        app.delete('/api/projects/:projectId/kanban/columns/:columnId', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.tipo !== 'kanban') {
                return res.status(400).json({ mensaje: 'Este proyecto no es de tipo Kanban' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $pull: { 'kanbanBoard.columns': { id: columnId } } }
            );

            res.json({ mensaje: 'Columna eliminada' });
        });

        app.post('/api/projects/:projectId/kanban/columns/:columnId/tasks', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const userId = req.usuario.id;
            const { title, description, assignees, label } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.tipo !== 'kanban') {
                return res.status(400).json({ mensaje: 'Este proyecto no es de tipo Kanban' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            const taskId = new ObjectId().toString();
            const newTask = {
                id: taskId,
                title,
                description,
                assignees,
                label
            };

            await projectsCollection.updateOne(
                { _id: project._id, 'kanbanBoard.columns.id': columnId },
                { $push: { 'kanbanBoard.columns.$.tasks': newTask } }
            );

            res.json({ mensaje: 'Tarea añadida', task: newTask });
        });

        app.put('/api/projects/:projectId/kanban/tasks/:taskId', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const taskId = req.params.taskId;
            const userId = req.usuario.id;
            const { title, description, assignees, label } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.tipo !== 'kanban') {
                return res.status(400).json({ mensaje: 'Este proyecto no es de tipo Kanban' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            for (const column of project.kanbanBoard.columns) {
                const taskIndex = column.tasks.findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                    const updateFields = {};
                    if (title !== undefined) updateFields['kanbanBoard.columns.$[col].tasks.$[tsk].title'] = title;
                    if (description !== undefined) updateFields['kanbanBoard.columns.$[col].tasks.$[tsk].description'] = description;
                    if (assignees !== undefined) updateFields['kanbanBoard.columns.$[col].tasks.$[tsk].assignees'] = assignees;
                    if (label !== undefined) updateFields['kanbanBoard.columns.$[col].tasks.$[tsk].label'] = label;

                    await projectsCollection.updateOne(
                        { _id: project._id },
                        { $set: updateFields },
                        {
                            arrayFilters: [
                                { 'col.id': column.id },
                                { 'tsk.id': taskId }
                            ]
                        }
                    );

                    return res.json({ mensaje: 'Tarea actualizada' });
                }
            }

            res.status(404).json({ mensaje: 'Tarea no encontrada' });
        });

        app.delete('/api/projects/:projectId/kanban/tasks/:taskId', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const taskId = req.params.taskId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.tipo !== 'kanban') {
                return res.status(400).json({ mensaje: 'Este proyecto no es de tipo Kanban' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            let taskFound = false;
            for (const column of project.kanbanBoard.columns) {
                const taskIndex = column.tasks.findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                    await projectsCollection.updateOne(
                        { _id: project._id, 'kanbanBoard.columns.id': column.id },
                        { $pull: { 'kanbanBoard.columns.$.tasks': { id: taskId } } }
                    );
                    taskFound = true;
                    break;
                }
            }

            if (taskFound) {
                res.json({ mensaje: 'Tarea eliminada' });
            } else {
                res.status(404).json({ mensaje: 'Tarea no encontrada' });
            }
        });

        app.post('/api/projects/:projectId/kanban/tasks/:taskId/move', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const taskId = req.params.taskId;
            const userId = req.usuario.id;
            const { targetColumnId } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.tipo !== 'kanban') {
                return res.status(400).json({ mensaje: 'Este proyecto no es de tipo Kanban' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            let taskToMove = null;
            let sourceColumnId = null;
            for (const column of project.kanbanBoard.columns) {
                const taskIndex = column.tasks.findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                    taskToMove = column.tasks[taskIndex];
                    sourceColumnId = column.id;
                    break;
                }
            }

            if (!taskToMove) {
                return res.status(404).json({ mensaje: 'Tarea no encontrada' });
            }

            await projectsCollection.updateOne(
                { _id: project._id, 'kanbanBoard.columns.id': sourceColumnId },
                { $pull: { 'kanbanBoard.columns.$.tasks': { id: taskId } } }
            );

            await projectsCollection.updateOne(
                { _id: project._id, 'kanbanBoard.columns.id': targetColumnId },
                { $push: { 'kanbanBoard.columns.$.tasks': taskToMove } }
            );

            res.json({ mensaje: 'Tarea movida' });
        });

        app.listen(PORT, () => {
            console.log(`Servidor en puerto ${PORT}`);
        });

    } catch (err) {
        console.error(err);
    }
}

main();
