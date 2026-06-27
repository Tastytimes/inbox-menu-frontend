import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStoredCartId } from "../utils/cartStorage";
import {
  getStoredCustomer,
  isValidPhone,
  setLastCustomerPhone,
  setStoredCustomer,
} from "../utils/customerStorage";
import { routes } from "../utils/routes";
import CheckoutCustomerForm from "./restaurant/CheckoutCustomerForm";
import "./restaurant/RestaurantMenu.css";

const ContactDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const cartId = getStoredCartId(slug);
    if (!cartId) {
      setError("Your cart is empty");
      return;
    }

    const saved = getStoredCustomer(slug);
    if (saved) {
      setPhone(saved.customerPhone || "");
      setName(saved.customerName || "");
      setEmail(saved.customerEmail || "");
    }
  }, [slug]);

  const handleContinue = () => {
    if (!isValidPhone(phone)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    setStoredCustomer(slug, {
      customerPhone: phone,
      customerName: name.trim() || undefined,
      customerEmail: email.trim() || undefined,
    });
    setLastCustomerPhone(phone);
    navigate(routes.checkout(slug));
  };

  if (error === "Your cart is empty") {
    return (
      <div className="checkout-page checkout-page--empty">
        <p>{error}</p>
        <Link to={routes.restaurant(slug)} className="checkout-page__back">
          ← Back to menu
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-page__header">
        <Link to={routes.restaurant(slug)} className="checkout-page__back">
          ← Back to menu
        </Link>
        <h1>Contact details</h1>
        <p className="contact-details__subtitle">
          Enter your details to proceed to checkout and payment.
        </p>
      </header>

      <CheckoutCustomerForm
        phone={phone}
        name={name}
        email={email}
        onPhoneChange={(value) => {
          setPhone(value);
          setError("");
        }}
        onNameChange={setName}
        onEmailChange={setEmail}
        disabled={false}
      />

      {error && <p className="contact-details__error">{error}</p>}

      <button
        type="button"
        className="checkout-page__place-btn"
        onClick={handleContinue}
        disabled={!isValidPhone(phone)}
      >
        Continue to checkout
      </button>
    </div>
  );
};

export default ContactDetailsPage;
