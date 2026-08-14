/**
 * GoalSelector.jsx
 *
 * Interactive Goal selector & Custom Target Editor modal.
 * Lets users:
 *   1. Switch between Weight Loss, Maintenance, Muscle Gain
 *   2. Click "⚙️ Customize" to edit calorie & macro targets for any goal
 *
 * Props:
 *   currentGoal  – active goal key: "weight_loss" | "maintenance" | "muscle_gain"
 *   onGoalChange – async callback to refresh dashboard
 */
import { useState, useEffect } from "react";
import { setGoal, getGoals, updateGoalTargets } from "../api.js";

const DEFAULT_GOAL_CONFIGS = {
  weight_loss: { label: "Weight Loss", icon: "⚖️", calories: 1500, protein: 120, carbs: 150, fats: 50 },
  maintenance: { label: "Maintenance", icon: "🔄", calories: 2000, protein: 100, carbs: 250, fats: 65 },
  muscle_gain: { label: "Muscle Gain", icon: "💪", calories: 2500, protein: 180, carbs: 300, fats: 80 },
};

export default function GoalSelector({ currentGoal, onGoalChange }) {
  const [showModal, setShowModal] = useState(false);
  const [goalsData, setGoalsData] = useState(DEFAULT_GOAL_CONFIGS);
  const [editTab, setEditTab] = useState("weight_loss");
  const [formValues, setFormValues] = useState(DEFAULT_GOAL_CONFIGS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch goals configuration on mount or when modal opens
  async function fetchGoalsConfig() {
    try {
      const res = await getGoals();
      if (res.goals) {
        setGoalsData(res.goals);
        setFormValues(res.goals);
      }
    } catch (err) {
      console.error("Failed to load goals config:", err);
    }
  }

  useEffect(() => {
    fetchGoalsConfig();
  }, []);

  async function handleSelectGoal(goalKey) {
    if (goalKey === currentGoal) return;
    try {
      await setGoal(goalKey);
      onGoalChange(goalKey);
    } catch (err) {
      alert("Failed to update goal: " + err.message);
    }
  }

  function handleOpenModal() {
    setError("");
    setEditTab(currentGoal || "maintenance");
    setFormValues(goalsData);
    setShowModal(true);
  }

  function handleInputChange(goalKey, field, val) {
    setFormValues((prev) => ({
      ...prev,
      [goalKey]: {
        ...prev[goalKey],
        [field]: val === "" ? "" : Number(val),
      },
    }));
  }

  async function handleSaveCustomTargets(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Validate inputs
      const payload = {};
      for (const [gKey, gObj] of Object.entries(formValues)) {
        if (!gObj.calories || gObj.calories <= 0) {
          throw new Error(`Calories for ${gObj.label || gKey} must be a positive number.`);
        }
        payload[gKey] = {
          calories: Number(gObj.calories),
          protein: Number(gObj.protein || 0),
          carbs: Number(gObj.carbs || 0),
          fats: Number(gObj.fats || 0),
        };
      }

      await updateGoalTargets(payload);
      await fetchGoalsConfig();
      await onGoalChange(currentGoal);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetDefaults() {
    if (!window.confirm("Reset all goals to default calorie & macro targets?")) return;
    setSaving(true);
    setError("");
    try {
      await updateGoalTargets(null); // null clears custom targets
      await fetchGoalsConfig();
      await onGoalChange(currentGoal);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="goal-selector-container">
      {/* ── Main Selector & Controls ───────────────────────────────── */}
      <div className="goal-toggle-bar">
        <div className="goal-pills">
          {Object.entries(goalsData).map(([key, data]) => {
            const isActive = currentGoal === key;
            const icon = DEFAULT_GOAL_CONFIGS[key]?.icon || "🎯";
            return (
              <button
                key={key}
                type="button"
                className={`goal-pill ${isActive ? "active" : ""}`}
                onClick={() => handleSelectGoal(key)}
                title={`Switch to ${data.label} (${data.calories} kcal)`}
              >
                <span className="goal-pill-icon">{icon}</span>
                <span className="goal-pill-label">{data.label}</span>
                <span className="goal-pill-cal">{data.calories} kcal</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-customize-goal"
          onClick={handleOpenModal}
          title="Customize Calorie & Macro Targets"
        >
          ⚙️ Customize Targets
        </button>
      </div>

      {/* ── Custom Target Editor Modal ────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h2 className="modal-title" style={{ textAlign: "left", margin: 0, color: "#fff" }}>
                  ⚙️ Customize Fitness Goals
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
                  Set custom daily calories and macronutrient targets for your goals.
                </p>
              </div>
              <button className="btn btn-ghost btn-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            {/* Tabs for each goal */}
            <div className="edit-goal-tabs">
              {Object.entries(formValues).map(([gKey, gObj]) => (
                <button
                  key={gKey}
                  type="button"
                  className={`edit-tab ${editTab === gKey ? "active" : ""}`}
                  onClick={() => setEditTab(gKey)}
                >
                  {DEFAULT_GOAL_CONFIGS[gKey]?.icon} {gObj.label || gKey}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveCustomTargets} className="custom-targets-form">
              {Object.entries(formValues).map(([gKey, gObj]) => {
                if (gKey !== editTab) return null;
                return (
                  <div key={gKey} className="goal-edit-panel">
                    <div className="target-input-grid">
                      <div className="form-group">
                        <label>🔥 Daily Calorie Target (kcal)</label>
                        <input
                          type="number"
                          min="500"
                          max="10000"
                          value={gObj.calories}
                          onChange={(e) => handleInputChange(gKey, "calories", e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>🥩 Protein Target (g)</label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={gObj.protein}
                          onChange={(e) => handleInputChange(gKey, "protein", e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>🌾 Carbs Target (g)</label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={gObj.carbs}
                          onChange={(e) => handleInputChange(gKey, "carbs", e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>🫒 Fats Target (g)</label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={gObj.fats}
                          onChange={(e) => handleInputChange(gKey, "fats", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {error && <p className="form-error">⚠️ {error}</p>}

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleResetDefaults}
                  disabled={saving}
                >
                  🔄 Reset Defaults
                </button>

                <div className="modal-footer-right">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "💾 Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
