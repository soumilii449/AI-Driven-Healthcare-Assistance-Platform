"""
Emergency Alert Assistance
==========================

Everything needed to power the Emergency feature:

  1. FIRST_AID_DATA        - static first-aid guide, grouped by severity
                              (minor -> critical), each with steps to take.
  2. EMERGENCY_CONTACTS    - national helpline numbers (India).
  3. fetch_nearby_facilities() - proxies Google Places API (New) so the
                              browser key never has to touch the frontend
                              bundle and so we can normalize the response.

Set GOOGLE_MAPS_API_KEY in the backend .env to enable nearby-facility
lookups. Without it, /emergency/nearby-facilities returns a clear error
telling the operator what to configure, instead of crashing.
"""

import os
import requests


# ============================================================
# FIRST AID GUIDE (static, works fully offline)
# ============================================================
#
# Four severity tiers, each with a color, a one-line description used by
# the frontend, and a list of conditions with concrete steps.

FIRST_AID_DATA = [
    {
        "id": "minor",
        "level": 1,
        "title": "Minor - Self Care",
        "color": "success",
        "summary": "Can usually be treated at home. Watch for it getting worse.",
        "conditions": [
            {
                "name": "Small cuts & scrapes",
                "steps": [
                    "Wash your hands before touching the wound.",
                    "Rinse the cut under clean running water to remove dirt.",
                    "Apply gentle pressure with a clean cloth to stop any bleeding.",
                    "Apply an antiseptic and cover with a clean bandage.",
                    "Change the bandage daily and watch for redness or pus.",
                ],
            },
            {
                "name": "Minor burns (redness, no blisters)",
                "steps": [
                    "Hold the burn under cool (not ice-cold) running water for 10-20 minutes.",
                    "Remove rings or tight clothing near the burn before it swells.",
                    "Do not apply butter, oil, or ice directly to the burn.",
                    "Cover loosely with a clean, non-stick dressing.",
                    "Take a paracetamol if there is pain, following the label dose.",
                ],
            },
            {
                "name": "Bruises",
                "steps": [
                    "Apply a cold pack wrapped in cloth for 15-20 minutes.",
                    "Rest and elevate the bruised area if possible.",
                    "Repeat the cold pack every few hours for the first day.",
                ],
            },
            {
                "name": "Mild headache or common cold",
                "steps": [
                    "Rest and stay hydrated with water or warm fluids.",
                    "A mild pain reliever can help if needed, per the label dose.",
                    "See a doctor if it lasts more than 3 days or keeps returning.",
                ],
            },
        ],
    },
    {
        "id": "moderate",
        "level": 2,
        "title": "Moderate - See a Doctor Soon",
        "color": "warning",
        "summary": "Needs medical attention within the next day. Not an emergency yet.",
        "conditions": [
            {
                "name": "Sprains & muscle strains",
                "steps": [
                    "Follow R.I.C.E: Rest, Ice, Compression, Elevation.",
                    "Apply an ice pack wrapped in cloth for 15-20 minutes, every few hours.",
                    "Wrap firmly (not tightly) with a bandage for support.",
                    "Avoid putting weight on it and see a doctor if swelling is severe.",
                ],
            },
            {
                "name": "Moderate burns (small blisters)",
                "steps": [
                    "Cool the burn under running water for at least 20 minutes.",
                    "Do not pop any blisters.",
                    "Cover with a clean, non-stick dressing.",
                    "See a doctor within 24 hours, sooner if it covers a large area.",
                ],
            },
            {
                "name": "High fever (adult, above 102°F / 39°C)",
                "steps": [
                    "Keep hydrated with water, ORS, or fluids.",
                    "Use a fever-reducing medicine per the label dose.",
                    "Use a lukewarm sponge to help bring the temperature down.",
                    "See a doctor if the fever lasts more than 2 days or comes with a rash.",
                ],
            },
            {
                "name": "Mild allergic reaction (rash, itching, no breathing trouble)",
                "steps": [
                    "Remove or avoid the trigger if it's known (food, insect, plant).",
                    "An antihistamine can help with itching and rash, per the label dose.",
                    "Watch closely for at least an hour for worsening symptoms.",
                    "Seek care immediately if breathing becomes difficult (see Critical).",
                ],
            },
            {
                "name": "Animal or insect bite (skin broken, no heavy bleeding)",
                "steps": [
                    "Wash the wound thoroughly with soap and water for several minutes.",
                    "Apply an antiseptic and cover with a clean bandage.",
                    "See a doctor promptly — a tetanus or rabies shot may be needed.",
                ],
            },
        ],
    },
    {
        "id": "serious",
        "level": 3,
        "title": "Serious - Go to Hospital Now",
        "color": "warm",
        "summary": "Get to an emergency room. Do not wait it out at home.",
        "conditions": [
            {
                "name": "Deep cut that won't stop bleeding",
                "steps": [
                    "Apply firm, direct pressure with a clean cloth or bandage.",
                    "Keep pressing without lifting the cloth to check — add more layers instead.",
                    "Raise the injured area above heart level if possible.",
                    "Get to the nearest hospital or emergency room right away.",
                ],
            },
            {
                "name": "Suspected broken bone or fracture",
                "steps": [
                    "Do not try to straighten or realign the limb.",
                    "Immobilize it gently with a splint, rolled cloth, or magazine.",
                    "Apply a cold pack over (not directly on) the area to reduce swelling.",
                    "Get to a hospital — avoid moving the person more than necessary.",
                ],
            },
            {
                "name": "Burn larger than a palm, or on face/hands/joints",
                "steps": [
                    "Cool the burn under running water for 20 minutes if possible.",
                    "Cover loosely with a clean, non-stick cloth — do not use cotton wool.",
                    "Do not apply creams, oils, or ice.",
                    "Go to a hospital immediately.",
                ],
            },
            {
                "name": "First-time seizure, now alert and breathing normally",
                "steps": [
                    "Clear the area of anything the person could hit.",
                    "Cushion their head and turn them gently onto their side.",
                    "Do not put anything in their mouth or restrain their movements.",
                    "Once it stops, get them to a hospital for evaluation.",
                ],
            },
        ],
    },
    {
        "id": "critical",
        "level": 4,
        "title": "Critical - Call an Ambulance Immediately",
        "color": "error",
        "summary": "Life-threatening. Call emergency services now — every minute matters.",
        "conditions": [
            {
                "name": "Chest pain / suspected heart attack",
                "steps": [
                    "Call an ambulance immediately — do not drive them yourself if avoidable.",
                    "Have the person sit down and rest in a comfortable position.",
                    "Loosen tight clothing.",
                    "If they carry prescribed heart medication (e.g. aspirin/nitroglycerin), help them take it.",
                    "Begin CPR if they become unresponsive and stop breathing normally.",
                ],
            },
            {
                "name": "Signs of stroke (face droop, arm weakness, slurred speech)",
                "steps": [
                    "Call an ambulance immediately and note the time symptoms started.",
                    "Keep the person still and calm; do not give food, water, or medicine.",
                    "If they are unconscious but breathing, place them in the recovery position.",
                ],
            },
            {
                "name": "Choking, person cannot cough, speak, or breathe",
                "steps": [
                    "Give 5 sharp back blows between the shoulder blades.",
                    "If that doesn't clear it, give 5 abdominal thrusts (Heimlich maneuver).",
                    "Repeat the cycle and call an ambulance if the object doesn't dislodge quickly.",
                    "Begin CPR if the person becomes unresponsive.",
                ],
            },
            {
                "name": "Severe bleeding that won't stop",
                "steps": [
                    "Call an ambulance immediately.",
                    "Apply continuous, firm direct pressure with the cleanest material available.",
                    "Keep the injured area raised above the heart if possible.",
                    "Do not remove an embedded object — pad around it instead.",
                ],
            },
            {
                "name": "Unconscious and not breathing normally",
                "steps": [
                    "Call an ambulance immediately, or have someone else call while you help.",
                    "Begin CPR: 30 chest compressions followed by 2 rescue breaths, repeated.",
                    "Continue until emergency responders arrive or the person recovers.",
                ],
            },
            {
                "name": "Severe allergic reaction (anaphylaxis) — swelling, breathing trouble",
                "steps": [
                    "Call an ambulance immediately.",
                    "If they have an epinephrine auto-injector, help them use it right away.",
                    "Keep them lying down with legs raised, unless they are vomiting or struggling to breathe.",
                    "Be ready to begin CPR if they stop breathing.",
                ],
            },
            {
                "name": "Major accident / severe trauma",
                "steps": [
                    "Call an ambulance immediately.",
                    "Do not move the person unless they are in immediate danger (e.g. fire, traffic).",
                    "Control any visible severe bleeding with direct pressure.",
                    "Keep them still, warm, and reassured until help arrives.",
                ],
            },
        ],
    },
]


