import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Send, Volume2, RotateCcw } from "lucide-react";

import { transcribeVoiceQuery, sendVoiceQuery } from "../services/api";
import { LANGUAGES } from "../constants/languages";

function languageLabel(code) {
  const match = LANGUAGES.find(
    (language) => language.code === code
  );

  return match ? match.label : code;
}

// Stages: idle -> recording -> transcribing -> review -> sending -> done
export default function VoiceQuery({ documentId }) {
  const [stage, setStage] = useState("idle");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState(null);
  const [answer, setAnswer] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  // Stop the mic and any in-progress recorder if this component
  // unmounts (e.g. the user navigates away) while recording.
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const resetAll = () => {
    setError("");
    setTranscript(null);
    setAnswer(null);
    setStage("idle");
  };

  const startRecording = async () => {
    setError("");
    setTranscript(null);
    setAnswer(null);

    if (!documentId) {
      setError("No prescription selected yet.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Voice input isn't supported in this browser."
      );
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type:
              mediaRecorder.mimeType ||
              "audio/webm",
          }
        );

        transcribe(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setStage("recording");
    } catch (err) {
      console.error(
        "Microphone access failed:",
        err
      );

      setError(
        "Couldn't access the microphone. Please allow microphone permission and try again."
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setStage("transcribing");
  };

  const transcribe = async (audioBlob) => {
    setError("");

    try {
      const data = await transcribeVoiceQuery(
        documentId,
        audioBlob
      );

      setTranscript(data);
      setStage("review");
    } catch (err) {
      console.error("Transcription failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Sorry, I couldn't process that. Please try again."
      );
      setStage("idle");
    }
  };

  const sendQuestion = async () => {
    if (!transcript) {
      return;
    }

    setStage("sending");
    setError("");

    try {
      const data = await sendVoiceQuery(
        documentId,
        transcript.question_text_english,
        transcript.detected_language
      );

      setAnswer(data);
      setStage("done");

      if (data.answer_audio_base64 && audioRef.current) {
        audioRef.current.src = `data:audio/wav;base64,${data.answer_audio_base64}`;
        audioRef.current
          .play()
          .catch(() => {
            // Autoplay can be blocked by the browser; the
            // person can still press play manually.
          });
      }
    } catch (err) {
      console.error("Sending the question failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Sorry, I couldn't get an answer. Please try again."
      );
      setStage("review");
    }
  };

  const recording = stage === "recording";
  const transcribing = stage === "transcribing";
  const sending = stage === "sending";

  return (
    <section className="result-card voice-query-card">
      <div className="result-title">
        <Mic size={22} />
        <h2>Ask About This Prescription</h2>
      </div>

      <p className="voice-query-hint">
        Tap the mic and ask a question out loud, in any
        supported language — for example, "What is this
        medicine for?" or "When should I take it?"
      </p>

      {(stage === "idle" ||
        recording ||
        transcribing) && (
        <button
          type="button"
          className={`mic-button${
            recording ? " recording" : ""
          }`}
          onClick={
            recording ? stopRecording : startRecording
          }
          disabled={transcribing}
        >
          {recording ? (
            <>
              <Square size={18} />
              Stop
            </>
          ) : transcribing ? (
            <>
              <Loader2 size={18} className="spin" />
              Listening…
            </>
          ) : (
            <>
              <Mic size={18} />
              Ask a Question
            </>
          )}
        </button>
      )}

      {error && (
        <p className="voice-query-error">{error}</p>
      )}

      {/* RECOGNIZED TEXT — shown for confirmation before sending */}

      {transcript && (
        <div className="voice-query-transcript">
          <p className="voice-query-language">
            Detected language:{" "}
            {languageLabel(transcript.detected_language)}
          </p>

          <p className="voice-query-question">
            <strong>You said:</strong>{" "}
            {transcript.question_text}
          </p>

          {(stage === "review" || sending) && (
            <div className="voice-query-actions">
              <button
                type="button"
                className="mic-button"
                onClick={sendQuestion}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send
                  </>
                )}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={resetAll}
                disabled={sending}
              >
                <RotateCcw size={16} />
                Re-record
              </button>
            </div>
          )}
        </div>
      )}

      {/* ANSWER */}

      {answer && stage === "done" && (
        <div className="voice-query-result">
          <p className="voice-query-answer">
            <strong>Answer:</strong> {answer.answer_text}
          </p>

          <div className="voice-query-actions">
            {answer.answer_audio_base64 && (
              <button
                type="button"
                className="speak-button"
                onClick={() =>
                  audioRef.current
                    ?.play()
                    .catch(() => {})
                }
              >
                <Volume2 size={18} />
                Play Answer Again
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={resetAll}
            >
              <Mic size={16} />
              Ask Another Question
            </button>
          </div>
        </div>
      )}

      {/* Hidden audio element used to play the spoken answer */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </section>
  );
}