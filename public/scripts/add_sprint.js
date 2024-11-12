document.addEventListener("DOMContentLoaded", () => {
    const sprints = [
        { id: 1, name: "Sprint 1", startDate: "2024-11-01", endDate: "2024-11-07", status: "in-progress" },
        { id: 2, name: "Sprint 2", startDate: "2024-11-08", endDate: "2024-11-14", status: "completed" },
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

    const calculateProgress = (startDate, endDate) => {
        const today = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (today < start) return 0;
        if (today > end) return 100;

        const total = end - start;
        const elapsed = today - start;
        return Math.round((elapsed / total) * 100);
    };

    const renderSprints = () => {
        sprintsContainer.innerHTML = "";
        sprints.forEach((sprint) => {
            const progress = calculateProgress(sprint.startDate, sprint.endDate);
            const sprintElement = document.createElement("div");
            sprintElement.classList.add("sprint");
            sprintElement.innerHTML = `
                <div class="sprint-details">
                    <div class="sprint-name">${sprint.name}</div>
                    <div class="sprint-dates">Fecha inicio: ${sprint.startDate}<br>Fecha fin: ${sprint.endDate}</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progress}%;"></div>
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
            editingSprint.name = sprintNameInput.value;
            editingSprint.startDate = startDateInput.value;
            editingSprint.endDate = endDateInput.value;
            editingSprint.status = statusInput.value;
        } else {
            const newSprint = {
                id: sprints.length + 1,
                name: sprintNameInput.value,
                startDate: startDateInput.value,
                endDate: endDateInput.value,
                status: statusInput.value,
            };
            sprints.push(newSprint);
        }
        modal.style.display = "none";
        renderSprints();
    });

    addSprintBtn.addEventListener("click", () => {
        openEditModal();
    });

    renderSprints();
});