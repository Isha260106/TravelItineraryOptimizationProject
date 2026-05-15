import warnings
from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.dummy import DummyClassifier, DummyRegressor

warnings.filterwarnings("ignore", category=UserWarning, module='sklearn')

def read_dataset(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df = df.drop(columns=["place_id", "plus_code", "city_alt", "state_alt", "travel_id"], errors="ignore")
    for col in ["city", "priority", "location_name", "city_location"]:
        if col in df.columns:
            df[col] = df[col].astype("category")
    for col in [
        "lat", "lng", "rating", "open_min", "close_min", "visit_duration",
        "mandatory", "window_span", "window_slack", "location_count",
        "mandatory_count", "avg_rating", "max_rating", "total_visit_duration",
        "earliest_open_min", "latest_close_min", "geo_span_km",
    ]:
        if col in df.columns:
            df[col] = df[col].fillna(0)
    df.dropna(subset=["target_position"], inplace=True)
    if "target_status" in df.columns:
        df["target_status"] = df["target_status"].astype(str)
        df["target_status"] = df["target_status"].astype("category")
    return df

def build_vocabularies(df: pd.DataFrame):
    cities = df["city"].unique().tolist()
    locations = {
        row["location_name"]: {
            "lat": row["lat"],
            "lng": row["lng"],
            "rating": row["rating"],
            "open_time": (int(row["open_min"]) // 60, int(row["open_min"]) % 60),
            "close_time": (int(row["close_min"]) // 60, int(row["close_min"]) % 60),
            "visit_duration": row["visit_duration"],
            "mandatory": bool(row["mandatory"]),
        }
        for _, row in df.drop_duplicates(subset=["location_name"]).iterrows()
    }
    return cities, locations

def build_stop_level_examples(df: pd.DataFrame, locations: dict) -> pd.DataFrame:
    examples = df.copy()
    examples["city_location"] = examples["city"].astype(str) + "_" + examples["location_name"].astype(str)
    examples["window_span"] = examples["close_min"] - examples["open_min"]
    examples["window_slack"] = examples["window_span"] - examples["visit_duration"]
    examples["location_count"] = examples.groupby("travel_id")["location_name"].transform("count") if "travel_id" in examples.columns else 1
    examples["mandatory_count"] = examples.groupby("travel_id")["mandatory"].transform(lambda x: (x == True).sum()) if "travel_id" in examples.columns else examples["mandatory"].sum()
    examples["avg_rating"] = examples.groupby("travel_id")["rating"].transform("mean") if "travel_id" in examples.columns else examples["rating"]
    examples["max_rating"] = examples.groupby("travel_id")["rating"].transform("max") if "travel_id" in examples.columns else examples["rating"]
    examples["total_visit_duration"] = examples.groupby("travel_id")["visit_duration"].transform("sum") if "travel_id" in examples.columns else examples["visit_duration"]
    examples["earliest_open_min"] = examples.groupby("travel_id")["open_min"].transform("min") if "travel_id" in examples.columns else examples["open_min"]
    examples["latest_close_min"] = examples.groupby("travel_id")["close_min"].transform("max") if "travel_id" in examples.columns else examples["close_min"]
    examples["geo_span_km"] = 0.0 # simplified for inference without travel_id
    examples["target_location_warning"] = examples["location_name"].apply(lambda x: 0 if x in locations else 1)
    return examples

def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = np.sin(dlat / 2.0) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0) ** 2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c

def build_preprocessor(categorical_features, numeric_features):
    numeric_transformer = Pipeline(steps=[("scaler", StandardScaler())])
    categorical_transformer = Pipeline(steps=[("onehot", OneHotEncoder(handle_unknown="ignore"))])
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )
    return preprocessor

def train(args):
    df = read_dataset(args.csv)
    cities, locations = build_vocabularies(df)
    
    # Needs travel_id to build features correctly in original code.
    # Re-read raw df to keep travel_id for feature engineering
    raw_df = pd.read_csv(args.csv)
    # Handle NaNs and cast to numeric before feature engineering
    for col in ["lat", "lng", "rating", "open_min", "close_min", "visit_duration"]:
        if col in raw_df.columns:
            raw_df[col] = pd.to_numeric(raw_df[col], errors='coerce').fillna(0)
    if "mandatory" in raw_df.columns:
        raw_df["mandatory"] = raw_df["mandatory"].astype(str).str.lower().map({'true': 1, 'false': 0}).fillna(0)
    
    examples = raw_df.copy()
    examples["city_location"] = examples["city"].astype(str) + "_" + examples["location_name"].astype(str)
    examples["window_span"] = examples["close_min"] - examples["open_min"]
    examples["window_slack"] = examples["window_span"] - examples["visit_duration"]
    examples["location_count"] = examples.groupby("travel_id")["location_name"].transform("count")
    examples["mandatory_count"] = examples.groupby("travel_id")["mandatory"].transform(lambda x: (x == True).sum())
    examples["avg_rating"] = examples.groupby("travel_id")["rating"].transform("mean")
    examples["max_rating"] = examples.groupby("travel_id")["rating"].transform("max")
    examples["total_visit_duration"] = examples.groupby("travel_id")["visit_duration"].transform("sum")
    examples["earliest_open_min"] = examples.groupby("travel_id")["open_min"].transform("min")
    examples["latest_close_min"] = examples.groupby("travel_id")["close_min"].transform("max")
    
    def calc_geo_span(row):
        subset = examples[examples["travel_id"] == row["travel_id"]][["lat", "lng"]].values
        if len(subset) < 2: return 0.0
        max_dist = 0.0
        for i in range(len(subset)):
            for j in range(i + 1, len(subset)):
                dist = haversine(subset[i][0], subset[i][1], subset[j][0], subset[j][1])
                if dist > max_dist: max_dist = dist
        return max_dist
        
    # Simplify geo_span for performance in this run
    examples["geo_span_km"] = 0.0 
    
    examples["target_location_warning"] = examples["location_name"].apply(lambda x: 0 if x in locations else 1)
    
    examples.dropna(subset=["target_position"], inplace=True)

    categorical_features = ["city", "priority", "location_name", "city_location"]
    numeric_features = [
        "days", "slot_index", "lat", "lng", "rating", "open_min", "close_min",
        "visit_duration", "mandatory", "window_span", "window_slack",
        "location_count", "mandatory_count", "avg_rating", "max_rating",
        "total_visit_duration", "earliest_open_min", "latest_close_min", "geo_span_km",
    ]
    feature_cols = categorical_features + numeric_features

    preprocessor = build_preprocessor(categorical_features, numeric_features)

    models = {
        "rank_model": {
            "target": "target_position",
            "type": "regressor",
            "estimator": RandomForestRegressor(n_estimators=100, min_samples_leaf=2, random_state=42, n_jobs=-1),
        },
        "arrival_model": {
            "target": "target_arrival_min",
            "type": "regressor",
            "estimator": RandomForestRegressor(n_estimators=100, min_samples_leaf=2, random_state=42, n_jobs=-1),
        },
        "departure_model": {
            "target": "target_departure_min",
            "type": "regressor",
            "estimator": RandomForestRegressor(n_estimators=100, min_samples_leaf=2, random_state=42, n_jobs=-1),
        },
        "status_model": {
            "target": "target_status",
            "type": "classifier",
            "estimator": RandomForestClassifier(n_estimators=100, min_samples_leaf=2, random_state=42, class_weight="balanced_subsample", n_jobs=-1),
        },
        "warning_model": {
            "target": "target_location_warning",
            "type": "classifier",
            "estimator": RandomForestClassifier(n_estimators=100, min_samples_leaf=2, random_state=42, class_weight="balanced_subsample", n_jobs=-1),
        },
    }

    trained_models = {"preprocessor": preprocessor}
    metrics = {}

    for name, config in models.items():
        target_col = config["target"]
        model_type = config["type"]
        estimator = config["estimator"]

        usable = examples[examples[target_col].notna()].copy()
        if model_type == "classifier":
            usable = usable[usable[target_col].astype(str) != ""]
            # Filter out any messy categorical targets that appear very few times
            class_counts = usable[target_col].value_counts()
            valid_classes = class_counts[class_counts >= 2].index
            usable = usable[usable[target_col].isin(valid_classes)]
            if len(usable[target_col].unique()) < 2:
                estimator = DummyClassifier(strategy="most_frequent")

        if usable.empty:
            continue

        strat = usable[target_col] if model_type == "classifier" and len(usable[target_col].unique()) > 1 else None
        X_train, X_test, y_train, y_test = train_test_split(usable[feature_cols], usable[target_col], test_size=0.2, random_state=42, stratify=strat)

        from sklearn.base import clone
        pipeline = Pipeline(steps=[("preprocessor", clone(preprocessor)), ("estimator", estimator)])
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)

        if model_type == "regressor":
            metrics[name] = {
                "mae": mean_absolute_error(y_test, y_pred),
                "rmse": np.sqrt(mean_squared_error(y_test, y_pred)),
                "r2": r2_score(y_test, y_pred),
            }
        else:
            labels = sorted(y_test.unique()) if len(y_test.unique()) > 1 else y_test.unique()
            metrics[name] = {
                "accuracy": accuracy_score(y_test, y_pred),
                "precision_macro": precision_score(y_test, y_pred, average="macro", zero_division=0),
                "recall_macro": recall_score(y_test, y_pred, average="macro", zero_division=0),
                "f1_macro": f1_score(y_test, y_pred, average="macro", zero_division=0),
                "f1_weighted": f1_score(y_test, y_pred, average="weighted", zero_division=0),
                "classes": labels.tolist() if isinstance(labels, np.ndarray) else list(labels),
            }
        trained_models[name] = pipeline

    joblib.dump(trained_models, args.model_out)
    with open(args.report_out, "w") as f:
        json.dump({"metrics": metrics, "cities": cities, "locations": locations}, f, indent=2)

