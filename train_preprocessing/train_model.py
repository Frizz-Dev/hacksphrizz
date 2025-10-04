"""
Isolation Forest Model Training Script
Loads data from CSV files, preprocesses it, and trains an Isolation Forest model
for detecting suspicious booking behavior.

Requirements:
    pip install scikit-learn pandas numpy joblib
"""

import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import json

# Model configuration
CONTAMINATION = 0.1  # Expected proportion of outliers (10%)
RANDOM_STATE = 42

# CSV file paths (relative to script location)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HUMAN_DATA_PATH = os.path.join(SCRIPT_DIR, 'human_train_data.csv')
BOT_DATA_PATH = os.path.join(SCRIPT_DIR, 'bot_train_data.csv')

# Feature columns (exclude id, user_id, created_at, is_suspicious)
FEATURE_COLUMNS = [
    'session_time_ms',
    'seat_hesitation_time_ms',
    'ktp_avg_keystroke_interval_ms',
    'ktp_keystroke_variance',
    'ktp_total_entry_time_ms',
    'ktp_paste_detected',
    'field_edit_count',
    'mouse_total_distance',
    'mouse_smoothness',
    'total_clicks'
]


def load_training_data():
    """Load and merge training data from CSV files"""
    print("📥 Loading training data from CSV files...")

    # Check if files exist
    if not os.path.exists(HUMAN_DATA_PATH):
        print(f"❌ Error: {HUMAN_DATA_PATH} not found!")
        return None

    if not os.path.exists(BOT_DATA_PATH):
        print(f"❌ Error: {BOT_DATA_PATH} not found!")
        return None

    # Load CSV files
    human_df = pd.read_csv(HUMAN_DATA_PATH)
    bot_df = pd.read_csv(BOT_DATA_PATH)

    print(f"✅ Loaded {len(human_df)} human samples from {HUMAN_DATA_PATH}")
    print(f"✅ Loaded {len(bot_df)} bot samples from {BOT_DATA_PATH}")

    # Merge datasets
    df = pd.concat([human_df, bot_df], ignore_index=True)

    print(f"✅ Merged dataset: {len(df)} total samples")

    return df


def preprocess_data(df):
    """Preprocess the training data"""
    print("\n🔧 Preprocessing data...")

    # Drop unnecessary columns
    columns_to_drop = ['id', 'user_id', 'created_at', 'is_suspicious']
    df_clean = df.drop(columns=[col for col in columns_to_drop if col in df.columns], errors='ignore')

    print(f"📊 Columns after dropping metadata: {list(df_clean.columns)}")

    # Ensure all feature columns exist
    missing_cols = [col for col in FEATURE_COLUMNS if col not in df_clean.columns]
    if missing_cols:
        print(f"⚠️  Warning: Missing columns: {missing_cols}")

    # Select only feature columns
    df_features = df_clean[FEATURE_COLUMNS].copy()

    # Handle missing values (fill with median)
    if df_features.isnull().any().any():
        print("⚠️  Found missing values, filling with median...")
        df_features = df_features.fillna(df_features.median())

    # Handle inf values
    df_features = df_features.replace([np.inf, -np.inf], np.nan)
    df_features = df_features.fillna(df_features.median())

    print(f"✅ Preprocessed {len(df_features)} samples with {len(FEATURE_COLUMNS)} features")
    print(f"\nFeature statistics:")
    print(df_features.describe())

    return df_features


