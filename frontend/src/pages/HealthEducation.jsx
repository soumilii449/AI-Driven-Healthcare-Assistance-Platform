import { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  BookOpen,
  TrendingUp,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Thermometer,
  Droplets,
  Activity,
  HeartPulse,
  Droplet,
  Bug,
  ShieldAlert,
  Wind,
  Baby,
  Salad,
  Syringe,
  Brain,
  Bandage,
} from "lucide-react";

import {
  getEducationTopics,
  getEducationTopic,
  searchEducationTopics,
} from "../services/api";

import { LANGUAGES } from "../constants/languages";
import LanguageSelector from "../components/LanguageSelector";

const ICONS = {
  Thermometer,
  Droplets,
  Activity,
  HeartPulse,
  Droplet,
  Bug,
  ShieldAlert,
  Wind,
  Baby,
  Salad,
  Syringe,
  Brain,
  Sparkles,
  Bandage,
  BookOpen,
};

function TopicIcon({ name, size = 22 }) {
  const Icon = ICONS[name] || BookOpen;
  return <Icon size={size} />;
}

const CONTENT_SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "causes", label: "Common Causes" },
  { key: "symptoms", label: "Symptoms to Watch For" },
  { key: "home_care", label: "Home Care & Management" },
  { key: "prevention", label: "Prevention" },
  { key: "when_to_see_doctor", label: "When to See a Doctor" },
];

