# 🗺️ CuidaMDP - Plataforma de Reporte Ciudadano

**CuidaMDP** es una aplicación web interactiva de reporte ciudadano diseñada para la ciudad de Mar del Plata (Partido de General Pueyrredón). Inspirada en *FixMyStreet*, la plataforma permite a los vecinos reportar problemas en la vía pública (baches, luminarias rotas, acumulación de basura, veredas rotas) de forma visual sobre un mapa interactivo de OpenStreetMap.

Este proyecto ha sido desarrollado con un enfoque **Mobile-First** utilizando el estilo estético **Neumorphic (Soft UI)**, ofreciendo una experiencia táctil y fluida en dispositivos móviles, e incluye un panel de moderación protegido por autenticación para personal municipal.

---

## ✨ Características Principales

* **Mapa Interactivo Geolocalizado**: Integración de Leaflet y OpenStreetMap centrado en General Pueyrredón con pines interactivos dinámicos según el estado del problema (Pendiente = Rojo, En Proceso = Amarillo, Resuelto = Verde).
* **Autolocalización**: Botón integrado para centrar el mapa y sugerir reportes basados en la ubicación del GPS del dispositivo mediante la Geolocation API.
* **Geocodificación Inversa**: Obtención automática de la dirección urbana aproximada (calle y número) utilizando la API Nominatim de OpenStreetMap al colocar un pin en el mapa.
* **Diseño Neumórfico (Soft UI)**: Interfaz neumórfica limpia y moderna construida enteramente en Vanilla CSS con soporte nativo de **Modo Claro / Modo Oscuro** persistente en localStorage.
* **Dashboard de Estadísticas**: Tablero interactivo con métricas clave (KPIs), conteo de reportes por barrio (Gráfico de barras CSS) y distribución por tipo de categorías y estado.
* **Seguridad y Control de Spam**:
  * Límite de creación de un **máximo de 3 reportes cada 24 horas** por dirección IP o ID de dispositivo.
  * Registro de la dirección IP pública del usuario.
  * **Trigger de seguridad en base de datos** (PostgreSQL) para bloquear reportes si la IP está en la lista de baneos.
* **Panel de Moderación Municipal**:
  * Ingreso seguro para empleados públicos mediante **Supabase Auth** (Email/Password).
  * Controles de moderación para **Eliminar reportes**, **Cambiar estados** de incidencias y **Banear IPs** de usuarios malintencionados.

---

## 🛠️ Stack Tecnológico

* **Frontend**: React + Vite (Javascript).
* **Mapas**: Leaflet & React-Leaflet (OpenStreetMap Tiles).
* **Backend y Base de Datos**: Supabase (PostgreSQL) con Canales en Tiempo Real (Realtime Channels).
* **Almacenamiento**: Supabase Storage Buckets (para fotos cargadas por vecinos y pruebas de resolución).
* **Estilos**: Vanilla CSS con variables de tema adaptativas y CSS Grid/Flexbox responsivo.
* **Iconografía**: Lucide React.

---

## ⚙️ Estructura de la Base de Datos

El backend está construido sobre Supabase y utiliza las siguientes tablas y políticas RLS:

### Tabla `reports`
Almacena las coordenadas, dirección, descripción, fotos originales, estado, apoyos (votos) y metadatos de seguridad (IP/Cliente) de cada reporte.

### Tabla `votes`
Lleva el registro de apoyos por reporte (`report_id`) y ID único de cliente (`voter_id`) para evitar votos duplicados. Un trigger en PostgreSQL actualiza automáticamente el conteo en la tabla `reports`.

### Tabla `banned_ips`
Registra las direcciones IP bloqueadas junto al motivo. Si una IP se encuentra aquí, un disparador `BEFORE INSERT` aborta la transacción y devuelve un error descriptivo.

---

## 🚀 Instalación y Configuración Local

### 1. Clonar el repositorio y levantar dependencias
```bash
# Instalar módulos de NodeJS
npm install
```

### 2. Configurar la Base de Datos
* Ve al panel de control de tu proyecto en Supabase, abre el **SQL Editor** y ejecuta las consultas del archivo [`schema.sql`](./schema.sql).
* Ve a la sección **Storage** en Supabase, crea un Bucket llamado exactamente `report-photos` y configúralo como **Public bucket**.
* Crea una cuenta de Empleado en **Authentication** -> **Users** para poder ingresar al panel de moderación.

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto con tus credenciales:
```env
VITE_SUPABASE_URL=https://tu-id-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key-jwt
```

### 4. Ejecutar el proyecto
```bash
# Correr servidor de desarrollo
npm run dev
```
La aplicación estará disponible en `http://localhost:5173/`.
