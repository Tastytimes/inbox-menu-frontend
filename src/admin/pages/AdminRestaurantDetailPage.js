import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getRestaurantSupportProfile,
  updateRestaurantSupportProfile,
  uploadRestaurantDocuments,
} from "../api/adminApi";
import {
  BasicInfoSection,
  BillExtraChargesSection,
  ContactsSection,
  MenuSection,
  OwnerSection,
  QrCodesSection,
  SubscriptionsSection,
  VendorSection,
  VerificationSection,
} from "../components/restaurant/RestaurantReadOnlySections";
import RestaurantDocumentsSection from "../components/restaurant/RestaurantDocumentsSection";
import {
  buildBasicInfoPatch,
  buildOwnerPatch,
  buildStaffPatch,
  buildVendorPatch,
  profileToEditForm,
} from "../utils/restaurantDetailForm";
import {
  getRegistrationStatus,
  getRestaurantDisplayName,
} from "../utils/restaurantProfileDisplay";
import { adminRoutes } from "../../utils/routes";

const REVIEW_STATUSES = new Set(["submitted", "pending"]);

const AdminRestaurantDetailPage = () => {
  const { clientId } = useParams();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingVendor, setRefreshingVendor] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getRestaurantSupportProfile(Number(clientId));
      setProfile(data);
      setForm(profileToEditForm(data));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load restaurant profile.");
      setProfile(null);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const basicInfo = profile?.basicInfo || {};
  const restaurantName = getRestaurantDisplayName(profile);
  const status = getRegistrationStatus(profile);
  const logoUrl = basicInfo.logoUrl || profile?.verification?.logoUrl;

  const cancelEdit = () => {
    setForm(profileToEditForm(profile));
    setEditSection(null);
    setError("");
  };

  const applyPatch = async (payload, message) => {
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      await updateRestaurantSupportProfile(Number(clientId), payload);
      setSuccessMessage(message);
      setEditSection(null);
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = (nextStatus) =>
    applyPatch({ status: nextStatus }, `Registration marked as ${nextStatus}.`);

  const handleSaveOperational = () =>
    applyPatch({ isActive: form.isActive }, "Restaurant open status updated.");

  const handleSaveBasicInfo = () =>
    applyPatch(buildBasicInfoPatch(form), "Basic info updated.");

  const handleSaveOwner = () => applyPatch(buildOwnerPatch(form), "Owner details updated.");

  const handleSaveStaff = () => applyPatch(buildStaffPatch(form.staff), "Staff updated.");

  const handleSaveVendor = () => applyPatch(buildVendorPatch(form), "Vendor payout account updated.");

  const handleUploadDocuments = async (files) => {
    setUploadingDocuments(true);
    setError("");
    setSuccessMessage("");
    try {
      await uploadRestaurantDocuments(Number(clientId), files);
      setSuccessMessage("Documents uploaded successfully.");
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload documents.");
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleRefreshVendor = async () => {
    setRefreshingVendor(true);
    setError("");
    setSuccessMessage("");
    try {
      await updateRestaurantSupportProfile(Number(clientId), { refreshVendor: true });
      setSuccessMessage("Vendor status refreshed from Cashfree.");
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Could not refresh vendor status.");
    } finally {
      setRefreshingVendor(false);
    }
  };

  const handleTopLevelChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleBasicChange = (field, value) => {
    setForm((current) => ({
      ...current,
      basicInfo: { ...current.basicInfo, [field]: value },
    }));
  };

  const handleOwnerChange = (field, value) => {
    setForm((current) => ({
      ...current,
      owner: { ...current.owner, [field]: value },
    }));
  };

  const handleVendorChange = (field, value) => {
    setForm((current) => ({
      ...current,
      vendor: { ...current.vendor, [field]: value },
    }));
  };

  const handleStaffChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      staff: current.staff.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  const SectionActions = ({ section, onSave, extraActions }) => {
    const isEditing = editSection === section;
    if (isEditing) {
      return (
        <div className="admin-section__actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary admin-btn--small"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--small"
            disabled={saving}
            onClick={cancelEdit}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="admin-section__actions">
        <button
          type="button"
          className="admin-btn admin-btn--ghost admin-btn--small"
          onClick={() => {
            setForm(profileToEditForm(profile));
            setEditSection(section);
          }}
        >
          Edit
        </button>
        {extraActions}
      </div>
    );
  };

  if (loading) {
    return <p className="admin-empty">Loading restaurant…</p>;
  }

  if (!profile || !form || profile.found === false) {
    return (
      <>
        <header className="admin-header">
          <div>
            <h1>Restaurant not found</h1>
            <p>Client ID {clientId}</p>
          </div>
          <Link to={adminRoutes.hotels} className="admin-btn admin-btn--ghost">
            ← Back to list
          </Link>
        </header>
        {error && <div className="admin-error">{error}</div>}
      </>
    );
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <p className="admin-card__hint" style={{ marginBottom: "0.35rem" }}>
            <Link to={adminRoutes.hotels}>Hotels & restaurants</Link> / Client {clientId}
          </p>
          <h1>{restaurantName}</h1>
          {logoUrl && (
            <img src={logoUrl} alt="" className="admin-venue-logo admin-venue-logo--header" />
          )}
          <p>Full venue profile for support and admin updates.</p>
        </div>
        <div className="admin-action-row">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={loadProfile}>
            Refresh
          </button>
          <Link to={adminRoutes.hotels} className="admin-btn admin-btn--ghost">
            ← Back to list
          </Link>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      <div className="admin-restaurant-detail">
        <VerificationSection
          verification={profile.verification}
          operational={profile.operational}
          basicInfo={basicInfo}
          editing={editSection === "operational"}
          form={form}
          onFieldChange={handleTopLevelChange}
          actions={
            <SectionActions
              section="operational"
              onSave={handleSaveOperational}
              extraActions={
                REVIEW_STATUSES.has(status) && (
                  <>
                    <button
                      type="button"
                      className="admin-btn admin-btn--green admin-btn--small"
                      disabled={saving}
                      onClick={() => handleStatusUpdate("approved")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--small"
                      disabled={saving}
                      onClick={() => handleStatusUpdate("rejected")}
                    >
                      Reject
                    </button>
                  </>
                )
              }
            />
          }
        />

        <BasicInfoSection
          basicInfo={basicInfo}
          verification={profile.verification}
          editing={editSection === "basicInfo"}
          form={form}
          onBasicChange={handleBasicChange}
          actions={<SectionActions section="basicInfo" onSave={handleSaveBasicInfo} />}
        />

        <RestaurantDocumentsSection
          basicInfo={basicInfo}
          verification={profile.verification}
          uploading={uploadingDocuments}
          onUpload={handleUploadDocuments}
        />

        <OwnerSection
          owner={profile.owner}
          editing={editSection === "owner"}
          form={form}
          onOwnerChange={handleOwnerChange}
          actions={<SectionActions section="owner" onSave={handleSaveOwner} />}
        />

        <ContactsSection
          contacts={profile.contacts}
          editing={editSection === "staff"}
          form={form}
          onStaffChange={handleStaffChange}
          actions={
            (profile.contacts?.length > 0 || form.staff?.length > 0) ? (
              <SectionActions section="staff" onSave={handleSaveStaff} />
            ) : null
          }
        />

        <VendorSection
          vendor={profile.vendor}
          editing={editSection === "vendor"}
          form={form}
          onVendorChange={handleVendorChange}
          actions={
            <SectionActions
              section="vendor"
              onSave={handleSaveVendor}
              extraActions={
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--small"
                  disabled={refreshingVendor}
                  onClick={handleRefreshVendor}
                >
                  {refreshingVendor ? "Refreshing…" : "Refresh from Cashfree"}
                </button>
              }
            />
          }
        />

        <SubscriptionsSection subscriptions={profile.subscriptions} />
        <QrCodesSection qrCodes={profile.qrCodes} />
        <BillExtraChargesSection billExtraCharges={profile.billExtraCharges} />
        <MenuSection menu={profile.menu} />
      </div>
    </>
  );
};

export default AdminRestaurantDetailPage;
