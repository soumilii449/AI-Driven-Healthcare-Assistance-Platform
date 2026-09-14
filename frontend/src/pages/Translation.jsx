import { useEffect, useRef, useState } from "react";
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
  getDocumentSpeech,
} from "../services/api";

import { LANGUAGES } from "../constants/languages";
import LanguageSelector from "../components/LanguageSelector";

// Browser speechSynthesis already works fine for these — no need
// to hit the backend and burn Sarvam TTS credits for them.
const BROWSER_TTS_LANGS = ["hi", "en"];

export default function Translation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const documentId = searchParams.get("id");

  const [language, setLanguage] = useState("hi");
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [speechLoading, setSpeechLoading] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    if (!documentId) {
      setError("No document selected.");
      setLoading(false);
      return;
    }

    stopSpeaking();
    loadTranslation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, language]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadTranslation = async () => {
    setLoading(true);

    try {
      const translationData =
        await getDocumentTranslation(documentId, language);

      let resultData = null;

      try {
        resultData = await getDocumentResult(documentId);
      } catch (resultError) {
        console.log(
          "Could not load document result:",
          resultError
        );
      }

      const treatmentTranslated =
        (language === "hi" &&
          (resultData?.treatment_hindi ||
            resultData?.data?.treatment_hindi ||
            resultData?.result?.treatment_hindi)) ||
        translationData?.treatment_translated ||
        translationData?.treatment_hindi ||
        "";

      setTranslation({
        ...translationData,
        treatment_translated: treatmentTranslated,
      });

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load translation."
      );
    } finally {
      setLoading(false);
    }
  };

  const speakWithBrowser = () => {
    const text = translation?.treatment_translated;
    if (!text) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    const langMeta = LANGUAGES.find((l) => l.code === language);
    const speechLangCode = langMeta?.speechLang || "en-US";

    speech.lang = speechLangCode;
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;

    const voices = window.speechSynthesis.getVoices();

    const exactVoice = voices.find(
      (voice) =>
        voice.lang &&
        voice.lang.toLowerCase() === speechLangCode.toLowerCase()
    );

    const anyVoice = voices.find(
      (voice) =>
        voice.lang &&
        voice.lang.toLowerCase().startsWith(language.toLowerCase())
    );

    if (exactVoice) {
      speech.voice = exactVoice;
    } else if (anyVoice) {
      speech.voice = anyVoice;
    }

    speech.onstart = () => setSpeaking(true);
    speech.onend = () => setSpeaking(false);
    speech.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(speech);
  };

  const speakWithBackend = async () => {
    const text = translation?.treatment_translated;
    if (!text) return;

    setSpeechLoading(true);

    try {
      const audioBlob = await getDocumentSpeech(documentId, language);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audioRef.current = audio;

      audio.onplay = () => setSpeaking(true);

      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.log("Could not generate speech:", err);
      setSpeaking(false);
    } finally {
      setSpeechLoading(false);
    }
  };

  const speak = () => {
    if (BROWSER_TTS_LANGS.includes(language)) {
      speakWithBrowser();
    } else {
      speakWithBackend();
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setSpeaking(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        Loading translation...
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

  const translatedInfo =
    translation?.translated_information ||
    translation?.hindi_information ||
    {};

  const treatmentTranslated =
    translation?.treatment_translated || "";

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
          Translated Medical Information
        </h1>

        <LanguageSelector
          value={language}
          onChange={setLanguage}
        />

      </header>

      <main className="translation-container">

        <section className="translation-card">

          <div className="result-title">
            <Languages size={28} />
            <h2>Medical Information</h2>
          </div>

          <div className="translation-content">

            <p>
              <strong>Doctors:</strong>{" "}
              {translatedInfo.physicians?.join(", ") ||
                "Not available"}
            </p>

            <p>
              <strong>Symptoms:</strong>{" "}
              {translatedInfo.symptoms?.join(", ") ||
                "Not available"}
            </p>

            <p>
              <strong>Medical Conditions:</strong>{" "}
              {translatedInfo.medical_conditions?.join(", ") ||
                "Not available"}
            </p>

          </div>

        </section>

        <section className="translation-card">

          <div className="result-title">
            <Languages size={25} />
            <h2>Medicines</h2>
          </div>

          {translatedInfo.medications?.length ? (
            translatedInfo.medications.map((medicine, index) => (
              <div className="hindi-medicine" key={index}>
                <h3>{medicine.name || "Medicine"}</h3>
                <p>
                  <strong>Dosage:</strong>{" "}
                  {medicine.dosage || "Not available"}
                </p>
                <p>
                  <strong>Frequency:</strong>{" "}
                  {medicine.frequency || "Not available"}
                </p>
              </div>
            ))
          ) : (
            <p>No medication information available.</p>
          )}

        </section>

        <section className="translation-card">

          <div className="result-title">
            <Languages size={25} />
            <h2>Treatment Information</h2>
          </div>

          <div className="treatment-hindi">

            <p>
              {treatmentTranslated ||
                "No treatment information available."}
            </p>

            {treatmentTranslated && (
              <button
                type="button"
                className="speak-button"
                onClick={speaking ? stopSpeaking : speak}
                disabled={speechLoading}
              >
                {speechLoading ? (
                  "Generating audio..."
                ) : speaking ? (
                  <>
                    <Square size={20} />
                    Stop
                  </>
                ) : (
                  <>
                    <Volume2 size={20} />
                    Listen
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