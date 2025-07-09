document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.querySelector(".login-form");
  const campoUsuario = document.getElementById("usuario");

  // Crear mensaje de error o éxito dinámico
  const mensajeEstado = document.createElement("div");
  mensajeEstado.style.fontSize = "13px";
  mensajeEstado.style.marginTop = "5px";
  mensajeEstado.style.fontWeight = "500";
  campoUsuario.insertAdjacentElement("afterend", mensajeEstado);

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();

    const valor = campoUsuario.value.trim();
    const esTelefono = /^\d{8}$/.test(valor);
    const esUsuario = /^[a-zA-Z0-9_]{4,20}$/.test(valor);

    if (!esTelefono && !esUsuario) {
      mensajeEstado.textContent = "Ingresa un número (88888888) o un usuario válido (sin guiones, @ ni espacios).";
      mensajeEstado.style.color = "red";
      campoUsuario.value = "";
      campoUsuario.focus();
      campoUsuario.style.borderColor = "red";
      return;
    }

    // Si es válido
    mensajeEstado.textContent = "Usuario válido. Procesando...";
    mensajeEstado.style.color = "green";
    campoUsuario.style.borderColor = "green";

    // Aquí podrías hacer redirección o fetch si lo deseas
  });
});