def train_isolation_forest(X):
    """Train Isolation Forest model"""
    print(f"\n🤖 Training Isolation Forest model...")
    print(f"   Contamination: {CONTAMINATION}")
    print(f"   Random State: {RANDOM_STATE}")

    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print("✅ Features standardized")

    # Train Isolation Forest
    model = IsolationForest(
        contamination=CONTAMINATION,
        random_state=RANDOM_STATE,
        n_estimators=100,
        max_samples='auto',
        verbose=1
    )

    model.fit(X_scaled)

    print("✅ Model training completed!")

    # Get predictions on training data for analysis
    predictions = model.predict(X_scaled)
    scores = model.score_samples(X_scaled)

    # Convert predictions: -1 (anomaly) to 1, 1 (normal) to 0
    anomalies = (predictions == -1).sum()
    normal = (predictions == 1).sum()

    print(f"\n📈 Training Results:")
    print(f"   Normal samples: {normal} ({normal/len(predictions)*100:.2f}%)")
    print(f"   Anomalies detected: {anomalies} ({anomalies/len(predictions)*100:.2f}%)")
    print(f"   Average anomaly score: {scores.mean():.4f}")
    print(f"   Score std dev: {scores.std():.4f}")

    return model, scaler, scores


def save_model(model, scaler, feature_columns):
    """Save model, scaler, and metadata"""
    print("\n💾 Saving model artifacts...")

    # Save model
    model_path = os.path.join(SCRIPT_DIR, 'isolation_forest_model.joblib')
    joblib.dump(model, model_path)
    print(f"✅ Model saved to: {model_path}")

    # Save scaler
    scaler_path = os.path.join(SCRIPT_DIR, 'scaler.joblib')
    joblib.dump(scaler, scaler_path)
    print(f"✅ Scaler saved to: {scaler_path}")

    # Save metadata
    metadata = {
        'feature_columns': feature_columns,
        'contamination': CONTAMINATION,
        'random_state': RANDOM_STATE,
        'model_type': 'IsolationForest',
        'n_estimators': 100
    }

    metadata_path = os.path.join(SCRIPT_DIR, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ Metadata saved to: {metadata_path}")

    print("\n🎉 All artifacts saved successfully!")


def test_model(model, scaler, X):
    """Test the model with sample data"""
    print("\n🧪 Testing model with sample predictions...")

    # Get a few samples
    X_scaled = scaler.transform(X)

    # Predict on first 5 samples
    for i in range(min(5, len(X))):
        sample = X_scaled[i:i+1]
        prediction = model.predict(sample)[0]
        score = model.score_samples(sample)[0]

        status = "🔴 SUSPICIOUS" if prediction == -1 else "🟢 NORMAL"
        print(f"\nSample {i+1}: {status}")
        print(f"  Anomaly score: {score:.4f}")
        print(f"  Session time: {X.iloc[i]['session_time_ms']}ms")
        print(f"  Total clicks: {X.iloc[i]['total_clicks']}")
        print(f"  Seat hesitation: {X.iloc[i]['seat_hesitation_time_ms']}ms")


def main():
    """Main execution function"""
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║   Isolation Forest Model Training                         ║
    ║   Purpose: Detect suspicious booking behavior             ║
    ║   Data Source: CSV files (human + bot data)               ║
    ╚═══════════════════════════════════════════════════════════╝
    """)

    # Step 1: Load data from CSV
    df = load_training_data()
    if df is None:
        return

    # Step 2: Preprocess data
    X = preprocess_data(df)

    if len(X) < 10:
        print(f"\n❌ Error: Not enough training data ({len(X)} samples)")
        print("   Recommendation: Collect at least 30 samples (mix of bot and human data)")
        return

    # Step 3: Train model
    model, scaler, scores = train_isolation_forest(X)

    # Step 4: Save model
    save_model(model, scaler, FEATURE_COLUMNS)

    # Step 5: Test model
    test_model(model, scaler, X)

    print("\n" + "="*60)
    print("✅ MODEL TRAINING COMPLETED SUCCESSFULLY!")
    print("="*60)
    print("\nNext steps:")
    print("1. Review the model performance above")
    print("2. Use the model in your API: /api/calculate-trust")
    print("3. Load model with: joblib.load('isolation_forest_model.joblib')")
    print("4. Load scaler with: joblib.load('scaler.joblib')")


if __name__ == "__main__":
    main()
