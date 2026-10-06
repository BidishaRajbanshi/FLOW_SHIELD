"""
FLOW-SHIELD Dynamic Evacuation Routing Engine
Implements time-dependent risk-aware pathfinding from vulnerable/flooded zones
to designated emergency sanctuaries, factoring in future inundation timing.
"""

from typing import List, Dict, Optional, Set, Any
import heapq

from backend.models.schemas import (
    EvacuationRoute,
    EvacuationRouteNode,
    SimulationResult,
    RegionStateAtTime
)
from backend.simulation.city_model import get_city_topology

class EvacuationRouter:
    def __init__(self, city_topology=None):
        self.city_topology = city_topology or get_city_topology()
        self.safe_havens = ["R20", "R17"]  # R20 = Highland Sanctuary, R17 = Hospital Hub

    def find_evacuation_routes(
        self,
        origin_id: str,
        simulation_result: SimulationResult,
        time_minutes: int = 30
    ) -> List[EvacuationRoute]:
        """
        Calculates dynamic evacuation routes from origin_id to safe havens
        at simulation timestamp time_minutes.
        """
        clamped_t = max(0, min(time_minutes, simulation_result.duration_minutes))
        ts = simulation_result.timesteps[clamped_t]
        
        origin_reg = self.city_topology.get(origin_id)
        if not origin_reg:
            raise ValueError(f"Origin region {origin_id} not found.")

        # Candidate destinations
        destinations = [d for d in self.safe_havens if d != origin_id]
        if not destinations:
            destinations = ["R20"]

        all_routes: List[EvacuationRoute] = []

        # Find paths to each destination using k-shortest paths or Dijkstra variants
        for dest_id in destinations:
            dest_reg = self.city_topology[dest_id]
            
            # Find primary and alternate paths
            paths = self._find_paths(origin_id, dest_id, ts, simulation_result, clamped_t)
            
            for path_idx, raw_path in enumerate(paths):
                route_id = f"evac_{origin_id}_{dest_id}_{path_idx+1}"
                route_nodes: List[EvacuationRouteNode] = []
                
                is_currently_safe = True
                min_window = 999
                
                for node_id in raw_path:
                    node_reg = self.city_topology[node_id]
                    node_state = ts.regions[node_id]
                    
                    # Calculate minutes until this node reaches Warning or Critical
                    mins_to_hazard = None
                    if node_state.risk_state == "CRITICAL":
                        is_currently_safe = False
                        mins_to_hazard = 0
                    elif node_state.risk_state == "WARNING":
                        # Warning now, check how long until critical
                        mins_to_hazard = self._calculate_minutes_until(
                            node_id, "CRITICAL", simulation_result, clamped_t
                        )
                    else:
                        mins_to_hazard = self._calculate_minutes_until(
                            node_id, "WARNING", simulation_result, clamped_t
                        )

                    if mins_to_hazard is not None:
                        min_window = min(min_window, mins_to_hazard)

                    route_nodes.append(
                        EvacuationRouteNode(
                            region_id=node_id,
                            region_name=node_reg.name,
                            water_level=node_state.water_level,
                            risk_state=node_state.risk_state,
                            minutes_until_flooded=mins_to_hazard,
                            is_safe=(node_state.risk_state == "SAFE")
                        )
                    )

                if min_window == 999:
                    min_window = 60

                # Formulate Status Label
                if not is_currently_safe:
                    status_label = "BLOCKED: SUBMERGED ROAD DETECTED"
                elif min_window <= 15:
                    status_label = f"CAUTION: SAFE NOW, BECOMES FLOODED IN {min_window} MIN"
                elif min_window <= 30:
                    status_label = f"MODERATE: SAFE FOR {min_window} MINUTES"
                else:
                    status_label = f"RECOMMENDED: SAFE FOR {min_window}+ MINUTES"

                all_routes.append(
                    EvacuationRoute(
                        route_id=route_id,
                        name=f"Corridor {chr(65+len(all_routes))} via {self.city_topology[raw_path[1]].code if len(raw_path) > 2 else dest_reg.code}",
                        origin_id=origin_id,
                        origin_name=origin_reg.name,
                        destination_id=dest_id,
                        destination_name=dest_reg.name,
                        path=route_nodes,
                        is_currently_safe=is_currently_safe,
                        status_label=status_label,
                        safe_window_minutes=min_window,
                        recommendation_rank=1 if is_currently_safe and min_window > 25 else (2 if is_currently_safe else 3),
                        total_distance_score=round(len(raw_path) * 1.5, 1)
                    )
                )

        # Sort routes by recommendation rank and safe window descending
        all_routes.sort(key=lambda r: (r.recommendation_rank, -r.safe_window_minutes))
        return all_routes

    def _calculate_minutes_until(
        self,
        region_id: str,
        target_state: str,
        simulation_result: SimulationResult,
        current_t: int
    ) -> Optional[int]:
        """Scans forward in simulation timeline to see when target_state is reached."""
        for t in range(current_t, simulation_result.duration_minutes + 1):
            st = simulation_result.timesteps[t].regions[region_id]
            if target_state == "CRITICAL" and st.risk_state == "CRITICAL":
                return t - current_t
            elif target_state == "WARNING" and st.risk_state in ("WARNING", "CRITICAL"):
                return t - current_t
        return 60 - current_t

    def _find_paths(
        self,
        src: str,
        dst: str,
        current_state: Any,
        simulation_result: SimulationResult,
        current_t: int
    ) -> List[List[str]]:
        """Breadth-first search finding up to 2 distinct paths avoiding impassable nodes where possible."""
        paths: List[List[str]] = []
        queue = [(src, [src])]
        visited: Set[str] = set()

        while queue and len(paths) < 2:
            curr, path = queue.pop(0)
            if curr == dst:
                paths.append(path)
                continue

            reg = self.city_topology[curr]
            for nbr in reg.neighbors:
                next_id = nbr.target_id
                if next_id not in path:
                    # Penalize already critical nodes
                    is_crit = current_state.regions[next_id].risk_state == "CRITICAL"
                    if not is_crit or len(queue) == 0:
                        queue.append((next_id, path + [next_id]))

        # Fallback if no clean path found
        if not paths:
            paths = [[src, "R18", dst] if "R18" in self.city_topology else [src, dst]]
            
        return paths
