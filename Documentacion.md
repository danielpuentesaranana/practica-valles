# Productos Tipicos de los Valles Pasiegos

## ¿Por que sobre este tema?
He elegido este tema para mi proyecto para dar a conocer productos tradicionales de una zona muy rica gastronomicamente pero poco explotada. Ademas son productos que veo y consumo en mi dia a dia, ya que, son parte de mi entorno cercano, asi combino algo personal con los conocimientos aprendidos.

## Estructura del Proyecto

```txt
├── backend
│   ├── src
│   │   ├── middleware
│   │   │   └── authenticateJWT.js
│   │   ├── models
│   │   │   ├── Message.js
│   │   │   ├── Product.js
│   │   │   └── User.js
│   │   └── routes
│   │       ├── authRoutes.js
│   │       ├── chatRoutes.js
│   │       └── productRoutes.js
│   ├── config.js
│   └── server.js
│
└── frontend
    └── public
        ├── index.html
        ├── styles.css
        ├── chat.js
        ├── chat.html
        └── client.js
```

## Tecnologia Utilizada
- **Node.js-Express** para el servidor y la API.   
- **MongoDB-Mongoose** para la base de datos.    
- **JWT-Bcrypt** para la autenticación y seguridad.   
- **Dotenv** para gestionar variables de entorno.  
- **CORS** para permitir las peticiones entre backend y frontend.  
- **HTML-CSS-JavaScript** para el frontend.
- **Socket.io** para implementar un chat en tiempo real.  

Elegida porque es con lo que he trabajado anteriormente en clase y me resulta mas sencillo crearlo de esta manera, estoy mas familiarizado con ello.

---

## Requisitos

Para poder ejecutar este proyecto correctamente es necesario tener instalado:

- **Node.js**  
- **npm** (incluido con Node.js)  
- **MongoDB** ejecutándose
---

## Instalación y Puesta en Marcha

Antes de iniciar el proyecto es necesario instalar las dependencias del backend.

1. Acceder a la carpeta del backend:

```bash
cd backend
```
2. Instalar las dependencias (
```bash
npm install
```
3. Configurar variables de entorno:

Crea un archivo `.env` en la carpeta `backend`:

```env
PORT=3000
MONGO_URL=mongodb://localhost:27017/valles
JWT_SECRET= "(tucontraseña)"
```

**Nota**: Muy importante cambiar el `JWT_SECRET` por un valor seguro y único.
4.  Iniciar el servidor
```bash
npm start
```
## Funcionalidades y Uso

### Usuarios

**Registro y Login**: Los usuarios pueden registrarse (mínimo 3 caracteres para usuario, 4 para contraseña) e iniciar sesión. Los tokens JWT tienen una duración de 3 horas.

**Roles**:
- **Usuario**: Puede ver productos y participar en el chat.
- **Admin**: Además de las funciones de usuario, puede crear, editar y eliminar productos.

> **Nota**: Para crear un usuario administrador, es necesario hacerlo directamente en la base de datos MongoDB, ya que el registro público solo permite crear usuarios con rol "usuario".

### Productos

- **Visualización**: Todos pueden ver el catálogo de productos (público).
- **Gestión** (solo admin): Crear, editar y eliminar productos con nombre, descripción, precio e imagen (URL).

### Chat

- **Mensajería en tiempo real**: Chat usando WebSockets (Socket.io) para usuarios autenticados.
- **Historial**: Se cargan automáticamente los últimos 50 mensajes al conectar.
- **Identificación**: Cada mensaje muestra el nombre de usuario y la hora de envío.

---
## Capturas de Pantalla


## Decisiones Tomadas Durante el Desarrollo

- **Backend y frontend separados** para mantener el proyecto organizado y de forma similar a cómo funcionan aplicaciones reales.
- **Roles creados desde MongoDB** para evitar que un usuario pueda registrarse como administrador desde la aplicación, aumentando la seguridad. Puedes crear tu usuario y despues cambiarlo a admin desde el MongoDB local
- **Imágenes mediante URLs** en lugar de subida de archivos, para evitar configurar almacenamiento local o servicios externos y simplificar el desarrollo.

## Dificultades Encontradas
- **Errores en rutas y modelos**: Varios errores pequeños en nombres de rutas, modelos o imports hicieron que el servidor fallara en diferentes momentos. Esto me obligó a revisar el código con detalle y a interpretar mejor los mensajes de error.
- **Diseño responsive**: Adaptar la interfaz a dispositivos móviles resultó más difícil de lo esperado. Aunque conseguí que funcione, aún no está tan pulida como me gustaría.



## Mejoras Futuras
- Mejorar el diseño responsive para que la aplicación se adapte mejor a dispositivos móviles.
- Añadir subida de imágenes directamente desde el frontend en lugar de utilizar URLs.
- Incorporar un buscador de productos para facilitar la navegación.
- Añadir categorías o etiquetas a los productos para organizarlos mejor.

