import React from "react";

const CheckoutCustomerForm = ({
  phone,
  name,
  email,
  onPhoneChange,
  onNameChange,
  onEmailChange,
  disabled,
}) => (
  <section className="checkout-customer">
    <h2 className="checkout-page__section-title">Contact details</h2>
    <div className="checkout-customer__card">
      <label className="checkout-customer__field">
        <span>
          Mobile number <span className="checkout-customer__required">*</span>
        </span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit mobile number"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ""))}
          disabled={disabled}
        />
      </label>
      <label className="checkout-customer__field">
        <span>Name (optional)</span>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled}
        />
      </label>
      <label className="checkout-customer__field">
        <span>Email (optional)</span>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={disabled}
        />
      </label>
      <p className="checkout-customer__hint">
        Required for online payment and order updates.
      </p>
    </div>
  </section>
);

export default CheckoutCustomerForm;
