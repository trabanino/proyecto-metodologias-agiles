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

        // sirve la pagina principal cuando se accede a la raiz
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        app.get('/home', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        app.get('/login', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'login.html'));
        });

        app.get('/register', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'register.html'))
        });

        app.get('/proyectos', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'proyectos.html'));
        });

        // registrar un nuevo usuario
        app.post('/api/register', async (req, res) => {
            const { nombre, correo, contraseña, rol } = req.body;
            const usuarioExistente = await usersCollection.findOne({ correo });
            if (usuarioExistente) {
                return res.status(400).json({ mensaje: 'El correo ya esta registrado' });
            }
            const contraseñaHash = await bcrypt.hash(contraseña, 10);
            const nuevoUsuario = { nombre, correo, contraseña: contraseñaHash, rol: rol || 'miembro' };
            await usersCollection.insertOne(nuevoUsuario);
            res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
        });

        // iniciar sesion
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
            const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, jwtSecret, { expiresIn: '1h' });
            res.json({ mensaje: 'Inicio de sesion exitoso', token });
        });

        // rutas protegidas con verificarToken
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
                res.status(400).json({ mensaje: 'Token invalido' });
            }
        }

        app.get('/api/projects', verificarToken, async (req, res) => {
            const projects = await projectsCollection.find({}).toArray();
            res.send(projects);
        });

        // obtener un proyecto por id
        app.get('/api/projects/:id', async (req, res) => {
            const projectId = req.params.id;
            const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) });
            res.send(project);
        });

        // crear nuevo proyecto
        app.post('/api/projects', async (req, res) => {
            const result = await projectsCollection.insertOne(req.body);
            res.send(result);
        });

        // eliminar proyecto
        app.delete('/api/projects/:id', async (req, res) => {
            const projectId = req.params.id;
            const result = await projectsCollection.deleteOne({ _id: new ObjectId(projectId) });
            res.send(result);
        });

        app.listen(PORT, () => {
            console.log(`Servidor en puerto ${PORT}`);
        });

    } catch (err) {
        console.error(err);
    }
}

main();