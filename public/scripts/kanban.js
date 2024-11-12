let currentTask = null;
let isCreatingNewTask = false;
let targetColumn = null;
let projectId = null;
let token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('projectId');

    if (!token) {
        window.location.href = 'login.html';
    }

    loadBoard();
});

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
                <div class="assignees">${task.assignees.join(', ')}</div>
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

function addNewColumn() {
    const columnName = prompt("Ingrese el nombre del nuevo estado:");
    if (columnName) {
        // Save column to server
        // Then reload the board
    }
}

function openTaskModal() {
    document.getElementById("task-title").value = currentTask ? currentTask.querySelector(".task-title").textContent.trim() : "";
    document.getElementById("task-description").value = currentTask ? currentTask.querySelector(".task-description").textContent.trim() : "";
    document.getElementById("task-assignees").value = currentTask ? currentTask.querySelector(".assignees").textContent.trim() : "";
    document.getElementById("task-urgency").value = currentTask ? currentTask.className.split(" ").find(c => c.startsWith("label-")) : "label-yellow";

    document.querySelector(".modal").style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

function saveTask() {
    const taskTitle = document.getElementById("task-title").value;
    const taskDescription = document.getElementById("task-description").value;
    const assignees = document.getElementById("task-assignees").value.split(',').map(a => a.trim()).filter(a => a);
    const urgency = document.getElementById("task-urgency").value;

    if (!taskTitle) {
        alert('El título de la tarea es obligatorio');
        return;
    }

    // Save task to server
    // Then reload the board

    closeTaskModal();
}

function openEditModal(button) {
    currentTask = button.parentNode;
    isCreatingNewTask = false;
    openTaskModal();
}

function confirmDeleteTask(event, button) {
    event.stopPropagation();
    const confirmed = confirm("¿Estás seguro que deseas eliminar esta tarea?");
    if (confirmed) {
        // Delete task from server
        // Then reload the board
    }
}

function confirmDeleteColumn(button) {
    const confirmed = confirm("¿Estás seguro que deseas eliminar toda esta columna y sus tareas?");
    if (confirmed) {
        // Delete column from server
        // Then reload the board
    }
}

function closeTaskModal() {
    document.querySelector(".modal").style.display = "none";
    document.querySelector(".overlay").style.display = "none";
    currentTask = null;
    isCreatingNewTask = false;
    targetColumn = null;
}

document.querySelector(".overlay").addEventListener("click", closeTaskModal);

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    const taskId = event.target.getAttribute("data-task-id");
    event.dataTransfer.setData("text/plain", event.target.outerHTML);
    event.dataTransfer.setData("task-id", taskId);
}

function drop(event) {
    event.preventDefault();
    const targetElement = event.target.closest(".column");
    if (targetElement) {
        // Update task's column on server
        // Then reload the board
    }
}
