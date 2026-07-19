import { useEffect, useState } from "react";

export default function CrowdMap({ zones = ["A", "B", "C", "D"] }) {
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      zones.forEach((zone) => {
        fetch(`/api/v1/crowd/status?zone_id=${zone}`)
          .then((r) => r.json())
          .then((data) => setStatuses((prev) => ({ ...prev, [zone]: data })))
          .catch(() => {});
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [zones]);

  return (
    <div role="table" aria-label="Live crowd density by zone">
      {zones.map((zone) => {
        const s = statuses[zone];
        return (
          <div key={zone} role="row" style={{ display: "flex", gap: "1rem" }}>
            <span role="cell">Zone {zone}</span>
            <span role="cell">{s ? `${s.current_load_pct}%` : "—"}</span>
            <span role="cell">{s?.alert ? "⚠ Alert" : "OK"}</span>
          </div>
        );
      })}
    </div>
  );
}
