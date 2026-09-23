import React from "react";

const MenuSearch = ({ value, onChange, resultCount, hasQuery }) => (
  <label className="menu-search">
    <span className="menu-search__icon" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.2 10.2L13.2 13.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search dishes or categories"
      autoComplete="off"
      enterKeyHint="search"
      aria-label="Search dishes or categories"
    />
    {value ? (
      <button
        type="button"
        className="menu-search__clear"
        onClick={() => onChange("")}
        aria-label="Clear search"
      >
        ×
      </button>
    ) : null}
    {hasQuery ? (
      <span className="menu-search__count">
        {resultCount} {resultCount === 1 ? "item" : "items"}
      </span>
    ) : null}
  </label>
);

export default MenuSearch;
