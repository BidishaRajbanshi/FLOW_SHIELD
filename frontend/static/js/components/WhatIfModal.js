/**
 * WhatIfModal Component
 * Counterfactual Simulation Lab ("WHAT IF?")
 * Controls for interventions: rainfall, drainage, diversion, pumps, barriers, absorption
 */
import { state } from "../state.js";
import { API } from "../api.js";

export class WhatIfModal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.presets = {};
    this.isSimulating = false;
    this.init();

    window.addEventListener("open_whatif_modal", () => {
      this.open();
    });
  }

  async init() {
    this.modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            COUNTERFACTUAL SIMULATION LAB ("WHAT IF?")
          </div>
          <button class="modal-close-btn" id="btn-close-whatif">&times;</button>
        </div>

        <div class="modal-body">
          <div style="font-size: 0.8rem; color: #94a3b8; line-height: 1.45;">
            Modify hydrologic interventions, clone the virtual city state, and run an independent forward simulation
            to determine whether interventions delay or prevent critical flooding cascades.
          </div>

          <!-- Quick Presets -->
          <div>
            <div style="font-size: 0.74rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 8px;">
              TACTICAL SCENARIO PRESETS
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;" id="presets-grid">
              <!-- Preset Cards Injected Here -->
            </div>
          </div>

          <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 12px;">
              CUSTOM INTERVENTION PARAMETERS
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
              <!-- Control 1: Rainfall -->
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 6px;">
                  <span style="color: #cbd5e1;">Rainfall Intensity</span>
                  <b id="val-rain" style="color: #38bdf8; font-family: monospace;">85 mm/hr (100%)</b>
                </div>
                <input type="range" id="input-rain" min="40" max="150" value="85" step="5" style="width: 100%; accent-color: #38bdf8;" />
              </div>

              <!-- Control 2: Drainage Boost -->
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 6px;">
                  <span style="color: #cbd5e1;">Drainage Capacity Boost</span>
                  <b id="val-drain" style="color: #10b981; font-family: monospace;">+0%</b>
                </div>
                <input type="range" id="input-drain" min="0" max="60" value="0" step="5" style="width: 100%; accent-color: #10b981;" />
              </div>

              <!-- Control 3: Upstream Diversion -->
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 6px;">
                  <span style="color: #cbd5e1;">Zone B Bypass Diversion</span>
                  <b id="val-divert" style="color: #c084fc; font-family: monospace;">0% (Inactive)</b>
                </div>
                <input type="range" id="input-divert" min="0" max="50" value="0" step="5" style="width: 100%; accent-color: #c084fc;" />
              </div>

              <!-- Control 4: Absorption / Green Infra -->
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 6px;">
                  <span style="color: #cbd5e1;">Sponge Infrastructure</span>
                  <b id="val-absorp" style="color: #f59e0b; font-family: monospace;">+0%</b>
                </div>
                <input type="range" id="input-absorp" min="0" max="40" value="0" step="5" style="width: 100%; accent-color: #f59e0b;" />
              </div>
            </div>

            <!-- Toggles for Mobile Pumps and Flood Barriers -->
            <div style="display: flex; gap: 20px; margin-top: 16px; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 12px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; cursor: pointer; color: #cbd5e1;">
                <input type="checkbox" id="check-pump" style="width: 16px; height: 16px; accent-color: #a855f7;" />
                Activate Mobile Pumps in Zone D (1200 m³/hr)
              </label>

              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; cursor: pointer; color: #cbd5e1;">
                <input type="checkbox" id="check-barrier" style="width: 16px; height: 16px; accent-color: #ef4444;" />
                Deploy Sluice Barrier Gate between Zone C and Zone D
              </label>
            </div>
          </div>

          <!-- Execute Counterfactual Button -->
          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;">
            <button class="header-btn" id="btn-cancel-whatif">Cancel</button>
            <button class="header-btn btn-what-if" id="btn-run-counterfactual" style="padding: 10px 22px; font-size: 0.9rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              SIMULATE COUNTERFACTUAL
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-whatif").addEventListener("click", () => this.close());
    document.getElementById("btn-cancel-whatif").addEventListener("click", () => this.close());

    // Slider readouts
    const rIn = document.getElementById("input-rain");
    rIn.addEventListener("input", (e) => {
      document.getElementById("val-rain").textContent = `${e.target.value} mm/hr (${Math.round((e.target.value/85)*100)}%)`;
    });

    const dIn = document.getElementById("input-drain");
    dIn.addEventListener("input", (e) => {
      document.getElementById("val-drain").textContent = `+${e.target.value}%`;
    });

    const divIn = document.getElementById("input-divert");
    divIn.addEventListener("input", (e) => {
      document.getElementById("val-divert").textContent = e.target.value > 0 ? `${e.target.value}% (Diverted)` : `0% (Inactive)`;
    });

    const abIn = document.getElementById("input-absorp");
    abIn.addEventListener("input", (e) => {
      document.getElementById("val-absorp").textContent = `+${e.target.value}%`;
    });

    document.getElementById("btn-run-counterfactual").addEventListener("click", () => this.executeSimulation());

    // Load presets
    try {
      this.presets = await API.fetchScenarioPresets();
      this.renderPresets();
    } catch (e) {
      console.error("Presets failed", e);
    }
  }

  renderPresets() {
    const grid = document.getElementById("presets-grid");
    if (!grid) return;

    grid.innerHTML = Object.entries(this.presets)
      .map(([k, p]) => `
        <div class="preset-card" data-preset="${k}" style="background: rgba(30, 41, 59, 0.45); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px; cursor: pointer; transition: all 0.2s;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #fff; margin-bottom: 3px;">${p.name}</div>
          <div style="font-size: 0.7rem; color: #94a3b8; line-height: 1.35;">${p.description}</div>
        </div>
      `)
      .join("");

    grid.querySelectorAll(".preset-card").forEach((el) => {
      el.addEventListener("click", () => {
        grid.querySelectorAll(".preset-card").forEach((c) => (c.style.borderColor = "rgba(255,255,255,0.08)"));
        el.style.borderColor = "#c084fc";
        const k = el.getAttribute("data-preset");
        this.applyPreset(k);
      });
    });
  }

  applyPreset(presetKey) {
    const p = this.presets[presetKey];
    if (!p) return;
    const inv = p.interventions;

    if (inv.drainage_boost_pct !== undefined) {
      document.getElementById("input-drain").value = inv.drainage_boost_pct;
      document.getElementById("val-drain").textContent = `+${inv.drainage_boost_pct}%`;
    }
    if (inv.diversion_pct !== undefined) {
      document.getElementById("input-divert").value = inv.diversion_pct;
      document.getElementById("val-divert").textContent = inv.diversion_pct > 0 ? `${inv.diversion_pct}% (Diverted)` : "0% (Inactive)";
    }
    if (inv.absorption_boost_pct !== undefined) {
      document.getElementById("input-absorp").value = inv.absorption_boost_pct;
      document.getElementById("val-absorp").textContent = `+${inv.absorption_boost_pct}%`;
    }
    document.getElementById("check-pump").checked = !!inv.pump_active;
    document.getElementById("check-barrier").checked = !!inv.barrier_active;
  }

  async executeSimulation() {
    if (this.isSimulating) return;
    this.isSimulating = true;
    const btn = document.getElementById("btn-run-counterfactual");
    btn.textContent = "SIMULATING CONCURRENT SCENARIO...";
    btn.disabled = true;

    const rainVal = parseFloat(document.getElementById("input-rain").value);
    const drainVal = parseFloat(document.getElementById("input-drain").value);
    const divertVal = parseFloat(document.getElementById("input-divert").value);
    const absorpVal = parseFloat(document.getElementById("input-absorp").value);
    const pumpActive = document.getElementById("check-pump").checked;
    const barrierActive = document.getElementById("check-barrier").checked;

    const scenarioPayload = {
      scenario_id: "custom_scenario_" + Date.now(),
      name: "User Intervention Scenario",
      description: "Custom intervention package evaluated against baseline",
      duration_minutes: 60,
      interventions: {
        rainfall_override_mm: rainVal !== 85.0 ? rainVal : null,
        rainfall_multiplier: rainVal / 85.0,
        drainage_boost_pct: drainVal,
        diversion_active: divertVal > 0,
        diversion_source_id: "R02",
        diversion_target_id: "R16",
        diversion_pct: divertVal,
        pump_active: pumpActive,
        pump_region_id: "R06",
        barrier_active: barrierActive,
        absorption_boost_pct: absorpVal
      }
    };

    try {
      const result = await API.runCounterfactualScenario(scenarioPayload);
      state.activeSimulation = result.simulation;
      state.activeScenarioComparison = result.comparison;
      state.activeScenarioId = scenarioPayload.scenario_id;

      this.close();
      window.dispatchEvent(new CustomEvent("open_scenario_comparison", { detail: result }));
      state.notify("scenario_updated", result);
    } catch (e) {
      alert("Failed to run scenario: " + e.message);
    } finally {
      this.isSimulating = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> SIMULATE COUNTERFACTUAL`;
      btn.disabled = false;
    }
  }

  open() {
    this.modal.classList.add("active");
  }

  close() {
    this.modal.classList.remove("active");
  }
}
