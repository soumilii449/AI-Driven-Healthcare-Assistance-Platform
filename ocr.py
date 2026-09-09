# ========================================
# OCR FOR MEDICAL PRESCRIPTION IMAGES
# PaddleOCR 3.7.0
# ========================================

import os

# Disable oneDNN / MKL-DNN and PIR
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"

import json
import re
import pandas as pd
from paddleocr import PaddleOCR


# ========================================
# 1. PATHS
# ========================================

IMAGE_FOLDER = "dataset/synthetic_prescription_dataset/images"

LABEL_FILE = "dataset/synthetic_prescription_dataset/labels.csv"

OUTPUT_FOLDER = "output"

OUTPUT_FILE = "output/ocr_results.json"


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
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False
    )

    print("OCR model loaded successfully!")

except Exception as e:

    print("\nERROR while loading OCR model:")
    print(e)

    raise


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

    frequency_pattern = r"\b[01]-[01]-[01]\b"

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
# 5. CONVERT PADDLEOCR RESULT TO TEXT
# ========================================

def _extract_text_from_result(result):

    all_text = []

    if result is None:
        return ""

    # ------------------------------------
    # PaddleOCR returns iterable results
    # ------------------------------------

    try:

        for page in result:

            page_data = None

            # --------------------------------
            # Method 1: page.json
            # --------------------------------

            try:

                page_data = page.json

            except Exception:

                page_data = None

            # --------------------------------
            # JSON string -> dictionary
            # --------------------------------

            if isinstance(
                page_data,
                str
            ):

                try:

                    page_data = json.loads(
                        page_data
                    )

                except Exception:

                    page_data = None

            # --------------------------------
            # If page.json is unavailable
            # --------------------------------

            if page_data is None:

                try:

                    page_data = dict(page)

                except Exception:

                    page_data = None

            # --------------------------------
            # Skip invalid result
            # --------------------------------

            if not isinstance(
                page_data,
                dict
            ):

                continue

            # --------------------------------
            # PaddleOCR 3.x may return:
            #
            # {
            #   "res": {
            #       "rec_texts": [...]
            #   }
            # }
            #
            # OR directly:
            #
            # {
            #   "rec_texts": [...]
            # }
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

            # --------------------------------
            # Get recognized text
            # --------------------------------

            texts = data.get(
                "rec_texts",
                []
            )

            # --------------------------------
            # Sometimes rec_texts may be
            # stored differently
            # --------------------------------

            if not texts:

                texts = data.get(
                    "texts",
                    []
                )

            if not isinstance(
                texts,
                list
            ):

                continue

            # --------------------------------
            # Add text
            # --------------------------------

            for item in texts:

                if item is None:
                    continue

                item = str(item).strip()

                if item:

                    all_text.append(
                        item
                    )

    except Exception as e:

        print(
            "\nResult parsing error:"
        )

        print(e)

    # ------------------------------------
    # Combine text
    # ------------------------------------

    final_text = " ".join(
        all_text
    )

    return final_text.strip()


# ========================================
# 6. OCR IMAGE
# ========================================

def extract_text(image_path):

    print("\nReading image:")
    print(image_path)

    if not os.path.exists(
        image_path
    ):

        print(
            "ERROR: Image does not exist."
        )

        return ""

    try:

        # --------------------------------
        # Run PaddleOCR
        # --------------------------------

        result = ocr.predict(
            image_path
        )

        print(
            "OCR prediction completed."
        )

        # --------------------------------
        # Extract text safely
        # --------------------------------

        final_text = _extract_text_from_result(
            result
        )

        # --------------------------------
        # Display result
        # --------------------------------

        print(
            "\n---------- OCR TEXT ----------"
        )

        if final_text:

            print(
                final_text
            )

        else:

            print(
                "No text detected."
            )

        print(
            "------------------------------"
        )

        return final_text

    except Exception as e:

        print(
            "\nOCR ERROR:"
        )

        print(
            type(e).__name__
        )

        print(
            str(e)
        )

        return ""


# ========================================
# 7. LOAD DATASET LABELS
# ========================================

print(
    "\nLoading dataset labels..."
)

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
# 8. CHECK IMAGE FOLDER
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
# 9. GET DATASET IMAGES
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
# 10. PROCESS DATASET IMAGES
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

    # ------------------------------------
    # Extract dosage/frequency
    # ------------------------------------

    extracted = extract_medical_terms(
        text
    )

    # ------------------------------------
    # Get labels
    # ------------------------------------

    image_labels = []

    if not labels_df.empty:

        try:

            if "image" in labels_df.columns:

                image_rows = labels_df[
                    labels_df["image"]
                    == image_file
                ]

                for _, row in image_rows.iterrows():

                    image_labels.append({

                        "medicine": str(
                            row.get(
                                "medicine",
                                ""
                            )
                        ),

                        "dosage": str(
                            row.get(
                                "dosage",
                                ""
                            )
                        ),

                        "frequency": str(
                            row.get(
                                "frequency",
                                ""
                            )
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
# 11. SAVE OCR RESULTS
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
# 12. COMPLETION MESSAGE
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