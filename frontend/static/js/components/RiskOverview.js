/**
 * RiskOverview Component
 * Citywide risk telemetry, flooded area gauge, and Next Critical Event alerts
 */
import { state } from "../state.js";

export class RiskOverview {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
    state.subscribe((changeType, payload) => {
      if (changeType === "time_change" || changeType === "mode_change") {
        this.render();
      }
    });
  }

  init() {
    this.render();
  }

  render() {
    const tsData = state.getCurrentTimestepData();
    const sim = state.activeSimulation || state.baselineSimulation;
    if (!tsData || !sim) return;

    const t = state.currentTime;

    // Calculate dynamic Next Critical Event relative to current time t
    let nextEvent = null;
    let followingEvent = null;

    const upcomingCrits = sim.critical_events_timeline.filter(
      (ev) => ev.event_type === "CRITICAL_REACHED" && ev.time_minutes >= t
    );

    if (upcomingCrits.length > 0) {
      nextEvent = upcomingCrits[0];
      if (upcomingCrits.length > 1) {
        followingEvent = upcomingCrits[1];
      }
    }

    const nextMinsLeft = nextEvent ? Math.max(0, nextEvent.time_minutes - t) : null;
    const follMinsLeft = followingEvent ? Math.max(0, followingEvent.time_minutes - t) : null;

    this.container.innerHTML = `
      <!-- Future Vision: Next Critical Event (Section 9) -->
      <div class="card-panel critical-prediction-card">
        <div class="card-panel-header">
          <span class="card-title" style="color: #f87171;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            NEXT CRITICAL EVENT
          </span>
          <span style="font-size: 0.72rem; color: #fca5a5; font-family: monospace;">PREDICTIVE</span>
        </div>

        ${
          nextEvent
            ? `
          <div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">
              ${nextEvent.region_code} (${nextEvent.region_name})
            </div>
            <div class="prediction-countdown">
              ${nextMinsLeft} <span>MINUTES REMAINING</span>
            </div>
            <div style="font-size: 0.75rem; color: #cbd5e1; margin-top: 4px;">
              Projected to breach critical threshold (${nextEvent.time_minutes} min mark).
            </div>
          </div>

          ${
            followingEvent
              ? `
            <div style="border-top: 1px dashed rgba(239, 68, 68, 0.3); padding-top: 8px; margin-top: 6px;">
              <div style="font-size: 0.68rem; color: #94a3b8; text-transform: uppercase;">FOLLOWING EVENT</div>
              <div style="font-size: 0.88rem; font-weight: 700; color: #fca5a5;">
                ${followingEvent.region_code} in ${follMinsLeft} minutes
              </div>
            </div>
          `
              : ""
          }
        `
            : `
          <div style="padding: 10px 0;">
            <div style="font-size: 0.95rem; font-weight: 700; color: #34d399;">
              ✓ NO FURTHER CRITICAL BREACHES
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">
              Drainage channels are handling current runoff equilibrium.
            </div>
          </div>
        `
        }
      </div>

      <!-- Citywide Risk Telemetry -->
      <div class="card-panel">
        <div class="card-panel-header">
          <span class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
              <line x1="6" y1="6" x2="6.01" y2="6"/>
              <line x1="6" y1="18" x2="6.01" y2="18"/>
            </svg>
            CITYWIDE FLOOD RISK
          </span>
          <span style="font-size: 0.7rem; color: #64748b; font-family: monospace;">T+${t} MIN</span>
        </div>

        <div class="metrics-row">
          <div class="metric-pill" style="border-color: rgba(16, 185, 129, 0.3);">
            <div class="label" style="color: #34d399;">SAFE</div>
            <div class="val" style="color: #10b981;">${tsData.safe_count}</div>
          </div>
          <div class="metric-pill" style="border-color: rgba(245, 158, 11, 0.3);">
            <div class="label" style="color: #fbbf24;">WARNING</div>
            <div class="val" style="color: #f59e0b;">${tsData.warning_count}</div>
          </div>
          <div class="metric-pill" style="border-color: rgba(239, 68, 68, 0.4);">
            <div class="label" style="color: #f87171;">CRITICAL</div>
            <div class="val" style="color: #ef4444;">${tsData.critical_count}</div>
          </div>
        </div>

        <!-- Flooded Footprint Bar -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 4px;">
            <span style="color: #94a3b8;">FLOODED CITY FOOTPRINT</span>
            <b style="color: #38bdf8; font-family: monospace;">${tsData.total_flooded_area_pct}% AREA</b>
          </div>
          <div style="background: #1e293b; height: 7px; border-radius: 4px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #06b6d4, #ef4444); width: ${Math.min(
              100,
              tsData.total_flooded_area_pct * 2.5
            )}%; height: 100%; transition: width 0.2s ease;"></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <button class="header-btn" id="btn-replay-flood" style="flex: 1; justify-content: center; font-size: 0.75rem;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 19 2 12 11 5 11 19"/>
              <polygon points="22 19 13 12 22 5 22 19"/>
            </svg>
            REPLAY FLOOD
          </button>
          <button class="header-btn" id="btn-view-butterfly" style="flex: 1; justify-content: center; font-size: 0.75rem; border-color: rgba(168, 85, 247, 0.4);">
            CASCADE TREE
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-replay-flood")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("open_replay_modal"));
    });

    document.getElementById("btn-view-butterfly")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("open_butterfly_view"));
    });
  }
}
