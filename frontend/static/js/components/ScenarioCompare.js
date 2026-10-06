/**
 * ScenarioCompare Component
 * Side-by-side Baseline vs Scenario comparison modal and comparison telemetry cards
 */
import { state } from "../state.js";

export class ScenarioCompare {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.comparisonData = null;
    this.init();

    window.addEventListener("open_scenario_comparison", (e) => {
      this.comparisonData = e.detail.comparison;
      this.render();
      this.open();
    });
  }

  init() {
    this.modal.innerHTML = `
      <div class="modal-card" style="max-width: 860px;">
        <div class="modal-header">
          <div class="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
            </svg>
            SIMULATION COMPLETE: BASELINE vs INTERVENTION
          </div>
          <button class="modal-close-btn" id="btn-close-comparison">&times;</button>
        </div>

        <div class="modal-body" id="comparison-body-el">
          <!-- Content Injected on Render -->
        </div>
      </div>
    `;

    document.getElementById("btn-close-comparison").addEventListener("click", () => this.close());
  }

  render() {
    if (!this.comparisonData) return;
    const c = this.comparisonData;

    const preventedBadges = c.prevented_critical_regions && c.prevented_critical_regions.length > 0
      ? c.prevented_critical_regions.map((rId) => {
          const reg = state.cityTopology[rId];
          return `
            <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; font-family: monospace;">
              ✓ ${reg ? `${reg.code} (${reg.name})` : rId}
            </span>
          `;
        }).join(" ")
      : `<span style="color: #94a3b8; font-size: 0.78rem;">No critical zones prevented; timing or water peak reduced.</span>`;

    const bodyEl = document.getElementById("comparison-body-el");
    bodyEl.innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 12px 16px; border-radius: 8px; color: #34d399; font-size: 0.82rem; display: flex; align-items: center; gap: 10px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <div>
          <b>COUNTERFACTUAL RUN COMPLETED:</b> Evaluated 60 simulated timesteps under requested interventions.
        </div>
      </div>

      <!-- Delta Cards Row (Section 20 requirement: Critical 6 -> 2, Flooded 41% -> 15%, Time 14 -> 37 min) -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;">
        <div class="metric-pill" style="padding: 14px; background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle);">
          <div class="label" style="font-size: 0.75rem;">CRITICAL ZONES</div>
          <div style="font-size: 1.6rem; font-weight: 800; font-family: monospace; color: #fff; margin: 4px 0;">
            <span style="color: #ef4444;">${c.baseline_critical_count}</span>
            <span style="color: #64748b; font-size: 1.2rem;"> → </span>
            <span style="color: #10b981;">${c.scenario_critical_count}</span>
          </div>
          <div style="font-size: 0.72rem; color: #34d399; font-weight: 600;">
            ${c.critical_count_delta < 0 ? `${Math.abs(c.critical_count_delta)} fewer critical zones` : 'Same count'}
          </div>
        </div>

        <div class="metric-pill" style="padding: 14px; background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle);">
          <div class="label" style="font-size: 0.75rem;">FLOODED CITY AREA</div>
          <div style="font-size: 1.6rem; font-weight: 800; font-family: monospace; color: #fff; margin: 4px 0;">
            <span style="color: #ef4444;">${c.baseline_flooded_area_pct}%</span>
            <span style="color: #64748b; font-size: 1.2rem;"> → </span>
            <span style="color: #38bdf8;">${c.scenario_flooded_area_pct}%</span>
          </div>
          <div style="font-size: 0.72rem; color: #38bdf8; font-weight: 600;">
            ${c.flooded_area_pct_delta < 0 ? `${Math.abs(c.flooded_area_pct_delta)}% area saved` : 'Unchanged'}
          </div>
        </div>

        <div class="metric-pill" style="padding: 14px; background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle);">
          <div class="label" style="font-size: 0.75rem;">TIME TO FIRST CRITICAL</div>
          <div style="font-size: 1.6rem; font-weight: 800; font-family: monospace; color: #fff; margin: 4px 0;">
            <span style="color: #ef4444;">${c.baseline_first_critical_min ?? '--'}m</span>
            <span style="color: #64748b; font-size: 1.2rem;"> → </span>
            <span style="color: #c084fc;">${c.scenario_first_critical_min ? `${c.scenario_first_critical_min}m` : 'None!'}</span>
          </div>
          <div style="font-size: 0.72rem; color: #c084fc; font-weight: 600;">
            ${c.first_critical_delay_min ? `Delayed by +${c.first_critical_delay_min} minutes` : 'No delay'}
          </div>
        </div>
      </div>

      <!-- Prevented Critical Regions -->
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.06); padding: 12px 16px; border-radius: 8px;">
        <div style="font-size: 0.75rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">
          PREVENTED CRITICAL ZONES
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${preventedBadges}
        </div>
      </div>

      <!-- Action Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
        <button class="header-btn" id="btn-revert-baseline" style="color: #94a3b8;">
          Revert to Baseline Simulation
        </button>
        <button class="header-btn btn-what-if" id="btn-keep-scenario" style="padding: 8px 18px;">
          Inspect Scenario on City Map
        </button>
      </div>
    `;

    document.getElementById("btn-revert-baseline").addEventListener("click", () => {
      state.activeSimulation = state.baselineSimulation;
      state.activeScenarioComparison = null;
      state.activeScenarioId = "baseline";
      state.notify("scenario_reverted");
      this.close();
    });

    document.getElementById("btn-keep-scenario").addEventListener("click", () => {
      this.close();
    });
  }

  open() {
    this.modal.classList.add("active");
  }

  close() {
    this.modal.classList.remove("active");
  }
}
