import React from "react";
import { BRAND_LOGO, BRAND_NAME } from "../../constants/brand";

const RestaurantHeader = ({ restaurant }) => (
  <header className="restaurant-header sticky-top">
    <div className="restaurant-header__inner">
      <div className="restaurant-header__logo restaurant-header__logo--restaurant">
        {restaurant.logoUrl ? (
          <img src={restaurant.logoUrl} alt={restaurant.name} />
        ) : (
          <span className="restaurant-header__fallback" aria-hidden>
            {restaurant.name?.charAt(0)?.toUpperCase() || "R"}
          </span>
        )}
      </div>

      <div className="restaurant-header__center">
        <h1 className="restaurant-header__title">{restaurant.name}</h1>
        {(restaurant.city || restaurant.address) && (
          <p className="restaurant-header__subtitle">
            {[restaurant.address, restaurant.city, restaurant.state]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>

      <div className="restaurant-header__logo restaurant-header__logo--brand">
        <img src={BRAND_LOGO} alt={BRAND_NAME} />
      </div>
    </div>
  </header>
);

export default RestaurantHeader;
