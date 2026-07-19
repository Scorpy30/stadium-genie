from app.services.crowd_predictor import ingest


def test_stable_load_below_threshold_no_alert():
    result = ingest("zone_a", count=50, capacity=100)
    assert result["current_load_pct"] == 50.0
    assert result["alert"] is False


def test_alert_fires_when_rising_above_threshold():
    ingest("zone_b", count=70, capacity=100)
    result = ingest("zone_b", count=90, capacity=100)
    assert result["trend"] == "rising"
    assert result["alert"] is True
