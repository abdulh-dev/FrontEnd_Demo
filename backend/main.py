# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import base64
# import pandas as pd

# # Load dataset
# df = pd.read_csv("SPY_daily.csv")

# app = FastAPI()

# # Allow frontend calls
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class ChatRequest(BaseModel):
#     message: str

# # --- Fake precomputed responses ---
# describe_table = df.describe().to_html(classes="table table-striped")

# # Just a fake ML summary text
# ml_summary = """

# ✅ Trained Linear Regression predicting Close from Open/High/Low
# 📈 R² Score: 1.000
# 📉 MAE: 0.581
# """

# # Preload fake images as base64
# def load_image_as_base64(path):
#     with open(path, "rb") as f:
#         return base64.b64encode(f.read()).decode("utf-8")

# # You’ll need to generate these beforehand (just any placeholder PNG)
# corr_img_b64 = load_image_as_base64("fake_corr.png")
# line_img_b64 = load_image_as_base64("fake_line.png")

# @app.post("/chat")
# def chat(req: ChatRequest):
#     msg = req.message.lower()

#     if "describe" in msg:
#         return {
#             "type": "table",
#             "content": describe_table
#         }

#     elif "correlation" in msg:
#         return {
#             "type": "image",
#             "content": corr_img_b64,
#             "caption": "📊 Correlation matrix"
#         }

#     elif "close price" in msg or "line graph" in msg:
#         return {
#             "type": "image",
#             "content": line_img_b64,
#             "caption": "📈 Close price over time"
#         }

#     elif "train model" in msg or "ml model" in msg:
#         return {
#             "type": "text",
#             "content": ml_summary
#         }

#     else:
#         return {
#             "type": "text",
#             "content": "🤔 I only understand: 'describe dataset', 'show correlation matrix', 'plot close price over time', 'train model'."
#         }
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import pandas as pd

# Load dataset
df = pd.read_csv("SPY_daily.csv")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

# --- Precomputed, but explained based on content ---

describe_stats = df.describe()
describe_table = describe_stats.to_html(classes="table table-striped")

# Auto-generate explanation from describe()
def get_describe_explanation(stats_df: pd.DataFrame) -> str:
    rows = []
    for col in stats_df.columns:
        mean = stats_df.at['mean', col]
        std = stats_df.at['std', col]
        min_val = stats_df.at['min', col]
        max_val = stats_df.at['max', col]
        range_val = max_val - min_val
        rows.append(f"<li><b>{col}</b>: mean = {mean:.2f}, std = {std:.2f}, range = {range_val:.2f}</li>")
    
    return f"""
    <br><br>
    <div style="color:#ccc;font-size:0.9rem">
    📊 <b>Column Summary:</b><br>
    <ul>
        {"".join(rows)}
    </ul>
    These values give you an overview of each column’s central tendency (mean), spread (std), and variability (range).
    </div>
    """

# Prebuilt explanation for ML model
ml_summary = """
✅ Trained Linear Regression predicting Close from Open/High/Low  
📈 R² Score: 1.000  
📉 MAE: 0.581  

---

🔍 **Analysis:**  
This model attempts to predict the closing price of SPY based on the opening, highest, and lowest prices of the day.

- **R² = 1.000** → Indicates a perfect fit (likely unrealistic and just for demo)  
- **MAE = 0.581** → On average, predictions are off by $0.58  

This kind of model could be used for intraday trend prediction, but real-world accuracy would vary.
"""

# Preload fake images
def load_image_as_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

corr_img_b64 = load_image_as_base64("fake_corr.png")
line_img_b64 = load_image_as_base64("fake_line.png")

@app.post("/chat")
def chat(req: ChatRequest):
    msg = req.message.lower()

    if "describe" in msg:
        explanation = get_describe_explanation(describe_stats)
        return {
            "type": "table",
            "content": describe_table + explanation
        }

    elif "correlation" in msg:
        return {
            "type": "image",
            "content": corr_img_b64,
            "caption": "📊 Correlation matrix — This shows the strength of linear relationships between variables. A value close to 1 or -1 means strong correlation."
        }

    elif "close price" in msg or "line graph" in msg:
        return {
            "type": "image",
            "content": line_img_b64,
            "caption": "📈 Close price over time — This visual shows how SPY's closing price fluctuated daily, helping identify long-term trends and volatility."
        }

    elif "train model" in msg or "ml model" in msg:
        return {
            "type": "text",
            "content": ml_summary
        }

    else:
        return {
            "type": "text",
            "content": "🤔 I only understand: 'describe dataset', 'show correlation matrix', 'plot close price over time', 'train model'."
        }
