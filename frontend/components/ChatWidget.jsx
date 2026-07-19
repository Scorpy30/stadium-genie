import { useCallback, useEffect, useRef, useState } from "react";

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
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [plainLanguage, setPlainLanguage] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSynthesisSupported(Boolean(window.speechSynthesis));

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results, (result) => result[0].transcript)
          .join(" ")
          .trim();
        setQuestion(transcript);
      };
      recognition.onerror = (event) => {
        const message =
          event.error === "not-allowed"
            ? "Microphone permission was blocked. Allow mic access in your browser to use voice input."
            : "Voice input stopped unexpectedly. You can still type your question.";
        setVoiceError(message);
        setListening(false);
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      setSpeechRecognitionSupported(true);
    }

    return () => {
      if (!recognitionRef.current) return;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.abort();
    };
  }, [language]);

  const speakAnswer = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis || !answer) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  }, [answer, language]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  useEffect(() => {
    if (speechEnabled) speakAnswer();
  }, [speechEnabled, speakAnswer]);

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("Voice input is not supported in this browser. Please type your question instead.");
      return;
    }

    setVoiceError("");
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    try {
      recognition.start();
      setListening(true);
    } catch {
      setVoiceError("Voice input is already starting. Please try again in a moment.");
    }
  }

  function toggleReadAloud() {
    setSpeechEnabled((enabled) => {
      const nextEnabled = !enabled;
      if (!nextEnabled && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return nextEnabled;
    });
  }

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
          language,
          session_id: "demo-session",
          plain_language: plainLanguage,
          venue_id: venueId,
        }),
      });
      const data = await res.json();
      const outputText = data.answer || data.recommendation || JSON.stringify(data);
      setAnswer(outputText);
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
        <div className="kiosk-row kiosk-row--centered">
          <input
            id="chat-input"
            type="text"
            className="kiosk-input kiosk-input--grow"
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
            Plain-language
          </label>

          <button
            type="button"
            className="kiosk-button kiosk-button--compact"
            onClick={toggleListening}
            aria-pressed={listening}
            title={
              speechRecognitionSupported
                ? listening
                  ? "Stop voice input"
                  : "Start voice input"
                : "Voice input is unavailable in this browser"
            }
            disabled={!speechRecognitionSupported}
          >
            {listening ? "Stop" : "Mic"}
          </button>

          {speechSynthesisSupported && (
            <button
              type="button"
              className="kiosk-button kiosk-button--compact"
              onClick={toggleReadAloud}
              aria-pressed={speechEnabled}
              title={speechEnabled ? "Turn off read aloud" : "Turn on read aloud"}
            >
              {speechEnabled ? "Mute" : "Read"}
            </button>
          )}

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="kiosk-input kiosk-input--language"
            aria-label="Response language"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
            <option value="pt">Portuguese</option>
            <option value="ar">Arabic</option>
            <option value="zh">Chinese</option>
            <option value="ko">Korean</option>
            <option value="hi">Hindi</option>
          </select>

          <button type="submit" className="kiosk-button" disabled={loading}>
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>
        {voiceError && <p className="kiosk-help kiosk-help--error">{voiceError}</p>}
      </form>

      <div
        className={`board ${answer ? "" : "board--empty"}`}
        role="status"
        aria-live="polite"
      >
        <p className="board__label">StadiumGenie // response</p>
        <p className="board__text">
          {loading ? "Retrieving..." : answer || "Type your question and press Ask."}
        </p>
      </div>
    </div>
  );
}
