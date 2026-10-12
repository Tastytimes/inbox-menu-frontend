const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromDatetimeLocalValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const profileToEditForm = (data) => {
  const basic = data?.basicInfo || {};
  const owner = data?.owner || {};
  const vendor = data?.vendor || {};
  const businessTypes = basic.businessType || basic.businessTypes || [];

  return {
    isActive: Boolean(data?.operational?.isActive ?? basic.isActive),
    basicInfo: {
      restaurantName: basic.restaurantName || "",
      restaurantAddress: basic.restaurantAddress || basic.address || "",
      city: basic.city || "",
      state: basic.state || "",
      zipCode: basic.zipCode || "",
      businessType: [...businessTypes],
      logoUrl: basic.logoUrl || data?.verification?.logoUrl || "",
      fssaiNumber: basic.fssaiNumber || "",
      aadharNumber: basic.aadharNumber || "",
      panNumber: basic.panNumber || "",
      gstNumber: basic.gstNumber || "",
    },
    owner: {
      name: owner.name || "",
      email: owner.email || "",
      phone: owner.phone || "",
      isActive: Boolean(owner.isActive),
    },
    vendor: {
      bankAccountNumber: "",
      bankAccountHolder: vendor.bankAccountHolder || "",
      bankIfsc: vendor.bankIfsc || "",
      panNumber: vendor.panNumber || "",
      gstNumber: vendor.gstNumber || "",
    },
    staff: (data?.contacts || []).map((contact) => ({
      userId: contact.userId ?? contact.id,
      name: contact.name || "",
      isActive: Boolean(contact.isActive),
    })),
    payout: {
      status: basic.status || data?.operational?.registrationStatus || "submitted",
      payoutMode: basic.payoutMode || "manual",
      easebuzzApplicationStatus: basic.easebuzzApplicationStatus || "not_applied",
      easebuzzMerchantCategory: basic.easebuzzMerchantCategory || "retail",
      easebuzzKey: basic.easebuzzKey || "",
      easebuzzSalt: "",
      easebuzzSaltSaved: Boolean(basic.easebuzzSaltSaved),
      easebuzzMerchantId: basic.easebuzzMerchantId || "",
      bankAccountNumber: "",
      bankAccountLast4: basic.bankAccountLast4 || "",
      bankIfsc: basic.bankIfsc || "",
      bankAccountHolder: basic.bankAccountHolder || "",
      setupFeeAmount:
        basic.setupFeeAmount != null && basic.setupFeeAmount !== ""
          ? String(basic.setupFeeAmount)
          : "",
      setupFeeStatus: basic.setupFeeStatus || "pending",
      setupFeeExpiresAt: toDatetimeLocalValue(basic.setupFeeExpiresAt),
      setupFeePaidAt: toDatetimeLocalValue(basic.setupFeePaidAt),
    },
  };
};

export const buildBasicInfoPatch = (form) => ({
  basicInfo: {
    restaurantName: form.basicInfo.restaurantName.trim(),
    restaurantAddress: form.basicInfo.restaurantAddress.trim(),
    city: form.basicInfo.city.trim(),
    state: form.basicInfo.state.trim(),
    zipCode: form.basicInfo.zipCode.trim() || undefined,
    businessType: form.basicInfo.businessType || [],
    logoUrl: form.basicInfo.logoUrl.trim() || undefined,
    fssaiNumber: form.basicInfo.fssaiNumber.trim() || undefined,
    aadharNumber: form.basicInfo.aadharNumber.trim() || undefined,
    panNumber: form.basicInfo.panNumber.trim() || undefined,
    gstNumber: form.basicInfo.gstNumber.trim() || undefined,
  },
});

export const buildOwnerPatch = (form) => ({
  owner: {
    name: form.owner.name.trim(),
    email: form.owner.email.trim(),
    phone: form.owner.phone.trim(),
    isActive: form.owner.isActive,
  },
});

export const buildVendorPatch = (form) => {
  const vendor = {};
  const fields = form.vendor;
  if (fields.bankAccountNumber.trim()) vendor.bankAccountNumber = fields.bankAccountNumber.trim();
  if (fields.bankAccountHolder.trim()) vendor.bankAccountHolder = fields.bankAccountHolder.trim();
  if (fields.bankIfsc.trim()) vendor.bankIfsc = fields.bankIfsc.trim();
  if (fields.panNumber.trim()) vendor.panNumber = fields.panNumber.trim();
  if (fields.gstNumber.trim()) vendor.gstNumber = fields.gstNumber.trim();
  return { vendor };
};

export const buildPayoutPatch = (form, currentStatus) => {
  const fields = form.payout;
  const payout = {
    payoutMode: fields.payoutMode,
    easebuzzApplicationStatus: fields.easebuzzApplicationStatus,
    easebuzzMerchantCategory: fields.easebuzzMerchantCategory,
  };

  if (fields.easebuzzKey.trim()) payout.easebuzzKey = fields.easebuzzKey.trim();
  if (fields.easebuzzSalt.trim()) payout.easebuzzSalt = fields.easebuzzSalt.trim();
  if (fields.easebuzzMerchantId.trim()) payout.easebuzzMerchantId = fields.easebuzzMerchantId.trim();
  if (fields.bankAccountNumber.trim()) payout.bankAccountNumber = fields.bankAccountNumber.trim();
  if (fields.bankIfsc.trim()) payout.bankIfsc = fields.bankIfsc.trim();
  if (fields.bankAccountHolder.trim()) payout.bankAccountHolder = fields.bankAccountHolder.trim();

  const setupFeeAmount = fields.setupFeeAmount === "" ? null : Number(fields.setupFeeAmount);
  payout.setupFeeAmount = Number.isFinite(setupFeeAmount) ? setupFeeAmount : null;
  payout.setupFeeStatus = fields.setupFeeStatus || "pending";
  payout.setupFeeExpiresAt = fromDatetimeLocalValue(fields.setupFeeExpiresAt);
  payout.setupFeePaidAt =
    fromDatetimeLocalValue(fields.setupFeePaidAt) ||
    (fields.setupFeeStatus === "paid" ? new Date().toISOString() : null);

  const payload = { payout };
  if (fields.status && fields.status !== currentStatus) {
    payload.status = fields.status;
  }
  return payload;
};

export const buildStaffPatch = (staff) => ({
  staff: staff.map((member) => ({
    userId: member.userId,
    name: member.name.trim(),
    isActive: member.isActive,
  })),
});
