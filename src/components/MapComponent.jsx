import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

// Centrado por defecto en Mar del Plata
const MDP_CENTER = [-38.005477, -57.542611]

// Icono personalizado para el pin de reporte seleccionado o nuevo
const createPinIcon = (color) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        animation: pulsePin 1.5s infinite alternate;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ffffff;
        "></div>
      </div>
      <style>
        @keyframes pulsePin {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
      </style>
    `,
    className: 'custom-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  })
}

// Icono para los reportes según su estado
const getStatusIcon = (status) => {
  let color = '#ef4444' // pending (red)
  if (status === 'resolved') color = '#10b981' // resolved (green)
  if (status === 'in_progress') color = '#f59e0b' // in_progress (yellow)
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    className: 'status-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  })
}

// Subcomponente para manejar eventos del mapa (clic para reportar)
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    }
  })
  return null
}

// Subcomponente para centrar el mapa dinámicamente
function MapViewCenterer({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() > 13 ? map.getZoom() : 15, {
        animate: true,
        duration: 1
      })
    }
  }, [center, map])
  return null
}

export default function MapComponent({ 
  reports, 
  onMapClick, 
  selectedLocation, 
  onSelectReport, 
  activeReport, 
  mapCenter 
}) {
  const [userLocation, setUserLocation] = useState(null)
  const [localMapCenter, setLocalMapCenter] = useState(MDP_CENTER)

  // Sincronizar el centro externo del mapa si existe
  useEffect(() => {
    if (mapCenter) {
      setLocalMapCenter(mapCenter)
    }
  }, [mapCenter])

  // Función para obtener ubicación actual del usuario
  const locateUser = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por tu navegador.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const loc = [latitude, longitude]
        setUserLocation(loc)
        setLocalMapCenter(loc)
        // Disparar clic simulado en su ubicación para abrir el formulario
        onMapClick({ lat: latitude, lng: longitude })
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error)
        alert('No se pudo acceder a tu ubicación. Por favor, haz clic directamente en el mapa.')
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="map-container-wrapper">
      <MapContainer 
        center={localMapCenter} 
        zoom={13} 
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Botón flotante para ubicar usuario (se posiciona mediante Leaflet Controls o CSS overlay) */}
        <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', zIndex: 1000, margin: '20px' }}>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={locateUser}
            style={{ 
              borderRadius: '50%', 
              width: '50px', 
              height: '50px', 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-lg)'
            }}
            title="Usar mi ubicación actual"
          >
            <Navigation size={22} fill="white" />
          </button>
        </div>

        <MapViewCenterer center={localMapCenter} />
        <MapEvents onMapClick={onMapClick} />

        {/* Marcador de la ubicación del usuario si la habilitó */}
        {userLocation && (
          <Marker position={userLocation} icon={createPinIcon('#3b82f6')}>
            <Popup>Tu ubicación actual</Popup>
          </Marker>
        )}

        {/* Marcador del pin seleccionado para crear un nuevo reporte */}
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={createPinIcon('#3b82f6')}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>Nuevo reporte aquí</strong><br />
                Completa el formulario en el panel lateral.
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores para los reportes existentes */}
        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]} 
            icon={getStatusIcon(report.status)}
            eventHandlers={{
              click: () => onSelectReport(report)
            }}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                  {report.status === 'resolved' && <CheckCircle size={14} color="var(--success)" />}
                  {report.status === 'in_progress' && <Clock size={14} color="var(--warning)" />}
                  {report.status === 'pending' && <AlertTriangle size={14} color="var(--danger)" />}
                  <strong style={{ textTransform: 'capitalize' }}>{report.category}</strong>
                </div>
                <p style={{ fontSize: '12px', margin: '4px 0', color: 'var(--text-muted)' }}>
                  {report.neighborhood}
                </p>
                <p style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {report.address}
                </p>
                <button 
                  className="btn btn-primary btn-sm btn-block mt-4"
                  onClick={() => onSelectReport(report)}
                >
                  Ver Detalles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
