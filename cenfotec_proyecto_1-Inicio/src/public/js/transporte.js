document.addEventListener("DOMContentLoaded", function () {
  const rutas = {
    bus: [
      {
        id: 1,
        ruta: "San Joaquín → San José (bus TUASA)",
        horario: "5:00–19:00",
        frecuencia: "15–30 min",
        costo: "₡600",
        telefono: "+506 2442‑6900",
        web: "https://www.grupotuasa.com",
        ticketUrl: null
      },
      {
        id: 2,
        ruta: "Heredia → Belén (vía Flores, bus ABA)",
        horario: "5:00–21:30",
        frecuencia: "5–30 min",
        costo: "₡380",
        telefono: "+506 6196‑8378",
        web: null,
        ticketUrl: null
      },
      {
        id: 3,
        ruta: "Alajuela → San Joaquín (bus TUASA)",
        horario: "4:40–19:00",
        frecuencia: "30–60 min",
        costo: "₡265",
        telefono: "+506 2442‑6900",
        web: "https://www.grupotuasa.com",
        ticketUrl: null
      }
    ],
    tren: [
      {
        id: 4,
        ruta: "San Joaquín → San José (INCOFER)",
        horario: "5:20–18:00",
        frecuencia: "Cada 1 h",
        costo: "₡300–800",
        telefono: "+506 2542‑5800",
        web: "https://www.incofer.go.cr",
        ticketUrl: null
      }
    ]
  };

  const tablaCuerpo = document.getElementById("tabla-cuerpo");
  const selectorRuta = document.getElementById("medio");

  function renderizarTabla(medio) {
    tablaCuerpo.innerHTML = "";

    rutas[medio].forEach(fila => {
      const webHTML = fila.web
        ? `<a href="${fila.web}" target="_blank" class="link-bus">Sitio web</a>`
        : `<span style="font-size: 13px; color: #777;">No disponible</span>`;

      const ticketHTML = fila.ticketUrl
        ? `<a href="${fila.ticketUrl}" target="_blank"><button class="boton-compra">Comprar</button></a>`
        : `<span style="font-size: 13px; color: #777;">Directo con el chofer</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${fila.id}</td>
        <td>${fila.ruta}</td>
        <td>${fila.horario}</td>
        <td>${fila.frecuencia}</td>
        <td>${fila.costo}</td>
        <td>${fila.telefono}</td>
        <td>${webHTML}</td>
        <td>${ticketHTML}</td>
      `;
      tablaCuerpo.appendChild(tr);
    });
  }

  selectorRuta.addEventListener("change", () => {
    renderizarTabla(selectorRuta.value);
  });

  // Mostrar tabla inicial
  renderizarTabla(selectorRuta.value);
});