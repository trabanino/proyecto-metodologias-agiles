// Variables globales
let projects = JSON.parse(localStorage.getItem("projects")) || [];

// Función para abrir y cerrar el modal de creación de proyectos
document.getElementById("createProjectBtn").addEventListener("click", function () {
    document.getElementById("projectModal").style.display = "flex";
});

document.querySelectorAll(".close").forEach(closeBtn => {
    closeBtn.addEventListener("click", function () {
        document.getElementById("projectModal").style.display = "none";
    });
});

// Función para agregar proyectos a la lista y a localStorage
document.getElementById("projectForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const projectName = document.getElementById("projectName").value;
    const projectDescription = document.getElementById("projectDescription").value;
    
    // Crear nuevo proyecto
    const project = {
        id: Date.now(),
        name: projectName,
        description: projectDescription,
        tasks: {
            todo: [],
            inProgress: [],
            done: []
        }
    };
    
    // Agregar proyecto a la lista y guardarlo en localStorage
    projects.push(project);
    localStorage.setItem("projects", JSON.stringify(projects));
    
    // Agregar proyecto al DOM
    addProjectToDOM(project);
    document.getElementById("projectModal").style.display = "none";
    document.getElementById("projectForm").reset();
});

// Función para agregar proyectos al DOM
function addProjectToDOM(project) {
    const projectList = document.getElementById("projectList");
    const projectCard = document.createElement("div");
    projectCard.className = "project-card";
    projectCard.innerHTML = `
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        <button onclick="goToProject(${project.id})">Ver Detalles</button>
    `;
    projectList.appendChild(projectCard);
}

// Cargar proyectos desde localStorage al iniciar la página
function loadProjects() {
    projects.forEach(project => addProjectToDOM(project));
}

// Función para redirigir a la página de detalles del proyecto
function goToProject(projectId) {
    // Guardar el ID del proyecto actual en localStorage
    localStorage.setItem("currentProject", projectId);
    // Redirigir a la página de detalles del proyecto
    window.location.href = "project.html";
}

// Inicializar y cargar proyectos al cargar la página
loadProjects();
