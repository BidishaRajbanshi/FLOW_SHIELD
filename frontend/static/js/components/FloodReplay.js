/**
 * FloodReplay Component
 * Replays chronological flood propagation wave across urban sectors
 */
import { state } from "../state.js";

export class FloodReplay {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.replayInterval = null;
    this.currentIndex = 0;
    this.timelineEvents = [];
    this.init();

    window.addEventListener("open_replay_modal", () => {
      this.startReplay();
    });
  }

  init() {
    this.modal.innerHTML = `
      <div class="modal-card" style="max-width: 650px;">
        <div class="modal-header">
          <div class="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5">
              <polygon points="11 19 2 12 11 5 11 19"/>
              <polygon points="22 19 13 12 22 5 22 19"/>
            </svg>
            CHRONOLOGICAL FLOOD REPLAY
          </div>
          <button class="modal-close-btn" id="btn-close-replay">&times;</button>
        </div>

        <div class="modal-body">
          <div style="font-size: 0.78rem; color: #94a3b8;">
            Step-by-step replay illustrating how stormwater surcharge cascaded through conduits from high elevations into downstream basins.
          </div>

          <!-- Replay Stepper List -->
          <div id="replay-stepper-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow-y: auto;">
            <!-- Event items injected here -->
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
            <button class="header-btn" id="btn-pause-replay">Pause Replay</button>
            <button class="header-btn btn-what-if" id="btn-restart-replay">Restart from T+0</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-replay").addEventListener("click", () => this.close());
    document.getElementById("btn-pause-replay").addEventListener("click", () => this.togglePause());
    document.getElementById("btn-restart-replay").addEventListener("click", () => this.startReplay());
  }

  startReplay() {
    const sim = state.activeSimulation || state.baselineSimulation;
    if (!sim) return;

    this.timelineEvents = sim.critical_events_timeline;
    this.currentIndex = 0;
    this.open();
    this.renderEvents();

    if (this.replayInterval) clearInterval(this.replayInterval);
    this.stepNext();
    this.replayInterval = setInterval(() => this.stepNext(), 2200);
  }

  stepNext() {
    if (this.currentIndex >= this.timelineEvents.length) {
      clearInterval(this.replayInterval);
      this.replayInterval = null;
      return;
    }

    const ev = this.timelineEvents[this.currentIndex];
    state.setCurrentTime(ev.time_minutes);
    state.setSelectedRegion(ev.region_id);

    this.currentIndex++;
    this.renderEvents();
  }

  togglePause() {
    const btn = document.getElementById("btn-pause-replay");
    if (this.replayInterval) {
      clearInterval(this.replayInterval);
      this.replayInterval = null;
      btn.textContent = "Resume Replay";
    } else {
      this.replayInterval = setInterval(() => this.stepNext(), 2200);
      btn.textContent = "Pause Replay";
    }
  }

  renderEvents() {
    const listEl = document.getElementById("replay-stepper-list");
    if (!listEl) return;

    listEl.innerHTML = this.timelineEvents.map((ev, idx) => {
      const isActive = idx === this.currentIndex - 1;
      const isPast = idx < this.currentIndex - 1;
      const isCrit = ev.event_type === "CRITICAL_REACHED";

      const badgeColor = isCrit ? "#ef4444" : "#f59e0b";
      const borderColor = isActive ? "#c084fc" : (isPast ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)");
      const bg = isActive ? "rgba(168, 85, 247, 0.18)" : (isPast ? "rgba(15, 23, 42, 0.6)" : "rgba(15, 23, 42, 0.3)");

      return `
        <div style="background: ${bg}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 14px; transition: all 0.2s;">
          <div style="font-family: monospace; font-size: 0.85rem; font-weight: 800; color: #38bdf8; min-width: 60px;">
            ${ev.time_minutes < 10 ? `00:0${ev.time_minutes}` : `00:${ev.time_minutes}`}
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <b style="color: #fff; font-size: 0.82rem;">${ev.region_code}</b>
              <span style="font-size: 0.72rem; color: #94a3b8;">${ev.region_name}</span>
            </div>
            <div style="font-size: 0.72rem; color: #cbd5e1; margin-top: 2px;">
              ${ev.message}
            </div>
          </div>
          <span style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">
            ${ev.event_type.replace('_REACHED', '')}
          </span>
        </div>
      `;
    }).join("");
  }

  open() {
    this.modal.classList.add("active");
  }

  close() {
    if (this.replayInterval) clearInterval(this.replayInterval);
    this.modal.classList.remove("active");
  }
}
