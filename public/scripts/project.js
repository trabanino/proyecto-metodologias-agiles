function goBack() {
    window.history.back();
}

function openObjectivesModal(columnId) {
    document.getElementById("objectivesModal").style.display = "flex";
    document.getElementById("objectiveColumn").value = columnId;
}

function closeObjectivesModal() {
    document.getElementById("objectivesModal").style.display = "none";
}

function redirectToSprint() {
    window.location.href = "sprint.html";
}

function saveObjective(event) {
    event.preventDefault();
    const columnId = document.getElementById("objectiveColumn").value;
    const title = document.getElementById("objectiveTitle").value;
    const description = document.getElementById("objectiveDescription").value;

    const objectiveItem = document.createElement("div");
    objectiveItem.className = "objective-item";
    objectiveItem.innerHTML = `<strong>${title}</strong><p>${description}</p>`;

    document.getElementById(`${columnId}List`).appendChild(objectiveItem);

    closeObjectivesModal();
    document.getElementById("objectivesForm").reset();
}

function addTask(columnId) {
    const taskItem = document.createElement("div");
    taskItem.className = "task-item";
    taskItem.innerHTML = `<strong>Nueva Tarea</strong><p>Descripción de la tarea</p>`;

    document.getElementById(`${columnId}List`).appendChild(taskItem);
}
