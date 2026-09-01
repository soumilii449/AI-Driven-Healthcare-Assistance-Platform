import json
import os

from standardizer import standardize_record
from simplifier import simplify_record
from translator import translate_to_hindi
from treatment import generate_treatment


# ---------------------------------------
# 1. Translate values recursively
# ---------------------------------------

def translate_value(value):

    # Translate string
    if isinstance(value, str):

        if not value.strip():
            return value

        try:
            return translate_to_hindi(value)

        except Exception as e:

            print(
                f"Translation error for '{value}': {e}"
            )

            return value

    # Translate list
    elif isinstance(value, list):

        translated_list = []

        for item in value:

            translated_list.append(
                translate_value(item)
            )

        return translated_list

    # Translate dictionary values
    elif isinstance(value, dict):

        translated_dict = {}

        for key, item in value.items():

            translated_dict[key] = translate_value(item)

        return translated_dict

    # Keep numbers, boolean, None unchanged
    else:

        return value


# ---------------------------------------
# 2. Process one medical record
# ---------------------------------------

def process_record(record):

    print("\nProcessing medical record...")

    # ---------------------------------------
    # Standardization
    # ---------------------------------------

    if "prediction" in record:

        print("Step 1: Standardizing medical information...")

        standardized = standardize_record(record)

    else:

        print(
            "Step 1: Input already standardized. "
            "Skipping standardization..."
        )

        standardized = record


    # ---------------------------------------
    # Simplification
    # ---------------------------------------

    print("Step 2: Simplifying medical terminology...")

    simplified = simplify_record(
        standardized
    )


    # ---------------------------------------
    # English → Hindi translation
    # ---------------------------------------

    print("Step 3: Translating medical information...")

    hindi_record = translate_value(
        simplified
    )


    # ---------------------------------------
    # Treatment generation
    # ---------------------------------------

    print("Step 4: Generating treatment/advice...")

    treatment_english = generate_treatment(
        simplified
    )


    # ---------------------------------------
    # Treatment → Hindi
    # ---------------------------------------

    print("Step 5: Translating treatment into Hindi...")

    treatment_hindi = translate_to_hindi(
        treatment_english
    )


    # ---------------------------------------
    # Final result
    # ---------------------------------------

    result = {

        "english": simplified,

        "hindi": hindi_record,

        "treatment_english": treatment_english,

        "treatment_hindi": treatment_hindi
    }


    print("Medical record processing completed!")

    return result


# ---------------------------------------
# 3. Run complete pipeline on JSON file
# ---------------------------------------

def run_pipeline(
    input_file="input/extraction.json"
):

    # Create output folder
    os.makedirs(
        "output",
        exist_ok=True
    )


    # ---------------------------------------
    # Read input file
    # ---------------------------------------

    print("\n========================================")
    print("       AI HEALTHCARE PIPELINE")
    print("========================================")

    print(
        f"\nReading input file: {input_file}"
    )


    with open(
        input_file,
        "r",
        encoding="utf-8"
    ) as file:

        data = json.load(file)


    # ---------------------------------------
    # Process all records
    # ---------------------------------------

    results = []

    total_records = len(data)


    for record_number, record in enumerate(
        data,
        start=1
    ):

        print("\n----------------------------------------")

        print(
            f"Processing record "
            f"{record_number}/{total_records}"
        )

        print("----------------------------------------")


        result = process_record(
            record
        )


        results.append(
            result
        )


    # ---------------------------------------
    # Save final output
    # ---------------------------------------

    output_file = (
        "output/final_pipeline.json"
    )


    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            results,
            file,
            indent=2,
            ensure_ascii=False
        )


    # ---------------------------------------
    # Print completion
    # ---------------------------------------

    print("\n========================================")

    print(
        "      PIPELINE COMPLETED SUCCESSFULLY"
    )

    print("========================================")

    print(
        f"Records processed: {len(results)}"
    )

    print(
        f"Final output saved to: {output_file}"
    )

    print("========================================")


    return results


# ---------------------------------------
# 4. Run pipeline directly
# ---------------------------------------

if __name__ == "__main__":

    run_pipeline()