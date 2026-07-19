import { useEffect, useState } from "react";

/**
 * Lets the fan pick their stadium. In a real deployment this selection
 * would usually be automatic (QR check-in, geofencing) -- this dropdown
 * exists so the demo makes that design decision visible and testable,
 * and so a fan without an automatic signal still has a clear way to set it.
 */
export default function VenueSelector({ value, onChange }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/venues")
      .then((r) => r.json())
      .then((data) => setVenues(data.venues || []))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="kiosk-panel" style={{ marginBottom: "1rem" }}>
      <label htmlFor="venue-select" className="kiosk-panel__label">
        Your stadium
      </label>
      <select
        id="venue-select"
        className="kiosk-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        aria-busy={loading}
      >
        {loading && <option>Loading stadiums…</option>}
        {!loading && venues.length === 0 && <option>No stadiums available</option>}
        {venues.map((v) => (
          <option key={v.venue_id} value={v.venue_id}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}
