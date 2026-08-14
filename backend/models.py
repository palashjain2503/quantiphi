# ─────────────────────────────────────────────
#  Predefined food database  (per 100 g)
# ─────────────────────────────────────────────
FOOD_DB = {
    "rice": {
        "display_name": "Rice (cooked)",
        "calories": 130,
        "protein": 2.7,
        "carbs": 28.2,
        "fats": 0.3,
    },
    "chicken": {
        "display_name": "Chicken Breast",
        "calories": 165,
        "protein": 31.0,
        "carbs": 0.0,
        "fats": 3.6,
    },
    "egg": {
        "display_name": "Egg (whole)",
        "calories": 155,
        "protein": 13.0,
        "carbs": 1.1,
        "fats": 11.0,
    },
    "banana": {
        "display_name": "Banana",
        "calories": 89,
        "protein": 1.1,
        "carbs": 22.8,
        "fats": 0.3,
    },
    "milk": {
        "display_name": "Milk (whole)",
        "calories": 61,
        "protein": 3.2,
        "carbs": 4.8,
        "fats": 3.3,
    },
    "paneer": {
        "display_name": "Paneer",
        "calories": 265,
        "protein": 18.3,
        "carbs": 1.2,
        "fats": 20.8,
    },
    "oats": {
        "display_name": "Oats",
        "calories": 389,
        "protein": 16.9,
        "carbs": 66.3,
        "fats": 6.9,
    },
    "apple": {
        "display_name": "Apple",
        "calories": 52,
        "protein": 0.3,
        "carbs": 14.0,
        "fats": 0.2,
    },
}

# ─────────────────────────────────────────────
#  Fitness goal definitions
# ─────────────────────────────────────────────
GOALS = {
    "weight_loss": {
        "label": "Weight Loss",
        "calories": 1500,
        "protein": 120,   # grams
        "carbs":   150,   # grams
        "fats":    50,    # grams
    },
    "maintenance": {
        "label": "Maintenance",
        "calories": 2000,
        "protein": 100,
        "carbs":   250,
        "fats":    65,
    },
    "muscle_gain": {
        "label": "Muscle Gain",
        "calories": 2500,
        "protein": 180,
        "carbs":   300,
        "fats":    80,
    },
}


def calculate_nutrition(food_key: str, portion_grams: float) -> dict:
    """
    Given a food key and portion in grams, return calculated nutrition values.
    All calculations: value = value_per_100g * portion / 100
    """
    food = FOOD_DB[food_key]
    return calculate_nutrition_from_dict(food, portion_grams)


def calculate_nutrition_from_dict(food: dict, portion_grams: float) -> dict:
    """
    Given a food dict (with display_name, calories, protein, carbs, fats)
    and portion in grams, return calculated nutrition values.
    """
    ratio = portion_grams / 100.0
    return {
        "food_name": food["display_name"],
        "portion_grams": portion_grams,
        "calories": round(food["calories"] * ratio, 1),
        "protein": round(food["protein"] * ratio, 1),
        "carbs": round(food["carbs"] * ratio, 1),
        "fats": round(food["fats"] * ratio, 1),
    }

