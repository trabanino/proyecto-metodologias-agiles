const addButton = document.querySelector('.add-btn');
const projectGrid = document.querySelector('.project-grid');
const modal = document.getElementById('projectModal');
const closeModal = modal.querySelector('.close');
const projectForm = document.getElementById('projectForm');
const projectNameInput = document.getElementById('projectName');
const projectDescriptionInput = document.getElementById('projectDescription');
const projectMembersInput = document.getElementById('projectMembers');
const token = localStorage.getItem('token');

addButton.addEventListener('click', () => {
    modal.style.display = 'flex';
    projectForm.reset();
    document.getElementById('modal-title').textContent = 'Crear Proyecto';
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

const joinProjectModal = document.getElementById('joinProjectModal');
const joinProjectForm = document.getElementById('joinProjectForm');
const joinModalClose = joinProjectModal.querySelector('.close');

joinModalClose.addEventListener('click', () => {
    joinProjectModal.style.display = 'none';
});

async function loadProjects() {
    const response = await fetch('/api/projects', {
        headers: {
            'Authorization': token
        }
    });
    const projects = await response.json();

    projectGrid.innerHTML = '';

    if (projects.length === 0) {
        const noProjectsMessage = document.createElement('div');
        noProjectsMessage.classList.add('no-projects-message');
        noProjectsMessage.innerHTML = `
            <p>No tienes proyectos actualmente.</p>
            <button id="createProjectBtn">Crear un nuevo proyecto</button>
            <button id="joinProjectBtn">Unirse a un proyecto existente</button>
        `;
        projectGrid.appendChild(noProjectsMessage);

        document.getElementById('createProjectBtn').addEventListener('click', () => {
            modal.style.display = 'flex';
            projectForm.reset();
            document.getElementById('modal-title').textContent = 'Crear Proyecto';
        });

        document.getElementById('joinProjectBtn').addEventListener('click', () => {
            joinProjectModal.style.display = 'flex';
        });
    } else {
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.classList.add('project-card');
            projectCard.innerHTML = `
                <div class="project-icon"></div>
                <h2>${project.nombre}</h2>
                <p>${project.descripcion}</p>
            `;
            projectCard.addEventListener('click', () => {
                if (project.tipo === 'kanban') {
                    window.location.href = `/kanban.html?projectId=${project._id}`;
                } else if (project.tipo === 'scrum') {
                    window.location.href = `/proyecto/${project._id}`;
                } else {
                    window.location.href = `/proyecto/${project._id}`;
                }
            });
            projectGrid.appendChild(projectCard);
        });
    }
}

projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const projectName = projectNameInput.value;
    const projectDescription = projectDescriptionInput.value;
    const projectMembers = projectMembersInput.value.split(',').map(email => email.trim()).filter(email => email);
    const projectType = document.getElementById('projectType').value;

    const newProject = {
        nombre: projectName,
        descripcion: projectDescription,
        miembrosInvitados: projectMembers,
        tipo: projectType
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

joinProjectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const projectCode = document.getElementById('projectCode').value;

    const response = await fetch('/api/projects/join', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({ projectCode })
    });

    const result = await response.json();

    if (response.ok) {
        joinProjectModal.style.display = 'none';
        loadProjects();
    } else {
        alert(result.mensaje || 'Error al unirse al proyecto');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = '/login';
    } else {
        loadInvitations();
        loadProjects();
    }
});

const invitationsSection = document.getElementById('invitationsSection');
const invitationsList = document.getElementById('invitationsList');

async function loadInvitations() {
    const response = await fetch('/api/invites', {
        headers: {
            'Authorization': token
        }
    });
    const invitations = await response.json();

    if (invitations.length > 0) {
        invitationsSection.style.display = 'block';
        invitationsList.innerHTML = '';
        invitations.forEach(invitation => {
            const li = document.createElement('li');
            li.textContent = `Invitacion al proyecto: ${invitation.nombre}`;

            const acceptBtn = document.createElement('button');
            acceptBtn.textContent = 'Aceptar';
            acceptBtn.addEventListener('click', () => respondInvitation(invitation._id, true));

            const declineBtn = document.createElement('button');
            declineBtn.textContent = 'Rechazar';
            declineBtn.addEventListener('click', () => respondInvitation(invitation._id, false));

            li.appendChild(acceptBtn);
            li.appendChild(declineBtn);
            invitationsList.appendChild(li);
        });
    } else {
        invitationsSection.style.display = 'none';
    }
}

async function respondInvitation(projectId, accept) {
    const endpoint = accept ? `/api/invites/${projectId}/accept` : `/api/invites/${projectId}/decline`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': token
        }
    });

    const resultado = await response.json();
    if (response.ok) {
        alert(resultado.mensaje);
        loadInvitations();
        loadProjects();
    } else {
        alert(resultado.mensaje || 'Error al responder a la invitacion');
    }
}
