document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/sesion", { credentials: "same-origin" });
    if (!res.ok) throw new Error("No se pudo obtener la sesión");
    const data = await res.json();

    // Saludo
    const saludo = document.getElementById("inicio-greeting");
    if (saludo) {
      saludo.textContent = data?.name ? `Saludos ${data.name}` : "Bienvenidos";
    }

    // Acciones de usuario en el nav
    const userContainer = document.getElementById("nav-user");
    if (!userContainer) return;

    if (data?.username) {
      const adminLink = (data?.role === "admin")
        ? `<a href="/admin" class="nav__icon-link" id="admin-link" title="Panel de administración" aria-label="Panel de administración" style="margin-right:10px; display:inline-flex; align-items:center;">
             <i class="fa-solid fa-gear" aria-hidden="true"></i>
           </a>`
        : "";

      const logoutLink = `<a href="/logout" class="nav__logout" id="logout-link">Salir</a>`;

      userContainer.innerHTML = `${adminLink}${logoutLink}`;
    } else {
      userContainer.innerHTML = "";
    }
  } catch (err) {
    console.error("Error cargando datos de usuario:", err);
  }
});
