"""
Model Testing Script
Tests the trained Isolation Forest model with both bot and human data
to evaluate its performance.
"""

import os
import pandas as pd
import numpy as np
import joblib
import json

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'isolation_forest_model.joblib')
SCALER_PATH = os.path.join(SCRIPT_DIR, 'scaler.joblib')
METADATA_PATH = os.path.join(SCRIPT_DIR, 'model_metadata.json')
HUMAN_DATA_PATH = os.path.join(SCRIPT_DIR, 'human_train_data.csv')
BOT_DATA_PATH = os.path.join(SCRIPT_DIR, 'bot_train_data.csv')


def load_model_artifacts():
    """Load trained model, scaler, and metadata"""
    print("Loading model artifacts...\n")

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    with open(METADATA_PATH, 'r') as f:
        metadata = json.load(f)

    print(f"Model type: {metadata['model_type']}")
    print(f"Features: {len(metadata['feature_columns'])}")
    print(f"Contamination: {metadata['contamination']}")
    print(f"Estimators: {metadata['n_estimators']}\n")

    return model, scaler, metadata


def predict_and_evaluate(model, scaler, X, label, feature_columns):
    """Make predictions and calculate statistics"""

    # Ensure correct column order
    X = X[feature_columns]

    # Scale features
    X_scaled = scaler.transform(X)

    # Get anomaly scores
    anomaly_scores = model.score_samples(X_scaled)

    # Convert anomaly scores to trust scores using sigmoid transformation
    # Maps to 0-1 range (higher = more trustworthy)
    trust_scores = 1 / (1 + np.exp(-anomaly_scores * 10))

    # Apply threshold: > 0.5 = human, <= 0.5 = bot
    predictions = np.where(trust_scores > 0.5, 1, -1)

    # Calculate statistics
    suspicious_count = (predictions == -1).sum()
    normal_count = (predictions == 1).sum()

    return predictions, anomaly_scores, trust_scores, suspicious_count, normal_count


def test_model():
    """Test the model on both human and bot data"""
    print("\n" + "="*60)
    print("   Isolation Forest Model Testing")
    print("="*60 + "\n")

    # Load model
    model, scaler, metadata = load_model_artifacts()
    feature_columns = metadata['feature_columns']

    # Load test data
    print("Loading test data...\n")
    human_df = pd.read_csv(HUMAN_DATA_PATH)
    bot_df = pd.read_csv(BOT_DATA_PATH)

    print(f"Human samples: {len(human_df)}")
    print(f"Bot samples: {len(bot_df)}\n")

    # Test on HUMAN data (should be mostly NORMAL)
    print("="*60)
    print("TESTING ON HUMAN DATA (Expected: Mostly NORMAL)")
    print("="*60)

    human_pred, human_scores, human_trust, human_suspicious, human_normal = predict_and_evaluate(
        model, scaler, human_df, "Human", feature_columns
    )

    print(f"\nResults:")
    print(f"   Normal (trust > 0.5): {human_normal} ({human_normal/len(human_df)*100:.1f}%)")
    print(f"   Suspicious (trust <= 0.5): {human_suspicious} ({human_suspicious/len(human_df)*100:.1f}%)")
    print(f"   Average trust score: {human_trust.mean():.3f}")
    print(f"   Average anomaly score: {human_scores.mean():.4f}")

    # Show sample human predictions
    print(f"\nSample human predictions:")
    for i in range(min(3, len(human_df))):
        status = "HUMAN" if human_pred[i] == 1 else "BOT"
        print(f"   Sample {i+1}: {status} | Trust: {human_trust[i]:.3f} | Anomaly: {human_scores[i]:.4f}")
        print(f"      Session: {human_df.iloc[i]['session_time_ms']}ms, Clicks: {human_df.iloc[i]['total_clicks']}")

    # Test on BOT data (should be mostly SUSPICIOUS)
    print("\n" + "="*60)
    print("TESTING ON BOT DATA (Expected: Mostly SUSPICIOUS)")
    print("="*60)

    bot_pred, bot_scores, bot_trust, bot_suspicious, bot_normal = predict_and_evaluate(
        model, scaler, bot_df, "Bot", feature_columns
    )

    print(f"\nResults:")
    print(f"   Normal (trust > 0.5): {bot_normal} ({bot_normal/len(bot_df)*100:.1f}%)")
    print(f"   Suspicious (trust <= 0.5): {bot_suspicious} ({bot_suspicious/len(bot_df)*100:.1f}%)")
    print(f"   Average trust score: {bot_trust.mean():.3f}")
    print(f"   Average anomaly score: {bot_scores.mean():.4f}")

    # Show sample bot predictions
    print(f"\nSample bot predictions:")
    for i in range(min(3, len(bot_df))):
        status = "HUMAN" if bot_pred[i] == 1 else "BOT"
        print(f"   Sample {i+1}: {status} | Trust: {bot_trust[i]:.3f} | Anomaly: {bot_scores[i]:.4f}")
        print(f"      Session: {bot_df.iloc[i]['session_time_ms']}ms, Clicks: {bot_df.iloc[i]['total_clicks']}")

    # Overall performance
    print("\n" + "="*60)
    print("OVERALL MODEL PERFORMANCE")
    print("="*60)

    # Calculate accuracy-like metrics
    # For human data: we want HIGH normal rate (low false positive rate)
    # For bot data: we want HIGH suspicious rate (low false negative rate)

    human_correct = human_normal  # Correctly identified as normal
    bot_correct = bot_suspicious   # Correctly identified as suspicious
    total_samples = len(human_df) + len(bot_df)
    total_correct = human_correct + bot_correct

    accuracy = (total_correct / total_samples) * 100

    print(f"\nHuman correctly classified (Normal): {human_correct}/{len(human_df)} ({human_correct/len(human_df)*100:.1f}%)")
    print(f"Bot correctly classified (Suspicious): {bot_correct}/{len(bot_df)} ({bot_correct/len(bot_df)*100:.1f}%)")
    print(f"\nOverall Accuracy: {accuracy:.1f}%")

    # Performance interpretation
    print("\n" + "="*60)
    print("INTERPRETATION")
    print("="*60)

    if accuracy >= 90:
        print("EXCELLENT: Model performs very well!")
    elif accuracy >= 80:
        print("GOOD: Model performs well, some misclassifications")
    elif accuracy >= 70:
        print("FAIR: Model needs improvement")
    else:
        print("POOR: Model needs retraining with more/better data")

    print(f"\nNotes:")
    print(f"   - Human false positive rate: {human_suspicious/len(human_df)*100:.1f}% (humans flagged as bots)")
    print(f"   - Bot false negative rate: {bot_normal/len(bot_df)*100:.1f}% (bots not detected)")

    if human_suspicious/len(human_df) > 0.2:
        print(f"\nWarning: High false positive rate! {human_suspicious/len(human_df)*100:.1f}% of humans flagged as suspicious.")
        print(f"   Consider adjusting contamination parameter or collecting more diverse human data.")

    if bot_normal/len(bot_df) > 0.2:
        print(f"\nWarning: High false negative rate! {bot_normal/len(bot_df)*100:.1f}% of bots not detected.")
        print(f"   Consider collecting more diverse bot data or adjusting model parameters.")

    print("\n" + "="*60)
    print("MODEL TESTING COMPLETED!")
    print("="*60)


if __name__ == "__main__":
    test_model()
