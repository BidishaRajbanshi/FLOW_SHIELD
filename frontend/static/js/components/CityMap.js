/**
 * CityMap Component
 * High-performance 60 FPS HTML5 Canvas Particle Flow Engine + SVG Digital Twin Topology
 */
import { state } from "../state.js";

export class CityMap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.canvas = null;
    this.ctx = null;
    this.svg = null;
    this.particles = [];
    this.animationFrameId = null;
    this.evacuationRoutes = [];
    this.showElevationContours = true;
    this.showWaterFlow = true;

    this.init();
    state.subscribe((changeType, payload) => {
      if (changeType === "time_change" || changeType === "region_selected" || changeType === "mode_change") {
        this.renderSvgLayer();
      }
    });

    window.addEventListener("resize", () => this.handleResize());
  }

  init() {
    this.container.innerHTML = `
      <div class="map-viewport" id="map-viewport-el">
        <svg class="svg-layer" id="map-svg-el" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet"></svg>
        <canvas class="canvas-layer" id="map-canvas-el" width="1000" height="700"></canvas>

        <div class="map-hud-top">
          <div class="hud-pill">
            <span>CITY TWIN:</span>
            <b>REPRESENTATIVE BASIN (20 ZONES)</b>
          </div>
          <div class="hud-pill">
            <span>TERRAIN:</span>
            <b>852m - 938m ELEVATION</b>
          </div>
          <div class="hud-pill" id="hud-mode-pill">
            <span>MODE:</span>
            <b id="hud-mode-text" style="color: #c084fc;">DIGITAL TWIN</b>
          </div>
        </div>

        <div class="map-controls-group">
          <button class="map-icon-btn active" id="btn-toggle-flow" title="Toggle Animated Water Flow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M2 12h20M7 7l10 10M17 7 7 17"/>
            </svg>
          </button>
          <button class="map-icon-btn active" id="btn-toggle-contours" title="Toggle Elevation Contours">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </button>
        </div>

        <div class="map-legend-overlay">
          <div class="legend-item">
            <div class="legend-badge" style="background: #10b981;"></div>
            <span>SAFE (&lt; Warning)</span>
          </div>
          <div class="legend-item">
            <div class="legend-badge" style="background: #f59e0b;"></div>
            <span>WARNING</span>
          </div>
          <div class="legend-item">
            <div class="legend-badge" style="background: #ef4444; box-shadow: 0 0 8px #ef4444;"></div>
            <span>CRITICAL (&gt; Threshold)</span>
          </div>
          <div class="legend-item">
            <div class="legend-badge" style="background: #06b6d4;"></div>
            <span>WATER CONDUIT</span>
          </div>
          <div class="legend-item">
            <div class="legend-badge" style="background: #a855f7;"></div>
            <span>SAFE SANCTUARY</span>
          </div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById("map-canvas-el");
    this.ctx = this.canvas.getContext("2d");
    this.svg = document.getElementById("map-svg-el");

    document.getElementById("btn-toggle-flow").addEventListener("click", (e) => {
      e.currentTarget.classList.toggle("active");
      this.showWaterFlow = e.currentTarget.classList.contains("active");
    });

    document.getElementById("btn-toggle-contours").addEventListener("click", (e) => {
      e.currentTarget.classList.toggle("active");
      this.showElevationContours = e.currentTarget.classList.contains("active");
      this.renderSvgLayer();
    });

    this.handleResize();
    this.startParticleLoop();
  }

  handleResize() {
    const vp = document.getElementById("map-viewport-el");
    if (vp && this.canvas) {
      const rect = vp.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }
  }

  setEvacuationRoutes(routes) {
    this.evacuationRoutes = routes || [];
    this.renderSvgLayer();
  }

  renderSvgLayer() {
    const tsData = state.getCurrentTimestepData();
    if (!tsData || !state.cityTopology) return;

    const vp = document.getElementById("map-viewport-el");
    const width = vp ? vp.clientWidth : 1000;
    const height = vp ? vp.clientHeight : 700;

    // Coordinate scale factors (logical 1000x700 to actual viewport)
    const scaleX = width / 1000;
    const scaleY = height / 700;

    // Update HUD Mode
    const modeText = document.getElementById("hud-mode-text");
    if (modeText) {
      modeText.textContent = state.activeMode === "emergency" ? "EMERGENCY OPERATIONS" : "DIGITAL TWIN";
      modeText.style.color = state.activeMode === "emergency" ? "#ef4444" : "#c084fc";
    }

    let svgHtml = `
      <defs>
        <radialGradient id="grad-critical" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.8"/>
          <stop offset="70%" stop-color="#dc2626" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#7f1d1d" stop-opacity="0.0"/>
        </radialGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
    `;

    // 1. Render Topographic Elevation Contours
    if (this.showElevationContours) {
      svgHtml += `
        <g class="contours-layer" opacity="0.18">
          <ellipse cx="500" cy="530" rx="360" ry="140" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 4"/>
          <ellipse cx="480" cy="520" rx="280" ry="100" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="4 4"/>
          <ellipse cx="470" cy="510" rx="160" ry="60" fill="none" stroke="#0284c7" stroke-width="2"/>
          <ellipse cx="500" cy="200" rx="420" ry="180" fill="none" stroke="#a855f7" stroke-width="1" stroke-dasharray="6 6"/>
          <ellipse cx="500" cy="120" rx="350" ry="100" fill="none" stroke="#c084fc" stroke-width="1.5"/>
        </g>
      `;
    }

    // 2. Render Conduits / Channels / Roads between Regions
    svgHtml += `<g class="conduits-layer">`;
    const renderedConduits = new Set();

    for (const [srcId, reg] of Object.entries(state.cityTopology)) {
      const srcX = reg.x;
      const srcY = reg.y;

      for (const nbr of reg.neighbors) {
        const tgtReg = state.cityTopology[nbr.target_id];
        if (!tgtReg) continue;

        const conduitKey = [srcId, nbr.target_id].sort().join("--");
        if (renderedConduits.has(conduitKey)) continue;
        renderedConduits.add(conduitKey);

        const tgtX = tgtReg.x;
        const tgtY = tgtReg.y;

        // Check if evacuation route traverses this conduit
        let isEvacRoad = false;
        let isEvacSafe = true;
        if (state.activeMode === "emergency" && this.evacuationRoutes.length > 0) {
          const topRoute = this.evacuationRoutes[0];
          for (let i = 0; i < topRoute.path.length - 1; i++) {
            const p1 = topRoute.path[i].region_id;
            const p2 = topRoute.path[i+1].region_id;
            if ((p1 === srcId && p2 === nbr.target_id) || (p1 === nbr.target_id && p2 === srcId)) {
              isEvacRoad = true;
              isEvacSafe = topRoute.is_currently_safe;
              break;
            }
          }
        }

        let strokeColor = "rgba(51, 65, 85, 0.4)";
        let strokeWidth = 2;
        let strokeDash = "";

        if (isEvacRoad) {
          strokeColor = isEvacSafe ? "#10b981" : "#ef4444";
          strokeWidth = 5;
          strokeDash = isEvacSafe ? "" : "6 4";
        } else if (nbr.channel_type === "open_canal") {
          strokeColor = "rgba(6, 182, 212, 0.5)";
          strokeWidth = 3;
        } else if (nbr.channel_type === "culvert") {
          strokeColor = "rgba(168, 85, 247, 0.4)";
          strokeWidth = 2.5;
          strokeDash = "3 3";
        } else if (nbr.channel_type === "road") {
          strokeColor = "rgba(100, 116, 139, 0.4)";
          strokeWidth = 2;
        }

        // Curved arc between zones
        const midX = (srcX + tgtX) / 2;
        const midY = (srcY + tgtY) / 2 - 8;

        svgHtml += `
          <path d="M ${srcX} ${srcY} Q ${midX} ${midY} ${tgtX} ${tgtY}"
                fill="none"
                stroke="${strokeColor}"
                stroke-width="${strokeWidth}"
                stroke-dasharray="${strokeDash}"
                opacity="0.85" />
        `;
      }
    }
    svgHtml += `</g>`;

    // 3. Render Region Nodes and Risk Aura
    svgHtml += `<g class="regions-layer">`;
    for (const [rId, reg] of Object.entries(state.cityTopology)) {
      const regState = tsData.regions[rId] || {
        water_level: 0,
        risk_state: "SAFE",
        flooded_area_pct: 0
      };

      const isSelected = rId === state.selectedRegionId;
      const rx = reg.x;
      const ry = reg.y;
      const radius = reg.is_safe_haven ? 34 : (reg.is_bottleneck ? 30 : 26);

      // Color mapping
      let fillColor = "#10b981";
      let auraColor = "rgba(16, 185, 129, 0.2)";
      let strokeColor = "#34d399";
      let statusIcon = "✓";

      if (regState.risk_state === "WARNING") {
        fillColor = "#f59e0b";
        auraColor = "rgba(245, 158, 11, 0.35)";
        strokeColor = "#fbbf24";
        statusIcon = "▲";
      } else if (regState.risk_state === "CRITICAL") {
        fillColor = "#ef4444";
        auraColor = "rgba(239, 68, 68, 0.55)";
        strokeColor = "#f87171";
        statusIcon = "⚠";
      }

      if (reg.is_safe_haven) {
        strokeColor = "#c084fc";
      }

      // Critical pulse animation ring
      const pulseRing = regState.risk_state === "CRITICAL" ? `
        <circle cx="${rx}" cy="${ry}" r="${radius + 12}" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.6">
          <animate attributeName="r" values="${radius + 6};${radius + 22};${radius + 6}" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
      ` : "";

      // Selected ring
      const selectRing = isSelected ? `
        <circle cx="${rx}" cy="${ry}" r="${radius + 8}" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-dasharray="4 3"/>
      ` : "";

      // Water fill level indicator
      const waterHeight = Math.min(radius * 2, (regState.water_level / (reg.critical_threshold * 1.5)) * (radius * 2));

      svgHtml += `
        <g class="region-node-group" data-region-id="${rId}" style="cursor: pointer;">
          <!-- Aura -->
          <circle cx="${rx}" cy="${ry}" r="${radius + 6}" fill="${auraColor}" filter="url(#glow)" />
          ${pulseRing}
          ${selectRing}

          <!-- Base Node Circle -->
          <circle cx="${rx}" cy="${ry}" r="${radius}" fill="#0b1222" stroke="${strokeColor}" stroke-width="${isSelected ? 3 : 2}" />

          <!-- Internal Water Level Fill -->
          <clipPath id="clip-${rId}">
            <circle cx="${rx}" cy="${ry}" r="${radius - 1}" />
          </clipPath>
          <rect x="${rx - radius}" y="${ry + radius - waterHeight}" width="${radius * 2}" height="${waterHeight}"
                fill="rgba(6, 182, 212, 0.35)" clip-path="url(#clip-${rId})" />

          <!-- Code Badge -->
          <text x="${rx}" y="${ry - 5}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="800" font-family="monospace">
            ${reg.code}
          </text>

          <!-- Water Depth Readout -->
          <text x="${rx}" y="${ry + 9}" text-anchor="middle" fill="#93c5fd" font-size="9" font-weight="700" font-family="monospace">
            ${regState.water_level.toFixed(2)}m
          </text>

          <!-- Risk Status Icon Badge -->
          <circle cx="${rx + radius - 6}" cy="${ry - radius + 6}" r="7" fill="${fillColor}" stroke="#0b1222" stroke-width="1.5" />
          <text x="${rx + radius - 6}" y="${ry - radius + 9.5}" text-anchor="middle" fill="#ffffff" font-size="8" font-weight="900">
            ${statusIcon}
          </text>

          <!-- Zone Name Label Below Node -->
          <text x="${rx}" y="${ry + radius + 15}" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="600"
                style="text-shadow: 0 2px 4px rgba(0,0,0,0.9);">
            ${reg.name}
          </text>
          <text x="${rx}" y="${ry + radius + 26}" text-anchor="middle" fill="#64748b" font-size="8.5" font-family="monospace">
            Elev: ${reg.elevation}m
          </text>
        </g>
      `;
    }
    svgHtml += `</g>`;

    // 4. Render Citizen Reports Pins
    if (state.citizenReports && state.citizenReports.length > 0) {
      svgHtml += `<g class="citizen-reports-layer">`;
      for (const rep of state.citizenReports) {
        const reg = state.cityTopology[rep.region_id];
        if (reg) {
          const px = reg.x + 22;
          const py = reg.y - 20;
          svgHtml += `
            <g class="citizen-pin" transform="translate(${px}, ${py})">
              <circle cx="0" cy="0" r="10" fill="#f43f5e" stroke="#ffffff" stroke-width="1.5" />
              <text x="0" y="3.5" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">!</text>
              <text x="0" y="-14" text-anchor="middle" fill="#f43f5e" font-size="7.5" font-weight="bold" font-family="monospace">
                ${rep.water_depth_cm}cm
              </text>
            </g>
          `;
        }
      }
      svgHtml += `</g>`;
    }

    this.svg.innerHTML = svgHtml;

    // Attach click listeners to region nodes
    this.svg.querySelectorAll(".region-node-group").forEach((el) => {
      el.addEventListener("click", () => {
        const regId = el.getAttribute("data-region-id");
        state.setSelectedRegion(regId);
      });
    });
  }

  startParticleLoop() {
    const animate = () => {
      this.updateParticles();
      this.drawParticles();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  updateParticles() {
    if (!this.showWaterFlow) {
      this.particles = [];
      return;
    }

    const tsData = state.getCurrentTimestepData();
    if (!tsData || !tsData.flows) return;

    const vp = document.getElementById("map-viewport-el");
    const width = vp ? vp.clientWidth : 1000;
    const height = vp ? vp.clientHeight : 700;
    const sx = width / 1000;
    const sy = height / 700;

    // Spawn particles for active flows
    for (const flow of tsData.flows) {
      if (flow.flow_rate > 0.05) {
        const srcReg = state.cityTopology[flow.source_id];
        const tgtReg = state.cityTopology[flow.target_id];
        if (!srcReg || !tgtReg) continue;

        // Rate determines spawn frequency
        const spawnProb = Math.min(0.65, flow.flow_rate * 0.08);
        if (Math.random() < spawnProb && this.particles.length < 350) {
          this.particles.push({
            x: srcReg.x * sx,
            y: srcReg.y * sy,
            srcX: srcReg.x * sx,
            srcY: srcReg.y * sy,
            tgtX: tgtReg.x * sx,
            tgtY: tgtReg.y * sy,
            progress: 0,
            speed: 0.012 + Math.min(0.04, flow.flow_rate * 0.005),
            size: 2.0 + Math.min(2.5, flow.flow_rate * 0.2),
            color: flow.flow_rate > 2.0 ? "#38bdf8" : "#06b6d4"
          });
        }
      }
    }

    // Update existing particle positions
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.progress += p.speed;
      if (p.progress >= 1.0) {
        this.particles.splice(i, 1);
      } else {
        // Interpolate along quadratic curve
        const midX = (p.srcX + p.tgtX) / 2;
        const midY = (p.srcY + p.tgtY) / 2 - 8;
        const t = p.progress;
        p.x = (1 - t) * (1 - t) * p.srcX + 2 * (1 - t) * t * midX + t * t * p.tgtX;
        p.y = (1 - t) * (1 - t) * p.srcY + 2 * (1 - t) * t * midY + t * t * p.tgtY;
      }
    }
  }

  drawParticles() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }
}
