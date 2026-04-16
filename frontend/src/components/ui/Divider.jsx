export function Divider({ vertical = false }) {
  return (
    <div className={`bg-borderPrimary shrink-0 ${vertical ? 'w-px h-full' : 'h-px w-full'}`} />
  )
}
