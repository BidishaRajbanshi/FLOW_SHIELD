/**
 * FLOW-SHIELD Main Application Orchestrator
 */
import { state } from "./state.js";
import { API } from "./api.js";

import { Header } from "./components/Header.js";
import { CityMap } from "./components/CityMap.js";
import { TimeMachine } from "./components/TimeMachine.js";
import { RiskOverview } from "./components/RiskOverview.js";
import { RegionDetails } from "./components/RegionDetails.js";
import { WhyFlooding } from "./components/WhyFlooding.js";
import { ButterflyEffect } from "./components/ButterflyEffect.js";
import { WhatIfModal } from "./components/WhatIfModal.js";
import { ScenarioCompare } from "./components/ScenarioCompare.js";
import { EmergencyPanel } from "./components/EmergencyPanel.js";
import { FloodReplay } from "./components/FloodReplay.js";
import { FlowCopilot } from "./components/FlowCopilot.js";
import { CitizenReportModal } from "./components/CitizenReport.js";

class App {
  constructor() {
    this.cityMap = null;
    this.emergencyPanel = null;
  }

  async start() {
    console.log("🌊 Initializing FLOW-SHIELD Counterfactual Flood Digital Twin...");

    try {
      // 1. Fetch foundational data
      const [city, baseline, reports, cascades] = await Promise.all([
        API.fetchCity(),
        API.fetchBaselineSimulation(60),
        API.fetchCitizenReports(),
        API.fetchButterflyCascades(60)
      ]);

      state.cityTopology = city;
      state.baselineSimulation = baseline;
      state.activeSimulation = baseline;
      state.citizenReports = reports;
      state.butterflyChains = cascades;

      // 2. Instantiate visual components
      new Header("header-container");
      this.cityMap = new CityMap("map-container");
      new TimeMachine("time-machine-container");
      new RiskOverview("risk-overview-container");
      new RegionDetails("region-details-container");
      this.emergencyPanel = new EmergencyPanel("emergency-panel-container", this.cityMap);

      // Lower Analysis Tray Components
      new WhyFlooding("why-flooding-container");
      new ButterflyEffect("butterfly-container");

      // Modals and Drawers
      new WhatIfModal("whatif-modal-el");
      new ScenarioCompare("comparison-modal-el");
      new FloodReplay("replay-modal-el");
      new FlowCopilot("copilot-drawer-el");
      new CitizenReportModal("report-modal-el");

      // 3. Setup Lower Tray Tabs
      this.setupLowerTray();

      // 4. Keyboard shortcuts
      window.addEventListener("keydown", (e) => {
        if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault();
          state.togglePlay();
        } else if (e.key === "Escape") {
          document.querySelectorAll(".modal-overlay.active").forEach((m) => m.classList.remove("active"));
          document.getElementById("copilot-drawer-el")?.classList.remove("open");
        }
      });

      // Initial state render
      state.setCurrentTime(0);
      state.setSelectedRegion("R09"); // Zone E

      console.log("✓ FLOW-SHIELD Command Center Loaded Successfully.");
    } catch (e) {
      console.error("Critical error starting FLOW-SHIELD", e);
      alert("Failed to initialize FLOW-SHIELD: " + e.message);
    }
  }

  setupLowerTray() {
    const tray = document.getElementById("lower-tray-el");
    const tabWhy = document.getElementById("tab-btn-why");
    const tabButterfly = document.getElementById("tab-btn-butterfly");
    const whyCont = document.getElementById("why-flooding-container");
    const bfCont = document.getElementById("butterfly-container");
    const closeBtn = document.getElementById("btn-close-tray");

    window.addEventListener("toggle_causal_tray", () => {
      tray.classList.toggle("open");
    });

    closeBtn?.addEventListener("click", () => {
      tray.classList.remove("open");
    });

    tabWhy?.addEventListener("click", () => {
      tabWhy.classList.add("active");
      tabButterfly.classList.remove("active");
      whyCont.style.display = "block";
      bfCont.style.display = "none";
    });

    tabButterfly?.addEventListener("click", () => {
      tabButterfly.classList.add("active");
      tabWhy.classList.remove("active");
      whyCont.style.display = "none";
      bfCont.style.display = "block";
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.start();
});
