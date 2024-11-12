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
        console.log('Conectado a MongoDB');

        const db = client.db(dbName);

        const usersCollection = db.collection('usuarios');
        const projectsCollection = db.collection('proyectos');
        const tasksCollection = db.collection('tareas');

        // Routes for serving HTML files
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

        app.get('/proyecto/:id', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'project_view.html'));
        });

        app.get('/kanban', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'kanban.html'));
        });

        // User registration
        app.post('/api/register', async (req, res) => {
            const { nombre, correo, contraseña, rol } = req.body;
            const usuarioExistente = await usersCollection.findOne({ correo });
            if (usuarioExistente) {
                return res.status(400).json({ mensaje: 'El correo ya está registrado' });
            }
            const contraseñaHash = await bcrypt.hash(contraseña, 10);
            const nuevoUsuario = { nombre, correo, contraseña: contraseñaHash, rol: rol || 'miembro' };
            await usersCollection.insertOne(nuevoUsuario);
            res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
        });

        // User login
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

        // Token verification middleware
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

        // Generate project code
        function generateProjectCode() {
            return Math.random().toString(36).substr(2, 8);
        }

        // Get projects
        app.get('/api/projects', verificarToken, async (req, res) => {
            const userId = req.usuario.id;
            const projects = await projectsCollection.find({ miembros: userId }).toArray();
            res.send(projects);
        });

        // Create project
        app.post('/api/projects', verificarToken, async (req, res) => {
            const userId = req.usuario.id;
            const { nombre, descripcion, miembrosInvitados, tipo } = req.body;
            const miembros = [userId];

            if (miembrosInvitados && miembrosInvitados.length > 0) {
                const usuariosInvitados = await usersCollection.find({ correo: { $in: miembrosInvitados } }).toArray();
                const invitadosIds = usuariosInvitados.map(usuario => usuario._id.toString());
                miembros.push(...invitadosIds);
            }

            const columns = tipo === 'kanban' ? ['To Do', 'In Progress', 'Done'] : [];

            const nuevoProyecto = {
                nombre,
                descripcion,
                owner: userId,
                miembros,
                codigo: generateProjectCode(),
                tipo: tipo || 'kanban',
                columns
            };

            const result = await projectsCollection.insertOne(nuevoProyecto);
            const insertedProject = await projectsCollection.findOne({ _id: result.insertedId });
            res.send(insertedProject);
        });

        // Join project
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

        // Delete project
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

        // Get project details
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

        // Invite member to project
        app.post('/api/projects/:id/invite', verificarToken, async (req, res) => {
            const projectId = req.params.id;
            const userId = req.usuario.id;
            const { email } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.owner.toString() !== userId && (!project.admins || !project.admins.includes(userId))) {
                return res.status(403).json({ mensaje: 'No tienes permiso para invitar miembros' });
            }

            const userToInvite = await usersCollection.findOne({ correo: email });
            if (!userToInvite) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $addToSet: { invitacionesPendientes: userToInvite._id.toString() } }
            );

            res.json({ mensaje: 'Invitación enviada' });
        });

        // Get invitations
        app.get('/api/invites', verificarToken, async (req, res) => {
            const userId = req.usuario.id;
            const projects = await projectsCollection.find({ invitacionesPendientes: userId }).toArray();
            res.send(projects);
        });

        // Accept invitation
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

        // Decline invitation
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

        // Delete member from project
        app.delete('/api/projects/:projectId/members/:memberId', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const memberId = req.params.memberId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (project.owner.toString() !== userId && (!project.admins || !project.admins.includes(userId))) {
                return res.status(403).json({ mensaje: 'No tienes permiso para eliminar miembros' });
            }
            if (project.owner.toString() === memberId) {
                return res.status(400).json({ mensaje: 'No puedes eliminar al owner del proyecto' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $pull: { miembros: memberId, admins: memberId } }
            );

            res.json({ mensaje: 'Miembro eliminado' });
        });

        // Assign role to member
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
                return res.status(403).json({ mensaje: 'Solo el owner puede asignar roles' });
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

        // Get user details
        app.get('/api/users/:id', verificarToken, async (req, res) => {
            const userId = req.params.id;

            let objectId;
            try {
                objectId = new ObjectId(userId);
            } catch (error) {
                return res.status(400).json({ mensaje: 'ID de usuario inválido' });
            }

            const usuario = await usersCollection.findOne({ _id: objectId }, { projection: { contraseña: 0 } });
            if (!usuario) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }
            res.send(usuario);
        });

        // Get tasks
        app.get('/api/projects/:projectId/tasks', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            const tasks = await tasksCollection.find({ projectId }).toArray();
            res.send(tasks);
        });

        // Create task
        app.post('/api/projects/:projectId/tasks', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const userId = req.usuario.id;
            const { title, description, assignees, urgency, status } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            const newTask = {
                projectId,
                title,
                description,
                assignees,
                urgency,
                status
            };

            const result = await tasksCollection.insertOne(newTask);
            const insertedTask = await tasksCollection.findOne({ _id: result.insertedId });
            res.send(insertedTask);
        });

        // Update task
        app.put('/api/projects/:projectId/tasks/:taskId', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const taskId = req.params.taskId;
            const userId = req.usuario.id;
            const { title, description, assignees, urgency, status } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            await tasksCollection.updateOne(
                { _id: new ObjectId(taskId) },
                { $set: { title, description, assignees, urgency, status } }
            );

            res.json({ mensaje: 'Tarea actualizada' });
        });

        // Delete task
        app.delete('/api/projects/:projectId/tasks/:taskId', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const taskId = req.params.taskId;
            const userId = req.usuario.id;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            await tasksCollection.deleteOne({ _id: new ObjectId(taskId) });

            res.json({ mensaje: 'Tarea eliminada' });
        });

        // Add new column to project
        app.post('/api/projects/:projectId/columns', verificarToken, async (req, res) => {
            const projectId = req.params.projectId;
            const userId = req.usuario.id;
            const { columnName } = req.body;

            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            if (!project) {
                return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
            }
            if (!project.miembros.includes(userId)) {
                return res.status(403).json({ mensaje: 'No tienes acceso a este proyecto' });
            }

            await projectsCollection.updateOne(
                { _id: project._id },
                { $push: { columns: columnName } }
            );

            res.json({ mensaje: 'Columna añadida' });
        });

        app.listen(PORT, () => {
            console.log(`Servidor en puerto ${PORT}`);
        });

    } catch (err) {
        console.error(err);
    }
}

main();
