# 📚 Documentación Técnica - Productos Típicos Valles Pasiegos

Este documento contiene información técnica detallada sobre la implementación del proyecto.

---

## 📋 Índice

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Modelos de Datos](#modelos-de-datos)
- [Flujos de Datos](#flujos-de-datos)
- [Implementación de Seguridad](#implementación-de-seguridad)
- [Socket.IO y Tiempo Real](#socketio-y-tiempo-real)
- [Código Fuente](#código-fuente)

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────────────────────────────┐
│           CAPA DE PRESENTACIÓN           │
│  HTML5 + CSS3 + JavaScript (Vanilla)    │
│  Socket.IO Client                        │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP REST API
                  │ WebSocket (Socket.IO)
                  │
┌─────────────────▼───────────────────────┐
│          CAPA DE APLICACIÓN            │
│  Node.js + Express.js                   │
│  Socket.IO Server                       │
│  Middleware (JWT, CORS, Morgan)         │
└─────────────────┬───────────────────────┘
                  │
                  │ Mongoose ODM
                  │
┌─────────────────▼───────────────────────┐
│         CAPA DE PERSISTENCIA            │
│  MongoDB                                 │
│  - Colección: users                     │
│  - Colección: products                   │
│  - Colección: messages                   │
└─────────────────────────────────────────┘
```

### Patrón de Arquitectura

El proyecto sigue un **patrón MVC (Model-View-Controller)** simplificado:

- **Model**: Modelos Mongoose (`User`, `Product`, `Message`)
- **View**: HTML estático servido desde Express
- **Controller**: Rutas Express que manejan la lógica de negocio

### Separación de Responsabilidades

```
backend/src/
├── server.js              # Configuración del servidor
├── config.js              # Configuración centralizada
├── middleware/            # Lógica de middleware
├── models/                # Modelos de datos
└── routes/                # Controladores de rutas
```

---

## 📊 Modelos de Datos

### Modelo User

```javascript
{
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 4
  },
  role: {
    type: String,
    enum: ["usuario", "admin"],
    default: "usuario"
  },
  createdAt: Date,  // Automático
  updatedAt: Date   // Automático
}
```

**Índices:**
- `username`: Índice único para evitar duplicados

**Hooks:**
- `pre("save")`: Hashea la contraseña antes de guardar

**Métodos:**
- `comparePassword(candidate)`: Compara contraseña con hash

### Modelo Product

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  imagen: {
    type: String,
    trim: true,
    required: false
  },
  createdAt: Date,  // Automático
  updatedAt: Date    // Automático
}
```

### Modelo Message

```javascript
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: Date,  // Automático
  updatedAt: Date   // Automático
}
```

**Índices:**
- `createdAt`: Para ordenar mensajes por fecha

---

## 🔄 Flujos de Datos

### Flujo de Registro

```
┌─────────┐
│ Cliente │
└────┬────┘
     │ 1. POST /api/auth/register
     │    { username, password }
     │
┌────▼────────────────────┐
│ Express Router          │
│ authRoutes.js           │
└────┬────────────────────┘
     │ 2. Validar datos
     │    - username >= 3 chars
     │    - password >= 4 chars
     │
┌────▼────────────────────┐
│ User Model              │
│ - Pre-save hook         │
│ - Hash password         │
│ - Save to MongoDB       │
└────┬────────────────────┘
     │ 3. Generar JWT
     │
┌────▼────────────────────┐
│ jsonwebtoken            │
│ jwt.sign()              │
└────┬────────────────────┘
     │ 4. Response
     │    { token, user }
     │
┌────▼────┐
│ Cliente │
│ - Guarda token en       │
│   localStorage          │
└─────────┘
```

### Flujo de Autenticación en Peticiones

```
┌─────────┐
│ Cliente │
└────┬────┘
     │ 1. Request con header
     │    Authorization: Bearer <token>
     │
┌────▼────────────────────┐
│ Middleware              │
│ authenticateJWT         │
│ - Extrae token          │
│ - Verifica con JWT      │
│ - Extrae payload        │
└────┬────────────────────┘
     │ 2. req.user = payload
     │
┌────▼────────────────────┐
│ Route Handler            │
│ - Accede a req.user      │
│ - Ejecuta lógica         │
└────┬─────────────────────┘
     │ 3. Response
     │
┌────▼────┐
│ Cliente │
└─────────┘
```

### Flujo del Chat

```
┌─────────┐
│ Cliente │
└────┬────┘
     │ 1. Conectar Socket.IO
     │    io({ auth: { token } })
     │
┌────▼────────────────────┐
│ Socket.IO Middleware    │
│ io.use()                │
│ - Valida token JWT       │
│ - Extrae user info       │
│ - socket.user = user     │
└────┬────────────────────┘
     │ 2. Conexión aceptada
     │
┌────▼────────────────────┐
│ Cliente                 │
│ - GET /api/chat         │
│   (cargar historial)    │
└────┬────────────────────┘
     │
┌────▼────────────────────┐
│ Cliente                 │
│ - socket.emit(          │
│   "chat:message",       │
│   { text }              │
│   )                     │
└────┬────────────────────┘
     │
┌────▼────────────────────┐
│ Servidor                │
│ - Guarda en MongoDB     │
│ - io.emit("chat:message")│
└────┬────────────────────┘
     │
┌────▼────────────────────┐
│ Todos los clientes      │
│ - Reciben mensaje       │
│ - Actualizan UI         │
└─────────────────────────┘
```

---

## 🔒 Implementación de Seguridad

### Hash de Contraseñas

**Implementación:**

```javascript
// models/User.js
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Características:**
- Salt rounds: 10 (balance entre seguridad y rendimiento)
- Solo se hashea si la contraseña fue modificada
- Usa bcryptjs (versión JavaScript pura de bcrypt)

### Tokens JWT

**Generación:**

```javascript
const token = jwt.sign(
  { id: user._id, username: user.username, role: user.role },
  config.jwtSecret,
  { expiresIn: "3h" }
);
```

**Validación en HTTP:**

```javascript
// middleware/authenticateJWT.js
export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : null;

  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
```

**Validación en Socket.IO:**

```javascript
// server.js
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization?.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice(7)
        : null);

    if (!token) return next(new Error("No token"));
    
    const payload = jwt.verify(token, config.jwtSecret);
    socket.user = { 
      id: payload.id, 
      username: payload.username, 
      role: payload.role 
    };
    next();
  } catch {
    next(new Error("Token inválido"));
  }
});
```

### Protección de Rutas

**Middleware de Autenticación:**

```javascript
// routes/productRoutes.js
router.post("/", authenticateJWT, requireAdmin, async (req, res) => {
  // Solo usuarios autenticados con rol admin pueden crear productos
});
```

**Middleware de Autorización:**

```javascript
// middleware/authenticateJWT.js
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Requiere rol admin" });
  }
  next();
}
```

---

## ⚡ Socket.IO y Tiempo Real

### Configuración del Servidor

```javascript
// server.js
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" }
});
```

### Autenticación en Handshake

```javascript
io.use((socket, next) => {
  // Validación JWT antes de permitir conexión
  const token = socket.handshake.auth?.token;
  // ... validar token ...
  socket.user = { id, username, role };
  next();
});
```

### Manejo de Conexiones

```javascript
io.on("connection", (socket) => {
  console.log(`Usuario conectado: ${socket.user.username}`);
  
  socket.on("chat:message", async ({ text }) => {
    // Validar y guardar mensaje
    const msg = await Message.create({
      userId: socket.user.id,
      username: socket.user.username,
      text: text.trim()
    });
    
    // Emitir a todos los clientes
    io.emit("chat:message", {
      id: msg._id.toString(),
      username: msg.username,
      text: msg.text,
      createdAt: msg.createdAt
    });
  });
  
  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.user.username}`);
  });
});
```

### Cliente Socket.IO

```javascript
// frontend/public/client.js
socket = io({ auth: { token } });

socket.on("connect_error", (err) => {
  console.error("Socket error:", err.message);
});

socket.on("chat:message", (m) => {
  // Mostrar mensaje en UI
  const p = document.createElement("div");
  p.textContent = `[${new Date(m.createdAt).toLocaleTimeString()}] ${m.username}: ${m.text}`;
  messages.appendChild(p);
});

// Enviar mensaje
socket.emit("chat:message", { text });
```

### Prevención de Duplicados

El problema de mensajes duplicados se soluciona guardando referencias de handlers:

```javascript
let chatMessageHandler = null;

// Al inicializar
chatMessageHandler = (m) => {
  // Mostrar mensaje
};
socket.on("chat:message", chatMessageHandler);

// Al limpiar
if (chatMessageHandler) {
  socket.off("chat:message", chatMessageHandler);
}
```

---

## 💻 Código Fuente

### Estructura de Archivos Clave

#### `backend/src/server.js`

Punto de entrada del servidor. Configura:
- Conexión a MongoDB
- Servidor Express
- Servidor Socket.IO
- Middlewares globales
- Rutas de la API
- Servicio de archivos estáticos

#### `backend/src/config.js`

Configuración centralizada:

```javascript
export const config = {
  port: process.env.PORT || 3000,
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/valles",
  jwtSecret: process.env.JWT_SECRET || "vallespasiegos"
};
```

#### `backend/src/middleware/authenticateJWT.js`

Middleware reutilizable para autenticación:

```javascript
export function authenticateJWT(req, res, next) {
  // Extrae y valida token
  // Añade req.user con información del usuario
}

export function requireAdmin(req, res, next) {
  // Verifica que req.user.role === "admin"
}
```

#### `frontend/public/client.js`

Lógica del cliente:
- Gestión de autenticación
- Peticiones a la API
- Manejo de Socket.IO
- Actualización de UI

### Patrones de Código

#### Manejo de Errores

```javascript
try {
  const result = await someAsyncOperation();
  res.json(result);
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error: "Error del servidor" });
}
```

#### Validación de Datos

```javascript
if (!username || username.trim().length < 3) {
  return res.status(400).json({ error: "Usuario inválido" });
}
```

#### Respuestas Consistentes

```javascript
// Éxito
res.json({ token, user });

// Error
res.status(400).json({ error: "Mensaje de error" });
```

---

## 🔍 Optimizaciones y Mejoras Futuras

### Optimizaciones Actuales

1. **Índices en MongoDB**: Username único para búsquedas rápidas
2. **Límite de historial**: Solo últimos 50 mensajes para optimizar carga
3. **Validación doble**: Frontend y backend para mejor UX
4. **Limpieza de listeners**: Previene memory leaks en Socket.IO

### Mejoras Sugeridas

1. **Paginación**: Para productos cuando haya muchos
2. **Caché**: Redis para sesiones o datos frecuentes
3. **Compresión**: Gzip para respuestas HTTP
4. **Rate Limiting**: Prevenir abuso de API
5. **Logging**: Sistema de logs más robusto
6. **Tests**: Unitarios e integración
7. **Documentación API**: Swagger/OpenAPI

---

## 📝 Notas de Desarrollo

### Convenciones de Código

- **Nombres de variables**: camelCase
- **Nombres de modelos**: PascalCase
- **Archivos**: camelCase para JS, kebab-case para otros
- **Comentarios**: En español para claridad

### Estándares

- **ES6 Modules**: `import/export` en lugar de `require`
- **Async/Await**: Preferido sobre Promises.then()
- **Try-Catch**: Para todas las operaciones async
- **Validación**: Siempre en backend, también en frontend para UX

---

## 🧪 Testing (Futuro)

### Estructura Sugerida

```
backend/
├── tests/
│   ├── unit/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── routes/
│   └── integration/
│       └── api.test.js
```

### Ejemplo de Test

```javascript
// tests/integration/auth.test.js
describe("POST /api/auth/register", () => {
  it("debe crear un usuario correctamente", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "test", password: "1234" });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});
```

---

## 📚 Referencias

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [JWT.io](https://jwt.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

**Última actualización**: 2024

