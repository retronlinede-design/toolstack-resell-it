export const MAX_LEGACY_PROOF_IMAGE_BYTES = 250 * 1024;
export const DEFAULT_CLASSIFICATION = "Unsure / Review Later";
export const DEFAULT_EBAY_FEE_MODE = "Private Germany";
export const DEFAULT_LISTING_LANGUAGE = "German";
export const DEFAULT_LANGUAGE = "de";
export const CURRENT_DATE = new Date().toISOString().slice(0, 10);
export const CURRENT_MONTH = new Date().toISOString().slice(0, 7);
export const CURRENT_YEAR = new Date().getFullYear().toString();

export const classificationOptions = [
  "Private Sale / Personal Collection",
  "Business Stock / Resale Inventory",
  "Legacy Stock / Previous Business",
  DEFAULT_CLASSIFICATION,
];

export const ebayFeeModes = ["Private Germany", "Business Estimate", "Manual"];

export const buyerPlatformOptions = [
  ["ebay", "eBay"],
  ["kleinanzeigen", "Kleinanzeigen"],
  ["private", "Private"],
  ["facebook", "Facebook"],
  ["vinted", "Vinted"],
  ["other", "Other"],
];

export const conditionGradeOptions = ["Neu", "Sehr gut", "Gut", "Akzeptabel", "Defekt / Ersatzteile", "Sonstiges"];

export const languageOptions = [
  ["de", "German"],
  ["en", "English"],
];

export const testedStatusOptions = ["Not specified", "Tested working", "Partially tested", "Not tested", "Defective / repair needed"];

export const photoChecklistItems = [
  ["front", "Front photo"],
  ["back", "Back photo"],
  ["sides", "Side photos"],
  ["topBottom", "Top/bottom photo"],
  ["serialModel", "Serial/model number photo"],
  ["defects", "Defects photo"],
  ["accessories", "Accessories photo"],
  ["packaging", "Packaging photo"],
];

export const defectDisclosureItems = [
  ["scratches", "scratches"],
  ["dents", "dents"],
  ["cracks", "cracks"],
  ["discoloration", "discoloration"],
  ["missingParts", "missing parts"],
  ["notTested", "not tested"],
  ["partiallyWorking", "partially working"],
  ["repairNeeded", "repair needed"],
  ["other", "other"],
];

export const defaultPhotoChecklist = Object.fromEntries(photoChecklistItems.map(([key]) => [key, false]));
export const defaultDefectDisclosure = Object.fromEntries(defectDisclosureItems.map(([key]) => [key, false]));

