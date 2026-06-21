import {
  DEFAULT_EBAY_FEE_MODE,
  ebayConditionText,
  emptyItem,
  number,
  itemStatusValue,
  soldStatusOptions,
  statusLabel,
} from "./resellitSchema.js";

export {
  MAX_LEGACY_PROOF_IMAGE_BYTES,
  DEFAULT_CLASSIFICATION,
  DEFAULT_EBAY_FEE_MODE,
  DEFAULT_LISTING_LANGUAGE,
  DEFAULT_LANGUAGE,
  CURRENT_DATE,
  CURRENT_MONTH,
  CURRENT_YEAR,
  classificationOptions,
  sellerClassificationOptions,
  sellerClassificationValues,
  ebayFeeModes,
  buyerPlatformOptions,
  conditionGradeOptions,
  languageOptions,
  testedStatusOptions,
  photoChecklistItems,
  defectDisclosureItems,
  defaultPhotoChecklist,
  defaultDefectDisclosure,
  proofTypes,
  statusOptions,
  quickStatusOptions,
  shippingWorkflowStatuses,
  soldStatusOptions,
  PERSONAL_COLLECTION_STATUS,
  legacyStatusLabels,
  expenseCategories,
  researchConfidenceOptions,
  emptyItem,
  defaultItem,
  emptyExpense,
  number,
  inMonth,
  inYear,
  itemClassification,
  sellerClassificationLabel,
  statusLabel,
  itemStatusValue,
  isActiveStockItem,
  isBusinessRelevant,
  itemRequiresEigenbeleg,
  getItemTaxReadiness,
  getComplianceSummary,
  createDraftEigenbelegForItem,
  normalizeListingLanguageValue,
  languageLabel,
  normalizeBooleanRecord,
  isLegacyProofImageTooLarge,
  buyerPlatformLabel,
  ebayConditionText,
  normalizeItem,
  normalizeItems,
} from "./resellitSchema.js";

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
  return statusLabel(itemStatusValue(item));
}

export function hasListingDraft(item) {
  return Boolean(item.listingTitle || item.ebayTitle || ebayConditionText(item) || item.generatedPlainDescription || item.descriptionText || item.generatedHtmlDescription || item.htmlDescription);
}

export function isSoldStatus(item) {
  return soldStatusOptions.includes(itemStatusValue(item)) || finalSaleValue(item) > 0;
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
  return { ...item, listingTitle: "", ebayTitle: "", ebay: { ...(item.ebay || {}), conditionText: "" }, conditionText: "", descriptionText: "", htmlDescription: "", generatedPlainDescription: "", generatedHtmlDescription: "" };
}
