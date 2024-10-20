document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }

    const projectList = document.getElementById('projectList');
    const createProjectBtn = document.getElementById('createProjectBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const projectModal = document.getElementById('projectModal');
    const closeModal = document.querySelector('.close');
    const projectForm = document.getElementById('projectForm');

    // cargar proyectos del usuario
    async function loadProjects() {
        const response = await fetch('/api/projects', {
            headers: {
                'Authorization': token
            }
        });
        const projects = await response.json();

        projectList.innerHTML = '';

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.classList.add('project-card');
            projectCard.textContent = project.nombre;
            projectCard.addEventListener('click', () => {
                window.location.href = `/proyecto/${project._id}`;
            });
            projectList.appendChild(projectCard);
        });
    }

    createProjectBtn.addEventListener('click', () => {
        projectModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        projectModal.style.display = 'none';
    });

    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('projectName').value;
        const descripcion = document.getElementById('projectDescription').value;

        const nuevoProyecto = {
            nombre,
            descripcion
        };

        await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(nuevoProyecto)
        });

        projectModal.style.display = 'none';
        loadProjects();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });

    loadProjects();
});
