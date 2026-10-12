import React, { useState } from "react";
import {
  downloadSubscriptionPaymentInvoice,
  emailSubscriptionPaymentInvoice,
  getRestaurantBankAccount,
} from "../../api/adminApi";
import AdminStatusBadge from "../AdminStatusBadge";
import DetailRow from "./DetailRow";
import { formatAdminAmount, formatAdminTime } from "../../utils/adminFormatters";
import {
  buildMenuView,
  displayValue,
  formatBusinessTypes,
  formatChargeValue,
  formatPaymentAmount,
  getIsRestaurantActive,
  getRegistrationStatus,
} from "../../utils/restaurantProfileDisplay";
import { BUSINESS_TYPE_OPTIONS } from "../../constants/businessTypes";

const ONBOARDING_STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const EASEBUZZ_APPLIED_OPTIONS = [
  { value: "not_applied", label: "Not applied" },
  { value: "applied", label: "Applied" },
  { value: "approved", label: "Approved" },
];

const PAYOUT_MODE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "easebuzz", label: "Easebuzz" },
];

const SETUP_FEE_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "waived", label: "Waived off" },
  { value: "expired", label: "Expired" },
  { value: "failed", label: "Failed" },
];

const EASEBUZZ_MERCHANT_CATEGORY_OPTIONS = [
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail / Ecommerce / NGO" },
  { value: "government", label: "Government" },
  { value: "nbfc", label: "NBFC / Financial institution" },
  { value: "grocery", label: "Grocery / Agritech" },
];

const GOV_DOCUMENT_LABELS = {
  gst: "GST",
  msme: "MSME",
  udyam: "Udyam",
};

const labelFor = (options, value) =>
  options.find((option) => option.value === value)?.label || value || "—";

const KycPhoto = ({ label, url }) =>
  url ? (
    <a href={url} target="_blank" rel="noreferrer" className="admin-kyc-link">
      {label}
    </a>
  ) : (
    <span className="admin-card__hint">{label}: —</span>
  );

export const VerificationSection = ({
  verification,
  operational,
  basicInfo,
  editing,
  form,
  onFieldChange,
  actions,
}) => {
  const status = getRegistrationStatus({ operational, basicInfo });

  return (
    <section className="admin-card admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section__title">Verification & operations</h2>
        {actions}
      </div>
      <div className="admin-detail-grid">
        <DetailRow label="Valid client" value={verification?.valid ? "Yes" : "No"} />
        <DetailRow label="Client ID" value={displayValue(verification?.clientId)} />
        <DetailRow label="Login allowed" value={verification?.loginAllowed ? "Yes" : "No"} />
        <DetailRow label="Registration status">
          <AdminStatusBadge status={status} label={status || "—"} />
        </DetailRow>
        {basicInfo?.payoutMode === "easebuzz" && !basicInfo?.easebuzzSaltSaved && (
          <DetailRow
            label="Easebuzz"
            value="Save the key and salt in Onboarding & payout before approving."
          />
        )}
        <DetailRow
          label="Open for orders"
          value={getIsRestaurantActive({ operational, basicInfo }) ? "Open" : "Closed"}
        />
        {verification?.reason && (
          <DetailRow label="Reason" value={verification.reason} />
        )}
        {operational && (
          <>
            <DetailRow
              label="Active subscription coverage"
              value={operational.hasActiveCoverage ? "Yes" : "No"}
            />
            <DetailRow
              label="Active vendor"
              value={operational.hasActiveVendor ? "Yes" : "No"}
            />
            <DetailRow
              label="Vendor configured"
              value={operational.vendorConfigured ? "Yes" : "No"}
            />
            <DetailRow label="Vendor status" value={displayValue(operational.vendorStatus)} />
            <DetailRow
              label="Can open restaurant"
              value={operational.canOpenRestaurant ? "Yes" : "No"}
            />
          </>
        )}
        {editing && (
          <DetailRow label="Admin override — open">
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => onFieldChange("isActive", event.target.checked)}
              />
              {form.isActive ? "Open" : "Closed"}
            </label>
          </DetailRow>
        )}
      </div>
    </section>
  );
};

