import React from "react";
import { Link } from "react-router-dom";
import { BRAND_NAME } from "../../constants/brand";
import { COMPANY_LEGAL_NAME } from "../../constants/company";
import { routes } from "../../utils/routes";
import "./legalPages.css";

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="container">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <strong>{BRAND_NAME}</strong>
          <p className="site-footer__legal-name">{COMPANY_LEGAL_NAME}</p>
        </div>
        <nav className="site-footer__links" aria-label="Legal and support links">
          <Link to={routes.about}>About Us</Link>
          <Link to={routes.contact}>Contact</Link>
          <Link to={routes.terms}>Terms &amp; Conditions</Link>
          <Link to={routes.privacy}>Privacy Policy</Link>
          <Link to={routes.refundPolicy}>Refund Policy</Link>
          <Link to={routes.trackOrders}>Track Orders</Link>
        </nav>
      </div>
      <p className="site-footer__copy">
        © {new Date().getFullYear()} {COMPANY_LEGAL_NAME}. All rights reserved.
      </p>
    </div>
  </footer>
);

export default SiteFooter;
