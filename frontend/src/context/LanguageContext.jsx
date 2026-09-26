import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { LANGUAGES } from "../constants/languages";

const LanguageContext = createContext(null);

const STORAGE_KEY = "swasthyasetu-language";
const WIDGET_ID = "google_translate_element";

function getSavedLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (
    LANGUAGES.some(
      (language) => language.code === saved
    )
  ) {
    return saved;
  }

  return "en";
}

function setTranslationCookie(language) {
  const value = `/en/${language}`;

  document.cookie = `googtrans=${value}; path=/`;
  document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
}

function clearTranslationCookie() {
  document.cookie =
    "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  document.cookie =
    `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
}

function hideGoogleElements() {
  const selectors = [
    ".goog-te-banner-frame",
    ".goog-te-banner-frame.skiptranslate",
    ".goog-te-balloon-frame",
    ".goog-te-menu-frame",
    ".goog-te-gadget",
    ".goog-tooltip",
    ".goog-te-spinner-pos",
    "iframe.goog-te-banner-frame",
    "iframe.goog-te-menu-frame",
    "body > .skiptranslate",
  ];

  selectors.forEach((selector) => {
    document
      .querySelectorAll(selector)
      .forEach((element) => {
        element.style.display = "none";
        element.style.visibility = "hidden";
        element.style.height = "0";
        element.style.width = "0";
        element.style.position = "absolute";
        element.style.left = "-10000px";
        element.style.top = "-10000px";
      });
  });

  document.body.style.top = "0px";
}

function triggerTranslation(language) {
  const select = document.querySelector(
    ".goog-te-combo"
  );

  if (!select) {
    return false;
  }

  select.value = language;

  select.dispatchEvent(
    new Event("change", {
      bubbles: true,
    })
  );

  setTimeout(hideGoogleElements, 100);
  setTimeout(hideGoogleElements, 500);
  setTimeout(hideGoogleElements, 1000);

  return true;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] =
    useState(getSavedLanguage);

  const [translatorReady, setTranslatorReady] =
    useState(false);

  const observerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const styleId =
      "swasthya-google-translate-hidden";

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");

      style.id = styleId;

      style.textContent = `
        html {
          margin-top: 0 !important;
        }

        body {
          top: 0 !important;
          margin-top: 0 !important;
        }

        body.translated-ltr,
        body.translated-rtl {
          top: 0 !important;
          margin-top: 0 !important;
        }

        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
          position: absolute !important;
          left: -10000px !important;
          top: -10000px !important;
        }

        iframe.goog-te-banner-frame {
          display: none !important;
          visibility: hidden !important;
        }

        .goog-te-balloon-frame {
          display: none !important;
          visibility: hidden !important;
        }

        .goog-te-menu-frame {
          display: none !important;
          visibility: hidden !important;
        }

        .goog-te-gadget {
          display: none !important;
          visibility: hidden !important;
        }

        .goog-tooltip {
          display: none !important;
        }

        .goog-text-highlight {
          background: transparent !important;
          box-shadow: none !important;
        }

        body > .skiptranslate {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
        }

        #google_translate_element {
          position: fixed !important;
          left: -10000px !important;
          top: -10000px !important;
          width: 1px !important;
          height: 1px !important;
          overflow: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;

      document.head.appendChild(style);
    }

    const observer = new MutationObserver(() => {
      hideGoogleElements();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    observerRef.current = observer;

    window.googleTranslateElementInit = () => {
      if (
        !window.google ||
        !window.google.translate ||
        !window.google.translate.TranslateElement
      ) {
        return;
      }

      let container =
        document.getElementById(WIDGET_ID);

      if (!container) {
        container = document.createElement("div");

        container.id = WIDGET_ID;

        document.body.appendChild(container);
      }

      if (!container.dataset.initialized) {
        container.dataset.initialized = "true";

        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",

            includedLanguages:
              LANGUAGES.map(
                (item) => item.code
              ).join(","),

            autoDisplay: false,

            multilanguagePage: true,
          },
          WIDGET_ID
        );
      }

      setTranslatorReady(true);

      setTimeout(hideGoogleElements, 100);
      setTimeout(hideGoogleElements, 500);
      setTimeout(hideGoogleElements, 1000);
    };

    if (
      !document.getElementById(
        "google-translate-script"
      )
    ) {
      const script =
        document.createElement("script");

      script.id =
        "google-translate-script";

      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

      script.async = true;

      document.body.appendChild(script);
    } else if (
      window.google &&
      window.google.translate &&
      window.google.translate.TranslateElement
    ) {
      window.googleTranslateElementInit();
    }

    hideGoogleElements();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      language
    );

    document.documentElement.lang =
      language;

    if (!translatorReady) {
      return;
    }

    if (language === "en") {
      clearTranslationCookie();
    } else {
      setTranslationCookie(language);
    }

    let attempts = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const applyLanguage = () => {
      attempts += 1;

      hideGoogleElements();

      const success =
        triggerTranslation(language);

      if (success || attempts >= 30) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    applyLanguage();

    intervalRef.current =
      setInterval(applyLanguage, 300);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    language,
    translatorReady,
  ]);

  const setLanguage = (nextLanguage) => {
    const exists = LANGUAGES.some(
      (item) =>
        item.code === nextLanguage
    );

    if (!exists) {
      return;
    }

    setLanguageState(nextLanguage);

    localStorage.setItem(
      STORAGE_KEY,
      nextLanguage
    );

    if (nextLanguage === "en") {
      clearTranslationCookie();
    } else {
      setTranslationCookie(
        nextLanguage
      );
    }

    hideGoogleElements();
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languages: LANGUAGES,
        translatorReady,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}