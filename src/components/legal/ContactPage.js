import React from "react";
import { Link } from "react-router-dom";
import { BRAND_NAME } from "../../constants/brand";
import WhatsAppChatButton from "../support/WhatsAppChatButton";
import {
  COMPANY_ADDRESS,
  COMPANY_CIN,
  COMPANY_GST,
  COMPANY_LEGAL_NAME,
  COMPANY_PHONE,
  COMPANY_SUPPORT_EMAIL,
  COMPANY_WEBSITE,
} from "../../constants/company";
import { routes } from "../../utils/routes";
import LegalPageLayout from "./LegalPageLayout";

const ContactPage = () => (
  <LegalPageLayout title="Contact Us">
    <p className="legal-page__meta">
      Reach {COMPANY_LEGAL_NAME} ({BRAND_NAME}) for product enquiries, support, or partnership
      requests.
    </p>

    <div className="legal-page__contact-card">
      <p>
        <strong>Legal name:</strong> {COMPANY_LEGAL_NAME}
      </p>
      <p>
        <strong>Website:</strong>{" "}
        <a href={COMPANY_WEBSITE} target="_blank" rel="noopener noreferrer">
          {COMPANY_WEBSITE}
        </a>
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

    <h2>Customer support</h2>
    <p>
      For order-related help at a restaurant using {BRAND_NAME}, use the{" "}
      <Link to={routes.trackOrders}>Track Orders</Link> page or contact the restaurant directly.
    </p>
    <p>
      For platform or billing questions, chat with our support team on WhatsApp or email us at{" "}
      <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a> and include your
      restaurant name and registered phone number.
    </p>
    <WhatsAppChatButton className="legal-page__whatsapp-btn" />

    <h2>Business hours</h2>
    <p>Monday to Saturday, 10:00 AM – 6:00 PM IST (excluding public holidays).</p>
  </LegalPageLayout>
);

export default ContactPage;
