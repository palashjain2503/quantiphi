from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import date

from database import get_connection, init_db
from models import FOOD_DB, GOALS, calculate_nutrition, calculate_nutrition_from_dict
import re

app = Flask(__name__)
CORS(app)  # Allow requests from the React dev server

# Initialise the database (creates tables if needed) when the app starts
init_db()


# ──────────────────────────────────────────────
#  Helper – today's date string  "YYYY-MM-DD"
# ──────────────────────────────────────────────
def today() -> str:
    return date.today().isoformat()


# ──────────────────────────────────────────────
#  Helper – fetch current goal from DB
# ──────────────────────────────────────────────
def get_current_goal() -> str:
    conn = get_connection()
    row = conn.execute("SELECT goal FROM settings WHERE id = 1").fetchone()
    conn.close()
    return row["goal"] if row else "maintenance"


# ══════════════════════════════════════════════
#  GET /api/foods  –  list available & custom foods
# ══════════════════════════════════════════════
@app.route("/api/foods", methods=["GET"])
def get_foods():
    foods = [
        {"key": key, "name": data["display_name"], "is_custom": False}
        for key, data in FOOD_DB.items()
    ]
    conn = get_connection()
    rows = conn.execute("SELECT * FROM custom_foods ORDER BY id DESC").fetchall()
    conn.close()

    for r in rows:
        foods.append({
            "key": r["key"],
            "name": f"⭐ {r['display_name']} (Custom)",
            "display_name": r["display_name"],
            "is_custom": True,
            "calories": r["calories"],
            "protein": r["protein"],
            "carbs": r["carbs"],
            "fats": r["fats"]
        })
    return jsonify(foods)


