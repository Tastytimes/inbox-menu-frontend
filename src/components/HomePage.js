import React from "react";
import { Link } from "react-router-dom";
import {
  BRAND_EMAIL,
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_NAME_KANNADA,
  BRAND_TAGLINE,
  HERO_RESTAURANT_IMAGE,
} from "../constants/brand";
import { routes } from "../utils/routes";
import HeroQrIllustration from "./home/HeroQrIllustration";
import SiteFooter from "./legal/SiteFooter";
import { PRICING_HIGHLIGHTS, CURRENCY_CODE, CURRENCY_SYMBOL } from "../constants/pricing";
import "./home/HomePage.css";
import "./legal/legalPages.css";

const FEATURES = [
  {
    icon: "📱",
    title: "QR Menu Ordering",
    description:
      "Guests scan your table QR code and browse your live menu on their phone — no app download required.",
  },
  {
    icon: "💳",
    title: "Secure Payments",
    description:
      "Accept UPI, cards, and wallets with integrated payment gateways. Customers pay before the order hits the kitchen.",
  },
  {
    icon: "🔔",
    title: "Live Order Updates",
    description:
      "Customers get real-time status updates — placed, preparing, ready — with optional browser notifications.",
  },
  {
    icon: "📦",
    title: "Track Orders",
    description:
      "Let diners look up today's orders by phone number. Perfect for takeaway and dine-in follow-up.",
  },
  {
    icon: "🍽️",
    title: "Dine-in & Takeaway",
    description:
      "Support both order types from a single QR link. Table numbers and pickup details captured at checkout.",
  },
  {
    icon: "⚡",
    title: "Kitchen Sync",
    description:
      "Orders flow straight to your kitchen display. Status changes sync back to the customer's screen instantly.",
  },
];

const STEPS = [
  {
    title: "Print your QR codes",
    description: "Place a unique QR on every table or at your counter. Each code links to your branded menu.",
  },
  {
    title: "Customers order & pay",
    description: "They browse items, add to cart, enter contact details, and pay securely online.",
  },
  {
    title: "Kitchen fulfills",
    description: "Your team accepts and prepares the order. Customers track progress until it's ready.",
  },
];

const WHY_QR = [
  {
    title: "Less front-of-house pressure",
    description:
      "Guests browse and order from their phone. Your team spends less time taking orders and more time serving food.",
  },
  {
    title: "Faster payments",
    description:
      "Customers pay online before the order reaches the kitchen — no chasing bills or splitting payments at the table.",
  },
  {
    title: "Fewer status checks",
    description:
      "Live order updates and a track-orders page mean fewer \"where is my order?\" interruptions during rush hour.",
  },
];

const CAPABILITIES = [
  { value: "0", label: "App downloads required" },
  { value: "UPI", label: "Cards & wallets supported" },
  { value: "Live", label: "Order status updates" },
  { value: "2-in-1", label: "Dine-in & takeaway" },
];

