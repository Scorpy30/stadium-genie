import { useState } from "react";

/**
 * Accessible kiosk-style chat widget: keyboard-navigable, screen-reader
 * friendly (aria-live region for responses), with a "plain language"
 * toggle for accessibility mode. The answer renders as a stadium
 * scoreboard-style readout to match the venue-kiosk visual identity.
 *
 * `venueId` simulates what a real deployment would already know before the
 * fan ever asks a question -- from a QR check-in, geofencing, or venue
 * selection at app open. It is NOT something we ask the fan mid-chat.
 */
export default function ChatWidget({
  endpoint,
  placeholder = "Ask StadiumGenie...",
  venueId = "metlife",
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [plainLanguage, setPlainLanguage] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          language: "en",
          session_id: "demo-session",
          plain_language: plainLanguage,
          venue_id: venueId,
        }),
      });
      const data = await res.json();
      setAnswer(data.answer || data.recommendation || JSON.stringify(data));
    } catch {
      setAnswer("Could not reach the assistant right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="kiosk-panel">
      <form onSubmit={handleSubmit} aria-label="Ask StadiumGenie">
        <label htmlFor="chat-input" className="kiosk-panel__label">
          Your question
        </label>
        <div className="kiosk-row">
          <input
            id="chat-input"
            type="text"
            className="kiosk-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={placeholder}
            aria-required="true"
          />
          <label className="kiosk-checkbox">
            <input
              type="checkbox"
              checked={plainLanguage}
              onChange={(e) => setPlainLanguage(e.target.checked)}
            />
            Plain-language mode
          </label>
          <button type="submit" className="kiosk-button" disabled={loading}>
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>
      </form>

      <div className={`board ${answer ? "" : "board--empty"}`} role="status" aria-live="polite">
        <p className="board__label">StadiumGenie // response</p>
        <p className="board__text">
          {loading ? "Retrieving…" : answer || "Ask a question to see a response here."}
        </p>
      </div>
    </div>
  );
}
