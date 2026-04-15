import { C } from '../../theme'

export function Footer() {
  return (
    <footer style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 24px',
      borderTop: `1px solid ${C.border}`,
      background: C.bgS1,
      fontSize: 10, color: C.muted,
      flexShrink: 0,
    }}>
      <span>DriftVeil Prototype · Hackathon Build · Predictive Maintenance</span>
      <span style={{ fontFamily: 'JetBrains Mono' }}>
        CUSUM · z-score · Amazon Bedrock · MCP · AWS Strands Agents
      </span>
    </footer>
  )
}
