import React, { Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import CheckoutPage from "./CheckoutPage";
import ContactDetailsPage from "./ContactDetailsPage";
import HomePage from "./HomePage";
import OrderLookupPage from "./OrderLookupPage";
import OrderTrackingPage from "./OrderTrackingPage";
import PaymentStatusPage from "./PaymentStatusPage";
import RestaurantPage from "./RestaurantPage";
import InvalidUrl from "./InvalidUrl";
import AboutPage from "./legal/AboutPage";
import ContactPage from "./legal/ContactPage";
import PrivacyPage from "./legal/PrivacyPage";
import RefundPolicyPage from "./legal/RefundPolicyPage";
import PricingPage from "./legal/PricingPage";
import TermsPage from "./legal/TermsPage";
import { routes } from "../utils/routes";

const AdminApp = React.lazy(() => import("../admin/AdminApp"));

const AdminLoadingFallback = () => (
  <div className="admin-loading">Loading admin…</div>
);

const QrLegacyRedirect = () => {
  const location = useLocation();
  return (
    <Navigate
      to={`/qr${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
};

const Body = () => {
  return (
    <Routes>
      <Route path={routes.home} element={<HomePage />} />
      <Route path={routes.about} element={<AboutPage />} />
      <Route path={routes.contact} element={<ContactPage />} />
      <Route path={routes.terms} element={<TermsPage />} />
      <Route path={routes.privacy} element={<PrivacyPage />} />
      <Route path={routes.refundPolicy} element={<RefundPolicyPage />} />
      <Route path={routes.pricing} element={<PricingPage />} />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path={routes.trackOrders} element={<OrderLookupPage />} />
      <Route path={routes.paymentStatus} element={<PaymentStatusPage />} />
      <Route path="/qr/:slug/payment/status" element={<PaymentStatusPage />} />
      <Route path="/qr/:slug/checkout/contact" element={<ContactDetailsPage />} />
      <Route path="/qr/:slug/checkout" element={<CheckoutPage />} />
      <Route path="/qr/:slug" element={<RestaurantPage />} />
      <Route path="/track/:token" element={<OrderTrackingPage />} />
      <Route path="/track-orders" element={<Navigate to={routes.trackOrders} replace />} />
      <Route path="/payment/status" element={<Navigate to={routes.paymentStatus} replace />} />
      <Route path="/:slug/*" element={<QrLegacyRedirect />} />
      <Route path="*" element={<InvalidUrl />} />
    </Routes>
  );
};

export default Body;
