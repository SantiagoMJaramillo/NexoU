const API_URL = "https://6a1f9678e96c1d13b58603b2.mockapi.io/api/v1/libros";
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos


let todosLosLibros = [];

// ── Punto de entrada ─────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  cargarLibros();
  inicializarBuscador();
  inicializarFiltro();
});

// ── Fetch MockAPI ────────────────────────────
async function cargarLibros() {
  const catalogo = document.querySelector(".biblioteca-catalogo");
  const contador = document.querySelector(".biblioteca-contador");

  mostrarEsqueletos(catalogo);

  try {
    const respuesta = await fetch(API_URL, { signal: controller.signal });
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

    todosLosLibros = await respuesta.json();
    renderizarLibros(todosLosLibros, catalogo, contador);
  } catch (error) {
    console.error("Error al obtener libros:", error);
    mostrarError(catalogo);
  }
}

// ── Renderizado ──────────────────────────────
function renderizarLibros(libros, contenedor, contador) {
  contenedor.innerHTML = "";
  contador.textContent = `Mostrando ${libros.length} de ${todosLosLibros.length} recursos`;

  if (libros.length === 0) {
    contenedor.innerHTML = `<p class="biblioteca-sin-resultados">No se encontraron recursos.</p>`;
    return;
  }

  libros.forEach((libro) => contenedor.appendChild(crearTarjetaLibro(libro)));
}

function crearTarjetaLibro(libro) {
  // MockAPI: Activo === true  →  disponible
  const disponible = libro.Activo === true;
  const cantidad   = libro.cantidad_disponible ?? 0;

  const article = document.createElement("article");
  article.classList.add("libro-card");

  // ── Portada ──────────────────────────────
  const divPortada = document.createElement("div");
  divPortada.classList.add("libro-portada");

  const imgPortada = document.createElement("img");
  imgPortada.src = libro.imagen || "/src/images/book-cover.jpg";
  imgPortada.alt = `Portada de ${libro.nombre_libro}`;

  const spanDisp = document.createElement("span");
  spanDisp.classList.add(
    "libro-disponibilidad",
    disponible ? "disponible" : "no-disponible"
  );
  spanDisp.textContent = disponible ? `${cantidad} disponibles` : "No disponible";

  divPortada.appendChild(imgPortada);
  divPortada.appendChild(spanDisp);

  // ── Info ──────────────────────────────────
  const divInfo = document.createElement("div");
  divInfo.classList.add("libro-info");

  const h3 = document.createElement("h3");
  h3.classList.add("libro-titulo");
  h3.textContent = libro.nombre_libro;

  const pAutor = document.createElement("p");
  pAutor.classList.add("libro-autor");
  pAutor.textContent = `por ${libro.autor}`;

  // Meta
  const divMeta = document.createElement("div");
  divMeta.classList.add("libro-meta");
  divMeta.innerHTML = `
    <div class="libro-rating">
      <span class="rating-estrella">★</span>
      <span class="rating-valor">${libro.rating ?? "N/A"}</span>
    </div>
    <span class="libro-categoria">${libro.categoria}</span>`;

  const pDesc = document.createElement("p");
  pDesc.classList.add("libro-descripcion");
  pDesc.textContent = libro.descripcion;

  // Detalles
  const divDetalles = document.createElement("div");
  divDetalles.classList.add("libro-detalles");
  divDetalles.innerHTML = `
    <div class="libro-detalle">
      <span class="detalle-label">ISBN:</span>
      <span class="detalle-valor">${libro.isbn}</span>
    </div>
    <div class="libro-detalle">
      <span class="detalle-label">Editorial:</span>
      <span class="detalle-valor">${libro.editorial}</span>
    </div>
    <div class="libro-detalle">
      <span class="detalle-label">Ubicación:</span>
      <span class="detalle-valor">${libro.ubicacion}</span>
    </div>
    <div class="libro-detalle">
      <span class="detalle-label">Disponibles:</span>
      <span class="detalle-valor ${disponible ? "cantidad-disponible" : "cantidad-no-disponible"}">
        ${cantidad} unidades
      </span>
    </div>`;

  // Acciones
  const divAcciones = document.createElement("div");
  divAcciones.classList.add("libro-acciones");

  const btnReservar = document.createElement("button");
  btnReservar.classList.add("btn-reservar");
  if (!disponible) {
    btnReservar.classList.add("btn-disabled");
    btnReservar.disabled = true;
  }
  btnReservar.innerHTML = `
    <img src="/src/images/icono-calendario.png" alt="" class="btn-icono" />
    Reservar`;

  const btnVer = document.createElement("button");
  btnVer.classList.add("btn-ver");
  btnVer.innerHTML = `<img src="/src/images/icono-ojo.png" alt="" class="btn-icono" />`;

  btnReservar.addEventListener("click", () => onReservar(libro));
  btnVer.addEventListener("click", () => onVerDetalle(libro));

  divAcciones.appendChild(btnReservar);
  divAcciones.appendChild(btnVer);

  divInfo.appendChild(h3);
  divInfo.appendChild(pAutor);
  divInfo.appendChild(divMeta);
  divInfo.appendChild(pDesc);
  divInfo.appendChild(divDetalles);
  divInfo.appendChild(divAcciones);

  article.appendChild(divPortada);
  article.appendChild(divInfo);

  return article;
}

