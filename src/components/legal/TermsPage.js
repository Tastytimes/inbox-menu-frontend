import React from "react";
import { Link } from "react-router-dom";
import { BRAND_NAME } from "../../constants/brand";
import {
  COMPANY_ADDRESS,
  COMPANY_GST,
  COMPANY_LEGAL_NAME,
  COMPANY_SUPPORT_EMAIL,
  COMPANY_WEBSITE,
} from "../../constants/company";
import { CURRENCY_CODE, CURRENCY_LABEL, CURRENCY_SYMBOL } from "../../constants/pricing";
import { routes } from "../../utils/routes";
import LegalPageLayout from "./LegalPageLayout";

const TermsPage = () => (
  <LegalPageLayout title="Terms & Conditions">
    <p className="legal-page__meta">Last updated: 14 August 2026</p>

    <p>
      These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of the {BRAND_NAME} website
      and QR ordering services operated by <strong>{COMPANY_LEGAL_NAME}</strong> (&quot;we&quot;,
      &quot;us&quot;, or &quot;Company&quot;), with registered office at {COMPANY_ADDRESS}. By
      accessing {COMPANY_WEBSITE} or placing an order through a {BRAND_NAME} QR menu, you agree to
      these Terms.
    </p>

    <h2>1. Services</h2>
    <p>
      {COMPANY_LEGAL_NAME} provides a technology platform that enables restaurants to display
      menus, accept orders, and process online payments. Food preparation, quality, pricing, and
      fulfilment are the responsibility of the individual restaurant partner.
    </p>

    <h2>2. Orders and payments</h2>
    <ul>
      <li>Orders placed via QR menus are contracts between you and the restaurant.</li>
      <li>
        Payments are processed through authorised payment partners in{" "}
        {CURRENCY_LABEL} ({CURRENCY_CODE}, {CURRENCY_SYMBOL}). {COMPANY_LEGAL_NAME} facilitates
        payment collection on behalf of restaurant partners.
      </li>
      <li>
        Menu prices, packaging fees, taxes, and the final payable amount in INR (₹) are displayed
        at checkout before you confirm payment. See our{" "}
        <Link to={routes.pricing}>Pricing &amp; Currency</Link> page.
      </li>
      {COMPANY_GST && <li>GSTIN of {COMPANY_LEGAL_NAME}: {COMPANY_GST}</li>}
    </ul>

    <h2>3. User responsibilities</h2>
    <p>You agree to provide accurate contact details and not misuse the platform for fraudulent or unlawful activity.</p>

    <h2>4. Intellectual property</h2>
    <p>
      The {BRAND_NAME} name, logo, software, and website content are owned by {COMPANY_LEGAL_NAME} or
      its licensors. Restaurant menu content remains the property of respective restaurant partners.
    </p>

    <h2>5. Limitation of liability</h2>
    <p>
      To the maximum extent permitted by law, {COMPANY_LEGAL_NAME} is not liable for food quality,
      delays, or disputes arising from restaurant fulfilment. Our liability for platform-related
      issues is limited to the fees paid to us for the affected transaction, if any.
    </p>

    <h2>6. Refunds</h2>
    <p>
      Refund eligibility is described in our{" "}
      <Link to={routes.refundPolicy}>Refund Policy</Link>. Restaurant-specific refund decisions may
      apply for order issues.
    </p>

    <h2>7. Privacy</h2>
    <p>
      Personal data is handled as described in our{" "}
      <Link to={routes.privacy}>Privacy Policy</Link>.
    </p>

    <h2>8. Governing law</h2>
    <p>
      These Terms are governed by the laws of India. Courts in Bengaluru, Karnataka shall have
      exclusive jurisdiction, subject to applicable consumer protection laws.
    </p>

    <h2>9. Contact</h2>
    <p>
      {COMPANY_LEGAL_NAME}
      <br />
      {COMPANY_ADDRESS}
      <br />
      Email: <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a>
    </p>
  </LegalPageLayout>
);

export default TermsPage;
