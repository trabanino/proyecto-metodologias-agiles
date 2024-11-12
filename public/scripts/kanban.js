let currentTask = null;
let isCreatingNewTask = false;
let targetColumn = null;
let projectId = null;
let token = localStorage.getItem('token');
let projectMembers = [];
let membersMap = {};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('projectId');

    if (!token) {
        window.location.href = 'login.html';
    }

    loadProjectDetails();
    loadProjectMembers();
    loadBoard();

    document.getElementById('addColumnBtn').addEventListener('click', addNewColumn);
    document.getElementById('manageMembersBtn').addEventListener('click', openMembersModal);
    document.getElementById('projectSettingsBtn').addEventListener('click', openSettingsModal);
    document.getElementById('setDeadlineBtn').addEventListener('click', openDeadlineModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

async function loadProjectDetails() {
    const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
            'Authorization': token
        }
    });

    if (response.ok) {
        const project = await response.json();
        document.getElementById('projectTitle').textContent = project.nombre;
        document.getElementById('projectName').value = project.nombre;
        document.getElementById('projectDescription').value = project.descripcion;
        document.getElementById('deadline').value = project.deadline ? project.deadline.split('T')[0] : '';
    } else {
        alert('Error al cargar detalles del proyecto');
    }
}

async function loadProjectMembers() {
    const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
            'Authorization': token
        }
    });

    if (response.ok) {
        const project = await response.json();
        projectMembers = project.miembros;
        await loadMembersInfo();
        displayMembers();
        loadInvitations();
    } else {
        alert('Error al cargar miembros del proyecto');
    }
}

async function loadMembersInfo() {
    for (const memberId of projectMembers) {
        const response = await fetch(`/api/users/${memberId}`, {
            headers: {
                'Authorization': token
            }
        });

        if (response.ok) {
            const user = await response.json();
            membersMap[memberId] = `${user.nombre} (${user.correo})`;
        } else {
            membersMap[memberId] = 'Desconocido';
        }
    }
}

function displayMembers() {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = '';
    for (const [memberId, memberName] of Object.entries(membersMap)) {
        const li = document.createElement('li');
        li.textContent = memberName;
        membersList.appendChild(li);
    }
}

async function loadInvitations() {
    const response = await fetch(`/api/projects/${projectId}/invitations`, {
        headers: {
            'Authorization': token
        }
    });

    if (response.ok) {
        const invitations = await response.json();
        const invitationsList = document.getElementById('invitationsList');
        invitationsList.innerHTML = '';
        invitations.forEach(invitation => {
            const li = document.createElement('li');
            li.textContent = `${invitation.nombre} (${invitation.correo})`;
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.addEventListener('click', () => cancelInvitation(invitation._id));
            li.appendChild(cancelBtn);
            invitationsList.appendChild(li);
        });
    }
}

async function cancelInvitation(userId) {
    const response = await fetch(`/api/projects/${projectId}/invitations/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': token
        }
    });

    if (response.ok) {
        alert('Invitación cancelada');
        loadInvitations();
    } else {
        alert('Error al cancelar la invitación');
    }
}

async function loadBoard() {
    const response = await fetch(`/api/projects/${projectId}/kanban`, {
        headers: {
            'Authorization': token
        }
    });

    if (!response.ok) {
        alert('Error al cargar el tablero Kanban');
        return;
    }

    const boardData = await response.json();
    renderBoard(boardData);
}

function renderBoard(boardData) {
    const board = document.querySelector('.board');
    board.innerHTML = '';

    boardData.columns.forEach(column => {
        const columnElement = document.createElement('div');
        columnElement.className = 'column';
        columnElement.setAttribute('ondrop', 'drop(event)');
        columnElement.setAttribute('ondragover', 'allowDrop(event)');
        columnElement.dataset.columnId = column.id;
        columnElement.innerHTML = `
            <h2>${column.title}</h2>
            <button class="delete-column" onclick="confirmDeleteColumn(this)">X</button>
            <button class="add-task" onclick="addTask(this)">+ Añade una tarjeta</button>
        `;

        column.tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task ${task.label}`;
            taskElement.draggable = true;
            taskElement.setAttribute('ondragstart', 'drag(event)');
            taskElement.setAttribute('data-task-id', task.id);
            taskElement.innerHTML = `
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description}</div>
                <div class="assignees">${task.assignees.map(id => membersMap[id] || 'Desconocido').join(', ')}</div>
                <button class="edit-task" onclick="openEditModal(this)">✏️</button>
                <button class="delete-task" onclick="confirmDeleteTask(event, this)">X</button>
            `;
            columnElement.insertBefore(taskElement, columnElement.querySelector('.add-task'));
        });

        board.appendChild(columnElement);
    });
}

function addTask(button) {
    isCreatingNewTask = true;
    currentTask = null;
    targetColumn = button.parentNode;
    openTaskModal();
}

