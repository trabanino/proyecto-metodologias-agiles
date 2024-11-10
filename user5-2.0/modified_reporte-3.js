/* JavaScript functionality removed for aesthetics-only version */

// Function to simulate loading project details from a database
function loadProjectDetails(details) {
    const projectProgress = document.getElementById("project-progress");
    const activityDetails = document.getElementById("activity-details");

    if (details && details.progress) {
        projectProgress.textContent = "Progreso: " + details.progress + "% completado";
    } else {
        projectProgress.textContent = "Progreso del proyecto pendiente de cargar...";
    }

    // Update activity details if provided
    if (details && details.activities) {
        activityDetails.innerHTML = '';
        details.activities.forEach(activity => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${activity.phase}:</strong> ${activity.status}`;
            activityDetails.appendChild(listItem);
        });
    } else {
        activityDetails.innerHTML = '<li>No hay actividades registradas.</li>';
    }
}
