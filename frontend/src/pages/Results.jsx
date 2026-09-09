import { useEffect, useState } from "react";
import {
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  ArrowLeft,
  FileText,
  Pill,
  Stethoscope,
  Languages,
} from "lucide-react";

import { getDocumentResult } from "../services/api";

export default function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================
  // GET DOCUMENT ID
  // =====================================

  const documentId =
    searchParams.get("id") ||
    location.state?.documentId ||
    localStorage.getItem(
      "selected_document_id"
    ) ||
    localStorage.getItem(
      "last_document_id"
    );

  // =====================================
  // LOAD RESULT
  // =====================================

  useEffect(() => {
    const loadResult = async () => {
      setLoading(true);
      setError("");

      try {

        // ---------------------------------
        // OPTION 1:
        // RESULT PASSED FROM UPLOAD PAGE
        // ---------------------------------

        if (location.state?.result) {

          console.log(
            "Using result from navigation state:",
            location.state.result
          );

          setResult(
            location.state.result
          );

          // Also save it for refresh
          localStorage.setItem(
            "last_prescription_result",
            JSON.stringify(
              location.state.result
            )
          );

          localStorage.setItem(
            "analysis_result",
            JSON.stringify(
              location.state.result
            )
          );

          setLoading(false);
          return;
        }

        // ---------------------------------
        // OPTION 2:
        // LOAD FROM LOCAL STORAGE
        // ---------------------------------

        const savedResult =
          localStorage.getItem(
            "last_prescription_result"
          ) ||
          localStorage.getItem(
            "analysis_result"
          );

        if (savedResult) {

          try {

            const parsedResult =
              JSON.parse(savedResult);

            console.log(
              "Using saved result:",
              parsedResult
            );

            // If the saved result belongs to the
            // selected document, use it.
            if (
              !documentId ||
              !parsedResult.document_id ||
              String(
                parsedResult.document_id
              ) === String(documentId)
            ) {
              setResult(parsedResult);
              setLoading(false);
              return;
            }

          } catch (storageError) {

            console.error(
              "Could not parse saved result:",
              storageError
            );

          }
        }

        // ---------------------------------
        // OPTION 3:
        // LOAD FROM BACKEND
        // ---------------------------------

        if (!documentId) {
          setError(
            "No document selected."
          );

          setLoading(false);
          return;
        }

        console.log(
          "Loading result from backend for document:",
          documentId
        );

        const data =
          await getDocumentResult(
            documentId
          );

        console.log(
          "Backend result:",
          data
        );

        setResult(data);

        // Save backend result
        localStorage.setItem(
          "last_prescription_result",
          JSON.stringify(data)
        );

        localStorage.setItem(
          "analysis_result",
          JSON.stringify(data)
        );

      } catch (err) {

        console.error(
          "Error loading result:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Unable to load results."
        );

      } finally {

        setLoading(false);

      }
    };

    loadResult();

  }, [documentId, location.state]);

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="loading-screen">
        Loading prescription results...
      </div>
    );
  }

  // =====================================
  // ERROR
  // =====================================

  if (error) {
    return (
      <div className="results-page">

        <div className="error-message">
          {error}
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Back to Dashboard
        </button>

      </div>
    );
  }

  // =====================================
  // MEDICAL INFORMATION
  // =====================================

  const medicalInfo =
    result?.processed_data?.medical_information ||
    result?.medical_information ||
    {};

  const medications =
    medicalInfo.medications || [];

  // =====================================
  // TREATMENT
  // =====================================

  const treatment =
    result?.processed_data?.treatment_english ||
    result?.treatment_english ||
    "";

  // =====================================
  // OCR TEXT
  // =====================================

  const ocrText =
    result?.processed_data?.ocr_text ||
    result?.raw_text ||
    result?.ocr_text ||
    "";

  // =====================================
  // SIMPLIFIED INFORMATION
  // =====================================

  const simplifiedInfo =
    result?.processed_data?.simplified_information ||
    result?.simplified_information ||
    {};

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="results-page">

      {/* =================================
          HEADER
      ================================= */}

      <header className="results-header">

        <button
          className="back-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <ArrowLeft size={20} />
          Dashboard
        </button>

        <h1>
          Prescription Results
        </h1>

      </header>

      <main className="results-container">

        {/* =================================
            SUCCESS MESSAGE
        ================================= */}

        <section
          className="result-card"
          style={{
            borderLeft:
              "4px solid #22c55e",
          }}
        >

          <div className="result-title">

            <FileText size={25} />

            <h2>
              Analysis Completed Successfully
            </h2>

          </div>

          <p>
            Prescription processed successfully.
          </p>

          {result?.document_id && (
            <p>
              <strong>Document ID:</strong>{" "}
              {result.document_id}
            </p>
          )}

          {result?.extraction_id && (
            <p>
              <strong>Extraction ID:</strong>{" "}
              {result.extraction_id}
            </p>
          )}

        </section>

        {/* =================================
            OCR
        ================================= */}

        <section className="result-card">

          <div className="result-title">

            <FileText size={25} />

            <h2>
              Extracted Prescription Text
            </h2>

          </div>

          <div className="ocr-text">

            {ocrText ||
              "No OCR text available."}

          </div>

        </section>

        {/* =================================
            MEDICAL INFORMATION
        ================================= */}

        <section className="result-card">

          <div className="result-title">

            <Stethoscope size={25} />

            <h2>
              Medical Information
            </h2>

          </div>

          <div className="medical-grid">

            <div>

              <strong>
                Doctors
              </strong>

              <p>
                {medicalInfo.physicians?.length
                  ? medicalInfo.physicians.join(
                      ", "
                    )
                  : "Not available"}
              </p>

            </div>

            <div>

              <strong>
                Symptoms
              </strong>

              <p>
                {medicalInfo.symptoms?.length
                  ? medicalInfo.symptoms.join(
                      ", "
                    )
                  : "Not available"}
              </p>

            </div>

            <div>

              <strong>
                Conditions
              </strong>

              <p>
                {medicalInfo.medical_conditions
                  ?.length
                  ? medicalInfo.medical_conditions.join(
                      ", "
                    )
                  : "Not available"}
              </p>

            </div>

            <div>

              <strong>
                Diagnoses
              </strong>

              <p>
                {medicalInfo.diagnoses?.length
                  ? medicalInfo.diagnoses.join(
                      ", "
                    )
                  : "Not available"}
              </p>

            </div>

            <div>

              <strong>
                Allergies
              </strong>

              <p>
                {medicalInfo.allergies?.length
                  ? medicalInfo.allergies.join(
                      ", "
                    )
                  : "Not available"}
              </p>

            </div>

          </div>

        </section>

        {/* =================================
            MEDICATIONS
        ================================= */}

        <section className="result-card">

          <div className="result-title">

            <Pill size={25} />

            <h2>
              Medications
            </h2>

          </div>

          {medications.length === 0 ? (

            <p>
              No medications detected.
            </p>

          ) : (

            <div className="medication-list">

              {medications.map(
                (medicine, index) => (

                  <div
                    className="medication-item"
                    key={index}
                  >

                    <h3>
                      {medicine.name ||
                        "Unknown medicine"}
                    </h3>

                    <p>
                      <strong>
                        Dosage:
                      </strong>{" "}
                      {medicine.dosage ||
                        "N/A"}
                    </p>

                    <p>
                      <strong>
                        Frequency:
                      </strong>{" "}
                      {medicine.frequency ||
                        "N/A"}
                    </p>

                    <p>
                      <strong>
                        Duration:
                      </strong>{" "}
                      {medicine.duration ||
                        "N/A"}
                    </p>

                    <p>
                      <strong>
                        Route:
                      </strong>{" "}
                      {medicine.route ||
                        "N/A"}
                    </p>

                    {medicine.purpose && (
                      <p>
                        <strong>
                          Purpose:
                        </strong>{" "}
                        {medicine.purpose}
                      </p>
                    )}

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* =================================
            SIMPLIFIED INFORMATION
        ================================= */}

        {Object.keys(simplifiedInfo).length >
          0 && (

          <section className="result-card">

            <div className="result-title">

              <FileText size={25} />

              <h2>
                Simplified Medical Information
              </h2>

            </div>

            <div>

              {simplifiedInfo.medications?.length >
                0 && (

                <div>

                  <strong>
                    Medications
                  </strong>

                  {simplifiedInfo.medications.map(
                    (medicine, index) => (

                      <p key={index}>
                        {medicine.name}
                        {medicine.dosage
                          ? ` - ${medicine.dosage}`
                          : ""}
                      </p>

                    )
                  )}

                </div>

              )}

              {simplifiedInfo.diagnoses?.length >
                0 && (

                <p>
                  <strong>
                    Diagnoses:
                  </strong>{" "}
                  {simplifiedInfo.diagnoses.join(
                    ", "
                  )}
                </p>

              )}

              {simplifiedInfo.symptoms?.length >
                0 && (

                <p>
                  <strong>
                    Symptoms:
                  </strong>{" "}
                  {simplifiedInfo.symptoms.join(
                    ", "
                  )}
                </p>

              )}

            </div>

          </section>

        )}

        {/* =================================
            TREATMENT
        ================================= */}

        <section className="result-card">

          <div className="result-title">

            <Stethoscope size={25} />

            <h2>
              Treatment Information
            </h2>

          </div>

          <p className="treatment-text">

            {treatment ||
              "No treatment information available."}

          </p>

        </section>

        {/* =================================
            ACTIONS
        ================================= */}

        <div className="result-actions">

          <button
            className="primary-button"
            onClick={() =>
              navigate(
                `/translation?id=${documentId}`
              )
            }
          >

            <Languages size={20} />

            View Hindi Translation

          </button>

        </div>

      </main>

    </div>
  );
}