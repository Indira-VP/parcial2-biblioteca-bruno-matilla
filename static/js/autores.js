const API_URL = '/api/autores/';

let autoresData = [];
let autoresFiltrados = [];
let editandoId = null;

// Control de paginación
let paginaActual = 1;
const registrosPorPagina = 10;

// Elementos del DOM
const tablaBody = document.getElementById('tabla-autores');
const metricTotal = document.getElementById('metric-total');
const metricConObras = document.getElementById('metric-con-obras');
const infoPoblacion = document.getElementById('info-poblacion');
const contenedorPaginacion = document.getElementById('contenedor-paginacion');
const inputBuscar = document.getElementById('input-buscar');
const formAutor = document.getElementById('form-autor');
const charCounter = document.getElementById('char-counter');
const biografiaTextarea = document.getElementById('biografia');

// Elementos Modal
const modalBiografia = document.getElementById('modal-biografia');
const modalAvatar = document.getElementById('modal-avatar');
const modalNombreAutor = document.getElementById('modal-nombre-autor');
const modalMetaAutor = document.getElementById('modal-meta-autor');
const modalTextoBiografia = document.getElementById('modal-texto-biografia');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');

// 1. Obtener lista de autores (GET)
async function obtenerAutores() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Error al conectar con la API');
        autoresData = await res.json();
        autoresFiltrados = [...autoresData];
        paginaActual = 1;
        renderizarTabla();
        actualizarMetricas(autoresData);
    } catch (error) {
        console.error('Error al obtener autores:', error);
    }
}

