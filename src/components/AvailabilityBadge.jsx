// Small "Available" / "Not available" pill, always rendered (unlike a
// dot that only appears when true). Green fill for available, no fill
// (just an outline) for not available — used over media, so it needs to
// stay legible on both light and dark backgrounds.
export default function AvailabilityBadge({ available, className = '' }) {
  return (
    <span
      className={`inline-flex items-center text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border-[1.5px] shadow backdrop-blur-sm transition ${
        available ? 'bg-[#16C784] text-white border-black' : 'bg-white/10 text-white/80 border-white/50'
      } ${className}`}
    >
      {available ? 'Available' : 'Not available'}
    </span>
  )
}
