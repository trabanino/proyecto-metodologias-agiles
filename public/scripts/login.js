const loginForm = document.getElementById('loginForm');
const mensajeDiv = document.getElementById('mensaje');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('correo').value;
    const pass = document.getElementById('contraseña').value;

    const datos = {
        correo,
        contraseña: pass
    };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        if (response.ok) {
            localStorage.setItem('token', resultado.token);
            window.location.href = '/dashboard';
        } else {
            mensajeDiv.textContent = resultado.mensaje;
            mensajeDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
    }
});