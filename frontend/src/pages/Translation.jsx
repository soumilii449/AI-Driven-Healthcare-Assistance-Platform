import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Languages,
  Volume2,
  Square,
} from "lucide-react";

import {
  getDocumentTranslation,
  getDocumentResult,
} from "../services/api";

export default function Translation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const documentId = searchParams.get("id");

  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!documentId) {
      setError("No document selected.");
      setLoading(false);
      return;
    }

    loadTranslation();
  }, [documentId]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const loadTranslation = async () => {
    try {
      const translationData =
        await getDocumentTranslation(documentId);

      let resultData = null;

      try {
        resultData =
          await getDocumentResult(documentId);
      } catch (resultError) {
        console.log(
          "Could not load document result:",
          resultError
        );
      }

      /*
       * Prefer the Hindi treatment generated during
       * document processing.
       */
      const treatmentHindi =
        resultData?.treatment_hindi ||
        resultData?.data?.treatment_hindi ||
        resultData?.result?.treatment_hindi ||
        translationData?.treatment_hindi ||
        "";

      setTranslation({
        ...translationData,
        ...resultData,
        treatment_hindi: treatmentHindi,
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load translation."
      );
    } finally {
      setLoading(false);
    }
  };

  const speakHindi = () => {
    if (!translation?.treatment_hindi) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(
      translation.treatment_hindi
    );

    speech.lang = "hi-IN";
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;

    const voices =
      window.speechSynthesis.getVoices();

    /*
     * First preference: exact Hindi India voice.
     */
    const hindiVoice = voices.find(
      (voice) =>
        voice.lang &&
        voice.lang.toLowerCase() === "hi-in"
    );

    /*
     * Second preference: any Hindi voice.
     */
    const anyHindiVoice = voices.find(
      (voice) =>
        voice.lang &&
        voice.lang.toLowerCase().startsWith("hi")
    );

    if (hindiVoice) {
      speech.voice = hindiVoice;
    } else if (anyHindiVoice) {
      speech.voice = anyHindiVoice;
    }

    speech.onstart = () => {
      setSpeaking(true);
    };

    speech.onend = () => {
      setSpeaking(false);
    };

    speech.onerror = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.speak(speech);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        Loading Hindi translation...
      </div>
    );
  }

  if (error) {
    return (
      <div className="translation-page">
        <div className="error-message">
          {error}
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const hindiInfo =
    translation?.hindi_information ||
    translation?.translated_text ||
    {};

  const treatmentHindi =
    translation?.treatment_hindi || "";

  return (
    <div className="translation-page">

      <header className="translation-header">

        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1>
          Hindi Medical Information
        </h1>

      </header>

      <main className="translation-container">

        {/* Medical Information */}

        <section className="translation-card">

          <div className="result-title">

            <Languages size={28} />

            <h2>
              हिंदी में चिकित्सा जानकारी
            </h2>

          </div>

          <div className="translation-content">

            <p>
              <strong>डॉक्टर:</strong>{" "}
              {hindiInfo.physicians?.join(", ") ||
                "उपलब्ध नहीं"}
            </p>

            <p>
              <strong>लक्षण:</strong>{" "}
              {hindiInfo.symptoms?.join(", ") ||
                "उपलब्ध नहीं"}
            </p>

            <p>
              <strong>चिकित्सीय स्थिति:</strong>{" "}
              {hindiInfo.medical_conditions?.join(
                ", "
              ) || "उपलब्ध नहीं"}
            </p>

          </div>

        </section>

        {/* Medicines */}

        <section className="translation-card">

          <div className="result-title">

            <Languages size={25} />

            <h2>
              दवाइयाँ
            </h2>

          </div>

          {hindiInfo.medications?.length ? (
            hindiInfo.medications.map(
              (medicine, index) => (
                <div
                  className="hindi-medicine"
                  key={index}
                >

                  <h3>
                    {medicine.name || "दवा"}
                  </h3>

                  <p>
                    <strong>
                      खुराक:
                    </strong>{" "}
                    {medicine.dosage ||
                      "उपलब्ध नहीं"}
                  </p>

                  <p>
                    <strong>
                      आवृत्ति:
                    </strong>{" "}
                    {medicine.frequency ||
                      "उपलब्ध नहीं"}
                  </p>

                </div>
              )
            )
          ) : (
            <p>
              दवाइयों की जानकारी उपलब्ध नहीं है।
            </p>
          )}

        </section>

        {/* Hindi Treatment */}

        <section className="translation-card">

          <div className="result-title">

            <Languages size={25} />

            <h2>
              उपचार की जानकारी
            </h2>

          </div>

          <div className="treatment-hindi">

            <p>
              {treatmentHindi ||
                "उपचार की जानकारी उपलब्ध नहीं है।"}
            </p>

            {treatmentHindi && (
              <button
                type="button"
                className="speak-button"
                onClick={
                  speaking
                    ? stopSpeaking
                    : speakHindi
                }
              >
                {speaking ? (
                  <>
                    <Square size={20} />
                    रोकें
                  </>
                ) : (
                  <>
                    <Volume2 size={20} />
                    सुनें
                  </>
                )}
              </button>
            )}

          </div>

        </section>

      </main>

    </div>
  );
}