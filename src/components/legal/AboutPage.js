import React from "react";
import { Link } from "react-router-dom";
import { BRAND_NAME, BRAND_TAGLINE } from "../../constants/brand";
import {
  COMPANY_ADDRESS,
  COMPANY_CIN,
  COMPANY_GST,
  COMPANY_LEGAL_NAME,
  COMPANY_PHONE,
  COMPANY_SUPPORT_EMAIL,
  COMPANY_WEBSITE,
} from "../../constants/company";
import { CURRENCY_CODE, CURRENCY_SYMBOL, PRICING_HIGHLIGHTS } from "../../constants/pricing";
import { routes } from "../../utils/routes";
import LegalPageLayout from "./LegalPageLayout";

const AboutPage = () => (
  <LegalPageLayout title="About Us">
    <p className="legal-page__meta">
      {COMPANY_LEGAL_NAME} operates the {BRAND_NAME} brand ({COMPANY_WEBSITE}).
    </p>

    <p>
      {COMPANY_LEGAL_NAME} builds {BRAND_NAME} — a contactless QR menu and ordering platform for
      restaurants. Our tagline is <em>{BRAND_TAGLINE}</em>.
    </p>

    <p>
      With {BRAND_NAME}, diners scan a table QR code, browse the live menu on their phone, pay
      securely online, and track order status in real time. Restaurant teams receive orders
      directly in the kitchen workflow with support for dine-in and takeaway.
    </p>

    <h2>Our company</h2>
    <div className="legal-page__contact-card">
      <p>
        <strong>Legal name:</strong> {COMPANY_LEGAL_NAME}
      </p>
      <p>
        <strong>Brand:</strong> {BRAND_NAME}
      </p>
      <p>
        <strong>Registered address:</strong> {COMPANY_ADDRESS}
      </p>
      <p>
        <strong>Email:</strong>{" "}
        <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a>
      </p>
      <p>
        <strong>Phone:</strong>{" "}
        <a href={`tel:${COMPANY_PHONE.replace(/\s/g, "")}`}>{COMPANY_PHONE}</a>
      </p>
      {COMPANY_GST && (
        <p>
          <strong>GSTIN:</strong> {COMPANY_GST}
        </p>
      )}
      {COMPANY_CIN && (
        <p>
          <strong>CIN:</strong> {COMPANY_CIN}
        </p>
      )}
    </div>

    <h2>What we offer</h2>
    <ul>
      <li>QR-based digital menus for dine-in and takeaway</li>
      <li>Integrated online payments in {CURRENCY_CODE} ({CURRENCY_SYMBOL}) via Cashfree</li>
      <li>Real-time order tracking for customers</li>
      <li>Kitchen and admin tools for restaurant partners</li>
    </ul>

    <h2>Pricing &amp; currency</h2>
    <p>
      Menu prices are set by each restaurant and displayed in Indian Rupee ({CURRENCY_CODE},{" "}
      {CURRENCY_SYMBOL}). Takeaway packaging fees and taxes are shown in INR at checkout before
      payment. Restaurant partner subscriptions are also billed in INR.
    </p>
    <ul>
      {PRICING_HIGHLIGHTS.slice(0, 3).map((item) => (
        <li key={item.title}>
          <strong>{item.title}:</strong> {item.example}
        </li>
      ))}
    </ul>
    <p>
      <Link to={routes.pricing}>View full pricing &amp; currency details →</Link>
    </p>
  </LegalPageLayout>
);

export default AboutPage;
