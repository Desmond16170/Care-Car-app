// @ts-ignore
const fs = require('fs');
// @ts-ignore
const path = require('path');
// @ts-ignore
const { ipcRenderer } = require('electron');

/**
 * Carga los datos desde config.json a localStorage si existe el archivo.
 */
export function loadConfigToLocalStorage() {
  try {
    const userDataPath = ipcRenderer.sendSync('get-user-data-path');
    const configPath = path.join(userDataPath, 'config.json');

    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(raw);

      if (config.managerKey) {
        localStorage.setItem('car-care-manager-key', config.managerKey);
      }
      if (config.primaryColor) {
        localStorage.setItem('car-care-primary-color', config.primaryColor);
      }
      if (config.textColor) {
        localStorage.setItem('car-care-text-color', config.textColor);
      }
      if (config.logo) {
        localStorage.setItem('car-care-logo', config.logo);
      }
      if (config.tallerName) {
        localStorage.setItem('car-care-taller-name', config.tallerName);
      }

      console.log('🟢 Configuración cargada desde config.json');
    }
  } catch (err) {
    console.error('🔴 Error al cargar config.json:', err);
  }
}
