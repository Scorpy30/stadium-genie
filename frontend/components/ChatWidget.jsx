import { useState, useEffect, useRef } from "react";

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
  const [micError, setMicError] = useState("");
  const [ttsError, setTtsError] = useState("");
  const recognitionRef = useRef(null);

  // Stop talking if widget is unmounted
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Chrome bug: speechSynthesis can pause mid-sentence; keep it alive
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const interval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setTtsError("");
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
      if (readAloud) {
        speakText(outputText);
      }
    } catch {
      setAnswer("Could not reach the assistant right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function speakText(text) {
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis) {
      setTtsError("Text-to-speech is not supported in this browser.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.pitch = 1;

      // Ensure voices are loaded (Chrome async quirk)
      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Prefer a natural English voice
          const preferred = voices.find(
            (v) => v.lang.startsWith("en") && !v.name.includes("Google")
          ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
          if (preferred) utterance.voice = preferred;
        }
        utterance.onerror = (event) => {
          // "interrupted" is normal when cancel() is called — not a real error
          if (event.error !== "interrupted") {
            setTtsError(`Read aloud error: ${event.error}`);
          }
        };
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = trySpeak;
      } else {
        trySpeak();
      }
    } catch (err) {
      setTtsError("Read aloud failed. Please try a different browser.");
    }
  }

  function handleVoiceInput() {
    if (typeof window === "undefined") return;
    setMicError("");

    // If already listening, stop
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError("Voice input requires Chrome or Edge.");
      return;
    }

    // Check microphone permission proactively (best effort)
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" }).then((result) => {
        if (result.state === "denied") {
          setMicError(
            "Microphone access is blocked. Please allow it in browser settings."
          );
        }
      }).catch(() => {
        // permissions API may not support 'microphone' in all browsers — ignore
      });
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setMicError("");
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      switch (event.error) {
        case "not-allowed":
        case "permission-denied":
          setMicError(
            "Microphone access denied. Click the 🔒 icon in your browser address bar to allow it."
          );
          break;
        case "no-speech":
          setMicError("No speech detected — please try again.");
          break;
        case "network":
          setMicError("Network error during voice recognition. Check your connection.");
          break;
        case "audio-capture":
          setMicError("No microphone found. Please connect a microphone.");
          break;
        case "aborted":
          // User or code stopped intentionally — no error message needed
          break;
        default:
          setMicError(`Voice input error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      setMicError("");
    };

    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setMicError("Could not start voice input. Please try again.");
    }
  }

  return (
    <div className="kiosk-panel">
      <form onSubmit={handleSubmit} aria-label="Ask StadiumGenie">
        <label htmlFor="chat-input" className="kiosk-panel__label">
          Your question
        </label>
        <div
          className="kiosk-row"
          style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}
        >
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
              title={isListening ? "Stop listening" : "Speak your question"}
              aria-label={isListening ? "Stop voice input" : "Voice input"}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: isListening ? "rgba(239,68,68,0.15)" : "transparent",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "50%",
                transition: "all 0.2s ease",
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

          <label className="kiosk-checkbox" title="Reads the response aloud using your browser's text-to-speech">
            <input
              type="checkbox"
              checked={readAloud}
              onChange={(e) => {
                setReadAloud(e.target.checked);
                if (!e.target.checked && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
            />
            Read aloud
          </label>

          <button type="submit" className="kiosk-button" disabled={loading}>
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>

        {/* Mic error feedback */}
        {micError && (
          <p
            role="alert"
            style={{
              color: "#ef4444",
              fontSize: "0.8rem",
              marginTop: "0.4rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            ⚠️ {micError}
          </p>
        )}

        {/* TTS error feedback */}
        {ttsError && (
          <p
            role="alert"
            style={{
              color: "#f59e0b",
              fontSize: "0.8rem",
              marginTop: "0.4rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            🔊 {ttsError}
          </p>
        )}
      </form>

      <div
        className={`board ${answer ? "" : "board--empty"}`}
        role="status"
        aria-live="polite"
      >
        <p className="board__label">StadiumGenie // response</p>
        <p className="board__text">
          {loading
            ? "Retrieving…"
            : answer || "Ask a question or click the microphone to speak."}
        </p>
      </div>
    </div>
  );
}
