import { useState } from 'react'
import { VEHICLE_ICONS } from '../utils/vehicleIcons'

export default function VehiclePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="vehicle-picker">
      <button
        className="vehicle-picker-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change vehicle marker"
        aria-expanded={open}
      >
        {value}
      </button>

      {open && (
        <div className="vehicle-picker-menu" role="menu">
          {VEHICLE_ICONS.map((v) => (
            <button
              key={v.emoji}
              role="menuitem"
              className={`vehicle-picker-option${v.emoji === value ? ' is-active' : ''}`}
              onClick={() => {
                onChange(v.emoji)
                setOpen(false)
              }}
              aria-label={v.label}
              title={v.label}
            >
              {v.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
