import React from "react";
import { Link } from "react-router-dom";
import { routes } from "../../utils/routes";

const CustomerSummary = ({ customer, slug }) => (
  <section className="customer-summary">
    <div className="customer-summary__header">
      <h2 className="checkout-page__section-title">Contact details</h2>
      <Link to={routes.checkoutContact(slug)} className="customer-summary__edit">
        Edit
      </Link>
    </div>
    <div className="customer-summary__card">
      <p>
        <span className="customer-summary__label">Phone</span>
        <strong>{customer.customerPhone}</strong>
      </p>
      {customer.customerName && (
        <p>
          <span className="customer-summary__label">Name</span>
          <strong>{customer.customerName}</strong>
        </p>
      )}
      {customer.customerEmail && (
        <p>
          <span className="customer-summary__label">Email</span>
          <strong>{customer.customerEmail}</strong>
        </p>
      )}
    </div>
  </section>
);

export default CustomerSummary;
