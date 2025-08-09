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