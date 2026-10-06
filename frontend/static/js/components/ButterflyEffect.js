/**
 * ButterflyEffect Component
 * Signature causal cascade visualization (Origin -> First Cascade -> Second Cascade -> Critical Impact)
 */
import { state } from "../state.js";
import { API } from "../api.js";

export class ButterflyEffect {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.cascades = [];
    this.init();

    window.addEventListener("open_butterfly_view", () => {
      this.openTray();
    });
  }

  async init() {
    try {
      this.cascades = await API.fetchButterflyCascades(60);
      this.render();
    } catch (e) {
      console.error("Failed to load butterfly cascade", e);
    }
  }

  openTray() {
    const tray = document.getElementById("lower-tray-el");
    if (tray) {
      tray.classList.add("open");
      const btn = document.getElementById("tab-btn-butterfly");
      if (btn) btn.click();
    }
  }

  render() {
    if (!this.cascades || this.cascades.length === 0) {
      this.container.innerHTML = `<div style="color: #64748b; font-size: 0.8rem;">Tracing flood cascades...</div>`;
      return;
    }

    const primaryChain = this.cascades[0];

    const nodesHtml = primaryChain.nodes
      .map((n, i) => {
        const isLast = i === primaryChain.nodes.length - 1;
        const stageColors = {
          "ORIGIN": "#38bdf8",
          "FIRST CASCADE": "#a855f7",
          "SECOND CASCADE": "#f59e0b",
          "CRITICAL IMPACT": "#ef4444"
        };
        const color = stageColors[n.stage] || "#38bdf8";

        return `
        <div style="display: flex; align-items: center; gap: 14px;">
          <!-- Node Card -->
          <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid ${color}; border-radius: 8px; padding: 10px 14px; min-width: 175px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <div style="font-size: 0.65rem; font-weight: 800; color: ${color}; letter-spacing: 0.8px;">${n.stage}</div>
            <div style="font-size: 1rem; font-weight: 800; color: #fff; font-family: monospace; margin: 2px 0;">${n.region_code}</div>
            <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 600; margin-bottom: 6px;">${n.region_name}</div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.68rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
              <span style="color: #64748b;">Time: <b style="color: #e2e8f0;">T+${n.timestamp_reached}m</b></span>
              <span style="color: #64748b;">Contrib: <b style="color: ${color};">${n.water_contribution_pct}%</b></span>
            </div>
          </div>

          ${
            !isLast
              ? `
            <!-- Transfer Arrow & Delta -->
            <div style="display: flex; flex-direction: column; align-items: center; min-width: 60px;">
              <div style="font-size: 0.65rem; font-family: monospace; color: #c084fc; font-weight: 700;">+${primaryChain.nodes[i+1].propagation_time_from_prev} min</div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
              <div style="font-size: 0.62rem; color: #64748b;">overflow</div>
            </div>
          `
              : ""
          }
        </div>
      `;
      })
      .join("");

    this.container.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.2">
                <path d="M12 22v-7l-5-5"/>
                <path d="M17 10l-5 5"/>
                <circle cx="12" cy="5" r="3"/>
              </svg>
              FLOOD BUTTERFLY EFFECT: CAUSAL PROPAGATION LINEAGE
            </h4>
            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
              Traces how an initial drainage limitation cascades through conduits to trigger downstream critical failure.
            </div>
          </div>
          <div class="hud-pill" style="border-color: rgba(168, 85, 247, 0.4);">
            <span>TOTAL CASCADE TIME:</span>
            <b style="color: #c084fc;">${primaryChain.total_propagation_minutes} MINUTES</b>
          </div>
        </div>

        <div style="display: flex; align-items: center; overflow-x: auto; padding: 6px 2px 12px 2px;">
          ${nodesHtml}
        </div>
      </div>
    `;
  }
}
