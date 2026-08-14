/**
 * ProgressBar.jsx
 *
 * A reusable animated progress bar.
 * Props:
 *   label      – e.g. "Protein"
 *   consumed   – number consumed so far
 *   target     – daily target number
 *   unit       – "kcal" | "g"
 *   percentage – 0-100 (already capped by backend)
 *   color      – CSS colour string for the fill
 *   large      – if true, renders the bigger calorie bar
 *   exceeded   – if true on the large bar, fills red
 */
export default function ProgressBar({
  label,
  consumed,
  target,
  unit = "g",
  percentage = 0,
  color = "#6366f1",
  large = false,
  exceeded = false,
}) {
  const fillColor = large && exceeded ? "#dc2626" : color;
  const barHeight = large ? "22px" : "12px";

  return (
    <div className={`progress-bar-wrapper ${large ? "progress-bar-large" : ""}`}>
      <div className="progress-bar-header">
        <span className="progress-bar-label">{label}</span>
        <span className="progress-bar-values">
          {consumed} / {target} {unit}
          {large && (
            <span className={`pct-badge ${exceeded ? "pct-badge-red" : ""}`}>
              {percentage}%
            </span>
          )}
        </span>
      </div>

      {/* Track */}
      <div className="progress-bar-track" style={{ height: barHeight }}>
        {/* Fill */}
        <div
          className="progress-bar-fill"
          style={{
            width: `${percentage}%`,
            background: fillColor,
            height: barHeight,
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {!large && (
        <div className="progress-bar-pct">{percentage}%</div>
      )}
    </div>
  );
}
