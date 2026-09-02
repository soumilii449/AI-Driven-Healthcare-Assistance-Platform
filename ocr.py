# ========================================
# OCR FOR MEDICAL PRESCRIPTION IMAGES
# PaddleOCR 3.7.0
# ========================================

import os

# IMPORTANT:
# Disable oneDNN / MKL-DNN and PIR before
# importing PaddleOCR/Paddle.
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"

import json
import re
import pandas as pd
from paddleocr import PaddleOCR


# ========================================
# 1. PATHS
# ========================================

IMAGE_FOLDER = (
    "dataset/synthetic_prescription_dataset/images"
)

LABEL_FILE = (
    "dataset/synthetic_prescription_dataset/labels.csv"
)

OUTPUT_FOLDER = "output"

OUTPUT_FILE = (
    "output/ocr_results.json"
)


# ========================================
# 2. CREATE OUTPUT FOLDER
# ========================================

os.makedirs(
    OUTPUT_FOLDER,
    exist_ok=True
)


# ========================================
# 3. LOAD PADDLEOCR
# ========================================

print("Loading OCR model...")

try:

    ocr = PaddleOCR(
        lang="en",
        enable_mkldnn=False,
        # Disable unnecessary document
        # processing components.
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False
    )

    print("OCR model loaded successfully!")

except Exception as e:

    print("\nERROR while loading OCR model:")
    print(e)

    raise SystemExit


# ========================================
# 4. EXTRACT MEDICAL TERMS
# ========================================

def extract_medical_terms(text):

    medicines = []
    dosages = []
    frequencies = []

    if not text:
        return {
            "medicines": medicines,
            "dosages": dosages,
            "frequencies": frequencies
        }

    # ------------------------------------
    # Dosage
    # ------------------------------------

    dosage_pattern = (
        r"\b\d+(?:\.\d+)?\s*"
        r"(?:mg|g|mcg|ml|iu|%)\b"
    )

    dosages = re.findall(
        dosage_pattern,
        text,
        flags=re.IGNORECASE
    )

    # ------------------------------------
    # Frequency
    # ------------------------------------

    frequency_pattern = (
        r"\b[01]-[01]-[01]\b"
    )

    frequencies = re.findall(
        frequency_pattern,
        text
    )

    return {
        "medicines": medicines,
        "dosages": dosages,
        "frequencies": frequencies
    }


# ========================================
# 5. OCR IMAGE
# ========================================

def extract_text(image_path):

    print("\nReading image:")
    print(image_path)

    try:

        result = ocr.predict(
            image_path
        )

        all_text = []

        # --------------------------------
        # Read PaddleOCR result
        # --------------------------------

        for page in result:

            try:

                page_data = page.json

            except Exception:

                continue

            # Convert JSON string to dictionary
            if isinstance(
                page_data,
                str
            ):

                try:

                    page_data = json.loads(
                        page_data
                    )

                except Exception:

                    continue

            if not isinstance(
                page_data,
                dict
            ):

                continue

            # --------------------------------
            # PaddleOCR 3.x result structure
            # --------------------------------

            data = page_data.get(
                "res",
                page_data
            )

            if not isinstance(
                data,
                dict
            ):

                continue

            texts = data.get(
                "rec_texts",
                []
            )

            if texts:

                all_text.extend(
                    str(text)
                    for text in texts
                    if text
                )

        # --------------------------------
        # Combine OCR text
        # --------------------------------

        final_text = " ".join(
            all_text
        )

        return final_text.strip()

    except Exception as e:

        print(
            "\nOCR ERROR:"
        )

        print(e)

        return ""


# ========================================
# 6. LOAD DATASET LABELS
# ========================================

print("\nLoading dataset labels...")

try:

    labels_df = pd.read_csv(
        LABEL_FILE
    )

    print(
        "Labels loaded:",
        len(labels_df)
    )

except Exception as e:

    print(
        "Could not load labels.csv:"
    )

    print(e)

    labels_df = pd.DataFrame()


# ========================================
# 7. CHECK IMAGE FOLDER
# ========================================

if not os.path.exists(
    IMAGE_FOLDER
):

    print(
        "\nERROR:"
    )

    print(
        "Image folder not found:"
    )

    print(
        IMAGE_FOLDER
    )

    raise SystemExit


# ========================================
# 8. GET IMAGES
# ========================================

image_files = [

    file

    for file in os.listdir(
        IMAGE_FOLDER
    )

    if file.lower().endswith(
        (
            ".png",
            ".jpg",
            ".jpeg"
        )
    )
]

image_files.sort()

# ----------------------------------------
# Process first 5 images for testing
# ----------------------------------------

image_files = image_files[:5]

print(
    "\nImages found:",
    len(image_files)
)


# ========================================
# 9. PROCESS IMAGES
# ========================================

results = []


for index, image_file in enumerate(
    image_files,
    start=1
):

    print("\n")

    print(
        "=" * 40
    )

    print(
        f"PROCESSING IMAGE "
        f"{index}/{len(image_files)}"
    )

    print(
        "Image:",
        image_file
    )

    print(
        "=" * 40
    )

    image_path = os.path.join(
        IMAGE_FOLDER,
        image_file
    )

    # ------------------------------------
    # Run OCR
    # ------------------------------------

    text = extract_text(
        image_path
    )

    print(
        "\n---------- OCR OUTPUT ----------"
    )

    if text:

        print(text)

    else:

        print(
            "No text detected."
        )

    # ------------------------------------
    # Extract dosage/frequency
    # ------------------------------------

    extracted = extract_medical_terms(
        text
    )

    # ------------------------------------
    # Get labels for this image
    # ------------------------------------

    image_labels = []

    if not labels_df.empty:

        try:

            image_rows = labels_df[
                labels_df["image"]
                == image_file
            ]

            for _, row in image_rows.iterrows():

                image_labels.append({

                    "medicine": str(
                        row["medicine"]
                    ),

                    "dosage": str(
                        row["dosage"]
                    ),

                    "frequency": str(
                        row["frequency"]
                    )
                })

        except Exception as e:

            print(
                "Label reading error:",
                e
            )

    # ------------------------------------
    # Save result
    # ------------------------------------

    result = {

        "image": image_file,

        "ocr_text": text,

        "extracted_medical_terms": {

            "medicines":
                extracted[
                    "medicines"
                ],

            "dosages":
                extracted[
                    "dosages"
                ],

            "frequencies":
                extracted[
                    "frequencies"
                ]
        },

        "dataset_labels":
            image_labels
    }

    results.append(
        result
    )

    # ------------------------------------
    # Display labels
    # ------------------------------------

    if image_labels:

        print(
            "\n---------- DATASET LABEL ----------"
        )

        for item in image_labels:

            print(
                "Medicine:",
                item["medicine"]
            )

            print(
                "Dosage:",
                item["dosage"]
            )

            print(
                "Frequency:",
                item["frequency"]
            )


# ========================================
# 10. SAVE OCR RESULTS
# ========================================

with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        results,
        file,
        indent=2,
        ensure_ascii=False
    )


# ========================================
# 11. COMPLETION MESSAGE
# ========================================

print("\n")

print(
    "=" * 40
)

print(
    "       OCR COMPLETED"
)

print(
    "=" * 40
)

print(
    "Images processed:",
    len(results)
)

print(
    "Output saved to:"
)

print(
    OUTPUT_FILE
)

print(
    "=" * 40
)