import json
import os

from standardizer import standardize_record
from simplifier import simplify_record


# ---------------------------------------
# 1. Create output folder if it doesn't exist
# ---------------------------------------

os.makedirs("output", exist_ok=True)


# ---------------------------------------
# 2. Read extracted medical information
# ---------------------------------------

with open("input/extraction.json", "r", encoding="utf-8") as file:
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