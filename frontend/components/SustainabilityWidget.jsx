import { useState } from "react";

const CATEGORY_COLORS = {
  recyclable: { bg: "#eef2ff", border: "#3b82f6", text: "#1d4ed8", label: "Recyclable ♻️" },
  compost: { bg: "#f0fdf4", border: "#22c55e", text: "#15803d", label: "Compost 🌱" },
  landfill: { bg: "#f8fafc", border: "#64748b", text: "#334155", label: "Landfill 🗑️" },
  hazardous: { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c", label: "Hazardous ⚠️" },
};

export default function SustainabilityWidget() {
  const [itemDescription, setItemDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClassify(e) {
    e.preventDefault();
    if (!itemDescription.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/v1/sustainability/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_description: itemDescription }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Failed to classify item. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const category = result?.predicted_category;
  const style = category ? CATEGORY_COLORS[category] : null;

  return (
    <div className="kiosk-panel" style={{ marginTop: "1.5rem" }}>
      <form onSubmit={handleClassify} aria-label="Classify waste item">
        <label htmlFor="waste-input" className="kiosk-panel__label">
          AI Sustainability Sorting Coach
        </label>
        <div className="kiosk-row">
          <input
            id="waste-input"
            type="text"
            className="kiosk-input"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="Describe your waste (e.g. half-eaten hotdog, paper cup)..."
            aria-required="true"
          />
          <button type="submit" className="kiosk-button" disabled={loading}>
            {loading ? "Sorting…" : "Classify"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ color: "#ef4444", marginTop: "1rem", fontSize: "0.9rem" }}>
          {error}
        </div>
      )}

      {result && style && (
        <div
          style={{
            marginTop: "1.25rem",
            padding: "1rem",
            borderRadius: "8px",
            background: style.bg,
            borderLeft: `5px solid ${style.border}`,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            animation: "board-in 0.25s ease-out"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "700", color: style.text, textTransform: "uppercase", fontSize: "0.9rem" }}>
              {style.label}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>
              Confidence: {Math.round(result.confidence * 100)}%
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#1e293b", fontWeight: "500" }}>
            {result.disposal_instruction}
          </p>
        </div>
      )}
    </div>
  );
}
