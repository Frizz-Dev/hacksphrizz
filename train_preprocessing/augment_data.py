import pandas as pd
import numpy as np
import uuid
from datetime import datetime, timedelta
import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Read the CSV file
df = pd.read_csv(os.path.join(script_dir, 'raw_train_data_rows.csv'))

# Calculate statistics for numerical columns (excluding id, user_id, created_at, is_suspicious)
numerical_cols = [
    'session_time_ms', 'seat_hesitation_time_ms', 'ktp_avg_keystroke_interval_ms',
    'ktp_keystroke_variance', 'ktp_total_entry_time_ms', 'ktp_paste_detected',
    'field_edit_count', 'mouse_total_distance', 'mouse_smoothness', 'total_clicks'
]

# Calculate mean and std for augmentation
stats = {}
for col in numerical_cols:
    stats[col] = {
        'mean': df[col].mean(),
        'std': df[col].std(),
        'min': df[col].min(),
        'max': df[col].max()
    }

# Function to augment a single row
def augment_row(row, variation_factor=0.15):
    new_row = row.copy()

    # Generate new IDs
    new_row['id'] = str(uuid.uuid4())

    # Keep the same user_id or vary it occasionally
    if np.random.random() < 0.3:  # 30% chance to use different user_id
        new_row['user_id'] = str(uuid.uuid4())

    # Augment numerical fields with slight variations
    for col in numerical_cols:
        if col == 'ktp_paste_detected':
            # Binary field - occasionally flip
            if np.random.random() < 0.1:
                new_row[col] = 1 - row[col]
        elif col == 'total_clicks':
            # Ensure total_clicks >= 6
            variation = np.random.normal(0, stats[col]['std'] * variation_factor)
            new_value = max(6, int(row[col] + variation))
            new_row[col] = new_value
        else:
            # Add random variation based on the column's standard deviation
            variation = np.random.normal(0, stats[col]['std'] * variation_factor)
            new_value = row[col] + variation

            # Ensure non-negative values
            if new_value < 0:
                new_value = abs(new_value) * 0.5

            # Round integers
            if col in ['field_edit_count', 'ktp_paste_detected', 'ktp_total_entry_time_ms',
                      'seat_hesitation_time_ms', 'session_time_ms']:
                new_value = int(new_value)

            new_row[col] = new_value

    # Update timestamp to a recent time with slight variation
    base_time = datetime.now()
    time_offset = np.random.randint(-7, 1)  # Random time in last 7 days
    hour_offset = np.random.randint(0, 24)
    minute_offset = np.random.randint(0, 60)
    new_timestamp = base_time + timedelta(days=time_offset, hours=hour_offset, minutes=minute_offset)
    new_row['created_at'] = new_timestamp.strftime('%Y-%m-%d %H:%M:%S.%f+00')

    return new_row

# Generate augmented data
current_count = len(df)
target_count = 150
rows_to_generate = target_count - current_count

augmented_rows = []

for i in range(rows_to_generate):
    # Randomly select a row from the original dataset
    source_row = df.iloc[np.random.randint(0, len(df))]

    # Augment it with varying levels of variation
    variation_factor = np.random.uniform(0.1, 0.2)
    augmented_row = augment_row(source_row, variation_factor)
    augmented_rows.append(augmented_row)

# Combine original and augmented data
augmented_df = pd.DataFrame(augmented_rows)
final_df = pd.concat([df, augmented_df], ignore_index=True)

# Verify total_clicks constraint
assert (final_df['total_clicks'] >= 6).all(), "Some rows have total_clicks < 6"

# Save to new CSV file
output_file = os.path.join(script_dir, 'augmented_train_data.csv')
final_df.to_csv(output_file, index=False)

print(f"Data augmentation complete!")
print(f"Original entries: {current_count}")
print(f"Augmented entries: {len(augmented_rows)}")
print(f"Total entries: {len(final_df)}")
print(f"Output saved to: {output_file}")
print(f"\nVerification:")
print(f"- Minimum total_clicks: {final_df['total_clicks'].min()}")
print(f"- All total_clicks >= 6: {(final_df['total_clicks'] >= 6).all()}")
