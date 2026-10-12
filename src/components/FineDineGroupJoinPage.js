import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { acceptFineDineGroupInvite } from "../api/restaurantApi";
import { setStoredFineDineGuest, toStoredFineDineGuest } from "../utils/fineDineGuestStorage";
import { routes } from "../utils/routes";
import "./restaurant/RestaurantMenu.css";

const FineDineGroupJoinPage = () => {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const join = async () => {
      try {
        const result = await acceptFineDineGroupInvite(token);
        if (cancelled) return;
        const nextSlug = result.slug || slug;
        const stored = toStoredFineDineGuest(
          { id: result.sessionId },
          result.guest
        );
        setStoredFineDineGuest(nextSlug, stored);
        navigate(`${routes.restaurant(nextSlug)}${window.location.search}`, { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "This invite link is invalid or has expired.");
        }
      }
    };
    if (token) {
      void join();
    } else {
      setError("This invite link is missing.");
    }
    return () => {
      cancelled = true;
    };
  }, [slug, token, navigate]);

  return (
    <div className="restaurant-page restaurant-page--message">
      <section className="seating-card" role="status">
        <h2>{error ? "Could not join" : "Joining group order"}</h2>
        <p>
          {error ||
            "Opening the table menu. Your dishes will be added to the host bill."}
        </p>
        {error ? (
          <Link to={slug ? routes.restaurant(slug) : routes.home} className="restaurant-unavailable__link">
            Back to menu
          </Link>
        ) : null}
      </section>
    </div>
  );
};

export default FineDineGroupJoinPage;
