const API_URL = '/api/autores/';

let autoresData = [];
let editandoId = null;

// Elementos del DOM
const tablaBody = document.getElementById('tabla-autores');
const metricTotal = document.getElementById('metric-total');
const metricConObras = document.getElementById('metric-con-obras');
const infoPoblacion = document.getElementById('info-poblacion');
const inputBuscar = document.getElementById('input-buscar');
const formAutor = document.getElementById('form-autor');
const charCounter = document.getElementById('char-counter');
const biografiaTextarea = document.getElementById('biografia');

// 1. Obtener lista de autores desde la API (GET)
async function obtenerAutores() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Error al conectar con la API');
        autoresData = await res.json();
        renderizarTabla(autoresData);
        actualizarMetricas(autoresData);
    } catch (error) {
        console.error('Error al obtener autores:', error);
    }
}

// 2. Renderizar filas respetando las 7 columnas exactas
function renderizarTabla(lista) {
    if (!tablaBody) return;
    tablaBody.innerHTML = '';

    if (lista.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No se encontraron autores registrados.</td></tr>`;
        if (infoPoblacion) infoPoblacion.textContent = 'Mostrando 0 autores';
        return;
    }

    lista.forEach(autor => {
        // Separar nombre completo en primer nombre y apellido
        const partes = (autor.nombre || '').trim().split(' ');
        const primerNombre = partes[0] || '';
        const apellido = partes.slice(1).join(' ') || '-';
        
        // Generar iniciales para el avatar
        const iniciales = (primerNombre.charAt(0) + (partes[1] ? partes[1].charAt(0) : '')).toUpperCase();

        // Cantidad de libros (simulada o leída desde backend)
        const cantidadLibros = autor.libros_count !== undefined ? autor.libros_count : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="id-badge">#AUT-${String(autor.id).padStart(2, '0')}</td>
            <td>
                <div class="author-cell">
                    <span class="avatar-badge">${iniciales || 'AU'}</span>
                    <span>${primerNombre}</span>
                </div>
            </td>
            <td>${apellido}</td>
            <td><span class="badge-country">${autor.nacionalidad || 'N/A'}</span></td>
            <td>${autor.fecha_nacimiento || 'N/A'}</td>
            <td>
                <span class="badge-books"><i class="ri-book-open-line"></i> ${cantidadLibros} libros</span>
            </td>
            <td>
                <div class="actions-wrapper">
                    <button type="button" class="action-btn edit" onclick="cargarEdicion(${autor.id})" title="Editar"><i class="ri-edit-2-line"></i></button>
                    <button type="button" class="action-btn delete" onclick="eliminarAutor(${autor.id})" title="Eliminar"><i class="ri-delete-bin-line"></i></button>
                </div>
            </td>
        `;
        tablaBody.appendChild(tr);
    });

    if (infoPoblacion) {
        infoPoblacion.textContent = `Mostrando ${lista.length} de ${autoresData.length} autores`;
    }
}

// 3. Actualizar métricas superiores
function actualizarMetricas(lista) {
    if (metricTotal) metricTotal.textContent = lista.length;
    if (metricConObras) metricConObras.textContent = lista.length;
}

// 4. Buscador en tiempo real
if (inputBuscar) {
    inputBuscar.addEventListener('input', () => {
        const termino = inputBuscar.value.toLowerCase().trim();
        const filtrados = autoresData.filter(a => 
            (a.nombre || '').toLowerCase().includes(termino) ||
            (a.nacionalidad || '').toLowerCase().includes(termino)
        );
        renderizarTabla(filtrados);
    });
}

const btnBuscar = document.getElementById('btn-buscar');
if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
        if (inputBuscar) inputBuscar.dispatchEvent(new Event('input'));
    });
}

const btnActualizar = document.getElementById('btn-actualizar');
if (btnActualizar) {
    btnActualizar.addEventListener('click', () => {
        if (inputBuscar) inputBuscar.value = '';
        obtenerAutores();
    });
}

// 5. Guardar o Editar Autor (POST / PUT)
if (formAutor) {
    formAutor.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombreVal = document.getElementById('nombre').value.trim();
        const apellidoVal = document.getElementById('apellido').value.trim();
        const nombreCompleto = apellidoVal ? `${nombreVal} ${apellidoVal}` : nombreVal;

        const payload = {
            nombre: nombreCompleto,
            nacionalidad: document.getElementById('nacionalidad').value.trim(),
            fecha_nacimiento: document.getElementById('fecha_nacimiento').value || null
        };

        const url = editandoId ? `${API_URL}${editandoId}/` : API_URL;
        const method = editandoId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                resetearFormulario();
                obtenerAutores();
            } else {
                console.error('Error al guardar autor');
            }
        } catch (err) {
            console.error('Error en la petición:', err);
        }
    });
}

// 6. Cargar datos en el formulario para Editar (PUT)
function cargarEdicion(id) {
    const autor = autoresData.find(a => a.id === id);
    if (!autor) return;

    editandoId = id;
    const partes = (autor.nombre || '').trim().split(' ');

    document.getElementById('nombre').value = partes[0] || '';
    document.getElementById('apellido').value = partes.slice(1).join(' ') || '';
    document.getElementById('nacionalidad').value = autor.nacionalidad || '';
    document.getElementById('fecha_nacimiento').value = autor.fecha_nacimiento || '';

    const formTitle = document.getElementById('form-title');
    const btnSubmitText = document.getElementById('btn-submit-text');
    if (formTitle) formTitle.textContent = 'Editar Autor';
    if (btnSubmitText) btnSubmitText.textContent = 'Actualizar autor';
}

// 7. Eliminar Autor (DELETE)
async function eliminarAutor(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este autor?')) return;

    try {
        const res = await fetch(`${API_URL}${id}/`, { method: 'DELETE' });
        if (res.ok) {
            obtenerAutores();
        } else {
            console.error('No se pudo eliminar el autor.');
        }
    } catch (err) {
        console.error('Error en la petición DELETE:', err);
    }
}

// 8. Resetear formulario
function resetearFormulario() {
    editandoId = null;
    if (formAutor) formAutor.reset();
    
    const formTitle = document.getElementById('form-title');
    const btnSubmitText = document.getElementById('btn-submit-text');
    if (formTitle) formTitle.textContent = 'Registrar Nuevo Autor';
    if (btnSubmitText) btnSubmitText.textContent = 'Guardar autor';
    if (charCounter) charCounter.textContent = '0 / 300';
}

const btnCancelar = document.getElementById('btn-cancelar');
if (btnCancelar) {
    btnCancelar.addEventListener('click', resetearFormulario);
}

// Contador de caracteres
if (biografiaTextarea && charCounter) {
    biografiaTextarea.addEventListener('input', (e) => {
        charCounter.textContent = `${e.target.value.length} / 300`;
    });
}

document.addEventListener('DOMContentLoaded', obtenerAutores);