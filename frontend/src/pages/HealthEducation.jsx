import { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  BookOpen,
  TrendingUp,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
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
  ExternalLink,
} from "lucide-react";

import {
  getEducationTopics,
  getEducationTopic,
  searchEducationTopics,
  getEducationArticle,
} from "../services/api";

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

const CONTENT_SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "causes", label: "Common Causes" },
  { key: "symptoms", label: "Symptoms to Watch For" },
  { key: "home_care", label: "Home Care & Management" },
  { key: "prevention", label: "Prevention" },
  { key: "when_to_see_doctor", label: "When to See a Doctor" },
];

function TopicIcon({ name, size = 22 }) {
  const Icon = ICONS[name] || BookOpen;
  return <Icon size={size} />;
}

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
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let active = true;

    setLoadingTopics(true);
    setTopicsError("");

    getEducationTopics(language)
      .then((data) => {
        if (!active) return;
        setTopics(data.topics || []);
      })
      .catch(() => {
        if (active) {
          setTopicsError("Could not load the health education library.");
        }
      })
      .finally(() => {
        if (active) setLoadingTopics(false);
      });

    return () => {
      active = false;
    };
  }, [language]);

  useEffect(() => {
    if (searchResults === null || !query.trim()) return;

    handleSearch(query, language);
  }, [language]);

  useEffect(() => {
    if (!expandedTopic) return;

    loadTopicDetail(expandedTopic, language);
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
        error.response?.data?.detail ||
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

  const loadTopicDetail = async (topic, lang = language) => {
    setDetailLoading(true);
    setDetailError("");

    try {
      if (topic.source === "medlineplus") {
        const article = await getEducationArticle(topic.url, lang);

        setDetail({
          type: "article",
          title: article.title || topic.title,
          content: article.content || [],
          url: article.url || topic.url,
          source: article.source || "medlineplus",
        });
      } else {
        const topicDetail = await getEducationTopic(topic.id, lang);

        setDetail({
          type: "curated",
          ...topicDetail,
        });
      }
    } catch (error) {
      setDetailError(
        error.response?.data?.detail ||
          "Could not load the full article. Please try again."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleTopic = async (topic) => {
    if (expandedId === topic.id) {
      setExpandedId(null);
      setExpandedTopic(null);
      setDetail(null);
      setDetailError("");
      return;
    }

    setExpandedId(topic.id);
    setExpandedTopic(topic);
    setDetail(null);
    await loadTopicDetail(topic, language);
  };

  const renderCuratedDetail = () => {
    if (!detail || detail.type !== "curated") return null;

    return (
      <div className="edu-sections">
        {CONTENT_SECTIONS.map(({ key, label }) => {
          const value = detail.content?.[key];

          const hasValue = Array.isArray(value)
            ? value.length > 0
            : Boolean(value && String(value).trim());

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
                  {value.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="edu-section-text">{value}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderExternalDetail = () => {
    if (!detail || detail.type !== "article") return null;

    return (
      <div className="edu-sections">
        <div className="edu-section">
          <h4 className="edu-section-title">Article</h4>

          <div className="edu-article-content">
            {(detail.content || []).map((paragraph, index) => (
              <p className="edu-section-text" key={index}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {detail.url && (
          <p className="edu-section-text">
            <a
              href={detail.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={15} />
              Read the original article on MedlinePlus
            </a>
          </p>
        )}
      </div>
    );
  };

  const renderCard = (topic) => {
    const isOpen = expandedId === topic.id;

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
            className={`edu-chevron ${
              isOpen ? "edu-chevron--open" : ""
            }`}
          />
        </button>

        <p className="edu-card-summary">{topic.summary}</p>

        {topic.source === "medlineplus" && (
          <span className="edu-source-badge">
            MedlinePlus
          </span>
        )}

        {isOpen && (
          <div className="edu-card-body">
            {detailLoading && (
              <p className="edu-loading-inline">
                Loading full article in {language === "en" ? "English" : "the selected language"}...
              </p>
            )}

            {!detailLoading && detailError && (
              <p className="edu-error-inline">{detailError}</p>
            )}

            {!detailLoading && detail && (
              <>
                {detail.title && detail.title !== topic.title && (
                  <h3 className="edu-article-title">
                    {detail.title}
                  </h3>
                )}

                {detail.type === "curated"
                  ? renderCuratedDetail()
                  : renderExternalDetail()}
              </>
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

        <h1>Healthcare information in one place</h1>

        <p>
          Search for health conditions, symptoms, medicines, nutrition,
          prevention and wellness topics. Open any article and translate
          the article itself into your selected regional language.
        </p>
      </div>

      <div className="edu-controls glass-card">
        <form className="edu-search-form" onSubmit={onSubmitSearch}>
          <div className="edu-search-input-wrap">
            <Search size={18} className="edu-search-icon" />

            <input
              type="text"
              className="edu-search-input"
              placeholder="Search any healthcare topic — e.g. asthma, pregnancy, cancer, nutrition..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
          <span>Article language:</span>
          <LanguageSelector
            value={language}
            onChange={setLanguage}
          />
        </div>
      </div>

      {showingSearch && (
        <div className="edu-results-section">
          <h2 className="edu-section-heading">
            <Stethoscope size={18} />
            Healthcare articles for "{query}"
          </h2>

          {searchError && (
            <div className="emergency-error">{searchError}</div>
          )}

          {!searchError && searching && (
            <p className="edu-loading-inline">
              Searching the healthcare library...
            </p>
          )}

          {!searchError &&
            !searching &&
            searchResults.length === 0 && (
              <div className="edu-empty-state">
                <ShieldCheck size={18} />
                <p>
                  {searchMessage ||
                    "No healthcare article was found. Try another keyword."}
                </p>
              </div>
            )}

          {!searchError &&
            !searching &&
            searchResults.length > 0 && (
              <>
                <p className="edu-result-count">
                  {searchMessage}
                </p>

                <div className="edu-card-grid">
                  {searchResults.map((topic) => renderCard(topic))}
                </div>
              </>
            )}

          <p className="edu-disclaimer">
            MedlinePlus content is provided by the U.S. National Library
            of Medicine. This information is for general education and
            does not replace advice from a qualified healthcare professional.
          </p>
        </div>
      )}

      <div className="edu-topics-section">
        <h2 className="edu-section-heading">
          <TrendingUp size={18} />
          Healthcare Education Library
        </h2>

        <p className="edu-library-description">
          Browse the locally curated topics below, or use search to access
          many more healthcare articles from MedlinePlus.
        </p>

        {topicsError && (
          <div className="emergency-error">{topicsError}</div>
        )}

        {loadingTopics && (
          <p className="edu-loading-inline">
            Loading healthcare topics...
          </p>
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
