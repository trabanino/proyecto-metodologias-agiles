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

// Mostrar modal para crear proyecto
addButton.addEventListener('click', () => {
    modal.style.display = 'flex';
    projectForm.reset();
    currentProjectId = null; // Para saber si es creación o edición
    document.getElementById('modal-title').textContent = 'Crear Proyecto';
});

// Cerrar modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Cerrar modal de detalles
detailClose.addEventListener('click', () => {
    detailModal.style.display = 'none';
});

// Al guardar un proyecto
projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const projectName = projectNameInput.value;
    const projectDescription = projectDescriptionInput.value;

    if (currentProjectId) {
        // Si es edición, actualizar el proyecto
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const projectIndex = projects.findIndex(p => p.id === currentProjectId);
        projects[projectIndex] = {
            ...projects[projectIndex],
            name: projectName,
            description: projectDescription
        };
        localStorage.setItem('projects', JSON.stringify(projects));
    } else {
        // Si es creación, agregar un nuevo proyecto
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const newProject = {
            id: Date.now(),
            name: projectName,
            description: projectDescription
        };
        projects.push(newProject);
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    modal.style.display = 'none';
    loadProjects(); // Recargar los proyectos en la vista
});

// Cargar proyectos desde el localStorage
function loadProjects() {
    projectGrid.innerHTML = '';
    const projects = JSON.parse(localStorage.getItem('projects')) || [];

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.classList.add('project-card');
        projectCard.innerHTML = `
            <div class="project-icon"></div>
            <h2>${project.name}</h2>
            <p>${project.description}</p>
        `;
        projectCard.addEventListener('click', () => {
            showProjectDetails(project.id);
        });
        projectGrid.appendChild(projectCard);
    });
}

// Mostrar los detalles del proyecto
function showProjectDetails(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const project = projects.find(p => p.id === projectId);

    if (project) {
        document.getElementById('detailProjectTitle').textContent = project.name;
        document.getElementById('detailProjectDescription').textContent = project.description;
        detailModal.style.display = 'flex';
        currentProjectId = project.id;
    }
}

// Eliminar proyecto
deleteButton.addEventListener('click', () => {
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const updatedProjects = projects.filter(p => p.id !== currentProjectId);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    detailModal.style.display = 'none';
    loadProjects();
});

// Cargar los proyectos al inicio
document.addEventListener('DOMContentLoaded', loadProjects);
