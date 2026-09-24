"""
Healthcare Education Section
============================

Powers the "Health Education" feature:

  1. EDUCATION_TOPICS   - a curated library of commonly searched health
                          topics (relevant to rural community health),
                          each with a short summary (for cards) and full
                          structured content (for the detail view).
  2. list_topics()      - all topics, most-searched first.
  3. get_topic(id)      - a single topic's full detail.
  4. search_topics(q)   - free-text search across title/tags/content so a
                          user can type a question ("how to control
                          diabetes") and get back the closest matching
                          topics for guidance, even without knowing the
                          exact topic name.
  5. translate_topic_summary() / translate_topic_full()
                        - translate a topic's user-facing text into any
                          language in translator.SUPPORTED_LANGUAGES,
                          reusing the same Sarvam-backed translator used
                          everywhere else in this project.

This mirrors the style of emergency.py: static, offline-friendly data
plus small helper functions, no external ML model required. It does not
replace professional medical advice.
"""

import re

from translator import translate_to_language, SUPPORTED_LANGUAGES


# ============================================================
# TOPIC LIBRARY
# ============================================================
#
# `search_count` is a static popularity score used to surface the
# "most searched" topics first on the education home screen.

EDUCATION_TOPICS = [
    {
        "id": "fever",
        "title": "Fever",
        "category": "Common Illnesses",
        "icon": "Thermometer",
        "tags": ["fever", "temperature", "body ache", "chills"],
        "summary": "What causes a fever, how to bring it down safely at home, and when it needs a doctor.",
        "search_count": 980,
        "content": {
            "overview": (
                "Fever is a temporary rise in body temperature, usually a sign that the "
                "body is fighting an infection. On its own, fever is not a disease — it "
                "is the body's natural defense response."
            ),
            "causes": [
                "Viral infections such as flu or common cold",
                "Bacterial infections",
                "Malaria, typhoid, or dengue in endemic areas",
                "Heat exhaustion",
                "Reaction to vaccination",
            ],
            "symptoms": [
                "Body temperature above 38°C (100.4°F)",
                "Sweating or chills",
                "Headache and body ache",
                "Weakness and loss of appetite",
            ],
            "home_care": [
                "Rest and drink plenty of fluids (water, ORS, coconut water).",
                "Wear light clothing and keep the room airy.",
                "A lukewarm sponge bath can help lower temperature.",
                "Paracetamol can be used for fever/pain as per the label dose.",
            ],
            "prevention": [
                "Wash hands regularly, especially before eating.",
                "Avoid close contact with people who are unwell.",
                "Keep vaccinations up to date.",
            ],
            "when_to_see_doctor": [
                "Fever above 40°C (104°F) or lasting more than 3 days",
                "Fever in an infant under 3 months",
                "Difficulty breathing, repeated vomiting, or a rash",
                "Confusion, stiff neck, or fits",
            ],
        },
    },
    {
        "id": "diarrhea",
        "title": "Diarrhea & Dehydration",
        "category": "Common Illnesses",
        "icon": "Droplets",
        "tags": ["diarrhea", "loose motion", "dehydration", "ors", "vomiting"],
        "summary": "How to manage loose motions with ORS and fluids, and the danger signs of dehydration.",
        "search_count": 860,
        "content": {
            "overview": (
                "Diarrhea is frequent, loose, or watery stools. The biggest risk, "
                "especially in children, is dehydration — so replacing lost fluids "
                "matters more than stopping the diarrhea itself."
            ),
            "causes": [
                "Contaminated food or drinking water",
                "Viral or bacterial infections",
                "Food intolerance",
            ],
            "symptoms": [
                "Frequent loose or watery stools",
                "Stomach cramps",
                "Nausea or vomiting",
                "Signs of dehydration: dry mouth, sunken eyes, less urination",
            ],
            "home_care": [
                "Give ORS (oral rehydration solution) after every loose stool.",
                "Continue breastfeeding infants; do not stop feeding.",
                "Offer small, frequent sips of fluid rather than large amounts at once.",
                "Eat light, easily digestible food (rice, banana, curd) once appetite returns.",
            ],
            "prevention": [
                "Drink boiled or filtered water.",
                "Wash hands with soap before eating and after using the toilet.",
                "Keep food covered and avoid stale or street food in hot weather.",
            ],
            "when_to_see_doctor": [
                "Blood in stool",
                "Signs of severe dehydration (very little urine, extreme thirst, lethargy)",
                "Diarrhea lasting more than 2 days, or high fever alongside it",
                "In infants and elderly — seek care early rather than waiting.",
            ],
        },
    },
    {
        "id": "diabetes",
        "title": "Diabetes",
        "category": "Chronic Conditions",
        "icon": "Activity",
        "tags": ["diabetes", "blood sugar", "sugar", "glucose", "insulin"],
        "summary": "Understanding blood sugar control, diet, and daily habits that help manage diabetes.",
        "search_count": 910,
        "content": {
            "overview": (
                "Diabetes is a long-term condition where the body cannot properly "
                "regulate blood sugar (glucose) levels, either because it doesn't "
                "make enough insulin or can't use it effectively."
            ),
            "causes": [
                "Family history and genetics",
                "Being overweight and physically inactive",
                "Age (risk increases after 40)",
                "Type 1 diabetes: the immune system attacks insulin-producing cells",
            ],
            "symptoms": [
                "Frequent urination and excessive thirst",
                "Unexplained weight loss",
                "Fatigue and blurred vision",
                "Slow-healing wounds",
            ],
            "home_care": [
                "Follow a balanced diet — limit refined sugar and white rice/maida.",
                "Stay physically active with at least 30 minutes of walking most days.",
                "Take prescribed medicines or insulin exactly as directed.",
                "Check blood sugar regularly and keep a record to share with your doctor.",
            ],
            "prevention": [
                "Maintain a healthy body weight.",
                "Eat more whole grains, vegetables, and fiber.",
                "Get regular check-ups if diabetes runs in the family.",
            ],
            "when_to_see_doctor": [
                "Very high or very low blood sugar readings",
                "Persistent vomiting, confusion, or difficulty breathing",
                "Wounds that aren't healing, especially on the feet",
                "Any new or worsening symptoms — diabetes needs regular medical follow-up.",
            ],
        },
    },
    {
        "id": "hypertension",
        "title": "High Blood Pressure (Hypertension)",
        "category": "Chronic Conditions",
        "icon": "HeartPulse",
        "tags": ["blood pressure", "hypertension", "bp", "heart"],
        "summary": "Why blood pressure rises, lifestyle changes that help, and warning signs to act on.",
        "search_count": 740,
        "content": {
            "overview": (
                "Hypertension means the force of blood against artery walls is "
                "consistently too high. It usually has no obvious symptoms, which is "
                "why it's called a 'silent' condition — but left unmanaged it raises "
                "the risk of heart disease and stroke."
            ),
            "causes": [
                "High salt intake",
                "Being overweight or physically inactive",
                "Smoking and excessive alcohol use",
                "Stress and poor sleep",
                "Family history",
            ],
            "symptoms": [
                "Often none — it is usually found during a routine check-up",
                "In severe cases: headache, dizziness, or nosebleeds",
            ],
            "home_care": [
                "Reduce salt in cooking and avoid processed/packaged foods.",
                "Exercise regularly — brisk walking is a good start.",
                "Take blood pressure medicine consistently, even when feeling fine.",
                "Monitor blood pressure at home if a machine is available.",
            ],
            "prevention": [
                "Maintain a healthy weight and stay active.",
                "Limit alcohol and avoid tobacco.",
                "Manage stress and get enough sleep.",
            ],
            "when_to_see_doctor": [
                "Blood pressure readings consistently above 140/90 mmHg",
                "Severe headache, chest pain, or blurred vision",
                "Sudden weakness, numbness, or trouble speaking (could signal a stroke — treat as an emergency)",
            ],
        },
    },
    {
        "id": "anemia",
        "title": "Anemia",
        "category": "Nutrition",
        "icon": "Droplet",
        "tags": ["anemia", "iron deficiency", "weakness", "hemoglobin"],
        "summary": "Recognizing iron-deficiency anemia and the everyday foods that help restore energy.",
        "search_count": 610,
        "content": {
            "overview": (
                "Anemia happens when the body doesn't have enough healthy red blood "
                "cells to carry oxygen. Iron-deficiency anemia is the most common type, "
                "especially among women and children."
            ),
            "causes": [
                "Insufficient iron in the diet",
                "Blood loss (heavy periods, internal bleeding)",
                "Pregnancy, which increases iron needs",
                "Parasitic infections such as hookworm",
            ],
            "symptoms": [
                "Fatigue and weakness",
                "Pale skin, lips, or nails",
                "Shortness of breath and dizziness",
                "Rapid heartbeat",
            ],
            "home_care": [
                "Eat iron-rich foods: leafy greens, jaggery, lentils, eggs, and meat if eaten.",
                "Pair iron-rich food with vitamin C (citrus fruits, amla) to improve absorption.",
                "Take iron/folic acid supplements as prescribed, especially during pregnancy.",
                "Avoid tea or coffee right after meals, as it can reduce iron absorption.",
            ],
            "prevention": [
                "Include iron- and folate-rich foods in daily meals.",
                "Deworming as advised, particularly for children.",
                "Regular hemoglobin checks during pregnancy.",
            ],
            "when_to_see_doctor": [
                "Persistent fatigue or breathlessness on mild exertion",
                "Very pale skin or fainting spells",
                "No improvement after a few weeks of dietary changes",
            ],
        },
    },
    {
        "id": "malaria",
        "title": "Malaria",
        "category": "Infectious Diseases",
        "icon": "Bug",
        "tags": ["malaria", "mosquito", "fever", "chills"],
        "summary": "How malaria spreads through mosquito bites, its symptoms, and prevention steps.",
        "search_count": 700,
        "content": {
            "overview": (
                "Malaria is a serious illness caused by a parasite spread through the "
                "bite of infected female Anopheles mosquitoes. It is common in warm, "
                "humid regions and requires prompt treatment."
            ),
            "causes": [
                "Bite of a mosquito infected with the malaria parasite",
                "Stagnant water near homes, which breeds mosquitoes",
            ],
            "symptoms": [
                "High fever with chills and sweating (often cyclical)",
                "Headache and body ache",
                "Nausea and vomiting",
                "Fatigue",
            ],
            "home_care": [
                "Rest and drink plenty of fluids while awaiting/undergoing treatment.",
                "Take antimalarial medication exactly as prescribed — do not stop early.",
                "Use paracetamol for fever, avoiding aspirin/ibuprofen unless advised.",
            ],
            "prevention": [
                "Sleep under insecticide-treated mosquito nets.",
                "Remove stagnant water around the house.",
                "Use mosquito repellents, especially at dawn and dusk.",
                "Wear full-sleeved clothing in mosquito-prone areas.",
            ],
            "when_to_see_doctor": [
                "Any fever in a malaria-endemic area should be tested promptly.",
                "Confusion, difficulty breathing, or repeated vomiting",
                "Fever not improving within 48 hours of starting treatment.",
            ],
        },
    },
    {
        "id": "dengue",
        "title": "Dengue Fever",
        "category": "Infectious Diseases",
        "icon": "ShieldAlert",
        "tags": ["dengue", "mosquito", "platelets", "fever"],
        "summary": "Spotting dengue's warning signs early and preventing mosquito breeding at home.",
        "search_count": 640,
        "content": {
            "overview": (
                "Dengue is a mosquito-borne viral infection spread by the Aedes "
                "mosquito, which typically bites during the day. Most cases are mild, "
                "but some can become severe and need urgent care."
            ),
            "causes": [
                "Bite of an Aedes mosquito carrying the dengue virus",
                "Stagnant clean water (coolers, pots, tires) where mosquitoes breed",
            ],
            "symptoms": [
                "Sudden high fever",
                "Severe headache and pain behind the eyes",
                "Joint and muscle pain ('breakbone fever')",
                "Skin rash and mild bleeding (gums, nose)",
            ],
            "home_care": [
                "Rest and drink plenty of fluids (water, ORS, coconut water).",
                "Use paracetamol for fever — avoid aspirin/ibuprofen, which can increase bleeding risk.",
                "Monitor for warning signs and keep track of platelet counts if advised by a doctor.",
            ],
            "prevention": [
                "Empty and clean water-storage containers weekly.",
                "Use mosquito nets and repellents, especially during the day.",
                "Cover water tanks and remove standing water around the home.",
            ],
            "when_to_see_doctor": [
                "Severe abdominal pain, persistent vomiting",
                "Bleeding from gums or nose, blood in vomit or stool",
                "Difficulty breathing, extreme restlessness, or cold clammy skin — seek emergency care immediately.",
            ],
        },
    },
    {
        "id": "tuberculosis",
        "title": "Tuberculosis (TB)",
        "category": "Infectious Diseases",
        "icon": "Wind",
        "tags": ["tb", "tuberculosis", "cough", "lungs"],
        "summary": "Why a cough lasting over 2 weeks matters, and how TB is diagnosed and treated.",
        "search_count": 520,
        "content": {
            "overview": (
                "Tuberculosis is a bacterial infection that most often affects the "
                "lungs. It spreads through the air when an infected person coughs or "
                "sneezes. TB is curable with a full course of medication."
            ),
            "causes": [
                "Airborne bacteria (Mycobacterium tuberculosis)",
                "Close, prolonged contact with someone who has active TB",
                "Weakened immunity (malnutrition, HIV, diabetes) increases risk",
            ],
            "symptoms": [
                "Cough lasting more than 2 weeks, sometimes with blood",
                "Unexplained weight loss and loss of appetite",
                "Night sweats and evening fever",
                "Chest pain and persistent fatigue",
            ],
            "home_care": [
                "Complete the full course of TB medication, even after feeling better.",
                "Eat a nutritious, protein-rich diet to support recovery.",
                "Cover the mouth while coughing and ensure good ventilation at home.",
                "Attend follow-up check-ups as scheduled under the national TB program.",
            ],
            "prevention": [
                "BCG vaccination for infants.",
                "Good ventilation in living spaces.",
                "Early testing for anyone with a persistent cough.",
            ],
            "when_to_see_doctor": [
                "Cough lasting more than 2 weeks",
                "Coughing up blood",
                "Unexplained weight loss with fever — get tested at the nearest health center, testing and treatment are free under government programs.",
            ],
        },
    },
    {
        "id": "pregnancy-care",
        "title": "Pregnancy & Antenatal Care",
        "category": "Maternal & Child Health",
        "icon": "Baby",
        "tags": ["pregnancy", "antenatal", "maternal", "checkup"],
        "summary": "Key check-ups, nutrition, and warning signs for a healthy pregnancy.",
        "search_count": 690,
        "content": {
            "overview": (
                "Regular antenatal care helps track the health of both mother and "
                "baby throughout pregnancy, catching potential problems early."
            ),
            "causes": [],
            "symptoms": [
                "Missed period, nausea, and fatigue are early signs of pregnancy",
                "Regular growth of the abdomen as pregnancy progresses",
            ],
            "prevention": [
                "Register the pregnancy early and attend all recommended antenatal visits.",
                "Take iron-folic acid and calcium supplements as advised.",
                "Get tetanus toxoid vaccination as scheduled.",
                "Eat a balanced diet with extra protein, iron, and calcium.",
                "Avoid smoking, alcohol, and self-medication.",
            ],
            "home_care": [
                "Rest adequately and avoid heavy physical strain.",
                "Stay hydrated and eat small, frequent, nutritious meals.",
                "Keep track of baby's movements after the second trimester.",
            ],
            "when_to_see_doctor": [
                "Bleeding or fluid leakage from the vagina",
                "Severe headache, blurred vision, or swelling of hands/face",
                "Reduced or no fetal movement",
                "Severe abdominal pain or high fever — seek care immediately.",
            ],
        },
    },
    {
        "id": "child-nutrition",
        "title": "Child Nutrition & Growth",
        "category": "Maternal & Child Health",
        "icon": "Salad",
        "tags": ["child nutrition", "malnutrition", "growth", "stunting", "diet"],
        "summary": "Feeding guidance by age and how to spot signs of malnutrition early.",
        "search_count": 580,
        "content": {
            "overview": (
                "Proper nutrition in the first years of life is critical for a "
                "child's physical growth and brain development. Malnutrition in "
                "early childhood can have lasting effects."
            ),
            "causes": [
                "Inadequate breastfeeding or complementary feeding",
                "Repeated infections (diarrhea, worms) that drain nutrients",
                "Poor dietary diversity",
            ],
            "symptoms": [
                "Low weight or height for age",
                "Visible thinness or swelling (in severe malnutrition)",
                "Frequent illness and low energy",
                "Delayed developmental milestones",
            ],
            "home_care": [
                "Exclusive breastfeeding for the first 6 months.",
                "Start complementary foods at 6 months alongside continued breastfeeding.",
                "Offer a variety of foods: grains, pulses, vegetables, fruits, and dairy.",
                "Track growth regularly using a growth chart at the local health center.",
            ],
            "prevention": [
                "Regular growth monitoring at anganwadi/health centers.",
                "Timely vaccination and deworming.",
                "Good hygiene to reduce repeated infections.",
            ],
            "when_to_see_doctor": [
                "Child not gaining weight over consecutive months",
                "Visible wasting, swelling of feet, or persistent lethargy",
                "Frequent illness or failure to reach developmental milestones.",
            ],
        },
    },
    {
        "id": "vaccination",
        "title": "Vaccination Schedule",
        "category": "Maternal & Child Health",
        "icon": "Syringe",
        "tags": ["vaccine", "vaccination", "immunization", "schedule"],
        "summary": "Why timely vaccination matters and the routine immunizations children need.",
        "search_count": 500,
        "content": {
            "overview": (
                "Vaccines protect children (and adults) from serious, sometimes "
                "life-threatening diseases by helping the body build immunity before "
                "exposure to the actual illness."
            ),
            "causes": [],
            "symptoms": [],
            "home_care": [
                "Keep the vaccination card safe and bring it to every visit.",
                "Follow the schedule given by the health worker or pediatrician.",
                "Mild fever or soreness after a shot is normal and usually settles in a day or two.",
            ],
            "prevention": [
                "Complete all scheduled vaccines under the national immunization program (BCG, OPV, DPT, measles, and others).",
                "Don't delay catch-up doses if a scheduled visit was missed.",
                "Pregnant women should get the tetanus toxoid vaccine as advised.",
            ],
            "when_to_see_doctor": [
                "High fever, excessive crying, or swelling at the injection site after vaccination",
                "Any missed doses — visit the health center to catch up rather than skipping.",
            ],
        },
    },
    {
        "id": "hygiene-sanitation",
        "title": "Hygiene & Sanitation",
        "category": "Prevention",
        "icon": "Droplets",
        "tags": ["hygiene", "sanitation", "handwashing", "clean water"],
        "summary": "Simple daily habits — handwashing, safe water, and sanitation — that prevent disease.",
        "search_count": 470,
        "content": {
            "overview": (
                "Many common illnesses, especially in children, are preventable "
                "through basic hygiene and sanitation practices that cost little but "
                "make a big difference."
            ),
            "causes": [],
            "symptoms": [],
            "prevention": [
                "Wash hands with soap before eating, cooking, and after using the toilet.",
                "Drink boiled, filtered, or otherwise treated water.",
                "Use a covered toilet/latrine and dispose of waste safely.",
                "Keep food covered and stored properly to avoid contamination.",
                "Bathe regularly and keep nails trimmed and clean.",
            ],
            "home_care": [],
            "when_to_see_doctor": [
                "Repeated stomach infections despite good hygiene practices",
                "Skin infections that don't improve with basic cleaning and care.",
            ],
        },
    },
    {
        "id": "mental-wellbeing",
        "title": "Mental Health & Stress",
        "category": "Mental Health",
        "icon": "Brain",
        "tags": ["mental health", "stress", "anxiety", "depression", "sleep"],
        "summary": "Recognizing stress, anxiety, or low mood, and simple steps that support wellbeing.",
        "search_count": 550,
        "content": {
            "overview": (
                "Mental health is as important as physical health. Ongoing stress, "
                "anxiety, or low mood are common and treatable — talking about them "
                "is a healthy first step, not a weakness."
            ),
            "causes": [
                "Work, financial, or family stress",
                "Major life changes or loss",
                "Chronic illness or lack of sleep",
                "Social isolation",
            ],
            "symptoms": [
                "Persistent sadness, worry, or irritability",
                "Trouble sleeping or sleeping too much",
                "Loss of interest in daily activities",
                "Difficulty concentrating or constant fatigue",
            ],
            "home_care": [
                "Talk to someone you trust about how you're feeling.",
                "Keep a regular sleep schedule and some physical activity.",
                "Practice slow breathing or relaxation when feeling overwhelmed.",
                "Limit alcohol and avoid using it to cope with stress.",
            ],
            "prevention": [
                "Maintain social connections with family and friends.",
                "Take breaks and set realistic goals at work/home.",
                "Seek support early rather than waiting for things to worsen.",
            ],
            "when_to_see_doctor": [
                "Feelings of hopelessness lasting more than 2 weeks",
                "Thoughts of self-harm — reach out to a doctor, counselor, or helpline immediately.",
                "Symptoms interfering with daily life, work, or relationships.",
            ],
        },
    },
    {
        "id": "skin-infections",
        "title": "Common Skin Infections",
        "category": "Common Illnesses",
        "icon": "Sparkles",
        "tags": ["skin", "rash", "fungal infection", "itching"],
        "summary": "Everyday skin problems like fungal infections and rashes, and how to manage them.",
        "search_count": 430,
        "content": {
            "overview": (
                "Skin infections are common, especially in hot, humid weather, and "
                "range from mild fungal infections to bacterial infections that need "
                "medical treatment."
            ),
            "causes": [
                "Fungal growth in warm, moist areas of skin",
                "Bacterial infection through cuts or insect bites",
                "Poor hygiene or prolonged dampness (sweat, wet clothing)",
            ],
            "symptoms": [
                "Itching, redness, or scaling patches",
                "Ring-shaped rash (in fungal infections)",
                "Pus-filled bumps or boils (in bacterial infections)",
            ],
            "home_care": [
                "Keep the affected area clean and dry.",
                "Wear loose, breathable cotton clothing.",
                "Use antifungal cream as advised for fungal infections; avoid sharing towels/clothes.",
                "Do not scratch or pop boils, as this can spread infection.",
            ],
            "prevention": [
                "Bathe regularly and dry skin thoroughly, especially skin folds.",
                "Avoid sharing personal items like towels or combs.",
                "Change out of sweaty or wet clothing promptly.",
            ],
            "when_to_see_doctor": [
                "Infection spreading, with increasing redness, swelling, or pain",
                "Fever alongside a skin infection",
                "No improvement after a week of basic home care.",
            ],
        },
    },
    {
        "id": "wound-first-aid",
        "title": "First Aid for Cuts & Wounds",
        "category": "First Aid",
        "icon": "Bandage",
        "tags": ["wound", "cut", "injury", "bleeding", "first aid"],
        "summary": "Step-by-step care for cuts, scrapes, and wounds — and signs of infection to watch for.",
        "search_count": 460,
        "content": {
            "overview": (
                "Prompt, proper care of cuts and wounds reduces the risk of infection "
                "and helps healing. Most minor wounds can be managed safely at home."
            ),
            "causes": [],
            "symptoms": [
                "Bleeding, pain, and swelling around the wound",
                "Signs of infection: increasing redness, warmth, pus, or fever",
            ],
            "home_care": [
                "Wash your hands before treating the wound.",
                "Rinse the wound under clean running water to remove dirt.",
                "Apply gentle, steady pressure with a clean cloth to stop bleeding.",
                "Apply an antiseptic and cover with a clean bandage; change it daily.",
                "Keep a tetanus vaccination up to date, especially for deep or dirty wounds.",
            ],
            "prevention": [
                "Use protective footwear and gloves when doing manual work.",
                "Keep sharp tools and objects stored safely.",
            ],
            "when_to_see_doctor": [
                "Deep wounds, or bleeding that doesn't stop with pressure after 10-15 minutes",
                "Wounds from rusty or dirty objects (tetanus risk)",
                "Signs of infection: spreading redness, pus, or fever",
                "Animal or human bites.",
            ],
        },
    },
]


