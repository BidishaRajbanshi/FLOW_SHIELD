"""
FLOW-SHIELD Main FastAPI Application
Serves deterministic hydro-topographic simulation endpoints,
counterfactual scenario lab, dynamic evacuation pathfinding, AI copilot,
and the modern command-center frontend.
"""

import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Dict, Any, List, Optional

from backend.config import STATIC_DIR, APP_NAME, VERSION
from backend.models.schemas import (
    RegionModel,
    SimulationResult,
    Interventions,
    ScenarioRequest,
    ScenarioComparisonResult,
    ButterflyChain,
    WhyFloodingResponse,
    EvacuationRoute,
    CopilotQuery,
    CopilotResponse,
    CitizenReport
)
from backend.simulation.city_model import get_city_topology
from backend.simulation.engine import FloodSimulationEngine
from backend.simulation.causality import CausalityAnalyzer
from backend.simulation.butterfly import ButterflyEffectAnalyzer
from backend.simulation.counterfactual import CounterfactualLab, SCENARIO_PRESETS
from backend.simulation.evacuation import EvacuationRouter
from backend.simulation.copilot import FlowCopilot
from backend.database.storage import ReportStore

app = FastAPI(title=APP_NAME, version=VERSION)

# Enable CORS for local cross-origin development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core services
city_topology = get_city_topology()
engine = FloodSimulationEngine(city_topology)
counterfactual_lab = CounterfactualLab(engine)
causality_analyzer = CausalityAnalyzer(city_topology)
butterfly_analyzer = ButterflyEffectAnalyzer(city_topology)
evacuation_router = EvacuationRouter(city_topology)
copilot = FlowCopilot(city_topology, counterfactual_lab)
report_store = ReportStore()

# Ensure static directory exists
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "css"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "js"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "js", "components"), exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    """Serves the main interactive digital twin web application."""
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "FLOW-SHIELD backend running. Static index.html not yet deployed."}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": APP_NAME, "version": VERSION}

@app.get("/api/city", response_model=Dict[str, RegionModel])
def get_city():
    """Returns the digital twin city topology with 20 interconnected regions."""
    return city_topology

@app.get("/api/simulation/baseline", response_model=SimulationResult)
def get_baseline_simulation(duration: int = 60):
    """Returns the preserved baseline simulation (unintervened)."""
    return counterfactual_lab.get_baseline_simulation(duration_minutes=duration)

@app.post("/api/simulate", response_model=SimulationResult)
def run_custom_simulation(
    duration: int = 60,
    interventions: Optional[Interventions] = None
):
    """Executes deterministic forward simulation with custom intervention parameters."""
    interventions = interventions or Interventions()
    return engine.run_simulation(
        duration_minutes=duration,
        timestep_minutes=1,
        interventions=interventions
    )

@app.get("/api/scenarios/presets")
def get_scenario_presets():
    """Returns predefined scenario presets (Scenario A, B, C, D)."""
    result = {}
    for k, v in SCENARIO_PRESETS.items():
        result[k] = {
            "id": v["id"],
            "name": v["name"],
            "description": v["description"],
            "interventions": v["interventions"].model_dump()
        }
    return result

@app.post("/api/counterfactual")
def run_counterfactual_scenario(request: ScenarioRequest):
    """
    Executes What-If counterfactual scenario and compares outcome against baseline.
    Returns both the scenario simulation time-series and comparative metrics.
    """
    scenario_sim, comparison = counterfactual_lab.run_scenario(request)
    return {
        "simulation": scenario_sim,
        "comparison": comparison
    }

@app.get("/api/butterfly", response_model=List[ButterflyChain])
def get_butterfly_cascades(duration: int = 60):
    """Returns detected cascading flood propagation paths."""
    baseline = counterfactual_lab.get_baseline_simulation(duration)
    return butterfly_analyzer.get_all_cascades(baseline)

@app.get("/api/why-flooding/{region_id}", response_model=WhyFloodingResponse)
def get_why_flooding(
    region_id: str,
    time: int = Query(default=30, ge=0, le=60),
    scenario_id: Optional[str] = None
):
    """Returns physical causal factor attribution for why a region is flooding."""
    baseline = counterfactual_lab.get_baseline_simulation(60)
    return causality_analyzer.analyze_region(
        region_id=region_id,
        simulation_result=baseline,
        time_minutes=time
    )

@app.get("/api/evacuation/{origin_id}", response_model=List[EvacuationRoute])
def get_evacuation_routes(
    origin_id: str,
    time: int = Query(default=30, ge=0, le=60)
):
    """Calculates time-dependent evacuation paths avoiding inundated zones."""
    baseline = counterfactual_lab.get_baseline_simulation(60)
    return evacuation_router.find_evacuation_routes(
        origin_id=origin_id,
        simulation_result=baseline,
        time_minutes=time
    )

@app.post("/api/copilot", response_model=CopilotResponse)
async def query_copilot(query: CopilotQuery):
    """AI Flood Copilot query grounded in active simulation telemetry."""
    baseline = counterfactual_lab.get_baseline_simulation(60)
    return await copilot.answer_query(query, baseline)

@app.get("/api/reports", response_model=List[CitizenReport])
def list_citizen_reports():
    """Returns all citizen community flood reports."""
    return report_store.get_all_reports()

@app.post("/api/reports", response_model=CitizenReport)
def create_citizen_report(report: CitizenReport):
    """Submits a new citizen flood observation."""
    report_store.add_report(report)
    return report
