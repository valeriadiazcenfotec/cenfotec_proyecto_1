// Coordenadas centrales de Flores, Heredia
const centroMapa = { lat: 10.0014, lng: -84.1585 };

let mapa;
let marcadoresMapa = [];

// Marcadores simulados
const marcadores = [
  { tipo: "emprendimiento", posicion: { lat: 10.0014, lng: -84.1585 }, titulo: "Tienda Local" },
  { tipo: "evento", posicion: { lat: 10.0030, lng: -84.1550 }, titulo: "Festival Cultural" },
  { tipo: "transporte", posicion: { lat: 10.0000, lng: -84.1600 }, titulo: "Parada de bus" },
  { tipo: "oferta", posicion: { lat: 10.0025, lng: -84.1570 }, titulo: "Descuento en tienda" }
];

// Inicializa el mapa
function initMap() {
  mapa = new google.maps.Map(document.getElementById("mapa"), {
    center: centroMapa,
    zoom: 15,
  });

  mostrarTodosMarcadores();
}

// Elimina todos los marcadores del mapa
function eliminarMarcadores() {
  marcadoresMapa.forEach(marker => marker.setMap(null));
  marcadoresMapa = [];
}

// Muestra todos los marcadores sin filtro
function mostrarTodosMarcadores() {
  eliminarMarcadores();
  marcadores.forEach(({ posicion, titulo }) => {
    const marker = new google.maps.Marker({
      position: posicion,
      map: mapa,
      title: titulo,
    });
    marcadoresMapa.push(marker);
  });
}

// Filtra los marcadores por tipo
function filtrarPorTipo(tipo) {
  eliminarMarcadores();
  marcadores
    .filter(m => m.tipo === tipo)
    .forEach(({ posicion, titulo }) => {
      const marker = new google.maps.Marker({
        position: posicion,
        map: mapa,
        title: titulo,
      });
      marcadoresMapa.push(marker);
    });
}

// Control de eventos de los íconos
document.addEventListener("DOMContentLoaded", () => {
  const botones = document.querySelectorAll(".filtro-icono");

  botones.forEach(boton => {
    boton.addEventListener("click", () => {
      const tipo = boton.getAttribute("data-tipo");

      // Cambiar estado visual
      botones.forEach(b => b.classList.remove("activo"));
      boton.classList.add("activo");

      // Aplicar filtro
      if (tipo === "todos") {
        mostrarTodosMarcadores();
      } else {
        filtrarPorTipo(tipo);
      }
    });
  });

  // Activar por defecto el botón "todos"
  const btnTodos = document.querySelector('[data-tipo="todos"]');
  if (btnTodos) {
    btnTodos.classList.add("activo");
  }
});