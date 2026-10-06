/**
 * CitizenReport Component
 * Community flood incident reporting modal and map pin placement
 */
import { state } from "../state.js";
import { API } from "../api.js";

export class CitizenReportModal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.init();

    window.addEventListener("open_report_modal", () => {
      this.open();
    });
  }

  init() {
    this.modal.innerHTML = `
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header">
          <div class="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
            SUBMIT CITIZEN FLOOD REPORT
          </div>
          <button class="modal-close-btn" id="btn-close-report">&times;</button>
        </div>

        <div class="modal-body">
          <div style="font-size: 0.76rem; color: #94a3b8; line-height: 1.4;">
            Community observations ground the digital twin with field reports.
            <i>Note: Citizen observations are representative and advisory.</i>
          </div>

          <form id="citizen-report-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 0.74rem; color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">Observed Sector / Region</label>
              <select id="report-region-select" style="width: 100%; background: #0f172a; border: 1px solid var(--border-subtle); color: #fff; padding: 8px; border-radius: 6px; font-size: 0.8rem;">
                <!-- Regions populated in open() -->
              </select>
            </div>

            <div>
              <label style="font-size: 0.74rem; color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">Specific Location / Street Landmark</label>
              <input type="text" id="report-location-name" required placeholder="e.g. Ring Highway Underpass Km 14" style="width: 100%; background: #0f172a; border: 1px solid var(--border-subtle); color: #fff; padding: 8px; border-radius: 6px; font-size: 0.8rem;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 0.74rem; color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">Estimated Water Depth (cm)</label>
                <input type="number" id="report-depth" min="5" max="300" value="35" required style="width: 100%; background: #0f172a; border: 1px solid var(--border-subtle); color: #fff; padding: 8px; border-radius: 6px; font-size: 0.8rem;" />
              </div>
              <div>
                <label style="font-size: 0.74rem; color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">Observation Type</label>
                <select id="report-type" style="width: 100%; background: #0f172a; border: 1px solid var(--border-subtle); color: #fff; padding: 8px; border-radius: 6px; font-size: 0.8rem;">
                  <option value="road_submerged">Road Submerged</option>
                  <option value="canal_overflow">Canal Overflow</option>
                  <option value="water_clogging">Drainage Clogging</option>
                  <option value="resident_alert">Basement Inundation</option>
                </select>
              </div>
            </div>

            <div>
              <label style="font-size: 0.74rem; color: #cbd5e1; font-weight: 600; display: block; margin-bottom: 4px;">Reporter Identity / Community Warden</label>
              <input type="text" id="report-author" value="Community Warden" required style="width: 100%; background: #0f172a; border: 1px solid var(--border-subtle); color: #fff; padding: 8px; border-radius: 6px; font-size: 0.8rem;" />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
              <button type="button" class="header-btn" id="btn-cancel-report">Cancel</button>
              <button type="submit" class="header-btn" style="background: #f43f5e; border-color: #f43f5e; color: #fff; font-weight: 700;">
                SUBMIT REPORT
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById("btn-close-report").addEventListener("click", () => this.close());
    document.getElementById("btn-cancel-report").addEventListener("click", () => this.close());

    document.getElementById("citizen-report-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.submitReport();
    });
  }

  populateRegions() {
    const select = document.getElementById("report-region-select");
    if (!select || !state.cityTopology) return;

    select.innerHTML = Object.values(state.cityTopology)
      .map(
        (reg) => `
      <option value="${reg.id}" ${reg.id === state.selectedRegionId ? "selected" : ""}>
        ${reg.code} - ${reg.name}
      </option>
    `
      )
      .join("");
  }

  async submitReport() {
    const regionId = document.getElementById("report-region-select").value;
    const locName = document.getElementById("report-location-name").value;
    const depth = parseFloat(document.getElementById("report-depth").value);
    const photoType = document.getElementById("report-type").value;
    const author = document.getElementById("report-author").value;

    const reportPayload = {
      id: "REP-" + Math.floor(100 + Math.random() * 900),
      region_id: regionId,
      location_name: locName,
      water_depth_cm: depth,
      timestamp_min: state.currentTime,
      photo_type: photoType,
      reported_by: author,
      verified: true
    };

    try {
      await API.submitCitizenReport(reportPayload);
      state.citizenReports.push(reportPayload);
      state.notify("reports_updated");
      this.close();
      alert(`Citizen report #${reportPayload.id} logged and pinned to digital city map!`);
    } catch (e) {
      alert("Failed to submit report: " + e.message);
    }
  }

  open() {
    this.populateRegions();
    this.modal.classList.add("active");
  }

  close() {
    this.modal.classList.remove("active");
  }
}
