// ======================================================
// BIBLIOTECA BRUNO MATILLA PINTO
// Gestión de Libros
// ======================================================

// Rutas de la API.
// Las verificaremos cuando revisemos las urls.py de Django.
const API_LIBROS = "/api/libros/";
const API_AUTORES = "/api/autores/";

// Estado de la interfaz
let libros = [];
let librosFiltrados = [];
let paginaActual = 1;

const LIBROS_POR_PAGINA = 5;
let libroEditandoId = null;

// Elementos HTML
const formularioLibro = document.getElementById("formulario-libro");
const formularioBusqueda = document.getElementById("formulario-busqueda");

const tablaLibros = document.getElementById("tabla-libros");
const selectorAutor = document.getElementById("autor");

const campoBusqueda = document.getElementById("busqueda");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroEstado = document.getElementById("filtro-estado");

const contadorLibros = document.getElementById("contador-libros");
const totalEjemplares = document.getElementById("total-ejemplares");
const totalTitulos = document.getElementById("total-titulos");

const mensajeFormulario = document.getElementById("mensaje-formulario");


// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

function mostrarMensaje(mensaje, tipo = "info") {
    if (!mensajeFormulario) return;

    mensajeFormulario.textContent = mensaje;
    mensajeFormulario.dataset.tipo = tipo;
}

function limpiarMensaje() {
    if (!mensajeFormulario) return;

    mensajeFormulario.textContent = "";
    delete mensajeFormulario.dataset.tipo;
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => {
        const caracteres = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return caracteres[caracter];
    });
}
function obtenerEstadoLibro(libro) {
    const ejemplares = Array.isArray(libro.ejemplares)
        ? libro.ejemplares
        : [];

    if (ejemplares.length === 0) {
        return "sin_ejemplares";
    }

    if (ejemplares.some(ejemplar => ejemplar.estado === "disponible")) {
        return "disponible";
    }

    if (ejemplares.some(ejemplar => ejemplar.estado === "prestado")) {
        return "prestado";
    }

    return "mantenimiento";
}
async function consultarAPI(url) {
    const respuesta = await fetch(url, {
        headers: {
            "Accept": "application/json"
        }
    });

    if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
    }

    return await respuesta.json();
}


// ======================================================
// CARGAR AUTORES
// ======================================================

async function cargarAutores() {
    if (!selectorAutor) return;

    selectorAutor.innerHTML =
        '<option value="">Cargando autores...</option>';

    try {
        const datos = await consultarAPI(API_AUTORES);

        // DRF puede devolver una lista o una respuesta paginada.
        const autores = Array.isArray(datos)
            ? datos
            : datos.results ?? [];

        selectorAutor.innerHTML =
            '<option value="">Selecciona un autor...</option>';

        autores.forEach(autor => {
            const opcion = document.createElement("option");

            const nombreCompleto = [
                autor.nombre,
                autor.apellido
            ].filter(Boolean).join(" ");

            const nombre = nombreCompleto ||
                autor.nombre_completo ||
                autor.nombre;

            if (!nombre) return;

            opcion.value = autor.id;
            opcion.textContent = nombre;

            selectorAutor.appendChild(opcion);
        });

        if (autores.length === 0) {
            selectorAutor.innerHTML =
                '<option value="">No hay autores registrados</option>';
        }

    } catch (error) {
        console.error("No se pudieron cargar los autores:", error);

        selectorAutor.innerHTML =
            '<option value="">No se pudieron cargar los autores</option>';
    }
}

/*
function cargarAutores() {
    if (!selectorAutor) return;

    selectorAutor.placeholder = "Escribe el nombre del autor";
}
*/



// ======================================================
// CARGAR LIBROS
// ======================================================

