/**
 * FLOW-SHIELD API Client
 * Interfaces with FastAPI deterministic simulation backend
 */

export const API = {
  async fetchCity() {
    const res = await fetch("/api/city");
    if (!res.ok) throw new Error("Failed to load city topology");
    return await res.json();
  },

  async fetchBaselineSimulation(duration = 60) {
    const res = await fetch(`/api/simulation/baseline?duration=${duration}`);
    if (!res.ok) throw new Error("Failed to load baseline simulation");
    return await res.json();
  },

  async runCustomSimulation(duration = 60, interventions = {}) {
    const res = await fetch(`/api/simulate?duration=${duration}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(interventions)
    });
    if (!res.ok) throw new Error("Failed to execute custom simulation");
    return await res.json();
  },

  async fetchScenarioPresets() {
    const res = await fetch("/api/scenarios/presets");
    if (!res.ok) throw new Error("Failed to load scenario presets");
    return await res.json();
  },

  async runCounterfactualScenario(scenarioRequest) {
    const res = await fetch("/api/counterfactual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scenarioRequest)
    });
    if (!res.ok) throw new Error("Counterfactual simulation failed");
    return await res.json();
  },

  async fetchButterflyCascades(duration = 60) {
    const res = await fetch(`/api/butterfly?duration=${duration}`);
    if (!res.ok) throw new Error("Failed to load butterfly cascade data");
    return await res.json();
  },

  async fetchWhyFlooding(regionId, time = 30) {
    const res = await fetch(`/api/why-flooding/${regionId}?time=${time}`);
    if (!res.ok) throw new Error("Failed to load causal attribution breakdown");
    return await res.json();
  },

  async fetchEvacuationRoutes(originId, time = 30) {
    const res = await fetch(`/api/evacuation/${originId}?time=${time}`);
    if (!res.ok) throw new Error("Failed to calculate evacuation routes");
    return await res.json();
  },

  async queryCopilot(question, time = 30, selectedRegionId = null) {
    const res = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        current_time_minutes: time,
        selected_region_id: selectedRegionId
      })
    });
    if (!res.ok) throw new Error("Flow-Copilot query failed");
    return await res.json();
  },

  async fetchCitizenReports() {
    const res = await fetch("/api/reports");
    if (!res.ok) throw new Error("Failed to load citizen reports");
    return await res.json();
  },

  async submitCitizenReport(report) {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report)
    });
    if (!res.ok) throw new Error("Failed to submit citizen report");
    return await res.json();
  }
};
