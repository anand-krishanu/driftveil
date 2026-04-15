# AI Code Generation Prompt: DriftVeil Industrial Dashboard

*Copy and paste the exact text below into your AI coding assistant (like Cursor, v0, or Copilot) to instantly generate the perfect professional dashboard for your React prototype.*

***

**PROMPT TO COPY:**

Act as an expert React (Vite) and TailwindCSS frontend developer specializing in enterprise industrial software. Build the main dashboard for "DriftVeil," an AI platform that detects early machine degradation via time-series sensor data before standard alarms trigger.

**STRICT DESIGN CONSTRAINTS:**
- **Vibe:** Ultra-professional, formal, mission-critical industrial SCADA software. 
- **Colors:** STRICTLY monochromatic or very muted dark mode (e.g., slate, zinc, black). NO gradients. NO bright accent splashes. Use exactly one accent color exclusively for critical alerts (e.g., a muted amber/red for warnings).
- **Decorations:** Minimal to no icons. Flat design, sharp corners (or very slight rounding `rounded-sm`), heavy use of data tables and data-dense cards. No drop-shadows; use thin minimal borders for separation.

**ROLES & VIEWS TO TAB BETWEEN:**
1. **Plant Operator View (Default):** High-level line status, unified health scores, simple green/amber system indicators, and the prominent Intelligent Alert Panel.
2. **Maintenance Engineer View:** Dense data tables, detailed multi-series charts, and raw CUSUM mathematical anomaly scores visible for deep-dives.

**CORE COMPONENTS REQUIRED:**
1. **Top Navigation/Status Bar:** System status ("Monitoring 12 Active Nodes"), Role toggles, and live server connection status.
2. **The "Golden Demo" Chart (Main Focus):** 
   - Integrate `recharts`. Build a prominent multi-series line chart tracking "Temperature" and "Vibration" over time.
   - **CRITICAL:** Add a dashed horizontal ReferenceLine at `y=100` colored red. This represents the legacy SCADA alarm threshold. The sensor data lines must slowly drift upwards over time but *never* touch this red line.
3. **The Intelligent Alert Card:**
   - A distinct card component that is conditionally rendered when an anomaly is detected during the simulation.
   - Must contain: Title (e.g., "Early Bearing Wear Detected"), AI Confidence Score (e.g., "89%"), Predictive ETA (e.g., "Failure in 9 Days"), and Prescriptive Action (e.g., "Schedule lubrication within 48h") in plain-English text.
4. **Simulation Controls:** A small, discreet "Developer Panel" with a "Start Factory Feed" button that drives the demo. When clicked, it should simulate time passing by streaming new mock data points into the chart sequentially.

Build this using `shadcn/ui` components where possible (`Card`, `Button`, `Badge`, `Tabs` for switching views). Make the layout optimized for large desktop monitors, prioritizing data density and clarity over flashy aesthetics. Use mock state to ensure the chart is populated so the "Start Factory Feed" animation can be tested immediately.