async function addNewColumn() {
    const columnName = prompt("Ingrese el nombre del nuevo estado:");
    if (columnName) {
        const response = await fetch(`/api/projects/${projectId}/kanban/columns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ title: columnName })
        });

        if (response.ok) {
            loadBoard();
        } else {
            alert('Error al añadir columna');
        }
    }
}

function openTaskModal() {
    document.getElementById("task-title").value = currentTask ? currentTask.querySelector(".task-title").textContent.trim() : "";
    document.getElementById("task-description").value = currentTask ? currentTask.querySelector(".task-description").textContent.trim() : "";
    document.getElementById("task-urgency").value = currentTask ? currentTask.className.split(" ").find(c => c.startsWith("label-")) : "label-yellow";

    const assigneesSelect = document.getElementById("task-assignees");
    assigneesSelect.innerHTML = '';
    for (const [memberId, memberName] of Object.entries(membersMap)) {
        const option = document.createElement('option');
        option.value = memberId;
        option.textContent = memberName;
        assigneesSelect.appendChild(option);
    }

    if (currentTask) {
        const assigneesText = currentTask.querySelector(".assignees").textContent.trim();
        const assigneesArray = assigneesText ? assigneesText.split(',').map(s => s.trim()) : [];
        assigneesArray.forEach(assignee => {
            for (let option of assigneesSelect.options) {
                if (option.textContent === assignee) {
                    option.selected = true;
                }
            }
        });
    }

    document.getElementById('taskModal').style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

async function saveTask() {
    const taskTitle = document.getElementById("task-title").value;
    const taskDescription = document.getElementById("task-description").value;
    const assigneesSelect = document.getElementById("task-assignees");
    const assignees = Array.from(assigneesSelect.selectedOptions).map(option => option.value);
    const urgency = document.getElementById("task-urgency").value;

    if (!taskTitle) {
        alert('El título de la tarea es obligatorio');
        return;
    }

    if (isCreatingNewTask) {
        const columnId = targetColumn.dataset.columnId;
        const response = await fetch(`/api/projects/${projectId}/kanban/columns/${columnId}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                title: taskTitle,
                description: taskDescription,
                assignees,
                label: urgency
            })
        });

        if (response.ok) {
            loadBoard();
        } else {
            alert('Error al añadir tarea');
        }
    } else if (currentTask) {
        const taskId = currentTask.dataset.taskId;
        const response = await fetch(`/api/projects/${projectId}/kanban/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                title: taskTitle,
                description: taskDescription,
                assignees,
                label: urgency
            })
        });

        if (response.ok) {
            loadBoard();
        } else {
            alert('Error al actualizar tarea');
        }
    }

    closeModal('taskModal');
}

function openEditModal(button) {
    currentTask = button.parentNode;
    isCreatingNewTask = false;
    openTaskModal();
}

async function confirmDeleteTask(event, button) {
    event.stopPropagation();
    const confirmed = confirm("¿Estás seguro que deseas eliminar esta tarea?");
    if (confirmed) {
        const taskId = button.parentNode.dataset.taskId;
        const response = await fetch(`/api/projects/${projectId}/kanban/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });

        if (response.ok) {
            loadBoard();
        } else {
            alert('Error al eliminar tarea');
        }
    }
}

async function confirmDeleteColumn(button) {
    const confirmed = confirm("¿Estás seguro que deseas eliminar toda esta columna y sus tareas?");
    if (confirmed) {
        const columnId = button.parentNode.dataset.columnId;
        const response = await fetch(`/api/projects/${projectId}/kanban/columns/${columnId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });

        if (response.ok) {
            loadBoard();
        } else {
            alert('Error al eliminar columna');
        }
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
    document.querySelector(".overlay").style.display = "none";
    currentTask = null;
    isCreatingNewTask = false;
    targetColumn = null;
}

document.querySelector(".overlay").addEventListener("click", () => {
    closeModal('taskModal');
    closeModal('membersModal');
    closeModal('settingsModal');
    closeModal('deadlineModal');
});

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    const taskId = event.target.getAttribute("data-task-id");
    event.dataTransfer.setData("text/plain", taskId);
}

async function drop(event) {
    event.preventDefault();
    const targetElement = event.target.closest(".column");
    if (targetElement) {
        const taskId = event.dataTransfer.getData("text/plain");
        const targetColumnId = targetElement.dataset.columnId;

        const response = await fetch(`/api/projects/${projectId}/kanban/tasks/${taskId}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ targetColumnId })
        });

        if (response.ok) {
            loadBoard();
        } else {
            alert('Error al mover tarea');
        }
    }
}

function openMembersModal() {
    document.getElementById('membersModal').style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

function openSettingsModal() {
    document.getElementById('settingsModal').style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

function openDeadlineModal() {
    document.getElementById('deadlineModal').style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

async function logout() {
    const confirmed = confirm("¿Estás seguro que deseas cerrar sesión?");
    if (confirmed) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

document.getElementById('invitarBtn').addEventListener('click', async () => {
    const email = document.getElementById('emailInvitar').value;
    if (!email) {
        alert('Por favor, ingresa un correo');
        return;
    }

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
        loadInvitations();
    } else {
        alert(resultado.mensaje || 'Error al invitar miembro');
    }
});

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const nombre = document.getElementById('projectName').value;
    const descripcion = document.getElementById('projectDescription').value;

    const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({ nombre, descripcion })
    });

    if (response.ok) {
        alert('Configuración guardada');
        loadProjectDetails();
        closeModal('settingsModal');
    } else {
        alert('Error al guardar configuración');
    }
});

document.getElementById('saveDeadlineBtn').addEventListener('click', async () => {
    const deadline = document.getElementById('deadline').value;
    if (!deadline) {
        alert('Por favor, selecciona una fecha.');
        return;
    }

    const response = await fetch(`/api/projects/${projectId}/deadline`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({ deadline })
    });

    if (response.ok) {
        alert('Fecha límite guardada');
        closeModal('deadlineModal');
    } else {
        alert('Error al guardar la fecha límite');
    }
});
