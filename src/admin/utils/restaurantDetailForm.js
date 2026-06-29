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

export const buildStaffPatch = (staff) => ({
  staff: staff.map((member) => ({
    userId: member.userId,
    name: member.name.trim(),
    isActive: member.isActive,
  })),
});