async function cargarLibros() {
    if (!tablaLibros) return;

    tablaLibros.innerHTML = `
        <tr>
            <td colspan="7" class="tabla-vacia">
                Cargando catálogo...
            </td>
        </tr>
    `;

    try {
        const datos = await consultarAPI(API_LIBROS);

        // Admite listas normales y respuestas paginadas de DRF.
        libros = Array.isArray(datos)
            ? datos
            : datos.results ?? [];

        librosFiltrados = [...libros];
        paginaActual = 1;

        actualizarResumen();
        aplicarFiltros();

    } catch (error) {
        console.error("No se pudieron cargar los libros:", error);

        tablaLibros.innerHTML = `
            <tr>
                <td colspan="7" class="tabla-vacia">
                    No fue posible cargar el catálogo.
                    Verifica las rutas de la API.
                </td>
            </tr>
        `;

        if (contadorLibros) {
            contadorLibros.textContent = "Error al consultar el catálogo.";
        }
    }
}


// ======================================================
// ACTUALIZAR RESUMEN
// ======================================================

function actualizarResumen() {
    if (totalTitulos) {
        totalTitulos.textContent =
            `${libros.length} títulos`;
    }

    if (totalEjemplares) {
        const cantidad = libros.reduce((total, libro) => {
            const ejemplares = libro.ejemplares;

            if (Array.isArray(ejemplares)) {
                return total + ejemplares.length;
            }

            return total;
        }, 0);

        totalEjemplares.textContent =
            `${cantidad} ejemplares`;
    }
}


// ======================================================
// BÚSQUEDA Y FILTROS
// ======================================================

function aplicarFiltros() {
    const texto = campoBusqueda.value.trim().toLowerCase();
    const tipo = filtroTipo.value;
    const estado = filtroEstado.value;

    librosFiltrados = libros.filter(libro => {
        const titulo = String(libro.titulo ?? "").toLowerCase();
        const autor = String(libro.autor_nombre ?? libro.autor ?? "")
            .toLowerCase();
        const isbn = String(libro.isbn ?? "").toLowerCase();
        const genero = String(
            libro.genero_area ?? libro.genero ?? ""
        ).toLowerCase();

        const coincideTexto =
            titulo.includes(texto) ||
            autor.includes(texto) ||
            isbn.includes(texto) ||
            genero.includes(texto);

        const coincideTipo =
            !tipo || libro.tipo_publicacion === tipo;

        // Se admite el estado del primer ejemplar cuando el
        // serializador devuelve una lista de ejemplares.
        const estadoLibro = libro.estado ??
            libro.ejemplares?.[0]?.estado ??
            "";

        const coincideEstado =
            !estado || estadoLibro === estado;

        return coincideTexto && coincideTipo && coincideEstado;
    });

    paginaActual = 1;
    mostrarLibros();
}


// ======================================================
// MOSTRAR LIBROS EN LA TABLA
// ======================================================