_TOPICS_BY_ID = {topic["id"]: topic for topic in EDUCATION_TOPICS}


# ============================================================
# LISTING / LOOKUP
# ============================================================

def list_topics():
    """All topics, most-searched first — used for the education home grid."""

    return sorted(
        EDUCATION_TOPICS,
        key=lambda topic: topic.get("search_count", 0),
        reverse=True,
    )


def get_topic(topic_id):
    """A single topic's full detail, or None if it doesn't exist."""

    return _TOPICS_BY_ID.get(topic_id)


# ============================================================
# SEARCH
# ============================================================
#
# Simple keyword-overlap scoring (same spirit as voice_query.py's
# rule-based matching) — no external ML model required. A topic scores
# higher when the query words appear in its title/tags, a bit lower for
# a match in the category or summary/content text.

_WORD_RE = re.compile(r"[a-zA-Z]+")


def _words(text):
    return set(_WORD_RE.findall(text.lower()))


def _topic_score(topic, query_words):

    if not query_words:
        return 0

    score = 0

    title_words = _words(topic["title"])
    tag_words = set()

    for tag in topic.get("tags", []):
        tag_words |= _words(tag)

    category_words = _words(topic.get("category", ""))
    summary_words = _words(topic.get("summary", ""))

    content = topic.get("content", {})
    content_text = " ".join(
        " ".join(value) if isinstance(value, list) else str(value)
        for value in content.values()
    )
    content_words = _words(content_text)

    for word in query_words:

        if len(word) < 3:
            # skip very short/common words ("a", "is", "to" ...)
            continue

        if word in title_words:
            score += 5
        if word in tag_words:
            score += 4
        if word in category_words:
            score += 2
        if word in summary_words:
            score += 2
        if word in content_words:
            score += 1

    return score