# ══════════════════════════════════════════════
#  POST /api/foods  –  create a new custom food item (per 100g)
# ══════════════════════════════════════════════
@app.route("/api/foods", methods=["POST"])
def create_custom_food():
    data = request.get_json() or {}
    display_name = data.get("display_name", "").strip()
    if not display_name:
        return jsonify({"error": "Food name is required"}), 400

    try:
        calories = float(data.get("calories", 0))
        protein = float(data.get("protein", 0))
        carbs = float(data.get("carbs", 0))
        fats = float(data.get("fats", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Nutrition values must be valid numbers"}), 400

    if calories < 0 or protein < 0 or carbs < 0 or fats < 0:
        return jsonify({"error": "Nutrition values cannot be negative"}), 400

    # Generate unique key
    base_key = "custom_" + re.sub(r'[^a-z0-9]', '_', display_name.lower())
    key = base_key
    counter = 1
    conn = get_connection()

    while conn.execute("SELECT 1 FROM custom_foods WHERE key = ?", (key,)).fetchone() or key in FOOD_DB:
        key = f"{base_key}_{counter}"
        counter += 1

    conn.execute(
        """INSERT INTO custom_foods (key, display_name, calories, protein, carbs, fats)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (key, display_name, calories, protein, carbs, fats)
    )
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Custom food created",
        "food": {
            "key": key,
            "name": f"⭐ {display_name} (Custom)",
            "display_name": display_name,
            "is_custom": True,
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fats": fats
        }
    }), 201


# ══════════════════════════════════════════════
#  DELETE /api/foods/<key>  –  delete a custom food item
# ══════════════════════════════════════════════
@app.route("/api/foods/<string:food_key>", methods=["DELETE"])
def delete_custom_food(food_key):
    conn = get_connection()
    res = conn.execute("DELETE FROM custom_foods WHERE key = ?", (food_key,))
    conn.commit()
    conn.close()

    if res.rowcount == 0:
        return jsonify({"error": "Custom food not found"}), 404
    return jsonify({"message": "Custom food deleted"})


# ══════════════════════════════════════════════
#  GET /api/meals  –  return today's meals
# ══════════════════════════════════════════════
@app.route("/api/meals", methods=["GET"])
def get_meals():
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM meals WHERE date = ? ORDER BY id ASC",
        (today(),)
    ).fetchall()
    conn.close()
    meals = [dict(row) for row in rows]
    return jsonify(meals)


# ══════════════════════════════════════════════
#  POST /api/meals  –  log a new meal
# ══════════════════════════════════════════════
@app.route("/api/meals", methods=["POST"])
def add_meal():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    portion = data.get("portion_grams")
    if not portion or float(portion) <= 0:
        return jsonify({"error": "portion_grams must be a positive number"}), 400

    # ── Path A: food from predefined DB or custom foods table ──
    if "food_key" in data:
        food_key = data["food_key"].lower().strip()
        if food_key in FOOD_DB:
            nutrition = calculate_nutrition(food_key, float(portion))
        else:
            conn = get_connection()
            cf = conn.execute("SELECT * FROM custom_foods WHERE key = ?", (food_key,)).fetchone()
            conn.close()
            if not cf:
                return jsonify({"error": f"Unknown food key: {food_key}"}), 400
            nutrition = calculate_nutrition_from_dict(dict(cf), float(portion))

    # ── Path B: fully custom nutrition (image-scan mock) ──
    elif "food_name" in data:
        nutrition = {
            "food_name": data["food_name"],
            "portion_grams": float(portion),
            "calories": float(data.get("calories", 0)),
            "protein": float(data.get("protein", 0)),
            "carbs": float(data.get("carbs", 0)),
            "fats": float(data.get("fats", 0)),
        }
    else:
        return jsonify({"error": "Provide either food_key or food_name"}), 400

    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO meals (food_name, portion_grams, calories, protein, carbs, fats, date)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            nutrition["food_name"],
            nutrition["portion_grams"],
            nutrition["calories"],
            nutrition["protein"],
            nutrition["carbs"],
            nutrition["fats"],
            today(),
        ),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({"message": "Meal added", "id": new_id, **nutrition}), 201


# ══════════════════════════════════════════════
#  DELETE /api/meals/<id>  –  remove a meal
# ══════════════════════════════════════════════
@app.route("/api/meals/<int:meal_id>", methods=["DELETE"])
def delete_meal(meal_id):
    conn = get_connection()
    result = conn.execute("DELETE FROM meals WHERE id = ?", (meal_id,))
    conn.commit()
    conn.close()

    if result.rowcount == 0:
        return jsonify({"error": "Meal not found"}), 404
    return jsonify({"message": "Meal deleted"})


import json
import copy

# ──────────────────────────────────────────────
#  Helper – fetch all goals merged with custom targets from DB
# ──────────────────────────────────────────────
def get_goals_dict() -> dict:
    conn = get_connection()
    row = conn.execute("SELECT custom_targets FROM settings WHERE id = 1").fetchone()
    conn.close()

    goals_data = copy.deepcopy(GOALS)

    if row and row["custom_targets"]:
        try:
            custom = json.loads(row["custom_targets"])
            for g_key, g_val in custom.items():
                if g_key in goals_data and isinstance(g_val, dict):
                    for field in ["calories", "protein", "carbs", "fats"]:
                        if field in g_val:
                            goals_data[g_key][field] = float(g_val[field])
        except Exception:
            pass

    return goals_data


# ══════════════════════════════════════════════
#  GET /api/goals  –  get available goals & custom targets
# ══════════════════════════════════════════════
@app.route("/api/goals", methods=["GET"])
def get_goals_route():
    return jsonify({
        "current_goal": get_current_goal(),
        "goals": get_goals_dict()
    })


# ══════════════════════════════════════════════
#  POST /api/goals/custom  –  update custom targets for goals
#  Body: { "targets": { "weight_loss": { "calories": 1600, ... } } }
#  Or { "targets": null } to reset to defaults
# ══════════════════════════════════════════════
@app.route("/api/goals/custom", methods=["POST"])
def update_custom_targets():
    data = request.get_json() or {}
    targets_payload = data.get("targets")

    conn = get_connection()
    if targets_payload is None:
        conn.execute("UPDATE settings SET custom_targets = NULL WHERE id = 1")
    else:
        conn.execute("UPDATE settings SET custom_targets = ? WHERE id = 1", (json.dumps(targets_payload),))
    conn.commit()
    conn.close()

    return jsonify({"message": "Goal targets updated", "goals": get_goals_dict()})


# ══════════════════════════════════════════════
#  GET /api/dashboard  –  daily totals + targets
# ══════════════════════════════════════════════
@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    goal_key = get_current_goal()
    all_goals = get_goals_dict()
    targets = all_goals.get(goal_key, GOALS["maintenance"])

    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM meals WHERE date = ?", (today(),)
    ).fetchall()
    conn.close()

    # Aggregate totals
    total_calories = sum(r["calories"] for r in rows)
    total_protein  = sum(r["protein"]  for r in rows)
    total_carbs    = sum(r["carbs"]    for r in rows)
    total_fats     = sum(r["fats"]     for r in rows)

    def pct(consumed, target):
        """Percentage consumed, capped at 100 for display."""
        if target == 0:
            return 0
        return min(round((consumed / target) * 100, 1), 100)

    return jsonify({
        "goal": goal_key,
        "goal_label": targets["label"],
        "totals": {
            "calories": round(total_calories, 1),
            "protein":  round(total_protein,  1),
            "carbs":    round(total_carbs,    1),
            "fats":     round(total_fats,     1),
        },
        "targets": {
            "calories": targets["calories"],
            "protein":  targets["protein"],
            "carbs":    targets["carbs"],
            "fats":     targets["fats"],
        },
        "remaining": {
            "calories": round(targets["calories"] - total_calories, 1),
        },
        "percentages": {
            "calories": pct(total_calories, targets["calories"]),
            "protein":  pct(total_protein,  targets["protein"]),
            "carbs":    pct(total_carbs,    targets["carbs"]),
            "fats":     pct(total_fats,     targets["fats"]),
        },
        "exceeded": total_calories > targets["calories"],
    })


# ══════════════════════════════════════════════
#  POST /api/goal  –  update the fitness goal
#  Body: { "goal": "weight_loss" }
# ══════════════════════════════════════════════
@app.route("/api/goal", methods=["POST"])
def set_goal():
    data = request.get_json()
    new_goal = data.get("goal", "").strip()

    if new_goal not in GOALS:
        valid = list(GOALS.keys())
        return jsonify({"error": f"Invalid goal. Choose from {valid}"}), 400

    conn = get_connection()
    conn.execute("UPDATE settings SET goal = ? WHERE id = 1", (new_goal,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Goal updated", "goal": new_goal})


# ──────────────────────────────────────────────
#  Entry point
# ──────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
