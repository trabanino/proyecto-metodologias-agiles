let currentTask = null;
let isCreatingNewTask = false;
let targetColumn = null;
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('projectId');
const token = localStorage.getItem('token');
let projectMembers = [];
let isOwner = false;

if (!token) {
    window.location.href = '/login';
}

async function loadKanbanBoard() {
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

        const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`, {
            headers: {
                'Authorization': token
            }
        });
        if (!tasksResponse.ok) {
            alert('Error al obtener tareas del proyecto');
            return;
        }
        const tasks = await tasksResponse.json();

        renderKanbanBoard(tasks, project.columns);

        // Load notifications
        loadNotifications();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el tablero Kanban');
    }
}

function renderKanbanBoard(tasks, columns) {
    const board = document.querySelector('.board');
    board.innerHTML = '';

    columns.forEach(columnName => {
        const column = document.createElement('div');
        column.className = 'column';
        column.setAttribute('ondrop', 'drop(event)');
        column.setAttribute('ondragover', 'allowDrop(event)');

        column.innerHTML = `
            <h2>${columnName}</h2>
            <button class="delete-column" onclick="confirmDeleteColumn(this)">X</button>
            <button class="add-task" onclick="addTask(this)">+ Añade una tarjeta</button>
        `;

        const columnTasks = tasks.filter(task => task.status === columnName);

        columnTasks.forEach(taskData => {
            // Ensure taskData properties have default values
            const title = taskData.title || 'Sin título';
            const description = taskData.description || '';
            const urgencyClass = taskData.urgency || 'label-yellow';
            const assigneesArray = Array.isArray(taskData.assignees) ? taskData.assignees : [];
            const notes = taskData.notes || '';

            const assigneeNames = projectMembers
                .filter(member => assigneesArray.includes(member.id))
                .map(member => member.nombre);

            const task = document.createElement('div');
            task.className = `task ${urgencyClass}`;
            task.draggable = true;
            task.setAttribute('ondragstart', 'drag(event)');
            task.setAttribute('data-task-id', taskData._id);
            task.setAttribute('data-task-notes', notes);
            task.setAttribute('data-assignees', assigneesArray.join(','));

            task.innerHTML = `
                <div class="task-title">${title}</div>
                <div class="task-description">${description}</div>
                <div class="assignees">${assigneeNames.length > 0 ? 'Asignado a: ' + assigneeNames.join(', ') : ''}</div>
                <button class="edit-task" onclick="openEditModal(this)">✏️</button>
                <button class="delete-task" onclick="confirmDeleteTask(event, this)">X</button>
            `;
            column.insertBefore(task, column.querySelector('.add-task'));
        });

        board.appendChild(column);
    });
}

loadKanbanBoard();

function addTask(button) {
    isCreatingNewTask = true;
    currentTask = null;
    targetColumn = button.parentNode;
    openTaskModal();
}

function openTaskModal(column) {
    targetColumn = column || targetColumn;

    // Set default values if currentTask is null
    document.getElementById("task-title").value = currentTask ? currentTask.querySelector(".task-title").textContent.trim() : "";
    document.getElementById("task-description").value = currentTask ? currentTask.querySelector(".task-description").textContent.trim() : "";
    document.getElementById("task-notes").value = currentTask ? currentTask.getAttribute('data-task-notes') || '' : '';

    const urgencyClass = currentTask ? currentTask.className.split(" ").find(c => c.startsWith("label-")) : "label-yellow";
    document.getElementById("task-urgency").value = urgencyClass;

    // Populate assignees select
    const assigneesSelect = document.getElementById("task-assignees");
    assigneesSelect.innerHTML = '';
    projectMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.nombre;
        assigneesSelect.appendChild(option);
    });

    if (currentTask) {
        const assignedMemberIds = currentTask.getAttribute('data-assignees').split(',').filter(id => id);
        for (let option of assigneesSelect.options) {
            if (assignedMemberIds.includes(option.value)) {
                option.selected = true;
            }
        }
    }

    document.getElementById("taskModal").style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

function closeTaskModal() {
    document.getElementById("taskModal").style.display = "none";
    document.querySelector(".overlay").style.display = "none";
    currentTask = null;
    isCreatingNewTask = false;
    targetColumn = null;
}

document.querySelector(".overlay").addEventListener("click", () => {
    closeTaskModal();
    closeMembersModal();
    closeAddColumnModal();
    closeNotificationsModal();
});

function openEditModal(button) {
    currentTask = button.parentNode;
    isCreatingNewTask = false;
    targetColumn = currentTask.parentNode;
    openTaskModal();
}

async function saveTask() {
    const taskTitle = document.getElementById("task-title").value;
    const taskDescription = document.getElementById("task-description").value;
    const taskNotes = document.getElementById("task-notes").value;
    const assigneesSelect = document.getElementById("task-assignees");
    const assignees = Array.from(assigneesSelect.selectedOptions).map(option => option.value);
    const urgency = document.getElementById("task-urgency").value;
    const status = targetColumn.querySelector('h2').textContent;

    if (!taskTitle) {
        alert('El título de la tarea es obligatorio');
        return;
    }

    const taskData = {
        title: taskTitle,
        description: taskDescription,
        notes: taskNotes,
        assignees,
        urgency,
        status,
        projectId
    };

    try {
        if (isCreatingNewTask) {
            const response = await fetch(`/api/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(taskData)
            });
            if (!response.ok) {
                alert('Error al crear la tarea');
                return;
            }
            loadKanbanBoard();
        } else if (currentTask) {
            const taskId = currentTask.getAttribute('data-task-id');
            const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(taskData)
            });
            if (!response.ok) {
                alert('Error al actualizar la tarea');
                return;
            }
            loadKanbanBoard();
        }
        closeTaskModal();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la tarea');
    }
}

