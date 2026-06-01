require('dotenv').config();
const fs = require('fs');

// Verifica si existe el token en el .env
if (!process.env.FOOTBALL_API_TOKEN) {
    console.error("❌ ERROR: FOOTBALL_API_TOKEN no encontrado en el archivo .env");
    process.exit(1);
}

// Genera un archivo config.js que el navegador sí puede leer
const configContent = `// Archivo autogenerado por build.js. No editar manualmente.
const CONFIG = {
    API_BASE: 'https://api.football-data.org/v4',
    API_TOKEN: '${process.env.FOOTBALL_API_TOKEN}',
    COMPETITION_CODE: 'WC',
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};
`;

try {
    fs.writeFileSync('config.js', configContent);
    console.log("✅ config.js generado exitosamente. Tu API Key ahora está disponible para app.js");
} catch (err) {
    console.error("❌ Error al escribir config.js:", err);
}