def search_topics(query, limit=6):
    """
    Return topics ranked by relevance to a free-text query, so a user can
    type a question or symptom ("how to control blood sugar", "mosquito
    fever") and get back the closest matching education topics for
    guidance, even if they don't know the exact topic name.
    """

    query_words = _words(query or "")

    scored = [
        (topic, _topic_score(topic, query_words))
        for topic in EDUCATION_TOPICS
    ]

    matches = [item for item in scored if item[1] > 0]
    matches.sort(key=lambda item: item[1], reverse=True)

    return [topic for topic, _score in matches[:limit]]


# ============================================================
# TRANSLATION
# ============================================================

def _translate_list(items, target_lang):
    return [translate_to_language(str(item), target_lang) for item in (items or [])]


def translate_topic_summary(topic, target_lang="en"):
    """Translated card-sized view: id, title, category, tags, summary."""

    if target_lang == "en" or target_lang not in SUPPORTED_LANGUAGES:
        return {
            "id": topic["id"],
            "title": topic["title"],
            "category": topic["category"],
            "icon": topic["icon"],
            "tags": topic.get("tags", []),
            "summary": topic["summary"],
            "search_count": topic.get("search_count", 0),
        }

    return {
        "id": topic["id"],
        "title": translate_to_language(topic["title"], target_lang),
        "category": translate_to_language(topic["category"], target_lang),
        "icon": topic["icon"],
        "tags": _translate_list(topic.get("tags", []), target_lang),
        "summary": translate_to_language(topic["summary"], target_lang),
        "search_count": topic.get("search_count", 0),
    }


def translate_topic_full(topic, target_lang="en"):
    """Translated detail view, including the full structured content."""

    summary_part = translate_topic_summary(topic, target_lang)
    content = topic.get("content", {})

    if target_lang == "en" or target_lang not in SUPPORTED_LANGUAGES:
        translated_content = dict(content)
    else:
        translated_content = {
            "overview": translate_to_language(content.get("overview", ""), target_lang),
            "causes": _translate_list(content.get("causes"), target_lang),
            "symptoms": _translate_list(content.get("symptoms"), target_lang),
            "prevention": _translate_list(content.get("prevention"), target_lang),
            "home_care": _translate_list(content.get("home_care"), target_lang),
            "when_to_see_doctor": _translate_list(content.get("when_to_see_doctor"), target_lang),
        }

    return {
        **summary_part,
        "content": translated_content,
    }
