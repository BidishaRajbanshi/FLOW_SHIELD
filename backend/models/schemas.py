from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class NeighborConnection(BaseModel):
    target_id: str
    connectivity: float = 0.5  # flow conductivity coefficient
    channel_type: str = "open_canal"  # open_canal, underground_culvert, overland, road

class RegionModel(BaseModel):
    id: str
    name: str
    code: str  # e.g., "Zone B", "Zone C"
    x: float  # virtual grid or canvas coordinate (0 - 1000)
    y: float  # virtual grid or canvas coordinate (0 - 700)
    elevation: float  # in meters
    area: float  # in hectares or km^2
    baseline_rainfall: float = 85.0  # mm/hr
    initial_water_level: float = 0.0  # meters
    drainage_capacity: float  # mm/hr equivalent
    absorption_capacity: float  # mm/hr equivalent
    warning_threshold: float  # water level in meters
    critical_threshold: float  # water level in meters
    neighbors: List[NeighborConnection] = []
    description: str = ""
    is_bottleneck: bool = False
    is_safe_haven: bool = False

class RegionStateAtTime(BaseModel):
    id: str
    name: str
    code: str
    water_level: float  # meters
    effective_level: float  # elevation + water_level
    risk_state: str  # SAFE, WARNING, CRITICAL
    inflow: float  # m^3/min or mm/min
    outflow: float  # m^3/min or mm/min
    rainfall_input: float
    drainage_actual: float
    absorption_actual: float
    flooded_area_pct: float
    time_to_critical_min: Optional[float] = None
    upstream_contributors: Dict[str, float] = {}

class FlowVector(BaseModel):
    source_id: str
    target_id: str
    flow_rate: float  # volume or level delta per min
    direction_angle: float = 0.0

class CriticalEvent(BaseModel):
    time_minutes: int
    region_id: str
    region_name: str
    region_code: str
    event_type: str  # WARNING_REACHED, CRITICAL_REACHED, ROAD_IMPASSABLE, DRAINAGE_OVERWHELMED
    message: str

class SimulationTimestep(BaseModel):
    time_minutes: int
    regions: Dict[str, RegionStateAtTime]
    flows: List[FlowVector]
    safe_count: int
    warning_count: int
    critical_count: int
    total_flooded_area_pct: float
    events_at_time: List[CriticalEvent] = []

class SimulationResult(BaseModel):
    duration_minutes: int
    timestep_step: int
    timesteps: List[SimulationTimestep]
    critical_events_timeline: List[CriticalEvent]
    first_critical_time: Optional[int] = None
    first_critical_region: Optional[str] = None
    next_critical_event: Optional[CriticalEvent] = None
    following_critical_event: Optional[CriticalEvent] = None
    overall_peak_water: float
    overall_flooded_area_pct: float

class Interventions(BaseModel):
    rainfall_multiplier: float = 1.0  # 1.0 = 100% of baseline (85mm/hr)
    rainfall_override_mm: Optional[float] = None
    drainage_boost_pct: float = 0.0  # e.g., +20% -> 20.0
    diversion_active: bool = False
    diversion_source_id: Optional[str] = "R02"  # Zone B
    diversion_target_id: Optional[str] = "R16"  # Southwest Bypass Canal
    diversion_pct: float = 0.0  # 0 to 50%
    pump_active: bool = False
    pump_region_id: Optional[str] = "R06"  # Zone D or E
    pump_capacity_m3: float = 0.0
    barrier_active: bool = False
    barrier_location: Optional[str] = "R04-R06"  # Conduit between Zone C and Zone D
    absorption_boost_pct: float = 0.0  # Green infrastructure expansion

class ScenarioRequest(BaseModel):
    scenario_id: str = "scenario_a"
    name: str = "Scenario A: Upstream Diversion & Drainage"
    description: str = ""
    duration_minutes: int = 60
    interventions: Interventions

class ScenarioComparisonResult(BaseModel):
    scenario_id: str
    name: str
    baseline_critical_count: int
    scenario_critical_count: int
    critical_count_delta: int
    baseline_flooded_area_pct: float
    scenario_flooded_area_pct: float
    flooded_area_pct_delta: float
    baseline_first_critical_min: Optional[int]
    scenario_first_critical_min: Optional[int]
    first_critical_delay_min: Optional[int]
    baseline_peak_water_level: float
    scenario_peak_water_level: float
    peak_water_reduction_pct: float
    prevented_critical_regions: List[str]
    timeline_comparison: Dict[str, Any]

class ButterflyNode(BaseModel):
    order: int
    stage: str  # ORIGIN, FIRST CASCADE, SECOND CASCADE, CRITICAL IMPACT
    region_id: str
    region_name: str
    region_code: str
    timestamp_reached: int
    water_level: float
    water_contribution_pct: float
    propagation_time_from_prev: int  # minutes
    flow_from_prev: float
    description: str

class ButterflyChain(BaseModel):
    chain_id: str
    title: str
    origin_zone: str
    critical_zone: str
    total_propagation_minutes: int
    nodes: List[ButterflyNode]
    summary: str

class WhyFloodingResponse(BaseModel):
    region_id: str
    region_name: str
    region_code: str
    risk_state: str
    current_water_level: float
    critical_threshold: float
    time_to_critical_min: Optional[float]
    time_evaluated_min: int
    primary_contributor: str
    detailed_explanation: str
    factors: Dict[str, float]  # Upstream Inflow, Rainfall, Drainage Limitation, Low Elevation
    upstream_breakdown: List[Dict[str, Any]]

class EvacuationRouteNode(BaseModel):
    region_id: str
    region_name: str
    water_level: float
    risk_state: str
    minutes_until_flooded: Optional[int]
    is_safe: bool

class EvacuationRoute(BaseModel):
    route_id: str
    name: str
    origin_id: str
    origin_name: str
    destination_id: str
    destination_name: str
    path: List[EvacuationRouteNode]
    is_currently_safe: bool
    status_label: str  # SAFE NOW, BECOMES FLOODED IN 12 MINUTES, SAFE FOR 45 MINUTES
    safe_window_minutes: int
    recommendation_rank: int
    total_distance_score: float

class CopilotQuery(BaseModel):
    question: str
    current_time_minutes: int = 30
    selected_region_id: Optional[str] = None
    active_scenario_id: Optional[str] = None

class CopilotResponse(BaseModel):
    answer: str
    sources_used: List[str]
    suggested_followups: List[str]
    telemetry_summary: Dict[str, Any]

class CitizenReport(BaseModel):
    id: str
    region_id: str
    location_name: str
    water_depth_cm: float
    timestamp_min: int
    photo_type: str = "water_clogging"  # road_submerged, canal_overflow, resident_alert
    reported_by: str = "Community Warden"
    verified: bool = False
