import { useEffect, useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { getFirstAidGuide } from "../../services/api";

export default function FirstAid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCategory, setOpenCategory] = useState(null);
  const [openCondition, setOpenCondition] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getFirstAidGuide()
      .then((data) => {
        if (!isMounted) return;
        setCategories(data.categories || []);
        setOpenCategory(data.categories?.[0]?.id || null);
      })
      .catch(() => {
        if (isMounted) setError("Could not load the first aid guide.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="emergency-loading">Loading first aid guide...</div>;
  }

  if (error) {
    return <div className="emergency-error">{error}</div>;
  }

  return (
    <div className="first-aid-guide">
      <p className="emergency-tab-intro">
        Pick the category that best matches the situation. If you're ever
        unsure, treat it as more serious and call for help.
      </p>

      {categories.map((category) => (
        <div
          key={category.id}
          className={`fa-category fa-category--${category.color}`}
        >
          <button
            className="fa-category-header"
            onClick={() =>
              setOpenCategory(
                openCategory === category.id ? null : category.id
              )
            }
          >
            <span className="fa-category-title">
              {category.color === "error" && (
                <AlertTriangle size={18} />
              )}
              {category.title}
            </span>
            <ChevronDown
              size={18}
              className={`fa-chevron ${
                openCategory === category.id ? "fa-chevron--open" : ""
              }`}
            />
          </button>

          <p className="fa-category-summary">{category.summary}</p>

          {openCategory === category.id && (
            <div className="fa-conditions">
              {category.conditions.map((condition, idx) => {
                const key = `${category.id}-${idx}`;

                return (
                  <div key={key} className="fa-condition">
                    <button
                      className="fa-condition-header"
                      onClick={() =>
                        setOpenCondition(
                          openCondition === key ? null : key
                        )
                      }
                    >
                      <span>{condition.name}</span>
                      <ChevronDown
                        size={16}
                        className={`fa-chevron ${
                          openCondition === key ? "fa-chevron--open" : ""
                        }`}
                      />
                    </button>

                    {openCondition === key && (
                      <ol className="fa-steps">
                        {condition.steps.map((step, stepIdx) => (
                          <li key={stepIdx}>{step}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
