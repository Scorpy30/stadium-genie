import { useEffect, useState } from "react";

export default function Dashboard() {
  const [digest, setDigest] = useState("");
  const [incidentLog, setIncidentLog] = useState("Shift starts. High density expected at Gate C due to transit delays.");
  const [loadingDigest, setLoadingDigest] = useState(true);

  // Simulation states
  const [zoneMetrics, setZoneMetrics] = useState({
    A: { count: 60, capacity: 100, current_load_pct: 60, trend: "stable", alert: false },
    B: { count: 40, capacity: 100, current_load_pct: 40, trend: "stable", alert: false },
    C: { count: 85, capacity: 100, current_load_pct: 85, trend: "rising", alert: true },
    D: { count: 30, capacity: 100, current_load_pct: 30, trend: "stable", alert: false },
  });
  const [activeIncidents, setActiveIncidents] = useState("Slow ticketing system at Gate C; shuttle delay on North route.");
  const [simZone, setSimZone] = useState("C");
  const [simCount, setSimCount] = useState("90");
  const [simCapacity, setSimCapacity] = useState("100");

  const [decisionActions, setDecisionActions] = useState([]);
  const [loadingDecisions, setLoadingDecisions] = useState(false);

  // Fetch summary/digest on load and log updates
  async function fetchSummary() {
    setLoadingDigest(true);
    try {
      const res = await fetch(`/api/v1/ops/summary?incident_log=${encodeURIComponent(incidentLog)}`);
      const data = await res.json();
      setDigest(data.digest);
    } catch {
      setDigest("Unable to load shift summary.");
    } finally {
      setLoadingDigest(false);
    }
  }

  // Fetch AI recommended actions
  async function fetchDecisionSupport() {
    setLoadingDecisions(true);
    try {
      const metricsPayload = {};
      Object.entries(zoneMetrics).forEach(([zone, data]) => {
        metricsPayload[`zone_${zone.toLowerCase()}`] = data.current_load_pct / 100;
      });

      const res = await fetch("/api/v1/ops/decision-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone_metrics: metricsPayload,
          active_incidents: activeIncidents.split(";").map(i => i.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      setDecisionActions(data.actions || []);
    } catch {
      // Fallback in case of endpoint error
      setDecisionActions([
        {
          action: "Deploy field team to Gate C",
          priority: "critical",
          rationale: "Crowd congestion exceeded 85% with rising trend."
        }
      ]);
    } finally {
      setLoadingDecisions(false);
    }
  }

  // Handle simulating a crowd count push
  async function handleSimulateCrowd(e) {
    e.preventDefault();
    const count = parseInt(simCount);
    const capacity = parseInt(simCapacity);
    if (isNaN(count) || isNaN(capacity)) return;

    try {
      const res = await fetch("/api/v1/crowd/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone_id: simZone,
          gate_id: `gate_${simZone.toLowerCase()}`,
          count: count,
          capacity: capacity,
        }),
      });
      const statusData = await res.json();
      setZoneMetrics(prev => ({
        ...prev,
        [simZone]: statusData,
      }));
    } catch (err) {
      // Local fallback calculation if backend is disconnected
      const load_pct = Math.round((count / capacity) * 100);
      setZoneMetrics(prev => ({
        ...prev,
        [simZone]: {
          zone_id: simZone,
          current_load_pct: load_pct,
          trend: load_pct > prev[simZone].current_load_pct ? "rising" : "falling",
          alert: load_pct >= 85,
        },
      }));
    }
  }

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchDecisionSupport();
  }, [zoneMetrics, activeIncidents]);

  return (
    <>
      <header className="gate-bar">
        <p className="gate-bar__eyebrow">Gate // Ops Dashboard</p>
        <h1>Operations</h1>
        <p>Live operational intelligence dashboard for organizers and venue staff.</p>
      </header>
      <main className="page" aria-label="Organizer operational dashboard" style={{ maxWidth: "900px" }}>
        
        {/* Section 1: Digest & Incident Log */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <section className="kiosk-panel" aria-label="GenAI shift digest">
            <span className="kiosk-panel__label">Live GenAI Shift Digest</span>
            <div className={`board ${digest ? "" : "board--empty"}`} style={{ height: "100%", minHeight: "150px" }}>
              <p className="board__label">StadiumGenie // ops summary</p>
              <p className="board__text" style={{ fontSize: "0.9rem" }}>
                {loadingDigest ? "Generating digest..." : digest || "No digest available."}
              </p>
            </div>
          </section>

          <section className="kiosk-panel" aria-label="Incident Logging">
            <span className="kiosk-panel__label">Incident Log Feed</span>
            <textarea
              className="kiosk-input"
              style={{ width: "100%", height: "110px", fontSize: "0.9rem", resize: "none", marginBottom: "0.75rem" }}
              value={incidentLog}
              onChange={(e) => setIncidentLog(e.target.value)}
            />
            <button className="kiosk-button" onClick={fetchSummary} disabled={loadingDigest} style={{ float: "right" }}>
              Update Summary
            </button>
          </section>
        </div>

        {/* Section 2: Crowd Capacity Map & Simulator */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <section className="kiosk-panel" aria-label="Crowd density metrics">
            <span className="kiosk-panel__label">Live Zone Densities</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "0.5rem" }}>
              {Object.entries(zoneMetrics).map(([zone, data]) => {
                const color = data.alert ? "#ef4444" : data.current_load_pct > 70 ? "#ffb100" : "#3ecf8e";
                return (
                  <div key={zone} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                      <span>Zone {zone} {data.alert ? "⚠️ (Congested)" : ""}</span>
                      <span style={{ color: color }}>{data.current_load_pct}% Capacity ({data.trend})</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--panel-soft)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${data.current_load_pct}%`, height: "100%", background: color, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="kiosk-panel" aria-label="Crowd simulator">
            <span className="kiosk-panel__label">Crowd Metrics Simulator</span>
            <form onSubmit={handleSimulateCrowd} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="sim-zone" style={{ fontSize: "0.75rem", color: "var(--mist)", fontWeight: "600" }}>Zone</label>
                  <select id="sim-zone" className="kiosk-input" value={simZone} onChange={(e) => setSimZone(e.target.value)} style={{ width: "100%", padding: "0.5rem" }}>
                    <option value="A">Zone A</option>
                    <option value="B">Zone B</option>
                    <option value="C">Zone C</option>
                    <option value="D">Zone D</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="sim-count" style={{ fontSize: "0.75rem", color: "var(--mist)", fontWeight: "600" }}>Count</label>
                  <input id="sim-count" type="number" className="kiosk-input" value={simCount} onChange={(e) => setSimCount(e.target.value)} style={{ width: "100%", padding: "0.5rem" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="sim-capacity" style={{ fontSize: "0.75rem", color: "var(--mist)", fontWeight: "600" }}>Capacity</label>
                  <input id="sim-capacity" type="number" className="kiosk-input" value={simCapacity} onChange={(e) => setSimCapacity(e.target.value)} style={{ width: "100%", padding: "0.5rem" }} />
                </div>
              </div>
              <button type="submit" className="kiosk-button" style={{ width: "100%", padding: "0.5rem 0" }}>
                Push Live Metric Updates
              </button>
            </form>

            <div style={{ marginTop: "1rem" }}>
              <label htmlFor="active-incidents" style={{ fontSize: "0.75rem", color: "var(--mist)", fontWeight: "600", display: "block" }}>Active Incidents (separated by semicolons)</label>
              <input
                id="active-incidents"
                type="text"
                className="kiosk-input"
                style={{ width: "100%", padding: "0.5rem", marginTop: "4px" }}
                value={activeIncidents}
                onChange={(e) => setActiveIncidents(e.target.value)}
                placeholder="e.g. Incident 1; Incident 2"
              />
            </div>
          </section>
        </div>

        {/* Section 3: AI Real-Time Decision Support */}
        <section className="kiosk-panel" aria-label="GenAI decision support">
          <span className="kiosk-panel__label">GenAI Decision Support Recommendations</span>
          {loadingDecisions ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--mist)", fontWeight: "600" }}>
              Analyzing live metrics and drafting response recommendations...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
              {decisionActions.map((item, idx) => {
                const priorityColor =
                  item.priority === "critical" ? "#ef4444" :
                  item.priority === "high" ? "#f97316" :
                  item.priority === "medium" ? "#eab308" : "#3b82f6";
                return (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: "8px",
                      padding: "1rem",
                      background: "var(--panel)",
                      borderLeft: `5px solid ${priorityColor}`,
                      animation: "board-in 0.25s ease-out"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--ink)" }}>{item.action}</span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                          color: "#fff",
                          background: priorityColor
                        }}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--mist)", lineHeight: "1.4" }}>
                      <strong>Rationale:</strong> {item.rationale}
                    </p>
                  </div>
                );
              })}
              {decisionActions.length === 0 && (
                <div style={{ gridColumn: "span 2", padding: "1.5rem", textAlign: "center", color: "var(--mist)" }}>
                  All stadium operations running optimally. No decision recommendations required.
                </div>
              )}
            </div>
          )}
        </section>

      </main>
    </>
  );
}
