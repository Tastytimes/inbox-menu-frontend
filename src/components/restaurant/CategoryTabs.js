import React, { useRef, useEffect } from "react";

const CategoryTabs = ({ categories, activeId, onSelect }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-tab-id="${activeId}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeId]);

  if (!categories.length) return null;

  return (
    <nav className="category-tabs" ref={scrollRef} aria-label="Menu categories">
      <div className="category-tabs__scroll">
        {categories.map((category) => {
          const isActive = category.id === activeId;
          return (
            <button
              key={category.id}
              type="button"
              data-tab-id={category.id}
              className={`category-tabs__tab ${isActive ? "category-tabs__tab--active" : ""}`}
              onClick={() => onSelect(category.id)}
            >
              {category.categoryName}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CategoryTabs;
