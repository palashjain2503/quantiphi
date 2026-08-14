/**
 * api.js  –  All fetch() calls to the Flask backend live here.
 * The base URL is empty so Vite's proxy forwards /api/* to localhost:5000.
 */

const BASE = "";   // Vite proxy handles /api → http://localhost:5000

// ── Helper ────────────────────────────────────────────────────────────────────
async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Meals ─────────────────────────────────────────────────────────────────────

/** Fetch today's list of meals */
export const getMeals = () => request("/api/meals");

/**
 * Add a meal from the predefined food database.
 * @param {string} foodKey  - e.g. "chicken"
 * @param {number} portionGrams
 */
export const addMealByKey = (foodKey, portionGrams) =>
  request("/api/meals", {
    method: "POST",
    body: JSON.stringify({ food_key: foodKey, portion_grams: portionGrams }),
  });

/**
 * Add a meal with fully custom nutrition values (used by the image-scan mock).
 */
export const addMealCustom = (foodName, portionGrams, calories, protein, carbs, fats) =>
  request("/api/meals", {
    method: "POST",
    body: JSON.stringify({ food_name: foodName, portion_grams: portionGrams,
                           calories, protein, carbs, fats }),
  });

/** Delete a meal by its database id */
export const deleteMeal = (id) =>
  request(`/api/meals/${id}`, { method: "DELETE" });

// ── Dashboard ─────────────────────────────────────────────────────────────────

/** Get today's aggregated totals, targets, percentages and exceeded flag */
export const getDashboard = () => request("/api/dashboard");

// ── Goal ──────────────────────────────────────────────────────────────────────

/** Update the active fitness goal */
export const setGoal = (goal) =>
  request("/api/goal", {
    method: "POST",
    body: JSON.stringify({ goal }),
  });

/** Get all goals and their current targets */
export const getGoals = () => request("/api/goals");

/** Update custom targets for goals */
export const updateGoalTargets = (targets) =>
  request("/api/goals/custom", {
    method: "POST",
    body: JSON.stringify({ targets }),
  });

// ── Foods ─────────────────────────────────────────────────────────────────────

/** Fetch the list of available predefined foods */
export const getFoods = () => request("/api/foods");
