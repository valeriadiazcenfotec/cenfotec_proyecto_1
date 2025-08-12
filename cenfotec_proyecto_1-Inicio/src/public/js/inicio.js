document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/sesion", { credentials: "same-origin" });
    if (!res.ok) throw new Error("No se pudo obtener la sesión");
    const data = await res.json();


    const saludo = document.getElementById("inicio-greeting");
    saludo.textContent = data?.name ? `Saludos ${data.name}` : "Bienvenidos";

    const userContainer = document.getElementById("nav-user");
    if (data?.username) {
      userContainer.innerHTML = `
        <a href="/logout" class="nav__logout">Salir</a>
      `;
    } else {
      userContainer.innerHTML = "";
    }
  } catch (err) {
    console.error("Error cargando datos de usuario:", err);
  }
});