export const BasicInfoSection = ({ basicInfo, verification, editing, form, onBasicChange, actions }) => {
  const info = basicInfo || {};
  const logoUrl = info.logoUrl || verification?.logoUrl;
  const selectedBusinessTypes = form.basicInfo.businessType || [];

  const toggleBusinessType = (value) => {
    const next = selectedBusinessTypes.includes(value)
      ? selectedBusinessTypes.filter((type) => type !== value)
      : [...selectedBusinessTypes, value];
    onBasicChange("businessType", next);
  };

  return (
    <section className="admin-card admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section__title">Basic info & KYC</h2>
        {actions}
      </div>
      {editing ? (
        <div className="admin-restaurant-form">
          <div className="admin-field">
            <label htmlFor="restaurantName">Restaurant name</label>
            <input
              id="restaurantName"
              value={form.basicInfo.restaurantName}
              onChange={(event) => onBasicChange("restaurantName", event.target.value)}
              required
            />
          </div>
          <div className="admin-field admin-field--full">
            <label htmlFor="restaurantAddress">Address</label>
            <input
              id="restaurantAddress"
              value={form.basicInfo.restaurantAddress}
              onChange={(event) => onBasicChange("restaurantAddress", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="city">City</label>
            <input
              id="city"
              value={form.basicInfo.city}
              onChange={(event) => onBasicChange("city", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="state">State</label>
            <input
              id="state"
              value={form.basicInfo.state}
              onChange={(event) => onBasicChange("state", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="zipCode">Pin code</label>
            <input
              id="zipCode"
              value={form.basicInfo.zipCode}
              onChange={(event) => onBasicChange("zipCode", event.target.value)}
            />
          </div>
          <div className="admin-field admin-field--full">
            <span className="admin-field__label">Business types</span>
            <div className="admin-checkbox-group">
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedBusinessTypes.includes(option.value)}
                    onChange={() => toggleBusinessType(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="fssaiNumber">FSSAI number</label>
            <input
              id="fssaiNumber"
              value={form.basicInfo.fssaiNumber}
              onChange={(event) => onBasicChange("fssaiNumber", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="aadharNumber">Aadhar number</label>
            <input
              id="aadharNumber"
              value={form.basicInfo.aadharNumber}
              onChange={(event) => onBasicChange("aadharNumber", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="panNumber">PAN number</label>
            <input
              id="panNumber"
              value={form.basicInfo.panNumber}
              onChange={(event) => onBasicChange("panNumber", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="gstNumber">GST number</label>
            <input
              id="gstNumber"
              value={form.basicInfo.gstNumber}
              onChange={(event) => onBasicChange("gstNumber", event.target.value)}
              placeholder="15-character GSTIN"
            />
            <p className="admin-card__hint">
              Used on subscription tax invoices. Leave blank if the restaurant has no GST registration.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-detail-grid">
            <DetailRow label="Restaurant name" value={displayValue(info.restaurantName)} />
            <DetailRow label="Address" value={displayValue(info.restaurantAddress)} />
            <DetailRow label="City" value={displayValue(info.city)} />
            <DetailRow label="State" value={displayValue(info.state)} />
            <DetailRow label="Pin code" value={displayValue(info.zipCode)} />
            <DetailRow label="Business types" value={formatBusinessTypes(info)} />
            <DetailRow label="Registration status">
              <AdminStatusBadge status={info.status} label={info.status || "—"} />
            </DetailRow>
            <DetailRow label="Open for orders" value={info.isActive ? "Open" : "Closed"} />
            <DetailRow label="FSSAI" value={displayValue(info.fssaiNumber)} />
            <DetailRow label="Aadhar" value={displayValue(info.aadharNumber)} />
            <DetailRow label="PAN" value={displayValue(info.panNumber)} />
            <DetailRow label="GST" value={displayValue(info.gstNumber)} />
            <DetailRow
              label="Government document"
              value={
                info.govDocumentType
                  ? `${GOV_DOCUMENT_LABELS[info.govDocumentType] || info.govDocumentType} · ${displayValue(info.govDocumentNumber)}`
                  : "—"
              }
            />
          </div>
          {logoUrl && <img src={logoUrl} alt="" className="admin-venue-logo" />}
          <div className="admin-kyc-links">
            <KycPhoto label="FSSAI photo" url={info.fssaiPhotoUrl} />
            <KycPhoto label="Aadhar photo" url={info.aadharPhotoUrl} />
            <KycPhoto label="PAN photo" url={info.panPhotoUrl} />
            <KycPhoto label="GST photo" url={info.gstPhotoUrl} />
            <KycPhoto label="Government document" url={info.govDocumentPhotoUrl} />
          </div>
        </>
      )}
    </section>
  );
};

export const PayoutSection = ({
  clientId,
  basicInfo,
  editing,
  form,
  onPayoutChange,
  actions,
}) => {
  const info = basicInfo || {};
  const payout = form?.payout || {};
  const accountLabel = info.bankAccountLast4 ? `•••• ${info.bankAccountLast4}` : "—";
  const [fullAccountNumber, setFullAccountNumber] = useState("");
  const [revealingAccount, setRevealingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");

  const revealAccountNumber = async () => {
    setRevealingAccount(true);
    setAccountError("");
    try {
      const data = await getRestaurantBankAccount(Number(clientId));
      setFullAccountNumber(data.bankAccountNumber || "");
    } catch (err) {
      setAccountError(err.response?.data?.message || "Could not retrieve the account number.");
    } finally {
      setRevealingAccount(false);
    }
  };

  return (
    <section className="admin-card admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section__title">Onboarding & payout</h2>
        {actions}
      </div>
      {editing ? (
        <div className="admin-restaurant-form">
          <div className="admin-field">
            <label htmlFor="onboardingStatus">Restaurant onboarding status</label>
            <select
              id="onboardingStatus"
              value={payout.status}
              onChange={(event) => onPayoutChange("status", event.target.value)}
            >
              {ONBOARDING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="easebuzzApplicationStatus">Easebuzz applied status</label>
            <select
              id="easebuzzApplicationStatus"
              value={payout.easebuzzApplicationStatus}
              onChange={(event) =>
                onPayoutChange("easebuzzApplicationStatus", event.target.value)
              }
            >
              {EASEBUZZ_APPLIED_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="easebuzzMerchantCategory">Easebuzz merchant category</label>
            <select
              id="easebuzzMerchantCategory"
              value={payout.easebuzzMerchantCategory}
              onChange={(event) =>
                onPayoutChange("easebuzzMerchantCategory", event.target.value)
              }
            >
              {EASEBUZZ_MERCHANT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="payoutMode">Payout method</label>
            <select
              id="payoutMode"
              value={payout.payoutMode}
              onChange={(event) => onPayoutChange("payoutMode", event.target.value)}
            >
              {PAYOUT_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="admin-card__hint">
              Applied status and payout method can be saved on their own. Key and salt are required
              only when the restaurant is approved on Easebuzz payout.
            </p>
          </div>
          <div className="admin-field">
            <label htmlFor="payoutBankAccount">Bank account number</label>
            <input
              id="payoutBankAccount"
              value={payout.bankAccountNumber}
              onChange={(event) =>
                onPayoutChange("bankAccountNumber", event.target.value.replace(/\D/g, ""))
              }
              placeholder={accountLabel === "—" ? "Account number" : `Saved ${accountLabel}`}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="payoutBankIfsc">IFSC</label>
            <input
              id="payoutBankIfsc"
              value={payout.bankIfsc}
              onChange={(event) => onPayoutChange("bankIfsc", event.target.value.toUpperCase())}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="payoutBankHolder">Account holder</label>
            <input
              id="payoutBankHolder"
              value={payout.bankAccountHolder}
              onChange={(event) => onPayoutChange("bankAccountHolder", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="easebuzzKey">Easebuzz key</label>
            <input
              id="easebuzzKey"
              value={payout.easebuzzKey}
              onChange={(event) => onPayoutChange("easebuzzKey", event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="easebuzzSalt">Easebuzz salt</label>
            <input
              id="easebuzzSalt"
              type="password"
              value={payout.easebuzzSalt}
              onChange={(event) => onPayoutChange("easebuzzSalt", event.target.value)}
              placeholder={payout.easebuzzSaltSaved ? "Saved — leave blank to keep" : "Salt"}
              autoComplete="new-password"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="easebuzzMerchantId">Easebuzz merchant ID</label>
            <input
              id="easebuzzMerchantId"
              value={payout.easebuzzMerchantId}
              onChange={(event) => onPayoutChange("easebuzzMerchantId", event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="setupFeeAmount">Setup fee (₹)</label>
            <input
              id="setupFeeAmount"
              type="number"
              min="0"
              step="0.01"
              value={payout.setupFeeAmount}
              onChange={(event) => onPayoutChange("setupFeeAmount", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="setupFeeStatus">Setup fee status</label>
            <select
              id="setupFeeStatus"
              value={payout.setupFeeStatus}
              onChange={(event) => onPayoutChange("setupFeeStatus", event.target.value)}
            >
              {SETUP_FEE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="setupFeeExpiresAt">Setup fee expires</label>
            <input
              id="setupFeeExpiresAt"
              type="datetime-local"
              value={payout.setupFeeExpiresAt}
              onChange={(event) => onPayoutChange("setupFeeExpiresAt", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="setupFeePaidAt">Setup fee paid</label>
            <input
              id="setupFeePaidAt"
              type="datetime-local"
              value={payout.setupFeePaidAt}
              onChange={(event) => onPayoutChange("setupFeePaidAt", event.target.value)}
            />
            <p className="admin-card__hint">
              Leave paid time empty and set status to Paid to stamp the current time on save.
            </p>
          </div>
        </div>
      ) : (
        <div className="admin-detail-grid">
          <DetailRow label="Restaurant onboarding">
            <AdminStatusBadge status={info.status} label={labelFor(ONBOARDING_STATUS_OPTIONS, info.status)} />
          </DetailRow>
          <DetailRow label="Easebuzz applied">
            <AdminStatusBadge
              status={info.easebuzzApplicationStatus}
              label={labelFor(EASEBUZZ_APPLIED_OPTIONS, info.easebuzzApplicationStatus)}
            />
          </DetailRow>
          <DetailRow label="Payout method">
            <AdminStatusBadge
              status={info.payoutMode}
              label={labelFor(PAYOUT_MODE_OPTIONS, info.payoutMode)}
            />
          </DetailRow>
          <DetailRow
            label="Easebuzz merchant category"
            value={labelFor(EASEBUZZ_MERCHANT_CATEGORY_OPTIONS, info.easebuzzMerchantCategory)}
          />
          <DetailRow label="Bank account">
            {fullAccountNumber ? (
              <span>
                {fullAccountNumber}{" "}
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--small"
                  onClick={() => setFullAccountNumber("")}
                >
                  Hide
                </button>
              </span>
            ) : (
              <span>
                {accountLabel}{" "}
                {info.bankAccountLast4 && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--small"
                    disabled={revealingAccount}
                    onClick={revealAccountNumber}
                  >
                    {revealingAccount ? "Retrieving…" : "Show full number"}
                  </button>
                )}
                {accountError && <span className="admin-card__hint"> {accountError}</span>}
              </span>
            )}
          </DetailRow>
          <DetailRow label="IFSC" value={displayValue(info.bankIfsc)} />
          <DetailRow label="Account holder" value={displayValue(info.bankAccountHolder)} />
          <DetailRow label="Easebuzz key" value={displayValue(info.easebuzzKey)} />
          <DetailRow label="Easebuzz salt" value={info.easebuzzSaltSaved ? "Saved" : "Not saved"} />
          <DetailRow label="Easebuzz merchant ID" value={displayValue(info.easebuzzMerchantId)} />
          <DetailRow label="Setup fee" value={formatAdminAmount(info.setupFeeAmount)} />
          <DetailRow label="Setup fee status">
            <AdminStatusBadge
              status={info.setupFeeStatus}
              label={labelFor(SETUP_FEE_STATUS_OPTIONS, info.setupFeeStatus)}
            />
          </DetailRow>
          <DetailRow label="Setup fee expires" value={formatAdminTime(info.setupFeeExpiresAt)} />
          <DetailRow label="Setup fee paid" value={formatAdminTime(info.setupFeePaidAt)} />
          {info.setupFeePaymentLinkUrl && (
            <DetailRow label="Setup fee link">
              <a href={info.setupFeePaymentLinkUrl} target="_blank" rel="noreferrer">
                Open payment link
              </a>
            </DetailRow>
          )}
        </div>
      )}
    </section>
  );
};

export const OwnerSection = ({ owner, editing, form, onOwnerChange, actions }) => {
  const data = owner || {};

  return (
    <section className="admin-card admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section__title">Owner</h2>
        {actions}
      </div>
      {editing ? (
        <div className="admin-restaurant-form">
          <div className="admin-field">
            <label htmlFor="ownerName">Name</label>
            <input
              id="ownerName"
              value={form.owner.name}
              onChange={(event) => onOwnerChange("name", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="ownerEmail">Email</label>
            <input
              id="ownerEmail"
              type="email"
              value={form.owner.email}
              onChange={(event) => onOwnerChange("email", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="ownerPhone">Phone</label>
            <input
              id="ownerPhone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.owner.phone}
              onChange={(event) =>
                onOwnerChange("phone", event.target.value.replace(/\D/g, ""))
              }
            />
          </div>
          <div className="admin-field">
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={form.owner.isActive}
                onChange={(event) => onOwnerChange("isActive", event.target.checked)}
              />
              Active
            </label>
          </div>
        </div>
      ) : (
        <div className="admin-detail-grid">
          <DetailRow label="Name" value={displayValue(data.name)} />
          <DetailRow label="Email" value={displayValue(data.email)} />
          <DetailRow label="Phone" value={displayValue(data.phone)} />
          <DetailRow label="Role" value={displayValue(data.role)} />
          <DetailRow label="Active" value={data.isActive ? "Yes" : "No"} />
          <DetailRow label="First login pending" value={data.isFirstLogin ? "Yes" : "No"} />
          <DetailRow
            label="Assigned counter"
            value={displayValue(data.assignedCounterName)}
          />
        </div>
      )}
    </section>
  );
};

export const ContactsSection = ({ contacts, editing, form, onStaffChange, actions }) => {
  const rows = editing ? form.staff : contacts;

  if (!rows?.length) {
    return (
      <section className="admin-card admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section__title">Staff & contacts</h2>
          {actions}
        </div>
        <p className="admin-empty">No contacts listed.</p>
      </section>
    );
  }

  return (
    <section className="admin-card admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section__title">Staff & contacts</h2>
        {actions}
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              {!editing && (
                <>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Counter</th>
                  <th>First login</th>
                </>
              )}
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((contact, index) => (
              <tr key={contact.userId ?? contact.id ?? index}>
                <td>
                  {editing ? (
                    <input
                      value={contact.name}
                      onChange={(event) => onStaffChange(index, "name", event.target.value)}
                    />
                  ) : (
                    displayValue(contact.name)
                  )}
                </td>
                {!editing && (
                  <>
                    <td>{displayValue(contact.role)}</td>
                    <td>{displayValue(contact.email)}</td>
                    <td>{displayValue(contact.phone)}</td>
                    <td>{displayValue(contact.assignedCounterName)}</td>
                    <td>{contact.isFirstLogin ? "Pending" : "Done"}</td>
                  </>
                )}
                <td>
                  {editing ? (
                    <input
                      type="checkbox"
                      checked={contact.isActive}
                      onChange={(event) =>
                        onStaffChange(index, "isActive", event.target.checked)
                      }
                    />
                  ) : (
                    contact.isActive ? "Yes" : "No"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const VendorSection = ({ vendor, editing, form, onVendorChange, actions }) => {
  const data = vendor || {};
  const maskedAccount = data.bankAccountNumberMasked || data.bankAccountNumber;

  return (
    <section className="admin-card admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section__title">Cashfree payout account</h2>
        {actions}
      </div>
      {editing ? (
        <div className="admin-restaurant-form">
          <div className="admin-field admin-field--full">
            <label htmlFor="bankAccountNumber">Bank account number</label>
            <input
              id="bankAccountNumber"
              value={form.vendor.bankAccountNumber}
              onChange={(event) => onVendorChange("bankAccountNumber", event.target.value)}
              placeholder={maskedAccount || "Enter full account number to update"}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="bankAccountHolder">Account holder</label>
            <input
              id="bankAccountHolder"
              value={form.vendor.bankAccountHolder}
              onChange={(event) => onVendorChange("bankAccountHolder", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="bankIfsc">IFSC</label>
            <input
              id="bankIfsc"
              value={form.vendor.bankIfsc}
              onChange={(event) => onVendorChange("bankIfsc", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="vendorPan">PAN</label>
            <input
              id="vendorPan"
              value={form.vendor.panNumber}
              onChange={(event) => onVendorChange("panNumber", event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="vendorGst">GST</label>
            <input
              id="vendorGst"
              value={form.vendor.gstNumber}
              onChange={(event) => onVendorChange("gstNumber", event.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="admin-detail-grid">
          <DetailRow label="Configured" value={data.configured ? "Yes" : "No"} />
          <DetailRow label="Vendor ID" value={displayValue(data.vendorId)} />
          <DetailRow label="Vendor name" value={displayValue(data.vendorName)} />
          <DetailRow label="Vendor email" value={displayValue(data.vendorEmail)} />
          <DetailRow label="Vendor phone" value={displayValue(data.vendorPhone)} />
          <DetailRow label="Bank account" value={displayValue(maskedAccount)} />
          <DetailRow label="Last 4 digits" value={displayValue(data.bankAccountLast4)} />
          <DetailRow label="IFSC" value={displayValue(data.bankIfsc)} />
          <DetailRow label="Account holder" value={displayValue(data.bankAccountHolder)} />
          <DetailRow label="PAN" value={displayValue(data.panNumber)} />
          <DetailRow label="GST" value={displayValue(data.gstNumber)} />
          <DetailRow label="Status" value={displayValue(data.status)} />
          <DetailRow label="Cashfree status" value={displayValue(data.cashfreeStatus)} />
          <DetailRow label="Status message" value={displayValue(data.statusMessage)} />
          <DetailRow label="Can accept payments" value={data.canAcceptPayments ? "Yes" : "No"} />
          <DetailRow
            label="Settlement schedule"
            value={displayValue(data.settlementScheduleOption)}
          />
          <DetailRow label="Created" value={formatAdminTime(data.createdAt)} />
          <DetailRow label="Updated" value={formatAdminTime(data.updatedAt)} />
        </div>
      )}
    </section>
  );
};

export const SubscriptionsSection = ({ subscriptions, clientId }) => {
  const [invoiceAction, setInvoiceAction] = useState(null);
  const [invoiceError, setInvoiceError] = useState("");

  const handleDownloadInvoice = async (paymentId) => {
    if (!clientId) {
      return;
    }

    setInvoiceAction(`download-${paymentId}`);
    setInvoiceError("");

    try {
      const { blob, filename } = await downloadSubscriptionPaymentInvoice(
        clientId,
        paymentId
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setInvoiceError(
        error.response?.data?.message ||
          error.message ||
          "Could not download invoice."
      );
    } finally {
      setInvoiceAction(null);
    }
  };

  const handleEmailInvoice = async (paymentId) => {
    if (!clientId) {
      return;
    }

    setInvoiceAction(`email-${paymentId}`);
    setInvoiceError("");

    try {
      await emailSubscriptionPaymentInvoice(clientId, paymentId);
    } catch (error) {
      setInvoiceError(
        error.response?.data?.message ||
          error.message ||
          "Could not email invoice."
      );
    } finally {
      setInvoiceAction(null);
    }
  };
  if (!subscriptions?.length) {
    return (
      <section className="admin-card admin-section">
        <h2 className="admin-section__title">Subscriptions</h2>
        <p className="admin-empty">No subscriptions.</p>
      </section>
    );
  }

  return (
    <section className="admin-card admin-section">
      <h2 className="admin-section__title">Subscriptions</h2>
      {subscriptions.map((sub) => (
        <div key={sub.id} className="admin-subscription-block">
          <div className="admin-detail-grid">
            <DetailRow label="Plan" value={displayValue(sub.planName)} />
            <DetailRow label="Plan code" value={displayValue(sub.planCode)} />
            <DetailRow label="Status">
              <AdminStatusBadge status={sub.status} label={sub.status || "—"} />
            </DetailRow>
            <DetailRow label="Quantity" value={displayValue(sub.quantity)} />
            <DetailRow
              label="Covered types"
              value={
                sub.coveredTypes?.length ? sub.coveredTypes.join(", ") : "—"
              }
            />
            <DetailRow label="Start" value={formatAdminTime(sub.startDate)} />
            <DetailRow label="End" value={formatAdminTime(sub.endDate)} />
            <DetailRow label="Cancelled" value={formatAdminTime(sub.cancelledAt)} />
            <DetailRow label="Razorpay order" value={displayValue(sub.razorpayOrderId)} />
          </div>

          {sub.paymentAttempts?.length > 0 && (
            <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Payment status</th>
                    <th>Amount</th>
                    <th>Invoice</th>
                    <th>Razorpay payment ID</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sub.paymentAttempts.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <AdminStatusBadge status={payment.status} label={payment.status} />
                      </td>
                      <td>{formatPaymentAmount(payment.amount, payment.currency)}</td>
                      <td className="admin-detail-mono">
                        {displayValue(payment.invoiceNumber)}
                      </td>
                      <td className="admin-detail-mono">
                        {displayValue(payment.razorpayPaymentId)}
                      </td>
                      <td>{formatAdminTime(payment.createdAt)}</td>
                      <td>
                        {payment.status === "success" ? (
                          <div className="admin-menu-import__toolbar">
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              disabled={Boolean(invoiceAction)}
                              onClick={() => handleDownloadInvoice(payment.id)}
                            >
                              {invoiceAction === `download-${payment.id}`
                                ? "Downloading…"
                                : "Download"}
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--secondary"
                              disabled={Boolean(invoiceAction)}
                              onClick={() => handleEmailInvoice(payment.id)}
                            >
                              {invoiceAction === `email-${payment.id}`
                                ? "Sending…"
                                : "Email"}
                            </button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      {invoiceError ? <p className="admin-error">{invoiceError}</p> : null}
    </section>
  );
};

export const QrCodesSection = ({ qrCodes }) => {
  if (!qrCodes?.length) {
    return (
      <section className="admin-card admin-section">
        <h2 className="admin-section__title">QR codes</h2>
        <p className="admin-empty">No QR codes.</p>
      </section>
    );
  }

  return (
    <section className="admin-card admin-section">
      <h2 className="admin-section__title">QR codes</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Slug</th>
              <th>Table</th>
              <th>Business type</th>
              <th>Active</th>
              <th>Target URL</th>
              <th>QR image</th>
            </tr>
          </thead>
          <tbody>
            {qrCodes.map((qr) => (
              <tr key={qr.id}>
                <td>{displayValue(qr.label)}</td>
                <td>{displayValue(qr.slug)}</td>
                <td>{displayValue(qr.tableNo)}</td>
                <td>{displayValue(qr.businessType)}</td>
                <td>{qr.isActive ? "Yes" : "No"}</td>
                <td>
                  {qr.targetUrl ? (
                    <a href={qr.targetUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {qr.qrImageUrl ? (
                    <a href={qr.qrImageUrl} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const BillExtraChargesSection = ({ billExtraCharges }) => {
  const charges = Array.isArray(billExtraCharges) ? billExtraCharges : [];

  if (!charges.length) {
    return (
      <section className="admin-card admin-section">
        <h2 className="admin-section__title">Bill extra charges</h2>
        <p className="admin-empty">No bill settings configured.</p>
      </section>
    );
  }

  return (
    <section className="admin-card admin-section">
      <h2 className="admin-section__title">Bill extra charges</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Business type</th>
              <th>Type</th>
              <th>Value</th>
              <th>Sort order</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((charge) => (
              <tr key={charge.id}>
                <td>{displayValue(charge.name)}</td>
                <td>{displayValue(charge.businessType)}</td>
                <td>{displayValue(charge.chargeType)}</td>
                <td>{formatChargeValue(charge)}</td>
                <td>{displayValue(charge.sortOrder)}</td>
                <td>{charge.isActive ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const MenuCategory = ({ category }) => {
  const [open, setOpen] = useState(false);
  const foods = category.foods || [];

  return (
    <div className="admin-menu-category">
      <button type="button" className="admin-menu-category__toggle" onClick={() => setOpen(!open)}>
        <span>{category.categoryName || "Category"}</span>
        <span className="admin-card__hint">
          {foods.length} items · {category.businessType || "—"}
        </span>
      </button>
      {open && (
        <div className="admin-menu-category__body">
          {category.description && (
            <p className="admin-card__hint">{category.description}</p>
          )}
          {foods.length > 0 ? (
            <ul className="admin-menu-items">
              {foods.map((item) => (
                <li key={item.id}>
                  {item.foodImage && (
                    <img src={item.foodImage} alt="" className="admin-menu-item__thumb" />
                  )}
                  <span className="admin-menu-item__name">
                    {item.name}
                    {item.isBestSeller && (
                      <span className="admin-card__hint"> · Best seller</span>
                    )}
                  </span>
                  <span>{formatAdminAmount(item.price)}</span>
                  <span className="admin-card__hint">
                    {item.counterName || "—"} · {item.foodType || "—"}
                  </span>
                  {!item.available && <span className="admin-card__hint">Unavailable</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-card__hint">No items in this category.</p>
          )}
        </div>
      )}
    </div>
  );
};

export const MenuSection = ({ menu }) => {
  const { categories, counters, foods } = buildMenuView(menu);

  if (!categories.length && !counters.length && !foods.length) {
    return (
      <section className="admin-card admin-section">
        <h2 className="admin-section__title">Menu</h2>
        <p className="admin-empty">No menu data.</p>
      </section>
    );
  }

  return (
    <section className="admin-card admin-section">
      <h2 className="admin-section__title">
        Menu ({categories.length} categories · {foods.length} items)
      </h2>
      <p className="admin-card__hint">Read-only — menu changes go through owner APIs.</p>

      {counters.length > 0 && (
        <div className="admin-table-wrap" style={{ marginBottom: "1rem" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Counter</th>
                <th>Description</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {counters.map((counter) => (
                <tr key={counter.id}>
                  <td>{displayValue(counter.name)}</td>
                  <td>{displayValue(counter.description)}</td>
                  <td>{counter.status ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-menu-tree">
        {categories.map((category) => (
          <MenuCategory key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
};
