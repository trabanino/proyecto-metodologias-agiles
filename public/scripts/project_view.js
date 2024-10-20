document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }

    const params = new URLSearchParams(window.location.search);
    const projectId = window.location.pathname.split('/').pop();

    const projectTitle = document.getElementById('projectTitle');
    const projectDescription = document.getElementById('projectDescription');
    const backBtn = document.getElementById('backBtn');

    backBtn.addEventListener('click', () => {
        window.location.href = '/dashboard';
    });

    // obtener detalles del proyecto
    async function loadProjectDetails() {
        const response = await fetch(`/api/projects/${projectId}`, {
            headers: {
                'Authorization': token
            }
        });

        if (response.status === 403) {
            alert('No tienes acceso a este proyecto');
            window.location.href = '/dashboard';
            return;
        }

        const project = await response.json();

        projectTitle.textContent = project.nombre;
        projectDescription.textContent = project.descripcion;
    }

    loadProjectDetails();
});
