const addButton = document.querySelector('.add-btn');
const projectGrid = document.querySelector('.project-grid');
const modal = document.getElementById('projectModal');
const closeModal = document.querySelector('.close');
const projectForm = document.getElementById('projectForm');
const projectNameInput = document.getElementById('projectName');
const projectDescriptionInput = document.getElementById('projectDescription');
const detailModal = document.getElementById('projectDetailsModal');
const detailClose = detailModal.querySelector('.close');
const deleteButton = detailModal.querySelector('.delete-btn');
let currentProjectId = null;

addButton.addEventListener('click', () => {
    modal.style.display = 'flex';
    projectForm.reset();
    currentProjectId = null;
    document.getElementById('modal-title').textContent = 'Crear Proyecto';
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

detailClose.addEventListener('click', () => {
    detailModal.style.display = 'none';
});

const token = localStorage.getItem('token');

async function loadProjects() {
    const response = await fetch('/api/projects', {
        headers: {
            'Authorization': token
        }
    });
    const projects = await response.json();

    projectGrid.innerHTML = '';

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.classList.add('project-card');
        projectCard.innerHTML = `
            <div class="project-icon"></div>
            <h2>${project.nombre}</h2>
            <p>${project.descripcion}</p>
        `;
        projectCard.addEventListener('click', () => {
            window.location.href = `/proyecto/${project._id}`;
        });
        projectGrid.appendChild(projectCard);
    });
}

projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const projectName = projectNameInput.value;
    const projectDescription = projectDescriptionInput.value;

    const newProject = {
        nombre: projectName,
        descripcion: projectDescription
    };

    await fetch('/api/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify(newProject)
    });

    modal.style.display = 'none';
    loadProjects();
});

async function showProjectDetails(projectId) {
    const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
            'Authorization': token
        }
    });
    const project = await response.json();

    if (project) {
        document.getElementById('detailProjectTitle').textContent = project.nombre;
        document.getElementById('detailProjectDescription').textContent = project.descripcion;
        detailModal.style.display = 'flex';
        currentProjectId = project._id;
    }
}

deleteButton.addEventListener('click', async () => {
    await fetch(`/api/projects/${currentProjectId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': token
        }
    });
    detailModal.style.display = 'none';
    loadProjects();
});

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = '/login';
    } else {
        loadProjects();
    }
});
