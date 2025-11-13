/**
 * DaybreakLogo Component
 * 
 * Daybreak Health logo from https://care.daybreakhealth.com/daybreak-logo-type.svg
 */
export default function DaybreakLogo({ className = '', size = 'default' }) {
  // Size variants - width in pixels
  const sizes = {
    small: 116,   // ~2/3 of default
    default: 174, // Original size
    large: 261    // ~1.5x of default
  }
  
  const width = sizes[size] || sizes.default
  // Maintain aspect ratio (174:39)
  const height = Math.round((width * 39) / 174)
  
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/daybreak-logo-type.svg"
        alt="Daybreak Health"
        width={width}
        height={height}
        className="h-auto"
      />
    </div>
  )
}

