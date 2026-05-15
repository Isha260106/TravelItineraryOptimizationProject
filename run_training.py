from pathlib import Path
from types import SimpleNamespace
import json
import joblib
import pandas as pd

import train_caa_tios_nd as engine

CSV_PATH = Path("Flattened_Travel_Dataset.csv")
MODEL_PATH = Path("server/models/caa_tios_nd_model.joblib")
REPORT_PATH = Path("server/models/training_report.json")

MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

print(f"Training using dataset: {CSV_PATH.resolve()}")

train_args = SimpleNamespace(
    csv=str(CSV_PATH),
    model_out=str(MODEL_PATH),
    report_out=str(REPORT_PATH),
)

engine.train(train_args)

print(f"Model saved to: {MODEL_PATH.resolve()}")
print(f"Report saved to: {REPORT_PATH.resolve()}")

report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
print("Training Metrics Summary:")
for model_name, metrics in report["metrics"].items():
    print(f"\n--- {model_name} ---")
    for k, v in metrics.items():
        if k != "classes":
            print(f"  {k}: {v:.4f}")

# Test inference
artifact = joblib.load(MODEL_PATH)
mumbai_trip = {
    "city": "Mumbai",
    "days": 2,
    "locations": [
        {"name": "Gateway of India", "mandatory": True},
        {"name": "Marine Drive", "mandatory": False},
        {"name": "Juhu Beach", "mandatory": True},
        {"name": "Siddhivinayak Temple", "mandatory": False},
    ],
}
mumbai_result = engine.predict_itinerary(mumbai_trip, artifact)
print("\nSample Prediction (Mumbai):")
print(json.dumps(mumbai_result, indent=2))
