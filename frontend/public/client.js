const API = location.origin + "/api";

let token = localStorage.getItem("token");
let user = JSON.parse(localStorage.getItem("user") || "null");

const whoami = document.getElementById("whoami");
const btnLogout = document.getElementById("btn-logout");
const adminPanel = document.getElementById("admin-panel");
const chatSection = document.getElementById("chat");

function renderAuthState() {
  if (user) {
    whoami.textContent = `Sesión: ${user.username} (${user.role})`;
    btnLogout.classList.remove("hide");
    if (user.role === "admin") {
      adminPanel.classList.remove("hide");
    } else {
      adminPanel.classList.add("hide");
    }
    chatSection.classList.remove("hide");
  } else {
    whoami.textContent = "No has iniciado sesión";
    btnLogout.classList.add("hide");
    adminPanel.classList.add("hide");
    chatSection.classList.add("hide");
  }
}
document.getElementById("btn-register").addEventListener("click", async () => {
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error || "Error en registro");
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  token = data.token; user = data.user;
  renderAuthState(); loadProducts(); initChat();
});

document.getElementById("btn-login").addEventListener("click", async () => {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error || "Error en login");
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  token = data.token; user = data.user;
  renderAuthState(); loadProducts(); initChat();
});

btnLogout.addEventListener("click", () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  token = null; user = null;
  renderAuthState();
  loadProducts();
  const messages = document.getElementById("messages");
  if (messages) messages.innerHTML = "";
});
async function loadProducts() {
  try {
    const res = await fetch(`${API}/productos`);
    if (!res.ok) {
      console.error("Error al cargar productos");
      return;
    }
    const items = await res.json();
    const list = document.getElementById("list");
    list.innerHTML = "";
    if (items.length === 0) {
      list.innerHTML = '<p class="muted">No hay productos disponibles</p>';
      return;
    }
    items.forEach(p => {
      const div = document.createElement("div");
      div.className = "item";
      const imagenHtml = p.imagen ? `<img src="${p.imagen}" alt="${p.name}" class="product-image" onerror="this.style.display='none'"/>` : "";
      div.innerHTML = `
        ${imagenHtml}
        <strong>${p.name}</strong> — ${p.price}€
        <div>${p.description || ""}</div>
        <div class="actions">
          <button data-id="${p._id}" class="btn view">Ver detalles</button>
          ${user?.role === "admin" ? `
            <button data-id="${p._id}" class="btn edit">Editar</button>
            <button data-id="${p._id}" class="btn del">Eliminar</button>` : ""}
        </div>
      `;
      list.appendChild(div);
    });

  list.querySelectorAll(".view").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const res = await fetch(`${API}/productos/${id}`);
      const p = await res.json();
      const imagenInfo = p.imagen ? `\nImagen: ${p.imagen}` : "";
      alert(`${p.name}\n${p.description}\n${p.price}€${imagenInfo}\n(id: ${p._id})`);
    });
  });

  list.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const res = await fetch(`${API}/productos/${id}`);
      const p = await res.json();
      if (!res.ok) return alert("Error al cargar producto");
      
      const name = prompt("Nuevo nombre:", p.name || "");
      if (name === null) return;
      const priceInput = prompt("Nuevo precio:", p.price || "");
      if (priceInput === null) return;
      const price = parseFloat(priceInput);
      if (isNaN(price) || price < 0) return alert("Precio inválido");
      const description = prompt("Nueva descripción:", p.description || "");
      if (description === null) return;
      const imagen = prompt("Nueva URL de imagen (deja vacío para no cambiar):", p.imagen || "");
      if (imagen === null) return;
      
      const updateRes = await fetch(`${API}/productos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, price, description, imagen: imagen || undefined })
      });
      if (!updateRes.ok) {
        const data = await updateRes.json().catch(() => ({}));
        return alert(data.error || "Error al editar");
      }
      loadProducts();
    });
  });

  list.querySelectorAll(".del").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("¿Eliminar?")) return;
      const res = await fetch(`${API}/productos/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) return alert("Error al eliminar");
      loadProducts();
    });
  });
  } catch (error) {
    console.error("Error al cargar productos:", error);
    const list = document.getElementById("list");
    if (list) list.innerHTML = '<p class="muted">Error al cargar productos</p>';
  }
}

