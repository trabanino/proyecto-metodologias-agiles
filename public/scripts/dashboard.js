const addButton = document.querySelector('.add-btn');
const projectGrid = document.querySelector('.project-grid');
const modal = document.getElementById('projectModal');
const closeModal = modal.querySelector('.close');
const projectForm = document.getElementById('projectForm');
const projectNameInput = document.getElementById('projectName');
const projectDescriptionInput = document.getElementById('projectDescription');
const projectMembersInput = document.getElementById('projectMembers');
const projectTypeSelect = document.getElementById('projectType');

const joinProjectModal = document.getElementById('joinProjectModal');
const joinProjectForm = document.getElementById('joinProjectForm');
const joinModalClose = joinProjectModal.querySelector('.close');
const joinProjectBtn = document.getElementById('joinProjectBtn');

const notificationsBtn = document.getElementById('notificationsBtn');
const notificationsSection = document.getElementById('notificationsSection');
const notificationsList = document.getElementById('notificationsList');

let currentProjectId = null;

addButton.addEventListener('click', () => {
    modal.style.display = 'flex';
    projectForm.reset();
    currentProjectId = null;
    document.getElementById('modal-title').textContent = 'Crear Proyecto';
});

joinProjectBtn.addEventListener('click', () => {
    joinProjectModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

joinModalClose.addEventListener('click', () => {
    joinProjectModal.style.display = 'none';
});

notificationsBtn.addEventListener('click', () => {
    if (notificationsSection.style.display === 'none') {
        notificationsSection.style.display = 'block';
        loadNotifications();
    } else {
        notificationsSection.style.display = 'none';
    }
});

const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

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
        `;
        projectGrid.appendChild(noProjectsMessage);

        document.getElementById('createProjectBtn').addEventListener('click', () => {
            modal.style.display = 'flex';
            projectForm.reset();
            currentProjectId = null;
            document.getElementById('modal-title').textContent = 'Crear Proyecto';
        });
    } else {
        projects.forEach(async project => {
            const projectCard = document.createElement('div');
            projectCard.classList.add('project-card');
            let miembrosNombres = await getProjectMembers(project.miembros);
            projectCard.innerHTML = `
                <div class="project-icon"></div>
                <h2>${project.nombre}</h2>
                <p>${project.descripcion}</p>
                <p><strong>Tipo:</strong> ${project.tipo}</p>
                <p><strong>Miembros:</strong> ${miembrosNombres.join(', ')}</p>
            `;
            projectCard.addEventListener('click', () => {
                window.location.href = `/proyecto/${project._id}`;
            });
            projectGrid.appendChild(projectCard);
        });
    }
}

async function getProjectMembers(memberIds) {
    const maxMembers = 3;
    let miembrosNombres = [];
    for (let i = 0; i < Math.min(memberIds.length, maxMembers); i++) {
        const memberId = memberIds[i];
        const response = await fetch(`/api/users/${memberId}`, {
            headers: {
                'Authorization': token
            }
        });
        if (response.ok) {
            const user = await response.json();
            miembrosNombres.push(user.nombre);
        } else {
            miembrosNombres.push('Desconocido');
        }
    }
    if (memberIds.length > maxMembers) {
        miembrosNombres.push(`y ${memberIds.length - maxMembers} más`);
    }
    return miembrosNombres;
}

projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const projectName = projectNameInput.value;
    const projectDescription = projectDescriptionInput.value;
    const projectMembers = projectMembersInput.value.split(',').map(email => email.trim()).filter(email => email);
    const projectType = projectTypeSelect.value;

    const newProject = {
        nombre: projectName,
        descripcion: projectDescription,
        miembrosInvitados: projectMembers,
        tipo: projectType
    };

    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify(newProject)
    });

    if (response.ok) {
        modal.style.display = 'none';
        loadProjects();
    } else {
        const result = await response.json();
        alert(result.mensaje || 'Error al crear proyecto');
    }
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
    loadInvitations();
    loadProjects();
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
            li.textContent = `Invitación al proyecto: ${invitation.nombre}`;

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

async function loadNotifications() {
    notificationsList.innerHTML = '<li>No tienes nuevas notificaciones.</li>';
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
        alert(resultado.mensaje || 'Error al responder a la invitación');
    }
}
