import React from 'react'
import {
  AlertTriangle,
  Lightbulb,
  Trash2,
  Footprints,
  Droplets,
  HelpCircle
} from 'lucide-react'

export const CATEGORIES = [
  { value: 'calles', label: 'Baches / Calles' },
  { value: 'alumbrado', label: 'Luminarias / Alumbrado' },
  { value: 'limpieza', label: 'Basura / Limpieza' },
  { value: 'veredas', label: 'Veredas rotas' },
  { value: 'pluviales', label: 'Pluviales / Inundación' },
  { value: 'otro', label: 'Otros problemas' }
]

export const getCategoryIcon = (category, size = 18) => {
  switch (category) {
    case 'calles':
      return <AlertTriangle size={size} style={{ color: 'var(--text-muted)' }} />
    case 'alumbrado':
      return <Lightbulb size={size} style={{ color: '#eab308' }} />
    case 'limpieza':
      return <Trash2 size={size} style={{ color: '#22c55e' }} />
    case 'veredas':
      return <Footprints size={size} style={{ color: '#f97316' }} />
    case 'pluviales':
      return <Droplets size={size} style={{ color: '#3b82f6' }} />
    default:
      return <HelpCircle size={size} style={{ color: '#a855f7' }} />
  }
}

export const getCategoryLabel = (category) => {
  const found = CATEGORIES.find((c) => c.value === category)
  return found ? found.label : 'Otros'
}