function mostrarLibros() {
    if (!tablaLibros) return;

    const inicio = (paginaActual - 1) * LIBROS_POR_PAGINA;

    const librosPagina = librosFiltrados.slice(
        inicio,
        inicio + LIBROS_POR_PAGINA
    );

    if (librosPagina.length === 0) {
        tablaLibros.innerHTML = `
            <tr>
                <td colspan="7" class="tabla-vacia">
                    No se encontraron libros.
                </td>
            </tr>
        `;

        actualizarPaginacion();
        return;
    }

    tablaLibros.innerHTML = librosPagina.map(libro => {
        const ejemplares = Array.isArray(libro.ejemplares)
    ? libro.ejemplares
    : [];

const codigo = `LIB-${String(libro.id).padStart(3, "0")}`;

const estado = obtenerEstadoLibro(libro);

const estados = {
    disponible: "Disponible",
    prestado: "Prestado",
    mantenimiento: "En mantenimiento",
    sin_ejemplares: "Sin ejemplares"
};

        const titulo = escaparHTML(libro.titulo);
        const autor = escaparHTML(
            libro.autor_nombre ?? libro.autor ?? "Sin autor"
        );
        const isbn = escaparHTML(libro.isbn || "Sin ISBN");
        const editorial = escaparHTML(libro.editorial || "");
        const genero = escaparHTML(
            libro.genero_area ?? libro.genero ?? "Sin categoría"
        );
        const anio = escaparHTML(libro.anio_publicacion ?? "—");
        const estadoTexto = escaparHTML(estados[estado] ?? estado);
        const codigoSeguro = escaparHTML(codigo);

        return `
            <tr>
                <td>
                    <strong>#${codigoSeguro}</strong>
                    <small>ID: ${escaparHTML(libro.id)}</small>
                </td>

                <td>
                    <strong>${titulo}</strong>
                    <small>
                        ${isbn}
                        ${editorial ? " · " + editorial : ""}
                    </small>
                </td>

                <td>${autor}</td>

                <td>
                    <span class="etiqueta-tipo">
                        ${escaparHTML(libro.tipo_publicacion ?? "libro")}
                    </span>
                    <small>${genero}</small>
                </td>

                <td>${anio}</td>

                <td>
                    <span class="estado estado-${escaparHTML(estado)}">
                        ${estadoTexto}
                    </span>
                </td>

                <td class="acciones-tabla">
                    <button
                        type="button"
                        data-accion="ver"
                        data-id="${escaparHTML(libro.id)}"
                        aria-label="Ver libro"
                        title="Ver detalles"
                    >◉</button>

                    <button
                        type="button"
                        data-accion="editar"
                        data-id="${escaparHTML(libro.id)}"
                        aria-label="Editar libro"
                        title="Editar"
                    >✎</button>

                    <button
                        type="button"
                        data-accion="eliminar"
                        data-id="${escaparHTML(libro.id)}"
                        aria-label="Eliminar libro"
                        title="Eliminar"
                    >▤</button>
                </td>
            </tr>
        `;
    }).join("");

    actualizarPaginacion();
}


// ======================================================
// PAGINACIÓN
// ======================================================

function actualizarPaginacion() {
    const total = librosFiltrados.length;
    const paginas = Math.max(
        1,
        Math.ceil(total / LIBROS_POR_PAGINA)
    );

    const inicio = total === 0
        ? 0
        : (paginaActual - 1) * LIBROS_POR_PAGINA + 1;

    const fin = Math.min(
        paginaActual * LIBROS_POR_PAGINA,
        total
    );

    if (contadorLibros) {
        contadorLibros.textContent =
            `Mostrando ${inicio}-${fin} de ${total} libros`;
    }

    const paginaTexto = document.getElementById("pagina-actual");
    const botonAnterior = document.getElementById("pagina-anterior");
    const botonSiguiente = document.getElementById("pagina-siguiente");

    if (paginaTexto) {
        paginaTexto.textContent = `${paginaActual} / ${paginas}`;
    }

    if (botonAnterior) {
        botonAnterior.disabled = paginaActual <= 1;
    }

    if (botonSiguiente) {
        botonSiguiente.disabled = paginaActual >= paginas;
    }
}

function consultarLibro(id) {
    const libro = libros.find(libro => String(libro.id) === String(id));

    if (!libro) {
        alert("No se encontró el libro seleccionado.");
        return;
    }

    const ejemplares = Array.isArray(libro.ejemplares)
        ? libro.ejemplares
        : [];

    const detalles = `
Título: ${libro.titulo}
Autor: ${libro.autor_nombre ?? libro.autor ?? "Sin autor"}
Tipo: ${libro.tipo_publicacion ?? "Sin tipo"}
ISBN: ${libro.isbn || "Sin ISBN"}
Editorial: ${libro.editorial || "Sin editorial"}
Edición: ${libro.edicion || "Sin edición"}
Volumen o colección: ${libro.volumen_coleccion || "Sin información"}
Año de publicación: ${libro.anio_publicacion ?? "Sin año"}
Género o área: ${libro.genero_area ?? "Sin categoría"}
Cantidad de ejemplares: ${ejemplares.length}
    `;

    alert(detalles);
}

