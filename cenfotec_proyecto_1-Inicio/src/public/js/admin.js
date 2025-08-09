// Pop-up

document.addEventListener("DOMContentLoaded", () => {
  const openModalButtons = document.querySelectorAll('[data-modal-target]');
  const closeModalButtons = document.querySelectorAll('[data-close-button]');
  const overlay = document.getElementById('overlay');

  openModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modalId = button.dataset.modalTarget;
      const modal = document.getElementById(modalId);
      openModal(modal);
    });
  });

  closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      closeModal(modal);
    });
  });

  overlay.addEventListener('click', () => {
    const modals = document.querySelectorAll('.modal.active');
    modals.forEach(modal => closeModal(modal));
  });

  function openModal(modal) {
    if (modal == null) return;
    modal.classList.add('active');
    overlay.classList.add('active');
  }

  function closeModal(modal) {
    if (modal == null) return;
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }
});


// Ocultar o mostrar imagen

  const toggleImageBtn = document.getElementById("show-image");
  const modalImage = document.getElementById("modal-image");

  if (toggleImageBtn && modalImage) {
    toggleImageBtn.addEventListener("click", () => {
      const isVisible = modalImage.style.display === "block";
      modalImage.style.display = isVisible ? "none" : "block";
      toggleImageBtn.textContent = isVisible ? "Ver imagen" : "Ocultar imagen";
    });
  }

// Para responsive

document.addEventListener("DOMContentLoaded", function () {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebarLinks = document.querySelectorAll(".sidebar a");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", () => {
      sidebarToggle.checked = false;
    });
  });
});





async function cargarAnuncios() {
    try {
        const res = await fetch('/admin_anuncios');
        const eventos = await res.json();
        console.log('Anuncios recibidos:', eventos);
        console.log('Cantidad eventos:', eventos.length);

        const peticiones_todas = document.getElementById('cards_anuncio');
        peticiones_todas.innerHTML = ''; 
        eventos.forEach(evento => {
            console.log("hpla")
            const div = document.createElement('div');
            div.classList.add('peticion_una');
            div.innerHTML = `
              <div class="card">
                <h4>${evento.name}</h4>
                <p>Reportado por: Jose Elizondo</p>
                <div class="button-group">
                  <button class="detalles" data-modal-target="modal-detalles">Ver Detalles</button>
                  <button class="aprobar">Aprobar</button>
                  <button class="rechazar">Rechazar</button>
                </div>
              </div>
            `;

            peticiones_todas.appendChild(div);
        });
    } catch (error) {
        console.error('Error al cargar eventos:', error);
    }
}

window.addEventListener('DOMContentLoaded', cargarEventos);