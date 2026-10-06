/**
 * TimeMachine Component
 * Interactive scrubber, simulation speed triggers, and critical event markers
 */
import { state } from "../state.js";

export class TimeMachine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
    state.subscribe((changeType, payload) => {
      if (changeType === "time_change") {
        this.updateSliderValue(payload.time);
      } else if (changeType === "playback_state") {
        this.updatePlayButton(payload.isPlaying);
      } else if (changeType === "speed_change") {
        this.updateSpeedButtons(payload.speed);
      }
    });
  }

  init() {
    this.container.innerHTML = `
      <div class="time-machine-bar">
        <div class="playback-controls">
          <button class="play-btn" id="btn-play-pause" title="Play / Pause Simulation">
            <svg id="icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <svg id="icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          </button>

          <div class="speed-selector">
            <button class="speed-btn active" data-speed="1">1x</button>
            <button class="speed-btn" data-speed="5">5x</button>
            <button class="speed-btn" data-speed="10">10x</button>
            <button class="speed-btn" data-speed="50">50x</button>
          </div>
        </div>

        <div class="timeline-track-container">
          <input type="range" class="timeline-slider" id="timeline-slider-input" min="0" max="60" value="0" step="1" />
          
          <div class="timeline-events-bar" id="timeline-events-bar-el">
            <span style="color: #38bdf8; font-weight: 700;">NOW (T+0)</span>
            
            <!-- Dynamic Critical Event Flags will be injected here -->
            <div class="timeline-event-marker" style="left: 25%;" title="T+15m: Zone D Critical" data-jump="15">
              <div class="marker-dot"></div>
              <span style="font-size: 0.65rem; color: #fca5a5;">15m: Zone D</span>
            </div>

            <div class="timeline-event-marker" style="left: 40%;" title="T+24m: Zone E Critical" data-jump="24">
              <div class="marker-dot"></div>
              <span style="font-size: 0.65rem; color: #fca5a5;">24m: Zone E</span>
            </div>

            <div class="timeline-event-marker" style="left: 58.3%;" title="T+35m: Highway Inaccessible" data-jump="35">
              <div class="marker-dot"></div>
              <span style="font-size: 0.65rem; color: #fca5a5;">35m: Highway</span>
            </div>

            <span style="color: #94a3b8;">+60 MIN (PEAK)</span>
          </div>
        </div>

        <button class="header-btn" id="btn-open-tray" style="font-size: 0.75rem; padding: 5px 10px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          CAUSAL ANALYSIS
        </button>
      </div>
    `;

    // Sliders and Buttons
    const slider = document.getElementById("timeline-slider-input");
    slider.addEventListener("input", (e) => {
      state.setCurrentTime(parseInt(e.target.value));
    });

    document.getElementById("btn-play-pause").addEventListener("click", () => {
      state.togglePlay();
    });

    document.querySelectorAll(".speed-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const speed = parseInt(btn.getAttribute("data-speed"));
        state.setSpeed(speed);
      });
    });

    // Event markers jump
    document.querySelectorAll(".timeline-event-marker").forEach((el) => {
      el.addEventListener("click", () => {
        const jumpT = parseInt(el.getAttribute("data-jump"));
        state.setCurrentTime(jumpT);
      });
    });

    // Causal tray open toggle
    document.getElementById("btn-open-tray").addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("toggle_causal_tray"));
    });
  }

  updateSliderValue(time) {
    const slider = document.getElementById("timeline-slider-input");
    if (slider) slider.value = time;
  }

  updatePlayButton(isPlaying) {
    const iconPlay = document.getElementById("icon-play");
    const iconPause = document.getElementById("icon-pause");
    if (iconPlay && iconPause) {
      iconPlay.style.display = isPlaying ? "none" : "block";
      iconPause.style.display = isPlaying ? "block" : "none";
    }
  }

  updateSpeedButtons(speed) {
    document.querySelectorAll(".speed-btn").forEach((btn) => {
      const btnSpeed = parseInt(btn.getAttribute("data-speed"));
      if (btnSpeed === speed) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
}
