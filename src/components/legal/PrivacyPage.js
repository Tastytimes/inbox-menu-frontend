import React from "react";
import { Link } from "react-router-dom";
import { BRAND_NAME } from "../../constants/brand";
import {
  COMPANY_ADDRESS,
  COMPANY_GST,
  COMPANY_LEGAL_NAME,
  COMPANY_PHONE,
  COMPANY_SUPPORT_EMAIL,
  COMPANY_WEBSITE,
} from "../../constants/company";
import { CURRENCY_CODE, CURRENCY_LABEL, CURRENCY_SYMBOL } from "../../constants/pricing";
import { routes } from "../../utils/routes";
import LegalPageLayout from "./LegalPageLayout";

const PrivacyPage = () => (
  <LegalPageLayout title="Privacy Policy">
    <p className="legal-page__meta">Last updated: 14 August 2026</p>

    <p>
      This Privacy Policy describes how <strong>{COMPANY_LEGAL_NAME}</strong> (&quot;we&quot;,
      &quot;us&quot;, or &quot;Company&quot;) collects, uses, stores, and protects personal data
      when you visit {COMPANY_WEBSITE}, use {BRAND_NAME} QR menu ordering, or contact our support
      team. By using our services, you agree to this Policy.
    </p>

    <h2>1. Data controller</h2>
    <div className="legal-page__contact-card">
      <p>
        <strong>Legal name:</strong> {COMPANY_LEGAL_NAME}
      </p>
      <p>
        <strong>Registered address:</strong> {COMPANY_ADDRESS}
      </p>
      <p>
        <strong>Website:</strong> {COMPANY_WEBSITE}
      </p>
      {COMPANY_GST && (
        <p>
          <strong>GSTIN:</strong> {COMPANY_GST}
        </p>
      )}
      <p>
        <strong>Privacy &amp; grievance contact:</strong>{" "}
        <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a>
      </p>
      <p>
        <strong>Phone:</strong>{" "}
        <a href={`tel:${COMPANY_PHONE.replace(/\s/g, "")}`}>{COMPANY_PHONE}</a>
      </p>
    </div>

    <h2>2. Services covered by this Policy</h2>
    <p>{COMPANY_LEGAL_NAME} provides:</p>
    <ul>
      <li>
        A public website at {COMPANY_WEBSITE} with information about {BRAND_NAME} QR ordering for
        restaurants
      </li>
      <li>
        QR-based digital menus where diners browse items, add to cart, and pay online in{" "}
        {CURRENCY_LABEL} ({CURRENCY_CODE}, {CURRENCY_SYMBOL})
      </li>
      <li>Order tracking and customer support for same-day orders</li>
      <li>Restaurant partner onboarding, admin tools, and subscription billing (INR)</li>
    </ul>

    <h2>3. Personal data we collect</h2>
    <p>Depending on how you use {BRAND_NAME}, we may collect:</p>
    <ul>
      <li>
        <strong>Identity &amp; contact:</strong> name, mobile number, and optional email when you
        place or track an order
      </li>
      <li>
        <strong>Order details:</strong> items ordered, dine-in or takeaway choice, table number (if
        applicable), order token, payment status, and order history for the current day
      </li>
      <li>
        <strong>Payment metadata:</strong> transaction reference, amount paid in INR, and payment
        status from our payment partner. We do <em>not</em> store full card numbers or UPI PINs
      </li>
      <li>
        <strong>Technical data:</strong> IP address, browser type, device information, and usage
        logs needed for security, fraud prevention, and service reliability
      </li>
      <li>
        <strong>Restaurant partner data:</strong> business name, address, GSTIN, bank/KYC details,
        and admin account credentials provided during onboarding
      </li>
      <li>
        <strong>Support communications:</strong> messages sent via email or WhatsApp support
      </li>
    </ul>

    <h2>4. How we use personal data</h2>
    <ul>
      <li>Process and route orders to the correct restaurant and kitchen</li>
      <li>Collect payments in INR through authorised payment gateways</li>
      <li>Send order confirmations, status updates, and payment receipts</li>
      <li>Enable order lookup by phone number or tracking link</li>
      <li>Provide customer and restaurant partner support</li>
      <li>Invoice restaurant partners and manage subscriptions in INR</li>
      <li>Comply with GST, accounting, and other legal obligations in India</li>
      <li>Detect fraud, abuse, and security incidents</li>
    </ul>

    <h2>5. Legal basis (India)</h2>
    <p>
      We process personal data where necessary to perform our contract with you (processing your
      order), with restaurant partners (platform services), with your consent where required (e.g.
      optional notifications), and to comply with applicable Indian laws including tax and
      regulatory requirements.
    </p>

    <h2>6. Payment processing</h2>
    <p>
      Online payments are processed by <strong>PayU</strong> and partner banks in{" "}
      {CURRENCY_CODE} ({CURRENCY_SYMBOL}). Payment card, UPI, and wallet details are handled
      directly by the payment provider under their privacy and security standards.{" "}
      {COMPANY_LEGAL_NAME} receives only the information required to confirm payment and fulfil
      the order. See our <Link to={routes.pricing}>Pricing &amp; Currency</Link> page for how
      amounts in INR are displayed.
    </p>

    <h2>7. Sharing of personal data</h2>
    <p>We share data only as needed to operate the service:</p>
    <ul>
      <li>
        <strong>Restaurant partners</strong> — to prepare and hand over your order
      </li>
      <li>
        <strong>Payment partners</strong> — PayU and banking partners for INR transactions
      </li>
      <li>
        <strong>Cloud hosting providers</strong> — to run our website and backend securely
      </li>
      <li>
        <strong>Professional advisers</strong> — where required for legal, tax, or audit purposes
      </li>
      <li>
        <strong>Government authorities</strong> — when required by applicable law or valid legal
        process
      </li>
    </ul>
    <p>We do not sell your personal data to third parties for marketing.</p>

    <h2>8. Cookies and local storage</h2>
    <p>
      Our website and QR ordering flow may use cookies or browser local storage to remember your
      cart, restaurant session, and login state for admin users. You can control cookies through
      your browser settings; disabling them may limit some features such as cart persistence.
    </p>

    <h2>9. Data retention</h2>
    <p>
      Order and payment records are retained for the period required to provide support, resolve
      disputes, and meet GST and other statutory retention requirements in India. Restaurant
      partner KYC and billing records are retained as required by law and our partner agreements.
    </p>

    <h2>10. Security</h2>
    <p>
      We use HTTPS encryption, access controls, and reasonable organisational measures to protect
      personal data. No online system is completely secure; please use strong passwords for admin
      accounts and contact us promptly if you suspect unauthorised access.
    </p>

    <h2>11. Your rights</h2>
    <p>
      You may request access, correction, or deletion of your personal data, or withdraw consent
      where processing is consent-based, by emailing{" "}
      <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a>. We may need to
      retain certain records for legal or accounting purposes. You may also lodge a grievance with
      us using the contact details in Section 1.
    </p>

    <h2>12. Children</h2>
    <p>
      {BRAND_NAME} is not directed at children under 18. We do not knowingly collect personal data
      from minors. If you believe a minor has provided data, contact us for deletion.
    </p>

    <h2>13. Changes to this Policy</h2>
    <p>
      We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the
      top will change when we do. Continued use of our services after updates constitutes acceptance
      of the revised Policy.
    </p>

    <h2>14. Contact &amp; related policies</h2>
    <p>
      For privacy questions or grievances:
      <br />
      {COMPANY_LEGAL_NAME}
      <br />
      {COMPANY_ADDRESS}
      <br />
      Email: <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a>
      <br />
      Phone: {COMPANY_PHONE}
    </p>
    <p>
      See also: <Link to={routes.terms}>Terms &amp; Conditions</Link>,{" "}
      <Link to={routes.refundPolicy}>Refund Policy</Link>,{" "}
      <Link to={routes.pricing}>Pricing &amp; Currency</Link>,{" "}
      <Link to={routes.contact}>Contact Us</Link>.
    </p>
  </LegalPageLayout>
);

export default PrivacyPage;