export const proofTypes = ["Shop receipt", "Invoice", "Eigenbeleg", "Flea-market photo", "Private seller note", "Other"];
export const statusOptions = ["Draft", "Sourced", "Ready to List", "Listed", "Sold", "Paid", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned", "Refunded", "Written Off"];
export const quickStatusOptions = ["Ready to List", "Listed", "Sold", "Paid", "Ready to Pack", "Packed", "Shipped", "Completed", "Refunded"];
export const shippingWorkflowStatuses = ["Sold", "Paid", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned", "Refunded"];
export const soldStatusOptions = ["Sold", "Paid", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned", "Refunded"];
export const legacyStatusLabels = { "Written off": "Written Off", "Kept private": "Completed" };

export const expenseCategories = ["Packaging", "Shipping supplies", "Fuel / travel", "Flea-market fees", "Storage", "Office supplies", "Platform/service costs", "Other"];
export const researchConfidenceOptions = ["low", "medium", "high"];

export const emptyItem = {
  name: "",
  category: "",
  classification: DEFAULT_CLASSIFICATION,
  sourceType: "Flea market",
  sourceName: "",
  sourceLocation: "",
  purchaseDate: CURRENT_DATE,
  purchasePrice: "",
  hasReceipt: "No",
  receiptType: "Eigenbeleg needed",
  paymentMethod: "Cash",
  expectedSalePrice: "",
  status: "Sourced",
  ebayTitle: "",
  saleDate: "",
  salePrice: "",
  finalSalePrice: "",
  buyerPlatform: "ebay",
  shippingChargedToBuyer: "",
  actualShippingCost: "",
  packagingCost: "",
  carrier: "DHL",
  trackingNumber: "",
  shippedDate: "",
  trackingNotes: "",
  refundAmount: "",
  refundDate: "",
  returnPostageCost: "",
  refundReason: "",
  ebayFees: "",
  ebayFeeMode: DEFAULT_EBAY_FEE_MODE,
  feePercent: "",
  fixedFee: "",
  estimatedEbayFee: "",
  manualEbayFee: "",
  promotedListingFee: "",
  otherPlatformFees: "",
  shippingCost: "",
  proofType: "Eigenbeleg",
  proofDate: CURRENT_DATE,
  proofAmount: "",
  proofNotes: "",
  noReceiptReason: "",
  proofImageDataUrl: "",
  proofImageName: "",
  proofFileName: "",
  proofFolderLocation: "",
  proofStoredExternally: "No",
  researchQuery: "",
  researchedLowPrice: "",
  researchedMidPrice: "",
  researchedHighPrice: "",
  chosenListingPrice: "",
  priceResearchNotes: "",
  priceResearchUpdatedAt: "",
  language: DEFAULT_LANGUAGE,
  listingLanguage: DEFAULT_LISTING_LANGUAGE,
  listingTitle: "",
  ebay: {
    conditionText: "",
  },
  brand: "",
  model: "",
  sizeSpecs: "",
  measurements: "",
  colour: "",
  productDescriptionText: "",
  compatibilityInfo: "",
  keyFeatures: "",
  conditionGrade: "",
  conditionText: "",
  conditionNotes: "",
  defectDisclosure: defaultDefectDisclosure,
  descriptionText: "",
  htmlDescription: "",
  generatedPlainDescription: "",
  generatedHtmlDescription: "",
  includedItems: "",
  includedAccessories: "",
  defectsNotes: "",
  testedStatus: "Not specified",
  shippingNotes: "",
  photoChecklist: defaultPhotoChecklist,
  priceResearchLow: "",
  priceResearchMid: "",
  priceResearchHigh: "",
  researchBrand: "",
  researchModel: "",
  researchReference: "",
  researchYear: "",
  researchEAN: "",
  researchSerial: "",
  researchNotes: "",
  suggestedListingPrice: "",
  minimumAcceptPrice: "",
  researchConfidence: "low",
  notes: "",
};

export const emptyExpense = {
  date: CURRENT_DATE,
  category: "Packaging",
  description: "",
  amount: "",
  paymentMethod: "Cash",
  receiptAvailable: "No",
  receiptNotes: "",
  linkedItemId: "",
};

export const defaultItem = emptyItem;

export function number(value) {
  return Number(String(value || "0").replace(",", ".")) || 0;
}

export function inMonth(date, month = CURRENT_MONTH) {
  return String(date || "").startsWith(month);
}

export function inYear(date, year = CURRENT_YEAR) {
  return String(date || "").startsWith(year);
}

export function itemClassification(item) {
  return item.classification || DEFAULT_CLASSIFICATION;
}

export function normalizeListingLanguageValue(item) {
  const rawLanguage = String(item?.language || "").trim().toLowerCase();
  if (rawLanguage === "en" || rawLanguage === "english") return "en";
  if (rawLanguage === "de" || rawLanguage === "german" || rawLanguage === "deutsch") return "de";
  const legacyLanguage = String(item?.listingLanguage || "").trim().toLowerCase();
  if (legacyLanguage === "english" || legacyLanguage === "en") return "en";
  return DEFAULT_LANGUAGE;
}

export function languageLabel(value) {
  return value === "en" ? "English" : "German";
}

export function normalizeBooleanRecord(value, defaults) {
  if (Array.isArray(value)) {
    return {
      ...defaults,
      ...Object.fromEntries(value.map((key) => [key, true])),
    };
  }
  if (!value || typeof value !== "object") return { ...defaults };
  return Object.fromEntries(Object.keys(defaults).map((key) => [key, Boolean(value[key])]));
}

export function isLegacyProofImageTooLarge(value) {
  return String(value || "").length > MAX_LEGACY_PROOF_IMAGE_BYTES;
}

export function buyerPlatformLabel(value) {
  return buyerPlatformOptions.find(([key]) => key === value)?.[1] || "eBay";
}

export function ebayConditionText(item) {
  return String(item?.ebay?.conditionText ?? item?.conditionText ?? "");
}

export function normalizeItem(item) {
  const next = { ...emptyItem, ...item };
  const hasLegacyFee = Boolean(next.ebayFees) && !next.manualEbayFee;
  const hasExplicitFeeMode = Boolean(item?.ebayFeeMode);
  next.language = normalizeListingLanguageValue(next);
  next.listingLanguage = languageLabel(next.language);
  next.measurements = next.measurements || next.sizeSpecs || "";
  next.sizeSpecs = next.sizeSpecs || next.measurements || "";
  next.includedAccessories = next.includedAccessories || next.includedItems || "";
  next.includedItems = next.includedItems || next.includedAccessories || "";
  next.priceResearchLow = next.priceResearchLow || next.researchedLowPrice || "";
  next.priceResearchMid = next.priceResearchMid || next.researchedMidPrice || "";
  next.priceResearchHigh = next.priceResearchHigh || next.researchedHighPrice || "";
  next.researchedLowPrice = next.researchedLowPrice || next.priceResearchLow || "";
  next.researchedMidPrice = next.researchedMidPrice || next.priceResearchMid || "";
  next.researchedHighPrice = next.researchedHighPrice || next.priceResearchHigh || "";
  next.researchBrand = next.researchBrand || next.brand || "";
  next.researchModel = next.researchModel || next.model || "";
  next.researchNotes = next.researchNotes || next.priceResearchNotes || "";
  next.suggestedListingPrice = next.suggestedListingPrice || next.chosenListingPrice || "";
  next.minimumAcceptPrice = next.minimumAcceptPrice || "";
  next.researchConfidence = researchConfidenceOptions.includes(next.researchConfidence) ? next.researchConfidence : "low";
  next.generatedPlainDescription = next.generatedPlainDescription || next.descriptionText || "";
  next.generatedHtmlDescription = next.generatedHtmlDescription || next.htmlDescription || "";
  next.descriptionText = next.descriptionText || next.generatedPlainDescription || "";
  next.htmlDescription = next.htmlDescription || next.generatedHtmlDescription || "";
  next.ebay = {
    ...emptyItem.ebay,
    ...(next.ebay && typeof next.ebay === "object" ? next.ebay : {}),
  };
  if (!String(next.ebay.conditionText || "").trim() && String(next.conditionText || "").trim()) {
    next.ebay.conditionText = next.conditionText;
  }
  next.photoChecklist = normalizeBooleanRecord(next.photoChecklist, defaultPhotoChecklist);
  next.defectDisclosure = normalizeBooleanRecord(next.defectDisclosure, defaultDefectDisclosure);
  next.testedStatus = next.testedStatus || "Not specified";
  if (hasLegacyFee && (!hasExplicitFeeMode || next.ebayFeeMode === DEFAULT_EBAY_FEE_MODE)) next.ebayFeeMode = "Legacy";
  if (isLegacyProofImageTooLarge(next.proofImageDataUrl)) {
    next.proofImageDataUrl = "";
    next.proofImageName = "";
    next.proofNotes = [next.proofNotes, "Legacy proof image was too large for browser storage and was removed during import/normalization."].filter(Boolean).join("\n");
  }
  if (!buyerPlatformOptions.some(([key]) => key === next.buyerPlatform)) next.buyerPlatform = "ebay";
  if (!soldStatusOptions.includes(next.status) && legacyStatusLabels[next.status]) next.status = legacyStatusLabels[next.status];
  return next;
}

export function normalizeItems(items) {
  return Array.isArray(items) ? items.map(normalizeItem) : [];
}
