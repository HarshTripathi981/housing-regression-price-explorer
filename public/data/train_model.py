#!/usr/bin/env python3
"""
Housing Regression Model Trainer and Data Explorer
This script generates a realistic housing dataset, trains a Multiple Linear Regression / Ridge model
from first principles (pure Python standard library), computes descriptive statistics,
correlations, evaluation error metrics (MAE, RMSE, R2, MAPE), residual distributions,
and exports all results to JSON and CSV for the interactive interface and notebook.
"""

import json
import math
import os
import random
import sys

def set_seed(seed=42):
    random.seed(seed)

NEIGHBORHOODS = [
    {
        "name": "Oakridge Hills",
        "description": "Prestigious hillside enclave with scenic views and top-tier schools",
        "base_premium": 140000,
        "sqft_multiplier": 1.25,
        "school_base": 9.2,
        "dist_downtown_avg": 9.5,
        "lot_multiplier": 1.4,
        "color": "#3b82f6"
    },
    {
        "name": "Downtown / Financial",
        "description": "Urban core, high density, premium walkability and transit access",
        "base_premium": 110000,
        "sqft_multiplier": 1.35,
        "school_base": 7.4,
        "dist_downtown_avg": 2.1,
        "lot_multiplier": 0.4,
        "color": "#8b5cf6"
    },
    {
        "name": "Riverside Green",
        "description": "Scenic riverfront community with parks and historic charm",
        "base_premium": 65000,
        "sqft_multiplier": 1.10,
        "school_base": 8.1,
        "dist_downtown_avg": 6.8,
        "lot_multiplier": 1.1,
        "color": "#10b981"
    },
    {
        "name": "Maplewood Suburbs",
        "description": "Family-centric suburban neighborhoods with modern master-planned homes",
        "base_premium": 25000,
        "sqft_multiplier": 0.98,
        "school_base": 7.8,
        "dist_downtown_avg": 14.2,
        "lot_multiplier": 1.0,
        "color": "#f59e0b"
    },
    {
        "name": "Pinecrest Valley",
        "description": "Value-oriented outer suburb with spacious lots and affordable entry prices",
        "base_premium": -35000,
        "sqft_multiplier": 0.82,
        "school_base": 6.3,
        "dist_downtown_avg": 22.5,
        "lot_multiplier": 1.3,
        "color": "#ec4899"
    }
]

