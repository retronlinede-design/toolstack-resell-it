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

export const sellerClassificationOptions = [
  ["private", "Private Sale"],
  ["pre_registration", "Pre-Registration Stock"],
  ["business", "Business Stock"],
  ["excluded", "Excluded"],
];
export const sellerClassificationValues = sellerClassificationOptions.map(([value]) => value);

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
export const purchaseRecordTypeOptions = ["Single item", "Bulk lot item", "Source session allocation", "Retail purchase", "Online marketplace", "Other"];
export const sellerTypeOptions = ["Private seller", "Business seller", "Retail store", "Marketplace seller", "Unknown"];
export const receiptStatusOptions = ["Receipt available", "No receipt", "Eigenbeleg needed", "External proof recorded", "Missing proof"];
export const evidenceTypeOptions = ["Receipt", "Invoice", "Eigenbeleg", "Seller message", "Marketplace listing screenshot", "Flea market photo", "Bank/payment record", "Cash withdrawal reference", "Transport receipt", "Other"];
export const evidenceStatusOptions = ["Available", "External reference", "Needs review", "Missing", "Archived"];
export const evidenceStorageTypeOptions = ["metadata_only", "indexeddb", "external_path", "external_url"];
export const eigenbelegStatusOptions = ["Not needed", "Draft", "Generated", "Reviewed", "Final"];
export const eigenbelegGenerationTypeOptions = ["item", "source_session", "selected_items"];

export const emptyItem = {
  name: "",
  category: "",
  classification: DEFAULT_CLASSIFICATION,
  sellerClassification: "private",
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

export const emptyPurchaseRecord = {
  id: "",
  itemId: "",
  sourceSessionId: "",
  purchaseDate: CURRENT_DATE,
  purchaseType: "Single item",
  sellerName: "",
  sellerType: "Unknown",
  sourceName: "",
  sourceLocation: "",
  sourcePlatform: "",
  grossPurchasePrice: "",
  allocatedPurchaseCost: "",
  currency: "EUR",
  paymentMethod: "Cash",
  receiptStatus: "Eigenbeleg needed",
  proofStatus: "Missing proof",
  evidenceIds: [],
  notes: "",
  migratedFromLegacyItem: false,
  createdAt: "",
  updatedAt: "",
};

export const emptyEvidenceRecord = {
  id: "",
  itemId: "",
  purchaseRecordId: "",
  sourceSessionId: "",
  expenseId: "",
  ebayTransactionId: "",
  evidenceType: "Receipt",
  evidenceStatus: "Missing",
  title: "",
  documentDate: "",
  issuer: "",
  amount: "",
  currency: "EUR",
  storageType: "metadata_only",
  fileName: "",
  mimeType: "",
  fileSize: "",
  indexedDbBlobKey: "",
  externalPath: "",
  externalUrl: "",
  notes: "",
  migratedFromLegacyItem: false,
  createdAt: "",
  updatedAt: "",
};

export const emptyEigenbeleg = {
  id: "",
  itemId: "",
  purchaseRecordId: "",
  sourceSessionId: "",
  language: DEFAULT_LANGUAGE,
  generationType: "item",
  sellerDescription: "",
  acquisitionDescription: "",
  reasonNoReceipt: "",
  purchaseDate: CURRENT_DATE,
  amount: "",
  currency: "EUR",
  paymentMethod: "Cash",
  evidenceIds: [],
  generatedText: "",
  generatedHtml: "",
  pdfEvidenceId: "",
  status: "Draft",
  finalizedAt: "",
  migratedFromLegacyItem: false,
  createdAt: "",
  updatedAt: "",
};

export const defaultItem = emptyItem;
export const defaultPurchaseRecord = emptyPurchaseRecord;
export const defaultEvidenceRecord = emptyEvidenceRecord;
export const defaultEigenbeleg = emptyEigenbeleg;

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

export function sellerClassificationLabel(value) {
  return sellerClassificationOptions.find(([key]) => key === value)?.[1] || "Private Sale";
}

export function isBusinessRelevant(item) {
  const normalized = normalizeItem(item);
  return normalized.sellerClassification === "pre_registration" || normalized.sellerClassification === "business";
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

export function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry || "").trim()).filter(Boolean);
}