// ======================================================
// EVENTOS DE LA INTERFAZ
// ======================================================

if (formularioBusqueda) {
    formularioBusqueda.addEventListener("submit", evento => {
        evento.preventDefault();
        aplicarFiltros();
    });
}

// Consultar los detalles de un libro
// Acciones de la tabla: consultar, editar y eliminar
if (tablaLibros) {
    tablaLibros.addEventListener("click", async evento => {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.accion;

        // CONSULTAR
        if (accion === "ver") {
            consultarLibro(id);
            return;
        }

        // EDITAR
        if (accion === "editar") {
            const libro = libros.find(
                elemento => String(elemento.id) === String(id)
            );

            if (!libro) {
                alert("No se encontró el libro.");
                return;
            }

            formularioLibro.elements["titulo"].value = libro.titulo ?? "";
            formularioLibro.elements["autor"].value =
                String(libro.autor_relacionado ?? "");
            formularioLibro.elements["tipo_publicacion"].value =
                libro.tipo_publicacion ?? "libro";
            formularioLibro.elements["isbn"].value = libro.isbn ?? "";
            formularioLibro.elements["editorial"].value =
                libro.editorial ?? "";
            formularioLibro.elements["edicion"].value = libro.edicion ?? "";
            formularioLibro.elements["coleccion"].value =
                libro.volumen_coleccion ?? "";
            formularioLibro.elements["anio_publicacion"].value =
                libro.anio_publicacion ?? "";
            formularioLibro.elements["genero"].value =
                libro.genero_area ?? "";

            mostrarMensaje(
                "Modifica los datos en el formulario y guarda los cambios.",
                "info"
            );

            libroEditandoId = id;

const botonGuardar = formularioLibro.querySelector(
    'button[type="submit"]'
);

if (botonGuardar) {
    botonGuardar.textContent = "Guardar cambios";
}
            formularioLibro.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            return;
        }

        // ELIMINAR
        if (accion === "eliminar") {
            const libro = libros.find(
                elemento => String(elemento.id) === String(id)
            );

            if (!libro) {
                alert("No se encontró el libro.");
                return;
            }

            const confirmar = confirm(
                `¿Deseas eliminar "${libro.titulo}" y sus ejemplares?`
            );

            if (!confirmar) return;

            try {
                boton.disabled = true;

                const respuesta = await fetch(`${API_LIBROS}${id}/`, {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json"
                    }
                });

                if (!respuesta.ok) {
                    throw new Error(
                        `No se pudo eliminar el libro. Error ${respuesta.status}.`
                    );
                }

                mostrarMensaje(
                    "Libro eliminado correctamente.",
                    "exito"
                );

                await cargarLibros();

            } catch (error) {
                console.error("Error al eliminar:", error);
                mostrarMensaje(error.message, "error");
                boton.disabled = false;
            }
        }
    });
}

if (campoBusqueda) {
    campoBusqueda.addEventListener("input", aplicarFiltros);
}

if (filtroTipo) {
    filtroTipo.addEventListener("change", aplicarFiltros);
}

if (filtroEstado) {
    filtroEstado.addEventListener("change", aplicarFiltros);
}

document.getElementById("btn-actualizar")?.addEventListener(
    "click",
    async () => {
        await cargarLibros();
        await cargarAutores();
    }
);

document.getElementById("pagina-anterior")?.addEventListener(
    "click",
    () => {
        if (paginaActual > 1) {
            paginaActual--;
            mostrarLibros();
        }
    }
);

document.getElementById("pagina-siguiente")?.addEventListener(
    "click",
    () => {
        const paginas = Math.max(
            1,
            Math.ceil(librosFiltrados.length / LIBROS_POR_PAGINA)
        );

        if (paginaActual < paginas) {
            paginaActual++;
            mostrarLibros();
        }
    }
);

document.getElementById("btn-cancelar")?.addEventListener(
    "click",
    () => {
        formularioLibro?.reset();
        limpiarMensaje();
    }
);

