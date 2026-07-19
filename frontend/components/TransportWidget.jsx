import { useState } from "react";

const ORIGIN_TYPES = [
  { value: "airport", label: "Airport" },
  { value: "bus_stop", label: "Bus stop" },
  { value: "train_station", label: "Train / metro station" },
  { value: "other", label: "Other (hotel, address, etc.)" },
];

const ORIGIN_PLACEHOLDERS = {
  airport: "e.g. JFK Airport, LAX, DFW",
  bus_stop: "e.g. Downtown bus terminal",
  train_station: "e.g. Journal Square PATH station",
  other: "e.g. your hotel or address",
};

export default function TransportWidget({ venueId }) {
  const [originType, setOriginType] = useState("airport");
  const [originName, setOriginName] = useState("");
  const [kickoffTime, setKickoffTime] = useState("");
  const [modePreference, setModePreference] = useState("any");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!originName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/transport/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: venueId,
          origin_type: originType,
          origin_name: originName,
          kickoff_time: kickoffTime || new Date().toISOString(),
          mode_preference: modePreference,
        }),
      });
      const data = await res.json();
      setRecommendation(data.recommendation || JSON.stringify(data));
    } catch {
      setRecommendation("Could not reach the assistant right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="kiosk-panel">
      <form onSubmit={handleSubmit} aria-label="Get transport recommendation">
        <label htmlFor="origin-type" className="kiosk-panel__label">
          Starting from
        </label>
        <div className="kiosk-row" style={{ marginBottom: "0.75rem" }}>
          <select
            id="origin-type"
            className="kiosk-input"
            style={{ flex: "0 1 180px" }}
            value={originType}
            onChange={(e) => setOriginType(e.target.value)}
          >
            {ORIGIN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="kiosk-input"
            value={originName}
            onChange={(e) => setOriginName(e.target.value)}
            placeholder={ORIGIN_PLACEHOLDERS[originType]}
            aria-label="Specific starting point"
            aria-required="true"
          />
        </div>

        <label htmlFor="kickoff-time" className="kiosk-panel__label">
          Kickoff time
        </label>
        <div className="kiosk-row" style={{ marginBottom: "0.75rem" }}>
          <input
            id="kickoff-time"
            type="datetime-local"
            className="kiosk-input"
            style={{ flex: "0 1 220px" }}
            value={kickoffTime}
            onChange={(e) => setKickoffTime(e.target.value)}
          />
          <select
            className="kiosk-input"
            style={{ flex: "0 1 160px" }}
            value={modePreference}
            onChange={(e) => setModePreference(e.target.value)}
            aria-label="Mode preference"
          >
            <option value="any">Any mode</option>
            <option value="transit">Transit only</option>
            <option value="drive">Drive</option>
            <option value="walk">Walk</option>
          </select>
          <button type="submit" className="kiosk-button" disabled={loading}>
            {loading ? "Thinking…" : "Get route"}
          </button>
        </div>
      </form>

      <div className={`board ${recommendation ? "" : "board--empty"}`} role="status" aria-live="polite">
        <p className="board__label">StadiumGenie // transport recommendation</p>
        <p className="board__text">
          {loading ? "Retrieving…" : recommendation || "Fill in the form to see a recommendation here."}
        </p>
      </div>
    </div>
  );
}
