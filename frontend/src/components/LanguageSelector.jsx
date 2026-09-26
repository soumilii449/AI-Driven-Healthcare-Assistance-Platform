import { useLanguage } from "../context/LanguageContext";
import { LANGUAGES } from "../constants/languages";

export default function LanguageSelector({ value, onChange }) {
  const globalLanguage = useLanguage();

  const isControlled =
    value !== undefined && onChange !== undefined;

  const selectedLanguage = isControlled
    ? value
    : globalLanguage.language;

  const handleChange = isControlled
    ? onChange
    : globalLanguage.setLanguage;

  return (
    <>
      <div
        className="navbar-language-selector"
        translate="no"
      >
        <span
          className="navbar-language-icon"
          aria-hidden="true"
        >
          🌐
        </span>

        <select
          className="language-selector"
          value={selectedLanguage}
          onChange={(event) =>
            handleChange(event.target.value)
          }
          aria-label="Select website language"
          title="Select website language"
        >
          {LANGUAGES.map((lang) => (
            <option
              key={lang.code}
              value={lang.code}
            >
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <style>{`
        .navbar-language-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 7px;
          border: 1px solid rgba(201, 195, 181, 0.75);
          border-radius: 10px;
          background: rgba(254, 252, 248, 0.72);
          white-space: nowrap;
        }

        .navbar-language-icon {
          font-size: 16px;
          line-height: 1;
        }

        .navbar-language-selector
        .language-selector {
          min-width: 120px;
          padding: 5px 24px 5px 3px;
          border: none;
          outline: none;
          background: transparent;
          color: inherit;
          font-size: 13px;
          font-weight: 600;
        }

        .navbar-language-selector
        .language-selector:focus {
          box-shadow: none;
        }

        .mobile-language-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
          color: inherit;
          font-weight: 600;
        }

        .mobile-language-row
        .navbar-language-selector {
          flex-shrink: 0;
        }

        body.dark-theme
        .navbar-language-selector {
          background: rgba(51, 54, 45, 0.85);
          border-color: rgba(166, 163, 149, 0.25);
          color: #e7e2d5;
        }

        @media (max-width: 900px) {
          .navbar-language-selector
          .language-selector {
            min-width: 105px;
          }
        }
      `}</style>
    </>
  );
}