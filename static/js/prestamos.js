

document.addEventListener("DOMContentLoaded", () => {
    const API_PRESTAMOS = "/api/prestamos/";

    // Buscamos los elementos que vamos a usar en la página.
    const formulario = document.getElementById("formPrestamo");
    const tablaPrestamos = document.getElementById("tablaPrestamos");
    const mensajeExito = document.getElementById("mensajeExito");
    const mensajeError = document.getElementById("mensajeError");
    const campoBusqueda = document.getElementById("buscarPrestamo");
    const filtroEstado = document.getElementById("filtroEstado");
    const fechaPrestamo = document.getElementById("fechaPrestamo");
    const duracionPrestamo = document.getElementById("duracionPrestamo");
    const fechaDevolucion = document.getElementById("fechaDevolucion");

    const botonGuardar = formulario?.querySelector('button[type="submit"]');
    const botonCancelar = formulario?.querySelector('button[type="reset"]');

    // Aquí guardamos los préstamos que recibimos de la API
// para mostrarlos, buscarlos y filtrarlos sin otra consulta

// Si vale null, estamos creando un préstamo nuevo
// Si tiene un ID, estamos editando un préstamo existente
    let prestamos = [];
    let prestamoEditandoId = null;

    // Evitamos que los datos ingresados se interpreten como etiquetas HTML.
    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]);
    }

    // Convertimos la fecha para poder trabajar con ella.
    function convertirFecha(fecha) {
        if (!fecha) return null;

        const partes = String(fecha).split("-");

        if (partes.length !== 3) return null;

        const [anio, mes, dia] = partes.map(Number);
        const resultado = new Date(anio, mes - 1, dia);

        return Number.isNaN(resultado.getTime()) ? null : resultado;
    }

    // Mostramos las fechas en un formato más fácil de leer.
    function mostrarFecha(fecha) {
        const fechaConvertida = convertirFecha(fecha);

        return fechaConvertida
            ? fechaConvertida.toLocaleDateString("es-CO")
            : "—";
    }

    // Obtenemos la fecha de hoy sin problemas con el formato.
    function obtenerFechaLocal() {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }

    // Calculamos la fecha de devolución según los días seleccionados.
    function calcularFechaDevolucion() {
        if (!fechaPrestamo || !duracionPrestamo || !fechaDevolucion) {
            return;
        }

        if (!fechaPrestamo.value || !duracionPrestamo.value) {
            fechaDevolucion.value = "";
            return;
        }

        const fecha = convertirFecha(fechaPrestamo.value);

        if (!fecha) {
            fechaDevolucion.value = "";
            return;
        }

        fecha.setDate(fecha.getDate() + Number(duracionPrestamo.value));

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");

        fechaDevolucion.value = `${anio}-${mes}-${dia}`;
    }

    // Revisamos si el préstamo sigue activo, ya venció o fue devuelto.
    function obtenerEstado(prestamo) {
        if (prestamo.estado === "devuelto") {
            return "devuelto";
        }
     // Convierte la fecha prevista de devolución en un objeto de fecha
        const fechaLimite = convertirFecha(
            // Obtiene la fecha límite guardada en el préstamo.
            prestamo.fecha_devolucion_prevista
        );

        const hoy = convertirFecha(obtenerFechaLocal());

        if (
            fechaLimite &&
            hoy &&
             // Compara las fechas para saber si el préstamo está vencido
            fechaLimite.getTime() < hoy.getTime()
        ) {
            // Si pasó la fecha límite, retorna el estado "vencido"
            return "vencido";
        }
        //si no está vencido ni devuelto,
        // conserva su estado o usa prestado por defecto
        return prestamo.estado || "prestado";
    }

    // Mostramos un mensaje cuando una acción 
    // sale bien o presenta un error
    function mostrarMensaje(tipo, mensaje) {
        const elemento = tipo === "exito" ? mensajeExito : mensajeError;
        
        const otro = tipo === "exito" ? mensajeError : mensajeExito;

        if (otro) {
            otro.textContent = "";
            otro.hidden = true;
        }

        if (elemento) {
            elemento.textContent = mensaje;
            elemento.hidden = false;

            setTimeout(() => {
                elemento.hidden = true;
                elemento.textContent = "";
            }, 4000);
        } else {
            alert(mensaje);
        }
    }

    // Enviamos las solicitudes al servidor y revisamos si hubo algún error.
    async function enviarSolicitud(url, opciones = {}) {
        const respuesta = await fetch(url, {
            ...opciones,
            headers: {
                ...(opciones.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...(opciones.headers || {})
            }
        });

        if (!respuesta.ok) {
            let detalle = "No se pudo completar la solicitud.";

            try {
                const datos = await respuesta.json();

                detalle = Object.entries(datos)
                    .map(([campo, errores]) =>
                        `${campo}: ${
                            Array.isArray(errores)
                                ? errores.join(", ")
                                : typeof errores === "object"
                                    ? JSON.stringify(errores)
                                    : errores
                        }`
                    )
                    .join(" | ") || detalle;
            } catch {
                // Si el servidor no devuelve detalles, mostramos el mensaje general.
            }

            throw new Error(detalle);
        }

        if (respuesta.status === 204) return null;

        const contenido = await respuesta.text();

        return contenido ? JSON.parse(contenido) : null;
    }

    // Pintamos los préstamos en la tabla con sus datos y botones.
    function mostrarPrestamos(lista) {
        if (!tablaPrestamos) return;

        if (!lista.length) {
            tablaPrestamos.innerHTML = `
                <tr>
                    <td colspan="7">No hay préstamos registrados.</td>
                </tr>
            `;

            actualizarEstadisticas();
            return;
        }

        tablaPrestamos.innerHTML = lista.map(prestamo => {
            const estado = obtenerEstado(prestamo);
            const id = escaparHTML(prestamo.id);

            return `
                <tr>
                    <td>${id}</td>
                    <td>—</td>
                    <td>${escaparHTML(prestamo.solicitante)}</td>
                    <td>${escaparHTML(mostrarFecha(prestamo.fecha_prestamo))}</td>
                    <td>${escaparHTML(mostrarFecha(prestamo.fecha_devolucion_prevista))}</td>
                    <td>
                        <span class="estado ${escaparHTML(estado)}">
                            ${escaparHTML(
                                estado.charAt(0).toUpperCase() + estado.slice(1)
                            )}
                        </span>
                    </td>
                    <td class="acciones-tabla">
                        <button
                            type="button"
                            class="btn-editar"
                            data-accion="editar"
                            data-id="${id}"
                            title="Editar préstamo"
                            aria-label="Editar préstamo ${id}">
                            /
                        </button>

                        <button
                            type="button"
                            class="btn-eliminar"
                            data-accion="eliminar"
                            data-id="${id}"
                            title="Eliminar préstamo"
                            aria-label="Eliminar préstamo ${id}">
                            X
                        </button>

                        <button
                            type="button"
                            class="btn-devolver"
                            data-accion="devolver"
                            data-id="${id}"
                            title="Marcar como devuelto"
                            aria-label="Marcar préstamo ${id} como devuelto"
                            ${estado === "devuelto" ? "disabled" : ""}>
                            ✓
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        actualizarEstadisticas();
    }

    // Actualizamos los contadores que aparecen en la página.
    function actualizarEstadisticas() {
        const total = prestamos.length;

        const activos = prestamos.filter(
            prestamo => obtenerEstado(prestamo) === "prestado"
        ).length;

        const vencidos = prestamos.filter(
            prestamo => obtenerEstado(prestamo) === "vencido"
        ).length;

        const devueltos = prestamos.filter(
            prestamo => obtenerEstado(prestamo) === "devuelto"
        ).length;

        const posiblesIds = {
            totalPrestamos: total,
            prestamosActivos: activos,
            prestamosVencidos: vencidos,
            prestamosDevueltos: devueltos
        };

        Object.entries(posiblesIds).forEach(([id, cantidad]) => {
            const elemento = document.getElementById(id);

            if (elemento) {
                elemento.textContent = cantidad;
            }
        });
    }

    // Aplicamos la búsqueda por solicitante o identificación y el filtro de estado.
    function aplicarFiltros() {
        const busqueda = campoBusqueda?.value.trim().toLowerCase() || "";
        const estadoSeleccionado = filtroEstado?.value || "";

        const filtrados = prestamos.filter(prestamo => {
            const coincideBusqueda =
                String(prestamo.solicitante || "")
                    .toLowerCase()
                    .includes(busqueda) ||
                String(prestamo.identificacion || "")
                    .toLowerCase()
                    .includes(busqueda);

            const coincideEstado =
                !estadoSeleccionado ||
                obtenerEstado(prestamo) === estadoSeleccionado;

            return coincideBusqueda && coincideEstado;
        });

        mostrarPrestamos(filtrados);
    }

    // Traemos los préstamos guardados en el servidor.
    async function cargarPrestamos() {
        try {
            const datos = await enviarSolicitud(API_PRESTAMOS);

            prestamos = Array.isArray(datos)
                ? datos
                : datos.results || [];

            aplicarFiltros();
        } catch (error) {
            mostrarMensaje(
                "error",
                `No se pudieron cargar los préstamos: ${error.message}`
            );
        }
    }

    // Dejamos el formulario listo para registrar otro préstamo.
    function limpiarFormulario() {
        prestamoEditandoId = null;
        formulario?.reset();

        if (fechaPrestamo) {
            fechaPrestamo.value = obtenerFechaLocal();
        }

        calcularFechaDevolucion();

        if (botonGuardar) {
            botonGuardar.textContent = "Guardar préstamo";
        }
    }

    // Cargamos en el formulario los datos del préstamo que se quiere editar.
    function editarPrestamo(prestamo) {
        prestamoEditandoId = prestamo.id;

        formulario.elements["solicitante"].value =
            prestamo.solicitante || "";

        formulario.elements["identificacion"].value =
            prestamo.identificacion || "";

        fechaPrestamo.value = prestamo.fecha_prestamo || "";

        fechaDevolucion.value =
            prestamo.fecha_devolucion_prevista || "";

        formulario.elements["observaciones"].value =
            prestamo.observaciones || "";

        const fechaInicio = convertirFecha(prestamo.fecha_prestamo);
        const fechaFin = convertirFecha(
            prestamo.fecha_devolucion_prevista
        );

        if (fechaInicio && fechaFin && duracionPrestamo) {
            const dias = Math.round(
                (fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)
            );

            const opcionExiste = Array.from(
                duracionPrestamo.options
            ).some(opcion => Number(opcion.value) === dias);

            if (opcionExiste) {
                duracionPrestamo.value = String(dias);
            }
        }

        if (botonGuardar) {
            botonGuardar.textContent = "Actualizar préstamo";
        }

        formulario.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    // Guardamos un préstamo nuevo o actualizamos uno que ya existe.
    formulario?.addEventListener("submit", async evento => {
        evento.preventDefault();

        const solicitante =
            formulario.elements["solicitante"].value.trim();

        const identificacion =
            formulario.elements["identificacion"].value.trim();

        const observaciones =
            formulario.elements["observaciones"].value.trim();

        if (
            !solicitante ||
            !identificacion ||
            !fechaPrestamo.value ||
            !fechaDevolucion.value
        ) {
            mostrarMensaje("error", "Completa los campos obligatorios.");
            return;
        }

        const prestamoOriginal = prestamos.find(
            prestamo => prestamo.id === prestamoEditandoId
        );

        const datos = {
            solicitante,
            identificacion,
            fecha_prestamo: fechaPrestamo.value,
            fecha_devolucion_prevista: fechaDevolucion.value,
            estado: prestamoOriginal?.estado || "prestado",
            observaciones
        };

        // Conservamos los ejemplares asociados si el préstamo ya los tiene.
        if (prestamoOriginal?.ejemplares) {
            datos.ejemplares = prestamoOriginal.ejemplares;
        }

        try {
            if (prestamoEditandoId !== null) {
                await enviarSolicitud(
                    `${API_PRESTAMOS}${prestamoEditandoId}/`,
                    {
                        method: "PUT",
                        body: JSON.stringify(datos)
                    }
                );

                mostrarMensaje(
                    "exito",
                    "El préstamo se actualizó correctamente."
                );
            } else {
                await enviarSolicitud(API_PRESTAMOS, {
                    method: "POST",
                    body: JSON.stringify(datos)
                });

                mostrarMensaje(
                    "exito",
                    "El préstamo se registró correctamente."
                );
            }

            limpiarFormulario();
            await cargarPrestamos();
        } catch (error) {
            mostrarMensaje(
                "error",
                `No se pudo guardar el préstamo: ${error.message}`
            );
        }
    });
// Escuchamos los clics de los botones de todas las filas
// Según la acción editamos, eliminamos o  marcamos como devuelto el préstamo
    tablaPrestamos?.addEventListener("click", async evento => {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.accion;

        const prestamo = prestamos.find(
            elemento => String(elemento.id) === String(id)
        );

        if (!prestamo) {
            mostrarMensaje("error", "No se encontró ese préstamo.");
            return;
        }

        if (accion === "editar") {
            editarPrestamo(prestamo);
            return;
        }
        // Pedimos confirmación antes de borrar el préstamo.
        // Si se confirma, enviamos DELETE a la API
        if (accion === "eliminar") {
            if (!confirm(`¿Seguro que deseas eliminar el préstamo #${id}?`)) {
                return;
            }

            try {
                await enviarSolicitud(`${API_PRESTAMOS}${id}/`, {
                    method: "DELETE"
                });

                mostrarMensaje(
                    "exito",
                    "El préstamo se eliminó correctamente."
                );

                if (String(prestamoEditandoId) === String(id)) {
                    limpiarFormulario();
                }

                await cargarPrestamos();
            } catch (error) {
                mostrarMensaje(
                    "error",
                    `No se pudo eliminar el préstamo: ${error.message}`
                );
            }

            return;
        }

        // Pedimos confirmación y enviamos PATCH para cambiar el estado
        // del préstamo a "devuelto". Después volvemos a cargar la tabla
        if (accion === "devolver") {
            if (obtenerEstado(prestamo) === "devuelto") return;

            if (!confirm(`¿Marcar el préstamo #${id} como devuelto?`)) {
                return;
            }

            try {
                await enviarSolicitud(`${API_PRESTAMOS}${id}/`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        estado: "devuelto"
                    })
                });

                mostrarMensaje(
                    "exito",
                    "El préstamo se marcó como devuelto."
                );

                await cargarPrestamos();
            } catch (error) {
                mostrarMensaje(
                    "error",
                    `No se pudo devolver el préstamo: ${error.message}`
                );
            }
        }
    });

    // Si se cancela la edición, dejamos el formulario vacío otra vez.
    botonCancelar?.addEventListener("click", limpiarFormulario);

    // Actualizamos la tabla cada vez que cambia la búsqueda o el filtro.
    campoBusqueda?.addEventListener("input", aplicarFiltros);
    filtroEstado?.addEventListener("change", aplicarFiltros);

    // Al abrir la página, mostramos los préstamos que ya están guardados.
    if (fechaPrestamo && !fechaPrestamo.value) {
        fechaPrestamo.value = obtenerFechaLocal();
    }

    fechaPrestamo?.addEventListener("change", calcularFechaDevolucion);
duracionPrestamo?.addEventListener("change", calcularFechaDevolucion);
// Al iniciar la página, ponemos la fecha actual si está vacía,
// calculamos la fecha de devolución y cargamos los préstamos
    calcularFechaDevolucion();
    cargarPrestamos();
});
