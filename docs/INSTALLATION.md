# Instalación de Care Car Taller

## PWA desde Netlify

Netlify debe compilar la rama publicada con:

- Comando: `npm run build:web`
- Carpeta publicada: `dist`
- Node.js: `22`

Variables requeridas en **Site configuration > Environment variables**:

- `CAR_CARE_SUPABASE_URL`
- `CAR_CARE_SUPABASE_PUBLISHABLE_KEY`

Después del despliegue, la aplicación se instala desde el navegador mediante **Instalar Care Car** o **Añadir a la pantalla de inicio**. El manifest incluye iconos PNG de 192 y 512 píxeles, además del icono SVG.

## Instalador de Windows

El workflow `Build web and Windows` incluye un trabajo manual llamado **Windows installer**.

1. Agrega en GitHub Actions los secretos `CAR_CARE_SUPABASE_URL` y `CAR_CARE_SUPABASE_PUBLISHABLE_KEY`.
2. Abre **Actions > Build web and Windows > Run workflow**.
3. Descarga el artefacto `care-car-windows-installer` cuando finalice.
4. Ejecuta el archivo `.exe` y elige la carpeta de instalación.

El instalador crea accesos directos en el escritorio y en el menú Inicio. Para distribución pública conviene firmar el ejecutable con un certificado de firma de código; sin firma, Windows puede mostrar una advertencia de editor desconocido.
