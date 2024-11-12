let currentUserStory = null;
let isCreatingNewUserStory = false;
let targetSprint = null;
const token = localStorage.getItem('token');
let projectMembers = [];
let isOwner = false;

if (!token) {
    window.location.href = '/login';
}

// Extract projectId from the URL path
const projectId = window.location.pathname.split('/').pop();

async function loadProjectView() {
    try {
        const projectResponse = await fetch(`/api/projects/${projectId}`, {
            headers: {
                'Authorization': token
            }
        });
        if (!projectResponse.ok) {
            alert('Error al obtener detalles del proyecto');
            return;
        }
        const project = await projectResponse.json();
        document.getElementById('projectName').textContent = project.nombre;

        // Check if the user is the owner
        const userId = parseJwt(token).id;
        isOwner = project.owner === userId;

        // Show delete project button if owner
        if (isOwner) {
            document.getElementById('deleteProjectBtn').style.display = 'block';
        }

        // Load project members
        projectMembers = [];
        for (const miembroId of project.miembros) {
            const usuarioResponse = await fetch(`/api/users/${miembroId}`, {
                headers: {
                    'Authorization': token
                }
            });
            if (!usuarioResponse.ok) {
                console.error('Error fetching user:', miembroId);
                continue;
            }
            const usuario = await usuarioResponse.json();
            projectMembers.push({ id: usuario._id, nombre: usuario.nombre });
        }

        // Load sprints
        const sprintsResponse = await fetch(`/api/projects/${projectId}/sprints`, {
            headers: {
                'Authorization': token
            }
        });
        if (!sprintsResponse.ok) {
            alert('Error al obtener sprints del proyecto');
            return;
        }
        const sprints = await sprintsResponse.json();

        renderSprints(sprints);

        // Load notifications
        loadNotifications();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la vista del proyecto');
    }
}

function renderSprints(sprints) {
    const sprintsContainer = document.querySelector('.sprints');
    sprintsContainer.innerHTML = '';

    sprints.forEach(sprint => {
        const sprintElement = document.createElement('div');
        sprintElement.className = 'sprint';

        sprintElement.innerHTML = `
            <h2>${sprint.name}</h2>
            <p>Inicio: ${new Date(sprint.startDate).toLocaleDateString()}</p>
            <p>Fin: ${new Date(sprint.endDate).toLocaleDateString()}</p>
            <button class="add-user-story" onclick="addUserStory(this, '${sprint._id}')">+ Añadir User Story</button>
        `;

        const userStoriesContainer = document.createElement('div');
        userStoriesContainer.className = 'user-stories';

        sprint.userStories.forEach(userStory => {
            const userStoryElement = document.createElement('div');
            userStoryElement.className = 'user-story';
            userStoryElement.setAttribute('data-user-story-id', userStory._id);
            userStoryElement.innerHTML = `
                <h3>${userStory.title}</h3>
                <p>${userStory.description}</p>
                <p>Prioridad: ${userStory.priority}</p>
                <button class="edit-user-story" onclick="openEditUserStoryModal('${sprint._id}', '${userStory._id}')">✏️</button>
                <button class="delete-user-story" onclick="confirmDeleteUserStory('${sprint._id}', '${userStory._id}')">🗑️</button>
            `;
            userStoriesContainer.appendChild(userStoryElement);
        });

        sprintElement.appendChild(userStoriesContainer);
        sprintsContainer.appendChild(sprintElement);
    });
}

loadProjectView();

function openAddSprintModal() {
    document.getElementById("addSprintModal").style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

function closeAddSprintModal() {
    document.getElementById("addSprintModal").style.display = "none";
    document.querySelector(".overlay").style.display = "none";
}

async function addNewSprint() {
    const name = document.getElementById("sprint-name").value;
    const startDate = document.getElementById("sprint-start-date").value;
    const endDate = document.getElementById("sprint-end-date").value;

    if (!name || !startDate || !endDate) {
        alert('Todos los campos son obligatorios');
        return;
    }

    try {
        const response = await fetch(`/api/projects/${projectId}/sprints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ name, startDate, endDate })
        });
        if (!response.ok) {
            alert('Error al añadir el sprint');
            return;
        }
        loadProjectView();
        closeAddSprintModal();
        document.getElementById("sprint-name").value = '';
        document.getElementById("sprint-start-date").value = '';
        document.getElementById("sprint-end-date").value = '';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al añadir el sprint');
    }
}

function addUserStory(button, sprintId) {
    isCreatingNewUserStory = true;
    currentUserStory = null;
    targetSprint = sprintId;
    openUserStoryModal();
}

function openUserStoryModal() {
    // Set default values
    document.getElementById("user-story-title").value = currentUserStory ? currentUserStory.title : "";
    document.getElementById("user-story-description").value = currentUserStory ? currentUserStory.description : "";
    document.getElementById("user-story-priority").value = currentUserStory ? currentUserStory.priority : "media";

    // Populate assignees select
    const assigneesSelect = document.getElementById("user-story-assignees");
    assigneesSelect.innerHTML = '';
    projectMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.nombre;
        assigneesSelect.appendChild(option);
    });

    if (currentUserStory) {
        const assignedMemberIds = currentUserStory.assignees || [];
        for (let option of assigneesSelect.options) {
            if (assignedMemberIds.includes(option.value)) {
                option.selected = true;
            }
        }
    }

    document.getElementById("addUserStoryModal").style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

function closeUserStoryModal() {
    document.getElementById("addUserStoryModal").style.display = "none";
    document.querySelector(".overlay").style.display = "none";
    currentUserStory = null;
    isCreatingNewUserStory = false;
    targetSprint = null;
}

async function saveUserStory() {
    const title = document.getElementById("user-story-title").value;
    const description = document.getElementById("user-story-description").value;
    const priority = document.getElementById("user-story-priority").value;
    const assigneesSelect = document.getElementById("user-story-assignees");
    const assignees = Array.from(assigneesSelect.selectedOptions).map(option => option.value);

    if (!title || !description) {
        alert('El título y la descripción son obligatorios');
        return;
    }

    const userStoryData = {
        title,
        description,
        priority,
        assignees
    };

    try {
        if (isCreatingNewUserStory) {
            const response = await fetch(`/api/projects/${projectId}/sprints/${targetSprint}/userstories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(userStoryData)
            });
            if (!response.ok) {
                alert('Error al crear la User Story');
                return;
            }
            loadProjectView();
        } else if (currentUserStory) {
            const response = await fetch(`/api/projects/${projectId}/sprints/${targetSprint}/userstories/${currentUserStory._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(userStoryData)
            });
            if (!response.ok) {
                alert('Error al actualizar la User Story');
                return;
            }
            loadProjectView();
        }
        closeUserStoryModal();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la User Story');
    }
}

async function openEditUserStoryModal(sprintId, userStoryId) {
    targetSprint = sprintId;
    try {
        const response = await fetch(`/api/projects/${projectId}/sprints/${sprintId}/userstories/${userStoryId}`, {
            headers: {
                'Authorization': token
            }
        });
        if (!response.ok) {
            alert('Error al obtener la User Story');
            return;
        }
        currentUserStory = await response.json();
        isCreatingNewUserStory = false;
        openUserStoryModal();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la User Story');
    }
}

async function confirmDeleteUserStory(sprintId, userStoryId) {
    const confirmed = confirm("¿Estás seguro que deseas eliminar esta User Story?");
    if (confirmed) {
        try {
            const response = await fetch(`/api/projects/${projectId}/sprints/${sprintId}/userstories/${userStoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token
                }
            });
            if (!response.ok) {
                alert('Error al eliminar la User Story');
                return;
            }
            loadProjectView();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar la User Story');
        }
    }
}

