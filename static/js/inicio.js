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

    // 1. Cargar datos reales y dinámicos del panel principal
    async function cargarPanelPrincipal() {
        try {
            // Consultar las 3 APIs REST en paralelo
            const [resAutores, resLibros, resPrestamos] = await Promise.allSettled([
                fetch('/api/autores/').then(r => r.ok ? r.json() : []),
                fetch('/api/libros/').then(r => r.ok ? r.json() : []),
                fetch('/api/prestamos/').then(r => r.ok ? r.json() : [])
            ]);

            const autores = resAutores.status === 'fulfilled' ? resAutores.value : [];
            const libros = resLibros.status === 'fulfilled' ? resLibros.value : [];
            const prestamos = resPrestamos.status === 'fulfilled' ? resPrestamos.value : [];

            // Actualizar Métricas Reales (KPIs)
            if (metricAutores) metricAutores.textContent = autores.length;
            if (metricLibros) metricLibros.textContent = libros.length;

            // Calcular préstamos activos
            const prestamosActivos = prestamos.filter(p => 
                String(p.estado || '').toLowerCase() === 'activo' || 
                String(p.estado || '').toLowerCase() === 'prestado'
            ).length;

            if (metricPrestamos) metricPrestamos.textContent = prestamosActivos;

            // Construir Feed de Actividad Unificado con Datos Reales
            actividadData = [];

            // A. Registros de Autores
            autores.forEach(a => {
                actividadData.push({
                    codigo: `#AUT-${String(a.id).padStart(2, '0')}`,
                    moduloClass: 'autor',
                    moduloNombre: 'Autor',
                    icono: 'ri-user-add-line',
                    descripcion: `${a.nombre || ''} ${a.apellido || ''}`.trim(),
                    responsable: 'Sistema / Registro',
                    fecha: a.fecha_nacimiento || '2026-10-15',
                    estado: 'Registrado',
                    estadoClass: 'registrado',
                    sortKey: a.id
                });
            });

            // B. Registros de Libros
            libros.forEach(l => {
                actividadData.push({
                    codigo: `#LIB-${String(l.id).padStart(3, '0')}`,
                    moduloClass: 'libro',
                    moduloNombre: 'Libro',
                    icono: 'ri-book-line',
                    descripcion: l.titulo || 'Libro sin título',
                    responsable: l.autor ? `Autor: ${l.autor}` : 'Sistema / Registro',
                    fecha: l.anio_publicacion ? String(l.anio_publicacion) : '2026-10-15',
                    estado: 'Disponible',
                    estadoClass: 'disponible',
                    sortKey: l.id
                });
            });

            // C. Registros de Préstamos
            prestamos.forEach(p => {
                const estadoLower = String(p.estado || 'activo').toLowerCase();
                let estadoClass = 'activo';
                if (estadoLower.includes('devuelto') || estadoLower.includes('finalizado')) {
                    estadoClass = 'registrado';
                } else if (estadoLower.includes('vencido') || estadoLower.includes('atrasado')) {
                    estadoClass = 'mantenimiento';
                }

                actividadData.push({
                    codigo: `#PR-${String(p.id).padStart(3, '0')}`,
                    moduloClass: 'prestamo',
                    moduloNombre: 'Préstamo',
                    icono: 'ri-swap-line',
                    descripcion: p.ejemplar_detalle || p.libro_titulo || `Préstamo Ejemplar #${p.ejemplar || p.id}`,
                    responsable: p.solicitante || p.usuario || 'Usuario Biblioteca',
                    fecha: p.fecha_prestamo || p.fecha_salida || '2026-10-15',
                    estado: p.estado || 'Activo',
                    estadoClass: estadoClass,
                    sortKey: p.id
                });
            });

            // Ordenar de más reciente a más antiguo por ID
            actividadData.sort((a, b) => b.sortKey - a.sortKey);

            paginaActual = 1;
            renderizarTablaActividad();

        } catch (error) {
            console.error('Error al cargar datos reales en el Dashboard:', error);
        }
    }

    // 2. Renderizar tabla según la página actual
    function renderizarTablaActividad() {
        if (!tablaActividad) return;
        tablaActividad.innerHTML = '';

        if (actividadData.length === 0) {
            tablaActividad.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No hay registros recientes en la base de datos.</td></tr>`;
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

        const inicioMostrado = totalRegistros > 0 ? (paginaActual - 1) * registrosPorPagina + 1 : 0;
        const finMostrado = Math.min(paginaActual * registrosPorPagina, totalRegistros);

        if (infoActividad) {
            infoActividad.textContent = `Mostrando ${inicioMostrado} a ${finMostrado} de ${totalRegistros} registros`;
        }

        if (!contenedorPaginacion) return;
        contenedorPaginacion.innerHTML = '';

        if (totalPaginas <= 1) return;

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