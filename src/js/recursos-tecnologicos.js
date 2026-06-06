
const API_URL = "https://6a1f9678e96c1d13b58603b2.mockapi.io/api/v1/equipos_tecnologicos";
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos

let todosLosEquipos = [];

// ── Punto de entrada ─────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  cargarEquipos();
  inicializarBuscador();
  inicializarFiltroDropdown();
});

// ── Fetch MockAPI ────────────────────────────
async function cargarEquipos() {
  const seccion  = document.querySelector(".contenido-principal-equipos");
  const infoText = document.querySelector(".contenido-principal-informacion-texto");

  mostrarEsqueletos(seccion);

  try {
    const respuesta = await fetch(API_URL, { signal: controller.signal });
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

    todosLosEquipos = await respuesta.json();
    renderizarEquipos(todosLosEquipos, seccion, infoText);
    actualizarEstadisticas(todosLosEquipos);
  } catch (error) {
    console.error("Error al obtener equipos:", error);
    mostrarError(seccion);
  }
}

// ── Renderizado ──────────────────────────────
function renderizarEquipos(equipos, contenedor, infoTexto) {
  contenedor.innerHTML = "";
  infoTexto.textContent = `Mostrando ${equipos.length} de ${todosLosEquipos.length} equipos`;

  if (equipos.length === 0) {
    contenedor.innerHTML = `<p class="contenido-sin-resultados">No se encontraron equipos.</p>`;
    return;
  }

  equipos.forEach((equipo) => contenedor.appendChild(crearTarjetaEquipo(equipo)));
}

function crearTarjetaEquipo(equipo) {
  // MockAPI: Activo === true  →  disponible
  const disponible = equipo.Activo === true;
  const cantidad   = equipo.cantidad_disponible ?? 0;

  const article = document.createElement("article");
  article.classList.add("tarjeta-equipo");

  // ── Cabecera ─────────────────────────────
  const header = document.createElement("header");
  header.classList.add("tarjeta-equipo-cabecera");

  const imgEquipo = document.createElement("img");
  imgEquipo.src = equipo.imagen || "/src/images/computadora-portatil.png";
  imgEquipo.alt = equipo.nombre_libro;
  imgEquipo.classList.add("tarjeta-equipo-imagen");

  const figure = document.createElement("figure");
  figure.classList.add("tarjeta-equipo-icono-categoria");
  figure.innerHTML = `
    <img src="${equipo.icono_categoria || "/src/images/icono-laptop.png"}"
         alt=""
         class="tarjeta-equipo-icono-categoria-imagen" />`;

  const badge = document.createElement("p");
  badge.classList.add(
    "tarjeta-equipo-badge",
    disponible ? "tarjeta-equipo-badge-disponible" : "tarjeta-equipo-badge-no-disponible"
  );
  badge.textContent = disponible ? `${cantidad} disponibles` : "No disponible";

  header.appendChild(imgEquipo);
  header.appendChild(figure);
  header.appendChild(badge);

  // ── Contenido ────────────────────────────
  const seccionContenido = document.createElement("section");
  seccionContenido.classList.add("tarjeta-equipo-contenido");

  const h2 = document.createElement("h2");
  h2.classList.add("tarjeta-equipo-titulo");
  h2.textContent = equipo.nombre_libro;

  const pEspecs = document.createElement("p");
  pEspecs.classList.add("tarjeta-equipo-especificaciones");
  pEspecs.textContent = equipo.editorial;        // usando editorial como especificaciones

  const pDesc = document.createElement("p");
  pDesc.classList.add("tarjeta-equipo-descripcion");
  pDesc.textContent = equipo.descripcion;

  // Detalles
  const seccionDetalles = document.createElement("section");
  seccionDetalles.classList.add("tarjeta-equipo-detalles");

  seccionDetalles.appendChild(
    crearItemDetalle("Categoría:", equipo.categoria, false)
  );
  seccionDetalles.appendChild(
    crearItemDetalle("Ubicación:", equipo.ubicacion, false)
  );
  seccionDetalles.appendChild(
    crearItemDetalle("Disponibilidad:", `${cantidad} unidades`, !disponible)
  );

  if (!disponible) {
    seccionDetalles.appendChild(
      crearItemDetalle("Estado:", "Sin stock", true)
    );
  }

  seccionContenido.appendChild(h2);
  seccionContenido.appendChild(pEspecs);
  seccionContenido.appendChild(pDesc);
  seccionContenido.appendChild(seccionDetalles);

  // ── Pie ───────────────────────────────────
  const footer = document.createElement("footer");
  footer.classList.add("tarjeta-equipo-pie");

  const boton = document.createElement("button");
  if (disponible) {
    boton.classList.add("tarjeta-equipo-boton", "tarjeta-equipo-boton-reservar");
    boton.innerHTML = `
      <img src="/src/images/icono-calendario.png" alt="" class="tarjeta-equipo-boton-icono" />
      <p class="tarjeta-equipo-boton-texto">Reservar</p>`;
    boton.addEventListener("click", () => onReservar(equipo));
  } else {
    boton.classList.add("tarjeta-equipo-boton", "tarjeta-equipo-boton-lista-espera");
    boton.innerHTML = `
      <img src="/src/images/icono-calendario.png" alt="" class="tarjeta-equipo-boton-icono" />
      <p class="tarjeta-equipo-boton-texto">Lista de espera</p>`;
    boton.addEventListener("click", () => onListaEspera(equipo));
  }

  footer.appendChild(boton);

  article.appendChild(header);
  article.appendChild(seccionContenido);
  article.appendChild(footer);

  return article;
}

