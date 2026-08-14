/**
 * GoalSelector.jsx
 *
 * Dropdown that lets the user pick their fitness goal.
 * Calls setGoal() on change, then triggers a dashboard refresh.
 *
 * Props:
 *   currentGoal  – active goal key: "weight_loss" | "maintenance" | "muscle_gain"
 *   onGoalChange – async callback(newGoalKey)
 */
import { setGoal } from "../api.js";

const GOAL_OPTIONS = [
  { value: "weight_loss",  label: "⚖️  Weight Loss" },
  { value: "maintenance",  label: "🔄  Maintenance" },
  { value: "muscle_gain",  label: "💪  Muscle Gain" },
];

export default function GoalSelector({ currentGoal, onGoalChange }) {
  async function handleChange(e) {
    const newGoal = e.target.value;
    try {
      await setGoal(newGoal);
      onGoalChange(newGoal);  // let parent refresh dashboard + meals
    } catch (err) {
      alert("Failed to update goal: " + err.message);
    }
  }

  return (
    <div className="goal-selector">
      <label htmlFor="goal-select" className="goal-label">
        🎯 Fitness Goal
      </label>
      <select
        id="goal-select"
        className="goal-select"
        value={currentGoal}
        onChange={handleChange}
      >
        {GOAL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