document.getElementById("btn-create").addEventListener("click", async () => {
  const name = document.getElementById("p-name").value.trim();
  const priceInput = document.getElementById("p-price").value;
  const price = parseFloat(priceInput);
  const description = document.getElementById("p-desc").value.trim();
  const imagen = document.getElementById("p-imagen").value.trim();
  
  if (!name) {
    return alert("El nombre es obligatorio");
  }
  if (!priceInput || isNaN(price) || price < 0) {
    return alert("El precio debe ser un número válido mayor o igual a 0");
  }
  
  const res = await fetch(`${API}/productos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name, price, description, imagen: imagen || undefined })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return alert(data.error || "Error al crear");
  }
  document.getElementById("p-name").value = "";
  document.getElementById("p-price").value = "";
  document.getElementById("p-desc").value = "";
  document.getElementById("p-imagen").value = "";
  loadProducts();
});

let socket;
let sendMessageHandler = null;
let keypressHandler = null;
let chatMessageHandler = null;
let connectErrorHandler = null;

async function initChat() {
  if (!token) return;
  
  if (socket) {
    if (connectErrorHandler) {
      socket.off("connect_error", connectErrorHandler);
      connectErrorHandler = null;
    }
    if (chatMessageHandler) {
      socket.off("chat:message", chatMessageHandler);
      chatMessageHandler = null;
    }
    socket.disconnect();
    socket = null;
  }
  
  const btnSend = document.getElementById("btn-send");
  const msgInput = document.getElementById("msg");
  
  if (btnSend) {
    btnSend.onclick = null;
  }
  
  if (msgInput && keypressHandler) {
    msgInput.removeEventListener("keypress", keypressHandler);
    keypressHandler = null;
  }
  
  try {
    const res = await fetch(`${API}/chat`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
      console.error("Error al cargar historial de chat");
      return;
    }
    const history = await res.json();
    const messages = document.getElementById("messages");
    if (!messages) return;
    messages.innerHTML = "";
    history.forEach(m => {
      const p = document.createElement("div");
      p.textContent = `[${new Date(m.createdAt).toLocaleTimeString()}] ${m.username}: ${m.text}`;
      messages.appendChild(p);
    });
    messages.scrollTop = messages.scrollHeight;

    socket = io({ auth: { token } });

    connectErrorHandler = (err) => {
      console.error("Socket error:", err.message);
      alert("No se pudo conectar al chat: " + err.message);
    };
    socket.on("connect_error", connectErrorHandler);

    chatMessageHandler = (m) => {
      const p = document.createElement("div");
      p.textContent = `[${new Date(m.createdAt).toLocaleTimeString()}] ${m.username}: ${m.text}`;
      messages.appendChild(p);
      messages.scrollTop = messages.scrollHeight;
    };
    socket.on("chat:message", chatMessageHandler);

    sendMessageHandler = () => {
      const text = document.getElementById("msg").value.trim();
      if (!text) return;
      socket.emit("chat:message", { text });
      document.getElementById("msg").value = "";
    };
    
    if (btnSend) {
      btnSend.onclick = sendMessageHandler;
    }
    
    if (msgInput) {
      keypressHandler = (e) => {
        if (e.key === "Enter") {
          sendMessageHandler();
        }
      };
      msgInput.addEventListener("keypress", keypressHandler);
    }
  } catch (error) {
    console.error("Error al inicializar chat:", error);
  }
}

renderAuthState();
loadProducts();
if (token && user) initChat();

if (token) {
  fetch(`${API}/chat`, {
    headers: { "Authorization": `Bearer ${token}` }
  }).then(res => {
    if (!res.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      token = null;
      user = null;
      renderAuthState();
    }
  }).catch(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    token = null;
    user = null;
    renderAuthState();
  });
}
