import { useEffect, useRef, useState } from "react";
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
  Camera,
  RotateCcw,
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
  const [uploadStep, setUploadStep] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // =====================================
  // CLEAN UP CAMERA ON UNMOUNT
  // =====================================

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================
  // SHARED FILE VALIDATION
  // =====================================

  const processSelectedFile = (file) => {
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
      setError("Please select a PNG, JPG or JPEG image.");
      return;
    }

    setSelectedFile(file);
  };

  // =====================================
  // SELECT FILE (FILE PICKER)
  // =====================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    processSelectedFile(file);
    // reset the input so selecting the same file again re-triggers onChange
    event.target.value = "";
  };

  // =====================================
  // DRAG AND DROP
  // =====================================

  const handleDragOver = (event) => {
    event.preventDefault();
    if (loading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (loading) return;

    const file = event.dataTransfer.files?.[0];
    processSelectedFile(file);
  };

  // =====================================
  // CAMERA CAPTURE
  // =====================================

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setError("");
    setSuccess("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported on this device/browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      // videoRef isn't mounted yet on the same render, so
      // attach the stream right after the camera view renders.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 0);

    } catch (err) {
      console.error("Camera error:", err);

      if (err.name === "NotAllowedError") {
        setError("Camera permission was denied. Please allow camera access and try again.");
      } else if (err.name === "NotFoundError") {
        setError("No camera was found on this device.");
      } else {
        setError("Unable to access the camera.");
      }
    }
  };

  const closeCamera = () => {
    stopCameraStream();
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture photo. Please try again.");
          return;
        }

        const file = new File(
          [blob],
          `camera-capture-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        processSelectedFile(file);
        closeCamera();
      },
      "image/jpeg",
      0.92
    );
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
      setError("Please select a prescription image first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setUploadStep(0);

    try {
      setUploadStep(1);
      setSuccess("Uploading prescription...");

      const uploadResponse = await uploadDocument(selectedFile);

      console.log("Upload response:", uploadResponse);

      const documentId = extractDocumentId(uploadResponse);

      console.log("Detected document ID:", documentId);

      if (!documentId) {
        console.error("Complete upload response:", uploadResponse);
        throw new Error("Document ID was not returned by the server.");
      }

      localStorage.setItem("last_document_id", String(documentId));

      setUploadStep(2);
      setSuccess("Prescription uploaded. AI is analyzing it...");

      const processResponse = await processDocument(documentId);

      console.log("Process response:", processResponse);

      localStorage.setItem(
        "last_prescription_result",
        JSON.stringify(processResponse)
      );

      localStorage.setItem("selected_document_id", String(documentId));
      localStorage.setItem("analysis_result", JSON.stringify(processResponse));

      setUploadStep(3);
      setSuccess("Prescription analyzed successfully!");

      setTimeout(() => {
        navigate(
          `/results?id=${encodeURIComponent(documentId)}`,
          {
            state: {
              result: processResponse,
              documentId: documentId,
            },
          }
        );
      }, 500);

    } catch (err) {
      console.error("Upload error:", err);
      setError(getErrorMessage(err));
      setSuccess("");
      setUploadStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page-modern">

      <div className="upload-glow upload-glow-one"></div>
      <div className="upload-glow upload-glow-two"></div>

      <div className="upload-container-modern">

        <div className="upload-modern-header">
          <div className="upload-badge">
            <Sparkles size={15} />
            AI-Powered Medical Analysis
          </div>

          <h1>Upload Your Prescription</h1>

          <p>
            Let AI transform complex medical information
            into simple, understandable insights.
          </p>
        </div>

        {error && (
          <div className="modern-alert modern-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="modern-alert modern-success">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {loading && (
          <div className="upload-progress-steps" role="status" aria-label="Upload progress">
            <div className={`upload-step ${uploadStep >= 1 ? (uploadStep > 1 ? "done" : "active") : ""}`}>
              <div className="upload-step-circle">
                {uploadStep > 1 ? <CheckCircle size={16} /> : "1"}
              </div>
              <span className="upload-step-label">Uploading</span>
            </div>

            <div className={`upload-step-connector ${uploadStep > 1 ? "done" : uploadStep === 1 ? "active" : ""}`} />

            <div className={`upload-step ${uploadStep >= 2 ? (uploadStep > 2 ? "done" : "active") : ""}`}>
              <div className="upload-step-circle">
                {uploadStep > 2 ? <CheckCircle size={16} /> : "2"}
              </div>
              <span className="upload-step-label">Analysing</span>
            </div>

            <div className={`upload-step-connector ${uploadStep > 2 ? "done" : uploadStep === 2 ? "active" : ""}`} />

            <div className={`upload-step ${uploadStep >= 3 ? "done" : ""}`}>
              <div className="upload-step-circle">
                {uploadStep >= 3 ? <CheckCircle size={16} /> : "3"}
              </div>
              <span className="upload-step-label">Complete</span>
            </div>
          </div>
        )}

        <div className="glass-upload-card">

          {cameraOpen ? (

            /* ==============================
               CAMERA VIEW
            ============================== */

            <div className="camera-capture-area">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video-preview"
              />

              <canvas ref={canvasRef} style={{ display: "none" }} />

              <div className="camera-actions">
                <button
                  type="button"
                  className="modern-analyze-button"
                  onClick={capturePhoto}
                >
                  <Camera size={20} />
                  Capture Photo
                </button>

                <button
                  type="button"
                  className="modern-back-button"
                  onClick={closeCamera}
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>

            </div>

          ) : !selectedFile ? (

            /* ==============================
               INITIAL UPLOAD (DRAG & DROP + CLICK)
            ============================== */

            <>
              <label
                htmlFor="prescription-upload"
                className={`modern-drop-zone ${isDragging ? "drop-zone-active" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >

                <div className="upload-icon-circle">
                  <UploadIcon size={32} />
                </div>

                <div>
                  <h2>
                    {isDragging ? "Drop your prescription here" : "Upload Prescription"}
                  </h2>

                  <p>
                    Click to choose, or drag and drop your prescription here
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
                  style={{ display: "none" }}
                />

              </label>

              <button
                type="button"
                className="use-camera-button"
                onClick={openCamera}
              >
                <Camera size={18} />
                Use Camera Instead
              </button>
            </>

          ) : (

            /* ==============================
               FILE SELECTED
            ============================== */

            <div className="selected-file-area">

              <div className="privacy-banner">
                <ShieldCheck size={20} />
                <div>
                  <strong>Your prescription is private</strong>
                  <span>
                    The prescription image is not displayed on this screen.
                  </span>
                </div>
              </div>

              <div className="selected-file-card">

                <div className="file-icon-wrapper">
                  <FileImage size={28} />
                </div>

                <div className="file-details">
                  <strong>{selectedFile.name}</strong>
                  <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
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

              <button
                type="button"
                className="retake-button"
                onClick={() => {
                  removeFile();
                }}
                disabled={loading}
              >
                <RotateCcw size={16} />
                Choose a Different Image
              </button>

              <div className="analysis-info">

                <div className="analysis-step">
                  <div className="step-number">1</div>
                  <div>
                    <strong>Secure Upload</strong>
                    <span>Your prescription is securely uploaded.</span>
                  </div>
                </div>

                <div className="analysis-line"></div>

                <div className="analysis-step">
                  <div className="step-number">2</div>
                  <div>
                    <strong>AI Analysis</strong>
                    <span>Medical information is extracted and processed.</span>
                  </div>
                </div>

                <div className="analysis-line"></div>

                <div className="analysis-step">
                  <div className="step-number">3</div>
                  <div>
                    <strong>Easy Results</strong>
                    <span>Get simplified and translated information.</span>
                  </div>
                </div>

              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className="modern-analyze-button"
              >
                {loading ? (
                  <>
                    <Loader2 size={21} className="spin" />
                    AI is analyzing your prescription...
                  </>
                ) : (
                  <>
                    <Sparkles size={21} />
                    Analyze Prescription
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
                className="modern-back-button"
              >
                Back to Dashboard
              </button>

            </div>
          )}

        </div>

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