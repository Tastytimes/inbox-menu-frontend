import React, { useEffect, useRef, useState } from "react";

const MenuCategoryJump = ({ categories, activeId, onSelect, hasCart = false }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const chip = scrollerRef.current?.querySelector(`[data-chip-id="${activeId}"]`);
    chip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeId]);

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  if (categories.length < 2) return null;

  const selectCategory = (categoryId) => {
    onSelect(categoryId);
    setSheetOpen(false);
  };

  return (
    <>
      <nav className="menu-cat-nav" aria-label="Jump to category">
        <div className="menu-cat-nav__scroll" ref={scrollerRef}>
          {categories.map((category) => {
            const isActive = String(category.id) === String(activeId);
            return (
              <button
                key={category.id}
                type="button"
                data-chip-id={category.id}
                className={`menu-cat-nav__chip${isActive ? " menu-cat-nav__chip--active" : ""}`}
                onClick={() => selectCategory(category.id)}
              >
                {category.categoryName}
              </button>
            );
          })}
        </div>
      </nav>

      <button
        type="button"
        className={`menu-fab${hasCart ? " menu-fab--above-cart" : ""}`}
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
      >
        <span className="menu-fab__icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3" width="14" height="2" rx="1" fill="currentColor" />
            <rect x="2" y="8" width="14" height="2" rx="1" fill="currentColor" />
            <rect x="2" y="13" width="9" height="2" rx="1" fill="currentColor" />
          </svg>
        </span>
        MENU
      </button>

      {sheetOpen ? (
        <div className="menu-sheet" role="presentation">
          <button
            type="button"
            className="menu-sheet__backdrop"
            aria-label="Close menu"
            onClick={() => setSheetOpen(false)}
          />
          <div className="menu-sheet__panel" role="dialog" aria-labelledby="menu-sheet-title">
            <div className="menu-sheet__handle" aria-hidden />
            <h2 id="menu-sheet-title">Menu</h2>
            <ul className="menu-sheet__list">
              {categories.map((category) => {
                const isActive = String(category.id) === String(activeId);
                const itemCount = (category.foodItems ?? []).length;
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      className={`menu-sheet__item${isActive ? " menu-sheet__item--active" : ""}`}
                      onClick={() => selectCategory(category.id)}
                    >
                      <span>{category.categoryName}</span>
                      <span className="menu-sheet__count">{itemCount}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default MenuCategoryJump;
