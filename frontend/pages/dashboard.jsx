import { useEffect, useState } from "react";

export default function Dashboard() {
  const [digest, setDigest] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/ops/summary")
      .then((r) => r.json())
      .then((d) => setDigest(d.digest))
      .catch(() => setDigest("Unable to load summary right now."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="gate-bar">
        <p className="gate-bar__eyebrow">Gate // Ops Dashboard</p>
        <h1>Operations</h1>
        <p>Live shift digest for organizers and venue staff.</p>
      </header>
      <main className="page" aria-label="Organizer operational dashboard">
        <section className="kiosk-panel" aria-label="GenAI shift digest">
          <span className="kiosk-panel__label">Shift digest</span>
          <div className={`board ${digest ? "" : "board--empty"}`}>
            <p className="board__label">StadiumGenie // ops summary</p>
            <p className="board__text">
              {loading ? "Retrieving…" : digest || "No digest available."}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
