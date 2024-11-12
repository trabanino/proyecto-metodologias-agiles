let currentTask = null;
let isCreatingNewTask = false;
let targetColumn = null;
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('projectId');
const token = localStorage.getItem('token');

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
            const task = document.createElement('div');
            task.className = `task ${taskData.urgency}`;
            task.draggable = true;
            task.setAttribute('ondragstart', 'drag(event)');
            task.setAttribute('data-task-id', taskData._id);
            task.innerHTML = `
                <div class="task-title">${taskData.title}</div>
                <div class="task-description">${taskData.description}</div>
                <div class="assignees">${taskData.assignees ? 'Asignado a: ' + taskData.assignees.join(', ') : ''}</div>
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
    document.getElementById("task-title").value = currentTask ? currentTask.querySelector(".task-title").textContent.trim() : "";
    document.getElementById("task-description").value = currentTask ? currentTask.querySelector(".task-description").textContent.trim() : "";
    document.getElementById("task-assignees").value = currentTask ? currentTask.querySelector(".assignees").textContent.replace("Asignado a: ", "").trim() : "";
    document.getElementById("task-urgency").value = currentTask ? currentTask.className.split(" ").find(c => c.startsWith("label-")) : "label-yellow";

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
    const assignees = document.getElementById("task-assignees").value.split(',').map(a => a.trim()).filter(a => a);
    const urgency = document.getElementById("task-urgency").value;
    const status = targetColumn.querySelector('h2').textContent;

    if (!taskTitle) {
        alert('El título de la tarea es obligatorio');
        return;
    }

    const taskData = {
        title: taskTitle,
        description: taskDescription,
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

async function addNewColumn() {
    const columnName = prompt("Ingrese el nombre del nuevo estado:");
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
        } catch (error) {
            console.error('Error:', error);
            alert('Error al añadir la columna');
        }
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
    const targetElement = event.target.closest(".column");
    if (targetElement) {
        const taskId = event.dataTransfer.getData("task-id");
        const sourceColumn = event.dataTransfer.getData("source-column");
        const newStatus = targetElement.querySelector('h2').textContent;

        if (sourceColumn !== newStatus) {
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
                loadKanbanBoard();
            } catch (error) {
                console.error('Error:', error);
                alert('Error al actualizar el estado de la tarea');
            }
        }
    }
}

function goBack() {
    window.location.href = '/dashboard';
}

function openNotifications() {
    alert('No hay notificaciones nuevas');
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
