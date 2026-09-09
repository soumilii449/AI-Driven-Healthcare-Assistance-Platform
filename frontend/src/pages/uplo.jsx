import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  FileImage,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  uploadDocument,
  processDocument,
} from "../services/api";

function Uplo() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // 0 = idle, 1 = uploading, 2 = analysing, 3 = done
  const [uploadStep, setUploadStep] = useState(0);

  // =====================================
  // SELECT FILE
  // =====================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);

      setError(
        "Please select a PNG, JPG or JPEG image."
      );

      return;
    }

    setSelectedFile(file);
  };

  // =====================================
  // REMOVE FILE
  // =====================================

  const removeFile = () => {
    if (loading) return;
    setSelectedFile(null);
    setError("");
    setSuccess("");
    setUploadStep(0);
  };

  // =====================================
  // GET DOCUMENT ID
  // =====================================

  const extractDocumentId = (data) => {
    if (!data) {
      return null;
    }

    return (
      data.document_id ||
      data.documentId ||
      data.id ||
      data.document?.id ||
      data.document?.document_id ||
      data.data?.document_id ||
      data.data?.id ||
      data.data?.document?.id ||
      null
    );
  };

  // =====================================
  // ERROR MESSAGE
  // =====================================

  const getErrorMessage = (err) => {
    if (!err) {
      return "Something went wrong.";
    }

    if (err.response?.data?.detail) {
      const detail = err.response.data.detail;

      if (typeof detail === "string") {
        return detail;
      }

      if (Array.isArray(detail)) {
        return detail
          .map((item) => {
            if (typeof item === "string") {
              return item;
            }

            if (item?.msg) {
              return item.msg;
            }

            return JSON.stringify(item);
          })
          .join(", ");
      }

      if (typeof detail === "object") {
        return (
          detail.msg ||
          JSON.stringify(detail)
        );
      }
    }

    if (err.message) {
      return err.message;
    }

    return "Unable to process the prescription.";
  };

  // =====================================
  // UPLOAD + PROCESS
  // =====================================

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(
        "Please select a prescription image first."
      );

      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setUploadStep(0);

    try {
      // STEP 1: UPLOAD
      setUploadStep(1);
      setSuccess(
        "Uploading prescription..."
      );

      const uploadResponse =
        await uploadDocument(selectedFile);

      console.log(
        "Upload response:",
        uploadResponse
      );

      // STEP 2: GET DOCUMENT ID

      const documentId =
        extractDocumentId(uploadResponse);

      console.log(
        "Detected document ID:",
        documentId
      );

      if (!documentId) {
        console.error(
          "Complete upload response:",
          uploadResponse
        );

        throw new Error(
          "Document ID was not returned by the server."
        );
      }

      // STEP 3: SAVE DOCUMENT ID

      localStorage.setItem(
        "last_document_id",
        String(documentId)
      );

      // STEP 4: PROCESS
      setUploadStep(2);
      setSuccess(
        "Prescription uploaded. AI is analyzing it..."
      );

      const processResponse =
        await processDocument(documentId);

      console.log(
        "Process response:",
        processResponse
      );

      // STEP 5: SAVE COMPLETE RESULT

      localStorage.setItem(
        "last_prescription_result",
        JSON.stringify(processResponse)
      );

      // STEP 6: SAVE SELECTED DOCUMENT

      localStorage.setItem(
        "selected_document_id",
        String(documentId)
      );

      localStorage.setItem(
        "analysis_result",
        JSON.stringify(processResponse)
      );

      // STEP 7: SUCCESS
      setUploadStep(3);
      setSuccess(
        "Prescription analyzed successfully!"
      );

      // STEP 8: GO TO RESULTS

      setTimeout(() => {
        navigate(
          `/results?id=${encodeURIComponent(
            documentId
          )}`,
          {
            state: {
              result: processResponse,
              documentId: documentId,
            },
          }
        );
      }, 500);

    } catch (err) {
      console.error(
        "Upload error:",
        err
      );

      setError(
        getErrorMessage(err)
      );

      setSuccess("");
      setUploadStep(0);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page-modern">

      {/* Background decoration */}
      <div className="upload-glow upload-glow-one"></div>
      <div className="upload-glow upload-glow-two"></div>

      <div className="upload-container-modern">

        {/* =================================
            HEADER
        ================================= */}

        <div className="upload-modern-header">

          <div className="upload-badge">
            <Sparkles size={15} />
            AI-Powered Medical Analysis
          </div>

          <h1>
            Upload Your Prescription
          </h1>

          <p>
            Let AI transform complex medical information
            into simple, understandable insights.
          </p>

        </div>

        {/* =================================
            ERROR
        ================================= */}

        {error && (
          <div className="modern-alert modern-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* =================================
            SUCCESS
        ================================= */}

        {success && (
          <div className="modern-alert modern-success">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* STEP PROGRESS INDICATOR (Feedback: Principle 7) */}

        {loading && (
          <div className="upload-progress-steps" role="status" aria-label="Upload progress">

            {/* Step 1: Upload */}
            <div className={`upload-step ${uploadStep >= 1 ? (uploadStep > 1 ? "done" : "active") : ""}`}>
              <div className="upload-step-circle">
                {uploadStep > 1 ? <CheckCircle size={16} /> : "1"}
              </div>
              <span className="upload-step-label">Uploading</span>
            </div>

            <div className={`upload-step-connector ${uploadStep > 1 ? "done" : uploadStep === 1 ? "active" : ""}`} />

            {/* Step 2: Analyse */}
            <div className={`upload-step ${uploadStep >= 2 ? (uploadStep > 2 ? "done" : "active") : ""}`}>
              <div className="upload-step-circle">
                {uploadStep > 2 ? <CheckCircle size={16} /> : "2"}
              </div>
              <span className="upload-step-label">Analysing</span>
            </div>

            <div className={`upload-step-connector ${uploadStep > 2 ? "done" : uploadStep === 2 ? "active" : ""}`} />

            {/* Step 3: Done */}
            <div className={`upload-step ${uploadStep >= 3 ? "done" : ""}`}>
              <div className="upload-step-circle">
                {uploadStep >= 3 ? <CheckCircle size={16} /> : "3"}
              </div>
              <span className="upload-step-label">Complete</span>
            </div>

          </div>
        )}

        {/* =================================
            MAIN CARD
        ================================= */}

        <div className="glass-upload-card">

          {!selectedFile ? (

            /* ==============================
               INITIAL UPLOAD
            ============================== */

            <label
              htmlFor="prescription-upload"
              className="modern-drop-zone"
            >

              <div className="upload-icon-circle">
                <UploadIcon size={32} />
              </div>

              <div>
                <h2>
                  Upload Prescription
                </h2>

                <p>
                  Click here to choose your prescription
                </p>

                <span>
                  PNG, JPG or JPEG • Max supported image
                </span>
              </div>

              <div className="upload-action">
                Choose Prescription
              </div>

              <input
                id="prescription-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                style={{
                  display: "none",
                }}
              />

            </label>

          ) : (

            /* ==============================
               FILE SELECTED
               NO IMAGE PREVIEW
            ============================== */

            <div className="selected-file-area">

              <div className="privacy-banner">
                <ShieldCheck size={20} />

                <div>
                  <strong>
                    Your prescription is private
                  </strong>

                  <span>
                    The prescription image is not displayed
                    on this screen.
                  </span>
                </div>
              </div>

              {/* FILE CARD */}

              <div className="selected-file-card">

                <div className="file-icon-wrapper">
                  <FileImage size={28} />
                </div>

                <div className="file-details">

                  <strong>
                    {selectedFile.name}
                  </strong>

                  <span>
                    {(
                      selectedFile.size / 1024
                    ).toFixed(1)} KB
                  </span>

                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  disabled={loading}
                  className="remove-file-button"
                  aria-label="Remove selected file"
                >
                  <X size={20} />
                </button>

              </div>

              {/* ANALYSIS INFO */}

              <div className="analysis-info">

                <div className="analysis-step">
                  <div className="step-number">
                    1
                  </div>

                  <div>
                    <strong>
                      Secure Upload
                    </strong>

                    <span>
                      Your prescription is securely uploaded.
                    </span>
                  </div>
                </div>

                <div className="analysis-line"></div>

                <div className="analysis-step">
                  <div className="step-number">
                    2
                  </div>

                  <div>
                    <strong>
                      AI Analysis
                    </strong>

                    <span>
                      Medical information is extracted and processed.
                    </span>
                  </div>
                </div>

                <div className="analysis-line"></div>

                <div className="analysis-step">
                  <div className="step-number">
                    3
                  </div>

                  <div>
                    <strong>
                      Easy Results
                    </strong>

                    <span>
                      Get simplified and translated information.
                    </span>
                  </div>
                </div>

              </div>

              {/* ANALYZE BUTTON */}

              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className="modern-analyze-button"
              >

                {loading ? (

                  <>
                    <Loader2
                      size={21}
                      className="spin"
                    />

                    AI is analyzing your prescription...
                  </>

                ) : (

                  <>
                    <Sparkles size={21} />

                    Analyze Prescription
                  </>

                )}

              </button>

              {/* BACK BUTTON */}

              <button
                type="button"
                onClick={() =>
                  navigate("/dashboard")
                }
                disabled={loading}
                className="modern-back-button"
              >
                Back to Dashboard
              </button>

            </div>
          )}

        </div>

        {/* =================================
            FEATURES
        ================================= */}

        <div className="upload-features">

          <div className="upload-feature">
            <ShieldCheck size={20} />
            <span>Privacy Focused</span>
          </div>

          <div className="upload-feature">
            <Sparkles size={20} />
            <span>AI Powered</span>
          </div>

          <div className="upload-feature">
            <FileImage size={20} />
            <span>Multiple Image Formats</span>
          </div>

        </div>

        <p className="upload-disclaimer">
          Information provided is for understanding purposes only
          and should not replace advice from a qualified healthcare professional.
        </p>

      </div>
    </div>
  );
}

export default Uplo;