/**
 * Comprehensive User Behavior Tracking System
 * Captures mouse movements, keystroke patterns, form interactions, and other behaviors
 * to determine if a user is human or bot for trust score calculation
 */
export class BehaviorTracker {
  constructor(userId) {
    this.userId = userId;
    this.trackingData = {
      mouseMovements: [],
      keystrokes: [],
      clicks: [],
      scrollEvents: [],
      formInteractions: {},
      windowEvents: [],
      touchEvents: [],
      sessionMetrics: {
        startTime: Date.now(),
        totalMouseDistance: 0,
        totalKeystrokes: 0,
        totalClicks: 0,
        totalScrolls: 0,
        formFieldFocusTime: {},
        formFieldChanges: {},
        suspiciousPatterns: [],
        interactionCount: 0,
        focusChanges: 0,
      },
      // Advanced metrics for bot detection
      timingMetrics: {
        keystrokeIntervals: [],
        clickIntervals: [],
        mouseStopDurations: [],
        formFieldDwellTime: {},
      },
      humanBehaviorIndicators: {
        mouseJitter: 0,
        naturalTypingVariation: 0,
        hesitationPatterns: 0,
        correctionPatterns: 0,
        naturalScrolling: 0,
        mouseAcceleration: [],
        pressureSensitivity: [], // For devices that support it
      },
      deviceData: {
        screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown',
        language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
        touchSupport: typeof window !== 'undefined' ? 'ontouchstart' in window : false,
        devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      }
    };
    
    this.isTracking = false;
    this.lastMousePosition = { x: 0, y: 0 };
    this.lastMouseTime = 0;
    this.lastKeystrokeTime = 0;
    this.lastClickTime = 0;
    this.currentFocusedField = null;
    this.fieldFocusStartTime = 0;
    this.mouseVelocityHistory = [];
    this.keystrokeRhythm = [];
    this.periodicTrackingInterval = null;
    
    // Auto-start tracking if in browser environment
    if (typeof window !== 'undefined') {
      this.startTracking();
    }
  }

  // Start tracking user behavior
  startTracking() {
    if (this.isTracking || typeof window === 'undefined') return;
    
    this.isTracking = true;
    this.trackingData.sessionMetrics.startTime = Date.now();
    
    this.setupEventListeners();
    console.log('Comprehensive behavior tracking started for user:', this.userId);
  }

  // Stop tracking and return collected data
  stopTracking() {
    if (!this.isTracking) return null;
    
    this.isTracking = false;
    this.removeEventListeners();
    
    if (this.periodicTrackingInterval) {
      clearInterval(this.periodicTrackingInterval);
      this.periodicTrackingInterval = null;
    }
    
    // Calculate final metrics
    this.calculateFinalMetrics();
    
    console.log('Behavior tracking stopped');
    return this.getTrackingData();
  }

