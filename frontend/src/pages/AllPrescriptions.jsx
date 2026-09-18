import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardList,
  FileText,
  RefreshCw,
  Upload,
} from "lucide-react";

import { getDocuments } from "../services/api";

const ITEMS_PER_PAGE = 8;

export default function AllPrescriptions() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  // =====================================
  // LOAD ALL PREVIOUS PRESCRIPTIONS
  // =====================================

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setDocumentsError("");

      const response = await getDocuments();

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
          a.created_at || a.uploaded_at || a.processed_at || 0
        );

        const dateB = new Date(
          b.created_at || b.uploaded_at || b.processed_at || 0
        );

        return dateB - dateA;
      });

      setDocuments(documentList);
      setCurrentPage(1);
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
      document?.status || document?.processing_status || "processed"
    ).toLowerCase();

    if (
      status.includes("process") ||
      status === "success" ||
      status === "completed"
    ) {
      return "Processed";
    }

    if (status.includes("pending") || status.includes("processing")) {
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

    localStorage.setItem("selected_document_id", String(documentId));

    navigate(`/results?id=${encodeURIComponent(documentId)}`);
  };

  // =====================================
  // PAGINATION
  // =====================================

  const totalPages = Math.max(
    1,
    Math.ceil(documents.length / ITEMS_PER_PAGE)
  );

  const paginatedDocuments = documents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    const clamped = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(clamped);
  };

  return (
    <div className="dashboard-modern">

      <section className="dashboard-section">

        <div className="section-heading history-heading">

          <div>
            <Link to="/dashboard" className="back-to-dashboard-link">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h2>All Prescriptions</h2>

            <p>
              Every prescription you've uploaded, all in one place.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadDocuments}
            disabled={loadingDocuments}
          >
            <RefreshCw
              size={16}
              className={loadingDocuments ? "spin" : ""}
            />
            Refresh
          </button>

        </div>

        {/* LOADING — Skeleton cards */}

        {loadingDocuments && (

          <div className="prescription-history">

            {[1, 2, 3, 4].map((i) => (

              <div key={i} className="skeleton-card">

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

        {!loadingDocuments && documentsError && (

          <div className="history-error" role="alert">

            <span className="error-circle">!</span>

            <p style={{ flex: 1 }}>{documentsError}</p>

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

                {paginatedDocuments.map((document, index) => {

                  const documentId = getDocumentId(document);
                  const fileName = getFileName(document);
                  const status = getStatus(document);
                  const isProcessed = status === "Processed";

                  return (

                    <div
                      key={documentId || index}
                      className="history-card"
                    >

                      <div className="history-file-icon">
                        <ClipboardList size={24} />
                      </div>

                      <div className="history-info">

                        <div className="history-title-row">

                          <h3>Prescription Analysis</h3>

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

                        <p className="history-file-name">{fileName}</p>

                        <div className="history-meta">

                          <span>
                            <FileText size={14} />
                            Document #{documentId || "—"}
                          </span>

                          <span>
                            <Clock size={14} />
                            {formatDate(document)}
                          </span>

                        </div>

                      </div>

                      <button
                        className="view-results-button"
                        onClick={() => handleViewResults(document)}
                        disabled={!documentId}
                      >
                        View Results
                        <ArrowRight size={17} />
                      </button>

                    </div>

                  );

                })}

              </div>

              {/* PAGINATION */}

              {totalPages > 1 && (

                <div className="pagination">

                  <button
                    className="pagination-button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                    Prev
                  </button>

                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    className="pagination-button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>

                </div>

              )}

            </>

          )}

      </section>

    </div>
  );
}