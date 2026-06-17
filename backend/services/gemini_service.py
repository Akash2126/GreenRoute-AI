"""
services/gemini_service.py - Google Gemini AI integration for GreenRoute AI

Uses the google-generativeai SDK with the free-tier gemini-1.5-flash model.
All functions are async-compatible and include graceful fallbacks when the
API key is missing or the API call fails.
"""

from __future__ import annotations

import os
from typing import Any

# ---------------------------------------------------------------------------
# Gemini SDK setup (lazy init)
# ---------------------------------------------------------------------------
_gemini_model = None
_gemini_init_attempted = False
GEMINI_MODEL_NAME = "gemini-1.5-flash"


def _get_model():
    """Lazily initialise the Gemini model (thread-safe enough for startup)."""
    global _gemini_model, _gemini_init_attempted
    if _gemini_init_attempted:
        return _gemini_model

    _gemini_init_attempted = True
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("[GeminiService] GEMINI_API_KEY not set – using fallback responses.")
        return None

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        print(f"[GeminiService] Gemini model '{GEMINI_MODEL_NAME}' ready.")
    except Exception as exc:
        print(f"[GeminiService] Failed to initialise Gemini SDK: {exc}")
        _gemini_model = None

    return _gemini_model


async def _call_gemini(prompt: str) -> str | None:
    """
    Fire a Gemini generate_content call and return the text.
    Returns None on any error.
    """
    model = _get_model()
    if model is None:
        return None

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as exc:
        print(f"[GeminiService] API call failed: {exc}")
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def explain_route_recommendation(
    routes: list[dict[str, Any]],
    selected: str,
) -> dict[str, Any]:
    """
    Generate a detailed AI Sustainability Advisor report comparing routes and explaining the recommendation.
    Returns a structured dictionary of recommendations, insights, and actions.
    """
    route_details = []
    for r in routes:
        r_type = r.get("route_type", r.get("type", "unknown")).capitalize()
        dist = r.get("distance_km", r.get("distance", "?"))
        time = r.get("travel_time_min", r.get("time", "?"))
        co2 = r.get("co2_kg", r.get("co2", "?"))
        fuel = r.get("fuel_l", r.get("fuel", "?"))
        score = r.get("ecoscore", r.get("ecoScore", "?"))
        veh = r.get("vehicle_type", "car_petrol")
        traffic = "High" if r_type.lower() == "fastest" else "Medium" if r_type.lower() == "shortest" else "Low"
        route_details.append(
            f"- **{r_type} Route**:\n"
            f"  - Distance: {dist} km\n"
            f"  - Duration: {time} min\n"
            f"  - Carbon Emissions: {co2} kg CO2\n"
            f"  - Fuel Consumption: {fuel} L\n"
            f"  - EcoScore: {score}/100\n"
            f"  - Vehicle: {veh}\n"
            f"  - Traffic Level: {traffic}"
        )
    routes_text = "\n".join(route_details)

    fallback = {
        "route_recommendation": f"The '{selected}' route is the recommended option as it offers the optimal balance between travel efficiency and environmental footprint.",
        "sustainability_insights": [
            "Eco-routing prioritizes roads with smoother traffic flow, reducing emissions.",
            "Higher speed profiles increase wind resistance and tailpipe output.",
            "Congestion segments result in high idle emissions; green routing bypasses these."
        ],
        "carbon_reduction_suggestions": [
            "Consider combining multiple errands into a single trip to reduce your footprint.",
            "Travel during off-peak hours to avoid heavy bumper-to-bumper traffic.",
            "Accelerate smoothly and keep speed stable to lower engine load."
        ],
        "fuel_saving_suggestions": [
            "Maintain a steady speed of 60-80 km/h for peak fuel efficiency.",
            "Limit excessive idling during short stops by switching off the engine.",
            "Verify tire inflation regularly; low pressure increases fuel burn by 3%."
        ],
        "alternative_transportation": [
            "🚶 Walking: Saves ~0.4 kg CO₂ per km. Ideal for trips under 2 km.",
            "🚴 Cycling: A clean, 0-emission alternative for short commuting.",
            "🚇 Metro/Bus: Greatly reduces personal per-commute emissions."
        ],
        "environmental_impact_summary": "By choosing the greenest route consistently, you contribute to local air quality improvements and reduce urban traffic congestion."
    }

    prompt = f"""You are the GreenRoute AI Sustainability Advisor, a highly intelligent eco-mobility routing system.
Analyze the following route options generated for this trip:
{routes_text}

The user has selected the '{selected}' route.
Generate a structured sustainability advice JSON object.
You must return ONLY the raw JSON object, with no markdown formatting and no backticks.
Format:
{{
    "route_recommendation": "A clear, concise analysis of why the '{selected}' route is recommended or how it compares to others. E.g. 'This route reduces carbon emissions by X% while increasing travel time by only Y minutes...'",
    "sustainability_insights": [
        "A list of 2-3 insights explaining why the routes differ in emissions and efficiency, explaining why a route is green, highlighting trade-offs, and detailing environmental benefits."
    ],
    "carbon_reduction_suggestions": [
        "A list of 2-3 actionable suggestions on how to further reduce carbon emissions for this trip."
    ],
    "fuel_saving_suggestions": [
        "A list of 2-3 suggestions on eco-driving habits or settings to maximize fuel savings for this specific vehicle type."
    ],
    "alternative_transportation": [
        "A list of 3 options: Walking, Cycling, and Metro/Public Transit, comparing their approximate environmental benefits."
    ],
    "environmental_impact_summary": "A 1-sentence summary statement of the total environmental impact and long-term sustainability benefits of making this choice."
}}
Do not use any placeholder text. Be highly specific, calculate exact percentages of carbon/fuel savings based on the data provided, and use a professional, motivating tone.
"""

    result = await _call_gemini(prompt)
    if result:
        import json
        try:
            cleaned = result.strip().strip("`").strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
            parsed = json.loads(cleaned)
            required_keys = [
                "route_recommendation",
                "sustainability_insights",
                "carbon_reduction_suggestions",
                "fuel_saving_suggestions",
                "alternative_transportation",
                "environmental_impact_summary"
            ]
            if all(k in parsed for k in required_keys):
                return parsed
        except Exception as e:
            print(f"[GeminiService] Failed to parse route advisor JSON: {e}. Raw: {result}")

    return fallback


