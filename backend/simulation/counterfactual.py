"""
FLOW-SHIELD Counterfactual Simulation Lab ("WHAT IF?")
Clones baseline state, executes multi-scenario simulations with intervention parameters,
and computes differential metrics (Critical Zones, Flooded Area, Time to Critical).
"""

from typing import Dict, List, Optional, Any, Tuple
from backend.models.schemas import (
    Interventions,
    ScenarioRequest,
    ScenarioComparisonResult,
    SimulationResult
)
from backend.simulation.engine import FloodSimulationEngine
from backend.simulation.city_model import get_city_topology

# Predefined Scenario Presets
SCENARIO_PRESETS: Dict[str, Dict[str, Any]] = {
    "scenario_a": {
        "id": "scenario_a",
        "name": "Scenario A: Upstream Diversion (35%)",
        "description": "Divert 35% of Zone B runoff away from Central Transit into the Southwest Bypass Canal.",
        "interventions": Interventions(
            diversion_active=True,
            diversion_source_id="R02",
            diversion_target_id="R16",
            diversion_pct=35.0
        )
    },
    "scenario_b": {
        "id": "scenario_b",
        "name": "Scenario B: Drainage Capacity Boost (+35%)",
        "description": "Clear silt and deploy auxiliary vacuum extraction across Central Transit and Commerce drains.",
        "interventions": Interventions(
            drainage_boost_pct=35.0
        )
    },
    "scenario_c": {
        "id": "scenario_c",
        "name": "Scenario C: High-Capacity Mobile Pump at Zone D",
        "description": "Deploy heavy-duty emergency mobile diesel pumps in Zone D to protect the commercial core.",
        "interventions": Interventions(
            pump_active=True,
            pump_region_id="R06",
            pump_capacity_m3=1200.0
        )
    },
    "scenario_d": {
        "id": "scenario_d",
        "name": "Scenario D: Combined Strategic Defense (Diversion + Pump + Drainage)",
        "description": "Comprehensive defense package: 20% upstream diversion + Zone D pumps + 25% drainage enhancement.",
        "interventions": Interventions(
            diversion_active=True,
            diversion_source_id="R02",
            diversion_target_id="R16",
            diversion_pct=20.0,
            pump_active=True,
            pump_region_id="R06",
            drainage_boost_pct=25.0,
            absorption_boost_pct=15.0
        )
    }
}

class CounterfactualLab:
    def __init__(self, engine: Optional[FloodSimulationEngine] = None):
        self.engine = engine or FloodSimulationEngine()
        self._baseline_cache: Optional[SimulationResult] = None

    def get_baseline_simulation(self, duration_minutes: int = 60) -> SimulationResult:
        """Returns the preserved baseline simulation (unintervened)."""
        if self._baseline_cache is None:
            self._baseline_cache = self.engine.run_simulation(
                duration_minutes=duration_minutes,
                timestep_minutes=1,
                interventions=Interventions()
            )
        return self._baseline_cache

    def run_scenario(self, request: ScenarioRequest) -> Tuple[SimulationResult, ScenarioComparisonResult]:
        """
        Clones baseline, applies requested interventions, executes deterministic simulation,
        and generates comprehensive comparison against baseline.
        """
        baseline = self.get_baseline_simulation(request.duration_minutes)
        
        # Clone and run scenario simulation
        scenario_sim = self.engine.run_simulation(
            duration_minutes=request.duration_minutes,
            timestep_minutes=1,
            interventions=request.interventions
        )

        comparison = self.compare_simulations(
            scenario_id=request.scenario_id,
            name=request.name,
            baseline=baseline,
            scenario=scenario_sim
        )

        return scenario_sim, comparison

    def compare_simulations(
        self,
        scenario_id: str,
        name: str,
        baseline: SimulationResult,
        scenario: SimulationResult
    ) -> ScenarioComparisonResult:
        """Compares baseline vs scenario simulation results and extracts key deltas."""
        b_last = baseline.timesteps[-1]
        s_last = scenario.timesteps[-1]

        b_crit = b_last.critical_count
        s_crit = s_last.critical_count
        crit_delta = s_crit - b_crit  # negative is reduction (good)

        b_flood_pct = baseline.overall_flooded_area_pct
        s_flood_pct = scenario.overall_flooded_area_pct
        flood_delta = round(s_flood_pct - b_flood_pct, 1)

        b_first_crit = baseline.first_critical_time
        s_first_crit = scenario.first_critical_time

        delay_min = None
        if b_first_crit is not None:
            if s_first_crit is not None:
                delay_min = max(0, s_first_crit - b_first_crit)
            else:
                # No critical events in scenario!
                delay_min = baseline.duration_minutes - b_first_crit

        b_peak = baseline.overall_peak_water
        s_peak = scenario.overall_peak_water
        peak_reduc = round(((b_peak - s_peak) / max(0.001, b_peak)) * 100.0, 1)

        # Identify which regions were prevented from reaching critical
        prevented_regions: List[str] = []
        for r_id in self.engine.region_keys:
            was_crit = b_last.regions[r_id].risk_state == "CRITICAL"
            now_crit = s_last.regions[r_id].risk_state == "CRITICAL"
            if was_crit and not now_crit:
                prevented_regions.append(r_id)

        # Timeline comparison array for charts
        timeline_comp = {
            "timestamps": [ts.time_minutes for ts in baseline.timesteps if ts.time_minutes % 5 == 0],
            "baseline_critical": [ts.critical_count for ts in baseline.timesteps if ts.time_minutes % 5 == 0],
            "scenario_critical": [ts.critical_count for ts in scenario.timesteps if ts.time_minutes % 5 == 0],
            "baseline_water_zone_d": [baseline.timesteps[t].regions["R06"].water_level for t in range(0, baseline.duration_minutes + 1, 5)],
            "scenario_water_zone_d": [scenario.timesteps[t].regions["R06"].water_level for t in range(0, scenario.duration_minutes + 1, 5)],
            "baseline_water_zone_e": [baseline.timesteps[t].regions["R09"].water_level for t in range(0, baseline.duration_minutes + 1, 5)],
            "scenario_water_zone_e": [scenario.timesteps[t].regions["R09"].water_level for t in range(0, scenario.duration_minutes + 1, 5)]
        }

        return ScenarioComparisonResult(
            scenario_id=scenario_id,
            name=name,
            baseline_critical_count=b_crit,
            scenario_critical_count=s_crit,
            critical_count_delta=crit_delta,
            baseline_flooded_area_pct=b_flood_pct,
            scenario_flooded_area_pct=s_flood_pct,
            flooded_area_pct_delta=flood_delta,
            baseline_first_critical_min=b_first_crit,
            scenario_first_critical_min=s_first_crit,
            first_critical_delay_min=delay_min,
            baseline_peak_water_level=b_peak,
            scenario_peak_water_level=s_peak,
            peak_water_reduction_pct=peak_reduc,
            prevented_critical_regions=prevented_regions,
            timeline_comparison=timeline_comp
        )

# Type alias helper
Tuple_Result = Any
