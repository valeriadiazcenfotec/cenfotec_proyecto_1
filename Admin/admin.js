// POP-UP CON INYECCIÓN DE BOTONES DESDE LA TARJETA

document.addEventListener("DOMContentLoaded", () => {
  // Botones que abren el modal
  const openModalButtons = document.querySelectorAll('[data-modal-target]');
  // Botones que cierran el modal
  const closeModalButtons = document.querySelectorAll('[data-close-button]');
  const overlay = document.getElementById('overlay');

  openModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modalId = button.dataset.modalTarget;
      const modal = document.getElementById(modalId);
      const card = button.closest('.card');
      if (card) {
        //Encontrar botones de acción
        const cardActionButtons = card.querySelectorAll('.aprobar, .rechazar');

        const modalActionsContainer = modal.querySelector('.modal-actions');
        if (modalActionsContainer) {
          modalActionsContainer.innerHTML = '';
          cardActionButtons.forEach(btn => {
            const clone = btn.cloneNode(true);
            modalActionsContainer.appendChild(clone);
          });
        }
      }

      // Abrir modal
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
    if (!modal) return;
    modal.classList.add('active');
    overlay.classList.add('active');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }
});


// MOSTRAR/OCULTAR IMAGEN EN EL MODAL

const toggleImageBtn = document.getElementById("show-image");
const modalImage = document.getElementById("modal-image");

if (toggleImageBtn && modalImage) {
  toggleImageBtn.addEventListener("click", () => {
    const isVisible = modalImage.style.display === "block";
    modalImage.style.display = isVisible ? "none" : "block";
    toggleImageBtn.textContent = isVisible ? "Ver imagen" : "Ocultar imagen";
  });
}


// 3) RESPONSIVE: CERRAR SIDEBAR AL HACER CLIC EN UN ENLACE

document.addEventListener("DOMContentLoaded", function () {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebarLinks = document.querySelectorAll(".sidebar a");

  sidebarLinks.forEach(link => {
    link.addEventListener("click", () => {
      sidebarToggle.checked = false;
    });
  });
});


// INYECTAR ICONO DE ACCIONES EN CADA TARJETA


document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    if (card.querySelector(".toggle-actions")) return;

    // Crear el botón de "tres puntos"
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-actions";
    toggleBtn.setAttribute("aria-label", "Mostrar acciones");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.innerHTML = "<i class='bx bx-dots-horizontal-rounded' aria-hidden='true'></i>";

    // Insertar al inicio de la tarjeta
    card.prepend(toggleBtn);

    // Click: alternar visibilidad de Aprobar/Rechazar
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // No cerrar por clicks externos
      const isOpen = card.classList.toggle("show-actions");
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
    });
  });

  // Clic fuera de cualquier tarjeta: ocultar acciones
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".card")) {
      document.querySelectorAll(".card.show-actions").forEach(c => c.classList.remove("show-actions"));
      document.querySelectorAll(".toggle-actions[aria-expanded='true']").forEach(b => b.setAttribute("aria-expanded", "false"));
    }
  });
});