// ── Buscador ─────────────────────────────────
function inicializarBuscador() {
  const input = document.querySelector(".buscador-input");
  if (!input) return;
  input.addEventListener("input", aplicarFiltros);
}

// ── Filtro categoría ─────────────────────────
function inicializarFiltro() {
  const select = document.querySelector(".filtro-select");
  if (!select) return;
  select.addEventListener("change", aplicarFiltros);
}

// ── Filtros combinados ────────────────────────
function aplicarFiltros() {
  const termino = document.querySelector(".buscador-input").value.toLowerCase().trim();
  const categoriaSeleccionada = document.querySelector(".filtro-select").value;

  const catalogo = document.querySelector(".biblioteca-catalogo");
  const contador = document.querySelector(".biblioteca-contador");

  const filtrados = todosLosLibros.filter((libro) => {
    const coincideTexto =
      !termino ||
      libro.nombre_libro?.toLowerCase().includes(termino) ||
      libro.autor?.toLowerCase().includes(termino) ||
      libro.isbn?.toLowerCase().includes(termino);

    const coincideCategoria =
      categoriaSeleccionada === "todos" ||
      libro.categoria?.toLowerCase() === categoriaSeleccionada.toLowerCase();

    return coincideTexto && coincideCategoria;
  });

  renderizarLibros(filtrados, catalogo, contador);
}

// ── Handlers ─────────────────────────────────
function onReservar(libro) {
  alert(`✅ Reserva iniciada para: "${libro.nombre_libro}"`);
}

function onVerDetalle(libro) {
  alert(`📖 ${libro.nombre_libro}\nAutor: ${libro.autor}\nEditorial: ${libro.editorial}`);
}

// ── Estados UI ───────────────────────────────
function mostrarEsqueletos(contenedor, cantidad = 4) {
  contenedor.innerHTML = "";
  for (let i = 0; i < cantidad; i++) {
    const sk = document.createElement("article");
    sk.classList.add("libro-card", "libro-card--skeleton");
    sk.innerHTML = `
      <div class="libro-portada skeleton-box"></div>
      <div class="libro-info">
        <div class="skeleton-line skeleton-line--titulo"></div>
        <div class="skeleton-line skeleton-line--autor"></div>
        <div class="skeleton-line skeleton-line--desc"></div>
      </div>`;
    contenedor.appendChild(sk);
  }
}

function mostrarError(contenedor) {
  contenedor.innerHTML = `
    <div class="biblioteca-error">
      <p>⚠️ No se pudo cargar el catálogo. Verifica tu conexión.</p>
      <button onclick="cargarLibros()">Reintentar</button>
    </div>`;
}