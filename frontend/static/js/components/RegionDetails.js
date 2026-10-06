/**
 * RegionDetails Component
 * Deep-dive inspector for selected zone
 */
import { state } from "../state.js";

export class RegionDetails {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
    state.subscribe((changeType, payload) => {
      if (changeType === "time_change" || changeType === "region_selected") {
        this.render();
      }
    });
  }

  init() {
    this.render();
  }

  render() {
    const regId = state.selectedRegionId;
    const reg = state.cityTopology[regId];
    const tsData = state.getCurrentTimestepData();

    if (!reg || !tsData) {
      this.container.innerHTML = `
        <div class="card-panel">
          <div style="font-size: 0.8rem; color: #64748b;">Select a region on the map to inspect telemetry.</div>
        </div>
      `;
      return;
    }

    const regState = tsData.regions[regId] || {
      water_level: 0,
      risk_state: "SAFE",
      inflow: 0,
      outflow: 0,
      drainage_actual: 0,
      absorption_actual: 0,
      flooded_area_pct: 0
    };

    let riskBadgeColor = "#10b981";
    let riskBg = "rgba(16, 185, 129, 0.15)";
    if (regState.risk_state === "WARNING") {
      riskBadgeColor = "#f59e0b";
      riskBg = "rgba(245, 158, 11, 0.2)";
    } else if (regState.risk_state === "CRITICAL") {
      riskBadgeColor = "#ef4444";
      riskBg = "rgba(239, 68, 68, 0.25)";
    }

    this.container.innerHTML = `
      <div class="card-panel">
        <div class="card-panel-header">
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span style="font-size: 1.05rem; font-weight: 800; color: #fff; font-family: monospace;">${reg.code}</span>
            <span style="font-size: 0.82rem; color: #94a3b8; font-weight: 600;">${reg.name}</span>
          </div>
          <span style="background: ${riskBg}; color: ${riskBadgeColor}; border: 1px solid ${riskBadgeColor}; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; font-family: monospace;">
            ${regState.risk_state}
          </span>
        </div>

        <div style="font-size: 0.74rem; color: #94a3b8; line-height: 1.4;">
          ${reg.description}
        </div>

        <!-- Water Level Depth Bar -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 4px;">
            <span style="color: #94a3b8;">WATER LEVEL</span>
            <b style="color: #38bdf8; font-family: monospace;">${regState.water_level.toFixed(2)}m / ${reg.critical_threshold.toFixed(2)}m CRIT</b>
          </div>
          <div style="background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden; position: relative;">
            <div style="background: ${riskBadgeColor}; width: ${Math.min(100, (regState.water_level / reg.critical_threshold) * 100)}%; height: 100%;"></div>
          </div>
        </div>

        <!-- Flow Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.72rem;">
          <div class="metric-pill">
            <div class="label">INFLOW RATE</div>
            <div class="val" style="color: #38bdf8; font-size: 0.95rem;">${regState.inflow.toFixed(1)} <span style="font-size: 0.65rem;">mm/m</span></div>
          </div>
          <div class="metric-pill">
            <div class="label">OUTFLOW RATE</div>
            <div class="val" style="color: #94a3b8; font-size: 0.95rem;">${regState.outflow.toFixed(1)} <span style="font-size: 0.65rem;">mm/m</span></div>
          </div>
          <div class="metric-pill">
            <div class="label">DRAINAGE CAP</div>
            <div class="val" style="color: #10b981; font-size: 0.95rem;">${reg.drainage_capacity} <span style="font-size: 0.65rem;">mm/h</span></div>
          </div>
          <div class="metric-pill">
            <div class="label">ELEVATION</div>
            <div class="val" style="color: #c084fc; font-size: 0.95rem;">${reg.elevation}m</div>
          </div>
        </div>

        <button class="header-btn" id="btn-inspect-causality" style="justify-content: center; font-size: 0.78rem; background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.4); color: #c084fc;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          WHY IS THIS REGION FLOODING?
        </button>
      </div>
    `;

    document.getElementById("btn-inspect-causality")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("open_causality_view", { detail: { regionId: regId } }));
    });
  }
}
