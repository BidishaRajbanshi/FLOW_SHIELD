/**
 * FlowCopilot Component
 * Grounded AI chat assistant drawer reading live simulation telemetry
 */
import { state } from "../state.js";
import { API } from "../api.js";

export class FlowCopilot {
  constructor(drawerId) {
    this.drawer = document.getElementById(drawerId);
    this.messages = [];
    this.isQuerying = false;
    this.init();

    window.addEventListener("toggle_copilot_drawer", () => {
      this.toggle();
    });
  }

  init() {
    this.drawer.innerHTML = `
      <div class="copilot-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #c084fc; box-shadow: 0 0 8px #c084fc;"></div>
          <span style="font-size: 0.88rem; font-weight: 800; color: #fff;">FLOW-COPILOT</span>
          <span style="font-size: 0.65rem; color: #c084fc; background: rgba(168, 85, 247, 0.2); padding: 1px 6px; border-radius: 3px; font-family: monospace;">TELEMETRY-GROUNDED</span>
        </div>
        <button class="modal-close-btn" id="btn-close-copilot" style="font-size: 1.2rem;">&times;</button>
      </div>

      <div class="copilot-messages-container" id="copilot-msgs-el">
        <div class="copilot-bubble agent">
          👋 <b>Greetings, Commander.</b> I am <b>FLOW-COPILOT</b>, your AI flood intelligence assistant. I analyze deterministic hydro-topographic telemetry in real time.
          <div style="margin-top: 6px; color: #94a3b8;">
            Try asking one of the tactical queries below:
          </div>
        </div>
      </div>

      <!-- Quick Suggestion Chips -->
      <div style="padding: 6px 14px; display: flex; gap: 6px; overflow-x: auto; border-top: 1px solid rgba(255,255,255,0.06);" id="copilot-chips-el">
        <button class="copilot-chip" data-q="Why is Zone E flooding?">Why is Zone E flooding?</button>
        <button class="copilot-chip" data-q="How did the flood reach Zone E?">How did the flood reach Zone E?</button>
        <button class="copilot-chip" data-q="Compare Scenario A and Scenario B">Compare Scenario A & B</button>
        <button class="copilot-chip" data-q="Which regions are connected to Zone D?">Zone D Connections?</button>
        <button class="copilot-chip" data-q="What happens if rainfall increases by 20%?">Rainfall +20% Impact?</button>
      </div>

      <div class="copilot-input-bar">
        <input type="text" class="copilot-input" id="copilot-input-el" placeholder="Ask about cascades, regions, or scenarios..." />
        <button class="copilot-send-btn" id="copilot-send-btn-el">Send</button>
      </div>
    `;

    // Style chips
    const style = document.createElement("style");
    style.textContent = `
      .copilot-chip {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid var(--border-subtle);
        color: #cbd5e1;
        font-size: 0.68rem;
        padding: 4px 8px;
        border-radius: 12px;
        white-space: nowrap;
        cursor: pointer;
      }
      .copilot-chip:hover {
        background: rgba(168, 85, 247, 0.25);
        color: #fff;
        border-color: #c084fc;
      }
    `;
    document.head.appendChild(style);

    document.getElementById("btn-close-copilot").addEventListener("click", () => this.close());
    document.getElementById("copilot-send-btn-el").addEventListener("click", () => this.sendInput());
    document.getElementById("copilot-input-el").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.sendInput();
    });

    document.querySelectorAll(".copilot-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const q = chip.getAttribute("data-q");
        this.ask(q);
      });
    });
  }

  toggle() {
    this.drawer.classList.toggle("open");
  }

  open() {
    this.drawer.classList.add("open");
  }

  close() {
    this.drawer.classList.remove("open");
  }

  sendInput() {
    const input = document.getElementById("copilot-input-el");
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    this.ask(q);
  }

  async ask(question) {
    if (this.isQuerying) return;
    this.isQuerying = true;
    this.open();

    const container = document.getElementById("copilot-msgs-el");

    // Add user bubble
    const userBubble = document.createElement("div");
    userBubble.className = "copilot-bubble user";
    userBubble.textContent = question;
    container.appendChild(userBubble);

    // Add loading agent bubble
    const loadingBubble = document.createElement("div");
    loadingBubble.className = "copilot-bubble agent";
    loadingBubble.innerHTML = `<i>Querying simulation telemetry...</i>`;
    container.appendChild(loadingBubble);
    container.scrollTop = container.scrollHeight;

    try {
      const res = await API.queryCopilot(question, state.currentTime, state.selectedRegionId);
      
      // Convert markdown bold and lists to HTML
      let html = res.answer
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/• /g, '&bull; ')
        .replace(/\| (.*?) \|/g, '<span style="font-family: monospace; font-size: 0.72rem;">$1</span>');

      loadingBubble.innerHTML = `
        <div>${html}</div>
        <div style="margin-top: 8px; font-size: 0.65rem; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 4px;">
          <b>Sources:</b> ${res.sources_used.join(', ')}
        </div>
      `;
    } catch (e) {
      loadingBubble.innerHTML = `<span style="color: #ef4444;">Error connecting to Flow-Copilot: ${e.message}</span>`;
    } finally {
      this.isQuerying = false;
      container.scrollTop = container.scrollHeight;
    }
  }
}
