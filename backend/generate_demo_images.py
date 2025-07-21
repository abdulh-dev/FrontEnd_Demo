import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Load dataset
df = pd.read_csv("SPY_daily.csv")

# Ensure we have correct columns
print("Columns in dataset:", df.columns)

# ---- Correlation Matrix ----
plt.figure(figsize=(6, 4))
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap="coolwarm")
plt.title("Correlation Matrix")
plt.tight_layout()
plt.savefig("fake_corr.png", dpi=150)
plt.close()

# ---- Line chart of Close price over time ----
plt.figure(figsize=(8, 4))
plt.plot(pd.to_datetime(df["timestamp"]), df["close"], color="blue")
plt.title("SPY Close Price Over Time")
plt.xlabel("timestamp")
plt.ylabel("Close Price")
plt.grid(True)
plt.tight_layout()
plt.savefig("fake_line.png", dpi=150)
plt.close()

print("✅ Generated fake_corr.png and fake_line.png!")
