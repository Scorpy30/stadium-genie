import { useState } from "react";
import ChatWidget from "../components/ChatWidget";
import VenueSelector from "../components/VenueSelector";
import TransportWidget from "../components/TransportWidget";

export default function Home() {
  const [venueId, setVenueId] = useState("metlife");

  return (
    <>
      <header className="gate-bar">
        <p className="gate-bar__eyebrow">Gate // Fan Assistant</p>
        <h1>StadiumGenie</h1>
        <p>
          Ask about wayfinding, accessibility, transport, or sustainability —
          in your language. Pick your stadium below (a real deployment would
          normally detect this automatically via QR check-in or geofencing).
        </p>
      </header>
      <main className="page" aria-label="StadiumGenie fan assistant">
        <VenueSelector value={venueId} onChange={setVenueId} />

        <ChatWidget endpoint="/api/v1/multilingual/chat" venueId={venueId} />

        <h2 className="section-title">Getting there</h2>
        <TransportWidget venueId={venueId} />
      </main>
    </>
  );
}
