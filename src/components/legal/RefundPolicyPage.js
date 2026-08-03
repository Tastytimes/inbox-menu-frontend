import React from "react";
import { Link } from "react-router-dom";
import { BRAND_NAME } from "../../constants/brand";
import {
  COMPANY_ADDRESS,
  COMPANY_LEGAL_NAME,
  COMPANY_SUPPORT_EMAIL,
} from "../../constants/company";
import { routes } from "../../utils/routes";
import LegalPageLayout from "./LegalPageLayout";

const RefundPolicyPage = () => (
  <LegalPageLayout title="Refund & Cancellation Policy">
    <p className="legal-page__meta">Last updated: 3 August 2026</p>

    <p>
      This Refund &amp; Cancellation Policy applies to orders placed through {BRAND_NAME}, a platform
      operated by <strong>{COMPANY_LEGAL_NAME}</strong>. {COMPANY_LEGAL_NAME} facilitates online
      payments on behalf of restaurant partners.
    </p>

    <h2>1. Restaurant orders</h2>
    <p>
      Food and beverage orders are fulfilled by the restaurant you order from. Cancellation and
      refund decisions for prepared or in-progress orders are primarily at the restaurant&apos;s
      discretion, subject to applicable consumer protection laws.
    </p>

    <h2>2. When refunds may be issued</h2>
    <ul>
      <li>Payment was charged but the order was not accepted by the restaurant</li>
      <li>Duplicate payment for the same order</li>
      <li>Technical failure resulting in a confirmed payment without a valid order</li>
      <li>Restaurant agrees to cancel before preparation begins</li>
    </ul>

    <h2>3. Refund process</h2>
    <p>
      Approved refunds are initiated by {COMPANY_LEGAL_NAME} or the restaurant partner through the
      original payment method. Refunds typically reflect within 5–10 business days depending on your
      bank or UPI provider.
    </p>

    <h2>4. Non-refundable situations</h2>
    <ul>
      <li>Orders already prepared or served</li>
      <li>Change of mind after the restaurant has started preparation</li>
      <li>Incorrect items ordered by the customer where the restaurant fulfilled as ordered</li>
    </ul>

    <h2>5. How to request a refund</h2>
    <p>
      Contact the restaurant first for order-specific issues. If unresolved, email{" "}
      <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a> with your order ID,
      restaurant name, payment reference, and a brief description of the issue.
    </p>

    <h2>6. Subscription fees (restaurant partners)</h2>
    <p>
      Refunds for {BRAND_NAME} subscription or platform fees charged to restaurant partners are
      governed by the separate partner agreement. Contact us for billing disputes.
    </p>

    <h2>7. Contact</h2>
    <p>
      {COMPANY_LEGAL_NAME}
      <br />
      {COMPANY_ADDRESS}
      <br />
      Email: <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a>
    </p>

    <p>
      Related policies: <Link to={routes.terms}>Terms &amp; Conditions</Link>,{" "}
      <Link to={routes.privacy}>Privacy Policy</Link>,{" "}
      <Link to={routes.contact}>Contact Us</Link>.
    </p>
  </LegalPageLayout>
);

export default RefundPolicyPage;
