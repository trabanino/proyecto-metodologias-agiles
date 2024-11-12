let currentTask = null;
let isCreatingNewTask = false;
let targetColumn = null;

function addTask(button) {
    isCreatingNewTask = true;
    currentTask = null;
    targetColumn = button.parentNode;
    openTaskModal();
}

function addNewColumn() {
    const columnName = prompt("Ingrese el nombre del nuevo estado:");
    if (columnName) {
        const column = document.createElement("div");
        column.className = "column";
        column.setAttribute("ondrop", "drop(event)");
        column.setAttribute("ondragover", "allowDrop(event)");
        column.innerHTML = `
            <h2>${columnName}</h2>
            <button class="delete-column" onclick="confirmDeleteColumn(this)">X</button>
            <button class="add-task" onclick="addTask(this)">+ Añade una tarjeta</button>
        `;
        document.querySelector(".board").appendChild(column);
    }
}

function openTaskModal() {
    document.getElementById("task-title").value = currentTask ? currentTask.querySelector(".task-title").textContent.trim() : "";
    document.getElementById("task-description").value = currentTask ? currentTask.querySelector(".task-description").textContent.trim() : "";
    document.getElementById("task-assignees").value = currentTask ? currentTask.querySelector(".assignees").textContent.replace("Asignado a: ", "").trim() : "";
    document.getElementById("task-urgency").value = currentTask ? currentTask.className.split(" ").find(c => c.startsWith("label-")) : "label-yellow";

    document.querySelector(".modal").style.display = "block";
    document.querySelector(".overlay").style.display = "block";
}

function saveTask() {
    const taskTitle = document.getElementById("task-title").value;
    const taskDescription = document.getElementById("task-description").value;
    const assignees = document.getElementById("task-assignees").value;
    const urgency = document.getElementById("task-urgency").value;

    if (isCreatingNewTask) {
        if (taskTitle) {
            const task = document.createElement("div");
            task.className = `task ${urgency}`;
            task.draggable = true;
            const uniqueId = Date.now();
            task.setAttribute("ondragstart", "drag(event)");
            task.setAttribute("data-task-id", uniqueId);
            task.innerHTML = `
                <div class="task-title">${taskTitle}</div>
                <div class="task-description">${taskDescription}</div>
                <div class="assignees">${assignees ? "Asignado a: " + assignees : ""}</div>
                <button class="edit-task" onclick="openEditModal(this)">✏️</button>
                <button class="delete-task" onclick="confirmDeleteTask(event, this)">X</button>
            `;
            targetColumn.insertBefore(task, targetColumn.querySelector(".add-task"));
        }
    } else if (currentTask) {
        currentTask.querySelector(".task-title").textContent = taskTitle;
        currentTask.querySelector(".task-description").textContent = taskDescription;
        currentTask.querySelector(".assignees").textContent = assignees ? "Asignado a: " + assignees : "";
        currentTask.className = `task ${urgency}`;
    }

    closeTaskModal();
}

function openEditModal(button) {
    currentTask = button.parentNode;
    isCreatingNewTask = false;
    openTaskModal();
}

function confirmDeleteTask(event, button) {
    event.stopPropagation();
    const confirmed = confirm("Estas seguro que deseas eliminar esta tarea?");
    if (confirmed) {
        button.parentNode.remove();
    }
}

function confirmDeleteColumn(button) {
    const confirmed = confirm("Estas seguro que deseas eliminar toda esta columna y sus tareas?");
    if (confirmed) {
        button.parentNode.remove();
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
        const taskHTML = event.dataTransfer.getData("text/plain");
        const taskId = event.dataTransfer.getData("task-id");
        const previousTask = document.querySelector(`.task[data-task-id="${taskId}"]`);
        if (previousTask && previousTask.parentNode !== targetElement) {
            previousTask.remove();
        } else if (previousTask) {
            return;
        }
        const taskElement = document.createElement("div");
        taskElement.innerHTML = taskHTML;
        const task = taskElement.firstChild;
        task.setAttribute("ondragstart", "drag(event)");
        task.setAttribute("data-task-id", taskId);
        task.querySelector(".edit-task").setAttribute("onclick", "openEditModal(this)");
        task.querySelector(".delete-task").setAttribute("onclick", "confirmDeleteTask(event, this)");
        targetElement.insertBefore(task, targetElement.querySelector(".add-task"));
    }
}






//FUNCIONES PARA GENERAR REPORTES Y MOSTRAR A LOS STAKEHOLDERS
function generarReporte() {
    const columnas = document.querySelectorAll(".column");
    const reporte = [];

    // Recolectamos la información de las columnas y tareas
    columnas.forEach((columna) => {
        const estado = columna.querySelector("h2").textContent;
        const tareas = columna.querySelectorAll(".task");

        // Contamos las tareas por urgencia
        let urgencias = { Alta: 0, Media: 0, Baja: 0 };

        Array.from(tareas).forEach((tarea) => {
            const urgencia = tarea.classList.contains("label-red")
                ? "Alta"
                : tarea.classList.contains("label-orange")
                ? "Media"
                : "Baja";

            urgencias[urgencia]++;
        });

        reporte.push({ estado, urgencias });
    });

    // Generamos el gráfico
    generarGrafico(reporte);
}

function generarGrafico(reporte) {
    // Abrimos una nueva ventana para mostrar el reporte
    const ventanaReporte = window.open("", "_blank", "width=800,height=600");
    ventanaReporte.document.write("<h1>Reporte de Avance</h1>");

    // Incluir Chart.js en la ventana emergente
    ventanaReporte.document.write(`
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <canvas id="grafico" width="400" height="200"></canvas>
    `);

    // Esperamos que el documento cargue antes de crear el gráfico
    ventanaReporte.document.write(`
        <script>
            window.onload = function() {
                const ctx = document.getElementById('grafico').getContext('2d');

                // Creamos los datos para el gráfico
                const datos = {
                    labels: ${JSON.stringify(reporte.map((columna) => columna.estado))}, // Etiquetas con los estados
                    datasets: [
                        {
                            label: 'Alta',
                            data: ${JSON.stringify(reporte.map((columna) => columna.urgencias.Alta))}, // Datos para las "Altas"
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Media',
                            data: ${JSON.stringify(reporte.map((columna) => columna.urgencias.Media))}, // Datos para las "Medias"
                            backgroundColor: 'rgba(255, 159, 64, 0.2)',
                            borderColor: 'rgba(255, 159, 64, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Baja',
                            data: ${JSON.stringify(reporte.map((columna) => columna.urgencias.Baja))}, // Datos para las "Bajas"
                            backgroundColor: 'rgba(255, 205, 86, 0.2)',
                            borderColor: 'rgba(255, 205, 86, 1)',
                            borderWidth: 1
                        }
                    ]
                };

                // Creamos el gráfico de barras
                const myChart = new Chart(ctx, {
                    type: 'bar', // Tipo de gráfico (barras)
                    data: datos,
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(tooltipItem) {
                                        return tooltipItem.dataset.label + ': ' + tooltipItem.raw + ' tareas';
                                    }
                                }
                            }
                        }
                    }
                });
            }
        </script>
    `);

    ventanaReporte.document.close();
}
