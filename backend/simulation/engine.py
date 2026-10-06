"""
FLOW-SHIELD Deterministic Flood Simulation Engine
Implements hydro-topographic flow dynamics with mass conservation,
risk state classification, and critical event tracking over timesteps.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import math

from backend.models.schemas import (
    RegionModel,
    RegionStateAtTime,
    FlowVector,
    CriticalEvent,
    SimulationTimestep,
    SimulationResult,
    Interventions
)
from backend.simulation.city_model import get_city_topology

class FloodSimulationEngine:
    def __init__(self, city_topology: Optional[Dict[str, RegionModel]] = None):
        self.city_topology: Dict[str, RegionModel] = city_topology or get_city_topology()
        self.region_keys = list(self.city_topology.keys())
        self.n_regions = len(self.region_keys)
        self.key_to_idx = {k: i for i, k in enumerate(self.region_keys)}

    def run_simulation(
        self,
        duration_minutes: int = 60,
        timestep_minutes: int = 1,
        interventions: Optional[Interventions] = None
    ) -> SimulationResult:
        """
        Executes a deterministic forward simulation from T=0 to T=duration_minutes.
        Returns a complete SimulationResult containing state slices for each minute.
        """
        interventions = interventions or Interventions()
        
        # Initialize state arrays
        # water_levels in meters
        water_levels = np.zeros(self.n_regions, dtype=np.float64)
        elevations = np.zeros(self.n_regions, dtype=np.float64)
        areas = np.zeros(self.n_regions, dtype=np.float64)
        drainage_caps = np.zeros(self.n_regions, dtype=np.float64)
        absorption_caps = np.zeros(self.n_regions, dtype=np.float64)
        warning_thresh = np.zeros(self.n_regions, dtype=np.float64)
        critical_thresh = np.zeros(self.n_regions, dtype=np.float64)
        baseline_rains = np.zeros(self.n_regions, dtype=np.float64)

        for i, k in enumerate(self.region_keys):
            reg = self.city_topology[k]
            water_levels[i] = reg.initial_water_level
            elevations[i] = reg.elevation
            areas[i] = reg.area
            # Interventions applied to capacities
            drain_boost = 1.0 + (interventions.drainage_boost_pct / 100.0)
            absorp_boost = 1.0 + (interventions.absorption_boost_pct / 100.0)
            
            drainage_caps[i] = reg.drainage_capacity * drain_boost
            absorption_caps[i] = reg.absorption_capacity * absorp_boost
            warning_thresh[i] = reg.warning_threshold
            critical_thresh[i] = reg.critical_threshold
            
            if interventions.rainfall_override_mm is not None:
                baseline_rains[i] = interventions.rainfall_override_mm
            else:
                baseline_rains[i] = reg.baseline_rainfall * interventions.rainfall_multiplier

        # Adjacency & conductivity matrix
        # flow_conduct[i, j] is connectivity coefficient from region i to region j
        flow_conduct = np.zeros((self.n_regions, self.n_regions), dtype=np.float64)
        for i, k in enumerate(self.region_keys):
            reg = self.city_topology[k]
            for neighbor in reg.neighbors:
                if neighbor.target_id in self.key_to_idx:
                    j = self.key_to_idx[neighbor.target_id]
                    # Check if temporary barrier is active for this conduit
                    conduit_key1 = f"{k}-{neighbor.target_id}"
                    conduit_key2 = f"{neighbor.target_id}-{k}"
                    if interventions.barrier_active and (
                        interventions.barrier_location == conduit_key1 or 
                        interventions.barrier_location == conduit_key2 or
                        (k == "R04" and neighbor.target_id == "R06")
                    ):
                        # Barrier cuts conductivity by 85%
                        flow_conduct[i, j] = neighbor.connectivity * 0.15
                    else:
                        flow_conduct[i, j] = neighbor.connectivity

        # Upstream water diversion channel intervention
        # e.g., redirecting 25% flow directly away from Zone C into Canal (R16)
        if interventions.diversion_active and interventions.diversion_pct > 0:
            src_idx = self.key_to_idx.get(interventions.diversion_source_id or "R02")
            tgt_idx = self.key_to_idx.get(interventions.diversion_target_id or "R16")
            downstream_c_idx = self.key_to_idx.get("R04")  # Zone C
            
            div_frac = min(0.60, interventions.diversion_pct / 100.0)
            if src_idx is not None and downstream_c_idx is not None:
                # Reduce flow heading toward Zone C
                flow_conduct[src_idx, downstream_c_idx] *= (1.0 - div_frac)
                
            if src_idx is not None and tgt_idx is not None:
                # Route diverted volume into bypass canal
                flow_conduct[src_idx, tgt_idx] = max(flow_conduct[src_idx, tgt_idx], 0.65 * div_frac)

        # Simulation history tracking
        timesteps: List[SimulationTimestep] = []
        critical_events: List[CriticalEvent] = []
        region_event_states: Dict[str, str] = {k: "SAFE" for k in self.region_keys}
        first_critical_time: Optional[int] = None
        first_critical_region: Optional[str] = None
        
        # Upstream contribution cumulative tracker (for causal attribution)
        # inflow_sources[target_idx, source_idx] = cumulative volume in meters
        cumulative_inflows = np.zeros((self.n_regions, self.n_regions), dtype=np.float64)
        cumulative_rainfall = np.zeros(self.n_regions, dtype=np.float64)

        # Conversion scaling:
        # Catchment concentration factor for urban impervious surface and street drainage channels
        conc = 14.0
        mm_hr_to_m_min = (1.0 / (1000.0 * 60.0)) * conc
        slope_weight = 0.025
        flow_coeff = 0.18

        # Run timesteps
        for t in range(0, duration_minutes + 1, timestep_minutes):
            current_regions: Dict[str, RegionStateAtTime] = {}
            current_flows: List[FlowVector] = []
            events_this_step: List[CriticalEvent] = []

            safe_count = 0
            warning_count = 0
            critical_count = 0
            total_flooded_area = 0.0

            # Step 1: Calculate effective hydraulic head with topographic slope gradient
            # effective_heads = water_levels + normalized elevation delta
            effective_heads = water_levels + (elevations - 850.0) * slope_weight

            # Step 2: Compute pairwise inter-region flows
            # flow(i, j) = connectivity(i, j) * max(0, effective(i) - effective(j))
            raw_flows = np.zeros((self.n_regions, self.n_regions), dtype=np.float64)
            for i in range(self.n_regions):
                for j in range(self.n_regions):
                    c = flow_conduct[i, j]
                    if c > 0:
                        head_diff = effective_heads[i] - effective_heads[j]
                        if head_diff > 0:
                            raw_flows[i, j] = c * head_diff * flow_coeff

            # Step 3: Enforce mass conservation on outflows
            # Region cannot discharge more water than it possesses in surplus
            net_outflows = np.zeros(self.n_regions, dtype=np.float64)
            net_inflows = np.zeros(self.n_regions, dtype=np.float64)

            for i in range(self.n_regions):
                total_desired_out = np.sum(raw_flows[i, :])
                available_water = water_levels[i]
                if total_desired_out > 0:
                    max_allowed_out = max(0.0, available_water * 0.40)
                    scale = 1.0 if total_desired_out <= max_allowed_out else (max_allowed_out / total_desired_out)
                    raw_flows[i, :] *= scale
                net_outflows[i] = np.sum(raw_flows[i, :])

            for j in range(self.n_regions):
                net_inflows[j] = np.sum(raw_flows[:, j])

            # Step 4: Calculate actual drainage, absorption, and pump extractions
            dt = float(timestep_minutes)
            rain_in_step = baseline_rains * mm_hr_to_m_min * dt
            drain_cap_step = drainage_caps * mm_hr_to_m_min * dt
            absorp_cap_step = absorption_caps * mm_hr_to_m_min * dt

            actual_drain = np.minimum(water_levels + rain_in_step + net_inflows, drain_cap_step)
            actual_absorp = np.minimum(
                np.maximum(0.0, water_levels + rain_in_step + net_inflows - actual_drain),
                absorp_cap_step
            )

            # Mobile pump intervention
            pump_removal = np.zeros(self.n_regions, dtype=np.float64)
            if interventions.pump_active and interventions.pump_region_id:
                p_idx = self.key_to_idx.get(interventions.pump_region_id)
                if p_idx is not None:
                    # Pump capacity: e.g. 0.05 m/min
                    pump_rate = 0.05 * dt
                    pump_removal[p_idx] = min(water_levels[p_idx], pump_rate)

            # Step 5: Record flows for visual arrows/particles
            for i in range(self.n_regions):
                for j in range(self.n_regions):
                    f_val = raw_flows[i, j]
                    if f_val > 0.0001:
                        src_reg = self.city_topology[self.region_keys[i]]
                        tgt_reg = self.city_topology[self.region_keys[j]]
                        dx = tgt_reg.x - src_reg.x
                        dy = tgt_reg.y - src_reg.y
                        angle = math.atan2(dy, dx) * 180.0 / math.pi
                        current_flows.append(
                            FlowVector(
                                source_id=self.region_keys[i],
                                target_id=self.region_keys[j],
                                flow_rate=round(float(f_val * 1000.0), 3),  # mm/min display
                                direction_angle=round(angle, 1)
                            )
                        )
                        # Track cumulative for causality
                        cumulative_inflows[j, i] += f_val

            # Step 6: Update region state for current timestep
            for i, k in enumerate(self.region_keys):
                reg = self.city_topology[k]
                w_curr = float(water_levels[i])
                w_warn = float(warning_thresh[i])
                w_crit = float(critical_thresh[i])

                # Risk state classification
                if w_curr < w_warn:
                    risk = "SAFE"
                    safe_count += 1
                elif w_curr < w_crit:
                    risk = "WARNING"
                    warning_count += 1
                else:
                    risk = "CRITICAL"
                    critical_count += 1
                    total_flooded_area += reg.area

                # Flooded area percentage within region
                flood_pct = min(100.0, max(0.0, (w_curr / w_crit) * 100.0))

                # Check for critical state transitions
                prev_risk = region_event_states[k]
                if prev_risk != risk:
                    if risk == "WARNING":
                        ev = CriticalEvent(
                            time_minutes=t,
                            region_id=k,
                            region_name=reg.name,
                            region_code=reg.code,
                            event_type="WARNING_REACHED",
                            message=f"{reg.code} ({reg.name}) reached WARNING threshold ({w_curr:.2f}m)"
                        )
                        critical_events.append(ev)
                        events_this_step.append(ev)
                    elif risk == "CRITICAL":
                        ev = CriticalEvent(
                            time_minutes=t,
                            region_id=k,
                            region_name=reg.name,
                            region_code=reg.code,
                            event_type="CRITICAL_REACHED",
                            message=f"{reg.code} ({reg.name}) entered CRITICAL flooding condition ({w_curr:.2f}m)"
                        )
                        critical_events.append(ev)
                        events_this_step.append(ev)
                        if first_critical_time is None:
                            first_critical_time = t
                            first_critical_region = k
                    region_event_states[k] = risk

                # Estimate time to critical if not yet critical
                time_to_crit = None
                if risk != "CRITICAL":
                    net_rate = (rain_in_step[i] + net_inflows[i] - net_outflows[i] - actual_drain[i] - actual_absorp[i])
                    if net_rate > 0:
                        mins_left = (w_crit - w_curr) / net_rate
                        time_to_crit = round(float(mins_left), 1)

                # Upstream contributor breakdown for this region
                up_contribs: Dict[str, float] = {}
                tot_in = np.sum(cumulative_inflows[i, :])
                if tot_in > 0:
                    for src_i in range(self.n_regions):
                        c_val = cumulative_inflows[i, src_i]
                        if c_val > 0.0001:
                            src_k = self.region_keys[src_i]
                            up_contribs[src_k] = round(float((c_val / tot_in) * 100.0), 1)

                current_regions[k] = RegionStateAtTime(
                    id=k,
                    name=reg.name,
                    code=reg.code,
                    water_level=round(w_curr, 3),
                    effective_level=round(float(effective_heads[i]), 3),
                    risk_state=risk,
                    inflow=round(float(net_inflows[i] * 1000.0), 2),
                    outflow=round(float(net_outflows[i] * 1000.0), 2),
                    rainfall_input=round(float(rain_in_step[i] * 1000.0), 2),
                    drainage_actual=round(float(actual_drain[i] * 1000.0), 2),
                    absorption_actual=round(float(actual_absorp[i] * 1000.0), 2),
                    flooded_area_pct=round(flood_pct, 1),
                    time_to_critical_min=time_to_crit,
                    upstream_contributors=up_contribs
                )

            total_city_area = sum(reg.area for reg in self.city_topology.values())
            overall_flooded_pct = round((total_flooded_area / total_city_area) * 100.0, 1)

            timesteps.append(
                SimulationTimestep(
                    time_minutes=t,
                    regions=current_regions,
                    flows=current_flows,
                    safe_count=safe_count,
                    warning_count=warning_count,
                    critical_count=critical_count,
                    total_flooded_area_pct=overall_flooded_pct,
                    events_at_time=events_this_step
                )
            )

            # Step 7: Update water levels for next timestep (Euler timestep)
            # water_next = max(0, water_curr + rain + inflow - outflow - drain - absorp - pump)
            delta = (rain_in_step + net_inflows - net_outflows - actual_drain - actual_absorp - pump_removal)
            water_levels = np.maximum(0.0, water_levels + delta)
            cumulative_rainfall += rain_in_step

        # Identify next critical event and following event
        crit_events_only = [e for e in critical_events if e.event_type == "CRITICAL_REACHED"]
        next_event = crit_events_only[0] if len(crit_events_only) > 0 else None
        following_event = crit_events_only[1] if len(crit_events_only) > 1 else None

        peak_water = float(np.max([ts.regions[k].water_level for ts in timesteps for k in self.region_keys]))
        final_flooded_area = timesteps[-1].total_flooded_area_pct

        return SimulationResult(
            duration_minutes=duration_minutes,
            timestep_step=timestep_minutes,
            timesteps=timesteps,
            critical_events_timeline=critical_events,
            first_critical_time=first_critical_time,
            first_critical_region=first_critical_region,
            next_critical_event=next_event,
            following_critical_event=following_event,
            overall_peak_water=round(peak_water, 3),
            overall_flooded_area_pct=final_flooded_area
        )
