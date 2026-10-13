def test_api_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "MLBench"


def test_api_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Healthy"


def test_api_system_status(client):
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()
    assert "frameworks" in data
    assert "PyTorch" in data["frameworks"]
    assert "Scikit-learn" in data["frameworks"]


def test_api_datasets(client):
    response = client.get("/api/v1/datasets")
    assert response.status_code == 200
    datasets = response.json()
    assert len(datasets) >= 1
    ds_id = datasets[0]["id"]

    # Preview
    preview_res = client.get(f"/api/v1/datasets/{ds_id}/preview")
    assert preview_res.status_code == 200
    preview = preview_res.json()
    assert "columns" in preview
    assert len(preview["rows"]) > 0

    # Quality
    quality_res = client.get(f"/api/v1/datasets/{ds_id}/quality")
    assert quality_res.status_code == 200
    quality = quality_res.json()
    assert "quality_score" in quality


def test_api_dashboard_summary(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    summary = response.json()
    assert "total_experiments" in summary
    assert "models_registered" in summary
    assert "benchmark_runs" in summary


def test_api_models_and_benchmarks(client):
    models_res = client.get("/api/v1/models")
    assert models_res.status_code == 200
    models = models_res.json()
    assert len(models) >= 1

    bm_res = client.get("/api/v1/benchmarks")
    assert bm_res.status_code == 200
    bms = bm_res.json()
    assert len(bms) >= 1


def test_api_reports(client):
    response = client.get("/api/v1/reports")
    assert response.status_code == 200
    reports = response.json()
    assert len(reports) >= 1


def test_api_pipelines(client):
    response = client.get("/api/v1/pipelines")
    assert response.status_code == 200
    pipelines = response.json()
    assert len(pipelines) >= 1
