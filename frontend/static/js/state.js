/**
 * FLOW-SHIELD Centralized Reactive State Store
 */

class AppState {
  constructor() {
    this.cityTopology = {};
    this.baselineSimulation = null;
    this.activeSimulation = null;
    this.activeScenarioComparison = null;
    this.activeScenarioId = "baseline";

    this.currentTime = 0; // minutes (0 - 60)
    this.isPlaying = false;
    this.speedMultiplier = 1; // 1x, 5x, 10x, 50x
    this.playbackInterval = null;

    this.selectedRegionId = "R09"; // Defaults to Zone E (the critical impact zone)
    this.activeMode = "twin"; // twin, emergency, comparison, replay
    this.butterflyChains = [];
    this.citizenReports = [];

    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(changeType, payload = {}) {
    for (const listener of this.listeners) {
      listener(changeType, payload);
    }
  }

  setCurrentTime(t) {
    const clamped = Math.max(0, Math.min(60, Math.round(t)));
    if (this.currentTime !== clamped) {
      this.currentTime = clamped;
      this.notify("time_change", { time: clamped });
    }
  }

  setSelectedRegion(regionId) {
    if (this.selectedRegionId !== regionId) {
      this.selectedRegionId = regionId;
      this.notify("region_selected", { regionId });
    }
  }

  setSpeed(speed) {
    this.speedMultiplier = speed;
    this.notify("speed_change", { speed });
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.notify("playback_state", { isPlaying: true });

    // Base interval is 1000ms for 1x (1 min simulated every sec)
    // 5x = 200ms, 10x = 100ms, 50x = 20ms
    const intervalMs = Math.max(20, Math.round(1000 / this.speedMultiplier));
    this.playbackInterval = setInterval(() => {
      if (this.currentTime >= 60) {
        this.pause();
      } else {
        this.setCurrentTime(this.currentTime + 1);
      }
    }, intervalMs);
  }

  pause() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    this.notify("playback_state", { isPlaying: false });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.currentTime >= 60) {
        this.setCurrentTime(0);
      }
      this.play();
    }
  }

  getCurrentTimestepData() {
    const sim = this.activeSimulation || this.baselineSimulation;
    if (!sim || !sim.timesteps || sim.timesteps.length === 0) return null;
    const t = Math.min(this.currentTime, sim.timesteps.length - 1);
    return sim.timesteps[t];
  }
}

export const state = new AppState();
