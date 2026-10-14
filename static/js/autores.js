const API_URL = 'http://127.0.0.1:8000/api/autores/';

// 1. Petición GET: Obtener y listar autores en la tabla
async function obtenerAutores() {
    try {
        const respuesta = await fetch(API_URL);
        const autores = await respuesta.json();
        
        const tablaBody = document.getElementById('tabla-autores');
        tablaBody.innerHTML = ''; // Limpiar la tabla

        autores.forEach(autor => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${autor.id}</td>
                <td>${autor.nombre}</td>
                <td>${autor.nacionalidad}</td>
                <td>${autor.fecha_nacimiento || 'N/A'}</td>
            `;
            tablaBody.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar la lista de autores:', error);
    }
}

// 2. Petición POST: Registrar un nuevo autor desde el formulario
document.getElementById('form-autor').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitar que la página se recargue

    const nuevoAutor = {
        nombre: document.getElementById('nombre').value,
        nacionalidad: document.getElementById('nacionalidad').value,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value || null
    };

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoAutor)
        });

        if (respuesta.ok) {
            document.getElementById('form-autor').reset(); // Limpiar campos
            obtenerAutores(); // Recargar la tabla dinámicamente
        } else {
            console.error('Error en la respuesta del servidor al guardar autor');
        }
    } catch (error) {
        console.error('Error al realizar la petición POST:', error);
    }
});

// Cargar autores al abrir o recargar la página
document.addEventListener('DOMContentLoaded', obtenerAutores);