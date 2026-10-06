"""
FLOW-SHIELD Digital City Topology: Representative 20-Region Urban Basin
Simulated/representative digital twin of an urban catchment system with realistic topography,
inter-zone hydrologic conduits, bottlenecks, and safe havens.
"""

from typing import Dict, List
from backend.models.schemas import RegionModel, NeighborConnection

# 20 Interconnected Regions
REGIONS_DATA: List[Dict] = [
    {
        "id": "R01",
        "code": "Zone A",
        "name": "North Highland Ridge",
        "x": 220,
        "y": 90,
        "elevation": 925.0,
        "area": 4.5,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.02,
        "drainage_capacity": 55.0,
        "absorption_capacity": 30.0,
        "warning_threshold": 0.60,
        "critical_threshold": 1.20,
        "description": "High rocky ridge with steep runoff gradients into northern industrial sectors.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R02", "connectivity": 0.75, "channel_type": "open_canal"},
            {"target_id": "R03", "connectivity": 0.45, "channel_type": "overland"},
            {"target_id": "R05", "connectivity": 0.50, "channel_type": "culvert"}
        ]
    },
    {
        "id": "R02",
        "code": "Zone B",
        "name": "Upper Industrial Park",
        "x": 380,
        "y": 140,
        "elevation": 905.0,
        "area": 5.2,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.04,
        "drainage_capacity": 36.0,  # restricted storm drain
        "absorption_capacity": 10.0,  # paved concrete surfaces
        "warning_threshold": 0.32,
        "critical_threshold": 0.68,
        "description": "UPSTREAM ORIGIN ZONE. Heavy impervious concrete surface, aging storm drains. Overflows into Zone C.",
        "is_bottleneck": True,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R04", "connectivity": 0.85, "channel_type": "open_canal"},
            {"target_id": "R05", "connectivity": 0.35, "channel_type": "road"},
            {"target_id": "R08", "connectivity": 0.40, "channel_type": "culvert"}
        ]
    },
    {
        "id": "R03",
        "code": "Zone F",
        "name": "Northwest Forest Catchment",
        "x": 100,
        "y": 190,
        "elevation": 915.0,
        "area": 7.0,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.01,
        "drainage_capacity": 65.0,
        "absorption_capacity": 65.0,  # high natural soil infiltration
        "warning_threshold": 0.85,
        "critical_threshold": 1.50,
        "description": "Dense forest buffer zone with high natural absorption and retention tanks.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R01", "connectivity": 0.30, "channel_type": "overland"},
            {"target_id": "R07", "connectivity": 0.60, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R04",
        "code": "Zone C",
        "name": "Central Transit Corridor",
        "x": 470,
        "y": 240,
        "elevation": 885.0,
        "area": 4.8,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.04,
        "drainage_capacity": 38.0,
        "absorption_capacity": 12.0,
        "warning_threshold": 0.28,
        "critical_threshold": 0.62,
        "description": "FIRST CASCADE ZONE. Major arterial transit artery. Receives massive runoff from Zone B.",
        "is_bottleneck": True,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R06", "connectivity": 0.90, "channel_type": "culvert"},  # Chokes into Zone D
            {"target_id": "R08", "connectivity": 0.45, "channel_type": "open_canal"},
            {"target_id": "R10", "connectivity": 0.35, "channel_type": "road"}
        ]
    },
    {
        "id": "R05",
        "code": "Zone G",
        "name": "North Hills Residential",
        "x": 620,
        "y": 120,
        "elevation": 910.0,
        "area": 5.0,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.02,
        "drainage_capacity": 50.0,
        "absorption_capacity": 28.0,
        "warning_threshold": 0.65,
        "critical_threshold": 1.25,
        "description": "Elevated residential sector with terrace drainage routing runoff east.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R02", "connectivity": 0.30, "channel_type": "road"},
            {"target_id": "R10", "connectivity": 0.55, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R06",
        "code": "Zone D",
        "name": "Commerce & Financial Center",
        "x": 480,
        "y": 380,
        "elevation": 872.0,
        "area": 5.8,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.05,
        "drainage_capacity": 22.0,  # silt-clogged box drains
        "absorption_capacity": 8.0,   # dense asphalt and towers
        "warning_threshold": 0.10,
        "critical_threshold": 0.16,
        "description": "SECOND CASCADE ZONE. High-density commercial district. Box drains choke rapidly, spilling downstream.",
        "is_bottleneck": True,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R09", "connectivity": 0.95, "channel_type": "culvert"},  # Direct massive outflow to Zone E
            {"target_id": "R13", "connectivity": 0.45, "channel_type": "road"},
            {"target_id": "R18", "connectivity": 0.30, "channel_type": "culvert"}
        ]
    },
    {
        "id": "R07",
        "code": "Zone H",
        "name": "West Expressway Interchange",
        "x": 180,
        "y": 320,
        "elevation": 878.0,
        "area": 4.2,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.03,
        "drainage_capacity": 48.0,
        "absorption_capacity": 15.0,
        "warning_threshold": 0.45,
        "critical_threshold": 0.85,
        "description": "Multi-tier highway underpass vulnerable to rapid water pooling.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R03", "connectivity": 0.40, "channel_type": "open_canal"},
            {"target_id": "R08", "connectivity": 0.50, "channel_type": "road"},
            {"target_id": "R16", "connectivity": 0.70, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R08",
        "code": "Zone I",
        "name": "Tech Park Central",
        "x": 330,
        "y": 300,
        "elevation": 880.0,
        "area": 6.5,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.02,
        "drainage_capacity": 52.0,
        "absorption_capacity": 22.0,
        "warning_threshold": 0.50,
        "critical_threshold": 0.95,
        "description": "Modern software campus with retention ponds and perimeter sluice gates.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R02", "connectivity": 0.35, "channel_type": "culvert"},
            {"target_id": "R04", "connectivity": 0.40, "channel_type": "open_canal"},
            {"target_id": "R06", "connectivity": 0.45, "channel_type": "culvert"},
            {"target_id": "R09", "connectivity": 0.50, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R09",
        "code": "Zone E",
        "name": "South Valley Slums & Lake Basin",
        "x": 470,
        "y": 520,
        "elevation": 855.0,  # Extreme low sink
        "area": 6.8,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.06,
        "drainage_capacity": 30.0,  # restricted wetland outfall
        "absorption_capacity": 14.0,
        "warning_threshold": 0.25,
        "critical_threshold": 0.56,
        "description": "CRITICAL CASCADE IMPACT ZONE. Lowest topographic depression. Gathers massive runoff from Zones B, C, D.",
        "is_bottleneck": True,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R11", "connectivity": 0.65, "channel_type": "wetland"},
            {"target_id": "R13", "connectivity": 0.40, "channel_type": "road"},
            {"target_id": "R14", "connectivity": 0.60, "channel_type": "open_canal"},
            {"target_id": "R19", "connectivity": 0.75, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R10",
        "code": "Zone J",
        "name": "East Metropolitan Sector",
        "x": 750,
        "y": 260,
        "elevation": 890.0,
        "area": 5.5,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.02,
        "drainage_capacity": 52.0,
        "absorption_capacity": 20.0,
        "warning_threshold": 0.55,
        "critical_threshold": 1.10,
        "description": "High-density residential and retail zone with steady gradient to eastern lake.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R04", "connectivity": 0.30, "channel_type": "road"},
            {"target_id": "R05", "connectivity": 0.40, "channel_type": "open_canal"},
            {"target_id": "R12", "connectivity": 0.50, "channel_type": "culvert"},
            {"target_id": "R15", "connectivity": 0.60, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R11",
        "code": "Zone K",
        "name": "Bellandur Wetland Buffer",
        "x": 630,
        "y": 550,
        "elevation": 860.0,
        "area": 8.0,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.05,
        "drainage_capacity": 38.0,
        "absorption_capacity": 40.0,
        "warning_threshold": 0.42,
        "critical_threshold": 0.82,
        "description": "Ecological marsh basin buffer, prone to weed clogging and toxic foam during storm peaks.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R09", "connectivity": 0.60, "channel_type": "wetland"},
            {"target_id": "R14", "connectivity": 0.50, "channel_type": "open_canal"},
            {"target_id": "R15", "connectivity": 0.45, "channel_type": "wetland"}
        ]
    },
    {
        "id": "R12",
        "code": "Zone L",
        "name": "Old Airport Logistics Hub",
        "x": 860,
        "y": 360,
        "elevation": 875.0,
        "area": 6.2,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.02,
        "drainage_capacity": 52.0,
        "absorption_capacity": 18.0,
        "warning_threshold": 0.50,
        "critical_threshold": 1.00,
        "description": "Warehousing and freight airstrip with wide apron drainage channels.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R10", "connectivity": 0.45, "channel_type": "culvert"},
            {"target_id": "R15", "connectivity": 0.55, "channel_type": "open_canal"},
            {"target_id": "R17", "connectivity": 0.35, "channel_type": "road"}
        ]
    },
    {
        "id": "R13",
        "code": "Zone M",
        "name": "South Ring Highway",
        "x": 330,
        "y": 480,
        "elevation": 868.0,
        "area": 4.0,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.03,
        "drainage_capacity": 36.0,
        "absorption_capacity": 10.0,
        "warning_threshold": 0.18,
        "critical_threshold": 0.34,
        "description": "Vital evacuation artery. Low underpass sections flood when Zone D and E back up.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R06", "connectivity": 0.45, "channel_type": "road"},
            {"target_id": "R09", "connectivity": 0.40, "channel_type": "road"},
            {"target_id": "R16", "connectivity": 0.55, "channel_type": "culvert"}
        ]
    },
    {
        "id": "R14",
        "code": "Zone N",
        "name": "Riverside Embankment Zone",
        "x": 560,
        "y": 620,
        "elevation": 862.0,
        "area": 4.9,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.15,
        "drainage_capacity": 30.0,
        "absorption_capacity": 16.0,
        "warning_threshold": 0.40,
        "critical_threshold": 0.80,
        "description": "Reinforced levee and river corridor handling southern urban outflow.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R09", "connectivity": 0.55, "channel_type": "open_canal"},
            {"target_id": "R11", "connectivity": 0.45, "channel_type": "open_canal"},
            {"target_id": "R19", "connectivity": 0.70, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R15",
        "code": "Zone O",
        "name": "Eastern Lakeside Suburb",
        "x": 800,
        "y": 480,
        "elevation": 865.0,
        "area": 5.4,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.10,
        "drainage_capacity": 34.0,
        "absorption_capacity": 26.0,
        "warning_threshold": 0.45,
        "critical_threshold": 0.88,
        "description": "Lakefront residential layout with natural stormwater retention ponds.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R10", "connectivity": 0.50, "channel_type": "open_canal"},
            {"target_id": "R11", "connectivity": 0.40, "channel_type": "wetland"},
            {"target_id": "R12", "connectivity": 0.45, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R16",
        "code": "Zone P",
        "name": "Southwest Drainage Canal",
        "x": 160,
        "y": 510,
        "elevation": 858.0,
        "area": 4.1,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.05,
        "drainage_capacity": 60.0,  # High-flow concrete aqueduct bypass
        "absorption_capacity": 15.0,
        "warning_threshold": 0.60,
        "critical_threshold": 1.20,
        "description": "Engineered concrete bypass conduit; key recipient for counterfactual flood diversion.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R07", "connectivity": 0.65, "channel_type": "open_canal"},
            {"target_id": "R13", "connectivity": 0.50, "channel_type": "culvert"},
            {"target_id": "R19", "connectivity": 0.65, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R17",
        "code": "Zone Q",
        "name": "Hospital & Emergency Hub",
        "x": 880,
        "y": 200,
        "elevation": 898.0,
        "area": 3.8,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.0,
        "drainage_capacity": 55.0,
        "absorption_capacity": 30.0,
        "warning_threshold": 0.70,
        "critical_threshold": 1.40,
        "description": "PRIMARY EMERGENCY FACILITY. Elevated healthcare campus with redundant drainage pumps.",
        "is_bottleneck": False,
        "is_safe_haven": True,
        "neighbors": [
            {"target_id": "R10", "connectivity": 0.40, "channel_type": "road"},
            {"target_id": "R12", "connectivity": 0.35, "channel_type": "road"},
            {"target_id": "R20", "connectivity": 0.60, "channel_type": "road"}
        ]
    },
    {
        "id": "R18",
        "code": "Zone R",
        "name": "Civic Administration Plaza",
        "x": 620,
        "y": 390,
        "elevation": 888.0,
        "area": 4.3,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.03,
        "drainage_capacity": 45.0,
        "absorption_capacity": 20.0,
        "warning_threshold": 0.55,
        "critical_threshold": 1.10,
        "description": "Central municipal emergency command and communications district.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R04", "connectivity": 0.35, "channel_type": "road"},
            {"target_id": "R06", "connectivity": 0.30, "channel_type": "culvert"},
            {"target_id": "R11", "connectivity": 0.40, "channel_type": "culvert"},
            {"target_id": "R17", "connectivity": 0.45, "channel_type": "road"}
        ]
    },
    {
        "id": "R19",
        "code": "Zone S",
        "name": "Southern Industrial Canal Outfall",
        "x": 340,
        "y": 640,
        "elevation": 852.0,  # Absolute lowest drainage terminal
        "area": 5.1,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.22,
        "drainage_capacity": 48.0,
        "absorption_capacity": 12.0,
        "warning_threshold": 0.50,
        "critical_threshold": 0.95,
        "description": "Terminal drainage estuary discharge to downstream river valley.",
        "is_bottleneck": False,
        "is_safe_haven": False,
        "neighbors": [
            {"target_id": "R09", "connectivity": 0.70, "channel_type": "open_canal"},
            {"target_id": "R14", "connectivity": 0.65, "channel_type": "open_canal"},
            {"target_id": "R16", "connectivity": 0.60, "channel_type": "open_canal"}
        ]
    },
    {
        "id": "R20",
        "code": "Zone T",
        "name": "Highland Sanctuary Shelter",
        "x": 820,
        "y": 70,
        "elevation": 938.0,  # Highest summit
        "area": 6.0,
        "baseline_rainfall": 85.0,
        "initial_water_level": 0.0,
        "drainage_capacity": 70.0,
        "absorption_capacity": 50.0,
        "warning_threshold": 1.00,
        "critical_threshold": 2.00,
        "description": "DESIGNATED HIGH-GROUND EVACUATION SANCTUARY. Highest elevation, rock base, zero flood hazard.",
        "is_bottleneck": False,
        "is_safe_haven": True,
        "neighbors": [
            {"target_id": "R05", "connectivity": 0.45, "channel_type": "road"},
            {"target_id": "R17", "connectivity": 0.65, "channel_type": "road"}
        ]
    }
]

def get_city_topology() -> Dict[str, RegionModel]:
    """Returns the validated city regions mapped by region ID."""
    city: Dict[str, RegionModel] = {}
    for item in REGIONS_DATA:
        neighbors = [NeighborConnection(**n) for n in item["neighbors"]]
        data = {**item, "neighbors": neighbors}
        city[item["id"]] = RegionModel(**data)
    return city
