# 🌊 FLOW-SHIELD
### *"Predict the flood. Simulate the response. Protect the future."*

**FLOW-SHIELD** is an interactive, deterministic **Counterfactual Flood Digital Twin** designed for municipal emergency operations, urban resilience planning, and disaster mitigation.

Traditional flood monitoring systems only answer:
> *"Where will flooding happen?"*

**FLOW-SHIELD** fundamentally transforms flood management by answering:
> *"What happens if we intervene before the flood becomes critical?"*

---

## 🚀 Key Innovations

### 1. Deterministic Hydro-Topographic Simulation Engine
- **No LLM in the physics loop**: 100% explainable, deterministic time-series physics.
- **Topographic Hydraulic Gradient**: Models conservation of mass, gravity-driven head differential, impervious surface concentration, and soil absorption.
- **Physical equation**:
  $$\text{effective\_level}_i = \text{elevation}_i + \text{water\_level}_i$$
  $$\text{flow}_{i \to j} = \text{connectivity}_{ij} \times \max\left(0, \text{effective\_level}_i - \text{effective\_level}_j\right)$$
  $$\text{water}_{i}(t+1) = \max\left(0, \text{water}_i(t) + \text{rainfall}_i + \sum \text{inflow} - \sum \text{outflow} - \text{drainage}_i - \text{absorption}_i\right)$$
- Supports playback speeds of **1x, 5x, 10x, and 50x**.

### 2. Digital City Twin (20 Interconnected Zones)
- Features 20 realistic interconnected sectors (elevations ranging from 938m safe summits down to 852m valley sinks).
- Engineered cascade topology:
  $$\text{Zone B (Upper Industrial)} \longrightarrow \text{Zone C (Transit Corridor)} \longrightarrow \text{Zone D (Commerce Hub)} \longrightarrow \text{Zone E (South Valley Slums)}$$
- 60 FPS HTML5 Canvas particle system animating water currents with velocity and density proportional to physical flow rates.

### 3. The Flood Butterfly Effect
- Identifies and visually traces cascading failure paths:
  $$\text{Origin (Zone B)} \longrightarrow \text{First Cascade (Zone C)} \longrightarrow \text{Second Cascade (Zone D)} \longrightarrow \text{Critical Inundation (Zone E)}$$
- Displays cumulative transfer percentages, time lag between threshold breaches, and volume contributions.

### 4. "Why is this Region Flooding?" Causal Factor Attribution
- Clicking any zone opens a physical attribution panel with horizontal bar charts:
  - **Upstream Inflow %** (detailed breakdown of each contributing upstream conduit)
  - **Direct Rainfall %** (local precipitation rate)
  - **Local Drainage Limitation %** (unmet capacity / box drain bottlenecks)
  - **Low Topographic Elevation %** (gravity depression factor)

### 5. Future Vision: Predictive Next Critical Event
- Does not just display current water depth. Communicates impending risk:
  - **Next Critical Event**: Region, time remaining, and projected breach threshold.
  - **Following Event**: Downstream warning countdowns.

### 6. "WHAT IF?" Counterfactual Simulation Lab
- Clones baseline state **without mutating history**.
- Allows users to configure custom interventions:
  1. Rainfall intensity adjustment (40 - 150 mm/hr)
  2. Drainage capacity boost (+0% to +60%)
  3. Upstream bypass water diversion (0% to 50% from Zone B into canal)
  4. High-capacity mobile diesel pumps
  5. Deployable sluice barrier gates
  6. Green sponge infrastructure absorption (+0% to +40%)
- Compares **Baseline vs Scenario**:
  - Critical zones reduction (e.g., $3 \to 0$)
  - Flooded area percentage reduction
  - Delay in first critical breach (+39 minutes)

### 7. Emergency Ops & Dynamic Evacuation Routing
- Computes time-dependent evacuation corridors from vulnerable zones to safe sanctuaries (R20 Highland Sanctuary & R17 Emergency Hub).
- Accounts for impending inundation:
  - *"SAFE FOR 35 MINUTES (RECOMMENDED)"*
  - *"SAFE NOW, BECOMES FLOODED IN 12 MINUTES"*
  - *"IMPASSABLE - SUBMERGED ROAD"*

### 8. FLOW-COPILOT AI Assistant
- Grounded intelligence reading live simulation telemetry.
- Seamless dual-mode: uses **Google Gemini 1.5** when API key is provided, with a zero-failure deterministic semantic reasoning fallback.

### 9. Citizen Flood Reporting
- Crowdsourced observation tool allowing community wardens to log depth and location, placing advisory markers on the digital twin.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic, NumPy
- **Frontend**: Modern ES6 Modules, HTML5 Canvas 60 FPS Particle Flow Engine, SVG Topology, Custom Futuristic Glassmorphism CSS
- **Database**: SQLite / In-Memory State Store
- **AI**: Grounded Dual-Mode Assistant (Google Gemini API + Deterministic Telemetry Reasoner)

---

## 🏁 Quickstart: Running the Application

### 1. Launch Server (Single Command)
```powershell
python run.py
```

### 2. Open Command Center in Browser
Navigate to:
```
http://localhost:8000
```

---

## 🎯 10-Step Judge Walkthrough Experience

1. **Observe T+0**: The city is mostly green and safe.
2. **Press Play (or drag Time Machine)**: Watch the storm begin at 85 mm/hr. Water currents begin streaming along conduits.
3. **At T+15 min**: Zone D (Commerce Center) reaches warning/critical state.
4. **At T+24 min**: Zone E (South Valley Slums) is inundated by upstream runoff.
5. **Click Zone E**: View the **"Why is this Region Flooding?"** causal breakdown showing **57% Upstream Inflow**.
6. **Open "Cascade Tree"**: Visually trace the **Flood Butterfly Effect** from Zone B $\to$ Zone C $\to$ Zone D $\to$ Zone E.
7. **Click "WHAT IF?"**: Open the Counterfactual Lab. Select **Scenario D** (Combined Strategic Defense) or customize your own interventions.
8. **Click "Simulate Counterfactual"**: The second simulation executes. View the side-by-side **Simulation Complete** comparison cards.
9. **Click "Emergency Ops"**: Inspect dynamic evacuation corridors from Zone E with time-to-flood indicators.
10. **Open "FLOW-COPILOT"**: Ask *"Why is Zone E flooding?"* or *"Compare Scenario A and Scenario B"* to see grounded AI explanations.
