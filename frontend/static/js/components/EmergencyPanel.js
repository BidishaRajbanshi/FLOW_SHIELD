/**
 * EmergencyPanel Component
 * Dynamic evacuation routing with time-dependent safe window countdowns
 */
import { state } from "../state.js";
import { API } from "../api.js";

export class EmergencyPanel {
  constructor(containerId, cityMapInstance) {
    this.container = document.getElementById(containerId);
    this.cityMap = cityMapInstance;
    this.routes = [];
    this.isLoading = false;
    this.init();

    state.subscribe((changeType, payload) => {
      if (changeType === "time_change" || changeType === "region_selected" || changeType === "mode_change") {
        if (state.activeMode === "emergency") {
          this.fetchAndRender();
        }
      }
    });
  }

  init() {
    this.container.style.display = "none";
  }

  async fetchAndRender() {
    this.container.style.display = "block";
    const originId = state.selectedRegionId || "R09";
    const t = state.currentTime;

    this.isLoading = true;
    try {
      this.routes = await API.fetchEvacuationRoutes(originId, t);
      if (this.cityMap) {
        this.cityMap.setEvacuationRoutes(this.routes);
      }
      this.render();
    } catch (e) {
      console.error("Failed to load evacuation routes", e);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    const originId = state.selectedRegionId || "R09";
    const reg = state.cityTopology[originId];
    const tsData = state.getCurrentTimestepData();
    const regState = tsData ? tsData.regions[originId] : null;

    if (!reg) return;

    let routesHtml = "";
    if (this.routes && this.routes.length > 0) {
      routesHtml = this.routes.map((r, idx) => {
        const isSafe = r.is_currently_safe;
        const color = isSafe ? (r.safe_window_minutes > 25 ? "#10b981" : "#f59e0b") : "#ef4444";
        const bg = isSafe ? (r.safe_window_minutes > 25 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)") : "rgba(239, 68, 68, 0.2)";

        const waypoints = r.path.map((p) => `
          <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; color: ${p.risk_state === 'CRITICAL' ? '#ef4444' : p.risk_state === 'WARNING' ? '#f59e0b' : '#34d399'}; font-family: monospace;">
            ${p.region_id} ${p.is_safe ? '✓' : '⚠'}
          </span>
        `).join('<span style="color: #64748b; margin: 0 4px;">→</span>');

        return `
          <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid ${color}; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="font-size: 0.84rem; font-weight: 800; color: #fff;">
                ${r.name} → ${r.destination_name}
              </div>
              <span style="background: ${bg}; color: ${color}; border: 1px solid ${color}; font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; font-family: monospace;">
                ${r.status_label}
              </span>
            </div>

            <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 8px;">
              Waypoints: ${waypoints}
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;">
              <span>Safe Window: <b style="color: ${color};">${r.safe_window_minutes} min</b></span>
              <span>Distance Score: <b style="color: #38bdf8;">${r.total_distance_score} km</b></span>
              <span>Priority: <b style="color: #c084fc;">Rank #${r.recommendation_rank}</b></span>
            </div>
          </div>
        `;
      }).join("");
    } else {
      routesHtml = `<div style="color: #64748b; font-size: 0.78rem;">Calculating safe corridors...</div>`;
    }

    this.container.innerHTML = `
      <div class="card-panel" style="border-color: rgba(239, 68, 68, 0.4);">
        <div class="card-panel-header">
          <span class="card-title" style="color: #f87171;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
            EMERGENCY EVACUATION DISPATCH
          </span>
          <span style="font-size: 0.7rem; color: #fca5a5; font-family: monospace;">ORIGIN: ${reg.code}</span>
        </div>

        <div style="font-size: 0.74rem; color: #cbd5e1;">
          Real-time dynamic pathfinding routing vulnerable populations from <b>${reg.code} (${reg.name})</b>
          to elevated sanctuaries (R20 Highland Sanctuary & R17 Emergency Hub) avoiding active and impending inundation.
        </div>

        <div>
          ${routesHtml}
        </div>
      </div>
    `;
  }
}
