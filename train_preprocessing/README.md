# Training Data Collection Scripts

## Purpose
Automated scripts to collect behavioral training data for the Isolation Forest trust score model.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create a test account:**
   - Go to `http://localhost:3000/register`
   - Create account with:
     - Email: `bot@test.com`
     - Password: `testpassword123`
   - Or update credentials in `collection_scripts.py`

3. **Make sure your Next.js app is running:**
   ```bash
   npm run dev
   ```

## Important Notes

- The script uses **undetected-chromedriver** to bypass bot detection
- You'll need to **login manually once** when the script starts
- After login, the script will automatically run 30 sessions
- The browser will remain visible so you can monitor progress

## Usage

### Collect Bot-Like Data (Suspicious Behavior)
```bash
python collection_scripts.py
```

This script will:
- Login as test user
- Fill forms **instantly** with no typing delays
- Select seats with **no hesitation**
- Skip through pages **immediately**
- Complete 30 sessions to generate bot-like training data

### Bot Behavior Characteristics
The script simulates suspicious behavior:
- ✅ **Instant form filling** (no keystroke delays)
- ✅ **No seat hover/hesitation** (immediate clicks)
- ✅ **Very fast session completion**
- ✅ **No mouse movement entropy** (direct clicks)
- ✅ **Minimal field corrections**
- ✅ **Low total clicks** (efficient navigation)

## Collecting Human Data

To collect legitimate human data:
1. Manually go through the form yourself
2. Fill it naturally with normal typing speed
3. Hover over seats before selecting
4. Read options before clicking
5. Complete 20-30 sessions

## Data Verification

After running the script, check your data:

```sql
-- View collected data
SELECT * FROM public.raw_train_data
ORDER BY created_at DESC
LIMIT 30;

-- Check bot vs human patterns
SELECT
  AVG(session_time_ms) as avg_session_time,
  AVG(seat_hesitation_time_ms) as avg_hesitation,
  AVG(ktp_avg_keystroke_interval_ms) as avg_typing_speed,
  AVG(total_clicks) as avg_clicks
FROM public.raw_train_data;
```

## Expected Bot Data Patterns
- `session_time_ms`: < 10,000 (very fast)
- `seat_hesitation_time_ms`: 0-500 (minimal hesitation)
- `ktp_avg_keystroke_interval_ms`: 0-50 (instant typing)
- `field_edit_count`: 0-2 (few corrections)
- `total_clicks`: 4-8 (minimal clicks)
- `mouse_smoothness`: < 0.2 (linear movements)

## Training the Isolation Forest Model

After preparing `human_train_data.csv` and `bot_train_data.csv`:

### 1. Install ML dependencies
```bash
pip install -r requirements.txt
```

### 2. Prepare your CSV files
Ensure you have these files in `train_preprocessing/`:
- `human_train_data.csv` - Human behavior data
- `bot_train_data.csv` - Bot behavior data

Both files should contain these columns:
- session_time_ms
- seat_hesitation_time_ms
- ktp_avg_keystroke_interval_ms
- ktp_keystroke_variance
- ktp_total_entry_time_ms
- ktp_paste_detected
- field_edit_count
- mouse_total_distance
- mouse_smoothness
- total_clicks

### 3. Train the model
```bash
cd train_preprocessing
python train_model.py
```

This script will:
- ✅ Load data from both CSV files
- ✅ Merge bot and human data automatically
- ✅ Drop unnecessary fields (`id`, `user_id`, `created_at`, `is_suspicious`)
- ✅ Preprocess and standardize features
- ✅ Train Isolation Forest model (unsupervised)
- ✅ Save model artifacts:
  - `isolation_forest_model.joblib` - trained model
  - `scaler.joblib` - feature scaler
  - `model_metadata.json` - model configuration

### 4. Model outputs
The script will show:
- Number of samples processed
- Training statistics
- Anomaly detection results
- Sample predictions for verification

## Workflow Summary

1. **Prepare CSV files**: `human_train_data.csv` and `bot_train_data.csv`
2. **Train model**: `python train_model.py`
3. **Deploy model**: Use generated `.joblib` files in your API
