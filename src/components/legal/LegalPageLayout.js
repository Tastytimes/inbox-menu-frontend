import React from "react";
import { Link } from "react-router-dom";
import { BRAND_LOGO, BRAND_NAME, BRAND_NAME_KANNADA } from "../../constants/brand";
import { routes } from "../../utils/routes";
import SiteFooter from "./SiteFooter";
import "./legalPages.css";

const LegalPageLayout = ({ title, children }) => (
  <div className="legal-page">
    <nav className="legal-page__nav">
      <div className="container d-flex align-items-center justify-content-between py-3">
        <Link to={routes.home} className="legal-page__logo text-decoration-none">
          <img src={BRAND_LOGO} alt={BRAND_NAME} className="legal-page__logo-img" />
          <span className="legal-page__logo-text">
            <span className="legal-page__logo-en">{BRAND_NAME.toLowerCase()}</span>
            <span className="legal-page__logo-kn">{BRAND_NAME_KANNADA}</span>
          </span>
        </Link>
        <Link to={routes.home} className="legal-page__back">
          ← Back to home
        </Link>
      </div>
    </nav>

    <main className="legal-page__main">
      <div className="container">
        <article className="legal-page__content">
          <h1>{title}</h1>
          {children}
        </article>
      </div>
    </main>

    <SiteFooter />
  </div>
);

export default LegalPageLayout;
