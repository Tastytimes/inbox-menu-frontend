import React from "react";
import { Link } from "react-router-dom";
import { BRAND_NAME } from "../../constants/brand";
import {
  COMPANY_ADDRESS,
  COMPANY_LEGAL_NAME,
  COMPANY_SUPPORT_EMAIL,
  COMPANY_WEBSITE,
} from "../../constants/company";
import { routes } from "../../utils/routes";
import LegalPageLayout from "./LegalPageLayout";

const PrivacyPage = () => (
  <LegalPageLayout title="Privacy Policy">
    <p className="legal-page__meta">Last updated: 3 August 2026</p>

    <p>
      {COMPANY_LEGAL_NAME} (&quot;we&quot;, &quot;us&quot;, or &quot;Company&quot;) respects your
      privacy. This Privacy Policy explains how we collect, use, and protect personal information when
      you use the {BRAND_NAME} website ({COMPANY_WEBSITE}) and QR ordering services.
    </p>

    <h2>1. Information we collect</h2>
    <ul>
      <li>
        <strong>Order information:</strong> name, phone number, email (optional), order items, table
        or pickup details, and payment status.
      </li>
      <li>
        <strong>Technical information:</strong> browser type, device information, IP address, and
        usage logs for security and service improvement.
      </li>
      <li>
        <strong>Restaurant partner data:</strong> business and KYC information provided by
        restaurants during onboarding (handled separately under partner agreements).
      </li>
    </ul>

    <h2>2. How we use information</h2>
    <ul>
      <li>Process and fulfil orders through restaurant partners</li>
      <li>Send order status updates and payment confirmations</li>
      <li>Provide customer support and order lookup</li>
      <li>Prevent fraud and comply with legal obligations</li>
      <li>Improve platform performance and user experience</li>
    </ul>

    <h2>3. Payment data</h2>
    <p>
      Payment card and UPI details are processed by our payment partners (such as Cashfree).{" "}
      {COMPANY_LEGAL_NAME} does not store full payment credentials on its servers.
    </p>

    <h2>4. Sharing of information</h2>
    <p>We may share information with:</p>
    <ul>
      <li>Restaurant partners fulfilling your order</li>
      <li>Payment gateways and banks for transaction processing</li>
      <li>Infrastructure providers hosting our services</li>
      <li>Authorities when required by applicable law</li>
    </ul>

    <h2>5. Data retention</h2>
    <p>
      We retain order and account-related data for as long as needed to provide services, resolve
      disputes, and meet legal or tax requirements.
    </p>

    <h2>6. Your rights</h2>
    <p>
      You may request access, correction, or deletion of personal data by contacting us. Certain
      records may be retained where required by law.
    </p>

    <h2>7. Security</h2>
    <p>
      We use reasonable technical and organisational measures to protect personal data. No method of
      transmission over the internet is completely secure.
    </p>

    <h2>8. Contact</h2>
    <p>
      For privacy-related requests, contact {COMPANY_LEGAL_NAME}:
      <br />
      {COMPANY_ADDRESS}
      <br />
      Email: <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a>
    </p>

    <p>
      See also our <Link to={routes.terms}>Terms &amp; Conditions</Link> and{" "}
      <Link to={routes.refundPolicy}>Refund Policy</Link>.
    </p>
  </LegalPageLayout>
);

export default PrivacyPage;