function openAddColumnModal() {
    document.getElementById("addColumnModal").style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

function closeAddColumnModal() {
    document.getElementById("addColumnModal").style.display = "none";
    document.querySelector(".overlay").style.display = "none";
}

async function addNewColumn() {
    const columnName = document.getElementById("column-name").value;
    if (columnName) {
        try {
            const response = await fetch(`/api/projects/${projectId}/columns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ columnName })
            });
            if (!response.ok) {
                alert('Error al añadir la columna');
                return;
            }
            loadKanbanBoard();
            closeAddColumnModal();
            document.getElementById("column-name").value = '';
        } catch (error) {
            console.error('Error:', error);
            alert('Error al añadir la columna');
        }
    } else {
        alert('Por favor, ingrese un nombre para el estado');
    }
}

async function confirmDeleteTask(event, button) {
    event.stopPropagation();
    const confirmed = confirm("¿Estás seguro que deseas eliminar esta tarea?");
    if (confirmed) {
        const taskId = button.parentElement.getAttribute('data-task-id');
        try {
            const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token
                }
            });
            if (!response.ok) {
                alert('Error al eliminar la tarea');
                return;
            }
            loadKanbanBoard();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar la tarea');
        }
    }
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    const taskId = event.target.getAttribute("data-task-id");
    event.dataTransfer.setData("task-id", taskId);
    event.dataTransfer.setData("source-column", event.target.parentNode.querySelector('h2').textContent);
}

async function drop(event) {
    event.preventDefault();
    const targetColumn = event.target.closest(".column");
    if (targetColumn) {
        const taskId = event.dataTransfer.getData("task-id");
        const sourceColumnName = event.dataTransfer.getData("source-column");
        const newStatus = targetColumn.querySelector('h2').textContent;

        // Find the task element being dragged
        const taskElement = document.querySelector(`[data-task-id='${taskId}']`);
        if (!taskElement) {
            console.error('Task element not found');
            return;
        }

        if (sourceColumnName !== newStatus) {
            try {
                const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                if (!response.ok) {
                    alert('Error al actualizar el estado de la tarea');
                    return;
                }
                // Move the task element to the new column
                targetColumn.insertBefore(taskElement, targetColumn.querySelector('.add-task'));
                taskElement.setAttribute('data-status', newStatus);
            } catch (error) {
                console.error('Error:', error);
                alert('Error al actualizar el estado de la tarea');
            }
        } else {
            // Move the task element to the new position within the same column
            targetColumn.insertBefore(taskElement, event.target.closest('.task'));
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

function addTaskFromSidebar() {
    const columnNames = Array.from(document.querySelectorAll('.column h2')).map(h2 => h2.textContent);
    const columnName = prompt('Seleccione la columna para añadir la tarea:\n' + columnNames.join('\n'));
    const targetColumn = Array.from(document.querySelectorAll('.column')).find(column => column.querySelector('h2').textContent === columnName);
    if (targetColumn) {
        isCreatingNewTask = true;
        currentTask = null;
        openTaskModal(targetColumn);
    } else {
        alert('Columna no encontrada');
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

function confirmDeleteColumn(button) {
    const confirmed = confirm("¿Estás seguro que deseas eliminar esta columna y sus tareas?");
    if (confirmed) {
        const columnName = button.parentNode.querySelector('h2').textContent;
        deleteColumn(columnName);
    }
}

async function deleteColumn(columnName) {
    try {
        // Remove tasks associated with the column
        await fetch(`/api/projects/${projectId}/tasks`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ status: columnName })
        });

        // Remove the column from the project
        await fetch(`/api/projects/${projectId}/columns`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ columnName })
        });

        loadKanbanBoard();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la columna');
    }
}

function confirmDeleteProject() {
    const projectName = document.getElementById('projectName').textContent;
    const inputName = prompt(`ESTAS A PUNTO DE ELIMINAR EL PROYECTO \nPara confirmar, por favor ingresa el nombre del proyecto: "${projectName}"`);
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
