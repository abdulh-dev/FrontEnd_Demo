from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error
import pandas as pd

# Load dataset
df = pd.read_csv("SPY_daily.csv")

# Adjust column names if needed (check case sensitivity)
print("Columns:", df.columns)

# Use correct column names (lowercase/uppercase might differ)
features = df[["open", "high", "low"]]  # adjust if needed
target = df["close"]

# Train model
model = LinearRegression().fit(features, target)
preds = model.predict(features)

# Compute metrics
r2 = r2_score(target, preds)
mae = mean_absolute_error(target, preds)

print(f"R² Score: {r2:.3f}")
print(f"MAE: {mae:.3f}")

# Create the text summary
ml_summary = f"""
✅ Trained Linear Regression predicting Close from Open/High/Low  
📈 R² Score: {r2:.3f}  
📉 MAE: {mae:.3f}  
"""

print("\nGenerated summary:")
print(ml_summary)
