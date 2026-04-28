import React from 'react';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 130;

const NODES = [
  { id: 'telemetry', x: 40, y: 160, title: 'Live Telemetry', sub: 'MQTT / SCADA', type: 'trigger', icon: 'TM', status: 'active', desc: 'Continuous stream of temperature, vibration, and RPM data from the physical factory floor.' },
  { id: 'mcp', x: 380, y: 160, title: 'MCP Server', sub: 'SQLite / TimescaleDB', type: 'mcp', icon: 'DB', status: 'active', desc: 'Standardized Model Context Protocol layer. Secures the DB behind explicit endpoints.' },
  { id: 'react', x: 740, y: 40, title: 'ReAct Chat Agent', sub: 'Gemini 2.5 Flash', type: 'ai', icon: 'AI', desc: 'Autonomous conversational agent. Intelligently queries the MCP server in real-time to answer operator questions.' },
  { id: 'monitor', x: 740, y: 280, title: 'Monitor Agent', sub: 'Python Daemon', type: 'mcp', icon: 'CR', desc: 'Background task polling the MCP server every few seconds to grab the latest synchronous sensor snapshot.' },
  { id: 'detection', x: 1100, y: 280, title: 'Detection Agent', sub: 'CUSUM Algorithm', type: 'math', icon: 'FX', desc: 'Calculates cumulative drift slope. Triggers the LLM diagnostic pipeline ONLY when the math exceeds threshold.' },
  { id: 'diagnostic', x: 1460, y: 280, title: 'Diagnostic Agent', sub: 'Gemini Structured Output', type: 'ai', icon: 'AG', desc: 'Triggered by math. Fetches known failure fingerprints from MCP. Diagnoses root cause and outputs a strict JSON.' },
  { id: 'ui', x: 1820, y: 280, title: 'Operator UI', sub: 'React Frontend', type: 'output', icon: 'UI', status: 'active', desc: 'Renders the exact failure type, ETA, and recommended action in plain English for the factory operator.' },
];

const EDGES = [
  { from: 'telemetry', to: 'mcp' },
  { from: 'mcp', to: 'react' },
  { from: 'mcp', to: 'monitor' },
  { from: 'monitor', to: 'detection' },
  { from: 'detection', to: 'diagnostic' },
  { from: 'diagnostic', to: 'ui' },
];

const Node = ({ title, sub, icon, type, status, desc, x, y }) => {
  const getTheme = () => {
    switch (type) {
      case 'trigger': return { border: 'var(--accent-info)', bg: 'var(--accent-info-dim)', iconBg: 'var(--accent-info)' };
      case 'mcp': return { border: 'var(--text-subtle)', bg: 'var(--bg-row-alt)', iconBg: 'var(--text-subtle)' };
      case 'ai': return { border: 'var(--accent-critical)', bg: 'var(--accent-critical-dim)', iconBg: 'var(--accent-critical)' };
      case 'math': return { border: 'var(--accent-warn)', bg: '#332a00', iconBg: 'var(--accent-warn)' };
      case 'output': return { border: 'var(--accent-safe)', bg: 'var(--accent-safe-dim)', iconBg: 'var(--accent-safe)' };
      default: return { border: 'var(--border)', bg: 'var(--bg-panel)', iconBg: 'var(--border)' };
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute group" style={{ left: x, top: y, width: NODE_WIDTH, height: NODE_HEIGHT, background: 'var(--bg-panel)', borderRadius: 8, border: `1px solid var(--border)`, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 10 }}>

      {/* Node Header */}
      <div className="flex items-center gap-3 px-3 py-2" style={{ borderBottom: `1px solid var(--border)`, background: theme.bg }}>
        <div style={{ width: 24, height: 24, borderRadius: 4, background: theme.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-panel)', fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono', letterSpacing: '0.05em' }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>
        </div>
        {status && (
          <div className="ml-auto" style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'active' ? 'var(--accent-safe)' : 'var(--text-muted)', boxShadow: status === 'active' ? '0 0 8px var(--accent-safe)' : 'none' }} />
        )}
      </div>

      {/* Node Body */}
      <div className="p-3">
        <p style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.5 }}>
          {desc}
        </p>
      </div>

      {/* Input/Output Ports */}
      <div className="absolute -left-1.5 w-3 h-3 rounded-full border-2" style={{ top: NODE_HEIGHT / 2 - 6, background: 'var(--bg-panel)', borderColor: 'var(--border)' }} />
      <div className="absolute -right-1.5 w-3 h-3 rounded-full border-2" style={{ top: NODE_HEIGHT / 2 - 6, background: 'var(--bg-panel)', borderColor: 'var(--border)' }} />
    </div>
  );
};

const Edge = ({ from, to }) => {
  const fromNode = NODES.find(n => n.id === from);
  const toNode = NODES.find(n => n.id === to);
  
  if (!fromNode || !toNode) return null;

  const x1 = fromNode.x + NODE_WIDTH;
  const y1 = fromNode.y + NODE_HEIGHT / 2;
  const x2 = toNode.x;
  const y2 = toNode.y + NODE_HEIGHT / 2;

  const offset = Math.max(Math.abs(x2 - x1) / 2, 40);
  const cp1x = x1 + offset;
  const cp1y = y1;
  const cp2x = x2 - offset;
  const cp2y = y2;

  return (
    <path 
      d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} 
      stroke="var(--text-subtle)" 
      strokeWidth="2" 
      fill="none" 
      markerEnd="url(#arrow)"
    />
  );
};

export function ArchitectureView() {
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-header)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--accent-info)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, marginBottom: 4 }}>
          Visual Flow
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.01em', marginBottom: 4 }}>
          Agent Architecture
        </h1>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto relative" style={{ background: 'var(--bg-row-alt)', backgroundImage: 'radial-gradient(var(--border) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        
        {/* Infinite Canvas Container */}
        <div style={{ width: 2200, height: 600, position: 'relative' }}>
          
          {/* SVG Layer for Edges */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-subtle)" />
              </marker>
            </defs>
            {EDGES.map((edge, i) => (
              <Edge key={i} from={edge.from} to={edge.to} />
            ))}
          </svg>

          {/* HTML Layer for Nodes */}
          {NODES.map((node) => (
            <Node key={node.id} {...node} />
          ))}

        </div>
      </div>
    </div>
  );
}