  // Setup all event listeners
  setupEventListeners() {
    if (typeof document === 'undefined') return;

    // Mouse movement tracking
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    document.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });

    // Keystroke tracking
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
    document.addEventListener('keydown', this.keyDownHandler, { passive: true });
    document.addEventListener('keyup', this.keyUpHandler, { passive: true });

    // Click tracking
    this.clickHandler = this.handleClick.bind(this);
    document.addEventListener('click', this.clickHandler, { passive: true });

    // Scroll tracking
    this.scrollHandler = this.handleScroll.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }

    // Form interaction tracking
    this.focusHandler = this.handleFocus.bind(this);
    this.blurHandler = this.handleBlur.bind(this);
    this.inputHandler = this.handleInput.bind(this);
    document.addEventListener('focusin', this.focusHandler, { passive: true });
    document.addEventListener('focusout', this.blurHandler, { passive: true });
    document.addEventListener('input', this.inputHandler, { passive: true });

    // Window events
    this.visibilityHandler = this.handleVisibilityChange.bind(this);
    this.focusWindowHandler = this.handleWindowFocus.bind(this);
    this.blurWindowHandler = this.handleWindowBlur.bind(this);
    document.addEventListener('visibilitychange', this.visibilityHandler, { passive: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.focusWindowHandler, { passive: true });
      window.addEventListener('blur', this.blurWindowHandler, { passive: true });
    }

    // Touch events for mobile devices
    this.touchStartHandler = this.handleTouchStart.bind(this);
    this.touchMoveHandler = this.handleTouchMove.bind(this);
    this.touchEndHandler = this.handleTouchEnd.bind(this);
    document.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    document.addEventListener('touchmove', this.touchMoveHandler, { passive: true });
    document.addEventListener('touchend', this.touchEndHandler, { passive: true });

    // Page unload tracking
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
  }

  // Remove all event listeners
  removeEventListeners() {
    if (typeof document === 'undefined') return;

    document.removeEventListener('mousemove', this.mouseMoveHandler);
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
    document.removeEventListener('click', this.clickHandler);
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    document.removeEventListener('focusin', this.focusHandler);
    document.removeEventListener('focusout', this.blurHandler);
    document.removeEventListener('input', this.inputHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.focusWindowHandler);
      window.removeEventListener('blur', this.blurWindowHandler);
    }
    document.removeEventListener('touchstart', this.touchStartHandler);
    document.removeEventListener('touchmove', this.touchMoveHandler);
    document.removeEventListener('touchend', this.touchEndHandler);
  }

  // Handle mouse movement
  handleMouseMove(event) {
    if (!this.isTracking) return;

    const currentTime = Date.now();
    const currentPosition = { x: event.clientX, y: event.clientY };

    if (this.lastMouseTime > 0) {
      const timeDiff = currentTime - this.lastMouseTime;
      const distance = this.calculateDistance(this.lastMousePosition, currentPosition);
      const velocity = timeDiff > 0 ? distance / timeDiff : 0;

      // Calculate acceleration
      const lastVelocity = this.mouseVelocityHistory.length > 0 ? 
        this.mouseVelocityHistory[this.mouseVelocityHistory.length - 1] : 0;
      const acceleration = Math.abs(velocity - lastVelocity) / Math.max(timeDiff, 1);

      // Store mouse movement data
      const mouseData = {
        timestamp: currentTime,
        x: currentPosition.x,
        y: currentPosition.y,
        distance: distance,
        velocity: velocity,
        acceleration: acceleration,
        timeDiff: timeDiff,
        pressure: event.pressure || 0, // For devices that support pressure
      };

      this.trackingData.mouseMovements.push(mouseData);
      this.trackingData.sessionMetrics.totalMouseDistance += distance;
      this.trackingData.sessionMetrics.interactionCount++;

      // Track velocity and acceleration for analysis
      this.mouseVelocityHistory.push(velocity);
      this.trackingData.humanBehaviorIndicators.mouseAcceleration.push(acceleration);
      
      if (this.mouseVelocityHistory.length > 50) {
        this.mouseVelocityHistory.shift();
      }
      if (this.trackingData.humanBehaviorIndicators.mouseAcceleration.length > 50) {
        this.trackingData.humanBehaviorIndicators.mouseAcceleration.shift();
      }

      // Detect mouse jitter (rapid small movements - human-like)
      if (distance < 5 && timeDiff < 50 && velocity > 0.1) {
        this.trackingData.humanBehaviorIndicators.mouseJitter++;
      }

      // Detect unnatural straight lines or perfect curves
      this.detectUnaturalMousePatterns(mouseData);

      // Limit stored data to prevent memory issues
      if (this.trackingData.mouseMovements.length > 1000) {
        this.trackingData.mouseMovements.shift();
      }
    }

    this.lastMousePosition = currentPosition;
    this.lastMouseTime = currentTime;
  }

  // Handle keystroke patterns
  handleKeyDown(event) {
    if (!this.isTracking) return;

    const currentTime = Date.now();
    const timeSinceLastKeystroke = this.lastKeystrokeTime > 0 ? currentTime - this.lastKeystrokeTime : 0;

    const keystrokeData = {
      timestamp: currentTime,
      key: event.key,
      keyCode: event.keyCode || event.which,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      timeSinceLastKeystroke: timeSinceLastKeystroke,
      dwellTime: 0, // Will be updated on keyup
      isSpecialKey: this.isSpecialKey(event.key),
    };

    this.trackingData.keystrokes.push(keystrokeData);
    this.trackingData.sessionMetrics.totalKeystrokes++;
    this.trackingData.sessionMetrics.interactionCount++;

    // Track keystroke intervals for rhythm analysis
    if (timeSinceLastKeystroke > 0) {
      this.trackingData.timingMetrics.keystrokeIntervals.push(timeSinceLastKeystroke);
      this.keystrokeRhythm.push(timeSinceLastKeystroke);
      
      // Analyze typing rhythm variation (human-like characteristic)
      if (this.keystrokeRhythm.length > 10) {
        const variance = this.calculateVariance(this.keystrokeRhythm.slice(-10));
        this.trackingData.humanBehaviorIndicators.naturalTypingVariation = variance;
        
        if (this.keystrokeRhythm.length > 20) {
          this.keystrokeRhythm.shift();
        }
      }
    }

    this.lastKeystrokeTime = currentTime;

    // Detect suspicious keystroke patterns
    this.detectSuspiciousKeystrokePatterns(keystrokeData, timeSinceLastKeystroke);

    // Track corrections (backspace usage indicates human behavior)
    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.trackingData.humanBehaviorIndicators.correctionPatterns++;
    }

    // Limit stored data
    if (this.trackingData.keystrokes.length > 500) {
      this.trackingData.keystrokes.shift();
    }
  }

  // Handle key release for dwell time calculation
  handleKeyUp(event) {
    if (!this.isTracking) return;

    const currentTime = Date.now();
    const lastKeystroke = this.trackingData.keystrokes[this.trackingData.keystrokes.length - 1];
    
    if (lastKeystroke && lastKeystroke.key === event.key) {
      lastKeystroke.dwellTime = currentTime - lastKeystroke.timestamp;
    }
  }

  // Handle clicks with detailed analysis
  handleClick(event) {
    if (!this.isTracking) return;

    const currentTime = Date.now();
    const timeSinceLastClick = this.lastClickTime > 0 ? currentTime - this.lastClickTime : 0;

    // Calculate click accuracy (distance from center of target)
    const target = event.target;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceFromCenter = this.calculateDistance(
      { x: event.clientX, y: event.clientY },
      { x: centerX, y: centerY }
    );

    const clickData = {
      timestamp: currentTime,
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      target: event.target.tagName,
      targetId: event.target.id,
      targetClass: event.target.className,
      timeSinceLastClick: timeSinceLastClick,
      accuracy: Math.max(0, 1 - (distanceFromCenter / Math.max(rect.width, rect.height))),
      pressure: event.pressure || 0,
      force: event.force || 0, // For Force Touch devices
    };

    this.trackingData.clicks.push(clickData);
    this.trackingData.sessionMetrics.totalClicks++;
    this.trackingData.sessionMetrics.interactionCount++;

    if (timeSinceLastClick > 0) {
      this.trackingData.timingMetrics.clickIntervals.push(timeSinceLastClick);
    }

    this.lastClickTime = currentTime;

    // Detect rapid clicking (potential bot behavior) - MORE LENIENT
    // Only flag if clicking MUCH faster than humanly possible
    if (timeSinceLastClick > 0 && timeSinceLastClick < 30) { // Changed from 100 to 30ms
      this.trackingData.sessionMetrics.suspiciousPatterns.push({
        type: 'rapid_clicking',
        timestamp: currentTime,
        interval: timeSinceLastClick,
      });
    }

    // REMOVED: Double-click detection - this is NORMAL human behavior!
    // Double-clicks (< 500ms) are legitimate user actions, not suspicious

    // Limit stored data
    if (this.trackingData.clicks.length > 200) {
      this.trackingData.clicks.shift();
    }
  }

  // Handle scroll events with naturalness analysis
  handleScroll(event) {
    if (!this.isTracking) return;

    const currentTime = Date.now();
    const scrollData = {
      timestamp: currentTime,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      deltaX: event.deltaX || 0,
      deltaY: event.deltaY || 0,
      deltaZ: event.deltaZ || 0,
      deltaMode: event.deltaMode || 0,
    };

    this.trackingData.scrollEvents.push(scrollData);
    this.trackingData.sessionMetrics.totalScrolls++;
    this.trackingData.sessionMetrics.interactionCount++;

    // Analyze scroll patterns for naturalness
    this.analyzeScrollPattern(scrollData);

    // Limit stored data
    if (this.trackingData.scrollEvents.length > 100) {
      this.trackingData.scrollEvents.shift();
    }
  }

  // Handle form field focus
  handleFocus(event) {
    if (!this.isTracking) return;
    
    const currentTime = Date.now();
    const fieldId = this.getFieldIdentifier(event.target);
    
    this.currentFocusedField = fieldId;
    this.fieldFocusStartTime = currentTime;

    if (!this.trackingData.formInteractions[fieldId]) {
      this.trackingData.formInteractions[fieldId] = {
        focusCount: 0,
        totalFocusTime: 0,
        inputCount: 0,
        corrections: 0,
        hesitations: 0,
        fieldType: event.target.type || event.target.tagName.toLowerCase(),
        initialValue: event.target.value || '',
      };
    }

    this.trackingData.formInteractions[fieldId].focusCount++;
    this.trackingData.sessionMetrics.interactionCount++;
  }

  // Handle form field blur
  handleBlur(event) {
    if (!this.isTracking || !this.currentFocusedField) return;

    const currentTime = Date.now();
    const fieldId = this.getFieldIdentifier(event.target);
    const focusTime = currentTime - this.fieldFocusStartTime;

    if (this.trackingData.formInteractions[fieldId]) {
      this.trackingData.formInteractions[fieldId].totalFocusTime += focusTime;
      this.trackingData.formInteractions[fieldId].finalValue = event.target.value || '';
      this.trackingData.timingMetrics.formFieldDwellTime[fieldId] = focusTime;
    }

    // Detect hesitation patterns (long focus time with little input)
    const fieldData = this.trackingData.formInteractions[fieldId];
    if (fieldData && focusTime > 5000 && fieldData.inputCount < 3) {
      fieldData.hesitations++;
      this.trackingData.humanBehaviorIndicators.hesitationPatterns++;
    }

    this.currentFocusedField = null;
    this.fieldFocusStartTime = 0;
  }

  // Handle form input
  handleInput(event) {
    if (!this.isTracking) return;

    const fieldId = this.getFieldIdentifier(event.target);
    
    if (!this.trackingData.formInteractions[fieldId]) {
      this.trackingData.formInteractions[fieldId] = {
        focusCount: 0,
        totalFocusTime: 0,
        inputCount: 0,
        corrections: 0,
        hesitations: 0,
        fieldType: event.target.type || event.target.tagName.toLowerCase(),
        initialValue: '',
      };
    }

    this.trackingData.formInteractions[fieldId].inputCount++;
    this.trackingData.sessionMetrics.interactionCount++;

    // Detect corrections and input patterns
    if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
      this.trackingData.formInteractions[fieldId].corrections++;
      this.trackingData.humanBehaviorIndicators.correctionPatterns++;
    }

    // Track form field changes for analysis
    if (!this.trackingData.sessionMetrics.formFieldChanges[fieldId]) {
      this.trackingData.sessionMetrics.formFieldChanges[fieldId] = 0;
    }
    this.trackingData.sessionMetrics.formFieldChanges[fieldId]++;
  }

  // Handle window visibility change
  handleVisibilityChange() {
    if (!this.isTracking) return;

    this.trackingData.windowEvents.push({
      type: 'visibility_change',
      timestamp: Date.now(),
      hidden: document.hidden,
    });

    this.trackingData.sessionMetrics.focusChanges++;
  }

  // Handle window focus
  handleWindowFocus() {
    if (!this.isTracking) return;

    this.trackingData.windowEvents.push({
      type: 'window_focus',
      timestamp: Date.now(),
    });

    this.trackingData.sessionMetrics.focusChanges++;
  }

  // Handle window blur
  handleWindowBlur() {
    if (!this.isTracking) return;

    this.trackingData.windowEvents.push({
      type: 'window_blur',
      timestamp: Date.now(),
    });

    this.trackingData.sessionMetrics.focusChanges++;
  }

  // Handle touch events for mobile
  handleTouchStart(event) {
    if (!this.isTracking) return;

    const touch = event.touches[0];
    const touchData = {
      timestamp: Date.now(),
      x: touch.clientX,
      y: touch.clientY,
      type: 'touch_start',
      target: event.target.tagName,
      pressure: touch.force || 0,
      radiusX: touch.radiusX || 0,
      radiusY: touch.radiusY || 0,
    };

    this.trackingData.touchEvents.push(touchData);
    this.trackingData.sessionMetrics.interactionCount++;
  }

  handleTouchMove(event) {
    if (!this.isTracking) return;

    const touch = event.touches[0];
    const currentTime = Date.now();
    
    const touchData = {
      timestamp: currentTime,
      x: touch.clientX,
      y: touch.clientY,
      type: 'touch_move',
      pressure: touch.force || 0,
      radiusX: touch.radiusX || 0,
      radiusY: touch.radiusY || 0,
    };

    this.trackingData.touchEvents.push(touchData);

    // Limit stored touch data
    if (this.trackingData.touchEvents.length > 200) {
      this.trackingData.touchEvents.shift();
    }
  }

  handleTouchEnd(event) {
    if (!this.isTracking) return;

    this.trackingData.touchEvents.push({
      timestamp: Date.now(),
      type: 'touch_end',
      target: event.target ? event.target.tagName : 'unknown',
    });
  }

  // Handle page unload
  handleBeforeUnload() {
    this.calculateFinalMetrics();
    // Send final data to server before page unloads
    this.sendToServer(true); // Force send with beacon API
  }

  // Utility functions
  calculateDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  getFieldIdentifier(element) {
    return element.id || element.name || element.type || element.tagName.toLowerCase() || 'unknown';
  }

  isSpecialKey(key) {
    const specialKeys = ['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
    return specialKeys.includes(key);
  }

  // Pattern detection methods
  detectUnaturalMousePatterns(mouseData) {
    // Detect perfectly straight lines (bot-like behavior)
    if (this.trackingData.mouseMovements.length > 2) {
      const recent = this.trackingData.mouseMovements.slice(-3);
      const slopes = [];
      
      for (let i = 1; i < recent.length; i++) {
        const dx = recent[i].x - recent[i-1].x;
        const dy = recent[i].y - recent[i-1].y;
        if (dx !== 0) slopes.push(dy / dx);
      }
      
      // If slopes are very similar, it might be a bot
      // Check for perfect line movement - MORE LENIENT
      // Humans can drag in straight lines (scrollbars, sliders, etc.)
      if (slopes.length > 10) { // Only check if many points
        const slopeVariance = this.calculateVariance(slopes);
        if (slopeVariance < 0.001) { // Changed from 0.01 to 0.001 (MUCH stricter)
          this.trackingData.sessionMetrics.suspiciousPatterns.push({
            type: 'perfect_line_movement',
            timestamp: mouseData.timestamp,
            variance: slopeVariance,
          });
        }
      }
    }

    // Detect unnatural velocity consistency - MORE LENIENT
    // Humans CAN move at consistent speeds (dragging, tracking)
    if (this.mouseVelocityHistory.length > 10) {
      const recentVelocities = this.mouseVelocityHistory.slice(-10); // Check more points
      const velocityVariance = this.calculateVariance(recentVelocities);
      if (velocityVariance < 0.01 && recentVelocities.length >= 10 && recentVelocities.every(v => v > 0)) {
        // Changed from 0.1 to 0.01 - only flag EXTREMELY consistent velocity
        this.trackingData.sessionMetrics.suspiciousPatterns.push({
          type: 'consistent_velocity',
          timestamp: mouseData.timestamp,
          variance: velocityVariance,
        });
      }
    }
  }

  detectSuspiciousKeystrokePatterns(keystrokeData, interval) {
    // Detect too-regular typing - MUCH MORE LENIENT
    // Fast typists can have fairly consistent timing
    if (interval > 0) {
      const recentIntervals = this.trackingData.timingMetrics.keystrokeIntervals.slice(-10);
      if (recentIntervals.length >= 10) { // Need more samples
        const variance = this.calculateVariance(recentIntervals);
        if (variance < 2) { // Changed from 10 to 2 - only flag EXTREMELY regular
          this.trackingData.sessionMetrics.suspiciousPatterns.push({
            type: 'too_regular_typing',
            timestamp: keystrokeData.timestamp,
            variance: variance,
          });
        }
      }
    }

    // Detect impossible typing speed - MORE LENIENT
    // Professional typists can be very fast, only flag truly impossible speeds
    if (interval > 0 && interval < 20) { // Keep at 20ms - truly impossible
      this.trackingData.sessionMetrics.suspiciousPatterns.push({
        type: 'impossible_typing_speed',
        timestamp: keystrokeData.timestamp,
        interval: interval,
      });
    }

    // Detect lack of natural pauses
    if (interval > 0 && interval < 50 && !keystrokeData.isSpecialKey) {
      const recentShortIntervals = this.trackingData.timingMetrics.keystrokeIntervals
        .slice(-20)
        .filter(i => i < 100);
      
      if (recentShortIntervals.length > 15) {
        this.trackingData.sessionMetrics.suspiciousPatterns.push({
          type: 'no_natural_pauses',
          timestamp: keystrokeData.timestamp,
          shortIntervalCount: recentShortIntervals.length,
        });
      }
    }
  }

  analyzeScrollPattern(scrollData) {
    // Analyze scroll smoothness and naturalness
    const recentScrolls = this.trackingData.scrollEvents.slice(-5);
    if (recentScrolls.length >= 3) {
      const deltaYValues = recentScrolls.map(s => s.deltaY).filter(d => d !== 0);
      if (deltaYValues.length > 1) {
        const variance = this.calculateVariance(deltaYValues);
        this.trackingData.humanBehaviorIndicators.naturalScrolling = variance;

        // Detect perfectly consistent scrolling - MORE LENIENT
        // Smooth scrolling (mouse wheel, trackpad) can be fairly consistent
        if (variance < 0.1 && deltaYValues.length >= 10 && deltaYValues.every(d => Math.abs(d) > 0)) {
          // Changed from 1 to 0.1 - only flag EXTREMELY consistent scrolling
          this.trackingData.sessionMetrics.suspiciousPatterns.push({
            type: 'consistent_scrolling',
            timestamp: scrollData.timestamp,
            variance: variance,
          });
        }
      }
    }

    // Detect impossible scroll speed - MORE LENIENT
    // Fast scroll wheels and gestures can be very fast, only flag extreme cases
    if (Math.abs(scrollData.deltaY) > 5000) { // Changed from 1000 to 5000px
      this.trackingData.sessionMetrics.suspiciousPatterns.push({
        type: 'impossible_scroll_speed',
        timestamp: scrollData.timestamp,
        deltaY: scrollData.deltaY,
      });
    }
  }

  calculateFinalMetrics() {
    const sessionDuration = Date.now() - this.trackingData.sessionMetrics.startTime;
    
    // Update session duration
    this.trackingData.sessionMetrics.sessionDuration = sessionDuration;

    // Calculate mouse metrics
    if (this.mouseVelocityHistory.length > 0) {
      this.trackingData.sessionMetrics.avgMouseVelocity = 
        this.mouseVelocityHistory.reduce((sum, v) => sum + v, 0) / this.mouseVelocityHistory.length;
      this.trackingData.sessionMetrics.mouseVelocityVariance = 
        this.calculateVariance(this.mouseVelocityHistory);
    }

    // Calculate keystroke rhythm consistency
    if (this.trackingData.timingMetrics.keystrokeIntervals.length > 1) {
      this.trackingData.sessionMetrics.keystrokeVariance = 
        this.calculateVariance(this.trackingData.timingMetrics.keystrokeIntervals);
    }

    // Calculate click timing consistency
    if (this.trackingData.timingMetrics.clickIntervals.length > 1) {
      this.trackingData.sessionMetrics.clickVariance = 
        this.calculateVariance(this.trackingData.timingMetrics.clickIntervals);
    }

    // Calculate hesitation patterns
    this.calculateHesitationPatterns();

    // Calculate overall human-like score
    this.calculateHumanLikeScore();
  }

  calculateHesitationPatterns() {
    const intervals = this.trackingData.timingMetrics.keystrokeIntervals;
    let hesitations = 0;
    
    for (let i = 0; i < intervals.length - 1; i++) {
      // Long pause followed by quick typing (human-like hesitation)
      if (intervals[i] > 2000 && intervals[i + 1] < 200) {
        hesitations++;
      }
    }
    
    this.trackingData.humanBehaviorIndicators.hesitationPatterns = hesitations;
  }

  // Calculate comprehensive human-like behavior score
  calculateHumanLikeScore() {
    let humanScore = 1.0;
    let botScore = 0.0;
    
    // Mouse behavior analysis
    if (this.trackingData.mouseMovements.length > 0) {
      // Lack of mouse jitter (bots move too smoothly)
      if (this.trackingData.humanBehaviorIndicators.mouseJitter < 5) {
        humanScore -= 0.15;
        botScore += 0.15;
      } else {
        humanScore += 0.1;
      }

      // Mouse velocity variance (humans vary their speed)
      const velocityVariance = this.trackingData.sessionMetrics.mouseVelocityVariance || 0;
      if (velocityVariance < 0.1) {
        humanScore -= 0.2;
        botScore += 0.2;
      } else if (velocityVariance > 1.0) {
        humanScore += 0.1;
      }
    }

    // Keystroke behavior analysis
    if (this.trackingData.keystrokes.length > 0) {
      // Too regular typing rhythm
      const keystrokeVariance = this.trackingData.sessionMetrics.keystrokeVariance || 0;
      if (keystrokeVariance < 100) {
        humanScore -= 0.25;
        botScore += 0.25;
      } else if (keystrokeVariance > 500) {
        humanScore += 0.15;
      }

      // Lack of corrections (humans make mistakes)
      if (this.trackingData.humanBehaviorIndicators.correctionPatterns === 0 && 
          this.trackingData.sessionMetrics.totalKeystrokes > 20) {
        humanScore -= 0.2;
        botScore += 0.2;
      } else if (this.trackingData.humanBehaviorIndicators.correctionPatterns > 0) {
        humanScore += 0.1;
      }
    }

    // Form interaction analysis
    const formFields = Object.keys(this.trackingData.formInteractions);
    if (formFields.length > 0) {
      let totalFocusTime = 0;
      let totalInputCount = 0;
      
      formFields.forEach(fieldId => {
        const field = this.trackingData.formInteractions[fieldId];
        totalFocusTime += field.totalFocusTime;
        totalInputCount += field.inputCount;
      });

      // Too fast form completion
      if (totalFocusTime < 5000 && totalInputCount > 10) {
        humanScore -= 0.3;
        botScore += 0.3;
      }

      // Lack of hesitation patterns
      if (this.trackingData.humanBehaviorIndicators.hesitationPatterns === 0 && 
          formFields.length > 2) {
        humanScore -= 0.15;
        botScore += 0.15;
      }
    }

    // Suspicious patterns penalty
    const suspiciousCount = this.trackingData.sessionMetrics.suspiciousPatterns.length;
    const totalActions = this.trackingData.sessionMetrics.totalKeystrokes + 
                        this.trackingData.sessionMetrics.totalClicks + 
                        this.trackingData.sessionMetrics.totalScrolls;
    
    if (totalActions > 0) {
      const suspiciousRatio = suspiciousCount / totalActions;
      humanScore -= suspiciousRatio * 0.5;
      botScore += suspiciousRatio * 0.5;
    }

    // Device and interaction diversity bonus
    if (this.trackingData.sessionMetrics.focusChanges > 0) {
      humanScore += 0.05;
    }

    if (this.trackingData.touchEvents.length > 0) {
      humanScore += 0.05; // Mobile interaction bonus
    }

    // Clamp scores
    humanScore = Math.max(0, Math.min(1, humanScore));
    botScore = Math.max(0, Math.min(1, botScore));

    // Calculate final trust score (weighted towards human score)
    const trustScore = (humanScore * 0.7) + ((1 - botScore) * 0.3);
    
    return Math.max(0, Math.min(1, trustScore));
  }

  // Get processed tracking data for AI analysis
  getTrackingData() {
    return {
      userId: this.userId,
      trackingData: this.trackingData,
      processed: {
        totalSessionTime: Date.now() - this.trackingData.sessionMetrics.startTime,
        mouseToKeyboardRatio: this.trackingData.sessionMetrics.totalMouseDistance / 
                              Math.max(this.trackingData.sessionMetrics.totalKeystrokes, 1),
        clickToMoveRatio: this.trackingData.sessionMetrics.totalClicks / 
                         Math.max(this.trackingData.mouseMovements.length, 1),
        formCompletionEfficiency: this.calculateFormEfficiency(),
        suspiciousScore: this.calculateSuspiciousScore(),
        humanLikeScore: this.calculateHumanLikeScore(),
        behaviorConsistency: this.calculateBehaviorConsistency(),
        interactionDiversity: this.calculateInteractionDiversity(),
      }
    };
  }

  calculateFormEfficiency() {
    let totalEfficiency = 0;
    let fieldCount = 0;
    
    Object.values(this.trackingData.formInteractions).forEach(field => {
      if (field.inputCount > 0) {
        const efficiency = field.inputCount / Math.max(field.corrections + 1, 1);
        totalEfficiency += efficiency;
        fieldCount++;
      }
    });
    
    return fieldCount > 0 ? totalEfficiency / fieldCount : 0;
  }

  calculateSuspiciousScore() {
    const suspiciousPatterns = this.trackingData.sessionMetrics.suspiciousPatterns.length;
    const totalActions = this.trackingData.sessionMetrics.totalKeystrokes + 
                        this.trackingData.sessionMetrics.totalClicks + 
                        this.trackingData.sessionMetrics.totalScrolls;
    
    return totalActions > 0 ? suspiciousPatterns / totalActions : 0;
  }

  calculateBehaviorConsistency() {
    let consistencyScore = 0;
    let factors = 0;

    // Mouse velocity consistency
    if (this.mouseVelocityHistory.length > 5) {
      const variance = this.calculateVariance(this.mouseVelocityHistory);
      consistencyScore += Math.min(1, variance / 100); // Normalize
      factors++;
    }

    // Keystroke timing consistency
    if (this.trackingData.timingMetrics.keystrokeIntervals.length > 5) {
      const variance = this.calculateVariance(this.trackingData.timingMetrics.keystrokeIntervals);
      consistencyScore += Math.min(1, variance / 1000); // Normalize
      factors++;
    }

    return factors > 0 ? consistencyScore / factors : 0;
  }

  calculateInteractionDiversity() {
    let diversity = 0;
    
    if (this.trackingData.mouseMovements.length > 0) diversity++;
    if (this.trackingData.keystrokes.length > 0) diversity++;
    if (this.trackingData.clicks.length > 0) diversity++;
    if (this.trackingData.scrollEvents.length > 0) diversity++;
    if (this.trackingData.touchEvents.length > 0) diversity++;
    if (Object.keys(this.trackingData.formInteractions).length > 0) diversity++;
    
    return diversity / 6; // Normalize to 0-1
  }

  // Send data to server for AI analysis
  async sendToServer(isBeforeUnload = false) {
    console.log('🔥🔥🔥 [BEHAVIOR TRACKER] sendToServer called with isBeforeUnload:', isBeforeUnload);
    console.log('🔥 [BEHAVIOR TRACKER] User ID:', this.userId);
    console.log('🔥 [BEHAVIOR TRACKER] Timestamp:', new Date().toISOString());

    try {
      // Guard: Don't send if not enough interaction data
      const interactionCount = this.trackingData?.sessionMetrics?.interactionCount || 0;
      const suspiciousPatterns = this.trackingData?.sessionMetrics?.suspiciousPatterns?.length || 0;

      console.log('🔥 [BEHAVIOR TRACKER] Current interaction count:', interactionCount);
      console.log('🔥 [BEHAVIOR TRACKER] Suspicious patterns detected:', suspiciousPatterns);

      if (interactionCount < 5) {
        console.log('⚠️ Not enough interaction data to send (need 5+, have', interactionCount + ')');
        return {
          success: false,
          error: 'Insufficient interaction data',
          message: 'Please interact with the page first (move mouse, type, etc.)'
        };
      }

      // Auto-cleanup data if it's getting too large
      this.autoCleanupData();

      const data = this.getTrackingData();
      console.log('📊 Raw tracking data:', {
        hasTrackingData: !!data.trackingData,
        hasProcessed: !!data.processed,
        mouseCount: data.trackingData?.mouseMovements?.length || 0,
        keystrokeCount: data.trackingData?.keystrokes?.length || 0,
        dataStructure: Object.keys(data)
      });

      const payload = {
        userId: this.userId,
        behaviorData: data,
        timestamp: Date.now(),
      };

      // Log payload structure for debugging
      console.log('📦 Payload structure:', {
        userId: payload.userId,
        hasData: !!payload.behaviorData,
        dataKeys: Object.keys(payload.behaviorData || {}),
        timestamp: payload.timestamp
      });

      // Check payload size and optimize if needed
      const payloadStr = JSON.stringify(payload);
      const payloadSize = new Blob([payloadStr]).size;
      const maxBeaconSize = 50 * 1024; // Reduced to 50KB for safety

      console.log(`📊 Original payload size: ${payloadSize} bytes`);

      let optimizedPayload = payload;

      if (payloadSize > maxBeaconSize) {
        console.warn(`Payload size (${payloadSize} bytes) exceeds limit. Optimizing...`);
        optimizedPayload = this.optimizePayload(payload);

        const optimizedSize = new Blob([JSON.stringify(optimizedPayload)]).size;
        console.log(`📊 Optimized payload size: ${optimizedSize} bytes`);

        if (optimizedSize > maxBeaconSize) {
          console.warn(`Optimized payload still too large (${optimizedSize} bytes). Using minimal payload.`);
          optimizedPayload = this.createMinimalPayload();

          const minimalSize = new Blob([JSON.stringify(optimizedPayload)]).size;
          console.log(`📊 Minimal payload size: ${minimalSize} bytes`);

          if (minimalSize > maxBeaconSize) {
            console.error(`Even minimal payload too large (${minimalSize} bytes). Resetting data.`);
            this.resetData();
            return { success: false, error: 'Payload too large, data reset' };
          }
        }
      }

      if (isBeforeUnload && navigator.sendBeacon) {
        // Use sendBeacon for reliable sending during page unload
        const blob = new Blob([JSON.stringify(optimizedPayload)], { type: 'application/json' });
        const finalSize = blob.size;

        if (finalSize > maxBeaconSize) {
          console.error(`Optimized payload still too large (${finalSize} bytes). Using minimal payload.`);
          const minimalPayload = this.createMinimalPayload();
          const minimalBlob = new Blob([JSON.stringify(minimalPayload)], { type: 'application/json' });
          const sent = navigator.sendBeacon('/api/behavior/track', minimalBlob);
          // sendBeacon returns boolean, not response object
          return {
            success: sent,
            method: 'beacon',
            message: sent ? 'Data sent via beacon' : 'Beacon send failed'
          };
        }

        const sent = navigator.sendBeacon('/api/behavior/track', blob);
        // sendBeacon returns boolean, not response object
        return {
          success: sent,
          method: 'beacon',
          message: sent ? 'Data sent via beacon' : 'Beacon send failed'
        };
      } else {
        console.log('🔥 [BEHAVIOR TRACKER] Making fetch request to /api/behavior/track');
        console.log('🔥 [BEHAVIOR TRACKER] Payload summary:', {
          userId: optimizedPayload.userId,
          mouseMovements: optimizedPayload.behaviorData?.trackingData?.mouseMovements?.length || 0,
          keystrokes: optimizedPayload.behaviorData?.trackingData?.keystrokes?.length || 0,
          formInteractions: Object.keys(optimizedPayload.behaviorData?.trackingData?.formInteractions || {}).length,
          suspiciousPatterns: optimizedPayload.behaviorData?.trackingData?.sessionMetrics?.suspiciousPatterns?.length || 0,
        });

        const response = await fetch('/api/behavior/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(optimizedPayload)
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Server response error:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Behavior data sent successfully:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ Error sending behavior data:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        details: error.stack
      };
    }
  }

  // Start periodic tracking data transmission
  startPeriodicTracking(intervalMs = 30000) {
    if (this.periodicTrackingInterval) {
      clearInterval(this.periodicTrackingInterval);
    }

    this.periodicTrackingInterval = setInterval(() => {
      this.sendToServer();
    }, intervalMs);

    return this.periodicTrackingInterval;
  }

  // Stop periodic tracking
  stopPeriodicTracking() {
    if (this.periodicTrackingInterval) {
      clearInterval(this.periodicTrackingInterval);
      this.periodicTrackingInterval = null;
    }
  }

  // Legacy compatibility methods
  updateGameData(gameMetrics) {
    // For backward compatibility with existing game tracking
    if (!this.trackingData.gameData) {
      this.trackingData.gameData = {};
    }
    this.trackingData.gameData = { ...this.trackingData.gameData, ...gameMetrics };
  }

  generateMetrics() {
    // Legacy method for backward compatibility
    return this.getTrackingData();
  }

  // Optimize payload to reduce size
  optimizePayload(payload) {
    const optimized = { ...payload };
    const data = { ...payload.behaviorData };

    // Drastically reduce array sizes using correct property names
    if (data.trackingData?.mouseMovements && data.trackingData.mouseMovements.length > 20) {
      // Keep only every 5th mouse event to reduce size dramatically
      data.trackingData.mouseMovements = data.trackingData.mouseMovements.filter((_, index) => index % 5 === 0).slice(-20);
    }
    
    if (data.trackingData?.keystrokes && data.trackingData.keystrokes.length > 10) {
      data.trackingData.keystrokes = data.trackingData.keystrokes.slice(-10);
    }
    
    if (data.trackingData?.clicks && data.trackingData.clicks.length > 10) {
      data.trackingData.clicks = data.trackingData.clicks.slice(-10);
    }

    if (data.trackingData?.scrollEvents && data.trackingData.scrollEvents.length > 10) {
      data.trackingData.scrollEvents = data.trackingData.scrollEvents.slice(-10);
    }

    if (data.trackingData?.touchEvents && data.trackingData.touchEvents.length > 10) {
      data.trackingData.touchEvents = data.trackingData.touchEvents.slice(-10);
    }

    // Remove unnecessary fields and round values
    if (data.trackingData) {
      ['mouseMovements', 'keystrokes', 'clicks', 'scrollEvents', 'touchEvents'].forEach(category => {
        if (data.trackingData[category]) {
          data.trackingData[category] = data.trackingData[category].map(item => {
            const optimizedItem = { ...item };
            // Round timestamps to reduce precision
            if (optimizedItem.timestamp) {
              optimizedItem.timestamp = Math.round(optimizedItem.timestamp / 1000) * 1000;
            }
            // Remove verbose properties
            delete optimizedItem.element;
            delete optimizedItem.target;
            delete optimizedItem.detail;
            return optimizedItem;
          });
        }
      });
    }

    optimized.behaviorData = data;
    return optimized;
  }

  // Create minimal payload for extreme size constraints
  createMinimalPayload() {
    const data = this.getTrackingData();
    
    // Ultra-minimal payload - just essential metrics
    return {
      userId: this.userId,
      behaviorData: {
        mouseCount: data.trackingData?.mouseMovements?.length || 0,
        keystrokeCount: data.trackingData?.keystrokes?.length || 0,
        timeSpent: Math.round(((Date.now() - (data.trackingData?.sessionMetrics?.startTime || Date.now())) / 1000)), // Convert to seconds
        clickCount: data.trackingData?.clicks?.length || 0,
        suspiciousCount: data.trackingData?.sessionMetrics?.suspiciousPatterns?.length || 0,
        patterns: {
          velocity: data.processed?.mouseVelocity || 0,
          rhythm: data.processed?.keystrokeRhythm || 0
        }
      },
      timestamp: Date.now(),
      compressed: true
    };
  }

  // Add missing resetData method
  resetData() {
    this.trackingData = {
      mouseMovements: [],
      keystrokes: [],
      clicks: [],
      scrollEvents: [],
      formInteractions: {},
      windowEvents: [],
      touchEvents: [],
      sessionMetrics: {
        startTime: Date.now(),
        totalMouseDistance: 0,
        totalKeystrokes: 0,
        totalClicks: 0,
        totalScrolls: 0,
        formFieldFocusTime: {},
        formFieldChanges: {},
        suspiciousPatterns: [],
        interactionCount: 0,
        focusChanges: 0,
      },
      timingMetrics: {
        keystrokeIntervals: [],
        clickIntervals: [],
        mouseVelocities: [],
        scrollVelocities: [],
        pauseDurations: [],
        reactionTimes: []
      }
    };
    console.log('🔄 Behavior tracking data reset');
  }

  // Auto-cleanup data to prevent memory issues
  autoCleanupData() {
    const maxEvents = 50; // Maximum events per category
    
    if (this.trackingData.mouseMovements && this.trackingData.mouseMovements.length > maxEvents) {
      this.trackingData.mouseMovements = this.trackingData.mouseMovements.slice(-maxEvents);
    }
    
    if (this.trackingData.keystrokes && this.trackingData.keystrokes.length > maxEvents) {
      this.trackingData.keystrokes = this.trackingData.keystrokes.slice(-maxEvents);
    }
    
    if (this.trackingData.clicks && this.trackingData.clicks.length > maxEvents) {
      this.trackingData.clicks = this.trackingData.clicks.slice(-maxEvents);
    }
    
    if (this.trackingData.scrollEvents && this.trackingData.scrollEvents.length > maxEvents) {
      this.trackingData.scrollEvents = this.trackingData.scrollEvents.slice(-maxEvents);
    }
    
    if (this.trackingData.touchEvents && this.trackingData.touchEvents.length > maxEvents) {
      this.trackingData.touchEvents = this.trackingData.touchEvents.slice(-maxEvents);
    }
    
    if (this.trackingData.sessionMetrics.suspiciousPatterns && this.trackingData.sessionMetrics.suspiciousPatterns.length > 20) {
      this.trackingData.sessionMetrics.suspiciousPatterns = this.trackingData.sessionMetrics.suspiciousPatterns.slice(-20);
    }
  }
}

// Utility functions and exports
export function initializeBehaviorTracking(userId) {
  return new BehaviorTracker(userId);
}

export async function sendGameScore(userId, gameMetrics) {
  try {
    const response = await fetch('/api/behavior/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        behaviorData: { gameData: gameMetrics }
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending game score:', error);
    return null;
  }
}

// Export a singleton instance for easy use
export const behaviorTracker = {
  instance: null,
  
  init(userId) {
    if (!this.instance) {
      this.instance = new BehaviorTracker(userId);
    }
    return this.instance;
  },
  
  getInstance() {
    return this.instance;
  }
};