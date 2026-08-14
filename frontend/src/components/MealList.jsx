/**
 * MealList.jsx
 *
 * Renders today's logged meals in a card/table layout.
 * Each row has a Delete button that calls DELETE /api/meals/<id>.
 *
 * Props:
 *   meals       – array of meal objects from GET /api/meals
 *   onMealDeleted – callback after deletion so parent can refresh
 */
import { useState } from "react";
import { deleteMeal } from "../api.js";

export default function MealList({ meals, onMealDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteMeal(id);
      onMealDeleted();
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card meal-list-card">
      <h2 className="section-title">📋 Today's Meals</h2>

      {meals.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🥗</span>
          <p>No meals logged yet. Add your first meal above!</p>
        </div>
      ) : (
        <div className="meal-table-wrapper">
          <table className="meal-table">
            <thead>
              <tr>
                <th>Food</th>
                <th>Portion</th>
                <th>Calories</th>
                <th>Protein</th>
                <th>Carbs</th>
                <th>Fats</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => (
                <tr key={meal.id} className="meal-row">
                  <td className="meal-name">{meal.food_name}</td>
                  <td>{meal.portion_grams} g</td>
                  <td>
                    <span className="badge badge-cal">{meal.calories} kcal</span>
                  </td>
                  <td>
                    <span className="badge badge-protein">{meal.protein} g</span>
                  </td>
                  <td>
                    <span className="badge badge-carbs">{meal.carbs} g</span>
                  </td>
                  <td>
                    <span className="badge badge-fats">{meal.fats} g</span>
                  </td>
                  <td>
                    <button
                      id={`delete-meal-${meal.id}`}
                      className="btn btn-delete"
                      onClick={() => handleDelete(meal.id)}
                      disabled={deletingId === meal.id}
                      title="Delete this meal"
                    >
                      {deletingId === meal.id ? "…" : "🗑️"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals row */}
      {meals.length > 0 && (
        <div className="meal-totals">
          <span>Total: </span>
          <strong>{meals.reduce((s, m) => s + m.calories, 0).toFixed(1)} kcal</strong>
          <span className="meal-totals-macro">
            &nbsp;·&nbsp;P: {meals.reduce((s, m) => s + m.protein, 0).toFixed(1)} g
            &nbsp;·&nbsp;C: {meals.reduce((s, m) => s + m.carbs, 0).toFixed(1)} g
            &nbsp;·&nbsp;F: {meals.reduce((s, m) => s + m.fats, 0).toFixed(1)} g
          </span>
        </div>
      )}
    </div>
  );
}
