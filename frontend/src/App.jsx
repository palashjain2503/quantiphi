/**
 * App.jsx  –  Root component
 *
 * State managed here:
 *   dashboard – data from GET /api/dashboard
 *   meals     – list from GET /api/meals
 *   foods     – list from GET /api/foods (loaded once)
 *   goal      – active goal key string
 *
 * A single refresh() function re-fetches both dashboard and meals,
 * keeping everything in sync after any user action.
 */
import { useState, useEffect, useCallback } from "react";
import { getDashboard, getMeals, getFoods } from "./api.js";
import Dashboard from "./components/Dashboard.jsx";
import GoalSelector from "./components/GoalSelector.jsx";
import FoodForm from "./components/FoodForm.jsx";
import MealList from "./components/MealList.jsx";

export default function App() {
  const [dashboard, setDashboard] = useState(null);
  const [meals, setMeals] = useState([]);
  const [foods, setFoods] = useState([]);
  const [goal, setGoal] = useState("maintenance");
  const [globalError, setGlobalError] = useState("");

  // ── Fetch dashboard + meals (called after every mutation) ────────────────────
  const refresh = useCallback(async () => {
    try {
      const [dash, mealList] = await Promise.all([getDashboard(), getMeals()]);
      setDashboard(dash);
      setMeals(mealList);
      setGoal(dash.goal);
      setGlobalError("");
    } catch (err) {
      setGlobalError("Could not reach the backend. Is Flask running on port 5000?");
    }
  }, []);

  // ── Load foods list once on mount ────────────────────────────────────────────
  useEffect(() => {
    getFoods()
      .then(setFoods)
      .catch(() => setGlobalError("Failed to load food list from backend."));
  }, []);

  // ── Initial data load ────────────────────────────────────────────────────────
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="app-wrapper">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🔥</span>
            <span className="logo-text">CalorieTrack</span>
          </div>
          <GoalSelector currentGoal={goal} onGoalChange={refresh} />
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="app-main">
        {globalError && (
          <div className="global-error">
            <span>⚠️ {globalError}</span>
          </div>
        )}

        {/* Dashboard */}
        <Dashboard data={dashboard} />

        {/* Food form */}
        <FoodForm foods={foods} onMealAdded={refresh} />

        {/* Meal history */}
        <MealList meals={meals} onMealDeleted={refresh} />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <p>CalorieTrack &copy; {new Date().getFullYear()} — Built with React + Flask + SQLite</p>
      </footer>
    </div>
  );
}