function crearItemDetalle(label, valor, esNoDisponible = false) {
  const item = document.createElement("article");
  item.classList.add("tarjeta-equipo-detalles-item");
  item.innerHTML = `
    <p class="tarjeta-equipo-detalles-label">${label}</p>
    <p class="tarjeta-equipo-detalles-valor ${
      esNoDisponible
        ? "tarjeta-equipo-detalles-valor-no-disponible"
        : "tarjeta-equipo-detalles-valor-disponible"
    }">${valor}</p>`;
  return item;
}

// ── Estadísticas ─────────────────────────────
function actualizarEstadisticas(equipos) {
  // Suma total de unidades disponibles
  const totalDisponible = equipos.reduce(
    (acc, e) => acc + (Number(e.cantidad_disponible) || 0), 0
  );

  // Activos / No activos
  const activos   = equipos.filter((e) => e.Activo === true).length;
  const inactivos = equipos.filter((e) => e.Activo === false).length;
  const total     = equipos.length;

  const cards = document.querySelectorAll(".estadistica-card");
  // Orden en HTML: Laptops → Tablets → Proyectores → Total Disponible
  const valores = [activos, inactivos, total, totalDisponible];

  cards.forEach((card, i) => {
    const num = card.querySelector(".estadistica-card-numero");
    if (num && valores[i] !== undefined) num.textContent = valores[i];
  });
}

// ── Buscador ─────────────────────────────────
function inicializarBuscador() {
  const input = document.querySelector(".contenido-principal-buscador-input");
  if (!input) return;
  input.addEventListener("input", aplicarFiltros);
}

// ── Filtro dropdown ───────────────────────────
let categoriaActiva = "todos";

function inicializarFiltroDropdown() {
  const boton = document.querySelector(".contenido-principal-filtro-dropdown");
  if (!boton) return;

  const categorias = ["todos", "Representative", "Specialist", "Administrator", "Strategist"];

  const menu = document.createElement("ul");
  menu.classList.add("filtro-menu");
  menu.style.cssText = "display:none; position:absolute; background:#fff; border:1px solid #ddd; border-radius:8px; padding:8px 0; list-style:none; z-index:100; min-width:200px;";

  categorias.forEach((cat) => {
    const li = document.createElement("li");
    li.style.cssText = "padding:8px 16px; cursor:pointer;";
    li.textContent = cat === "todos" ? "Todas las categorías" : cat;
    li.addEventListener("click", () => {
      categoriaActiva = cat;
      boton.querySelector(".contenido-principal-filtro-dropdown-texto").textContent =
        cat === "todos" ? "Todas las categorias" : cat;
      menu.style.display = "none";
      aplicarFiltros();
    });
    menu.appendChild(li);
  });

  boton.style.position = "relative";
  boton.parentNode.style.position = "relative";
  boton.parentNode.appendChild(menu);

  boton.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  });

  document.addEventListener("click", () => (menu.style.display = "none"));
}

// ── Filtros combinados ────────────────────────
function aplicarFiltros() {
  const termino = document
    .querySelector(".contenido-principal-buscador-input")
    .value.toLowerCase()
    .trim();

  const seccion  = document.querySelector(".contenido-principal-equipos");
  const infoText = document.querySelector(".contenido-principal-informacion-texto");

  const filtrados = todosLosEquipos.filter((equipo) => {
    const coincideTexto =
      !termino ||
      equipo.nombre_libro?.toLowerCase().includes(termino) ||
      equipo.editorial?.toLowerCase().includes(termino) ||
      equipo.descripcion?.toLowerCase().includes(termino);

    const coincideCategoria =
      categoriaActiva === "todos" ||
      equipo.categoria === categoriaActiva;

    return coincideTexto && coincideCategoria;
  });

  renderizarEquipos(filtrados, seccion, infoText);
}

// ── Handlers ─────────────────────────────────
function onReservar(equipo) {
  alert(`✅ Reserva iniciada para: "${equipo.nombre_libro}"`);
}

function onListaEspera(equipo) {
  alert(`⏳ Agregado a lista de espera: "${equipo.nombre_libro}"`);
}

// ── Estados UI ───────────────────────────────
function mostrarEsqueletos(contenedor, cantidad = 4) {
  contenedor.innerHTML = "";
  for (let i = 0; i < cantidad; i++) {
    const sk = document.createElement("article");
    sk.classList.add("tarjeta-equipo", "tarjeta-equipo--skeleton");
    sk.innerHTML = `
      <div class="tarjeta-equipo-cabecera skeleton-box"></div>
      <div class="tarjeta-equipo-contenido">
        <div class="skeleton-line skeleton-line--titulo"></div>
        <div class="skeleton-line skeleton-line--desc"></div>
      </div>`;
    contenedor.appendChild(sk);
  }
}

function mostrarError(contenedor) {
  contenedor.innerHTML = `
    <div class="tecnologia-error">
      <p>⚠️ No se pudo cargar los equipos. Verifica tu conexión.</p>
      <button onclick="cargarEquipos()">Reintentar</button>
    </div>`;
}