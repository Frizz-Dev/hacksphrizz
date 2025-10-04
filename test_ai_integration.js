#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAIIntegration() {
  console.log('🚀 Testing AI Integration...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing AI Server Health...');
  try {
    const healthResponse = await fetch('http://localhost:5001/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ AI Server Health:', healthData);
    } else {
      console.log('❌ AI Server Health Check Failed');
      return;
    }
  } catch (error) {
    console.log('❌ AI Server is not responding:', error.message);
    return;
  }

  // Test 2: Human-like Behavior
  console.log('\n2️⃣ Testing Human-like Behavior Detection...');
  const humanBehavior = {
    user_id: `test_human_${Date.now()}`,
    behaviorData: {
      session_duration: 45000,
      clicks: 12,
      keystrokes: 85,
      mouse_movements: 150,
      scroll_events: 8,
      form_interactions: 6,
      time_on_page: 45000,
      tab_switches: 2,
      copy_paste_events: 1,
      right_click_events: 0,
      form_completion_time: 42000,
      typing_patterns: {
        avg_interval: 180,
        variance: 45
      },
      click_patterns: {
        frequency: 3750,
        accuracy: 0.95
      },
      mouse_velocity: 300,
      scroll_behavior: {
        frequency: 8,
        smoothness: 0.85
      }
    }
  };

  try {
    const humanResponse = await fetch('http://localhost:5001/predict-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(humanBehavior)
    });

    if (humanResponse.ok) {
      const humanResult = await humanResponse.json();
      console.log('✅ Human Behavior Result:', humanResult);
    } else {
      console.log('❌ Human Behavior Test Failed');
    }
  } catch (error) {
    console.log('❌ Human Behavior Test Error:', error.message);
  }

  // Test 3: Bot-like Behavior
  console.log('\n3️⃣ Testing Bot-like Behavior Detection...');
  const botBehavior = {
    user_id: `test_bot_${Date.now()}`,
    behaviorData: {
      session_duration: 2000,
      clicks: 50,
      keystrokes: 200,
      mouse_movements: 500,
      scroll_events: 20,
      form_interactions: 15,
      time_on_page: 2000,
      tab_switches: 0,
      copy_paste_events: 10,
      right_click_events: 0,
      form_completion_time: 1500,
      typing_patterns: {
        avg_interval: 10,
        variance: 2
      },
      click_patterns: {
        frequency: 40,
        accuracy: 1.0
      },
      mouse_velocity: 1000,
      scroll_behavior: {
        frequency: 20,
        smoothness: 1.0
      }
    }
  };

  try {
    const botResponse = await fetch('http://localhost:5001/predict-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(botBehavior)
    });

    if (botResponse.ok) {
      const botResult = await botResponse.json();
      console.log('✅ Bot Behavior Result:', botResult);
    } else {
      console.log('❌ Bot Behavior Test Failed');
    }
  } catch (error) {
    console.log('❌ Bot Behavior Test Error:', error.message);
  }

  // Test 4: Next.js App Health
  console.log('\n4️⃣ Testing Next.js App...');
  try {
    const appResponse = await fetch('http://localhost:3003');
    if (appResponse.ok) {
      console.log('✅ Next.js App is running on http://localhost:3003');
    } else {
      console.log('❌ Next.js App Health Check Failed');
    }
  } catch (error) {
    console.log('❌ Next.js App is not responding:', error.message);
  }

  console.log('\n🎯 Integration Test Complete!');
  console.log('\n📋 Summary:');
  console.log('- AI Server: http://localhost:5001');
  console.log('- Next.js App: http://localhost:3003');
  console.log('- AI Model: RandomForest with 62 features');
  console.log('- Integration: Real-time behavior analysis in checkout form');
}

// Run the test
if (require.main === module) {
  testAIIntegration().catch(console.error);
}

module.exports = { testAIIntegration };