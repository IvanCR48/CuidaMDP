# RobosMDP

<p align="center">
  <img src="img/logo.jpg" alt="RobosMDP Logo" width="120" style="border-radius: 50%;" />
</p>

En Mar del Plata los hechos delictivos y las zonas oscuras o peligrosas suelen quedar dispersos en grupos de Facebook o cadenas de WhatsApp que nadie sistematiza. Reimaginé **RobosMDP** para que cualquier vecino pueda marcar el punto exacto en el mapa, adjuntar una foto y avisar en tiempo real qué pasó en su cuadra, sin vueltas ni formularios de diez páginas.

---

## Cómo funciona

1. **Tocás el mapa o usás tu GPS**: Centrás el mapa en tu ubicación o hacés clic en la esquina exacta donde ocurrió el hecho en General Pueyrredón.
2. **Dirección automática**: Con la API de Nominatim (OpenStreetMap), la app deduce la calle, la altura aproximada y el barrio sin que tengas que tipear todo a mano.
3. **Cargás el reporte**: Elegís la categoría, escribís qué pasó y subís hasta 3 fotos. El navegador comprime las imágenes con HTML5 Canvas antes de mandarlas a Supabase Storage para que no gastes datos ni tardes media hora subiendo fotos de 10 MB.
4. **Comunidad y estado**: Los vecinos pueden dar su apoyo/voto a cada reporte para visibilizar los reclamos más urgentes. Si personal de mantenimiento o seguridad interviene, el estado cambia de *Pendiente* a *En proceso* o *Resuelto* con foto de prueba.

---

## Cómo levantarlo en local

Necesitás Node.js 18 o superior y una cuenta en Supabase.

### 1. Instalar dependencias
```bash
npm install
```

### 2. Base de datos (Supabase)
1. Creá un proyecto en [Supabase](https://supabase.com).
2. Entrá al **SQL Editor** y ejecutá el contenido de [`schema.sql`](./schema.sql). Esto crea las tablas (`reports`, `votes`, `banned_ips`), los índices y las políticas de seguridad (RLS).
3. En **Storage**, creá un bucket público llamado `report-photos`.
4. Si querés probar el panel de moderación, creá un usuario en **Authentication -> Users**.

### 3. Variables de entorno
Copiá `.env.example` a `.env` y poné las claves de tu proyecto:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-jwt
```

### 4. Iniciar el servidor
En Windows podés hacer doble clic en `start_server.bat` (levanta Vite y abre el navegador en `http://localhost:5173`). Para cerrarlo, hacés doble clic en `stop_server.bat`.

O por consola:
```bash
npm run dev
```

---

## Arquitectura y código

El proyecto arrancó como una SPA clásica de React donde los componentes hacían llamadas directas a Supabase. Lo reestructuré en una arquitectura en capas para que el código sea testeable y no dependa de la UI:

- **`src/constants/`**: Catálogo de problemas y listado oficial ordenado de barrios de Mar del Plata (evita duplicación entre formularios y filtros).
- **`src/utils/`**: Compresor de imágenes en cliente (reduce fotos pesadas de celulares a ~250 KB en JPEG) y formateadores de fecha para Argentina.
- **`src/services/`**: Módulos aislados (`reportsService`, `votesService`, `authService`, `storageService`, `geocodingService`, `moderationService`). Si mañana cambiamos Supabase por una API propia, solo se tocan estos archivos.
- **`src/context/` y `src/hooks/`**: Estado global y lógica de negocio. `useReports` escucha eventos en tiempo real mediante WebSockets y muta el estado local en memoria en vez de rehacer una consulta completa (`SELECT *`) con cada voto.
- **`src/components/`**: Componentes visuales limpios de React.

---

## Limitaciones actuales (qué falta todavía)

- **Clustering en el mapa**: Cuando haya más de 300 o 400 pines juntos, Leaflet va a empezar a tironear en teléfonos de gama baja. Hay que integrar `react-leaflet-cluster` para agrupar marcadores por zona.
- **Identidad de vecinos**: No hay login obligatorio para ciudadanos; los votos se atan a un UUID generado en el `localStorage` del navegador. Si alguien borra los datos del sitio, puede volver a votar.
- **Detección de IP**: La IP pública se consulta vía cliente con `ipify`. Si el usuario tiene un bloqueador de publicidad estricto como uBlock o Brave Shields, la petición puede fallar y caer en el fallback local. Lo ideal es mover este chequeo a una Edge Function en el backend.
- **Filtro temporal**: La lista solo filtra por texto, estado y barrio. Falta agregar un selector de rango de fechas para ver únicamente los reportes de la última semana o del último mes.
