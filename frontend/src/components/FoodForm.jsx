/**
 * FoodForm.jsx
 *
 * Lets the user:
 *  1. Pick a food from the dropdown and enter a portion in grams → "Add Food"
 *  2. Click "📸 Scan Image" to simulate AI food recognition (mock)
 *  3. Click "🥗 + Create Custom Food" to save a new food recipe to SQLite
 *
 * Props:
 *   foods           – array of { key, name, is_custom } from GET /api/foods
 *   onMealAdded     – callback after a meal is successfully added
 *   onFoodsUpdated  – callback after a custom food item is created
 */
import { useState, useRef } from "react";
import { addMealByKey, addMealCustom, createCustomFood } from "../api.js";

const MOCK_SCAN_RESULTS = [
  { food_name: "Grilled Chicken (Scanned)", portion_grams: 180, calories: 297, protein: 55.8, carbs: 0, fats: 6.5 },
  { food_name: "Brown Rice Bowl (Scanned)",  portion_grams: 250, calories: 325, protein: 6.8, carbs: 70.5, fats: 0.8 },
  { food_name: "Banana Smoothie (Scanned)",  portion_grams: 300, calories: 267, protein: 3.3, carbs: 68.4, fats: 0.9 },
  { food_name: "Egg Omelette (Scanned)",     portion_grams: 120, calories: 186, protein: 15.6, carbs: 1.3, fats: 13.2 },
  { food_name: "Paneer Tikka (Scanned)",     portion_grams: 150, calories: 397, protein: 27.4, carbs: 1.8, fats: 31.2 },
];

export default function FoodForm({ foods, onMealAdded, onFoodsUpdated }) {
  const [selectedFood, setSelectedFood] = useState("");
  const [portion, setPortion] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const fileInputRef = useRef(null);

  // ── Custom Food Modal state ──────────────────────────────────────────
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFats, setCustomFats] = useState("");
  const [customSaving, setCustomSaving] = useState(false);
  const [customError, setCustomError] = useState("");

  // ── Submit food from dropdown ────────────────────────────────────────
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
      onMealAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Mock image scan ──────────────────────────────────────────────────
  function handleScanClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanLoading(true);
    setError("");
    setScanResult(null);

    await new Promise((r) => setTimeout(r, 1500));

    const mock = MOCK_SCAN_RESULTS[Math.floor(Math.random() * MOCK_SCAN_RESULTS.length)];
    setScanResult(mock);
    setScanLoading(false);
    e.target.value = "";
  }

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

  // ── Create Custom Food Handler ───────────────────────────────────────
  async function handleSaveCustomFood(e) {
    e.preventDefault();
    setCustomError("");

    if (!customName.trim()) {
      setCustomError("Please enter a food name.");
      return;
    }
    if (customCal === "" || Number(customCal) < 0) {
      setCustomError("Enter valid calories per 100g.");
      return;
    }

    setCustomSaving(true);
    try {
      const res = await createCustomFood({
        display_name: customName.trim(),
        calories: Number(customCal),
        protein: Number(customProtein || 0),
        carbs: Number(customCarbs || 0),
        fats: Number(customFats || 0),
      });

      // Refresh food list in parent & auto-select the newly created food
      if (onFoodsUpdated) {
        await onFoodsUpdated();
      }
      setSelectedFood(res.food.key);
      setShowCustomModal(false);

      // Reset form
      setCustomName("");
      setCustomCal("");
      setCustomProtein("");
      setCustomCarbs("");
      setCustomFats("");
    } catch (err) {
      setCustomError(err.message);
    } finally {
      setCustomSaving(false);
    }
  }

  return (
    <div className="card food-form-card">
      <div className="food-form-header">
        <h2 className="section-title" style={{ marginBottom: 0 }}>🍽️ Log Food</h2>
        <button
          type="button"
          className="btn btn-ghost btn-custom-food-trigger"
          onClick={() => setShowCustomModal(true)}
        >
          ➕ Create Custom Food
        </button>
      </div>

      <form id="food-form" onSubmit={handleSubmit} className="food-form" style={{ marginTop: "16px" }}>
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

      {/* ── Custom Food Creator Modal ────────────────────────────────────── */}
      {showCustomModal && (
        <div className="modal-overlay" onClick={() => setShowCustomModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h2 className="modal-title" style={{ textAlign: "left", margin: 0, color: "#fff" }}>
                  🥗 Create Custom Food
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
                  Add a new food or recipe to your custom library (values per 100g).
                </p>
              </div>
              <button className="btn btn-ghost btn-close" onClick={() => setShowCustomModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomFood} className="custom-food-creator-form">
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label htmlFor="custom-food-name">Food Name</label>
                <input
                  id="custom-food-name"
                  type="text"
                  placeholder="e.g. Protein Whey Shake / Homemade Oats"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>

              <div className="target-input-grid">
                <div className="form-group">
                  <label htmlFor="custom-cal">Calories (kcal per 100g)</label>
                  <input
                    id="custom-cal"
                    type="number"
                    min="0"
                    max="10000"
                    placeholder="e.g. 370"
                    value={customCal}
                    onChange={(e) => setCustomCal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="custom-protein">Protein (g per 100g)</label>
                  <input
                    id="custom-protein"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 75.0"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="custom-carbs">Carbs (g per 100g)</label>
                  <input
                    id="custom-carbs"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 6.0"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="custom-fats">Fats (g per 100g)</label>
                  <input
                    id="custom-fats"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 2.5"
                    value={customFats}
                    onChange={(e) => setCustomFats(e.target.value)}
                  />
                </div>
              </div>

              {customError && <p className="form-error" style={{ marginBottom: "14px" }}>⚠️ {customError}</p>}

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCustomModal(false)}
                  disabled={customSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={customSaving}>
                  {customSaving ? "Saving…" : "💾 Save to Food Library"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