def generate_dataset(n_samples=1000, seed=42):
    set_seed(seed)
    records = []
    
    for i in range(n_samples):
        house_id = f"H-{1001 + i}"
        neigh_idx = random.choices([0, 1, 2, 3, 4], weights=[0.20, 0.18, 0.22, 0.25, 0.15])[0]
        neigh = NEIGHBORHOODS[neigh_idx]
        
        # Sqft living space (skewed realistic distribution)
        if neigh["name"] == "Downtown / Financial":
            sqft = int(random.gauss(1450, 480))
            sqft = max(550, min(sqft, 3800))
        else:
            sqft = int(random.gauss(2300, 720))
            sqft = max(850, min(sqft, 5200))
            
        # Bedrooms correlated with sqft
        expected_beds = round(sqft / 580)
        bedrooms = int(max(1, min(6, random.gauss(expected_beds, 0.65))))
        
        # Bathrooms correlated with bedrooms and sqft
        expected_baths = round(bedrooms * 0.7 + (sqft / 1400), 1)
        # Snap to nearest 0.5
        bathrooms = round(max(1.0, min(5.0, round(expected_baths * 2) / 2)), 1)
        
        # Lot size
        if neigh["name"] == "Downtown / Financial":
            lot_size = int(random.gauss(2400, 900) * neigh["lot_multiplier"])
            lot_size = max(800, min(lot_size, 5500))
        else:
            lot_size = int(random.gauss(8500, 2800) * neigh["lot_multiplier"])
            lot_size = max(2000, min(lot_size, 26000))
            
        # Year built
        if neigh["name"] == "Downtown / Financial":
            year_built = random.choices(
                [random.randint(1920, 1960), random.randint(1980, 2024)],
                weights=[0.3, 0.7]
            )[0]
        elif neigh["name"] == "Maplewood Suburbs":
            year_built = random.randint(1995, 2024)
        elif neigh["name"] == "Pinecrest Valley":
            year_built = random.randint(1975, 2018)
        else:
            year_built = random.randint(1960, 2023)
            
        age = 2026 - year_built
        
        # Condition / Overall quality score (1 to 10)
        # Newer homes tend to have higher condition, but renovations happen
        base_cond = 9.5 - (age * 0.065) + random.gauss(0, 1.1)
        condition = int(max(2, min(10, round(base_cond))))
        
        # Garage spaces (0 to 3)
        if neigh["name"] == "Downtown / Financial":
            garage = random.choices([0, 1, 2], weights=[0.45, 0.45, 0.10])[0]
        else:
            garage = random.choices([1, 2, 3], weights=[0.18, 0.64, 0.18])[0]
            
        # School rating (1 to 10)
        school_rating = round(max(3.0, min(10.0, random.gauss(neigh["school_base"], 0.7))), 1)
        
        # Distance to downtown (miles)
        dist_downtown = round(max(0.5, random.gauss(neigh["dist_downtown_avg"], neigh["dist_downtown_avg"] * 0.25)), 1)
        
        # Pool
        has_pool = 1 if (sqft > 2200 and random.random() < 0.28) else 0
        
        # Ground-truth market price formation function with realistic economic dynamics:
        # 1. Base price
        # 2. Sqft marginal price ($175/sqft baseline modulated by neighborhood multiplier)
        # 3. Bedroom and Bathroom premiums
        # 4. Lot size premium ($6.50/sqft of lot)
        # 5. Condition quality factor ($16,500 per point above 5)
        # 6. Age depreciation (-$650/year of age, capped)
        # 7. Garage value ($14,000 per stall)
        # 8. School rating value ($9,500 per school point)
        # 9. Downtown proximity benefit (-$2,800 per mile away)
        # 10. Pool ($28,000)
        # 11. Neighborhood fixed premium
        # 12. Residual unobserved variance / realistic noise epsilon
        
        price = 115000.0
        price += sqft * (168.0 * neigh["sqft_multiplier"])
        price += (bedrooms - 2.5) * 12500.0
        price += (bathrooms - 2.0) * 18000.0
        price += lot_size * 5.8
        price += (condition - 5.0) * 16500.0
        price -= min(age * 620.0, 48000.0)
        price += garage * 13500.0
        price += (school_rating - 5.0) * 8800.0
        price -= dist_downtown * 2400.0
        price += has_pool * 26000.0
        price += neigh["base_premium"]
        
        # Add realistic market noise (unobserved features, buyer emotions, negotiation) ~ N(0, $22,000)
        noise = random.gauss(0, 22500)
        price += noise
        
        # Round price to nearest $500
        price = max(110000.0, round(price / 500) * 500)
        price_per_sqft = round(price / sqft, 2)
        
        records.append({
            "id": house_id,
            "neighborhood": neigh["name"],
            "sqft": sqft,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "lot_size": lot_size,
            "year_built": year_built,
            "age": age,
            "condition": condition,
            "garage_spaces": garage,
            "school_rating": school_rating,
            "distance_downtown": dist_downtown,
            "has_pool": has_pool,
            "price": price,
            "price_per_sqft": price_per_sqft
        })
        
    return records

# Matrix operations in pure standard library
def transpose(matrix):
    return [[matrix[j][i] for j in range(len(matrix))] for i in range(len(matrix[0]))]

def matmul(A, B):
    rows_A = len(A)
    cols_A = len(A[0])
    cols_B = len(B[0])
    C = [[0.0 for _ in range(cols_B)] for _ in range(rows_A)]
    for i in range(rows_A):
        for k in range(cols_A):
            aik = A[i][k]
            if aik != 0:
                for j in range(cols_B):
                    C[i][j] += aik * B[k][j]
    return C

