export const RESTAURANT_DOCUMENT_FIELDS = [
  {
    field: "logo",
    label: "Logo",
    getUrl: (basicInfo, verification) => basicInfo?.logoUrl || verification?.logoUrl,
  },
  {
    field: "fssaiPhoto",
    label: "FSSAI photo",
    getUrl: (basicInfo) => basicInfo?.fssaiPhotoUrl,
  },
  {
    field: "aadharPhoto",
    label: "Aadhar photo",
    getUrl: (basicInfo) => basicInfo?.aadharPhotoUrl,
  },
  {
    field: "panPhoto",
    label: "PAN photo",
    getUrl: (basicInfo) => basicInfo?.panPhotoUrl,
  },
  {
    field: "gstPhoto",
    label: "GST photo",
    getUrl: (basicInfo) => basicInfo?.gstPhotoUrl,
  },
];
