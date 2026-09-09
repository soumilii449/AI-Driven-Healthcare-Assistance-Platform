import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  BookOpen,
  Languages,
  ClipboardList,
  ArrowRight,
  CheckCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import { getDocuments } from "../services/api";

const quickAccessCards = [
  {
    title: "Upload Prescription",
    description: "Upload a prescription image for AI analysis.",
    icon: Upload,
    to: "/upload",
  },
  {
    title: "Medical Information",
    description: "View structured information extracted from your prescription.",
    icon: FileText,
    to: "/results",
  },
  {
    title: "Simple Explanation",
    description: "Understand difficult medical terms in easier language.",
    icon: BookOpen,
    to: "/results",
  },
  {
    title: "Hindi Translation",
    description: "View simplified information in Hindi.",
    icon: Languages,
    to: "/translation",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState("");

  // =====================================
  // LOAD ALL PREVIOUS PRESCRIPTIONS
  // =====================================

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setDocumentsError("");

      const response = await getDocuments();

      console.log("All documents response:", response);

      let documentList = [];

      if (Array.isArray(response)) {
        documentList = response;
      } else if (Array.isArray(response?.documents)) {
        documentList = response.documents;
      } else if (Array.isArray(response?.data)) {
        documentList = response.data;
      } else if (Array.isArray(response?.data?.documents)) {
        documentList = response.data.documents;
      }

      // Newest first
      documentList.sort((a, b) => {
        const dateA = new Date(
          a.created_at ||
          a.uploaded_at ||
          a.processed_at ||
          0
        );

        const dateB = new Date(
          b.created_at ||
          b.uploaded_at ||
          b.processed_at ||
          0
        );

        return dateB - dateA;
      });

      setDocuments(documentList);

    } catch (error) {
      console.error(
        "Error loading documents:",
        error
      );

      setDocumentsError(
        "Unable to load previous prescription analyses."
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // =====================================
  // DOCUMENT ID
  // =====================================

  const getDocumentId = (document) => {
    return (
      document?.document_id ||
      document?.documentId ||
      document?.id ||
      document?.document?.id
    );
  };

  // =====================================
  // FILE NAME
  // =====================================

  const getFileName = (document) => {
    return (
      document?.filename ||
      document?.file_name ||
      document?.original_filename ||
      document?.name ||
      `Prescription #${getDocumentId(document) || ""}`
    );
  };

  // =====================================
  // STATUS
  // =====================================

  const getStatus = (document) => {
    const status = String(
      document?.status ||
      document?.processing_status ||
      "processed"
    ).toLowerCase();

    if (
      status.includes("process") ||
      status === "success" ||
      status === "completed"
    ) {
      return "Processed";
    }

    if (
      status.includes("pending") ||
      status.includes("processing")
    ) {
      return "Processing";
    }

    if (status.includes("fail")) {
      return "Failed";
    }

    return "Uploaded";
  };

  // =====================================
  // DATE
  // =====================================

  const formatDate = (document) => {
    const rawDate =
      document?.created_at ||
      document?.uploaded_at ||
      document?.processed_at;

    if (!rawDate) {
      return "Recent analysis";
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return "Recent analysis";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================
  // VIEW RESULTS
  // =====================================

  const handleViewResults = (document) => {
    const documentId = getDocumentId(document);

    if (!documentId) {
      return;
    }

    localStorage.setItem(
      "selected_document_id",
      String(documentId)
    );

    navigate(
      `/results?id=${encodeURIComponent(documentId)}`
    );
  };

  return (
    <div className="dashboard-modern">

      {/* =================================
          HERO
      ================================= */}

      <section className="dashboard-hero">

        <div className="hero-content">

          <div className="hero-badge">
            <Sparkles size={15} />
            AI-Powered Healthcare Assistant
          </div>

          <h1>
            Understand Your
            <span> Prescription Easily</span>
          </h1>

          <p>
            Upload your prescription and let AI convert
            complex medical information into simple,
            understandable insights.
          </p>

          <div className="hero-actions">

            <Link
              to="/upload"
              className="hero-primary-button"
            >
              <Upload size={19} />
              Upload Prescription
            </Link>

            <Link
              to="/results"
              className="hero-secondary-button"
            >
              View Latest Results
              <ArrowRight size={18} />
            </Link>

          </div>

        </div>

        <div className="hero-visual">

          <div className="floating-card floating-card-one">
            <CheckCircle size={18} />
            <div>
              <strong>AI Analysis</strong>
              <span>Ready</span>
            </div>
          </div>

          <div className="hero-medical-icon">
            <Sparkles size={55} />
          </div>

          <div className="floating-card floating-card-two">
            <Languages size={18} />
            <div>
              <strong>Hindi Support</strong>
              <span>Available</span>
            </div>
          </div>

        </div>

      </section>

      {/* =================================
          QUICK ACCESS
      ================================= */}

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <span>QUICK ACCESS</span>
            <h2>Everything You Need</h2>
          </div>
        </div>

        <div className="quick-access-grid">

          {quickAccessCards.map(
            ({
              title,
              description,
              icon: Icon,
              to,
            }) => (

              <Link
                key={title}
                to={to}
                className="quick-access-card"
              >

                <div className="quick-icon">
                  <Icon size={24} />
                </div>

                <div className="quick-card-content">
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>

                <ArrowRight
                  size={18}
                  className="quick-arrow"
                />

              </Link>

            )
          )}

        </div>

      </section>

      {/* =================================
          AI PIPELINE
      ================================= */}

      <section className="pipeline-card">

        <div className="pipeline-header">

          <div>
            <span>HOW IT WORKS</span>
            <h2>AI Prescription Pipeline</h2>
            <p>
              Your prescription passes through multiple
              intelligent processing stages.
            </p>
          </div>

          <div className="pipeline-ai-badge">
            <Sparkles size={15} />
            AI Powered
          </div>

        </div>

        <div className="pipeline">

          <div className="pipeline-step">
            <div className="pipeline-number">01</div>
            <Upload size={24} />
            <strong>Upload</strong>
            <span>Prescription</span>
          </div>

          <div className="pipeline-connector"></div>

          <div className="pipeline-step">
            <div className="pipeline-number">02</div>
            <FileText size={24} />
            <strong>OCR</strong>
            <span>Text Extraction</span>
          </div>

          <div className="pipeline-connector"></div>

          <div className="pipeline-step">
            <div className="pipeline-number">03</div>
            <Sparkles size={24} />
            <strong>AI Extraction</strong>
            <span>Medical Data</span>
          </div>

          <div className="pipeline-connector"></div>

          <div className="pipeline-step">
            <div className="pipeline-number">04</div>
            <BookOpen size={24} />
            <strong>Analysis</strong>
            <span>Simplification</span>
          </div>

          <div className="pipeline-connector"></div>

          <div className="pipeline-step">
            <div className="pipeline-number">05</div>
            <Languages size={24} />
            <strong>Translation</strong>
            <span>Hindi</span>
          </div>

        </div>

      </section>

      {/* =================================
          ALL PRESCRIPTIONS
      ================================= */}

      <section className="dashboard-section">

        <div className="section-heading history-heading">

          <div>
            <span>YOUR ACTIVITY</span>

            <h2>
              Prescription History
            </h2>

            <p>
              Access all your previously analyzed prescriptions.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadDocuments}
            disabled={loadingDocuments}
          >
            <RefreshCw
              size={16}
              className={
                loadingDocuments
                  ? "spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

        {/* LOADING */}

        {loadingDocuments && (

          <div className="history-loading">

            <LoaderIcon />

            <p>
              Loading your prescription history...
            </p>

          </div>

        )}

        {/* ERROR */}

        {!loadingDocuments &&
          documentsError && (

            <div className="history-error">

              <AlertCircleIcon />

              <p>
                {documentsError}
              </p>

              <button
                onClick={loadDocuments}
              >
                Try Again
              </button>

            </div>

          )}

        {/* NO DOCUMENTS */}

        {!loadingDocuments &&
          !documentsError &&
          documents.length === 0 && (

            <div className="history-empty">

              <div className="empty-icon">
                <ClipboardList size={30} />
              </div>

              <h3>
                No prescription analyses yet
              </h3>

              <p>
                Upload your first prescription
                to start using the AI assistant.
              </p>

              <Link
                to="/upload"
                className="hero-primary-button"
              >
                <Upload size={18} />
                Upload Prescription
              </Link>

            </div>

          )}

        {/* ALL DOCUMENTS */}

        {!loadingDocuments &&
          !documentsError &&
          documents.length > 0 && (

            <div className="prescription-history">

              {documents.map(
                (document, index) => {

                  const documentId =
                    getDocumentId(document);

                  const fileName =
                    getFileName(document);

                  const status =
                    getStatus(document);

                  const isProcessed =
                    status === "Processed";

                  return (

                    <div
                      key={
                        documentId ||
                        index
                      }
                      className="history-card"
                    >

                      <div className="history-file-icon">
                        <ClipboardList
                          size={24}
                        />
                      </div>

                      <div className="history-info">

                        <div className="history-title-row">

                          <h3>
                            Prescription Analysis
                          </h3>

                          <span
                            className={
                              isProcessed
                                ? "status-badge processed"
                                : "status-badge"
                            }
                          >

                            {isProcessed ? (
                              <CheckCircle size={13} />
                            ) : (
                              <Clock size={13} />
                            )}

                            {status}

                          </span>

                        </div>

                        <p className="history-file-name">
                          {fileName}
                        </p>

                        <div className="history-meta">

                          <span>
                            <FileText
                              size={14}
                            />

                            Document #
                            {documentId || "—"}
                          </span>

                          <span>
                            <Clock
                              size={14}
                            />

                            {formatDate(
                              document
                            )}
                          </span>

                        </div>

                      </div>

                      <button
                        className="view-results-button"
                        onClick={() =>
                          handleViewResults(
                            document
                          )
                        }
                        disabled={!documentId}
                      >
                        View Results
                        <ArrowRight
                          size={17}
                        />
                      </button>

                    </div>

                  );
                }
              )}

            </div>

          )}

      </section>

      {/* =================================
          PRIVACY
      ================================= */}

      <section className="privacy-section">

        <div className="privacy-icon">
          <ShieldCheck size={27} />
        </div>

        <div>
          <span>PRIVACY FIRST</span>

          <h2>
            Your prescription stays private.
          </h2>

          <p>
            Prescription images are not displayed
            in your dashboard history. Only essential
            analysis information is shown.
          </p>
        </div>

        <div className="privacy-status">
          <CheckCircle size={16} />
          No Image Preview
        </div>

      </section>

      <p className="dashboard-disclaimer">
        Information provided is for understanding purposes
        and should not replace advice from a qualified
        healthcare professional.
      </p>

    </div>
  );
}

/* Small internal icons */

function LoaderIcon() {
  return (
    <RefreshCw
      size={28}
      className="spin"
    />
  );
}

function AlertCircleIcon() {
  return (
    <span className="error-circle">
      !
    </span>
  );
}