document.addEventListener("DOMContentLoaded", function () {
  const rutas = {
    bus: [
      { id: 1, ruta: "San Joaquín → San José (bus TUASA)", tipo: "Autobús", horario: "5:00–19:00", frecuencia: "15–30 min", costo: "₡600" },
      { id: 2, ruta: "Heredia → Belén (vía Flores, bus ABA)", tipo: "Autobús", horario: "5:00–21:30", frecuencia: "5–30 min", costo: "₡380" },
      { id: 3, ruta: "Alajuela → San Joaquín (bus TUASA)", tipo: "Autobús", horario: "4:40–19:00", frecuencia: "30–60 min", costo: "₡265" }
    ],
    tren: [
      { id: 4, ruta: "San Joaquín → San José (INCOFER)", tipo: "Tren", horario: "5:20–18:00", frecuencia: "Cada 1 h", costo: "₡300–800" }
    ]
  };

  const tablaCuerpo = document.getElementById("tabla-cuerpo");
  const selectorRuta = document.getElementById("medio");

  function renderizarTabla(medio) {
    tablaCuerpo.innerHTML = "";

    rutas[medio].forEach(fila => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${fila.id}</td>
        <td>${fila.ruta}</td>
        <td>${fila.tipo}</td>
        <td>${fila.horario}</td>
        <td>${fila.frecuencia}</td>
        <td>${fila.costo}</td>
      `;
      tablaCuerpo.appendChild(tr);
    });
  }

  selectorRuta.addEventListener("change", () => {
    renderizarTabla(selectorRuta.value);
  });

  // Mostrar la tabla inicial (bus)
  renderizarTabla(selectorRuta.value);
});