function optionOrDefault(value, options, fallback) {
  return options.includes(value) ? value : fallback;
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
  next.sellerClassification = sellerClassificationValues.includes(next.sellerClassification) ? next.sellerClassification : "private";
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

export function normalizeRootAppData(data, fallbackItems = []) {
  const parsed = data && typeof data === "object" ? data : {};
  return {
    version: Number(parsed.version) || 2,
    items: Array.isArray(parsed.items) ? normalizeItems(parsed.items) : normalizeItems(fallbackItems),
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    purchaseRecords: normalizePurchaseRecords(parsed.purchaseRecords),
    evidenceRecords: normalizeEvidenceRecords(parsed.evidenceRecords),
    updatedAt: String(parsed.updatedAt || ""),
  };
}

export function normalizePurchaseRecord(record) {
  const next = { ...emptyPurchaseRecord, ...(record && typeof record === "object" ? record : {}) };
  next.id = String(next.id || "");
  next.itemId = String(next.itemId || "");
  next.sourceSessionId = String(next.sourceSessionId || "");
  next.purchaseDate = String(next.purchaseDate || CURRENT_DATE);
  next.purchaseType = optionOrDefault(next.purchaseType, purchaseRecordTypeOptions, emptyPurchaseRecord.purchaseType);
  next.sellerName = String(next.sellerName || "");
  next.sellerType = optionOrDefault(next.sellerType, sellerTypeOptions, emptyPurchaseRecord.sellerType);
  next.sourceName = String(next.sourceName || "");
  next.sourceLocation = String(next.sourceLocation || "");
  next.sourcePlatform = String(next.sourcePlatform || "");
  next.grossPurchasePrice = String(next.grossPurchasePrice || "");
  next.allocatedPurchaseCost = String(next.allocatedPurchaseCost || next.grossPurchasePrice || "");
  next.currency = String(next.currency || "EUR").toUpperCase();
  next.paymentMethod = String(next.paymentMethod || emptyPurchaseRecord.paymentMethod);
  next.receiptStatus = optionOrDefault(next.receiptStatus, receiptStatusOptions, emptyPurchaseRecord.receiptStatus);
  next.proofStatus = optionOrDefault(next.proofStatus, receiptStatusOptions, next.receiptStatus);
  next.evidenceIds = normalizeStringArray(next.evidenceIds);
  next.notes = String(next.notes || "");
  next.migratedFromLegacyItem = Boolean(next.migratedFromLegacyItem);
  next.createdAt = String(next.createdAt || "");
  next.updatedAt = String(next.updatedAt || "");
  return next;
}

export function normalizePurchaseRecords(records) {
  return Array.isArray(records) ? records.map(normalizePurchaseRecord) : [];
}

export function validatePurchaseRecord(record) {
  const next = normalizePurchaseRecord(record);
  const errors = [];
  if (!next.itemId) errors.push("itemId is required");
  if (!next.purchaseDate) errors.push("purchaseDate is required");
  if (!next.purchaseType) errors.push("purchaseType is required");
  if (!next.paymentMethod) errors.push("paymentMethod is required");
  if (!next.receiptStatus) errors.push("receiptStatus is required");
  if (!next.grossPurchasePrice && !next.allocatedPurchaseCost) errors.push("grossPurchasePrice or allocatedPurchaseCost is required");
  return errors;
}

export function isValidPurchaseRecord(record) {
  return validatePurchaseRecord(record).length === 0;
}

export function normalizeEvidenceRecord(record) {
  const next = { ...emptyEvidenceRecord, ...(record && typeof record === "object" ? record : {}) };
  next.id = String(next.id || "");
  next.itemId = String(next.itemId || "");
  next.purchaseRecordId = String(next.purchaseRecordId || "");
  next.sourceSessionId = String(next.sourceSessionId || "");
  next.expenseId = String(next.expenseId || "");
  next.ebayTransactionId = String(next.ebayTransactionId || "");
  next.evidenceType = optionOrDefault(next.evidenceType, evidenceTypeOptions, emptyEvidenceRecord.evidenceType);
  next.evidenceStatus = optionOrDefault(next.evidenceStatus, evidenceStatusOptions, emptyEvidenceRecord.evidenceStatus);
  next.title = String(next.title || "");
  next.documentDate = String(next.documentDate || "");
  next.issuer = String(next.issuer || "");
  next.amount = String(next.amount || "");
  next.currency = String(next.currency || "EUR").toUpperCase();
  next.storageType = optionOrDefault(next.storageType, evidenceStorageTypeOptions, emptyEvidenceRecord.storageType);
  next.fileName = String(next.fileName || "");
  next.mimeType = String(next.mimeType || "");
  next.fileSize = String(next.fileSize || "");
  next.indexedDbBlobKey = String(next.indexedDbBlobKey || "");
  next.externalPath = String(next.externalPath || "");
  next.externalUrl = String(next.externalUrl || "");
  next.notes = String(next.notes || "");
  next.migratedFromLegacyItem = Boolean(next.migratedFromLegacyItem);
  next.createdAt = String(next.createdAt || "");
  next.updatedAt = String(next.updatedAt || "");
  return next;
}

export function normalizeEvidenceRecords(records) {
  return Array.isArray(records) ? records.map(normalizeEvidenceRecord) : [];
}

export function validateEvidenceRecord(record) {
  const next = normalizeEvidenceRecord(record);
  const errors = [];
  if (!next.itemId) errors.push("itemId is required");
  if (!next.evidenceType) errors.push("evidenceType is required");
  if (!next.evidenceStatus) errors.push("evidenceStatus is required");
  if (!next.storageType) errors.push("storageType is required");
  if (next.storageType === "indexeddb" && !next.indexedDbBlobKey) errors.push("indexedDbBlobKey is required for indexeddb evidence");
  if (next.storageType === "external_path" && !next.externalPath) errors.push("externalPath is required for external_path evidence");
  if (next.storageType === "external_url" && !next.externalUrl) errors.push("externalUrl is required for external_url evidence");
  return errors;
}

export function isValidEvidenceRecord(record) {
  return validateEvidenceRecord(record).length === 0;
}

export function normalizeEigenbeleg(record) {
  const next = { ...emptyEigenbeleg, ...(record && typeof record === "object" ? record : {}) };
  next.id = String(next.id || "");
  next.itemId = String(next.itemId || "");
  next.purchaseRecordId = String(next.purchaseRecordId || "");
  next.sourceSessionId = String(next.sourceSessionId || "");
  next.language = normalizeListingLanguageValue(next);
  next.generationType = optionOrDefault(next.generationType, eigenbelegGenerationTypeOptions, emptyEigenbeleg.generationType);
  next.sellerDescription = String(next.sellerDescription || "");
  next.acquisitionDescription = String(next.acquisitionDescription || "");
  next.reasonNoReceipt = String(next.reasonNoReceipt || "");
  next.purchaseDate = String(next.purchaseDate || CURRENT_DATE);
  next.amount = String(next.amount || "");
  next.currency = String(next.currency || "EUR").toUpperCase();
  next.paymentMethod = String(next.paymentMethod || emptyEigenbeleg.paymentMethod);
  next.evidenceIds = normalizeStringArray(next.evidenceIds);
  next.generatedText = String(next.generatedText || "");
  next.generatedHtml = String(next.generatedHtml || "");
  next.pdfEvidenceId = String(next.pdfEvidenceId || "");
  next.status = optionOrDefault(next.status, eigenbelegStatusOptions, emptyEigenbeleg.status);
  next.finalizedAt = String(next.finalizedAt || "");
  next.migratedFromLegacyItem = Boolean(next.migratedFromLegacyItem);
  next.createdAt = String(next.createdAt || "");
  next.updatedAt = String(next.updatedAt || "");
  return next;
}

export function normalizeEigenbelege(records) {
  return Array.isArray(records) ? records.map(normalizeEigenbeleg) : [];
}

export function validateEigenbeleg(record) {
  const next = normalizeEigenbeleg(record);
  const errors = [];
  if (!next.itemId) errors.push("itemId is required");
  if (!next.purchaseRecordId) errors.push("purchaseRecordId is required");
  if (!next.reasonNoReceipt) errors.push("reasonNoReceipt is required");
  if (!next.purchaseDate) errors.push("purchaseDate is required");
  if (!next.amount) errors.push("amount is required");
  if (next.status === "Final" && !next.finalizedAt) errors.push("finalizedAt is required for final eigenbelege");
  return errors;
}

export function isValidEigenbeleg(record) {
  return validateEigenbeleg(record).length === 0;
}

export function itemRequiresEigenbeleg(item) {
  const normalized = normalizeItem(item);
  return normalized.hasReceipt === "No" || normalized.proofType === "Eigenbeleg" || normalized.receiptType === "Eigenbeleg needed";
}

export function getItemTaxReadiness(item, purchaseRecords = [], evidenceRecords = [], eigenbelege = []) {
  const normalizedItem = normalizeItem(item);
  const purchaseRecordList = normalizePurchaseRecords(purchaseRecords);
  const evidenceRecordList = normalizeEvidenceRecords(evidenceRecords);
  const eigenbelegList = normalizeEigenbelege(eigenbelege);
  const purchaseRecordPresent = purchaseRecordList.some((record) => record.itemId === normalizedItem.id);
  const evidencePresent = evidenceRecordList.some((record) => record.itemId === normalizedItem.id && record.evidenceStatus !== "Missing");
  const eigenbelegRequired = itemRequiresEigenbeleg(normalizedItem);
  const eigenbelegPresent = eigenbelegList.some((record) => record.itemId === normalizedItem.id && record.status !== "Not needed");
  const issues = [];

  if (!isBusinessRelevant(normalizedItem)) {
    return {
      status: "not_applicable",
      issues,
      purchaseRecordPresent,
      evidencePresent,
      eigenbelegRequired,
      eigenbelegPresent,
    };
  }

  if (!purchaseRecordPresent) issues.push("purchase_record_missing");
  if (!evidencePresent) issues.push("evidence_missing");
  if (eigenbelegRequired && !eigenbelegPresent) issues.push("eigenbeleg_missing");

  const status = eigenbelegRequired && !eigenbelegPresent
    ? "needs_eigenbeleg"
    : issues.length
      ? "incomplete"
      : "ready";

  return {
    status,
    issues,
    purchaseRecordPresent,
    evidencePresent,
    eigenbelegRequired,
    eigenbelegPresent,
  };
}

export function getComplianceSummary(items = [], purchaseRecords = [], evidenceRecords = [], eigenbelege = []) {
  return normalizeItems(items).reduce((summary, item) => {
    const readiness = getItemTaxReadiness(item, purchaseRecords, evidenceRecords, eigenbelege);
    if (readiness.status === "ready") summary.ready += 1;
    if (readiness.status === "incomplete") summary.incomplete += 1;
    if (readiness.status === "needs_eigenbeleg") summary.needsEigenbeleg += 1;
    if (readiness.status === "not_applicable") summary.notApplicable += 1;
    return summary;
  }, {
    ready: 0,
    incomplete: 0,
    needsEigenbeleg: 0,
    notApplicable: 0,
  });
}

export function purchaseRecordFromLegacyItem(item, overrides = {}) {
  const normalizedItem = normalizeItem(item);
  const hasReceipt = normalizedItem.hasReceipt === "Yes";
  const needsEigenbeleg = normalizedItem.hasReceipt === "No" || (normalizedItem.proofType || normalizedItem.receiptType) === "Eigenbeleg";
  return normalizePurchaseRecord({
    itemId: normalizedItem.id || "",
    sourceSessionId: normalizedItem.sourceSessionId || "",
    purchaseDate: normalizedItem.purchaseDate || normalizedItem.proofDate || CURRENT_DATE,
    purchaseType: "Single item",
    sellerName: normalizedItem.sourceName || "",
    sellerType: normalizedItem.sourceType === "Flea market" ? "Private seller" : "Unknown",
    sourceName: normalizedItem.sourceName || "",
    sourceLocation: normalizedItem.sourceLocation || "",
    sourcePlatform: normalizedItem.sourceType || "",
    grossPurchasePrice: normalizedItem.purchasePrice || normalizedItem.proofAmount || "",
    allocatedPurchaseCost: normalizedItem.purchasePrice || normalizedItem.proofAmount || "",
    paymentMethod: normalizedItem.paymentMethod || "Cash",
    receiptStatus: hasReceipt ? "Receipt available" : needsEigenbeleg ? "Eigenbeleg needed" : "Missing proof",
    proofStatus: normalizedItem.proofStoredExternally === "Yes" ? "External proof recorded" : hasReceipt ? "Receipt available" : needsEigenbeleg ? "Eigenbeleg needed" : "Missing proof",
    notes: normalizedItem.proofNotes || normalizedItem.notes || "",
    migratedFromLegacyItem: true,
    ...overrides,
  });
}

export function evidenceRecordFromLegacyItem(item, overrides = {}) {
  const normalizedItem = normalizeItem(item);
  const hasExternalProof = normalizedItem.proofStoredExternally === "Yes" || Boolean(normalizedItem.proofFileName || normalizedItem.proofFolderLocation);
  const hasReceipt = normalizedItem.hasReceipt === "Yes";
  const evidenceType = normalizedItem.proofType === "Invoice" || normalizedItem.receiptType === "Invoice" ? "Invoice" : normalizedItem.proofType === "Eigenbeleg" || normalizedItem.receiptType === "Eigenbeleg needed" ? "Eigenbeleg" : "Receipt";
  return normalizeEvidenceRecord({
    itemId: normalizedItem.id || "",
    sourceSessionId: normalizedItem.sourceSessionId || "",
    evidenceType,
    evidenceStatus: hasExternalProof ? "External reference" : hasReceipt ? "Available" : "Missing",
    title: normalizedItem.proofFileName || normalizedItem.proofImageName || normalizedItem.receiptType || normalizedItem.proofType || "",
    documentDate: normalizedItem.proofDate || normalizedItem.purchaseDate || "",
    issuer: normalizedItem.sourceName || "",
    amount: normalizedItem.proofAmount || normalizedItem.purchasePrice || "",
    storageType: hasExternalProof ? "external_path" : "metadata_only",
    fileName: normalizedItem.proofFileName || normalizedItem.proofImageName || "",
    externalPath: normalizedItem.proofFolderLocation || normalizedItem.proofFileName || "",
    notes: normalizedItem.proofNotes || normalizedItem.noReceiptReason || "",
    migratedFromLegacyItem: true,
    ...overrides,
  });
}

export function eigenbelegFromLegacyItem(item, purchaseRecord = {}, overrides = {}) {
  const normalizedItem = normalizeItem(item);
  const normalizedPurchase = normalizePurchaseRecord({
    ...purchaseRecordFromLegacyItem(normalizedItem),
    ...(purchaseRecord && typeof purchaseRecord === "object" ? purchaseRecord : {}),
  });
  return normalizeEigenbeleg({
    itemId: normalizedItem.id || normalizedPurchase.itemId || "",
    purchaseRecordId: normalizedPurchase.id || "",
    sourceSessionId: normalizedPurchase.sourceSessionId || "",
    language: normalizedItem.language || DEFAULT_LANGUAGE,
    generationType: "item",
    sellerDescription: [normalizedPurchase.sellerType, normalizedPurchase.sellerName].filter(Boolean).join(" - "),
    acquisitionDescription: normalizedItem.name || "",
    reasonNoReceipt: normalizedItem.noReceiptReason || "Private second-hand / flea-market purchase; no formal receipt available.",
    purchaseDate: normalizedPurchase.purchaseDate,
    amount: normalizedPurchase.allocatedPurchaseCost || normalizedPurchase.grossPurchasePrice,
    paymentMethod: normalizedPurchase.paymentMethod,
    evidenceIds: normalizedPurchase.evidenceIds,
    status: "Draft",
    migratedFromLegacyItem: true,
    ...overrides,
  });
}

export function scaffoldTaxComplianceRecordsFromItems(items) {
  const normalizedItems = normalizeItems(items);
  const purchaseRecords = normalizedItems.map((item) => purchaseRecordFromLegacyItem(item));
  const evidenceRecords = normalizedItems.map((item) => evidenceRecordFromLegacyItem(item));
  const eigenbelege = normalizedItems
    .filter((item) => item.hasReceipt === "No" || (item.proofType || item.receiptType) === "Eigenbeleg")
    .map((item) => eigenbelegFromLegacyItem(item, purchaseRecords.find((record) => record.itemId === item.id)));
  return { purchaseRecords, evidenceRecords, eigenbelege };
}
