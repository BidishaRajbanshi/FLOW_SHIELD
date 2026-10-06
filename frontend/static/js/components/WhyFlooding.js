/**
 * WhyFlooding Component
 * Causal attribution breakdown with horizontal bar charts and upstream contributor cards
 */
import { state } from "../state.js";
import { API } from "../api.js";

export class WhyFlooding {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentData = null;
    this.isLoading = false;
    this.init();

    state.subscribe((changeType, payload) => {
      if (changeType === "time_change" || changeType === "region_selected") {
        this.fetchAndRender();
      }
    });

    window.addEventListener("open_causality_view", (e) => {
      if (e.detail && e.detail.regionId) {
        state.setSelectedRegion(e.detail.regionId);
      }
      this.openTray();
    });
  }

  init() {
    this.fetchAndRender();
  }

  openTray() {
    const tray = document.getElementById("lower-tray-el");
    if (tray) {
      tray.classList.add("open");
      const btn = document.getElementById("tab-btn-why");
      if (btn) btn.click();
    }
  }

  async fetchAndRender() {
    const regId = state.selectedRegionId;
    const t = state.currentTime;
    if (!regId) return;

    this.isLoading = true;
    try {
      this.currentData = await API.fetchWhyFlooding(regId, t);
      this.render();
    } catch (e) {
      console.error("Failed to load why flooding data", e);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (!this.currentData) {
      this.container.innerHTML = `<div style="color: #64748b; font-size: 0.8rem;">Loading causal breakdown...</div>`;
      return;
    }

    const d = this.currentData;
    const factors = d.factors || {
      "Upstream Inflow": 57.0,
      "Rainfall": 28.0,
      "Drainage Limitation": 10.0,
      "Low Elevation": 5.0
    };

    const factorColors = {
      "Upstream Inflow": "#38bdf8",
      "Rainfall": "#a855f7",
      "Drainage Limitation": "#f59e0b",
      "Low Elevation": "#10b981"
    };

    let factorBarsHtml = "";
    for (const [name, pct] of Object.entries(factors)) {
      const color = factorColors[name] || "#38bdf8";
      factorBarsHtml += `
        <div style="margin-bottom: 9px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 3px;">
            <span style="color: #cbd5e1; font-weight: 600;">${name}</span>
            <b style="color: ${color}; font-family: monospace;">${pct}%</b>
          </div>
          <div style="background: #1e293b; height: 7px; border-radius: 4px; overflow: hidden;">
            <div style="background: ${color}; width: ${pct}%; height: 100%; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;
    }

    let upstreamCards = "";
    if (d.upstream_breakdown && d.upstream_breakdown.length > 0) {
      upstreamCards = d.upstream_breakdown
        .map(
          (u) => `
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.06); padding: 6px 10px; border-radius: 6px; font-size: 0.72rem;">
          <div style="color: #38bdf8; font-weight: 700; font-family: monospace;">${u.region_code} (${u.region_name})</div>
          <div style="color: #94a3b8;">${u.contribution_pct}% of total inflow volume</div>
        </div>
      `
        )
        .join("");
    } else {
      upstreamCards = `<div style="color: #64748b; font-size: 0.72rem;">No significant upstream inflows detected. Local rainfall dominates.</div>`;
    }

    this.container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1.3fr 1fr; gap: 20px;">
        <!-- Column 1: Summary Banner -->
        <div>
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <h3 style="color: #fff; font-size: 1.1rem; font-weight: 800; font-family: monospace;">${d.region_code}</h3>
            <span style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">${d.region_name}</span>
          </div>
          <div style="margin-top: 6px; display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 800; font-family: monospace; background: ${
            d.risk_state === "CRITICAL"
              ? "rgba(239, 68, 68, 0.25)"
              : d.risk_state === "WARNING"
              ? "rgba(245, 158, 11, 0.2)"
              : "rgba(16, 185, 129, 0.2)"
          }; color: ${
            d.risk_state === "CRITICAL" ? "#ef4444" : d.risk_state === "WARNING" ? "#f59e0b" : "#10b981"
          };">
            STATUS: ${d.risk_state}
          </div>

          <div style="margin-top: 10px; font-size: 0.78rem; color: #cbd5e1; line-height: 1.45;">
            <b style="color: #38bdf8;">Primary Contributor:</b><br/>
            ${d.primary_contributor}
          </div>
        </div>

        <!-- Column 2: Factor Decomposition Horizontal Bars -->
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">
            PHYSICAL FACTOR DECOMPOSITION (WHY?)
          </div>
          ${factorBarsHtml}
        </div>

        <!-- Column 3: Upstream Contributors Breakdown -->
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">
            UPSTREAM CONDUIT CONTRIBUTIONS
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${upstreamCards}
          </div>
        </div>
      </div>
    `;
  }
}