def invert_matrix_gauss_jordan(A, reg_lambda=1e-5):
    """Invert square matrix with L2 diagonal regularization (Ridge-stable)"""
    n = len(A)
    # Clone and add diagonal regularization
    M = [[A[i][j] + (reg_lambda if i == j else 0.0) for j in range(n)] for i in range(n)]
    I = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    
    for col in range(n):
        # Pivot search
        max_row = col
        max_val = abs(M[col][col])
        for r in range(col + 1, n):
            if abs(M[r][col]) > max_val:
                max_val = abs(M[r][col])
                max_row = r
        if max_row != col:
            M[col], M[max_row] = M[max_row], M[col]
            I[col], I[max_row] = I[max_row], I[col]
            
        pivot = M[col][col]
        if abs(pivot) < 1e-12:
            pivot = 1e-12
            
        inv_pivot = 1.0 / pivot
        for j in range(n):
            M[col][j] *= inv_pivot
            I[col][j] *= inv_pivot
            
        for r in range(n):
            if r != col:
                factor = M[r][col]
                if factor != 0:
                    for j in range(n):
                        M[r][j] -= factor * M[col][j]
                        I[r][j] -= factor * I[col][j]
    return I

def pearson_correlation(x, y):
    n = len(x)
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    cov = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    var_x = sum((x[i] - mean_x) ** 2 for i in range(n))
    var_y = sum((y[i] - mean_y) ** 2 for i in range(n))
    denom = math.sqrt(var_x * var_y)
    return round(cov / denom, 4) if denom > 1e-9 else 0.0

