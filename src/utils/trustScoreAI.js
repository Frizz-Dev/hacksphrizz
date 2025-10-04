/**
 * BALANCED Trust Score Calculator - Human-Friendly Bot Detection
 * VERSION: 3.1.0-BALANCED
 * 
 * This version balances human friendliness with bot detection:
 * - More generous to humans (60-95% range)
 * - Still detects obvious bots (0-30% range)
 * - Reasonable captcha threshold (45%)
 */

console.log('🔧 trustScoreAI.js VERSION 3.1.0-BALANCED loaded');

export async function calculateTrustScore(behaviorData) {
  try {
    if (!behaviorData || !behaviorData.trackingData) {
      return {
        success: true,
        trustScore: 0.4, // BALANCED: Higher base for missing data
        confidence: 0.8,
        trustLevel: 'low',
        needsCaptcha: true,
        reasons: ['No behavior data - verification needed'],
        analysis: {},
        metadata: { dataQuality: 0 }
      };
    }

    const { trackingData } = behaviorData;
    
    let humanFactors = 0;
    let botFactors = 0;
    let totalFactors = 0;
    let reasons = [];
    let confidence = 0;
    let analysis = {};

    // 1. Mouse Movement Analysis (30% weight) - BALANCED
    try {
      const mouseScore = analyzeMouseBehaviorBalanced(trackingData.mouseMovements || []);
      humanFactors += mouseScore.humanScore * 0.30;
      botFactors += mouseScore.botScore * 0.30;
      totalFactors += 0.30;
      reasons.push(...(mouseScore.reasons || []));
      confidence += mouseScore.confidence * 0.30;
      analysis.mouse = mouseScore.humanScore;
    } catch (error) {
      console.warn('Mouse analysis failed:', error);
      botFactors += 0.15; // Reduced penalty for failed analysis
      analysis.mouse = 0.3;
    }

    // 2. Keystroke Analysis (30% weight) - BALANCED
    try {
      const keystrokeScore = analyzeKeystrokeBehaviorBalanced(trackingData.keystrokes || []);
      humanFactors += keystrokeScore.humanScore * 0.30;
      botFactors += keystrokeScore.botScore * 0.30;
      totalFactors += 0.30;
      reasons.push(...(keystrokeScore.reasons || []));
      confidence += keystrokeScore.confidence * 0.30;
      analysis.keystroke = keystrokeScore.humanScore;
    } catch (error) {
      console.warn('Keystroke analysis failed:', error);
      botFactors += 0.10; // Reduced penalty
      analysis.keystroke = 0.4;
    }

    // 3. Form Interaction Analysis (25% weight) - BALANCED
    try {
      const formScore = analyzeFormInteractionsBalanced(trackingData.formInteractions || []);
      humanFactors += formScore.humanScore * 0.25;
      botFactors += formScore.botScore * 0.25;
      totalFactors += 0.25;
      reasons.push(...(formScore.reasons || []));
      confidence += formScore.confidence * 0.25;
      analysis.form = formScore.humanScore;
    } catch (error) {
      console.warn('Form analysis failed:', error);
      humanFactors += 0.15; // Benefit of doubt for form issues
      analysis.form = 0.6;
    }

    // 4. Session Analysis (15% weight) - BALANCED
    try {
      const sessionScore = analyzeSessionMetricsBalanced(trackingData.sessionMetrics || {});
      humanFactors += sessionScore.humanScore * 0.15;
      botFactors += sessionScore.botScore * 0.15;
      totalFactors += 0.15;
      reasons.push(...(sessionScore.reasons || []));
      confidence += sessionScore.confidence * 0.15;
      analysis.session = sessionScore.humanScore;
    } catch (error) {
      console.warn('Session analysis failed:', error);
      humanFactors += 0.10; // Benefit of doubt
      analysis.session = 0.7;
    }

    // BALANCED calculation with human-friendly baseline
    const rawScore = Math.max(0.5, humanFactors); // Start at 50% minimum
    const penaltyScore = Math.min(0.6, botFactors); // Cap penalties at 60%
    
    // Apply penalties more gently
    let finalScore = rawScore - (penaltyScore * 0.7); // Reduce penalty impact
    finalScore = Math.max(0, Math.min(1, finalScore));

    console.log('🔍 BALANCED Trust Score Calculation:');
    console.log('  - Human Factors:', humanFactors.toFixed(3));
    console.log('  - Bot Factors (penalty):', botFactors.toFixed(3));
    console.log('  - Raw Score:', rawScore.toFixed(3));
    console.log('  - Penalty Score:', penaltyScore.toFixed(3));
    console.log('  - Final Score (after penalty):', finalScore.toFixed(3));

    // BALANCED: More forgiving for incomplete data
    if (totalFactors < 0.8) {
      finalScore *= 0.85; // Lighter penalty for incomplete data
      console.log('  - Score after incomplete data penalty:', finalScore.toFixed(3));
    }

    // Human-friendly boost for normal behavior
    if (finalScore > 0.4 && botFactors < 0.4) {
      finalScore += 0.15; // Boost for likely humans
      finalScore = Math.min(0.95, finalScore); // Cap at 95%
      console.log('  - Score after human boost:', finalScore.toFixed(3));
    }

    // BALANCED trust levels and captcha
    const trustLevel = getBalancedTrustLevel(finalScore);
    const needsCaptcha = finalScore <= 0.45; // More generous threshold

    console.log('  - Final Trust Score:', finalScore.toFixed(3), '(' + (finalScore * 100).toFixed(1) + '%)');
    console.log('  - Trust Level:', trustLevel);
    console.log('  - Needs Captcha:', needsCaptcha, '(threshold: 0.45)');

    return {
      success: true,
      trustScore: finalScore,
      confidence: Math.min(1, Math.max(0.4, confidence)),
      trustLevel,
      needsCaptcha,
      reasons: reasons.slice(0, 5),
      analysis,
      metadata: {
        humanFactors,
        botFactors,
        rawScore,
        penaltyScore,
        dataQuality: totalFactors,
        sessionDuration: trackingData.sessionMetrics?.totalSessionTime || 0,
        totalInteractions: trackingData.sessionMetrics?.interactionCount || 0,
        suspiciousPatterns: trackingData.sessionMetrics?.suspiciousPatterns?.length || 0
      }
    };

  } catch (error) {
    console.error('Trust score calculation failed:', error);
    return {
      success: false,
      trustScore: 0.3, // BALANCED: Higher trust on errors
      confidence: 0.9,
      trustLevel: 'low',
      needsCaptcha: true,
      reasons: ['Analysis failed - verification needed'],
      analysis: {},
      metadata: { error: error.message }
    };
  }
}

