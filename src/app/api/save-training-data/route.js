import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, ...behaviorData } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'Missing user_id' }, { status: 400 });
    }

    // Insert training data into database
    const { data, error } = await supabase
      .from('raw_train_data')
      .insert({
        user_id: user_id,
        session_time_ms: behaviorData.session_time_ms || 0,
        seat_hesitation_time_ms: behaviorData.seat_hesitation_time_ms || 0,
        ktp_avg_keystroke_interval_ms: behaviorData.ktp_avg_keystroke_interval_ms || null,
        ktp_keystroke_variance: behaviorData.ktp_keystroke_variance || null,
        ktp_total_entry_time_ms: behaviorData.ktp_total_entry_time_ms || null,
        ktp_paste_detected: behaviorData.ktp_paste_detected || 0,
        field_edit_count: behaviorData.field_edit_count || 0,
        mouse_total_distance: behaviorData.mouse_total_distance || null,
        mouse_smoothness: behaviorData.mouse_smoothness || null,
        total_clicks: behaviorData.total_clicks || 0,
      })
      .select();

    if (error) {
      console.error('Error saving training data:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error in save-training-data API:', err);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