def calculate_summary_stats(values):
    s_vals = sorted(values)
    n = len(s_vals)
    mean_v = sum(s_vals) / n
    variance = sum((x - mean_v) ** 2 for x in s_vals) / (n - 1)
    std_v = math.sqrt(variance)
    median_v = s_vals[n // 2] if n % 2 == 1 else (s_vals[n // 2 - 1] + s_vals[n // 2]) / 2.0
    q1 = s_vals[n // 4]
    q3 = s_vals[(3 * n) // 4]
    return {
        "count": n,
        "mean": round(mean_v, 2),
        "std": round(std_v, 2),
        "min": round(s_vals[0], 2),
        "q1": round(q1, 2),
        "median": round(median_v, 2),
        "q3": round(q3, 2),
        "max": round(s_vals[-1], 2)
    }

def train_and_evaluate():
    data = generate_dataset(n_samples=1000, seed=42)
    
    # Feature definitions
    continuous_features = [
        "sqft", "bedrooms", "bathrooms", "lot_size", "age",
        "condition", "garage_spaces", "school_rating", "distance_downtown", "has_pool"
    ]
    neighborhood_names = [n["name"] for n in NEIGHBORHOODS]
    # Reference neighborhood: "Pinecrest Valley" (omitted to avoid dummy variable trap)
    dummy_neighborhoods = neighborhood_names[:-1]
    
    all_feature_names = continuous_features + [f"neigh_{n}" for n in dummy_neighborhoods]
    
    # Compute summary stats for continuous features & price
    summary_stats = {
        feat: calculate_summary_stats([d[feat] for d in data]) for feat in continuous_features + ["price", "price_per_sqft"]
    }
    
    # Neighborhood aggregations
    neighborhood_stats = {}
    for n in neighborhood_names:
        subset = [d for d in data if d["neighborhood"] == n]
        prices = [d["price"] for d in subset]
        sqfts = [d["sqft"] for d in subset]
        pps = [d["price_per_sqft"] for d in subset]
        neighborhood_stats[n] = {
            "count": len(subset),
            "avg_price": round(sum(prices) / len(prices)),
            "median_price": round(sorted(prices)[len(prices)//2]),
            "avg_sqft": round(sum(sqfts) / len(sqfts)),
            "avg_price_per_sqft": round(sum(pps) / len(pps), 1),
            "min_price": min(prices),
            "max_price": max(prices)
        }
        
    # Correlation Matrix
    corr_keys = ["sqft", "bedrooms", "bathrooms", "lot_size", "age", "condition", "school_rating", "distance_downtown", "price"]
    correlation_matrix = {}
    for k1 in corr_keys:
        correlation_matrix[k1] = {}
        for k2 in corr_keys:
            v1 = [d[k1] for d in data]
            v2 = [d[k2] for d in data]
            correlation_matrix[k1][k2] = pearson_correlation(v1, v2)
            
    # Train / Test Split (80% / 20%)
    set_seed(101)
    indices = list(range(len(data)))
    random.shuffle(indices)
    split_point = int(0.8 * len(data))
    train_idx = set(indices[:split_point])
    test_idx = set(indices[split_point:])
    
    train_data = [data[i] for i in range(len(data)) if i in train_idx]
    test_data = [data[i] for i in range(len(data)) if i in test_idx]
    
    # Prepare Design Matrix X and y
    def build_feature_vector(row):
        vec = [row[feat] for feat in continuous_features]
        # One-hot encoding for neighborhoods (reference is Pinecrest Valley)
        for n in dummy_neighborhoods:
            vec.append(1.0 if row["neighborhood"] == n else 0.0)
        return vec

    # Unstandardized training (with bias column = 1.0)
    X_train_raw = [[1.0] + build_feature_vector(r) for r in train_data]
    y_train = [[r["price"]] for r in train_data]
    
    X_test_raw = [[1.0] + build_feature_vector(r) for r in test_data]
    y_test = [[r["price"]] for r in test_data]
    
    # Normal Equations: beta = (X^T X + lambda I)^(-1) X^T y
    print("Computing OLS Regression Normal Equations...")
    XT_train = transpose(X_train_raw)
    XTX = matmul(XT_train, X_train_raw)
    XTX_inv = invert_matrix_gauss_jordan(XTX, reg_lambda=0.01)
    XTy = matmul(XT_train, y_train)
    beta = matmul(XTX_inv, XTy) # Shape: (p+1, 1)
    
    coefficients = [b[0] for b in beta]
    intercept = round(coefficients[0], 2)
    feature_coeffs = {
        name: round(coefficients[idx + 1], 2)
        for idx, name in enumerate(all_feature_names)
    }
    
    # Standardized coefficients (to measure relative feature importance)
    # beta_std_j = beta_j * (std_x_j / std_y)
    y_train_flat = [y[0] for y in y_train]
    y_mean = sum(y_train_flat) / len(y_train_flat)
    y_std = math.sqrt(sum((y - y_mean)**2 for y in y_train_flat) / (len(y_train_flat)-1))
    
    standardized_importance = []
    for idx, name in enumerate(continuous_features):
        x_vals = [r[name] for r in train_data]
        x_mean = sum(x_vals) / len(x_vals)
        x_std = math.sqrt(sum((x - x_mean)**2 for x in x_vals) / (len(x_vals)-1))
        raw_b = feature_coeffs[name]
        std_b = raw_b * (x_std / y_std)
        standardized_importance.append({
            "feature": name,
            "raw_coefficient": raw_b,
            "standardized_beta": round(std_b, 4),
            "abs_impact": round(abs(std_b), 4)
        })
    # Add dummy neighborhoods
    for n in dummy_neighborhoods:
        key = f"neigh_{n}"
        raw_b = feature_coeffs[key]
        x_vals = [1.0 if r["neighborhood"] == n else 0.0 for r in train_data]
        x_mean = sum(x_vals) / len(x_vals)
        x_std = math.sqrt(sum((x - x_mean)**2 for x in x_vals) / (len(x_vals)-1))
        std_b = raw_b * (x_std / y_std)
        standardized_importance.append({
            "feature": f"Location: {n}",
            "raw_coefficient": raw_b,
            "standardized_beta": round(std_b, 4),
            "abs_impact": round(abs(std_b), 4)
        })
        
    standardized_importance.sort(key=lambda x: x["abs_impact"], reverse=True)
    
    # Prediction helper
    def predict(row_feature_vec):
        val = intercept
        for idx, name in enumerate(all_feature_names):
            val += feature_coeffs[name] * row_feature_vec[idx]
        return val

    # Test set predictions and residual error analysis
    test_eval_records = []
    test_actuals = []
    test_preds = []
    residuals = []
    abs_errors = []
    pct_errors = []
    sq_errors = []
    
    for r in test_data:
        f_vec = build_feature_vector(r)
        pred = predict(f_vec)
        actual = r["price"]
        res = actual - pred
        abs_err = abs(res)
        pct_err = abs_err / actual * 100.0
        sq_err = res ** 2
        
        test_actuals.append(actual)
        test_preds.append(pred)
        residuals.append(res)
        abs_errors.append(abs_err)
        pct_errors.append(pct_err)
        sq_errors.append(sq_err)
        
        test_eval_records.append({
            "id": r["id"],
            "neighborhood": r["neighborhood"],
            "sqft": r["sqft"],
            "bedrooms": r["bedrooms"],
            "bathrooms": r["bathrooms"],
            "actual_price": actual,
            "predicted_price": round(pred, 2),
            "residual": round(res, 2),
            "abs_error": round(abs_err, 2),
            "pct_error": round(pct_err, 2)
        })
        
    # Metrics
    n_test = len(test_data)
    mae = sum(abs_errors) / n_test
    mse = sum(sq_errors) / n_test
    rmse = math.sqrt(mse)
    mape = sum(pct_errors) / n_test
    max_error = max(abs_errors)
    
    y_test_mean = sum(test_actuals) / n_test
    ss_tot = sum((y - y_test_mean) ** 2 for y in test_actuals)
    ss_res = sum(sq_errors)
    r2 = 1.0 - (ss_res / ss_tot)
    
    # Train set metrics for comparison (checking overfitting / bias-variance)
    train_sq_errors = []
    train_abs_errors = []
    for r in train_data:
        f_vec = build_feature_vector(r)
        pred = predict(f_vec)
        actual = r["price"]
        train_abs_errors.append(abs(actual - pred))
        train_sq_errors.append((actual - pred) ** 2)
        
    train_mae = sum(train_abs_errors) / len(train_data)
    train_rmse = math.sqrt(sum(train_sq_errors) / len(train_data))
    train_ss_tot = sum((y[0] - y_mean) ** 2 for y in y_train)
    train_r2 = 1.0 - (sum(train_sq_errors) / train_ss_tot)
    
    # Histogram of residuals (for normal error distribution check)
    min_res = min(residuals)
    max_res = max(residuals)
    num_bins = 15
    bin_width = (max_res - min_res) / num_bins
    residual_hist = []
    for b in range(num_bins):
        low = min_res + b * bin_width
        high = low + bin_width
        count = sum(1 for res in residuals if (low <= res < high or (b == num_bins - 1 and res == high)))
        residual_hist.append({
            "bin_center": round(low + bin_width / 2),
            "low": round(low),
            "high": round(high),
            "count": count
        })
        
    # Sample inputs demonstration (benchmarks across archetypes)
    sample_inputs = [
        {
            "name": "Suburban Family Haven",
            "neighborhood": "Maplewood Suburbs",
            "sqft": 2400,
            "bedrooms": 4,
            "bathrooms": 2.5,
            "lot_size": 9200,
            "year_built": 2012,
            "condition": 8,
            "garage_spaces": 2,
            "school_rating": 8.5,
            "distance_downtown": 13.5,
            "has_pool": 0,
            "narrative": "Standard 4-bed family home with modern build, good schools, and 2-car garage."
        },
        {
            "name": "Downtown Luxury Penthouse",
            "neighborhood": "Downtown / Financial",
            "sqft": 1850,
            "bedrooms": 2,
            "bathrooms": 2.0,
            "lot_size": 1500,
            "year_built": 2021,
            "condition": 10,
            "garage_spaces": 1,
            "school_rating": 7.0,
            "distance_downtown": 1.2,
            "has_pool": 0,
            "narrative": "High-end urban residence near major financial hubs with top-grade finishes."
        },
        {
            "name": "Oakridge Executive Estate",
            "neighborhood": "Oakridge Hills",
            "sqft": 4200,
            "bedrooms": 5,
            "bathrooms": 4.5,
            "lot_size": 18500,
            "year_built": 2018,
            "condition": 9,
            "garage_spaces": 3,
            "school_rating": 9.5,
            "distance_downtown": 8.2,
            "has_pool": 1,
            "narrative": "Sprawling luxury property with in-ground pool, expansive lot, and premier school zone."
        },
        {
            "name": "Riverside Historic Cottage",
            "neighborhood": "Riverside Green",
            "sqft": 1650,
            "bedrooms": 3,
            "bathrooms": 1.5,
            "lot_size": 7500,
            "year_built": 1968,
            "condition": 6,
            "garage_spaces": 1,
            "school_rating": 8.0,
            "distance_downtown": 6.5,
            "has_pool": 0,
            "narrative": "Charming mid-century home walking distance to the river trails, ripe for cosmetic upgrade."
        },
        {
            "name": "Pinecrest Starter Home",
            "neighborhood": "Pinecrest Valley",
            "sqft": 1300,
            "bedrooms": 3,
            "bathrooms": 1.0,
            "lot_size": 6000,
            "year_built": 1985,
            "condition": 5,
            "garage_spaces": 1,
            "school_rating": 6.0,
            "distance_downtown": 24.0,
            "has_pool": 0,
            "narrative": "Affordable single-family entry home located in peaceful outer suburban valley."
        }
    ]
    
    for sample in sample_inputs:
        sample["age"] = 2026 - sample["year_built"]
        f_vec = build_feature_vector(sample)
        pred = predict(f_vec)
        sample["predicted_price"] = round(pred, 2)
        sample["price_interval_low"] = round(pred - 1.96 * rmse, 2)
        sample["price_interval_high"] = round(pred + 1.96 * rmse, 2)
        
        # Breakdown of component contributions
        contributions = [{"feature": "Base Intercept", "impact": intercept}]
        for idx, feat_name in enumerate(all_feature_names):
            imp = feature_coeffs[feat_name] * f_vec[idx]
            contributions.append({"feature": feat_name, "impact": round(imp, 2)})
        sample["contributions"] = contributions

    output_payload = {
        "metadata": {
            "title": "Housing Market Regression Analysis",
            "generated_samples": len(data),
            "train_samples": len(train_data),
            "test_samples": len(test_data),
            "train_ratio": 0.8,
            "method": "Multiple Linear Regression with Ridge Regularization",
            "features_used": all_feature_names,
            "continuous_features": continuous_features,
            "neighborhoods": NEIGHBORHOODS
        },
        "metrics": {
            "test": {
                "r2": round(r2, 4),
                "rmse": round(rmse, 2),
                "mae": round(mae, 2),
                "mape": round(mape, 2),
                "max_error": round(max_error, 2)
            },
            "train": {
                "r2": round(train_r2, 4),
                "rmse": round(train_rmse, 2),
                "mae": round(train_mae, 2)
            }
        },
        "model_weights": {
            "intercept": intercept,
            "coefficients": feature_coeffs,
            "dummy_neighborhoods": dummy_neighborhoods,
            "reference_neighborhood": "Pinecrest Valley"
        },
        "feature_importance": standardized_importance,
        "summary_statistics": summary_stats,
        "neighborhood_statistics": neighborhood_stats,
        "correlation_matrix": correlation_matrix,
        "residual_histogram": residual_hist,
        "test_eval_records": test_eval_records[:150], # Sample for visualization
        "sample_inputs": sample_inputs,
        "raw_data_sample": data[:200] # Representative slice for interactive explorer
    }
    
    os.makedirs("src/data", exist_ok=True)
    os.makedirs("public/data", exist_ok=True)
    
    with open("src/data/housingModelData.json", "w") as f:
        json.dump(output_payload, f, indent=2)
        
    # Write CSV for data download and inspection
    csv_header = "id,neighborhood,sqft,bedrooms,bathrooms,lot_size,year_built,age,condition,garage_spaces,school_rating,distance_downtown,has_pool,price,price_per_sqft\n"
    csv_rows = [csv_header]
    for r in data:
        row_str = f"{r['id']},{r['neighborhood']},{r['sqft']},{r['bedrooms']},{r['bathrooms']},{r['lot_size']},{r['year_built']},{r['age']},{r['condition']},{r['garage_spaces']},{r['school_rating']},{r['distance_downtown']},{r['has_pool']},{r['price']},{r['price_per_sqft']}\n"
        csv_rows.append(row_str)
        
    with open("public/data/housing_data.csv", "w") as f:
        f.writelines(csv_rows)
        
    print(f"Dataset generated ({len(data)} houses).")
    print(f"Model Trained! Test R² = {r2:.4f}, Test RMSE = ${rmse:,.2f}, MAE = ${mae:,.2f}")
    print("Files saved to src/data/housingModelData.json and public/data/housing_data.csv.")

if __name__ == "__main__":
    train_and_evaluate()
