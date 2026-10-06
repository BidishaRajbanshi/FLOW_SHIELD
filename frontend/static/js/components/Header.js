/**
 * Header Component
 * Command center status bar, operational triggers, and mode selectors
 */
import { state } from "../state.js";

export class Header {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
    state.subscribe((changeType, payload) => {
      if (changeType === "time_change" || changeType === "playback_state") {
        this.updateTimeDisplay();
      }
    });
  }

  init() {
    this.container.innerHTML = `
      <div class="brand-section">
        <div class="brand-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div>
          <div class="brand-title">FLOW-SHIELD</div>
          <div class="brand-tagline">COUNTERFACTUAL FLOOD DIGITAL TWIN</div>
        </div>
      </div>

      <div class="header-status-group">
        <div class="live-indicator">
          <div class="pulse-dot"></div>
          <span id="header-sim-status">SIMULATING URBAN BASIN</span>
        </div>

        <div class="hud-pill" style="border-color: rgba(6, 182, 212, 0.4);">
          <span>TIMESTAMP:</span>
          <b id="header-time-val" style="color: #38bdf8; font-size: 0.9rem;">T+00:00 MIN</b>
        </div>

        <button class="header-btn btn-what-if" id="btn-open-whatif" title="Open Counterfactual Simulation Lab">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          WHAT IF?
        </button>

        <button class="header-btn btn-emergency" id="btn-toggle-emergency" title="Toggle Emergency Evacuation Routing">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          EMERGENCY OPS
        </button>

        <button class="header-btn" id="btn-open-copilot" style="border-color: rgba(168, 85, 247, 0.4);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          FLOW-COPILOT
        </button>

        <button class="header-btn" id="btn-open-report" style="color: #94a3b8;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
          REPORT
        </button>
      </div>
    `;

    // Bind event handlers
    document.getElementById("btn-open-whatif").addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("open_whatif_modal"));
    });

    document.getElementById("btn-toggle-emergency").addEventListener("click", (e) => {
      const btn = e.currentTarget;
      btn.classList.toggle("active");
      const isEmergency = btn.classList.contains("active");
      state.activeMode = isEmergency ? "emergency" : "twin";
      state.notify("mode_change", { mode: state.activeMode });
    });

    document.getElementById("btn-open-copilot").addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("toggle_copilot_drawer"));
    });

    document.getElementById("btn-open-report").addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("open_report_modal"));
    });
  }

  updateTimeDisplay() {
    const timeEl = document.getElementById("header-time-val");
    if (timeEl) {
      const mins = state.currentTime;
      const formatted = mins < 10 ? `0${mins}` : `${mins}`;
      timeEl.textContent = `T+${formatted}:00 MIN`;
    }
  }
}
