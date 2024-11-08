
document.addEventListener('DOMContentLoaded', function() {
    // Menú superior
    const topNav = document.createElement('header');
    topNav.className = 'top-nav';
    topNav.innerHTML = `
        <h1>Tablero de Reportes</h1>
        <nav>
            <a href="#resumen">Resumen</a>
            <a href="#progreso">Progreso</a>
            <a href="#detalles">Detalles de Actividades</a>
        </nav>
    `;
    document.body.appendChild(topNav);

    // Menú lateral izquierdo
    const sideNav = document.createElement('aside');
    sideNav.className = 'side-nav';
    sideNav.innerHTML = `
        <nav>
            <a href="dashboard.html">Dashboard</a>
            <a href="reportes.html">Reportes</a>
            <a href="configuracion.html">Configuración</a>
            <a href="ayuda.html">Ayuda</a>
        </nav>
    `;
    document.body.appendChild(sideNav);

    // Contenido principal
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.innerHTML = `
        <div class="board">
            <header class="column-header"><h2>Reportes en Proceso</h2></header>
            <div style="padding: 10px; font-size: 1em; line-height: 1.5;">
                <h3 style="color: var(--text-color); margin-bottom: 8px;">Generar Reporte de Avance</h3>
                <p>Informe el progreso a los stakeholders de manera rápida y eficaz.</p>
                <label for="progress-bar" style="display: block; margin-top: 15px; font-weight: bold;">Progreso del proyecto</label>
                <div class="progress-bar-container" style="margin: 15px 0;">
                    <div id="progress-bar" class="progress-bar" style="width: 0%; height: 12px; border-radius: 5px;"></div>
                </div>
                <button id="generateReport" style="padding: 8px 15px; border-radius: 20px; font-size: 1em; margin-top: 10px; background-color: var(--magenta-color); color: var(--white-color); border: none; cursor: pointer;">
                    Generar Reporte
                </button>
                <p id="report-status" style="margin-top: 10px; font-size: 0.9em; color: #555;">No se ha generado ningún reporte aún.</p>
            </div>
        </div>
    `;
    document.body.appendChild(mainContent);

    // Función para generar reporte
    function generateReport() {
        const progressBar = document.getElementById("progress-bar");
        const reportStatus = document.getElementById("report-status");
        let progress = 0;
        const interval = setInterval(() => {
            if (progress >= 100) {
                clearInterval(interval);
                reportStatus.textContent = "Reporte generado exitosamente. Redirigiendo al reporte...";
                setTimeout(() => {
                    window.location.href = "reporte.html";
                }, 1000);
            } else {
                progress += 10;
                progressBar.style.width = progress + "%";
                reportStatus.textContent = "Generando reporte... " + progress + "% completado.";
            }
        }, 500);
    }

    // Event listener for the report generation button
    document.getElementById("generateReport").addEventListener("click", generateReport);
});
