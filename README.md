# 🏆 FIFA World Cup 2026 — Dashboard en Vivo

Un dashboard interactivo, moderno y "Premium" para visualizar los datos del Mundial de la FIFA 2026 en tiempo real. Construido 100% con **HTML, CSS Vanilla y Vanilla JavaScript** (sin frameworks).

Este proyecto consume la API de [football-data.org](https://www.football-data.org/) y está diseñado con estética moderna (glassmorphism, animaciones fluidas, modo oscuro por defecto) y está optimizado tanto para desarrollo local como para su despliegue en Vercel sin problemas de CORS.

## ✨ Características

- **⚽ Próximos Partidos:** Lista completa de encuentros con filtros interactivos (Programados, En Vivo 🔴, Finalizados, Todos).
- **📊 Clasificación:** Tablas dinámicas y detalladas por cada grupo del Mundial.
- **🏅 Fases Finales:** Bracket visual del torneo desde Dieciseisavos de Final hasta la Final.
- **🎨 Diseño Premium:** Interfaz completamente responsiva (Mobile-First) con efectos visuales modernos, tipografías atractivas y feedback visual (Toasts).
- **🚀 Preparado para Producción:** Incluye un Proxy Serverless para evitar bloqueos de CORS en dispositivos móviles/tablets cuando se despliega en Vercel.

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript (ES6+).
- **Build & Config:** Node.js, `dotenv` (para manejo seguro de API Keys).
- **Backend (Despliegue):** Vercel Serverless Functions (`api/proxy.js`).

## 📋 Requisitos Previos

Para ejecutar y compilar el proyecto localmente, necesitas:
1. **Node.js** (v14 o superior) y **npm**.
2. Una API Key gratuita (o superior) de [football-data.org](https://www.football-data.org/).

## 💻 Instalación y Uso Local

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/JMgranaBUAB/-FIFA_World_Cup.git
   cd -FIFA_World_Cup
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura tu API Key:**
   Crea un archivo llamado `.env` en la raíz del proyecto y añade tu token de la API:
   ```env
   FOOTBALL_API_TOKEN=tu_api_key_aqui
   ```

4. **Genera los archivos de compilación:**
   ```bash
   npm run build
   ```
   *Esto generará la carpeta `/public` y el archivo `config.js` (ignorados por git por seguridad).*

5. **Sirve el proyecto:**
   Puedes usar tu servidor local favorito (como Live Server de VS Code, XAMPP, o http-server). Apunta el servidor a la raíz del proyecto o a la carpeta `/public` y abre el archivo `index.html` en el navegador.

## 🚀 Despliegue en Vercel

Este proyecto está configurado para ser desplegado en **Vercel** de manera automática y segura (ocultando tu API Key y superando las restricciones de CORS en móviles).

1. Importa tu repositorio en el [Dashboard de Vercel](https://vercel.com/).
2. En el paso de configuración, ve a la sección **Environment Variables** y añade:
   - **Key:** `FOOTBALL_API_TOKEN`
   - **Value:** *[tu_api_key]*
3. El comando de build configurado en el `package.json` (`node build.js`) se ejecutará automáticamente, construirá la carpeta `public/` y Vercel usará la función `api/proxy.js` para servir las peticiones de la API.
4. Presiona **Deploy**.

## 📁 Estructura del Proyecto

```text
/
├── .env                # Variables de entorno (Ignorado en git)
├── .gitignore          # Archivos excluidos del control de versiones
├── api/
│   └── proxy.js        # Proxy Serverless de Vercel (Resuelve CORS)
├── build.js            # Script de Node para generar config.js y carpeta /public
├── index.html          # Interfaz principal
├── styles.css          # Hoja de estilos principal (Vanilla CSS)
├── app.js              # Lógica del cliente (Vanilla JS)
├── package.json        # Dependencias (dotenv) y scripts (build)
└── public/             # Carpeta de salida autogenerada lista para producción
```

## 📝 Notas de la API

La API de Football-Data (v4) requiere un token de autenticación. Las peticiones directas desde el navegador a veces generan errores de CORS. Por esto, la aplicación web detecta inteligentemente el entorno:
- En **localhost / XAMPP**: Conecta de manera directa asumiendo un entorno de desarrollo.
- En **Vercel / Producción**: Redirige todas las peticiones a través del Proxy Serverless (`/api/proxy`).

## 📜 Licencia

Desarrollado para uso educativo e informativo. Los datos del fútbol son provistos bajo los términos de [football-data.org](https://www.football-data.org).
