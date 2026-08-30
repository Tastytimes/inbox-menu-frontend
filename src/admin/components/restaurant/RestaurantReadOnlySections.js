import React, { useState } from "react";
import {
  downloadSubscriptionPaymentInvoice,
  emailSubscriptionPaymentInvoice,
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
          </div>
          {logoUrl && <img src={logoUrl} alt="" className="admin-venue-logo" />}
          <div className="admin-kyc-links">
            <KycPhoto label="FSSAI photo" url={info.fssaiPhotoUrl} />
            <KycPhoto label="Aadhar photo" url={info.aadharPhotoUrl} />
            <KycPhoto label="PAN photo" url={info.panPhotoUrl} />
            <KycPhoto label="GST photo" url={info.gstPhotoUrl} />
          </div>
        </>
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