# ============================================================
# EMERGENCY CONTACT NUMBERS (India)
# ============================================================

EMERGENCY_CONTACTS = [
    {
        "label": "National Emergency Number",
        "number": "112",
        "description": "Unified number for police, fire, and medical emergencies across India.",
    },
    {
        "label": "Ambulance",
        "number": "108",
        "description": "Free emergency ambulance service, available in most states.",
    },
    {
        "label": "Ambulance (Alternate)",
        "number": "102",
        "description": "Free ambulance service, commonly used for maternal & child emergencies.",
    },
    {
        "label": "Police",
        "number": "100",
        "description": "Police control room.",
    },
    {
        "label": "Fire",
        "number": "101",
        "description": "Fire brigade.",
    },
    {
        "label": "Women's Helpline",
        "number": "1091",
        "description": "National helpline for women in distress.",
    },
    {
        "label": "Poison Control / NPIC",
        "number": "1800-116-117",
        "description": "National Poisons Information Centre, AIIMS New Delhi.",
    },
    {
        "label": "Mental Health Helpline (Tele-MANAS)",
        "number": "14416",
        "description": "24x7 government mental health support and counselling helpline.",
    },
]


# ============================================================
# GOOGLE PLACES (New) — NEARBY FACILITY LOOKUP
# ============================================================

PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"

# Facility filter -> Google Places "included type" list.
FACILITY_TYPE_MAP = {
    "hospital": ["hospital", "emergency_room"],
    "clinic": ["doctor", "medical_lab"],
    "pharmacy": ["pharmacy", "drugstore"],
    "ambulance": ["hospital"],  # ambulances are dispatched via hospitals in most areas
}

FIELD_MASK = ",".join(
    [
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.rating",
        "places.currentOpeningHours.openNow",
        "places.googleMapsUri",
    ]
)


class NearbyFacilitiesError(Exception):
    """Raised when the nearby-facilities lookup can't be completed."""


def fetch_nearby_facilities(
    latitude: float,
    longitude: float,
    facility_type: str = "hospital",
    radius_meters: int = 5000,
    max_results: int = 15,
):
    """
    Look up nearby healthcare facilities using the Google Places API (New).

    Returns a list of normalized facility dicts. Raises NearbyFacilitiesError
    with a human-readable message if the API key is missing or the request
    fails, so the API layer can turn that into a clean HTTP error.
    """

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "").strip()

    if not api_key:
        raise NearbyFacilitiesError(
            "GOOGLE_MAPS_API_KEY is not configured on the server. "
            "Add it to the backend .env file to enable nearby facility search."
        )

    included_types = FACILITY_TYPE_MAP.get(facility_type, ["hospital"])

    payload = {
        "includedTypes": included_types,
        "maxResultCount": max_results,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude,
                },
                "radius": min(radius_meters, 50000),
            }
        },
        "rankPreference": "DISTANCE",
    }

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }

    try:
        response = requests.post(
            PLACES_NEARBY_URL,
            json=payload,
            headers=headers,
            timeout=10,
        )
    except requests.RequestException as exc:
        raise NearbyFacilitiesError(f"Could not reach Google Places API: {exc}")

    if response.status_code != 200:
        raise NearbyFacilitiesError(
            f"Google Places API returned an error ({response.status_code}): "
            f"{response.text[:300]}"
        )

    data = response.json()
    places = data.get("places", [])

    facilities = []

    for place in places:
        location = place.get("location", {})

        facilities.append(
            {
                "name": place.get("displayName", {}).get("text", "Unknown"),
                "address": place.get("formattedAddress", ""),
                "latitude": location.get("latitude"),
                "longitude": location.get("longitude"),
                "phone": (
                    place.get("nationalPhoneNumber")
                    or place.get("internationalPhoneNumber")
                    or ""
                ),
                "rating": place.get("rating"),
                "open_now": (
                    place.get("currentOpeningHours", {}).get("openNow")
                    if place.get("currentOpeningHours")
                    else None
                ),
                "maps_url": place.get("googleMapsUri", ""),
                "distance_meters": _haversine_meters(
                    latitude, longitude, location.get("latitude"), location.get("longitude")
                ),
            }
        )

    facilities.sort(
        key=lambda f: (f["distance_meters"] if f["distance_meters"] is not None else float("inf"))
    )

    return facilities


def _haversine_meters(lat1, lon1, lat2, lon2):
    """Straight-line distance between two lat/lng points, in meters."""

    if lat2 is None or lon2 is None:
        return None

    from math import radians, sin, cos, sqrt, atan2

    earth_radius_m = 6371000

    phi1, phi2 = radians(lat1), radians(lat2)
    d_phi = radians(lat2 - lat1)
    d_lambda = radians(lon2 - lon1)

    a = sin(d_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(d_lambda / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return round(earth_radius_m * c)


def build_share_location_message(latitude: float, longitude: float, note: str = ""):
    """
    Build a plain-text message + Google Maps link a person can send over
    SMS/WhatsApp so someone else can find them. Used by the SOS and
    live-location-sharing features.
    """

    maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"

    message = "EMERGENCY - I need help. This is my current location: " + maps_link

    if note:
        message += f"\nNote: {note}"

    return {
        "maps_link": maps_link,
        "message": message,
    }