function goBack() {
    window.location.href = '/dashboard';
}

function toggleNotifications() {
    const notificationsModal = document.getElementById('notificationsModal');
    if (notificationsModal.style.display === 'block') {
        closeNotificationsModal();
    } else {
        openNotificationsModal();
    }
}

function openNotificationsModal() {
    document.getElementById('notificationsModal').style.display = 'block';
    document.querySelector('.overlay').style.display = 'block';
}

function closeNotificationsModal() {
    document.getElementById('notificationsModal').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications', {
            headers: {
                'Authorization': token
            }
        });
        if (!response.ok) {
            console.error('Error fetching notifications');
            return;
        }
        const notifications = await response.json();
        const notificationsList = document.getElementById('notificationsList');
        notificationsList.innerHTML = '';
        notifications.forEach(notification => {
            const li = document.createElement('li');
            li.textContent = notification.message;
            notificationsList.appendChild(li);
        });
        const notificationCount = document.getElementById('notificationCount');
        notificationCount.textContent = notifications.length > 0 ? notifications.length : '';
    } catch (error) {
        console.error('Error:', error);
    }
}

function openMembersModal() {
    document.getElementById('membersModal').style.display = 'block';
    document.querySelector('.overlay').style.display = 'block';
    loadMembers();
}

function closeMembersModal() {
    document.getElementById('membersModal').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
}

async function loadMembers() {
    const miembrosList = document.getElementById('miembrosList');
    miembrosList.innerHTML = '';
    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            headers: {
                'Authorization': token
            }
        });
        if (!response.ok) {
            alert('Error al obtener detalles del proyecto');
            return;
        }
        const project = await response.json();
        for (const miembroId of project.miembros) {
            const usuarioResponse = await fetch(`/api/users/${miembroId}`, {
                headers: {
                    'Authorization': token
                }
            });
            if (!usuarioResponse.ok) {
                console.error('Error fetching user:', miembroId);
                continue;
            }
            const usuario = await usuarioResponse.json();
            const li = document.createElement('li');
            li.textContent = `${usuario.nombre} (${usuario.correo})`;
            if (project.owner === miembroId) {
                li.textContent += ' (Propietario)';
            }
            miembrosList.appendChild(li);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los miembros del proyecto');
    }
}

document.getElementById('invitarBtn').addEventListener('click', async () => {
    const email = document.getElementById('emailInvitar').value;
    if (!email) {
        alert('Por favor, ingresa un correo');
        return;
    }

    try {
        const response = await fetch(`/api/projects/${projectId}/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ email })
        });

        const resultado = await response.json();
        if (response.ok) {
            alert('Invitación enviada');
            document.getElementById('emailInvitar').value = '';
            loadMembers();
        } else {
            alert(resultado.mensaje || 'Error al invitar miembro');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al invitar miembro');
    }
});

function confirmDeleteProject() {
    const projectName = document.getElementById('projectName').textContent;
    const inputName = prompt(`Para confirmar, por favor ingresa el nombre del proyecto: "${projectName}"`);
    if (inputName === projectName) {
        deleteProject();
    } else {
        alert('El nombre ingresado no coincide. Operación cancelada.');
    }
}

async function deleteProject() {
    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });
        if (!response.ok) {
            alert('Error al eliminar el proyecto');
            return;
        }
        alert('Proyecto eliminado exitosamente');
        window.location.href = '/dashboard';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el proyecto');
    }
}

function parseJwt(token) {
    try {
        const base64Payload = token.split('.')[1];
        const payload = atob(base64Payload);
        return JSON.parse(payload);
    } catch (e) {
        return null;
    }
}

document.querySelector(".overlay").addEventListener("click", () => {
    closeAddSprintModal();
    closeUserStoryModal();
    closeMembersModal();
    closeNotificationsModal();
});
