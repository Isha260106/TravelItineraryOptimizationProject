import pandas as pd
import numpy as np

def time_to_min(time_str):
    if pd.isna(time_str): return 0
    try:
        h, m = map(int, str(time_str).split(':'))
        return h * 60 + m
    except:
        return 0

def preprocess(input_csv, output_csv):
    df = pd.read_csv(input_csv)
    
    records = []
    
    for idx, row in df.iterrows():
        travel_id = f"trip_{idx}"
        city = row.get("input/start_location/city", "Unknown")
        days = row.get("input/days", 1)
        priority = row.get("input/preferences/priority", "none")
        
        # Build a map of scheduled locations to their details
        schedule_map = {}
        for j in range(5):
            loc_col = f"output/itinerary/0/schedule/{j}/location"
            arr_col = f"output/itinerary/0/schedule/{j}/arrival_time"
            dep_col = f"output/itinerary/0/schedule/{j}/departure_time"
            stat_col = f"output/itinerary/0/schedule/{j}/status"
            
            if loc_col in df.columns and pd.notna(row[loc_col]):
                loc_name = row[loc_col]
                schedule_map[loc_name] = {
                    "position": j,
                    "arrival_min": time_to_min(row.get(arr_col)),
                    "departure_min": time_to_min(row.get(dep_col)),
                    "status": row.get(stat_col, "feasible")
                }
                
        # Iterate over inputs
        for i in range(5):
            name_col = f"input/locations/{i}/name"
            if name_col not in df.columns or pd.isna(row[name_col]):
                continue
                
            loc_name = row[name_col]
            
            record = {
                "travel_id": travel_id,
                "city": city,
                "days": days,
                "priority": priority,
                "slot_index": i,
                "location_name": loc_name,
                "lat": row.get(f"input/locations/{i}/lat", 0.0),
                "lng": row.get(f"input/locations/{i}/lng", 0.0),
                "rating": row.get(f"input/locations/{i}/rating", 0.0),
                "open_min": time_to_min(row.get(f"input/locations/{i}/open_time")),
                "close_min": time_to_min(row.get(f"input/locations/{i}/close_time")),
                "visit_duration": row.get(f"input/locations/{i}/visit_duration", 0),
                "mandatory": row.get(f"input/locations/{i}/mandatory", False),
            }
            
            # Map targets
            if loc_name in schedule_map:
                sched = schedule_map[loc_name]
                record["target_position"] = sched["position"]
                record["target_arrival_min"] = sched["arrival_min"]
                record["target_departure_min"] = sched["departure_min"]
                record["target_status"] = sched["status"]
            else:
                record["target_position"] = np.nan
                record["target_arrival_min"] = np.nan
                record["target_departure_min"] = np.nan
                record["target_status"] = "skipped"
                
            records.append(record)
            
    out_df = pd.DataFrame(records)
    out_df.to_csv(output_csv, index=False)
    print(f"Preprocessed {len(df)} trips into {len(out_df)} location records.")

if __name__ == "__main__":
    preprocess("Cleaned_Travel_Dataset.csv", "Flattened_Travel_Dataset.csv")
