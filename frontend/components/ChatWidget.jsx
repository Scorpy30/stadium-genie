import { useState, useEffect } from "react";

/**
 * Accessible kiosk-style chat widget: keyboard-navigable, screen-reader
 * friendly (aria-live region for responses), with a "plain language"
 * toggle for accessibility mode. The answer renders as a stadium
 * scoreboard-style readout to match the kiosk visual identity.
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
  const [isListening, setIsListening] = useState(false);
  const [readAloud, setReadAloud] = useState(false);

  // Stop talking if widget is unmounted
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
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
      const outputText = data.answer || data.recommendation || JSON.stringify(data);
      setAnswer(outputText);

      // Accessibility: Read back the answer if enabled
      if (readAloud && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(outputText);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setAnswer("Could not reach the assistant right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleVoiceInput() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.start();
  }

  return (
    <div className="kiosk-panel">
      <form onSubmit={handleSubmit} aria-label="Ask StadiumGenie">
        <label htmlFor="chat-input" className="kiosk-panel__label">
          Your question
        </label>
        <div className="kiosk-row" style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 220px", display: "flex" }}>
            <input
              id="chat-input"
              type="text"
              className="kiosk-input"
              style={{ paddingRight: "3rem" }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={placeholder}
              aria-required="true"
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`mic-button ${isListening ? "mic-button--listening" : ""}`}
              title="Speak your question"
              aria-label="Voice input"
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "50%",
                transition: "all 0.2s ease"
              }}
            >
              {isListening ? "🛑" : "🎙️"}
            </button>
          </div>
          <label className="kiosk-checkbox">
            <input
              type="checkbox"
              checked={plainLanguage}
              onChange={(e) => setPlainLanguage(e.target.checked)}
            />
            Plain-language
          </label>
          <label className="kiosk-checkbox">
            <input
              type="checkbox"
              checked={readAloud}
              onChange={(e) => setReadAloud(e.target.checked)}
            />
            Read aloud
          </label>
          <button type="submit" className="kiosk-button" disabled={loading}>
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>
      </form>

      <div className={`board ${answer ? "" : "board--empty"}`} role="status" aria-live="polite">
        <p className="board__label">StadiumGenie // response</p>
        <p className="board__text">
          {loading ? "Retrieving…" : answer || "Ask a question or click the microphone to speak."}
        </p>
      </div>
    </div>
  );
}