function analyzeMouseBehaviorBalanced(mouseMovements) {
  if (!mouseMovements || mouseMovements.length < 5) {
    return {
      humanScore: 0.6, // BALANCED: Higher score for minimal data
      botScore: 0.2,
      confidence: 0.6,
      reasons: ['Limited mouse data - acceptable']
    };
  }

  let humanScore = 0.7; // Start human-friendly
  let botScore = 0;
  let reasons = [];

  // Calculate intervals between movements
  const intervals = [];
  for (let i = 1; i < mouseMovements.length; i++) {
    const interval = mouseMovements[i].timestamp - mouseMovements[i-1].timestamp;
    intervals.push(interval);
  }

  if (intervals.length > 3) {
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const intervalVariance = calculateVariance(intervals);
    
    // BALANCED: Only flag extreme bot behavior
    if (avgInterval < 5) { // Less than 5ms = definitely bot
      botScore += 0.8;
      reasons.push('Inhuman mouse speed detected');
    } else if (avgInterval < 25) { // Less than 25ms = suspicious
      botScore += 0.4;
      reasons.push('Very fast mouse movement');
    } else if (avgInterval > 50 && avgInterval < 500) { // Wide human range
      humanScore += 0.2;
      reasons.push('Human-like mouse timing');
    }

    // BALANCED: More tolerance for consistency
    if (intervalVariance < 5) { // Extremely low variance = bot
      botScore += 0.6;
      reasons.push('Too consistent mouse timing');
    } else if (intervalVariance > 20) { // More tolerance for variance
      humanScore += 0.1;
      reasons.push('Natural mouse variance');
    }
  }

  // Check for linear movement patterns - more tolerant
  if (mouseMovements.length > 8) {
    let linearCount = 0;
    for (let i = 2; i < mouseMovements.length; i++) {
      const prev = mouseMovements[i-1];
      const curr = mouseMovements[i];
      const prevPrev = mouseMovements[i-2];
      
      // Check if movement is extremely linear
      const dx1 = prev.x - prevPrev.x;
      const dy1 = prev.y - prevPrev.y;
      const dx2 = curr.x - prev.x;
      const dy2 = curr.y - prev.y;
      
      if (Math.abs(dx1 - dx2) < 1 && Math.abs(dy1 - dy2) < 1) {
        linearCount++;
      }
    }
    
    const linearRatio = linearCount / (mouseMovements.length - 2);
    if (linearRatio > 0.8) { // Only flag very linear = bot
      botScore += 0.3;
      reasons.push('Too linear mouse movement');
    } else {
      humanScore += 0.1;
      reasons.push('Natural mouse curves');
    }
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    confidence: 0.8,
    reasons
  };
}

