const registerForm = document.getElementById('registerForm');
const mensajeDiv = document.getElementById('mensaje');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const contraseña = document.getElementById('contraseña').value;

    const datos = {
        nombre,
        correo,
        contraseña
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        if (response.ok) {
            mensajeDiv.textContent = resultado.mensaje;
            mensajeDiv.style.color = 'green';

            setTimeout(() => {
                window.location.href = 'login';
            }, 2000);
        } else {
            mensajeDiv.textContent = resultado.mensaje;
            mensajeDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