async def get_digital_twin_advice(
    saved_co2: float,
    saved_fuel: float,
    horizon_days: int,
    avg_ecoscore: float,
) -> dict[str, Any]:
    """
    Generate Gemini AI sustainability comparison and behavioral recommendations
    for the Digital Twin simulator.
    """
    prompt = f"""You are the GreenRoute AI Digital Twin simulator assistant.
We are comparing:
- Scenario A (Status Quo): The user continues their current driving habits.
- Scenario B (GreenRoute): The user uses optimized green routes.

Over a {horizon_days}-day horizon, Scenario B is projected to achieve:
- Total Carbon Emissions Saved: {saved_co2} kg CO2
- Total Fuel Saved: {saved_fuel} Litres
- Average trip EcoScore: {avg_ecoscore}/100

Analyze these projections and generate a structured JSON object containing:
1. "comparison": A 2-sentence sustainability comparison between the scenarios.
2. "savings_summary": A 1-sentence summary of the carbon reduction and fuel savings benefits.
3. "recommendations": A list of exactly 4 personalized behavioral recommendations (e.g. "Switch to the Greenest route for your Noida commute to save X kg CO2 daily...").

Return ONLY the raw JSON object, with no markdown formatting and no backticks.
Format:
{{
    "comparison": "...",
    "savings_summary": "...",
    "recommendations": ["...", "...", "...", "..."]
}}
"""
    result = await _call_gemini(prompt)
    if result:
        import json
        try:
            cleaned = result.strip().strip("`").strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
            return json.loads(cleaned)
        except Exception as e:
            print(f"[GeminiService] Failed to parse digital twin advice JSON: {e}. Raw: {result}")
            
    return {
        "comparison": f"Choosing Scenario B (GreenRoute) would result in a substantial improvement in your overall mobility footprint over the next {horizon_days} days compared to your current driving pattern.",
        "savings_summary": f"By adopting optimized green routes, you are projected to reduce carbon emissions by {saved_co2} kg and save {saved_fuel} litres of fuel.",
        "recommendations": [
            f"Switch to the Greenest route for your frequent routes to save up to {(saved_co2/horizon_days):.2f} kg CO₂ daily.",
            "Avoid high-congestion rush hours when planning trips to decrease idling fuel burn by up to 15%.",
            f"Aim to keep your average EcoScore above 80/100 to maximize vehicle engine efficiency.",
            "Consider public transit or active transit modes for short trips under 3 km."
        ]
    }


