document.addEventListener("DOMContentLoaded", () => {
    const sprints = [
        { id: 1, name: "Sprint 1", startDate: "2024-11-01", endDate: "2024-11-07", progress: 50, status: "in-progress" },
        { id: 2, name: "Sprint 2", startDate: "2024-11-08", endDate: "2024-11-14", progress: 100, status: "completed" },
    ];

    const sprintsContainer = document.querySelector(".sprints-container");
    const addSprintBtn = document.querySelector(".add-sprint-btn");
    const modal = document.getElementById("edit-modal");
    const closeModalBtn = modal.querySelector(".close-btn");
    const saveBtn = modal.querySelector(".save-btn");
    const sprintNameInput = modal.querySelector("#sprint-name");
    const startDateInput = modal.querySelector("#start-date");
    const endDateInput = modal.querySelector("#end-date");
    const statusInput = modal.querySelector("#status");
    let editingSprint = null;

    const renderSprints = () => {
        sprintsContainer.innerHTML = "";
        sprints.forEach((sprint) => {
            const sprintElement = document.createElement("div");
            sprintElement.classList.add("sprint");
            sprintElement.innerHTML = `
                <div class="sprint-details">
                    <div class="sprint-name">${sprint.name}</div>
                    <div class="sprint-dates">Fecha inicio: ${sprint.startDate}<br>Fecha fin: ${sprint.endDate}</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${sprint.progress}%"></div>
                    </div>
                </div>
                <button class="status-btn ${sprint.status}">${sprint.status.replace("-", " ")}</button>
            `;
            sprintElement.querySelector(".status-btn").addEventListener("click", () => {
                openEditModal(sprint);
            });
            sprintsContainer.appendChild(sprintElement);
        });
    };

    const openEditModal = (sprint = null) => {
        editingSprint = sprint;
        if (sprint) {
            sprintNameInput.value = sprint.name;
            startDateInput.value = sprint.startDate;
            endDateInput.value = sprint.endDate;
            statusInput.value = sprint.status;
        } else {
            sprintNameInput.value = "";
            startDateInput.value = "";
            endDateInput.value = "";
            statusInput.value = "not-started";
        }
        modal.style.display = "flex";
    };

    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    saveBtn.addEventListener("click", () => {
        if (editingSprint) {
            // Edit existing sprint
            editingSprint.name = sprintNameInput.value;
            editingSprint.startDate = startDateInput.value;
            editingSprint.endDate = endDateInput.value;
            editingSprint.status = statusInput.value;
        } else {
            // Add new sprint
            const newSprint = {
                id: sprints.length + 1,
                name: sprintNameInput.value,
                startDate: startDateInput.value,
                endDate: endDateInput.value,
                progress: 0,
                status: statusInput.value,
            };
            sprints.push(newSprint);
        }
        modal.style.display = "none";
        renderSprints();
    });

    addSprintBtn.addEventListener("click", () => {
        openEditModal(); // Open modal for adding a new sprint
    });

    renderSprints();
});
