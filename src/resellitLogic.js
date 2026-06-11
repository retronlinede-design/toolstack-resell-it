export const MAX_LEGACY_PROOF_IMAGE_BYTES = 250 * 1024;
export const DEFAULT_CLASSIFICATION = "Unsure / Review Later";
export const DEFAULT_EBAY_FEE_MODE = "Private Germany";
export const DEFAULT_LISTING_LANGUAGE = "German";
export const DEFAULT_LANGUAGE = "de";

export const buyerPlatformOptions = [
  ["ebay", "eBay"],
  ["kleinanzeigen", "Kleinanzeigen"],
  ["private", "Private"],
  ["facebook", "Facebook"],
  ["vinted", "Vinted"],
  ["other", "Other"],
];

export const researchConfidenceOptions = ["low", "medium", "high"];

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

export const legacyStatusLabels = { "Written off": "Written Off", "Kept private": "Completed" };
export const soldStatusOptions = ["Sold", "Paid", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned", "Refunded"];

export const emptyItem = {
  name: "",
  category: "",
  classification: DEFAULT_CLASSIFICATION,
  sourceType: "Flea market",
  sourceName: "",
  sourceLocation: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
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
  proofDate: new Date().toISOString().slice(0, 10),
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

export function number(value) {
  return Number(String(value || "0").replace(",", ".")) || 0;
}

export function inMonth(date, month) {
  return String(date || "").startsWith(month);
}

export function inYear(date, year) {
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

export function finalSaleValue(item) {
  return number(item.finalSalePrice || item.salePrice);
}

export function shippingChargedValue(item) {
  return number(item.shippingChargedToBuyer);
}

export function actualShippingValue(item) {
  return number(item.actualShippingCost || item.shippingCost);
}

export function packagingCostValue(item) {
  return number(item.packagingCost);
}

export function refundValue(item) {
  return number(item.refundAmount) + number(item.returnPostageCost);
}

export function ebayBaseFee(item) {
  const grossSale = finalSaleValue(item) + shippingChargedValue(item);
  const mode = item.ebayFeeMode || (item.ebayFees ? "Legacy" : DEFAULT_EBAY_FEE_MODE);

  if (mode === "Manual") return number(item.manualEbayFee || item.ebayFees);
  if (mode === "Business Estimate") return (grossSale * number(item.feePercent)) / 100 + number(item.fixedFee);
  if (mode === "Legacy") return number(item.ebayFees);
  return 0;
}

export function platformFees(item) {
  return ebayBaseFee(item) + number(item.promotedListingFee) + number(item.otherPlatformFees);
}

export function itemProfitValue(item) {
  return finalSaleValue(item) + shippingChargedValue(item) - number(item.purchasePrice) - platformFees(item) - actualShippingValue(item) - packagingCostValue(item) - refundValue(item);
}

export function itemStatus(item) {
  return legacyStatusLabels[item.status] || item.status || "Draft";
}

export function hasListingDraft(item) {
  return Boolean(item.listingTitle || item.ebayTitle || item.conditionText || item.generatedPlainDescription || item.descriptionText || item.generatedHtmlDescription || item.htmlDescription);
}

export function isSoldStatus(item) {
  return soldStatusOptions.includes(itemStatus(item)) || finalSaleValue(item) > 0;
}

export function sanitizeHtmlPreview(value) {
  return String(value || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, " $1=\"#\"");
}

export function isFullBackupPayload(parsed) {
  return (parsed?.type === "RESELLERIT_BACKUP" || parsed?.type === "RESELLIT_BACKUP") && Array.isArray(parsed?.items) && Array.isArray(parsed?.expenses);
}

export function summarizeSoldPerformance(items) {
  const soldItems = items.filter(isSoldStatus);
  return {
    salesTotal: soldItems.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0),
    feesTotal: soldItems.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0),
    profit: soldItems.reduce((sum, item) => sum + itemProfitValue(item), 0),
    sold: soldItems.length,
  };
}

export function duplicateItemForDraft(item, id) {
  return {
    ...emptyItem,
    ...item,
    id,
    name: `${item.name} copy`,
    status: "Draft",
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
    shippingNotes: "",
    importedAt: undefined,
  };
}

export function markListingNeeded(item) {
  return { ...item, listingTitle: "", ebayTitle: "", conditionText: "", descriptionText: "", htmlDescription: "", generatedPlainDescription: "", generatedHtmlDescription: "" };
}
