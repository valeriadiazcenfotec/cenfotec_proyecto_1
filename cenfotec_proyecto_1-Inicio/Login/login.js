document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.querySelector(".login-form");
  const campoUsuario = document.getElementById("usuario");
  const campoContrasena = document.getElementById("contrasena");

  const mensajeUsuario = document.createElement("div");
  mensajeUsuario.style.fontSize = "13px";
  mensajeUsuario.style.marginTop = "5px";
  mensajeUsuario.style.fontWeight = "500";
  campoUsuario.insertAdjacentElement("afterend", mensajeUsuario);

  const mensajeContrasena = document.createElement("div");
  mensajeContrasena.style.fontSize = "13px";
  mensajeContrasena.style.marginTop = "5px";
  mensajeContrasena.style.fontWeight = "500";
  campoContrasena.insertAdjacentElement("afterend", mensajeContrasena);

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();

    const valorUsuario = campoUsuario.value.trim();
    const valorContrasena = campoContrasena.value.trim();

    const esTelefono = /^\d{8}$/.test(valorUsuario);
    const esUsuario = /^[a-zA-Z0-9_]{4,20}$/.test(valorUsuario);
    const esContrasenaValida = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,30}$/.test(valorContrasena);

    let valido = true;

    // Validar usuario
    if (!esTelefono && !esUsuario) {
      mensajeUsuario.textContent = "Teléfono (88888888) o usuario válido (letras, números o _).";
      mensajeUsuario.style.color = "red";
      campoUsuario.style.borderColor = "red";
      campoUsuario.focus();
      valido = false;
    } else {
      mensajeUsuario.textContent = "Usuario válido.";
      mensajeUsuario.style.color = "green";
      campoUsuario.style.borderColor = "green";
    }

    // Validar contraseña
    if (!esContrasenaValida) {
      mensajeContrasena.textContent = "8-30 caracteres, 1 mayúscula, 1 número y 1 símbolo.";
      mensajeContrasena.style.color = "red";
      campoContrasena.style.borderColor = "red";
      if (valido) campoContrasena.focus();
      valido = false;
    } else {
      mensajeContrasena.textContent = "Contraseña válida.";
      mensajeContrasena.style.color = "green";
      campoContrasena.style.borderColor = "green";
    }

    if (valido) {
      console.log("Login válido. Enviando...");
    }
  });
});


