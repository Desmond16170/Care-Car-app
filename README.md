# 🚗 Car Care App

**Car Care App** es una aplicación multiplataforma para Android y PC, diseñada para ayudar a usuarios y talleres a registrar vehículos, controlar mantenimientos y sincronizar datos en tiempo real.

Permite seleccionar vehículos por marca, modelo y generación mediante botones visuales con logos, y guarda el perfil del auto junto con su kilometraje y matrícula. Además, registra mantenimientos realizados y los organiza de manera clara, incluyendo gráficos y estadísticas.

## 📦 Características principales

- ✅ Registro guiado de vehículos por marca, modelo y generación
- ✅ Logos visuales y botones temáticos con estilo moderno
- ✅ Sincronización en la nube con Firebase o Supabase
- ✅ Soporte multiplataforma (React Native + Electron)
- ✅ Registro de placa y kilometraje actual
- ✅ Historial detallado de mantenimientos
- ✅ Gráficos y estadísticas de mantenimiento por vehículo
- ✅ Generación automática del perfil del vehículo

## 🛠️ Tecnologías utilizadas

### Interfaz

- **React Native** – Versión móvil (Android)
- **Electron.js** – Versión de escritorio (Windows/Linux/Mac)
- **Tailwind CSS** + `shadcn/ui` – Estilo moderno y personalizable
- **Lucide-react** – Íconos modernos
- **Recharts** – Gráficos para mantenimientos

### Backend / Sincronización

- **Firebase** o **Supabase** – Autenticación y base de datos en tiempo real

### Otros

- Archivos `.json` individuales por marca
- Logos en formato `.png` optimizados
- Estructura de carpetas organizada y modular

## 📁 Estructura del proyecto

```plaintext
car-care-app/
├── android/                  # Proyecto móvil (React Native)
├── desktop/                  # Proyecto escritorio (Electron)
├── assets/
│   ├── logos/                # Logos PNG de marcas
│   └── data/                 # Archivos .json con modelos y generaciones
├── src/
│   ├── components/           # Botones, listas, formularios
│   ├── screens/              # Pantallas como Registro, Historial, Dashboard
│   ├── services/             # Funciones de sincronización
│   └── utils/                # Utilidades generales
├── firebase.json / supabase/
├── .env
├── package.json
└── README.md

```
## 🚀 Instalación

### Requisitos

- Node.js >= 18  
- npm o yarn  
- Android Studio (para versión móvil)  
- Git  
- Firebase o Supabase configurado  

---

### Clonar repositorio

```bash
git clone https://github.com/tuusuario/car-care-app.git
cd car-care-app
npm install
```
## 🔮 Funcionalidades planeadas

Estas funciones están en desarrollo o planificadas para versiones futuras:

- 🔔 **Notificaciones automáticas de mantenimiento**  
  Recordatorios según kilometraje, tiempo transcurrido o tipo de servicio.

- 📄 **Exportación del historial en PDF**  
  Para compartir o imprimir todo el mantenimiento del vehículo.

- 📷 **Escaneo de placa**  
  Escaneo por cámara o entrada rápida que autocompleta marca/modelo desde una base de datos.

- 🔗 **Sincronización total entre app de Android y app de escritorio (Windows/Linux)**  
  Un solo perfil de usuario que sincroniza todos los vehículos y mantenimientos en la nube.

- ☁️ **Integración con Firebase o Supabase en tiempo real**  
  Permite acceso desde múltiples dispositivos al mismo tiempo con respaldo en la nube.

- 🧠 **Diagnóstico sugerido por tipo de mantenimiento**  
  Basado en el historial y la generación del vehículo.

- 🛞 **Calculadora de mantenimiento predictivo**  
  Recomendaciones de próximos mantenimientos según patrón de uso.

- 💬 **Comentarios o notas por cada mantenimiento**  
  Permite agregar observaciones, costos y detalles extra.

- 📦 **Respaldo automático y restauración desde la nube**  
  Para no perder información en caso de formateo o cambio de dispositivo.

- 🔍 **Búsqueda avanzada y filtros por vehículo, tipo o fecha de mantenimiento**

- 👤 **Soporte multiusuario (opcional para talleres)**  
  Varios usuarios o empleados con acceso a sus propios registros.

---


