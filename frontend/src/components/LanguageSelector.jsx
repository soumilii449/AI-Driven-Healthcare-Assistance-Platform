import { LANGUAGES } from "../constants/languages";

export default function LanguageSelector({ value, onChange }) {
  return (
    <select
      className="language-selector"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select language"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}