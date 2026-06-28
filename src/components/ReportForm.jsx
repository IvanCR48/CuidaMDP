import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { MapPin, Image as ImageIcon, Loader2, X, AlertCircle } from 'lucide-react'

// Barrios principales de Gral. Pueyrredón para el selector
const NEIGHBORHOODS = [
  'Centro',
  'Stella Maris / Los Troncos',
  'Playa Grande / Alem',
  'La Perla / Constitución',
  'Puerto / Colinas de Peralta Ramos',
  'Punta Mogotes',
  'Chauvín / San José',
  'Caisamar / Grosellar',
  'Pompeya / Estación',
  'Batán',
  'Sierra de los Padres',
  'Parque Camet / Las Dalias',
  'Plaza Mitre',
  'Constitución',
  'Florencia Varela / Aeropuerto',
  'Alfar / Playas del Sur',
  'Otro'
].sort()

const CATEGORIES = [
  { value: 'calles', label: 'Baches / Calles' },
  { value: 'alumbrado', label: 'Luminarias / Alumbrado' },
  { value: 'limpieza', label: 'Basura / Limpieza' },
  { value: 'veredas', label: 'Veredas rotas' },
  { value: 'pluviales', label: 'Pluviales / Inundación' },
  { value: 'otro', label: 'Otros problemas' }
]

export default function ReportForm({ location, onCancel, onSubmitSuccess }) {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [clientIp, setClientIp] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState(null)

  // 1. Obtener la IP pública al cargar
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => setClientIp(data.ip))
      .catch((err) => {
        console.warn('No se pudo determinar la IP del cliente:', err)
        setClientIp('127.0.0.1') // Fallback local
      })
  }, [])

  // 2. Autocompletar dirección con Nominatim API al cambiar coordenadas
  useEffect(() => {
    if (location) {
      setGeocoding(true)
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json&accept-language=es`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.address) {
            const road = data.address.road || ''
            const houseNumber = data.address.house_number || ''
            const suburb = data.address.suburb || data.address.neighbourhood || ''
            
            const approxAddress = road 
              ? `${road}${houseNumber ? ' ' + houseNumber : ''}` 
              : data.display_name.split(',').slice(0, 2).join(',')
              
            setAddress(approxAddress)

            // Intentar matchear barrio
            if (suburb) {
              const matched = NEIGHBORHOODS.find((b) => 
                b.toLowerCase().includes(suburb.toLowerCase()) || 
                suburb.toLowerCase().includes(b.toLowerCase())
              )
              if (matched) {
                setNeighborhood(matched)
              } else {
                setNeighborhood('Otro')
              }
            } else {
              setNeighborhood('Otro')
            }
          }
        })
        .catch((err) => console.error('Error reverse geocoding:', err))
        .finally(() => setGeocoding(false))
    }
  }, [location])

  // Manejar cambio de imágenes
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Limitar a máximo 3 fotos
    if (images.length + files.length > 3) {
      alert('Puedes subir hasta un máximo de 3 fotos.')
      return
    }

    setImages(prev => [...prev, ...files])

    // Generar previews
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  // Quitar una foto de la cola
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!category || !description || !address || !neighborhood) {
      setError('Por favor, completa todos los campos obligatorios.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const imageUrls = []

      // 1. Subir fotos si existen al Storage de Supabase
      for (const file of images) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `reports/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('report-photos')
          .upload(filePath, file)

        if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`)

        const { data } = supabase.storage
          .from('report-photos')
          .getPublicUrl(filePath)

        imageUrls.push(data.publicUrl)
      }

      // Obtener el voter_id como client_id para tracking de límites
      const clientId = localStorage.getItem('voter_id')

      // 2. Insertar reporte en la base de datos (con IP y Client ID)
      const { error: insertError } = await supabase
        .from('reports')
        .insert([
          {
            category,
            description,
            address,
            neighborhood,
            latitude: location.lat,
            longitude: location.lng,
            images: imageUrls,
            status: 'pending',
            votes_count: 0,
            ip_address: clientIp,
            client_id: clientId
          }
        ])

      // Si hay error en la base de datos (ej. disparador de baneo o límites de spam)
      if (insertError) {
        throw new Error(insertError.message || 'Error al guardar el reporte.')
      }

      onSubmitSuccess()
    } catch (err) {
      console.error('Error insertando reporte:', err)
      // Capturar específicamente el error del trigger de Supabase y formatearlo
      let cleanErrorMessage = err.message
      if (cleanErrorMessage.includes('row-level security policy')) {
        cleanErrorMessage = 'No tienes permisos para realizar esta acción.'
      }
      setError(cleanErrorMessage || 'Ocurrió un error al enviar el reporte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="report-form-container">
      <div className="form-title-bar">
        <h3>Reportar Problema</h3>
        <button type="button" className="close-btn" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="geolocation-indicator" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {geocoding && (
        <div className="geolocation-indicator">
          <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Determinando dirección aproximada...</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Ubicación del problema</label>
          <div className="geolocation-indicator" style={{ marginBottom: 0 }}>
            <MapPin size={16} />
            <span style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="category">Tipo de Problema *</label>
          <select
            id="category"
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Selecciona una categoría...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="neighborhood">Barrio *</label>
          <select
            id="neighborhood"
            className="form-control"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            required
          >
            <option value="">Selecciona el barrio...</option>
            {NEIGHBORHOODS.map((barrio) => (
              <option key={barrio} value={barrio}>{barrio}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="address">Dirección Aproximada *</label>
          <input
            id="address"
            type="text"
            className="form-control"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Colon y Catamarca"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Descripción del problema *</label>
          <textarea
            id="description"
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe detalladamente el problema para que otros puedan entenderlo..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Subir fotos (Máx. 3)</label>
          <div className="file-upload-wrapper">
            <input
              type="file"
              className="file-upload-input"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={loading}
            />
            <div className="file-upload-content">
              <ImageIcon className="file-upload-icon" />
              <span>Haz clic aquí o arrastra tus fotos</span>
              <span className="helper-text">Formatos JPG, PNG</span>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="image-previews">
              {previews.map((preview, index) => (
                <div key={index} className="image-preview-item">
                  <img src={preview} alt={`preview-${index}`} />
                  <button
                    type="button"
                    className="image-preview-remove"
                    onClick={() => removeImage(index)}
                    disabled={loading}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Enviando...</span>
              </>
            ) : (
              'Publicar Reporte'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
