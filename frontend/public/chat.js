const token = localStorage.getItem("token");
const user = localStorage.getItem("user") || "Visitante";

if (!token || !user) {
  alert("Debes iniciar sesión");
  window.location.href = "index.html";
}

function mostrarMensaje(msg) {
  const li = document.createElement("li");
  li.innerHTML = `<b>${msg.user}</b>: ${msg.texto} <span style="color:#888;font-size:12px;">${new Date(msg.fecha).toLocaleTimeString()}</span>`;
  document.getElementById("mensajes").appendChild(li);
}

// Cargar mensajes anteriores
fetch("/api/chat", { headers: {Authorization: "Bearer " + token}})
.then(res => res.json())
.then(mensajes => {
  mensajes.forEach(mostrarMensaje);
});

let socket = io();

socket.on("chat message", mostrarMensaje);

document.getElementById('formulario-chat').onsubmit = function(e) {
  e.preventDefault();
  const input = document.getElementById("input-mensaje");
  if (input.value) {
    socket.emit("chat message", {user, texto: input.value});
    input.value = "";
  }
};