// 2. Renderizar tabla con paginación
function renderizarTabla() {
    if (!tablaBody) return;
    tablaBody.innerHTML = '';

    if (autoresFiltrados.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No se encontraron autores registrados.</td></tr>`;
        if (infoPoblacion) infoPoblacion.textContent = 'Mostrando 0 autores';
        if (contenedorPaginacion) contenedorPaginacion.innerHTML = '';
        return;
    }

    // Cálculo de subconjunto paginado (10 ítems)
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const itemsPagina = autoresFiltrados.slice(inicio, fin);

    itemsPagina.forEach(autor => {
        const primerNombre = autor.nombre || '';
        const apellido = autor.apellido || '-';
        
        const inicialNombre = primerNombre.charAt(0);
        const inicialApellido = apellido !== '-' ? apellido.charAt(0) : '';
        const iniciales = (inicialNombre + inicialApellido).toUpperCase();

        const cantidadLibros = autor.libros_count !== undefined ? autor.libros_count : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="id-badge">#AUT-${String(autor.id).padStart(2, '0')}</td>
            <td>
                <div class="author-cell">
                    <span class="avatar-badge">${iniciales || 'AU'}</span>
                    <span class="author-name-link" onclick="verBiografia(${autor.id})" title="Ver biografía">${primerNombre}</span>
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

    actualizarControlesPaginacion();
}

// 3. Renderizar botones de paginación interactiva
function actualizarControlesPaginacion() {
    const totalRegistros = autoresFiltrados.length;
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

    const inicioMostrado = (paginaActual - 1) * registrosPorPagina + 1;
    const finMostrado = Math.min(paginaActual * registrosPorPagina, totalRegistros);

    if (infoPoblacion) {
        infoPoblacion.textContent = `Mostrando ${inicioMostrado} - ${finMostrado} de ${totalRegistros} autores`;
    }

    if (!contenedorPaginacion) return;
    contenedorPaginacion.innerHTML = '';

    // Botón Anterior
    const btnAnt = document.createElement('button');
    btnAnt.className = 'btn-page';
    btnAnt.innerHTML = '&lt; Anterior';
    btnAnt.disabled = paginaActual === 1;
    btnAnt.onclick = () => {
        if (paginaActual > 1) {
            paginaActual--;
            renderizarTabla();
        }
    };
    contenedorPaginacion.appendChild(btnAnt);

    // Números de Página
    for (let i = 1; i <= totalPaginas; i++) {
        const btnNum = document.createElement('button');
        btnNum.className = `btn-page ${i === paginaActual ? 'active' : ''}`;
        btnNum.textContent = i;
        btnNum.onclick = () => {
            paginaActual = i;
            renderizarTabla();
        };
        contenedorPaginacion.appendChild(btnNum);
    }

    // Botón Siguiente
    const btnSig = document.createElement('button');
    btnSig.className = 'btn-page';
    btnSig.innerHTML = 'Siguiente &gt;';
    btnSig.disabled = paginaActual === totalPaginas || totalPaginas === 0;
    btnSig.onclick = () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderizarTabla();
        }
    };
    contenedorPaginacion.appendChild(btnSig);
}

// 4. Modal para ver Biografía
function verBiografia(id) {
    const autor = autoresData.find(a => a.id === id);
    if (!autor) return;

    const primerNombre = autor.nombre || '';
    const apellido = autor.apellido || '';
    const iniciales = (primerNombre.charAt(0) + (apellido ? apellido.charAt(0) : '')).toUpperCase();

    if (modalAvatar) modalAvatar.textContent = iniciales || 'AU';
    if (modalNombreAutor) modalNombreAutor.textContent = `${primerNombre} ${apellido}`.trim();
    if (modalMetaAutor) modalMetaAutor.textContent = `${autor.nacionalidad || 'Nacionalidad N/A'} · Nacimiento: ${autor.fecha_nacimiento || 'N/A'}`;
    if (modalTextoBiografia) modalTextoBiografia.textContent = autor.biografia || 'Este autor no cuenta con una biografía o descripción registrada en el sistema.';

    if (modalBiografia) modalBiografia.classList.remove('hidden');
}

function cerrarModal() {
    if (modalBiografia) modalBiografia.classList.add('hidden');
}

if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
if (modalBiografia) {
    modalBiografia.addEventListener('click', (e) => {
        if (e.target === modalBiografia) cerrarModal();
    });
}

// 5. Métricas
function actualizarMetricas(lista) {
    if (metricTotal) metricTotal.textContent = lista.length;
    if (metricConObras) metricConObras.textContent = lista.length;
}

// 6. Buscador
if (inputBuscar) {
    inputBuscar.addEventListener('input', () => {
        const termino = inputBuscar.value.toLowerCase().trim();
        autoresFiltrados = autoresData.filter(a => 
            (a.nombre || '').toLowerCase().includes(termino) ||
            (a.apellido || '').toLowerCase().includes(termino) ||
            (a.nacionalidad || '').toLowerCase().includes(termino)
        );
        paginaActual = 1;
        renderizarTabla();
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

// 7. Guardar / Editar (POST / PUT)
if (formAutor) {
    formAutor.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            nombre: document.getElementById('nombre').value.trim(),
            apellido: document.getElementById('apellido').value.trim(),
            nacionalidad: document.getElementById('nacionalidad').value.trim(),
            fecha_nacimiento: document.getElementById('fecha_nacimiento').value || null,
            biografia: document.getElementById('biografia').value.trim()
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

// 8. Cargar Edición
function cargarEdicion(id) {
    const autor = autoresData.find(a => a.id === id);
    if (!autor) return;

    editandoId = id;

    document.getElementById('nombre').value = autor.nombre || '';
    document.getElementById('apellido').value = autor.apellido || '';
    document.getElementById('nacionalidad').value = autor.nacionalidad || '';
    document.getElementById('fecha_nacimiento').value = autor.fecha_nacimiento || '';
    document.getElementById('biografia').value = autor.biografia || '';

    if (charCounter) charCounter.textContent = `${(autor.biografia || '').length} / 300`;

    const formTitle = document.getElementById('form-title');
    const btnSubmitText = document.getElementById('btn-submit-text');
    if (formTitle) formTitle.textContent = 'Editar Autor';
    if (btnSubmitText) btnSubmitText.textContent = 'Actualizar autor';
}

// 9. Eliminar
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

// 10. Resetear
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
if (btnCancelar) btnCancelar.addEventListener('click', resetearFormulario);

if (biografiaTextarea && charCounter) {
    biografiaTextarea.addEventListener('input', (e) => {
        charCounter.textContent = `${e.target.value.length} / 300`;
    });
}

document.addEventListener('DOMContentLoaded', obtenerAutores);