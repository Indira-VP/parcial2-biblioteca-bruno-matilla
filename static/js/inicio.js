document.addEventListener('DOMContentLoaded', () => {
    // Variables de Paginación
    let actividadData = [];
    let paginaActual = 1;
    const registrosPorPagina = 10;

    // Elementos del DOM
    const tablaActividad = document.getElementById('tabla-actividad');
    const infoActividad = document.getElementById('info-actividad');
    const contenedorPaginacion = document.getElementById('contenedor-paginacion-inicio');
    const metricAutores = document.getElementById('metric-autores');
    const metricLibros = document.getElementById('metric-libros');
    const metricPrestamos = document.getElementById('metric-prestamos');
    const btnActualizar = document.getElementById('btn-actualizar-inicio');

    // 1. Cargar datos del panel principal
    async function cargarPanelPrincipal() {
        try {
            // Petición a la API real de Autores
            const resAutores = await fetch('/api/autores/');
            const autores = resAutores.ok ? await resAutores.json() : [];

            if (metricAutores) metricAutores.textContent = autores.length;

            actividadData = [];

            // Convertir todos los autores cargados en eventos del feed
            autores.forEach(a => {
                actividadData.push({
                    codigo: `#AUT-${String(a.id).padStart(2, '0')}`,
                    moduloClass: 'autor',
                    moduloNombre: 'Autor',
                    icono: 'ri-user-add-line',
                    descripcion: `${a.nombre} ${a.apellido || ''}`.trim(),
                    responsable: 'Sistema / Registro',
                    fecha: a.fecha_nacimiento || '2026-10-15',
                    estado: 'Registrado',
                    estadoClass: 'registrado'
                });
            });

            // Muestras de Préstamos y Libros
            actividadData.push(
                {
                    codigo: '#PR-101',
                    moduloClass: 'prestamo',
                    moduloNombre: 'Préstamo',
                    icono: 'ri-swap-line',
                    descripcion: 'Cien años de soledad',
                    responsable: 'Carlos Restrepo',
                    fecha: '2026-10-14',
                    estado: 'Activo',
                    estadoClass: 'activo'
                },
                {
                    codigo: '#LIB-042',
                    moduloClass: 'libro',
                    moduloNombre: 'Libro',
                    icono: 'ri-book-line',
                    descripcion: 'Estructuras de Datos en Java',
                    responsable: 'David Caicedo',
                    fecha: '2026-10-12',
                    estado: 'Disponible',
                    estadoClass: 'disponible'
                }
            );

            // Muestras suplementarias
            if (metricLibros) metricLibros.textContent = '142';
            if (metricPrestamos) metricPrestamos.textContent = '18';

            paginaActual = 1;
            renderizarTablaActividad();

        } catch (error) {
            console.error('Error al cargar datos en el inicio:', error);
        }
    }

    // 2. Renderizar tabla según la página actual
    function renderizarTablaActividad() {
        if (!tablaActividad) return;
        tablaActividad.innerHTML = '';

        if (actividadData.length === 0) {
            tablaActividad.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No hay registros recientes.</td></tr>`;
            if (infoActividad) infoActividad.textContent = 'Mostrando 0 registros';
            if (contenedorPaginacion) contenedorPaginacion.innerHTML = '';
            return;
        }

        const inicio = (paginaActual - 1) * registrosPorPagina;
        const fin = inicio + registrosPorPagina;
        const itemsPagina = actividadData.slice(inicio, fin);

        itemsPagina.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="id-badge">${item.codigo}</td>
                <td>
                    <span class="badge-modulo ${item.moduloClass}">
                        <i class="${item.icono}"></i> ${item.moduloNombre}
                    </span>
                </td>
                <td><strong>${item.descripcion}</strong></td>
                <td>${item.responsable}</td>
                <td>${item.fecha}</td>
                <td><span class="status-pill ${item.estadoClass}">${item.estado}</span></td>
            `;
            tablaActividad.appendChild(tr);
        });

        actualizarControlesPaginacion();
    }

    // 3. Renderizar botones numéricos y controles anterior/siguiente
    function actualizarControlesPaginacion() {
        const totalRegistros = actividadData.length;
        const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

        const inicioMostrado = (paginaActual - 1) * registrosPorPagina + 1;
        const finMostrado = Math.min(paginaActual * registrosPorPagina, totalRegistros);

        if (infoActividad) {
            infoActividad.textContent = `Mostrando ${inicioMostrado} - ${finMostrado} de ${totalRegistros} registros`;
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
                renderizarTablaActividad();
            }
        };
        contenedorPaginacion.appendChild(btnAnt);

        // Botones Numéricos
        for (let i = 1; i <= totalPaginas; i++) {
            const btnNum = document.createElement('button');
            btnNum.className = `btn-page ${i === paginaActual ? 'active' : ''}`;
            btnNum.textContent = i;
            btnNum.onclick = () => {
                paginaActual = i;
                renderizarTablaActividad();
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
                renderizarTablaActividad();
            }
        };
        contenedorPaginacion.appendChild(btnSig);
    }

    if (btnActualizar) {
        btnActualizar.addEventListener('click', cargarPanelPrincipal);
    }

    cargarPanelPrincipal();
});