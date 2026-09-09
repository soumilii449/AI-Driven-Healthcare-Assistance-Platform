import { Volume2, Square } from "lucide-react";
import { useEffect, useState } from "react";

export default function SpeechButton({
  text,
  language = "hi-IN",
}) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const handleEnd = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.addEventListener(
      "end",
      handleEnd
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "end",
        handleEnd
      );

      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = () => {
    if (!text) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.lang = language;
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;

    const voices =
      window.speechSynthesis.getVoices();

    // Find Hindi voice
    const hindiVoice = voices.find(
      (voice) =>
        voice.lang.toLowerCase() === "hi-in"
    );

    // If exact Hindi voice is unavailable,
    // find any Hindi voice
    const anyHindiVoice = voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith("hi")
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

  return (
    <button
      type="button"
      className="speak-button"
      onClick={
        speaking
          ? stopSpeaking
          : speak
      }
    >
      {speaking ? (
        <>
          <Square size={18} />
          Stop
        </>
      ) : (
        <>
          <Volume2 size={18} />
          Listen
        </>
      )}
    </button>
  );
}