const HomePage = () => (
  <div className="home-page">
    <nav className="home-page__nav">
      <div className="container d-flex align-items-center justify-content-between py-3">
        <Link to={routes.home} className="home-page__logo text-decoration-none">
          <img src={BRAND_LOGO} alt={BRAND_NAME} className="home-page__logo-img" />
          <span className="home-page__logo-text">
            <span className="home-page__logo-en">{BRAND_NAME.toLowerCase()}</span>
            <span className="home-page__logo-kn">{BRAND_NAME_KANNADA}</span>
          </span>
        </Link>
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <Link to={routes.trackOrders} className="home-page__btn home-page__btn--outline d-none d-sm-inline-flex">
            Track Orders
          </Link>
          <a href="#features" className="home-page__btn home-page__btn--primary">
            Explore Features
          </a>
        </div>
      </div>
    </nav>

    <section className="home-page__hero">
      <div className="container py-5">
        <div className="row align-items-center g-5 py-4">
          <div className="col-lg-6">
            <img
              src={BRAND_LOGO}
              alt={BRAND_NAME}
              className="home-page__hero-logo d-lg-none"
            />
            <span className="home-page__hero-badge">QR Ordering by {BRAND_NAME}</span>
            <h1>
              <em>Sakkath food</em>, served fast with contactless QR ordering
            </h1>
            <span className="home-page__tagline">{BRAND_TAGLINE}</span>
            <p className="home-page__hero-lead">
              Scan a table QR, browse the menu, pay online, and track your order — all from your phone.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <a href="#how-it-works" className="home-page__btn home-page__btn--primary">
                See How It Works
              </a>
              <Link to={routes.trackOrders} className="home-page__btn home-page__btn--outline">
                Track an Order
              </Link>
            </div>
            <div className="home-page__pill-row">
              {["QR Menu", "Online Payments", "Order Tracking", "Kitchen Sync"].map((pill) => (
                <span key={pill} className="home-page__pill">
                  {pill}
                </span>
              ))}
            </div>
          </div>
          <div className="col-lg-6 text-center text-lg-end">
            <img
              src={BRAND_LOGO}
              alt={BRAND_NAME}
              className="home-page__hero-logo d-none d-lg-inline-block"
            />
            <HeroQrIllustration className="home-page__hero-img" />
          </div>
        </div>
      </div>
    </section>

    <section id="features" className="home-page__section">
      <div className="container">
        <h2 className="home-page__section-title">Everything you need to run QR ordering</h2>
        <p className="home-page__section-sub">
          From scan to serve — one platform for menus, payments, kitchen handoff, and customer updates.
        </p>
        <div className="row g-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="col-md-6 col-lg-4">
              <div className="home-page__feature-card">
                <div className="home-page__feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="home-page__section home-page__section--alt">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 order-lg-2">
            <h2 className="home-page__section-title text-lg-start">
              Flexible solutions for dine-in & takeaway
            </h2>
            <p className="home-page__section-sub text-lg-start ms-lg-0">
              Whether guests are seated at table 7 or picking up at the counter, the same QR experience works everywhere.
              Reduce staff load, speed up turnover, and keep customers in the loop.
            </p>
            <Link to={routes.trackOrders} className="home-page__btn home-page__btn--primary">
              Try Track Orders
            </Link>
          </div>
          <div className="col-lg-6 order-lg-1">
            <img
              className="home-page__showcase-img"
              src={HERO_RESTAURANT_IMAGE}
              alt="Busy restaurant dining area"
            />
          </div>
        </div>
      </div>
    </section>

    <section id="how-it-works" className="home-page__section">
      <div className="container">
        <h2 className="home-page__section-title">How it works</h2>
        <p className="home-page__section-sub">
          Go live in three simple steps — no complex setup for your guests.
        </p>
        <div className="row g-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="col-md-4">
              <div className="home-page__step">
                <div className="home-page__step-num">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="home-page__stats">
      <div className="container">
        <div className="row text-center g-4">
          {CAPABILITIES.map((item) => (
            <div key={item.label} className="col-6 col-md-3">
              <div className="home-page__stat-num">{item.value}</div>
              <div className="home-page__stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="home-page__section home-page__section--alt">
      <div className="container">
        <h2 className="home-page__section-title">Built for restaurant teams</h2>
        <p className="home-page__section-sub">
          QR ordering solves everyday pain points — without asking guests to install an app.
        </p>
        <div className="row g-4">
          {WHY_QR.map((item) => (
            <div key={item.title} className="col-md-4">
              <div className="home-page__testimonial">
                <h3 className="home-page__benefit-title">{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section id="pricing" className="home-page__section home-page__section--alt">
      <div className="container">
        <h2 className="home-page__section-title">Pricing &amp; currency</h2>
        <p className="home-page__section-sub">
          All amounts on {BRAND_NAME} are shown in Indian Rupee — {CURRENCY_CODE} ({CURRENCY_SYMBOL}).
        </p>
        <div className="row g-4">
          {PRICING_HIGHLIGHTS.map((item) => (
            <div key={item.title} className="col-md-6">
              <div className="home-page__pricing-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="home-page__pricing-example">{item.example}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <Link to={routes.pricing} className="home-page__btn home-page__btn--outline">
            View full pricing details
          </Link>
        </div>
      </div>
    </section>

    <section className="home-page__cta">
      <div className="container">
        <h2>Ready to bring {BRAND_NAME} to your restaurant?</h2>
        <p>
          Set up QR menus for every table, accept digital payments, and keep customers updated from order to pickup.
        </p>
        <a href={`mailto:${BRAND_EMAIL}`} className="home-page__btn home-page__btn--primary">
          Request a Demo
        </a>
      </div>
    </section>

    <footer className="home-page__footer">
      <SiteFooter />
    </footer>
  </div>
);

export default HomePage;
