// Variables globales
let token;
let projectId;

document.addEventListener('DOMContentLoaded', async () => {
    token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }

    projectId = window.location.pathname.split('/').pop();

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

    // Añadir evento al botón "Regresar"
    const backBtn = document.getElementById('backBtn');

    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.back();
    });

    // añadir funcionalidad a los botones del menú
    const addSprintBtn = document.getElementById('addSprintBtn');
    const sprintsBtn = document.getElementById('sprintsBtn');
    const reportsBtn = document.getElementById('reportsBtn');
    const kanbanBtn = document.getElementById('kanbanBtn');
    const miembrosBtn = document.getElementById('miembrosBtn');
    const plazos = document.getElementById('plazBtn');


    addSprintBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // lógica para añadir un sprint
        window.location.href = `/add_sprint.html?projectId=${projectId}`;
    });

    sprintsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // navegar a la página de sprints
        alert('PENDIENTE: ver sprints no implementada todavía');
    });

    reportsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // navegar a la página de reportes
        alert('PENDIENTE: ver reportes no implementada todavía');
    });

    kanbanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // navegar a la página de Kanban con el ID del proyecto
        window.location.href = `/kanban.html?projectId=${projectId}`;
    });

    // Obtener elementos del DOM para la sección de miembros
    const miembrosSection = document.getElementById('miembrosSection');
    const projectMenu = document.getElementById('projectMenu');
    const miembrosList = document.getElementById('miembrosList');
    const emailInvitar = document.getElementById('emailInvitar');
    const invitarBtn = document.getElementById('invitarBtn');
    const volverMenuBtn = document.getElementById('volverMenuBtn');

    miembrosBtn.addEventListener('click', (e) => {
        e.preventDefault();
        projectMenu.style.display = 'none';
        miembrosSection.style.display = 'block';
        cargarMiembros();

        // Remover la clase 'active' de todos los enlaces del menú
        document.querySelectorAll('.project-menu ul li a').forEach(link => {
            link.classList.remove('active');
        });

        // Agregar la clase 'active' al enlace de miembros
        miembrosBtn.classList.add('active');
    });

    // Listener para el botón "Regresar al Menú"
    volverMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        miembrosSection.style.display = 'none';
        projectMenu.style.display = 'block';

        // Remover la clase 'active' del enlace de miembros
        miembrosBtn.classList.remove('active');
    });

    // Función para cargar miembros del proyecto
    async function cargarMiembros() {
        const response = await fetch(`/api/projects/${projectId}`, {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            console.error('Error fetching project:', response.statusText);
            return;
        }

        const project = await response.json();

        miembrosList.innerHTML = '';
        for (const miembroId of project.miembros) {
            const miembroIdStr = miembroId.toString();

            const usuarioResponse = await fetch(`/api/users/${miembroIdStr}`, {
                headers: {
                    'Authorization': token
                }
            });

            if (!usuarioResponse.ok) {
                console.error(`Error fetching user ${miembroIdStr}:`, usuarioResponse.status, usuarioResponse.statusText);
                continue; // saltar al siguiente miembro
            }

            const usuario = await usuarioResponse.json();

            const li = document.createElement('li');
            li.innerHTML = `<span>${usuario.nombre} (${usuario.correo})</span>`;

            // Botón para eliminar miembro
            const eliminarBtn = document.createElement('button');
            eliminarBtn.textContent = 'Eliminar';
            eliminarBtn.addEventListener('click', () => eliminarMiembro(miembroIdStr));

            // Botón para asignar rol
            const esAdmin = project.admins && project.admins.includes(miembroIdStr);
            const rolBtn = document.createElement('button');
            rolBtn.textContent = esAdmin ? 'Quitar Admin' : 'Hacer Admin';
            rolBtn.addEventListener('click', () => asignarRol(miembroIdStr, esAdmin ? 'miembro' : 'admin'));

            li.appendChild(eliminarBtn);
            li.appendChild(rolBtn);
            miembrosList.appendChild(li);
        }
    }

    // Función para invitar miembro
    invitarBtn.addEventListener('click', async () => {
        const email = emailInvitar.value;
        if (!email) {
            alert('Por favor, ingresa un correo');
            return;
        }

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
            emailInvitar.value = '';
        } else {
            alert(resultado.mensaje || 'Error al invitar miembro');
        }
    });

    // Función para eliminar miembro
    async function eliminarMiembro(miembroId) {
        const confirmar = confirm('¿Estás seguro de eliminar este miembro?');
        if (!confirmar) return;

        const response = await fetch(`/api/projects/${projectId}/members/${miembroId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });

        const resultado = await response.json();
        if (response.ok) {
            alert('Miembro eliminado');
            cargarMiembros();
        } else {
            alert(resultado.mensaje || 'Error al eliminar miembro');
        }
    }

    // Función para asignar rol
    async function asignarRol(miembroId, rol) {
        const response = await fetch(`/api/projects/${projectId}/members/${miembroId}/role`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ role: rol })
        });

        const resultado = await response.json();
        if (response.ok) {
            alert('Rol actualizado');
            cargarMiembros();
        } else {
            alert(resultado.mensaje || 'Error al actualizar rol');
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const projectId = window.location.pathname.split('/').pop();

        const projectTitle = document.getElementById('projectTitle');
        const projectDescription = document.getElementById('projectDescription');

        // Obtener detalles del proyecto
        async function loadProjectDetails() {
            try {
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

                if (!response.ok) {
                    alert('Error al obtener los detalles del proyecto');
                    return;
                }

                const project = await response.json();

                projectTitle.textContent = project.nombre;
                projectDescription.textContent = project.descripcion;
            } catch (error) {
                console.error('Error al cargar los detalles del proyecto:', error);
                alert('Error al cargar los detalles del proyecto');
            }
        }

        loadProjectDetails();

        // Añadir funcionalidad a los botones del menú
        const addSprintBtn = document.getElementById('addSprintBtn');
        const sprintsBtn = document.getElementById('sprintsBtn');
        const reportsBtn = document.getElementById('reportsBtn');
        const kanbanBtn = document.getElementById('kanbanBtn');

        addSprintBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Lógica para añadir un sprint
            alert('PENDIENTE: añadir sprint no implementada todavía');
        });

        sprintsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navegar a la página de sprints
            alert('PENDIENTE: ver sprints no implementada todavía');
        });

        reportsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navegar a la página de reportes
            alert('PENDIENTE: ver reportes no implementada todavía');
        });

        kanbanBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navegar a la página de Kanban con el ID del proyecto
            window.location.href = `/kanban.html?projectId=${projectId}`;
        });




    });

    plazos.addEventListener('click', (e) => {
        e.preventDefault();
        //Funcion de plazos

        const plazBtn = document.getElementById('plazBtn');
        const modal = document.getElementById('deadlineModal');
        const closeBtn = document.querySelector('.close');
        const deadlineForm = document.getElementById('deadlineForm');
        const deadlineDisplay = document.getElementById('deadlineDisplay');

        // Store deadline data
        let projectDeadline = {
            projectName: '',
            deadline: null
        };

        // Modal control functions
        plazBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'block';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Form submission handler
        deadlineForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form values
            const projectName = document.getElementById('projectName').value;
            const deadlineDate = document.getElementById('deadlineDate').value;

            // Store the deadline data
            projectDeadline = {
                projectName: projectName,
                deadline: new Date(deadlineDate)
            };

            // Update display
            updateDeadlineDisplay();

            // Close modal
            modal.style.display = 'none';

            // Save to localStorage
            localStorage.setItem('projectDeadline', JSON.stringify(projectDeadline));
        });

        // Function to update the deadline display
        function updateDeadlineDisplay() {
            const displayProjectName = document.getElementById('displayProjectName');
            const displayDeadlineDate = document.getElementById('displayDeadlineDate');
            const displayTimeRemaining = document.getElementById('displayTimeRemaining');

            displayProjectName.textContent = projectDeadline.projectName;
            displayDeadlineDate.textContent = projectDeadline.deadline.toLocaleDateString();

            // Calculate and display time remaining
            const timeRemaining = getTimeRemaining(projectDeadline.deadline);
            displayTimeRemaining.textContent = timeRemaining;

            // Show the deadline display section
            deadlineDisplay.style.display = 'block';
        }

        // Function to calculate time remaining
        function getTimeRemaining(deadline) {
            const now = new Date();
            const timeDiff = deadline - now;

            if (timeDiff < 0) {
                return 'Deadline passed';
            }

            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            return `${days} days and ${hours} hours`;
        }

        // Load saved deadline on page load
        window.addEventListener('load', () => {
            const savedDeadline = localStorage.getItem('projectDeadline');
            if (savedDeadline) {
                projectDeadline = JSON.parse(savedDeadline);
                projectDeadline.deadline = new Date(projectDeadline.deadline);
                updateDeadlineDisplay();
            }
        });

        // Update time remaining every minute
        setInterval(() => {
            if (projectDeadline.deadline) {
                updateDeadlineDisplay();
            }
        }, 60000);

    });







});
