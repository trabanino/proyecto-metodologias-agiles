document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }

    const projectId = window.location.pathname.split('/').pop();

    const projectTitle = document.getElementById('projectTitle');
    const projectDescription = document.getElementById('projectDescription');

    // obtener detalles del proyecto
    async function loadProjectDetails() {
        const response = await fetch(`/api/projects/${projectId}`, {
            headers: {
                'Authorization': token
            }
        });

        if (response.status === 403) {
            alert('no tienes acceso a este proyecto');
            window.location.href = '/dashboard';
            return;
        }

        const project = await response.json();

        projectTitle.textContent = project.nombre;
        projectDescription.textContent = project.descripcion;
    }

    loadProjectDetails();

    // añadir funcionalidad a los botones del menú
    const addSprintBtn = document.getElementById('addSprintBtn');
    const sprintsBtn = document.getElementById('sprintsBtn');
    const reportsBtn = document.getElementById('reportsBtn');
    const kanbanBtn = document.getElementById('kanbanBtn');

    addSprintBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // logica para añadir un sprint
        alert('PENDIENTE: añadir sprint no implementada todavia');
    });

    sprintsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // navegar a la página de sprints
        alert('PENDIENTE: ver sprints no implementada todavia');
    });

    reportsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // navegar a la página de reportes
        alert('PENDIENTE: ver reportes no implementada todavia');
    });

    kanbanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // navegar a la página de Kanban con el ID del proyecto
        window.location.href = `/kanban.html?projectId=${projectId}`;
    });
});
