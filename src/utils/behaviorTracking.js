/**
 * Behavioral Tracking Utility for Trust Score Analysis
 * Captures user interaction patterns for fraud detection
 */

class BehaviorTracker {
  constructor() {
    this.sessionStartTime = Date.now();
    this.ktpKeystrokeData = [];
    this.fieldEditCounts = {};
    this.mousePositions = [];
    this.seatHoverStartTime = null;
    this.seatHesitationTime = 0;
    this.totalClicks = 0;
    this.lastMousePosition = { x: 0, y: 0 };
  }

  // 1. Track total session time
  getSessionTime() {
    return Date.now() - this.sessionStartTime;
  }

  // 2. Track keystroke dynamics for KTP number field
  trackKTPKeystroke(fieldId, eventType, value) {
    const timestamp = Date.now();
    this.ktpKeystrokeData.push({
      fieldId,
      eventType, // 'keydown', 'keyup', 'paste'
      timestamp,
      value,
      length: value.length
    });
  }

  getKTPKeystrokeDynamics() {
    if (this.ktpKeystrokeData.length < 2) return 0;

    const keydownEvents = this.ktpKeystrokeData.filter(e => e.eventType === 'keydown');
    if (keydownEvents.length < 2) return 0;

    // Calculate average time between keystrokes
    const intervals = [];
    for (let i = 1; i < keydownEvents.length; i++) {
      intervals.push(keydownEvents[i].timestamp - keydownEvents[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Calculate variance for rhythm consistency
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;

    return {
      averageInterval: avgInterval,
      variance: variance,
      totalTime: keydownEvents[keydownEvents.length - 1].timestamp - keydownEvents[0].timestamp,
      pasteDetected: this.ktpKeystrokeData.some(e => e.eventType === 'paste')
    };
  }

  // 3. Track field edits/corrections
  trackFieldEdit(fieldId) {
    if (!this.fieldEditCounts[fieldId]) {
      this.fieldEditCounts[fieldId] = 0;
    }
    this.fieldEditCounts[fieldId]++;
  }

  getTotalFieldEdits() {
    return Object.values(this.fieldEditCounts).reduce((a, b) => a + b, 0);
  }

  // 4. Track mouse movement for entropy/smoothness
  trackMouseMovement(x, y) {
    const timestamp = Date.now();
    this.mousePositions.push({ x, y, timestamp });

    // Keep only last 100 positions to avoid memory issues
    if (this.mousePositions.length > 100) {
      this.mousePositions.shift();
    }
  }

  getMouseMovementEntropy() {
    if (this.mousePositions.length < 2) return 0;

    let totalDistance = 0;
    let totalAngleChange = 0;

    for (let i = 1; i < this.mousePositions.length; i++) {
      const prev = this.mousePositions[i - 1];
      const curr = this.mousePositions[i];

      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      totalDistance += distance;

      // Calculate angle change (for smoothness)
      if (i > 1) {
        const prevPrev = this.mousePositions[i - 2];
        const angle1 = Math.atan2(prev.y - prevPrev.y, prev.x - prevPrev.x);
        const angle2 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        let angleChange = Math.abs(angle2 - angle1);

        // Normalize angle change to 0-π
        if (angleChange > Math.PI) angleChange = 2 * Math.PI - angleChange;
        totalAngleChange += angleChange;
      }
    }

    // Higher angle change = more erratic/human-like
    // Lower angle change = more linear/bot-like
    const avgAngleChange = totalAngleChange / (this.mousePositions.length - 2);

    return {
      totalDistance,
      averageAngleChange: avgAngleChange,
      smoothness: avgAngleChange // Higher = more human-like
    };
  }

  // 5. Track seat selection hesitation
  startSeatHover() {
    if (!this.seatHoverStartTime) {
      this.seatHoverStartTime = Date.now();
    }
  }

  endSeatHover() {
    if (this.seatHoverStartTime) {
      this.seatHesitationTime += Date.now() - this.seatHoverStartTime;
      this.seatHoverStartTime = null;
    }
  }

  getSeatHesitationTime() {
    return this.seatHesitationTime;
  }

  // 6. Track total clicks
  trackClick() {
    this.totalClicks++;
  }

  getTotalClicks() {
    return this.totalClicks;
  }

  // Get all metrics for trust score calculation
  getAllMetrics() {
    const ktpDynamics = this.getKTPKeystrokeDynamics();
    const mouseEntropy = this.getMouseMovementEntropy();

    return {
      sessionTime: this.getSessionTime(),
      seatHesitationTime: this.getSeatHesitationTime(),
      ktpKeystrokeDynamics: ktpDynamics,
      fieldEditCount: this.getTotalFieldEdits(),
      mouseMovementEntropy: mouseEntropy,
      totalClicks: this.getTotalClicks()
    };
  }

  // Export flattened metrics for ML model
  exportForML() {
    const metrics = this.getAllMetrics();
    const ktpDynamics = metrics.ktpKeystrokeDynamics;
    const mouseEntropy = metrics.mouseMovementEntropy;

    return {
      session_time_ms: metrics.sessionTime,
      seat_hesitation_time_ms: metrics.seatHesitationTime,
      ktp_avg_keystroke_interval_ms: ktpDynamics.averageInterval || 0,
      ktp_keystroke_variance: ktpDynamics.variance || 0,
      ktp_total_entry_time_ms: ktpDynamics.totalTime || 0,
      ktp_paste_detected: ktpDynamics.pasteDetected ? 1 : 0,
      field_edit_count: metrics.fieldEditCount,
      mouse_total_distance: mouseEntropy.totalDistance || 0,
      mouse_smoothness: mouseEntropy.smoothness || 0,
      total_clicks: metrics.totalClicks
    };
  }
}

export default BehaviorTracker;