export default function HealthEducation() {
  const [language, setLanguage] = useState("en");

  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [topicsError, setTopicsError] = useState("");

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [searchError, setSearchError] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let isMounted = true;

    setLoadingTopics(true);
    setTopicsError("");

    getEducationTopics(language)
      .then((data) => {
        if (!isMounted) return;
        setTopics(data.topics || []);
      })
      .catch(() => {
        if (isMounted) {
          setTopicsError("Could not load health education topics.");
        }
      })
      .finally(() => {
        if (isMounted) setLoadingTopics(false);
      });

    setExpandedId(null);
    setDetailCache({});
    setDetailError("");

    if (searchResults !== null) {
      handleSearch(query, language);
    }

    return () => {
      isMounted = false;
    };
  }, [language]);

  const handleSearch = async (searchQuery, lang = language) => {
    const trimmed = (searchQuery ?? query).trim();

    if (!trimmed) {
      setSearchResults(null);
      setSearchMessage("");
      setSearchError("");
      return;
    }

    setSearching(true);
    setSearchError("");

    try {
      const data = await searchEducationTopics(trimmed, lang);
      setSearchResults(data.results || []);
      setSearchMessage(data.message || "");
    } catch (error) {
      setSearchError(
        "Something went wrong while searching. Please try again."
      );
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onSubmitSearch = (event) => {
    event.preventDefault();
    handleSearch(query);
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults(null);
    setSearchMessage("");
    setSearchError("");
  };

  const toggleTopic = async (topic) => {
    const topicId = topic.id;

    if (expandedId === topicId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(topicId);
    setDetailError("");

    const cacheKey = `${topicId}_${language}`;

    if (detailCache[cacheKey]) {
      return;
    }

    if (topic.source === "medlineplus") {
      setDetailCache((prev) => ({
        ...prev,
        [cacheKey]: {
          content: { overview: topic.summary },
          medlineplus_url: topic.url,
        },
      }));
      return;
    }

    setDetailLoadingId(topicId);

    try {
      const detail = await getEducationTopic(topicId, language);

      setDetailCache((prev) => ({
        ...prev,
        [cacheKey]: detail,
      }));
    } catch (error) {
      setDetailError(
        "Could not load the full article for this topic. Please try again."
      );
    } finally {
      setDetailLoadingId(null);
    }
  };

  const renderCard = (topic) => {
    const isOpen = expandedId === topic.id;
    const cacheKey = `${topic.id}_${language}`;
    const detail = detailCache[cacheKey];
    const isLoadingDetail = detailLoadingId === topic.id;

    return (
      <div key={topic.id} className="edu-card">
        <button
          className="edu-card-header"
          onClick={() => toggleTopic(topic)}
          aria-expanded={isOpen}
        >
          <span className="edu-card-icon">
            <TopicIcon name={topic.icon} />
          </span>

          <span className="edu-card-heading">
            <span className="edu-card-title">{topic.title}</span>
            <span className="edu-card-category">{topic.category}</span>
          </span>

          <ChevronDown
            size={18}
            className={`edu-chevron ${isOpen ? "edu-chevron--open" : ""}`}
          />
        </button>

        <p className="edu-card-summary">{topic.summary}</p>

        {isOpen && (
          <div className="edu-card-body">
            {isLoadingDetail && (
              <p className="edu-loading-inline">Loading full article...</p>
            )}

            {!isLoadingDetail && detailError && (
              <p className="edu-error-inline">{detailError}</p>
            )}

            {!isLoadingDetail && detail && (
              <div className="edu-sections">
                {CONTENT_SECTIONS.map(({ key, label }) => {
                  const value = detail.content?.[key];

                  const hasValue = Array.isArray(value)
                    ? value.length > 0
                    : Boolean(value && value.trim());

                  if (!hasValue) return null;

                  return (
                    <div key={key} className="edu-section">
                      <h4
                        className={
                          key === "when_to_see_doctor"
                            ? "edu-section-title edu-section-title--alert"
                            : "edu-section-title"
                        }
                      >
                        {key === "when_to_see_doctor" && (
                          <AlertTriangle size={15} />
                        )}
                        {label}
                      </h4>

                      {Array.isArray(value) ? (
                        <ul className="edu-section-list">
                          {value.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="edu-section-text">{value}</p>
                      )}
                    </div>
                  );
                })}

                {detail && detail.medlineplus_url ? (
                  <p className="edu-section-text">
                    <a
                      href={detail.medlineplus_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read the full article on MedlinePlus
                    </a>
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const showingSearch = searchResults !== null;

  return (
    <div className="edu-page">
      <div className="edu-header">
        <span className="edu-header-badge">
          <BookOpen size={16} />
          Health Education
        </span>

        <h1>Learn about your health</h1>

        <p>
          Browse commonly searched health topics, or ask about something
          specific to get simple, practical guidance — available in your
          language.
        </p>
      </div>

      <div className="edu-controls glass-card">
        <form className="edu-search-form" onSubmit={onSubmitSearch}>
          <div className="edu-search-input-wrap">
            <Search size={18} className="edu-search-icon" />

            <input
              type="text"
              className="edu-search-input"
              placeholder="Ask about a symptom or topic — e.g. 'how to control blood sugar'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="edu-search-button"
            disabled={searching || !query.trim()}
          >
            {searching ? "Searching..." : "Search"}
          </button>

          {showingSearch && (
            <button
              type="button"
              className="edu-search-clear"
              onClick={clearSearch}
            >
              Clear
            </button>
          )}
        </form>

        <div className="edu-language-row">
          <span>Read in:</span>
          <LanguageSelector value={language} onChange={setLanguage} />
        </div>
      </div>

      {showingSearch && (
        <div className="edu-results-section">
          <h2 className="edu-section-heading">
            <Stethoscope size={18} />
            Guidance for "{query}"
          </h2>

          {searchError && (
            <div className="emergency-error">{searchError}</div>
          )}

          {!searchError && searching && (
            <p className="edu-loading-inline">Searching topics...</p>
          )}

          {!searchError && !searching && searchResults.length === 0 && (
            <div className="edu-empty-state">
              <ShieldCheck size={18} />
              <p>
                {searchMessage ||
                  "No matching topic was found. Try different words or browse the topics below."}
              </p>
            </div>
          )}

          {!searchError && !searching && searchResults.length > 0 && (
            <div className="edu-card-grid">
              {searchResults.map((topic) => renderCard(topic))}
            </div>
          )}

          <p className="edu-disclaimer">
            This guidance is general information, not a diagnosis. For advice
            specific to your situation, please consult a doctor or healthcare
            worker.
          </p>
        </div>
      )}

      <div className="edu-topics-section">
        <h2 className="edu-section-heading">
          <TrendingUp size={18} />
          Most Searched Topics
        </h2>

        {topicsError && (
          <div className="emergency-error">{topicsError}</div>
        )}

        {loadingTopics && (
          <p className="edu-loading-inline">Loading topics...</p>
        )}

        {!loadingTopics && !topicsError && (
          <div className="edu-card-grid">
            {topics.map((topic) => renderCard(topic))}
          </div>
        )}
      </div>
    </div>
  );
}