function analyzeKeystrokeBehaviorBalanced(keystrokes) {
  if (!keystrokes || keystrokes.length < 3) {
    return {
      humanScore: 0.6, // BALANCED: Higher score for minimal typing
      botScore: 0.1,
      confidence: 0.6,
      reasons: ['Limited keystroke data - acceptable']
    };
  }

  let humanScore = 0.7;
  let botScore = 0;
  let reasons = [];

  // Calculate typing intervals
  const intervals = [];
  for (let i = 1; i < keystrokes.length; i++) {
    const interval = keystrokes[i].timestamp - keystrokes[i-1].timestamp;
    intervals.push(interval);
  }

  if (intervals.length > 2) {
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const intervalVariance = calculateVariance(intervals);

    // BALANCED: Only flag extreme typing speeds
    if (avgInterval < 20) { // Less than 20ms = bot
      botScore += 0.6;
      reasons.push('Inhuman typing speed');
    } else if (avgInterval > 100 && avgInterval < 800) { // Wide human range
      humanScore += 0.2;
      reasons.push('Human-like typing rhythm');
    }

    // BALANCED: More tolerance for consistent typing
    if (intervalVariance < 10 && intervals.length > 5) { // Very consistent = suspicious
      botScore += 0.3;
      reasons.push('Too consistent typing rhythm');
    } else if (intervalVariance > 50) {
      humanScore += 0.1;
      reasons.push('Natural typing variance');
    }
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    confidence: 0.7,
    reasons
  };
}

function analyzeFormInteractionsBalanced(formInteractions) {
  if (!formInteractions || formInteractions.length === 0) {
    return {
      humanScore: 0.5, // Neutral for no form data
      botScore: 0.1,
      confidence: 0.5,
      reasons: ['No form interaction data']
    };
  }

  let humanScore = 0.7;
  let botScore = 0;
  let reasons = [];

  // Analyze form filling patterns
  const focusEvents = formInteractions.filter(f => f.type === 'focus').length;
  const changeEvents = formInteractions.filter(f => f.type === 'change').length;

  if (focusEvents > 0 && changeEvents > 0) {
    humanScore += 0.2;
    reasons.push('Normal form interaction pattern');
  }

  // Check for rapid form filling (only extreme cases)
  const formDuration = formInteractions.length > 1 ? 
    formInteractions[formInteractions.length - 1].timestamp - formInteractions[0].timestamp : 1000;

  if (formDuration < 500 && changeEvents > 3) { // Very fast form filling
    botScore += 0.4;
    reasons.push('Extremely rapid form completion');
  } else if (formDuration > 2000) { // Normal human speed
    humanScore += 0.1;
    reasons.push('Reasonable form completion time');
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    confidence: 0.7,
    reasons
  };
}

function analyzeSessionMetricsBalanced(sessionMetrics) {
  let humanScore = 0.7;
  let botScore = 0;
  let reasons = [];

  const interactionRate = sessionMetrics.interactionCount / Math.max(1, sessionMetrics.totalSessionTime / 1000);

  // BALANCED: Only flag extreme interaction rates
  if (interactionRate > 20) { // More than 20 interactions per second = bot
    botScore += 0.6;
    reasons.push('Inhuman interaction rate');
  } else if (interactionRate > 10) { // More than 10 per second = suspicious
    botScore += 0.3;
    reasons.push('High interaction rate');
  } else if (interactionRate > 0.5 && interactionRate < 8) { // Normal range
    humanScore += 0.2;
    reasons.push('Normal interaction rate');
  } else if (interactionRate < 0.1) { // Very low activity
    botScore += 0.2;
    reasons.push('Unusually low activity');
  }

  // Check session duration - more tolerant
  if (sessionMetrics.totalSessionTime < 1000) { // Less than 1 second
    botScore += 0.3;
    reasons.push('Extremely short session');
  } else if (sessionMetrics.totalSessionTime > 3000) { // More than 3 seconds is good
    humanScore += 0.1;
    reasons.push('Reasonable session duration');
  }

  return {
    humanScore: Math.min(1, humanScore),
    botScore: Math.min(1, botScore),
    confidence: 0.8,
    reasons
  };
}

function getBalancedTrustLevel(score) {
  if (score >= 0.75) return 'high';
  if (score >= 0.60) return 'medium_high';
  if (score >= 0.45) return 'medium';
  if (score >= 0.30) return 'low';
  if (score >= 0.15) return 'very_low';
  return 'bot_suspected';
}

function calculateVariance(numbers) {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  return variance;
}