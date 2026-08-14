# 🔥 CalorieTrack — Daily Macro Dashboard

A beginner-friendly full-stack web application to track your daily calorie intake and macronutrients (protein, carbs, fats) against a personalised fitness goal.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [How to Run](#how-to-run)
4. [Architecture Overview](#architecture-overview)
5. [Database Design](#database-design)
6. [Backend Logic (Flask)](#backend-logic-flask)
7. [Frontend Logic (React)](#frontend-logic-react)
8. [User Flow](#user-flow)
9. [API Reference](#api-reference)
10. [Fitness Goals & Targets](#fitness-goals--targets)
11. [Food Database](#food-database)
12. [Mock AI Image Scanner](#mock-ai-image-scanner)
13. [How Everything Connects](#how-everything-connects)

---

## Tech Stack

| Layer    | Technology        | Why                                              |
|----------|-------------------|--------------------------------------------------|
| Frontend | React 18 + Vite   | Fast, component-based UI with hot-reload dev server |
| Backend  | Python Flask      | Lightweight REST API, easy to read and extend    |
| Database | SQLite            | Zero-config, file-based, perfect for local apps  |
| Styling  | Vanilla CSS       | No framework overhead, full design control       |
| HTTP     | `fetch()` API     | Built into the browser, no extra libraries needed |

---

## Project Structure

```
calorie-tracker/
│
├── backend/
│   ├── app.py           ← Flask app: all API routes live here
│   ├── database.py      ← SQLite connection helper + table creation
│   ├── models.py        ← Food database, goal targets, nutrition calculator
│   ├── requirements.txt ← Python dependencies (flask, flask-cors)
│   └── calorie_tracker.db  ← SQLite database file (auto-created on first run)
│
├── frontend/
│   ├── index.html       ← HTML entry point, loads Inter font
│   ├── vite.config.js   ← Vite config + proxy rule (/api → Flask)
│   ├── package.json     ← Node dependencies
│   └── src/
│       ├── main.jsx     ← Mounts the React app into #root
│       ├── App.jsx      ← Root component, owns all global state
│       ├── App.css      ← Full design system (dark mode, animations)
│       ├── api.js       ← All fetch() calls to the Flask backend
│       └── components/
│           ├── Dashboard.jsx    ← Calorie + macro progress bars + exceeded modal
│           ├── GoalSelector.jsx ← Fitness goal dropdown in the header
│           ├── FoodForm.jsx     ← Food logging form + image scan mock
│           ├── MealList.jsx     ← Today's meal table with delete buttons
│           └── ProgressBar.jsx  ← Reusable animated progress bar
│
└── README.md
```

---

## How to Run

### Prerequisites
- Python 3.9+
- Node.js 18+

### 1 — Install backend dependencies

```bash
cd calorie-tracker/backend
pip install -r requirements.txt
```

### 2 — Start the Flask backend

```bash
# Still inside the backend/ folder
python app.py
```

Flask starts on **http://127.0.0.1:5000**

> The SQLite database file `calorie_tracker.db` is created automatically on the first run.

### 3 — Install frontend dependencies

```bash
cd calorie-tracker/frontend
npm install
```

### 4 — Start the React frontend

```bash
npm run dev
```

Vite starts on **http://localhost:3000**

> Open **http://localhost:3000** in your browser. Keep both terminals running.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (port 3000)                       │
│                                                             │
│   React App                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │Dashboard │  │FoodForm  │  │MealList  │  │GoalSelec.│  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│          │fetch /api/*            │                         │
└──────────│────────────────────────│─────────────────────────┘
           │                        │
           ▼  Vite Dev Proxy        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Flask Backend (port 5000)                   │
│                                                             │
│   app.py  ──►  models.py  ──►  database.py                  │
│   (routes)     (food DB,       (SQL queries,                │
│                 goal logic,     SQLite conn)                 │
│                 nutrition calc)                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              SQLite Database  (calorie_tracker.db)           │
│                                                             │
│    meals table          settings table                      │
│    ─────────────        ───────────────                     │
│    id, food_name,       id, goal                            │
│    portion_grams,                                           │
│    calories, protein,                                       │
│    carbs, fats, date                                        │
└─────────────────────────────────────────────────────────────┘
```

**Key design decision:** Vite's built-in proxy forwards every `/api/*` request from the browser to Flask. This means React never talks to Flask directly — it just calls `/api/meals` and the proxy does the rest. No CORS configuration is needed in the browser; CORS headers are added by Flask for completeness.

---

## Database Design

The database lives in `backend/calorie_tracker.db` and is created automatically by `database.py` when Flask starts.

### `meals` table

Stores every food item logged by the user.

| Column         | Type    | Description                             |
|----------------|---------|-----------------------------------------|
| `id`           | INTEGER | Auto-incrementing primary key           |
| `food_name`    | TEXT    | Display name (e.g. "Chicken Breast")    |
| `portion_grams`| REAL    | How many grams the user ate             |
| `calories`     | REAL    | Calculated: `cal_per_100g × portion/100`|
| `protein`      | REAL    | Calculated protein in grams             |
| `carbs`        | REAL    | Calculated carbs in grams               |
| `fats`         | REAL    | Calculated fats in grams                |
| `date`         | TEXT    | Date string `YYYY-MM-DD` (today's date) |

> **Why store calculated values?** So queries can simply `SUM(calories)` without re-running the formula every time. Calculations happen once at insert time in Flask.

### `settings` table

A single-row table that persists the user's current fitness goal across page refreshes.

| Column | Type    | Description                                            |
|--------|---------|--------------------------------------------------------|
| `id`   | INTEGER | Always `1` — only one row ever exists                  |
| `goal` | TEXT    | `"weight_loss"`, `"maintenance"`, or `"muscle_gain"`   |

> On first run, the row is seeded with `goal = "maintenance"` by `init_db()`.

### How data is filtered to "today"

Every query that reads meals uses `WHERE date = ?` with today's date string:

```python
date.today().isoformat()   # → "2026-08-14"
```

This means yesterday's meals are never deleted — they just don't appear on the current day's dashboard or history.

---

## Backend Logic (Flask)

All backend code lives in three files:

### `database.py` — Connection & Setup

```
get_connection()  →  Opens a new SQLite connection.
                     Sets row_factory = sqlite3.Row so rows
                     behave like dictionaries (row["calories"]).

init_db()         →  Called once at startup.
                     Creates the meals and settings tables
                     if they don't exist yet.
                     Seeds the settings row with "maintenance".
```

### `models.py` — Business Data

```
FOOD_DB     →  Dictionary of 8 foods, each with nutrition
               values per 100 g (calories, protein, carbs, fats).

GOALS       →  Dictionary of 3 fitness goals, each defining
               daily calorie and macro targets.

calculate_nutrition(food_key, portion_grams)
            →  Looks up the food in FOOD_DB and applies:
               value = value_per_100g × portion / 100
               Returns a dict with all calculated values.
```

### `app.py` — API Routes

Each route is a small, focused function:

```
GET  /api/foods      →  Returns list of {key, name} for the dropdown.

GET  /api/meals      →  SELECTs all meals WHERE date = today.

POST /api/meals      →  Accepts either:
                         - { food_key, portion_grams }  → looks up FOOD_DB
                         - { food_name, portion_grams, calories,
                             protein, carbs, fats }      → custom (scan mock)
                        Calls calculate_nutrition(), INSERTs into DB.

DELETE /api/meals/id →  DELETEs the meal row with the given id.

GET  /api/dashboard  →  SUMs calories/protein/carbs/fats for today.
                        Looks up goal targets from GOALS[current_goal].
                        Returns totals, targets, percentages, remaining,
                        and an exceeded boolean flag.

POST /api/goal       →  UPDATEs the settings row to the new goal key.
                        Does NOT touch the meals table.
```

---

## Frontend Logic (React)

### State lives in `App.jsx`

The root component owns four pieces of state:

| State       | Type    | What it holds                               |
|-------------|---------|---------------------------------------------|
| `dashboard` | object  | Response from `GET /api/dashboard`          |
| `meals`     | array   | Response from `GET /api/meals`              |
| `foods`     | array   | Response from `GET /api/foods` (loaded once)|
| `goal`      | string  | Active goal key, mirrors `dashboard.goal`   |

### The `refresh()` function

This is the central update mechanism. It calls `getDashboard()` and `getMeals()` in parallel and updates all state at once:

```js
const refresh = useCallback(async () => {
  const [dash, mealList] = await Promise.all([getDashboard(), getMeals()]);
  setDashboard(dash);
  setMeals(mealList);
  setGoal(dash.goal);
}, []);
```

Every component that can change data (add meal, delete meal, change goal) receives `refresh` as a callback prop (`onMealAdded`, `onMealDeleted`, `onGoalChange`). After their API call succeeds, they call `refresh()` so the entire UI updates in one shot.

### `api.js` — All fetch() calls

All network code is isolated in `api.js`. Components never call `fetch()` directly — they import named functions:

```js
getMeals()                                  // GET /api/meals
addMealByKey(foodKey, portionGrams)         // POST /api/meals
addMealCustom(name, portion, cal, p, c, f)  // POST /api/meals (scan)
deleteMeal(id)                              // DELETE /api/meals/:id
getDashboard()                              // GET /api/dashboard
setGoal(goal)                               // POST /api/goal
getFoods()                                  // GET /api/foods
```

### Component Responsibilities

| Component        | What it does                                                         |
|------------------|----------------------------------------------------------------------|
| `App.jsx`        | Owns state, orchestrates data fetching, renders the layout           |
| `GoalSelector`   | Renders the goal `<select>`, calls `setGoal()` API, then `refresh()` |
| `Dashboard`      | Displays stat pills, progress bars, triggers the exceeded modal      |
| `ProgressBar`    | Dumb display component — receives numbers, renders animated bar      |
| `FoodForm`       | Manages form state locally, submits via `addMealByKey()`, calls `onMealAdded` |
| `MealList`       | Maps over `meals` array, calls `deleteMeal()` per row, calls `onMealDeleted` |

---

## User Flow

### Flow 1 — Logging a meal

```
1. User opens the app
   └─► App.jsx calls getDashboard() + getMeals() + getFoods()
       └─► Dashboard renders at 0 kcal consumed

2. User selects "Chicken Breast" from the dropdown, types "200" grams

3. User clicks "➕ Add Food"
   └─► FoodForm calls addMealByKey("chicken", 200)
       └─► POST /api/meals  { food_key: "chicken", portion_grams: 200 }
           └─► Flask looks up FOOD_DB["chicken"]:
               calories=165, protein=31, carbs=0, fats=3.6  (per 100g)
           └─► Calculates for 200g:
               calories = 165 × 200/100 = 330 kcal
               protein  = 31  × 200/100 = 62 g
               carbs    = 0   × 200/100 = 0 g
               fats     = 3.6 × 200/100 = 7.2 g
           └─► INSERTs row into meals table with date = today
           └─► Returns 201 Created

4. FoodForm calls onMealAdded() → refresh()
   └─► Dashboard re-fetches: shows 330 kcal, bars animate up
   └─► MealList re-fetches: shows "Chicken Breast | 200g | 330kcal | …"
```

### Flow 2 — Exceeding the daily budget

```
1. User keeps logging food until total calories > goal target

2. GET /api/dashboard returns { exceeded: true, ... }

3. Dashboard.jsx detects exceeded === true via useEffect
   └─► Sets showModal = true
   └─► Modal appears: "🚨 Daily Budget Exceeded!"
   └─► Calorie progress bar turns crimson/red
   └─► "Over budget" stat pill turns red

4. User clicks "Got it" → modal closes
   (modal re-appears if more food is added while still over budget)
```

### Flow 3 — Changing the fitness goal

```
1. User opens the goal dropdown in the header
   └─► Selects "💪 Muscle Gain"

2. GoalSelector calls setGoal("muscle_gain")
   └─► POST /api/goal  { goal: "muscle_gain" }
       └─► Flask UPDATEs settings SET goal = "muscle_gain"
       └─► meals table is NOT touched — existing meals are preserved

3. GoalSelector calls onGoalChange() → refresh()
   └─► GET /api/dashboard now uses GOALS["muscle_gain"] targets:
       calories=2500, protein=180, carbs=300, fats=80
   └─► Progress percentages recalculate instantly
   └─► The goal badge in the header updates to "Muscle Gain"
```

### Flow 4 — Deleting a meal

```
1. User clicks 🗑️ next to a meal row

2. MealList calls deleteMeal(id)
   └─► DELETE /api/meals/3
       └─► Flask DELETEs the row WHERE id = 3
       └─► Returns 200 OK

3. MealList calls onMealDeleted() → refresh()
   └─► Dashboard re-fetches: calorie total drops, bars shrink back
   └─► If total is now under budget, exceeded flag clears (modal won't re-show)
   └─► MealList re-fetches: row disappears from the table
```

### Flow 5 — AI image scan (mock)

```
1. User clicks "📸 Scan Image"
   └─► Hidden <input type="file"> opens the file picker

2. User selects any image file

3. FoodForm waits 1.5 seconds (simulating AI processing)
   └─► Spinner shown: "AI is analysing your food image…"

4. A random mock result is picked from a preset list, e.g.:
   { food_name: "Grilled Chicken (Scanned)", portion: 180g,
     calories: 297, protein: 55.8, carbs: 0, fats: 6.5 }

5. Result card appears with all nutrition details

6. User clicks "✅ Log This Meal"
   └─► addMealCustom() sends the pre-filled values to POST /api/meals
       └─► Flask stores them directly (no food_key lookup needed)
   └─► refresh() updates the dashboard and meal list
```

---

## API Reference

### `GET /api/foods`
Returns the list of available foods for the dropdown.

**Response:**
```json
[
  { "key": "chicken", "name": "Chicken Breast" },
  { "key": "rice",    "name": "Rice (cooked)"  }
]
```

---

### `GET /api/meals`
Returns today's logged meals.

**Response:**
```json
[
  {
    "id": 1,
    "food_name": "Chicken Breast",
    "portion_grams": 200,
    "calories": 330.0,
    "protein": 62.0,
    "carbs": 0.0,
    "fats": 7.2,
    "date": "2026-08-14"
  }
]
```

---

### `POST /api/meals`
Logs a new meal. Two accepted formats:

**Option A — from food database:**
```json
{ "food_key": "chicken", "portion_grams": 200 }
```

**Option B — custom values (image scan):**
```json
{
  "food_name": "Grilled Chicken (Scanned)",
  "portion_grams": 180,
  "calories": 297,
  "protein": 55.8,
  "carbs": 0,
  "fats": 6.5
}
```

**Response:** `201 Created` with the inserted nutrition values.

---

### `DELETE /api/meals/<id>`
Deletes a single meal by its database id.

**Response:** `200 OK` `{ "message": "Meal deleted" }`

---

### `GET /api/dashboard`
Returns all data needed to render the dashboard.

**Response:**
```json
{
  "goal": "maintenance",
  "goal_label": "Maintenance",
  "totals":      { "calories": 330, "protein": 62, "carbs": 0, "fats": 7.2 },
  "targets":     { "calories": 2000, "protein": 100, "carbs": 250, "fats": 65 },
  "remaining":   { "calories": 1670 },
  "percentages": { "calories": 16.5, "protein": 62.0, "carbs": 0.0, "fats": 11.1 },
  "exceeded": false
}
```

---

### `POST /api/goal`
Changes the active fitness goal. **Does not delete meals.**

**Request:** `{ "goal": "weight_loss" }`

**Response:** `200 OK` `{ "message": "Goal updated", "goal": "weight_loss" }`

---

## Fitness Goals & Targets

| Goal         | Calories | Protein | Carbs | Fats |
|--------------|----------|---------|-------|------|
| Weight Loss  | 1500 kcal| 120 g   | 150 g | 50 g |
| Maintenance  | 2000 kcal| 100 g   | 250 g | 65 g |
| Muscle Gain  | 2500 kcal| 180 g   | 300 g | 80 g |

These values are defined in `backend/models.py` in the `GOALS` dictionary and can be freely adjusted.

---

## Food Database

All values are **per 100 grams**, defined in `backend/models.py`:

| Food            | Calories | Protein | Carbs  | Fats  |
|-----------------|----------|---------|--------|-------|
| Rice (cooked)   | 130 kcal | 2.7 g   | 28.2 g | 0.3 g |
| Chicken Breast  | 165 kcal | 31.0 g  | 0.0 g  | 3.6 g |
| Egg (whole)     | 155 kcal | 13.0 g  | 1.1 g  | 11.0 g|
| Banana          | 89 kcal  | 1.1 g   | 22.8 g | 0.3 g |
| Milk (whole)    | 61 kcal  | 3.2 g   | 4.8 g  | 3.3 g |
| Paneer          | 265 kcal | 18.3 g  | 1.2 g  | 20.8 g|
| Oats            | 389 kcal | 16.9 g  | 66.3 g | 6.9 g |
| Apple           | 52 kcal  | 0.3 g   | 14.0 g | 0.2 g |

**To add a new food**, add a new entry to `FOOD_DB` in `models.py`:
```python
"salmon": {
    "display_name": "Salmon",
    "calories": 208,
    "protein": 20.4,
    "carbs": 0.0,
    "fats": 13.4,
},
```

---

## Mock AI Image Scanner

The image scanner **does not use a real AI model**. Here is exactly what happens:

1. The user clicks "📸 Scan Image" — a hidden `<input type="file">` opens.
2. The user picks any image (it is never read or uploaded).
3. `FoodForm.jsx` waits **1.5 seconds** (`setTimeout`) to simulate processing.
4. A result is picked **randomly** from a hardcoded list of 5 mock meals.
5. The result card is shown with nutrition values pre-filled.
6. If the user clicks "✅ Log This Meal", the values are sent to `POST /api/meals` using the custom (Option B) format.

To swap in a real AI service later, replace the `handleFileChange` function in `FoodForm.jsx` with a call to a vision API (e.g. Google Cloud Vision, OpenAI GPT-4o), then populate the result card with the API's response.

---

## How Everything Connects

```
User Action                 React Component       API Call              Flask Route        Database
───────────────────────────────────────────────────────────────────────────────────────────────────
Page loads               →  App.jsx               getDashboard()     →  GET /api/dashboard  → SELECT SUM
                                                   getMeals()         →  GET /api/meals      → SELECT
                                                   getFoods()         →  GET /api/foods      → (in-memory)

Select food + portion    →  FoodForm.jsx           (local state only, no API call yet)

Click "Add Food"         →  FoodForm.jsx           addMealByKey()     →  POST /api/meals     → INSERT
                            calls onMealAdded()
                            → refresh()            getDashboard()     →  GET /api/dashboard  → SELECT SUM
                                                   getMeals()         →  GET /api/meals      → SELECT

Click 🗑️ delete         →  MealList.jsx           deleteMeal(id)     →  DELETE /api/meals/:id → DELETE
                            calls onMealDeleted()
                            → refresh()            getDashboard()     →  GET /api/dashboard  → SELECT SUM
                                                   getMeals()         →  GET /api/meals      → SELECT

Change goal dropdown     →  GoalSelector.jsx       setGoal()          →  POST /api/goal      → UPDATE settings
                            calls onGoalChange()
                            → refresh()            getDashboard()     →  GET /api/dashboard  → SELECT SUM
                                                                          (uses new targets)

Upload image             →  FoodForm.jsx           (1.5s mock delay, random result, no API)
Confirm scan result      →  FoodForm.jsx           addMealCustom()    →  POST /api/meals     → INSERT
                            calls onMealAdded()
                            → refresh()            getDashboard()     →  GET /api/dashboard  → SELECT SUM
                                                   getMeals()         →  GET /api/meals      → SELECT
```
