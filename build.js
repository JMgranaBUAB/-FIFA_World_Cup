require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Verifica si existe el token en el env
if (!process.env.FOOTBALL_API_TOKEN) {
    console.error("❌ ERROR: FOOTBALL_API_TOKEN no encontrado");
    process.exit(1);
}

// Asegurarse de que el directorio 'public' exista
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
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
    // Escribir config.js en la raíz para compatibilidad local con XAMPP
    fs.writeFileSync(path.join(__dirname, 'config.js'), configContent);
    
    // Escribir config.js en public para Vercel
    fs.writeFileSync(path.join(publicDir, 'config.js'), configContent);
    
    // Copiar archivos estáticos al directorio public para Vercel
    fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(publicDir, 'index.html'));
    fs.copyFileSync(path.join(__dirname, 'styles.css'), path.join(publicDir, 'styles.css'));
    fs.copyFileSync(path.join(__dirname, 'app.js'), path.join(publicDir, 'app.js'));
    
    console.log("✅ Compilación completada con éxito. Archivos preparados en /public.");
} catch (err) {
    console.error("❌ Error durante el proceso de build:", err);
    process.exit(1);
}