// Registrar o editar un libro
if (formularioLibro) {
    formularioLibro.addEventListener("submit", async evento => {
        evento.preventDefault();
        limpiarMensaje();

        const botonGuardar = formularioLibro.querySelector(
            'button[type="submit"]'
        );

        const datosFormulario = new FormData(formularioLibro);
        const autor = datosFormulario.get("autor");

        if (!autor || !selectorAutor.selectedOptions[0]?.value) {
            mostrarMensaje(
                "Selecciona un autor registrado antes de guardar.",
                "error"
            );
            return;
        }

        const datosLibro = {
    titulo: datosFormulario.get("titulo").trim(),
    autor: selectorAutor.selectedOptions[0]?.textContent.trim() ?? "",
    autor_relacionado: Number(autor),
    tipo_publicacion: datosFormulario.get("tipo_publicacion"),
    isbn: datosFormulario.get("isbn").trim(),
    editorial: datosFormulario.get("editorial").trim(),
    edicion: datosFormulario.get("edicion").trim(),
    volumen_coleccion: datosFormulario.get("coleccion").trim(),
    anio_publicacion: Number(
        datosFormulario.get("anio_publicacion")
    ),
    genero_area: datosFormulario.get("genero")
};

        const estaEditando = libroEditandoId !== null;

        try {
            if (botonGuardar) {
                botonGuardar.disabled = true;
            }

            if (estaEditando) {
                // EDITAR: actualizar el libro existente.
                mostrarMensaje("Actualizando libro...", "info");

                const respuesta = await fetch(
                    `${API_LIBROS}${libroEditandoId}/`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify(datosLibro)
                    }
                );

                const resultado = respuesta.status === 204
                    ? {}
                    : await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(
                        "No se pudo actualizar el libro: " +
                        JSON.stringify(resultado)
                    );
                }

                mostrarMensaje(
                    "Libro actualizado correctamente.",
                    "exito"
                );

            } else {
                // REGISTRAR: crear el libro nuevo.
                mostrarMensaje("Registrando libro...", "info");

                const respuestaLibro = await fetch(API_LIBROS, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(datosLibro)
                });

                const libroCreado = await respuestaLibro.json();

                if (!respuestaLibro.ok) {
                    throw new Error(
                        "No se pudo registrar el libro: " +
                        JSON.stringify(libroCreado)
                    );
                }

                // Crear el ejemplar solamente al registrar.
                const datosEjemplar = {
                    codigo_unico: datosFormulario.get("codigo").trim(),
                    estado: datosFormulario.get("estado"),
                    ubicacion_fisica: datosFormulario.get("ubicacion").trim(),
                    libro: libroCreado.id
                };

                const respuestaEjemplar = await fetch(
                    "/api/ejemplares/",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify(datosEjemplar)
                    }
                );

                const resultadoEjemplar = await respuestaEjemplar.json();

                if (!respuestaEjemplar.ok) {
                    throw new Error(
                        `El libro se creó con ID ${libroCreado.id}, ` +
                        "pero no se pudo registrar el ejemplar: " +
                        JSON.stringify(resultadoEjemplar)
                    );
                }

                mostrarMensaje(
                    `Libro y ejemplar registrados correctamente. ` +
                    `Código: LIB-${String(libroCreado.id).padStart(3, "0")}.`,
                    "exito"
                );
            }

            // Restablecer el formulario y actualizar el catálogo.
            libroEditandoId = null;
            formularioLibro.reset();

            if (botonGuardar) {
                botonGuardar.textContent = "Guardar libro";
            }

            await cargarLibros();

        } catch (error) {
            console.error("Error al guardar el libro:", error);
            mostrarMensaje(error.message, "error");

            await cargarLibros();

        } finally {
            if (botonGuardar) {
                botonGuardar.disabled = false;
            }
        }
    });
}

// ======================================================
// INICIALIZACIÓN
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
    await cargarAutores();
    await cargarLibros();
});

