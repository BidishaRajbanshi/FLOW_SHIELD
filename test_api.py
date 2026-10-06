"""
Automated validation of all FLOW-SHIELD API endpoints
"""
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api():
    print("Testing GET /api/city...")
    r = client.get("/api/city")
    assert r.status_code == 200
    city = r.json()
    assert len(city) == 20
    print(f"  OK: 20 regions returned ({city['R02']['name']} -> {city['R09']['name']})")

    print("\nTesting GET /api/simulation/baseline...")
    r = client.get("/api/simulation/baseline")
    assert r.status_code == 200
    sim = r.json()
    assert len(sim["timesteps"]) == 61
    print(f"  OK: 61 timesteps, first critical at {sim['first_critical_time']}m")

    print("\nTesting GET /api/butterfly...")
    r = client.get("/api/butterfly")
    assert r.status_code == 200
    chains = r.json()
    assert len(chains) >= 1
    print(f"  OK: {len(chains)} cascade chains detected. Primary: {chains[0]['title']}")

    print("\nTesting GET /api/why-flooding/R09 (Zone E)...")
    r = client.get("/api/why-flooding/R09?time=30")
    assert r.status_code == 200
    why = r.json()
    print(f"  OK: Upstream Inflow {why['factors']['Upstream Inflow']}%, Primary: {why['primary_contributor']}")

    print("\nTesting POST /api/counterfactual with Scenario D...")
    payload = {
        "scenario_id": "scenario_d",
        "name": "Scenario D: Combined Strategic Defense",
        "duration_minutes": 60,
        "interventions": {
            "diversion_active": True,
            "diversion_source_id": "R02",
            "diversion_target_id": "R16",
            "diversion_pct": 20.0,
            "pump_active": True,
            "pump_region_id": "R06",
            "drainage_boost_pct": 25.0
        }
    }
    r = client.post("/api/counterfactual", json=payload)
    assert r.status_code == 200
    res = r.json()
    comp = res["comparison"]
    print(f"  OK: Baseline critical {comp['baseline_critical_count']} -> Scenario {comp['scenario_critical_count']}")
    print(f"  OK: Flooded area {comp['baseline_flooded_area_pct']}% -> {comp['scenario_flooded_area_pct']}%")

    print("\nTesting GET /api/evacuation/R09 (from flooded Zone E)...")
    r = client.get("/api/evacuation/R09?time=25")
    assert r.status_code == 200
    routes = r.json()
    assert len(routes) > 0
    print(f"  OK: {len(routes)} routes found. Top route: {routes[0]['status_label']}")

    print("\nTesting POST /api/copilot...")
    r = client.post("/api/copilot", json={"question": "Why is Zone E flooding?", "current_time_minutes": 30})
    assert r.status_code == 200
    cop = r.json()
    print(f"  OK: Copilot answered with {len(cop['answer'])} chars and {len(cop['sources_used'])} sources.")

    print("\nALL BACKEND API TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_api()
