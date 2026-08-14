/**
 * FoodForm.jsx
 *
 * Lets the user:
 *  1. Pick a food from the dropdown and enter a portion in grams → "Add Food"
 *  2. Click "📸 Scan Image" to simulate AI food recognition (mock)
 *
 * Props:
 *   foods     – array of { key, name } from GET /api/foods
 *   onMealAdded – callback after a meal is successfully added
 */
import { useState, useRef } from "react";
import { addMealByKey, addMealCustom } from "../api.js";

// Mock AI scanner: maps uploaded file names (case-insensitive)
// to predefined food keys, then returns random realistic values.
const MOCK_SCAN_RESULTS = [
  { food_name: "Grilled Chicken (Scanned)", portion_grams: 180, calories: 297, protein: 55.8, carbs: 0, fats: 6.5 },
  { food_name: "Brown Rice Bowl (Scanned)",  portion_grams: 250, calories: 325, protein: 6.8, carbs: 70.5, fats: 0.8 },
  { food_name: "Banana Smoothie (Scanned)",  portion_grams: 300, calories: 267, protein: 3.3, carbs: 68.4, fats: 0.9 },
  { food_name: "Egg Omelette (Scanned)",     portion_grams: 120, calories: 186, protein: 15.6, carbs: 1.3, fats: 13.2 },
  { food_name: "Paneer Tikka (Scanned)",     portion_grams: 150, calories: 397, protein: 27.4, carbs: 1.8, fats: 31.2 },
];

export default function FoodForm({ foods, onMealAdded }) {
  const [selectedFood, setSelectedFood] = useState("");
  const [portion, setPortion] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanResult, setScanResult] = useState(null);  // holds mock scan data
  const fileInputRef = useRef(null);

  // ── Submit food from dropdown ────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!selectedFood) { setError("Please select a food."); return; }
    if (!portion || Number(portion) <= 0) { setError("Enter a valid portion in grams."); return; }

    setLoading(true);
    try {
      await addMealByKey(selectedFood, Number(portion));
      setSelectedFood("");
      setPortion("");
      setScanResult(null);
      onMealAdded();   // tell parent to refresh
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Mock image scan ──────────────────────────────────────────────────────────
  function handleScanClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanLoading(true);
    setError("");
    setScanResult(null);

    // Simulate a 1.5-second "AI processing" delay
    await new Promise((r) => setTimeout(r, 1500));

    // Pick a random mock result
    const mock = MOCK_SCAN_RESULTS[Math.floor(Math.random() * MOCK_SCAN_RESULTS.length)];
    setScanResult(mock);
    setScanLoading(false);

    // Reset file input so the same file can be picked again
    e.target.value = "";
  }

  // ── Submit scan result ───────────────────────────────────────────────────────
  async function handleScanSubmit() {
    if (!scanResult) return;
    setLoading(true);
    setError("");
    try {
      await addMealCustom(
        scanResult.food_name,
        scanResult.portion_grams,
        scanResult.calories,
        scanResult.protein,
        scanResult.carbs,
        scanResult.fats,
      );
      setScanResult(null);
      onMealAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card food-form-card">
      <h2 className="section-title">🍽️ Log Food</h2>

      <form id="food-form" onSubmit={handleSubmit} className="food-form">
        {/* Food dropdown */}
        <div className="form-group">
          <label htmlFor="food-select">Food</label>
          <select
            id="food-select"
            value={selectedFood}
            onChange={(e) => { setSelectedFood(e.target.value); setScanResult(null); }}
            disabled={loading}
          >
            <option value="">— Select a food —</option>
            {foods.map((f) => (
              <option key={f.key} value={f.key}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Portion input */}
        <div className="form-group">
          <label htmlFor="portion-input">Portion (grams)</label>
          <input
            id="portion-input"
            type="number"
            min="1"
            max="5000"
            placeholder="e.g. 200"
            value={portion}
            onChange={(e) => setPortion(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Action buttons */}
        <div className="form-actions">
          <button
            id="add-food-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Adding…" : "➕ Add Food"}
          </button>

          <button
            id="scan-image-btn"
            type="button"
            className="btn btn-secondary"
            onClick={handleScanClick}
            disabled={scanLoading || loading}
          >
            {scanLoading ? "🔍 Scanning…" : "📸 Scan Image"}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="form-error">⚠️ {error}</p>}
      </form>

      {/* ── Scan result preview ─────────────────────────────────────────── */}
      {scanLoading && (
        <div className="scan-loading">
          <div className="spinner" />
          <p>AI is analysing your food image…</p>
        </div>
      )}

      {scanResult && !scanLoading && (
        <div className="scan-result">
          <h3 className="scan-result-title">🤖 AI Scan Result</h3>
          <div className="scan-result-grid">
            <div><strong>Food:</strong> {scanResult.food_name}</div>
            <div><strong>Portion:</strong> {scanResult.portion_grams} g</div>
            <div><strong>Calories:</strong> {scanResult.calories} kcal</div>
            <div><strong>Protein:</strong> {scanResult.protein} g</div>
            <div><strong>Carbs:</strong> {scanResult.carbs} g</div>
            <div><strong>Fats:</strong> {scanResult.fats} g</div>
          </div>
          <div className="scan-result-actions">
            <button
              id="confirm-scan-btn"
              className="btn btn-primary"
              onClick={handleScanSubmit}
              disabled={loading}
            >
              {loading ? "Logging…" : "✅ Log This Meal"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setScanResult(null)}
            >
              ✕ Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
