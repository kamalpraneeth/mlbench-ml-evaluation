"""Script to generate realistic, high-quality benchmark datasets for MLBench.

Generates:
1. customer_support.csv (Multiclass classification: category and priority prediction)
2. house_prices.csv (Continuous regression: house price prediction)
3. log_analytics.csv (Binary classification: anomaly / failure detection)
"""

import os
import numpy as np
import pandas as pd


def generate_customer_support(n_samples: int = 2500, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    categories = ["Bug", "Billing", "Account", "Feature Request", "Hardware"]
    channels = ["web", "email", "chat", "phone"]

    # Generate synthetic features
    urgency_scores = np.random.uniform(0.1, 1.0, n_samples)
    tenure_months = np.random.randint(1, 120, n_samples)
    prev_tickets = np.random.poisson(lam=3.5, size=n_samples)
    sentiment_scores = np.random.uniform(-1.0, 1.0, n_samples)
    response_time_req = np.random.uniform(1.0, 48.0, n_samples)
    word_count = np.random.randint(20, 500, n_samples)
    channel = np.random.choice(channels, n_samples, p=[0.4, 0.3, 0.2, 0.1])

    # Assign category based on probabilistic rule with noise
    category_scores = np.zeros((n_samples, len(categories)))
    # Bug: high word count, negative sentiment, web/chat
    category_scores[:, 0] = (word_count / 200.0) - sentiment_scores * 1.5 + urgency_scores * 2.0
    # Billing: low tenure, email/phone, negative sentiment
    category_scores[:, 1] = (120 - tenure_months) / 40.0 - sentiment_scores * 1.0 + (prev_tickets > 2) * 1.5
    # Account: short words, moderate sentiment
    category_scores[:, 2] = 2.0 - (word_count / 150.0) + (urgency_scores > 0.5) * 1.2
    # Feature Request: positive sentiment, high tenure, web
    category_scores[:, 3] = sentiment_scores * 2.0 + (tenure_months / 30.0)
    # Hardware: high urgency, low response time required
    category_scores[:, 4] = urgency_scores * 3.0 + (prev_tickets / 2.0) - (response_time_req / 10.0)

    category_scores += np.random.normal(0, 0.8, category_scores.shape)
    chosen_cat_idx = np.argmax(category_scores, axis=1)
    chosen_categories = [categories[idx] for idx in chosen_cat_idx]

    # Priority mapping
    priority_raw = urgency_scores * 3.0 - sentiment_scores * 1.5 + (prev_tickets / 3.0) + np.random.normal(0, 0.5, n_samples)
    priority_labels = []
    for p in priority_raw:
        if p > 3.0:
            priority_labels.append("Critical")
        elif p > 1.8:
            priority_labels.append("High")
        elif p > 0.6:
            priority_labels.append("Medium")
        else:
            priority_labels.append("Low")

    df = pd.DataFrame({
        "ticket_id": [f"TCK-{10000 + i}" for i in range(n_samples)],
        "urgency_score": np.round(urgency_scores, 3),
        "customer_tenure_months": tenure_months,
        "previous_tickets": prev_tickets,
        "sentiment_score": np.round(sentiment_scores, 3),
        "response_time_req_hrs": np.round(response_time_req, 1),
        "word_count": word_count,
        "channel": channel,
        "priority": priority_labels,
        "category": chosen_categories,
    })
    return df


def generate_house_prices(n_samples: int = 2000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    sqft_living = np.random.randint(600, 5000, n_samples)
    bedrooms = np.random.choice([1, 2, 3, 4, 5, 6], n_samples, p=[0.05, 0.25, 0.40, 0.20, 0.08, 0.02])
    bathrooms = np.round(bedrooms * 0.65 + np.random.uniform(0.5, 1.5, n_samples), 1)
    floors = np.random.choice([1.0, 1.5, 2.0, 2.5, 3.0], n_samples, p=[0.45, 0.1, 0.35, 0.05, 0.05])
    waterfront = np.random.choice([0, 1], n_samples, p=[0.97, 0.03])
    view_score = np.random.choice([0, 1, 2, 3, 4], n_samples, p=[0.7, 0.1, 0.1, 0.06, 0.04])
    condition = np.random.choice([1, 2, 3, 4, 5], n_samples, p=[0.02, 0.08, 0.60, 0.22, 0.08])
    grade = np.random.randint(4, 12, n_samples)
    yr_built = np.random.randint(1940, 2024, n_samples)

    # Base price calculation
    price = (
        120_000
        + sqft_living * 210
        + bedrooms * 18_000
        + bathrooms * 26_000
        + waterfront * 190_000
        + view_score * 35_000
        + (condition - 3) * 15_000
        + (grade - 6) * 45_000
        + (yr_built - 1940) * 850
        + np.random.normal(0, 35_000, n_samples)
    )
    price = np.maximum(price, 85_000)

    df = pd.DataFrame({
        "property_id": [f"PROP-{20000 + i}" for i in range(n_samples)],
        "sqft_living": sqft_living,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "floors": floors,
        "waterfront": waterfront,
        "view_score": view_score,
        "condition": condition,
        "grade": grade,
        "yr_built": yr_built,
        "price": np.round(price, 2),
    })
    return df


def generate_log_analytics(n_samples: int = 3000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    cpu_usage = np.random.uniform(5.0, 99.0, n_samples)
    memory_usage = np.random.uniform(10.0, 98.0, n_samples)
    disk_io = np.random.uniform(20.0, 850.0, n_samples)
    network_latency = np.random.exponential(scale=15.0, size=n_samples)
    request_rate = np.random.poisson(lam=120, size=n_samples)
    error_rate_5xx = np.random.uniform(0.0, 15.0, n_samples)

    # Anomaly indicator: high cpu + high latency or high error rate
    anomaly_score = (cpu_usage / 100.0) * 0.3 + (memory_usage / 100.0) * 0.2 + (network_latency / 60.0) * 0.25 + (error_rate_5xx / 10.0) * 0.4
    is_anomaly = (anomaly_score > 0.85).astype(int)

    df = pd.DataFrame({
        "log_id": [f"LOG-{30000 + i}" for i in range(n_samples)],
        "cpu_usage_pct": np.round(cpu_usage, 2),
        "memory_usage_pct": np.round(memory_usage, 2),
        "disk_io_mbps": np.round(disk_io, 2),
        "network_latency_ms": np.round(network_latency, 2),
        "request_rate_rps": request_rate,
        "error_rate_5xx_pct": np.round(error_rate_5xx, 2),
        "is_anomaly": is_anomaly,
    })
    return df


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_data")
    os.makedirs(out_dir, exist_ok=True)

    cs_df = generate_customer_support()
    cs_path = os.path.join(out_dir, "customer_support.csv")
    cs_df.to_csv(cs_path, index=False)
    print(f"Generated {cs_path}: {len(cs_df)} rows, {len(cs_df.columns)} columns")

    hp_df = generate_house_prices()
    hp_path = os.path.join(out_dir, "house_prices.csv")
    hp_df.to_csv(hp_path, index=False)
    print(f"Generated {hp_path}: {len(hp_df)} rows, {len(hp_df.columns)} columns")

    log_df = generate_log_analytics()
    log_path = os.path.join(out_dir, "log_analytics.csv")
    log_df.to_csv(log_path, index=False)
    print(f"Generated {log_path}: {len(log_df)} rows, {len(log_df.columns)} columns")
