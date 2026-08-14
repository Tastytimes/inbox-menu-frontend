import React from "react";
import { Link } from "react-router-dom";
import { BRAND_NAME } from "../../constants/brand";
import {
  COMPANY_GST,
  COMPANY_LEGAL_NAME,
  COMPANY_SUPPORT_EMAIL,
  COMPANY_WEBSITE,
} from "../../constants/company";
import {
  CURRENCY_CODE,
  CURRENCY_LABEL,
  CURRENCY_SYMBOL,
  PLATFORM_FEE_DESCRIPTION,
  PRICING_HIGHLIGHTS,
  formatInr,
  SUBSCRIPTION_FROM_INR,
} from "../../constants/pricing";
import { routes } from "../../utils/routes";
import LegalPageLayout from "./LegalPageLayout";

const PricingPage = () => (
  <LegalPageLayout title="Pricing & Currency">
    <p className="legal-page__meta">Last updated: 14 August 2026</p>

    <p>
      {COMPANY_LEGAL_NAME} operates {BRAND_NAME} ({COMPANY_WEBSITE}). All prices on this website
      and through our QR ordering platform are quoted in{" "}
      <strong>
        {CURRENCY_LABEL} ({CURRENCY_CODE}) — {CURRENCY_SYMBOL}
      </strong>
      unless stated otherwise.
    </p>

    <div className="legal-page__contact-card">
      <p>
        <strong>Currency:</strong> {CURRENCY_CODE} ({CURRENCY_SYMBOL}) — Indian Rupee
      </p>
      {COMPANY_GST && (
        <p>
          <strong>GSTIN:</strong> {COMPANY_GST}
        </p>
      )}
      <p>
        <strong>Billing entity:</strong> {COMPANY_LEGAL_NAME}
      </p>
    </div>

    <h2>How pricing works</h2>
    {PRICING_HIGHLIGHTS.map((item) => (
      <div key={item.title} className="legal-pricing-block">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <p className="legal-pricing-block__example">
          <strong>{item.example}</strong>
        </p>
      </div>
    ))}

    <h2>Platform fees</h2>
    <p>{PLATFORM_FEE_DESCRIPTION}</p>
    <p>
      Any platform or service fee charged to restaurant partners is communicated in the partner
      agreement and invoiced in INR (₹).
    </p>

    {SUBSCRIPTION_FROM_INR && (
      <>
        <h2>Subscription plans (restaurants)</h2>
        <p>
          QR ordering software subscription for restaurant partners starts from{" "}
          <strong>{formatInr(SUBSCRIPTION_FROM_INR)} per month (INR)</strong>. Final pricing
          depends on plan features and restaurant type.{" "}
          <Link to={routes.contact}>Contact us</Link> for a quote.
        </p>
      </>
    )}

    <h2>Taxes</h2>
    <p>
      Menu prices may be exclusive or inclusive of applicable GST as configured by each restaurant.
      The payable amount in INR (₹) is shown on the checkout screen before payment is confirmed.
    </p>

    <h2>Questions about pricing</h2>
    <p>
      Email{" "}
      <a href={`mailto:${COMPANY_SUPPORT_EMAIL}`}>{COMPANY_SUPPORT_EMAIL}</a> for billing or
      partnership enquiries. See our{" "}
      <Link to={routes.refundPolicy}>Refund Policy</Link> for refund terms on paid orders.
    </p>
  </LegalPageLayout>
);

export default PricingPage;
