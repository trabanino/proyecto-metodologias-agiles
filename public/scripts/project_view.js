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

        loadMiembros(project);
    }

    loadProjectDetails();

    const backBtn = document.getElementById('backBtn');

    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.back();
    });

    const addSprintBtn = document.getElementById('addSprintBtn');
    const sprintsBtn = document.getElementById('sprintsBtn');
    const reportsBtn = document.getElementById('reportsBtn');
    const kanbanBtn = document.getElementById('kanbanBtn');
    const miembrosBtn = document.getElementById('miembrosBtn');
    const plazBtn = document.getElementById('plazBtn');

    addSprintBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('PENDIENTE: añadir sprint no implementada todavía');
    });

    sprintsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('PENDIENTE: ver sprints no implementada todavía');
    });

    reportsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('PENDIENTE: ver reportes no implementada todavía');
    });

    kanbanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `/kanban.html?projectId=${projectId}`;
    });

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

        document.querySelectorAll('.project-menu ul li a').forEach(link => {
            link.classList.remove('active');
        });

        miembrosBtn.classList.add('active');
    });

    volverMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        miembrosSection.style.display = 'none';
        projectMenu.style.display = 'block';

        miembrosBtn.classList.remove('active');
    });

    async function loadMiembros(project) {
        const ownerId = project.owner;
        const admins = project.admins || [];
        miembrosList.innerHTML = '';
        for (const miembroId of project.miembros) {
            const response = await fetch(`/api/users/${miembroId}`, {
                headers: {
                    'Authorization': token
                }
            });

            if (!response.ok) {
                console.error(`Error fetching user ${miembroId}`);
                continue;
            }

            const usuario = await response.json();

            const li = document.createElement('li');
            let role = '';
            if (miembroId === ownerId) {
                role = 'Propietario';
            } else if (admins.includes(miembroId)) {
                role = 'Administrador';
            } else {
                role = 'Miembro';
            }

            li.innerHTML = `<span>${usuario.nombre} (${usuario.correo}) - ${role}</span>`;

            if (miembroId !== ownerId) {
                const eliminarBtn = document.createElement('button');
                eliminarBtn.textContent = 'Eliminar';
                eliminarBtn.addEventListener('click', () => eliminarMiembro(miembroId));

                const esAdmin = admins.includes(miembroId);
                const rolBtn = document.createElement('button');
                rolBtn.textContent = esAdmin ? 'Quitar Admin' : 'Hacer Admin';
                rolBtn.addEventListener('click', () => asignarRol(miembroId, esAdmin ? 'miembro' : 'admin'));

                li.appendChild(eliminarBtn);
                li.appendChild(rolBtn);
            }

            miembrosList.appendChild(li);
        }
    }

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
            location.reload();
        } else {
            alert(resultado.mensaje || 'Error al eliminar miembro');
        }
    }

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
            location.reload();
        } else {
            alert(resultado.mensaje || 'Error al actualizar rol');
        }
    }

    const modal = document.getElementById('deadlineModal');
    const span = document.getElementsByClassName('close')[0];
    const saveDeadlineBtn = document.getElementById('saveDeadlineBtn');
    const deadlineInput = document.getElementById('deadline');

    plazBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });

    span.onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    saveDeadlineBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const deadline = deadlineInput.value;
        if (!deadline) {
            alert('Por favor, selecciona una fecha.');
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}/deadline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ deadline })
            });

            if (!response.ok) {
                alert('Error al guardar la fecha límite');
                return;
            }

            alert('Fecha límite guardada con éxito');
            modal.style.display = 'none';
        } catch (error) {
            console.error('Error al guardar la fecha límite:', error);
            alert('Error al guardar la fecha límite');
        }
    });
});
