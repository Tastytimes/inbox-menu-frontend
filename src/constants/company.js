import { BRAND_EMAIL, BRAND_NAME } from "./brand";

/** Registered legal entity — must match Cashfree / GST / PAN records exactly. */
export const COMPANY_LEGAL_NAME =
  process.env.REACT_APP_COMPANY_LEGAL_NAME || `${BRAND_NAME} Technologies Private Limited`;

export const COMPANY_ADDRESS =
  process.env.REACT_APP_COMPANY_ADDRESS ||
  "No. 123, Example Tech Park, Koramangala, Bengaluru, Karnataka 560034, India";

export const COMPANY_PHONE =
  process.env.REACT_APP_COMPANY_PHONE || "+91 98765 43210";

export const COMPANY_GST = process.env.REACT_APP_COMPANY_GST || "";

export const COMPANY_CIN = process.env.REACT_APP_COMPANY_CIN || "";

export const COMPANY_SUPPORT_EMAIL = process.env.REACT_APP_COMPANY_SUPPORT_EMAIL || BRAND_EMAIL;

export const COMPANY_WEBSITE =
  process.env.REACT_APP_COMPANY_WEBSITE || "https://sambhrama.com";