def predict_itinerary(trip_data: dict, artifact) -> dict:
    preprocessor = artifact["preprocessor"]
    locations_df = pd.DataFrame(trip_data["locations"])
    locations_df["city"] = trip_data["city"]
    locations_df["days"] = trip_data["days"]
    locations_df["city_location"] = locations_df["city"] + "_" + locations_df["name"]

    for col in [
        "slot_index", "lat", "lng", "rating", "open_min", "close_min",
        "visit_duration", "mandatory", "window_span", "window_slack",
        "location_count", "mandatory_count", "avg_rating", "max_rating",
        "total_visit_duration", "earliest_open_min", "latest_close_min",
        "geo_span_km", "priority"
    ]:
        if col not in locations_df.columns:
            if col in ["lat", "lng", "rating", "open_min", "close_min", "visit_duration", "window_span", "window_slack", "avg_rating", "max_rating", "total_visit_duration", "earliest_open_min", "latest_close_min", "geo_span_km"]:
                locations_df[col] = 0.0
            elif col == "mandatory": locations_df[col] = False
            elif col == "priority": locations_df[col] = "medium"
            elif col in ["slot_index", "location_count", "mandatory_count"]: locations_df[col] = 0
    
    if "name" in locations_df.columns: 
        locations_df = locations_df.rename(columns={"name": "location_name"})

    feature_cols = [
        'city', 'priority', 'location_name', 'city_location',
        'days', 'slot_index', 'lat', 'lng', 'rating', 'open_min',
        'close_min', 'visit_duration', 'mandatory', 'window_span',
        'window_slack', 'location_count', 'mandatory_count', 'avg_rating',
        'max_rating', 'total_visit_duration', 'earliest_open_min',
        'latest_close_min', 'geo_span_km'
    ]

    for col in feature_cols:
        if col not in locations_df.columns:
            if col in ["city", "priority", "location_name", "city_location"]:
                locations_df[col] = "unknown"
            else:
                locations_df[col] = 0
    locations_df = locations_df[feature_cols]

    predicted_ranks = artifact["rank_model"].predict(locations_df)
    predicted_arrivals = artifact["arrival_model"].predict(locations_df)
    predicted_departures = artifact["departure_model"].predict(locations_df)
    predicted_statuses = artifact["status_model"].predict(locations_df)
    predicted_warnings = artifact["warning_model"].predict(locations_df)

    itinerary_result = {"trip_details": trip_data, "predicted_itinerary": []}
    for i, row in locations_df.iterrows():
        itinerary_result["predicted_itinerary"].append({
            "location_name": row["location_name"],
            "predicted_rank": predicted_ranks[i].item(),
            "predicted_arrival_min": predicted_arrivals[i].item(),
            "predicted_departure_min": predicted_departures[i].item(),
            "predicted_status": predicted_statuses[i].item() if hasattr(predicted_statuses[i], 'item') else predicted_statuses[i],
            "predicted_warning": predicted_warnings[i].item() if hasattr(predicted_warnings[i], 'item') else predicted_warnings[i],
        })
    return itinerary_result

if __name__ == '__main__':
    print("Module loaded.")
