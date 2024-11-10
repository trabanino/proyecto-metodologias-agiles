/* JavaScript functionality removed for aesthetics-only version */

document.addEventListener('DOMContentLoaded', function() {
    // Menú superior
    const topNav = document.createElement('header');
    topNav.className = 'top-nav';
    topNav.innerHTML = `
        <h1>Reporte de Avance</h1>
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
            <section id="resumen" class="column">
                <header class="column-header"><h2>Resumen</h2></header>
                <div class="card"><p>Este reporte detalla el progreso acumulado en el proyecto, destacando los principales hitos alcanzados hasta la fecha.</p></div>
            </section>
            <section id="progreso" class="column">
                <header class="column-header"><h2>Progreso del Proyecto</h2></header>
                <div class="card">
                    <label for="progress-bar">Progreso del proyecto</label>
                    <div class="progress-bar-container"><div class="progress-bar" style="width: 100%;"></div></div>
                    <p>Progreso: 100% completado</p>
                </div>
            </section>
            <section id="detalles" class="column">
                <header class="column-header"><h2>Detalles de Actividades</h2></header>
                <div class="card">
                    <ul>
                        <li><strong>Fase 1:</strong> Investigación completada.</li>
                        <li><strong>Fase 2:</strong> Desarrollo en curso, 80% completado.</li>
                        <li><strong>Fase 3:</strong> Pruebas iniciales realizadas.</li>
                        <li><strong>Fase 4:</strong> Documentación en proceso.</li>
                    </ul>
                </div>
            </section>
            <footer><button onclick="window.location.href='userStory5.html'" class="footer-button">Volver a la Página Principal</button></footer>
        </div>
    `;
    document.body.appendChild(mainContent);
});
