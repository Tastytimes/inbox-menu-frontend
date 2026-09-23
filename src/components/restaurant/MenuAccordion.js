import React from "react";

const MenuAccordion = ({ categories, openIds, onToggle, renderItems }) => {
  if (!categories.length) {
    return <p className="menu-empty">No menu items match your search.</p>;
  }

  return (
    <div className="menu-accordion">
      {categories.map((category) => {
        const isOpen = openIds.has(category.id);
        const itemCount = (category.foodItems ?? []).length;
        const panelId = `menu-panel-${category.id}`;
        const headingId = `menu-heading-${category.id}`;

        return (
          <section
            key={category.id}
            id={`menu-section-${category.id}`}
            data-category-id={category.id}
            className={`menu-accordion__section${isOpen ? " menu-accordion__section--open" : ""}`}
          >
            <h2 className="menu-accordion__heading" id={headingId}>
              <button
                type="button"
                className="menu-accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => onToggle(category.id)}
              >
                <span className="menu-accordion__copy">
                  <span className="menu-accordion__name">{category.categoryName}</span>
                  {category.description ? (
                    <span className="menu-accordion__desc">{category.description}</span>
                  ) : null}
                </span>
                <span className="menu-accordion__meta">
                  <span className="menu-accordion__count">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                  <span className="menu-accordion__chevron" aria-hidden>
                    ▾
                  </span>
                </span>
              </button>
            </h2>
            {isOpen ? (
              <div
                className="menu-accordion__panel"
                id={panelId}
                role="region"
                aria-labelledby={headingId}
              >
                <div className="food-list">{renderItems(category)}</div>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
};

export default MenuAccordion;
