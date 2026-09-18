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
  HeartHandshake,
  RefreshCw,
  Eye,
} from "lucide-react";

import { getDocuments } from "../services/api";
import { useAuth } from "../context/AuthContext";

const quickAccessCards = [
  {
    title: "Upload Prescription",
    description: "Take a photo or upload a file — we'll take it from there.",
    icon: Upload,
    to: "/upload",
  },
  {
    title: "Medical Information",
    description:
      "See exactly what your prescription says, laid out clearly.",
    icon: FileText,
    to: "/results",
  },
  {
    title: "Simple Explanation",
    description:
      "Confusing medical terms, explained the way a friend would.",
    icon: BookOpen,
    to: "/results",
  },
  {
    title: "Hindi Translation",
    description: "Read your results in Hindi, whenever that's easier.",
    icon: Languages,
    to: "/translation",
  },
];

// =====================================
// TIME-OF-DAY GREETING
// =====================================

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.username?.split(/[.\s_]/)[0] || "there";

  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState("");

  const RECENT_ITEMS_COUNT = 2;

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
      console.error("Error loading documents:", error);

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

  // =====================================
  // RECENT DOCUMENTS (dashboard shows a preview;
  // the "View All" page shows everything)
  // =====================================

  const recentDocuments = documents.slice(0, RECENT_ITEMS_COUNT);

  return (
    <div className="dashboard-modern">

      {/* =================================
          HERO
      ================================= */}

      <section className="dashboard-hero">

        <div className="hero-content">

          <div className="hero-badge">
            <span className="hero-badge-dot" />
            {getGreeting()}, {firstName}
          </div>

          <h1>
            Let's make sense of
            <span> your prescription.</span>
          </h1>

          <p>
            Upload a photo and we'll turn the confusing parts into
            plain language you can actually understand — in English
            or Hindi, whichever feels easier.
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
              <strong>Ready when you are</strong>
              <span>No waiting around</span>
            </div>
          </div>

          <div className="hero-medical-icon">
            <HeartHandshake size={55} />
          </div>

          <div className="floating-card floating-card-two">
            <Languages size={18} />

            <div>
              <strong>Hindi, too</strong>
              <span>Read it your way</span>
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
            <h2>What would you like to do?</h2>
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
          ALL PRESCRIPTIONS
      ================================= */}

      <section className="dashboard-section">

        <div className="section-heading history-heading">

          <div>
            <span>YOUR ACTIVITY</span>

            <h2>
              Your Prescriptions
            </h2>

            <p>
              Everything you've uploaded, ready whenever you need it.
            </p>
          </div>

          <Link
            to="/prescriptions"
            className="refresh-button"
          >
            <Eye size={16} />
            View All
          </Link>

        </div>

        {/* LOADING — Skeleton cards */}

        {loadingDocuments && (

          <div className="prescription-history">

            {[1, 2, 3].map((i) => (

              <div
                key={i}
                className="skeleton-card"
              >

                <div className="skeleton skeleton-icon" />

                <div className="skeleton-lines">

                  <div className="skeleton skeleton-line skeleton-line-title" />

                  <div className="skeleton skeleton-line skeleton-line-sub" />

                  <div className="skeleton skeleton-line skeleton-line-meta" />

                </div>

                <div className="skeleton skeleton-btn" />

              </div>

            ))}

          </div>

        )}

        {/* ERROR */}

        {!loadingDocuments &&
          documentsError && (

            <div
              className="history-error"
              role="alert"
            >

              <AlertCircleIcon />

              <p style={{ flex: 1 }}>
                {documentsError}
              </p>

              <button
                onClick={loadDocuments}
                aria-label="Retry loading prescriptions"
              >
                Try Again
              </button>

            </div>

          )}

        {/* NO DOCUMENTS */}

        {!loadingDocuments &&
          !documentsError &&
          documents.length === 0 && (

            <div
              className="history-empty"
              role="region"
              aria-label="No prescriptions"
            >

              <div className="empty-icon">
                <ClipboardList size={30} />
              </div>

              <h3 className="history-empty-title">
                You haven't uploaded anything yet
              </h3>

              <p className="history-empty-sub">
                Upload your first prescription and we'll turn the
                confusing parts into plain language — usually in
                under a minute.
              </p>

              <Link
                to="/upload"
                className="empty-state-cta"
                aria-label="Upload your first prescription"
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

            <>

              <div className="prescription-history">

                {recentDocuments.map(
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

              {documents.length > RECENT_ITEMS_COUNT && (

                <div className="view-all-row">

                  <Link
                    to="/prescriptions"
                    className="view-all-link"
                  >
                    <Eye size={16} />
                    View All Prescriptions
                    <ArrowRight size={16} />
                  </Link>

                </div>

              )}

            </>

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
        This is here to help you understand your prescription —
        it's not a substitute for advice from your doctor or
        pharmacist.
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