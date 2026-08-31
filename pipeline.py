import json
import os

from standardizer import standardize_record
from simplifier import simplify_record
from translator import translate_to_hindi
from treatment import generate_treatment


# ---------------------------------------
# 1. Create output folder
# ---------------------------------------

os.makedirs("output", exist_ok=True)


# ---------------------------------------
# 2. Read extracted medical information
# ---------------------------------------

with open(
    "input/extraction.json",
    "r",
    encoding="utf-8"
) as file:

    data = json.load(file)


# ---------------------------------------
# 3. Standardize the extracted records
# ---------------------------------------

standardized_data = []

for record in data:

    result = standardize_record(record)

    standardized_data.append(result)


# ---------------------------------------
# 4. Save standardized JSON
# ---------------------------------------

with open(
    "output/standardized.json",
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        standardized_data,
        file,
        indent=2,
        ensure_ascii=False
    )


print("Standardization completed!")
print("Records processed:", len(standardized_data))
print("Output saved to: output/standardized.json")


# ---------------------------------------
# 5. Simplify medical terminology
# ---------------------------------------

simplified_data = []

for record in standardized_data:

    result = simplify_record(record)

    simplified_data.append(result)


# ---------------------------------------
# 6. Save simplified JSON
# ---------------------------------------

with open(
    "output/simplified.json",
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        simplified_data,
        file,
        indent=2,
        ensure_ascii=False
    )


print("Medical terminology simplification completed!")
print("Simplified output saved to: output/simplified.json")


# ---------------------------------------
# 7. Recursive English → Hindi translation
# ---------------------------------------

def translate_value(value):

    # If value is a string, translate it
    if isinstance(value, str):

        if not value.strip():
            return value

        try:
            return translate_to_hindi(value)

        except Exception as e:

            print(
                f"\nTranslation error for '{value}': {e}"
            )

            return value


    # If value is a list, translate every item
    elif isinstance(value, list):

        translated_list = []

        for item in value:

            translated_list.append(
                translate_value(item)
            )

        return translated_list


    # If value is a dictionary, translate every value
    elif isinstance(value, dict):

        translated_dict = {}

        for key, value in value.items():

            translated_dict[key] = translate_value(value)

        return translated_dict


    # Keep numbers, None, boolean, etc. unchanged
    else:

        return value


# ---------------------------------------
# 8. Translate all records
# ---------------------------------------

translated_data = []

print("\nLoading translations...")
print("----------------------------------------")

for record_number, record in enumerate(
    simplified_data,
    start=1
):

    print(
        f"Translating record {record_number}/{len(simplified_data)}..."
    )

    hindi_record = translate_value(record)

    translated_record = {
        "english": record,
        "hindi": hindi_record
    }

    translated_data.append(translated_record)


# ---------------------------------------
# 9. Save English + Hindi output
# ---------------------------------------

with open(
    "output/translated.json",
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        translated_data,
        file,
        indent=2,
        ensure_ascii=False
    )


# ---------------------------------------
# 10. Print actual output in terminal
# ---------------------------------------

print("\n")
print("========================================")
print("       ENGLISH → HINDI OUTPUT")
print("========================================")


for i, record in enumerate(
    translated_data,
    start=1
):

    print(f"\n\n========== RECORD {i} ==========")

    print("\n--------------- ENGLISH ---------------")

    print(
        json.dumps(
            record["english"],
            indent=2,
            ensure_ascii=False
        )
    )

    print("\n---------------- HINDI ----------------")

    print(
        json.dumps(
            record["hindi"],
            indent=2,
            ensure_ascii=False
        )
    )


# ---------------------------------------
# 11. Completion message
# ---------------------------------------

print("\n")
print("========================================")
print("English → Hindi translation completed!")
print("Translated output saved to:")
print("output/translated.json")
print("========================================")

# ---------------------------------------
# 7. Generate treatment/advice
# ---------------------------------------

treatment_data = []

for record in simplified_data:

    treatment = generate_treatment(record)

    treatment_data.append({
        "medical_information": record,
        "treatment_english": treatment,
        "treatment_hindi": translate_to_hindi(treatment)
    })


# ---------------------------------------
# 8. Save treatment output
# ---------------------------------------

with open(
    "output/treatment.json",
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        treatment_data,
        file,
        indent=2,
        ensure_ascii=False
    )


print("Treatment generation completed!")
print("Treatment output saved to: output/treatment.json")