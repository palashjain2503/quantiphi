/**
 * Dashboard.jsx
 *
 * Shows:
 *  - Daily calorie budget & a large progress bar
 *  - Three macro bars (protein, carbs, fats)
 *  - A modal alert when calories are exceeded
 *
 * Props:
 *   data – the object returned by GET /api/dashboard
 */
import { useState, useEffect } from "react";
import ProgressBar from "./ProgressBar.jsx";

export default function Dashboard({ data }) {
  const [showModal, setShowModal] = useState(false);

  // Show the exceeded modal whenever the data says budget is exceeded
  useEffect(() => {
    if (data?.exceeded) {
      setShowModal(true);
    }
  }, [data?.exceeded, data?.totals?.calories]);

  if (!data) {
    return <div className="card loading">Loading dashboard…</div>;
  }

  const { totals, targets, percentages, exceeded, goal_label } = data;

  return (
    <>
      {/* ── Budget Exceeded Modal ─────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🚨</div>
            <h2 className="modal-title">Daily Budget Exceeded!</h2>
            <p className="modal-body">
              You've consumed <strong>{totals.calories} kcal</strong> today,
              which is <strong>{(totals.calories - targets.calories).toFixed(0)} kcal</strong> over
              your <em>{goal_label}</em> target of <strong>{targets.calories} kcal</strong>.
            </p>
            <button
              id="modal-close-btn"
              className="btn btn-danger"
              onClick={() => setShowModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Dashboard Card ────────────────────────────────── */}
      <div className="card dashboard-card">
        <div className="dashboard-header">
          <h2 className="section-title">📊 Today's Dashboard</h2>
          <div className="goal-badge">{goal_label}</div>
        </div>

        {/* Stat pills */}
        <div className="stat-grid">
          <div className="stat-pill">
            <span className="stat-number">{totals.calories}</span>
            <span className="stat-desc">Consumed (kcal)</span>
          </div>
          <div className="stat-pill">
            <span className="stat-number">{targets.calories}</span>
            <span className="stat-desc">Target (kcal)</span>
          </div>
          <div className={`stat-pill ${exceeded ? "stat-pill-red" : "stat-pill-green"}`}>
            <span className="stat-number">
              {exceeded ? "+" : ""}{Math.abs(targets.calories - totals.calories).toFixed(0)}
            </span>
            <span className="stat-desc">{exceeded ? "Over budget" : "Remaining (kcal)"}</span>
          </div>
        </div>

        {/* Calorie bar – large */}
        <ProgressBar
          label="Calories"
          consumed={totals.calories}
          target={targets.calories}
          unit="kcal"
          percentage={percentages.calories}
          color="#6366f1"
          large
          exceeded={exceeded}
        />

        {/* Macro bars */}
        <div className="macro-grid">
          <ProgressBar
            label="🥩 Protein"
            consumed={totals.protein}
            target={targets.protein}
            percentage={percentages.protein}
            color="#10b981"
          />
          <ProgressBar
            label="🌾 Carbs"
            consumed={totals.carbs}
            target={targets.carbs}
            percentage={percentages.carbs}
            color="#f59e0b"
          />
          <ProgressBar
            label="🫒 Fats"
            consumed={totals.fats}
            target={targets.fats}
            percentage={percentages.fats}
            color="#ec4899"
          />
        </div>
      </div>
    </>
  );
}