async def get_climate_tips(user_stats: dict[str, Any]) -> list[str]:
    """
    Generate personalised sustainability tips based on user statistics.

    Args:
        user_stats: Dict with total_trips, total_co2_saved, avg_ecoscore, etc.

    Returns:
        List of 3-5 actionable tip strings.
    """
    prompt = (
        "You are a sustainability expert.\n"
        f"A user has the following travel stats:\n"
        f"- Total trips: {user_stats.get('total_trips', 0)}\n"
        f"- CO₂ saved: {user_stats.get('total_co2_saved', 0):.2f} kg\n"
        f"- Fuel saved: {user_stats.get('total_fuel_saved', 0):.2f} litres\n"
        f"- Average EcoScore: {user_stats.get('avg_ecoscore', 50):.1f}/100\n\n"
        "Give 4 short, personalised, actionable tips to further reduce the user's carbon footprint. "
        "Each tip should be a single sentence. Return them as a numbered list."
    )

    result = await _call_gemini(prompt)
    if result:
        # Parse numbered list
        lines = [
            line.strip().lstrip("0123456789.-) ").strip()
            for line in result.splitlines()
            if line.strip() and any(c.isalpha() for c in line)
        ]
        tips = [l for l in lines if len(l) > 10][:5]
        if tips:
            return tips

    # Fallback tips
    return [
        "Switch to carpooling or shared rides for your most frequent routes.",
        "Combine multiple errands into a single trip to reduce total distance.",
        "Consider an electric or hybrid vehicle for your next purchase.",
        "Use public transport for city-centre journeys where possible.",
        "Maintain optimal tyre pressure to improve fuel efficiency by up to 3%.",
    ]


async def analyze_route_comparison(
    route_a: dict[str, Any],
    route_b: dict[str, Any],
) -> str:
    """
    Provide a narrative comparison of two route options.

    Args:
        route_a: First route dict.
        route_b: Second route dict.

    Returns:
        Comparison paragraph as a string.
    """
    def _fmt(r: dict[str, Any]) -> str:
        return (
            f"{r.get('route_type', 'Route').capitalize()}: "
            f"{r.get('distance_km', '?')} km, "
            f"{r.get('travel_time_min', '?')} min, "
            f"CO₂ {r.get('co2_kg', '?')} kg, "
            f"EcoScore {r.get('ecoscore', '?')}/100"
        )

    prompt = (
        "Compare these two routes in 2 sentences from an environmental perspective:\n"
        f"Option 1 – {_fmt(route_a)}\n"
        f"Option 2 – {_fmt(route_b)}\n"
        "Highlight the trade-offs between time savings and carbon emissions."
    )

    result = await _call_gemini(prompt)
    if result:
        return result

    # Fallback
    co2_diff = abs(route_a.get("co2_kg", 0) - route_b.get("co2_kg", 0))
    time_diff = abs(route_a.get("travel_time_min", 0) - route_b.get("travel_time_min", 0))
    return (
        f"The two routes differ by {co2_diff:.2f} kg CO₂ and {time_diff:.0f} minutes. "
        "Choosing the lower-emission option contributes meaningfully to reducing your carbon footprint."
    )


async def generate_sustainability_insight(user_stats: dict[str, Any]) -> str:
    """
    Generate a personalised sustainability insight summary for the user's dashboard.

    Args:
        user_stats: User's aggregate stats dict.

    Returns:
        2-3 sentence insight paragraph.
    """
    prompt = (
        "You are GreenRoute AI, a sustainable transport assistant.\n"
        f"The user has saved {user_stats.get('total_co2_saved', 0):.2f} kg of CO₂ "
        f"across {user_stats.get('total_trips', 0)} eco-routed trips. "
        f"Their average EcoScore is {user_stats.get('avg_ecoscore', 50):.1f}/100.\n\n"
        "Write a 2-3 sentence personalised insight that acknowledges their progress, "
        "contextualises the CO₂ savings (e.g., tree equivalents), and motivates further action."
    )

    result = await _call_gemini(prompt)
    if result:
        return result

    # Fallback
    co2 = user_stats.get("total_co2_saved", 0)
    trees = max(1, int(co2 / 22))
    return (
        f"You've saved {co2:.1f} kg of CO₂ — equivalent to planting {trees} trees! "
        f"Your EcoScore of {user_stats.get('avg_ecoscore', 50):.0f}/100 puts you ahead of "
        "most commuters. Keep choosing eco-routes to amplify your climate impact."
    )
