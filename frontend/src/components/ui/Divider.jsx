import { C } from '../../theme'

export function Divider({ vertical = false }) {
  return (
    <div style={{
      background: C.border,
      [vertical ? 'width' : 'height']: 1,
      [vertical ? 'height' : 'width']: '100%',
      flexShrink: 0,
    }} />
  )
}
