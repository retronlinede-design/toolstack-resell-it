import React, { useEffect, useMemo, useState } from "react";
import { Package, ReceiptText, ShoppingCart, FileText, Euro, Download, Trash2, Edit3, Info, Search, ClipboardList, Truck, StickyNote } from "lucide-react";
import resellItLogo from "./assets/resellitlogo2.png";

const STORAGE_KEY = "toolstack.resellit.v1";
const OLD_STORAGE_KEY = "toolstack.resellerit.v1";
const EBAY_IMPORTS_KEY = "toolstack.resellit.ebayImports.v1";
const CURRENT_DATE = new Date().toISOString().slice(0, 10);
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);
const CURRENT_YEAR = new Date().getFullYear().toString();
const DISABLED_LEGACY_UI = false;
const ebayMappingHints = ["order date", "item title", "sale price", "fees", "shipping", "refund", "payout"];
const DEFAULT_CLASSIFICATION = "Unsure / Review Later";
const DEFAULT_EBAY_FEE_MODE = "Private Germany";
const classificationOptions = [
  "Private Sale / Personal Collection",
  "Business Stock / Resale Inventory",
  "Legacy Stock / Previous Business",
  DEFAULT_CLASSIFICATION,
];
const ebayFeeModes = ["Private Germany", "Business Estimate", "Manual"];
const buyerPlatformOptions = [
  ["ebay", "eBay"],
  ["kleinanzeigen", "Kleinanzeigen"],
  ["private", "Private"],
  ["facebook", "Facebook"],
  ["vinted", "Vinted"],
  ["other", "Other"],
];
const DEFAULT_LISTING_LANGUAGE = "German";
const conditionGradeOptions = ["Neu", "Sehr gut", "Gut", "Akzeptabel", "Defekt / Ersatzteile", "Sonstiges"];
const languageOptions = [
  ["de", "German"],
  ["en", "English"],
];
const DEFAULT_LANGUAGE = "de";
const testedStatusOptions = ["Not specified", "Tested working", "Partially tested", "Not tested", "Defective / repair needed"];
const researchConfidenceOptions = ["low", "medium", "high"];
const photoChecklistItems = [
  ["front", "Front photo"],
  ["back", "Back photo"],
  ["sides", "Side photos"],
  ["topBottom", "Top/bottom photo"],
  ["serialModel", "Serial/model number photo"],
  ["defects", "Defects photo"],
  ["accessories", "Accessories photo"],
  ["packaging", "Packaging photo"],
];
const defectDisclosureItems = [
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
const defaultPhotoChecklist = Object.fromEntries(photoChecklistItems.map(([key]) => [key, false]));
const defaultDefectDisclosure = Object.fromEntries(defectDisclosureItems.map(([key]) => [key, false]));
const proofTypes = ["Shop receipt", "Invoice", "Eigenbeleg", "Flea-market photo", "Private seller note", "Other"];
const statusOptions = ["Draft", "Sourced", "Ready to List", "Listed", "Sold", "Paid", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned", "Refunded", "Written Off"];
const quickStatusOptions = ["Ready to List", "Listed", "Sold", "Paid", "Ready to Pack", "Packed", "Shipped", "Completed", "Refunded"];
const shippingWorkflowStatuses = ["Sold", "Paid", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned", "Refunded"];
const legacyStatusLabels = { "Written off": "Written Off", "Kept private": "Completed" };
const expenseCategories = ["Packaging", "Shipping supplies", "Fuel / travel", "Flea-market fees", "Storage", "Office supplies", "Platform/service costs", "Other"];
const classificationHelp = [
  ["Private Sale / Personal Collection", "Originally owned personal item."],
  ["Business Stock / Resale Inventory", "Bought or sourced with resale intent."],
  ["Legacy Stock / Previous Business", "Existing old stock from a previous business."],
  ["Unsure / Review Later", "Needs later review before reporting decisions."],
];
const workflowSections = [
  ["source", "Source", Package, "Purchase source, identity, and cost"],
  ["listing", "Prepare Listing", ClipboardList, "Product details, condition, and eBay copy"],
  ["sale", "Sell & Ship", Truck, "Sale, fees, shipping, and status"],
  ["proof", "Tax Record", ReceiptText, "Proof, receipts, and Eigenbeleg"],
  ["notes", "Notes", StickyNote, "Defects, included items, and metadata"],
];
const advancedFormSections = [
  ["basic", "Basic Info", Info, "Name, category, classification, status", "border-[#b7412e] bg-[#b7412e] text-[#fff7e8] ring-[#b7412e]/20", "hover:border-[#b7412e]/50 hover:bg-[#b7412e]/12", "text-[#b7412e]"],
  ["sourcing", "Sourcing", Package, "Source, location, purchase, payment", "border-[#b7412e] bg-[#b7412e] text-[#fff7e8] ring-[#b7412e]/20", "hover:border-[#b7412e]/50 hover:bg-[#b7412e]/12", "text-[#b7412e]"],
  ["pricing", "Pricing", Search, "Research, prices, fee settings", "border-[#f0be45] bg-[#f0be45] text-[#24110e] ring-[#f0be45]/25", "hover:border-[#f0be45]/60 hover:bg-[#f0be45]/18", "text-[#b88918]"],
  ["sale", "Sale & Shipping", Truck, "Final sale and shipping numbers", "border-[#e06b2c] bg-[#e06b2c] text-[#24110e] ring-[#e06b2c]/20", "hover:border-[#e06b2c]/55 hover:bg-[#e06b2c]/15", "text-[#e06b2c]"],
  ["proof", "Proof / Receipts", ReceiptText, "Proof status and file references", "border-[#b7412e] bg-[#b7412e] text-[#fff7e8] ring-[#b7412e]/20", "hover:border-[#b7412e]/50 hover:bg-[#b7412e]/12", "text-[#b7412e]"],
  ["listing", "Listing Studio", ClipboardList, "Listing copy, HTML, and research links", "border-[#e06b2c] bg-[#e06b2c] text-[#24110e] ring-[#e06b2c]/20", "hover:border-[#e06b2c]/55 hover:bg-[#e06b2c]/15", "text-[#e06b2c]"],
  ["notes", "Notes", StickyNote, "General notes and extra context", "border-[#1f9d99] bg-[#1f9d99] text-[#062f2d] ring-[#1f9d99]/20", "hover:border-[#1f9d99]/55 hover:bg-[#1f9d99]/15", "text-[#1f9d99]"],
];

const modules = [
  ["stock", "Stock Control", "bg-[#b7412e]", "text-[#b7412e]", "text-[#fff7e8]", "border-[#b7412e]/45 bg-[#b7412e]/18", "hover:border-[#b7412e]/40 hover:bg-[#b7412e]/12"],
  ["sales", "Sales & Shipping", "bg-[#e06b2c]", "text-[#e06b2c]", "text-[#fff7e8]", "border-[#e06b2c]/45 bg-[#e06b2c]/18", "hover:border-[#e06b2c]/40 hover:bg-[#e06b2c]/12"],
  ["finance", "Finance", "bg-[#f0be45]", "text-[#b88918]", "text-[#fff7e8]", "border-[#f0be45]/45 bg-[#f0be45]/16", "hover:border-[#f0be45]/45 hover:bg-[#f0be45]/12"],
  ["tools", "Tools", "bg-[#1f9d99]", "text-[#1f9d99]", "text-[#fff7e8]", "border-[#1f9d99]/45 bg-[#1f9d99]/18", "hover:border-[#1f9d99]/40 hover:bg-[#1f9d99]/12"],
];
const financeSections = [["thisMonth", "This Month"], ["taxRecords", "Tax Records"], ["reconciliation", "Reconciliation"], ["yearEnd", "Year-End / EÜR"]];
const stockSectionDetails = {
  needsAttention: ["Needs Attention", "Items missing information, proof, pricing, or listing preparation."],
  inventory: ["Active Inventory", "Current inventory being managed and tracked."],
  readyToList: ["Ready to List", "Prepared items ready for eBay listing."],
  listingStudio: ["Listing Studio", "Create and manage listing titles, descriptions, and HTML templates."],
};
const financeSectionDetails = {
  thisMonth: ["This Month", "Current month reseller activity and estimated performance."],
  taxRecords: ["Tax Records", "Items and expenses requiring tax documentation or review."],
  reconciliation: ["Reconciliation", "Match sales, fees, payouts, and imported platform records."],
  yearEnd: ["Year-End / EÜR", "Year-end preparation for ELSTER or accountant reporting."],
};

const emptyItem = {
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

const emptyExpense = {
  date: new Date().toISOString().slice(0, 10),
  category: "Packaging",
  description: "",
  amount: "",
  paymentMethod: "Cash",
  receiptAvailable: "No",
  receiptNotes: "",
  linkedItemId: "",
};

const demoItems = [
  {
    id: crypto.randomUUID(),
    name: "Vintage Sony CD Player",
    category: "Electronics",
    sourceType: "Flea market",
    sourceName: "Private seller",
    sourceLocation: "Landshut Flohmarkt",
    purchaseDate: "2026-05-16",
    purchasePrice: "15",
    hasReceipt: "No",
    receiptType: "Eigenbeleg needed",
    paymentMethod: "Cash",
    expectedSalePrice: "49",
    status: "Listed",
    ebayTitle: "Sony CD Player Vintage - Tested",
    saleDate: "",
    salePrice: "",
    ebayFees: "",
    shippingCost: "",
    notes: "No receipt available. Private flea-market purchase.",
  },
  {
    id: crypto.randomUUID(),
    name: "Leather Jacket",
    category: "Clothing",
    sourceType: "Second-hand shop",
    sourceName: "Local second-hand shop",
    sourceLocation: "Landshut",
    purchaseDate: "2026-05-15",
    purchasePrice: "22",
    hasReceipt: "Yes",
    receiptType: "Shop receipt",
    paymentMethod: "Card",
    expectedSalePrice: "65",
    status: "Sold",
    ebayTitle: "Men's Leather Jacket Brown Size L",
    saleDate: "2026-05-18",
    salePrice: "59",
    ebayFees: "7.50",
    shippingCost: "5.49",
    notes: "Receipt kept in receipt folder.",
  },
];

function money(value) {
  const n = Number(value || 0);
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function number(value) {
  return Number(String(value || "0").replace(",", ".")) || 0;
}

function inMonth(date, month = CURRENT_MONTH) {
  return String(date || "").startsWith(month);
}

function inYear(date, year = CURRENT_YEAR) {
  return String(date || "").startsWith(year);
}

function timelineGroupLabel(date, grouping) {
  if (grouping === "Ungrouped") return "All items";
  if (!date) return "No purchase date";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "No purchase date";
  if (grouping === "Year") return String(parsed.getFullYear());
  if (grouping === "Week") {
    const monday = new Date(parsed);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    return `Week of ${monday.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
  }
  return parsed.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

function itemClassification(item) {
  return item.classification || DEFAULT_CLASSIFICATION;
}

function normalizeListingLanguageValue(item) {
  const rawLanguage = String(item?.language || "").trim().toLowerCase();
  if (rawLanguage === "en" || rawLanguage === "english") return "en";
  if (rawLanguage === "de" || rawLanguage === "german" || rawLanguage === "deutsch") return "de";
  const legacyLanguage = String(item?.listingLanguage || "").trim().toLowerCase();
  if (legacyLanguage === "english" || legacyLanguage === "en") return "en";
  return DEFAULT_LANGUAGE;
}

function languageLabel(value) {
  return value === "en" ? "English" : "German";
}

function normalizeBooleanRecord(value, defaults) {
  if (Array.isArray(value)) {
    return {
      ...defaults,
      ...Object.fromEntries(value.map((key) => [key, true])),
    };
  }
  if (!value || typeof value !== "object") return { ...defaults };
  return Object.fromEntries(Object.keys(defaults).map((key) => [key, Boolean(value[key])]));
}

function buyerPlatformLabel(value) {
  return buyerPlatformOptions.find(([key]) => key === value)?.[1] || "eBay";
}

function normalizeItem(item) {
  const next = { ...emptyItem, ...item };
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
  if (!buyerPlatformOptions.some(([key]) => key === next.buyerPlatform)) next.buyerPlatform = "ebay";
  if (!statusOptions.includes(next.status) && legacyStatusLabels[next.status]) next.status = legacyStatusLabels[next.status];
  return next;
}

function normalizeItems(items) {
  return Array.isArray(items) ? items.map(normalizeItem) : [];
}

function finalSaleValue(item) {
  return number(item.finalSalePrice || item.salePrice);
}

function shippingChargedValue(item) {
  return number(item.shippingChargedToBuyer);
}

function actualShippingValue(item) {
  return number(item.actualShippingCost || item.shippingCost);
}

function packagingCostValue(item) {
  return number(item.packagingCost);
}

function refundValue(item) {
  return number(item.refundAmount) + number(item.returnPostageCost);
}

function ebayBaseFee(item) {
  const grossSale = finalSaleValue(item) + shippingChargedValue(item);
  const mode = item.ebayFeeMode || (item.ebayFees ? "Legacy" : DEFAULT_EBAY_FEE_MODE);

  if (mode === "Manual") return number(item.manualEbayFee || item.ebayFees);
  if (mode === "Business Estimate") return (grossSale * number(item.feePercent)) / 100 + number(item.fixedFee);
  if (mode === "Legacy") return number(item.ebayFees);
  return 0;
}

function platformFees(item) {
  return ebayBaseFee(item) + number(item.promotedListingFee) + number(item.otherPlatformFees);
}

function itemProfitValue(item) {
  return finalSaleValue(item) + shippingChargedValue(item) - number(item.purchasePrice) - platformFees(item) - actualShippingValue(item) - packagingCostValue(item) - refundValue(item);
}

function needsProofRecord(item) {
  return !(
    item.hasReceipt === "Yes" ||
    item.proofStoredExternally === "Yes" ||
    item.proofFileName ||
    item.proofFolderLocation ||
    item.proofImageDataUrl ||
    item.proofNotes
  );
}

function quickProofStatus(item) {
  if (externallyStoredProof(item) || item.hasReceipt === "Yes") return "Proof available";
  if ((item.proofType || item.receiptType) === "Eigenbeleg" || item.receiptType === "Eigenbeleg needed") return "Eigenbeleg needed";
  return "Missing proof";
}

function itemStatus(item) {
  return legacyStatusLabels[item.status] || item.status || "Draft";
}

function statusBadgeClass(item) {
  const status = itemStatus(item);
  if (status === "Completed") return "bg-lime-100 text-lime-800 border-lime-200";
  if (status === "Sold") return "bg-[#e06b2c]/15 text-[#8a3915] border-[#e06b2c]/25";
  if (status === "Paid") return "bg-[#f0be45]/25 text-[#6f4e05] border-[#f0be45]/35";
  if (status === "Ready to Pack") return "bg-[#f0be45]/25 text-[#6f4e05] border-[#f0be45]/35";
  if (status === "Packed") return "bg-[#e06b2c]/20 text-[#8a3915] border-[#e06b2c]/30";
  if (status === "Shipped") return "bg-[#1f9d99]/15 text-[#0f5f5b] border-[#1f9d99]/25";
  if (status === "Ready to List" || status === "Listed") return "bg-[#f0be45]/25 text-[#6f4e05] border-[#f0be45]/35";
  if (status === "Returned" || status === "Refunded" || status === "Written Off") return "bg-red-50 text-red-700 border-red-200";
  return "bg-stone-100 text-stone-700 border-stone-200";
}

function proofBadgeClass(item) {
  if (!needsProofRecord(item)) return "bg-lime-50 text-lime-800 border-lime-200";
  if (needsEigenbeleg(item)) return "bg-[#f0be45]/20 text-[#6f4e05] border-[#f0be45]/35";
  return "bg-red-50 text-red-700 border-red-200";
}

function expectedListingValue(item) {
  return number(item.chosenListingPrice || item.expectedSalePrice);
}

function hasPriceResearch(item) {
  return Boolean(item.researchQuery || item.priceResearchLow || item.priceResearchMid || item.priceResearchHigh || item.researchedLowPrice || item.researchedMidPrice || item.researchedHighPrice || item.chosenListingPrice || item.priceResearchNotes);
}

function hasListingDraft(item) {
  return Boolean(item.listingTitle || item.ebayTitle || item.conditionText || item.generatedPlainDescription || item.descriptionText || item.generatedHtmlDescription || item.htmlDescription);
}

function hasListingPreviewInput(item) {
  return Boolean(item.generatedHtmlDescription || item.htmlDescription || item.generatedPlainDescription || item.descriptionText || generatedListingTitle(item) || item.conditionGrade || item.conditionNotes || item.defectsNotes || item.includedAccessories || item.includedItems || item.shippingNotes || item.notes || item.productDescriptionText || item.compatibilityInfo || item.keyFeatures);
}

function isSoldStatus(item) {
  return ["Sold", "Paid", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned", "Refunded"].includes(itemStatus(item)) || Boolean(item.finalSalePrice || item.salePrice || item.saleDate);
}

function dhlTrackingUrl(trackingNumber) {
  return `https://www.dhl.de/de/privatkunden/dhl-sendungsverfolgung.html?piececode=${encodeURIComponent(trackingNumber || "")}`;
}

function needsEigenbeleg(item) {
  return item.hasReceipt === "No" || (item.proofType || item.receiptType) === "Eigenbeleg";
}

function externallyStoredProof(item) {
  return item.proofStoredExternally === "Yes" || Boolean(item.proofFileName || item.proofFolderLocation);
}

function priceResearchQuery(item) {
  return (item.researchQuery || item.ebayTitle || item.name || "").trim();
}

function researchWarnings(item) {
  return [
    !String(item.researchQuery || "").trim() && "Search query is empty",
    !item.suggestedListingPrice && "Suggested price is missing",
  ].filter(Boolean);
}

function priceResearchLinks(item) {
  const query = encodeURIComponent(priceResearchQuery(item));
  if (!query) return [];

  return [
    ["eBay DE active", `https://www.ebay.de/sch/i.html?_nkw=${query}`],
    ["eBay DE sold/completed", `https://www.ebay.de/sch/i.html?_nkw=${query}&LH_Complete=1&LH_Sold=1`],
    ["Google", `https://www.google.com/search?q=${query}`],
    ["Kleinanzeigen", `https://www.kleinanzeigen.de/s-suchanfrage.html?keywords=${query}`],
    ["ChatGPT search", "https://chatgpt.com/"],
  ];
}

function listingResearchLinks(item) {
  const query = encodeURIComponent(priceResearchQuery(item));
  return [
    ["Search eBay sold listings", query ? `https://www.ebay.de/sch/i.html?_nkw=${query}&LH_Complete=1&LH_Sold=1` : "https://www.ebay.de/"],
    ["Search eBay active listings", query ? `https://www.ebay.de/sch/i.html?_nkw=${query}` : "https://www.ebay.de/"],
    ["Search Google", query ? `https://www.google.com/search?q=${query}` : "https://www.google.com/"],
    ["Search Kleinanzeigen", query ? `https://www.kleinanzeigen.de/s-suchanfrage.html?keywords=${query}` : "https://www.kleinanzeigen.de/"],
    ["Open ChatGPT", "https://chatgpt.com/"],
  ];
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bulletLines(value) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function listingLanguage(item) {
  return languageLabel(normalizeListingLanguageValue(item));
}

function isGermanListing(item) {
  return listingLanguage(item) === "German";
}

function listingLabels(item) {
  return isGermanListing(item)
    ? {
      title: "Titel",
      condition: "Zustand",
      description: "Beschreibung",
      included: "Lieferumfang",
      shipping: "Versand",
      notes: "Hinweise",
      brand: "Marke",
      model: "Modell",
      sizeSpecs: "Größe / Spezifikation",
      colour: "Farbe",
      category: "Kategorie",
      price: "Angebotspreis",
      defects: "Mängel / Gebrauchsspuren",
      researchNotes: "Recherchehinweise",
      copyTitle: "Titel kopieren",
      copyCondition: "Zustand kopieren",
      copyDescription: "Beschreibung kopieren",
      copyHtmlDescription: "HTML-Beschreibung kopieren",
      missing: "Fehlt",
      exists: "Vorhanden",
      notSpecified: "Nicht angegeben",
      noSourceFields: "Noch keine Quelldaten eingetragen",
      preview: "HTML-Beschreibung Vorschau",
    }
    : {
      title: "Title",
      condition: "Condition",
      description: "Description",
      included: "What is included",
      shipping: "Shipping",
      notes: "Notes",
      brand: "Brand",
      model: "Model",
      sizeSpecs: "Size / specs",
      colour: "Colour",
      category: "Category",
      price: "Listing price",
      defects: "Defects / wear",
      researchNotes: "Research notes",
      copyTitle: "Copy title",
      copyCondition: "Copy condition",
      copyDescription: "Copy plain description",
      copyHtmlDescription: "Copy HTML description",
      missing: "Missing",
      exists: "Exists",
      notSpecified: "Not specified",
      noSourceFields: "No source fields added yet",
      preview: "HTML description preview",
    };
}

function compactWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncateTitle(value, limit = 80) {
  const clean = compactWhitespace(value);
  if (clean.length <= limit) return clean;
  const words = clean.split(" ");
  const kept = [];
  for (const word of words) {
    const candidate = [...kept, word].join(" ");
    if (candidate.length > limit) break;
    kept.push(word);
  }
  return kept.join(" ") || clean.slice(0, limit).trim();
}

function generatedListingTitle(item) {
  const manualTitle = compactWhitespace(item.ebayTitle || item.listingTitle);
  if (manualTitle) return truncateTitle(manualTitle);

  const features = bulletLines(item.keyFeatures).slice(0, 2);
  const condition = isGermanListing(item)
    ? germanConditionGrade(item.conditionGrade)
    : item.conditionGrade;
  const parts = [
    item.brand,
    item.model,
    item.name,
    item.category,
    ...features,
    condition,
  ].map(compactWhitespace).filter(Boolean);
  const deduped = parts.filter((part, index) => parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index);
  return truncateTitle(deduped.join(" "));
}

function germanConditionGrade(grade) {
  const normalized = String(grade || "").trim().toLowerCase();
  if (!normalized) return "";
  if (["new", "neu", "brand new", "new with tags", "new in box", "nib"].includes(normalized)) return "Neu";
  if (["like new", "as new", "mint", "neuwertig"].includes(normalized)) return "Neuwertig";
  if (["very good", "sehr gut"].includes(normalized)) return "Sehr guter gebrauchter Zustand";
  if (["good", "gut"].includes(normalized)) return "Guter gebrauchter Zustand";
  if (["used", "pre-owned", "preowned", "gebraucht"].includes(normalized)) return "Gebraucht";
  if (["fair", "acceptable", "akzeptabel"].includes(normalized)) return "Akzeptabler gebrauchter Zustand";
  if (["for parts", "defective", "defekt", "parts only"].includes(normalized)) return "Als defekt / für Ersatzteile";
  return grade;
}

function generatedConditionBaseText(item) {
  if (isGermanListing(item)) {
    return germanConditionGrade(item.conditionGrade) || "";
  }
  return item.conditionGrade || "";
}

function selectedDefectLabels(item) {
  const flags = normalizeBooleanRecord(item.defectDisclosure, defaultDefectDisclosure);
  return defectDisclosureItems
    .filter(([key]) => flags[key])
    .map(([, label]) => label);
}

function generatedDefectDisclosureText(item) {
  const selected = selectedDefectLabels(item);
  if (!selected.length) return "";
  if (isGermanListing(item)) {
    const translations = {
      scratches: "Kratzer",
      dents: "Dellen",
      cracks: "Risse",
      discoloration: "Verfarbungen",
      "missing parts": "fehlende Teile",
      "not tested": "nicht getestet",
      "partially working": "teilweise funktionsfaehig",
      "repair needed": "reparaturbeduerftig",
      other: "sonstige Maengel",
    };
    return `Gepruefte Maengel: ${selected.map((label) => translations[label] || label).join(", ")}.`;
  }
  return `Reviewed defects: ${selected.join(", ")}.`;
}

function conditionDetailLines(item) {
  const labels = listingLabels(item);
  return [
    item.testedStatus && item.testedStatus !== "Not specified" && `${isGermanListing(item) ? "Teststatus" : "Tested status"}: ${item.testedStatus}`,
    generatedDefectDisclosureText(item),
    item.conditionNotes,
    item.defectsNotes && `${labels.defects}: ${item.defectsNotes}`,
  ].filter(Boolean);
}

function generatedConditionText(item) {
  const manualCondition = String(item.conditionText || "").trim();
  const baseCondition = manualCondition || generatedConditionBaseText(item);
  return [baseCondition, ...conditionDetailLines(item)].filter(Boolean).join("\n") || (isGermanListing(item) ? "Bitte Zustand selbst prüfen und Beschreibung beachten." : "Please review the description for condition details.");
}

function privateSellerNote(item) {
  return isGermanListing(item)
    ? "Privatverkauf. Keine Garantie, Gewährleistung oder Rücknahme."
    : "Private sale. No warranty, guarantee, or returns.";
}

function listingSectionHeadings(item) {
  return isGermanListing(item)
    ? { article: "ARTIKEL", productDescription: "PRODUKTBESCHREIBUNG", condition: "ZUSTAND", included: "LIEFERUMFANG", shipping: "VERSAND", notes: "HINWEISE" }
    : { article: "ITEM", productDescription: "ABOUT THE ITEM", condition: "CONDITION", included: "WHAT IS INCLUDED", shipping: "SHIPPING", notes: "NOTES" };
}

function htmlParagraphs(lines) {
  return lines.map((line) => `      <p style="margin:0 0 8px;">${escapeHtml(line).replaceAll("\n", "<br>")}</p>`).join("\n");
}

function htmlBulletList(lines) {
  return [
    '      <ul style="margin:0;padding-left:18px;">',
    ...lines.map((line) => `        <li style="margin:0 0 5px;">${escapeHtml(line)}</li>`),
    "      </ul>",
  ].join("\n");
}

function htmlRetroSection(heading, colour, contentHtml) {
  return [
    `    <div style="border-left:5px solid ${colour};background:#fffdf5;margin:0 0 12px;padding:12px 12px 10px;border-radius:4px;">`,
    `      <h3 style="margin:0 0 8px;font-size:15px;letter-spacing:.04em;color:#2b211d;font-weight:700;">${escapeHtml(heading)}</h3>`,
    contentHtml,
    "    </div>",
  ].join("\n");
}

function productDescriptionLines(item) {
  const labels = listingLabels(item);
  const explicitDescription = String(item.productDescriptionText || "").trim();
  const compatibility = String(item.compatibilityInfo || "").trim();
  const features = bulletLines(item.keyFeatures);
  const identity = [item.brand, item.model, item.name].filter(Boolean).join(" ");
  const categoryLine = item.category && (isGermanListing(item)
    ? `${identity || item.name || "Der Artikel"} gehört zur Kategorie ${item.category}.`
    : `${identity || item.name || "This item"} is in the ${item.category} category.`);
  const specs = [
    (item.measurements || item.sizeSpecs) && `${labels.sizeSpecs}: ${item.measurements || item.sizeSpecs}`,
    item.colour && `${labels.colour}: ${item.colour}`,
  ].filter(Boolean);
  const modelLine = item.model && item.brand && (isGermanListing(item)
    ? `Hersteller/Modell: ${item.brand} ${item.model}.`
    : `Maker/model: ${item.brand} ${item.model}.`);
  const compatibilityLine = compatibility && (isGermanListing(item)
    ? `Kompatibilität / Plattform: ${compatibility}`
    : `Compatibility / platform: ${compatibility}`);
  const featureLines = features.map((feature) => isGermanListing(item) ? `Merkmal: ${feature}` : `Feature: ${feature}`);

  return [
    explicitDescription,
    compatibilityLine,
    ...featureLines,
    ...(explicitDescription ? specs : [categoryLine, modelLine, ...specs]),
  ].filter(Boolean);
}

function generateHtmlDescription(item, { preferSaved = true } = {}) {
  const labels = listingLabels(item);
  const headings = listingSectionHeadings(item);
  const condition = generatedConditionText(item, { preferSaved });
  const articleLines = [
    generatedListingTitle(item),
    [labels.brand, item.brand],
    [labels.model, item.model],
    [labels.category, item.category],
    [labels.sizeSpecs, item.measurements || item.sizeSpecs],
    [labels.colour, item.colour],
  ].map((entry) => Array.isArray(entry) ? entry : ["", entry])
    .filter(([, value]) => value)
    .map(([label, value]) => label ? `${label}: ${value}` : value);
  const productLines = productDescriptionLines(item);
  const included = bulletLines(item.includedAccessories || item.includedItems);
  const shippingLines = [item.shippingNotes || (isGermanListing(item) ? "Versand nach Vereinbarung." : "Shipping by arrangement.")];
  const notes = [
    item.notes,
    itemClassification(item) === "Private Sale / Personal Collection" && privateSellerNote(item),
  ].filter(Boolean);
  const notesLines = notes.length ? notes : [isGermanListing(item) ? "Keine weiteren Hinweise." : "No additional notes."];
  const includedLines = included.length ? included : [isGermanListing(item) ? "Lieferumfang wie beschrieben." : "Included as described."];

  return [
    '<div style="background:#2b1b14;padding:14px 10px;margin:0 auto;max-width:720px;">',
    '  <div style="max-width:700px;margin:0 auto;background:#fff8e8;color:#2b211d;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;border:1px solid #d8c4a4;border-radius:6px;overflow:hidden;">',
    '    <div style="height:6px;background:#2f9d9a;border-bottom:3px solid #e0b947;"></div>',
    '    <div style="height:3px;background:#d9783b;border-bottom:3px solid #b7412e;"></div>',
    '    <div style="padding:16px;">',
    `      <h2 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#2b211d;font-weight:700;">${escapeHtml(generatedListingTitle(item))}</h2>`,
    htmlRetroSection(headings.article, "#2f9d9a", htmlParagraphs(articleLines)),
    productLines.length ? htmlRetroSection(headings.productDescription, "#e0b947", htmlParagraphs(productLines)) : "",
    htmlRetroSection(headings.condition, "#e0b947", htmlParagraphs([condition])),
    htmlRetroSection(headings.included, "#d9783b", htmlBulletList(includedLines)),
    htmlRetroSection(headings.shipping, "#b7412e", htmlParagraphs(shippingLines)),
    htmlRetroSection(headings.notes, "#2f9d9a", htmlParagraphs(notesLines)),
    "    </div>",
    "  </div>",
    "</div>",
  ].filter(Boolean).join("\n");
}

function generatedPlainDescription(item, condition) {
  const labels = listingLabels(item);
  const headings = listingSectionHeadings(item);
  const articleLines = [
    generatedListingTitle(item),
    item.name && `${isGermanListing(item) ? "Artikel" : "Item"}: ${item.name}`,
    item.brand && `${labels.brand}: ${item.brand}`,
    item.model && `${labels.model}: ${item.model}`,
    item.category && `${labels.category}: ${item.category}`,
    (item.measurements || item.sizeSpecs) && `${labels.sizeSpecs}: ${item.measurements || item.sizeSpecs}`,
    item.colour && `${labels.colour}: ${item.colour}`,
  ].filter(Boolean);
  const productLines = productDescriptionLines(item);
  const includedLines = bulletLines(item.includedAccessories || item.includedItems);
  const notesLines = [
    item.notes,
    itemClassification(item) === "Private Sale / Personal Collection" && privateSellerNote(item),
  ].filter(Boolean);
  const sections = [
    [headings.article, articleLines],
    productLines.length && [headings.productDescription, productLines],
    [headings.condition, [condition]],
    [headings.included, includedLines.length ? includedLines.map((line) => `- ${line}`) : [isGermanListing(item) ? "Lieferumfang wie beschrieben." : "Included as described."]],
    [headings.shipping, [item.shippingNotes || (isGermanListing(item) ? "Versand nach Vereinbarung." : "Shipping by arrangement.")]],
    [headings.notes, notesLines.length ? notesLines : [isGermanListing(item) ? "Keine weiteren Hinweise." : "No additional notes."]],
  ].filter(Boolean);

  return sections.map(([heading, lines]) => [heading, ...lines].join("\n")).join("\n\n");
}

function generateListingDraft(item, { preferSaved = true } = {}) {
  const title = generatedListingTitle(item);
  const condition = generatedConditionText(item, { preferSaved });
  const generatedDescription = generatedPlainDescription(item, condition);
  const description = preferSaved ? item.generatedPlainDescription || item.descriptionText || generatedDescription : generatedDescription;
  const htmlDescription = generateHtmlDescription(item, { preferSaved });

  return {
    title,
    condition,
    description,
    htmlDescription: preferSaved ? item.generatedHtmlDescription || item.htmlDescription || htmlDescription : htmlDescription,
  };
}

function listingCompleteness(item) {
  const draft = generateListingDraft(item);
  const checklist = normalizeBooleanRecord(item.photoChecklist, defaultPhotoChecklist);
  const defectFlags = normalizeBooleanRecord(item.defectDisclosure, defaultDefectDisclosure);
  const checks = [
    ["Title complete", Boolean(draft.title && draft.title.length <= 80)],
    ["Price selected", Boolean(item.chosenListingPrice)],
    ["Condition filled", Boolean(item.conditionGrade || item.conditionText)],
    ["Defects reviewed", Boolean(item.defectsNotes || Object.values(defectFlags).some(Boolean))],
    ["Photos checked", Object.values(checklist).every(Boolean)],
    ["Shipping notes filled", Boolean(String(item.shippingNotes || "").trim())],
    ["Description generated", Boolean(item.generatedPlainDescription || item.descriptionText || item.generatedHtmlDescription || item.htmlDescription)],
  ];
  const completeCount = checks.filter(([, done]) => done).length;
  return {
    checks,
    percent: Math.round((completeCount / checks.length) * 100),
  };
}

function listingPack(item) {
  const draft = generateListingDraft(item);
  return {
    title: item.ebayTitle || item.listingTitle || draft.title,
    price: item.chosenListingPrice || "",
    condition: item.conditionText || draft.condition,
    plainDescription: item.generatedPlainDescription || item.descriptionText || draft.description,
    htmlDescription: item.generatedHtmlDescription || item.htmlDescription || draft.htmlDescription,
    shippingNotes: item.shippingNotes || "",
  };
}

function listingWarnings(item) {
  const pack = listingPack(item);
  const checklist = normalizeBooleanRecord(item.photoChecklist, defaultPhotoChecklist);
  const defectFlags = normalizeBooleanRecord(item.defectDisclosure, defaultDefectDisclosure);
  return [
    !pack.title && "Title is empty",
    pack.title.length > 80 && "Title is over 80 characters",
    !pack.price && "Price is missing",
    !pack.condition && "Condition text is empty",
    !(item.defectsNotes || Object.values(defectFlags).some(Boolean)) && "Defects have not been reviewed",
    !Object.values(checklist).every(Boolean) && "Photo checklist is incomplete",
    !pack.shippingNotes && "Shipping notes are empty",
    !(pack.plainDescription || pack.htmlDescription) && "Description is empty",
  ].filter(Boolean);
}

function hasLanguageMismatch(item) {
  const pack = listingPack(item);
  const text = `${pack.condition}\n${pack.plainDescription}\n${pack.shippingNotes}`.toLowerCase();
  if (!text.trim()) return false;
  if (normalizeListingLanguageValue(item) === "de") {
    return /\b(item|condition|shipping|included|description|private sale|no warranty)\b/.test(text);
  }
  return /\b(zustand|versand|lieferumfang|beschreibung|privatverkauf|hinweise)\b/.test(text);
}

function listingReadiness(item) {
  const warnings = listingWarnings(item);
  const checklist = normalizeBooleanRecord(item.photoChecklist, defaultPhotoChecklist);
  const photosIncomplete = !Object.values(checklist).every(Boolean);
  const coreWarnings = warnings.filter((warning) => warning !== "Photo checklist is incomplete");
  if (!listingPack(item).title && !listingPack(item).plainDescription && !listingPack(item).htmlDescription) return "Draft";
  if (coreWarnings.length) return "Draft";
  if (photosIncomplete) return "Needs Photos";
  if (hasLanguageMismatch(item)) return "Needs Translation";
  return "Ready for eBay";
}

function loadInitialItems() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let shouldMigrateOldData = false;
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) {
        raw = oldRaw;
        shouldMigrateOldData = true;
      }
    }
    if (!raw) return normalizeItems(demoItems);
    const parsed = JSON.parse(raw);
    const normalizedItems = Array.isArray(parsed.items) ? normalizeItems(parsed.items) : normalizeItems(demoItems);
    if (shouldMigrateOldData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...parsed,
        version: 1,
        items: normalizedItems,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        updatedAt: new Date().toISOString(),
      }));
    }
    return normalizedItems;
  } catch {
    return normalizeItems(demoItems);
  }
}

function loadInitialExpenses() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let shouldMigrateOldData = false;
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) {
        raw = oldRaw;
        shouldMigrateOldData = true;
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (shouldMigrateOldData) localStorage.setItem(STORAGE_KEY, raw);
    return Array.isArray(parsed.expenses) ? parsed.expenses : [];
  } catch {
    return [];
  }
}

function loadEbayImportBatches() {
  try {
    const raw = localStorage.getItem(EBAY_IMPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.batches) ? parsed.batches : [];
  } catch {
    return [];
  }
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function parseCsvText(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { columns: [], rows: [] };

  const columns = parseCsvLine(lines[0]).map((column, index) => column || `Column ${index + 1}`);
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return columns.reduce((row, column, index) => {
      row[column] = cells[index] || "";
      return row;
    }, {});
  });

  return { columns, rows };
}

function StatCard({ icon: Icon, label, value, sub, accentClass = "" }) {
  return (
    <div className="premium-card rounded-2xl border border-stone-200 bg-[#fffdf8] p-3 shadow-[0_10px_26px_rgba(41,37,36,0.045)]">
      {accentClass && <div className={`mb-2 h-1 w-10 rounded-full ${accentClass}`} />}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
          <p className="mt-1 text-xl font-semibold leading-none text-stone-950">{value}</p>
          {sub && <p className="mt-1 text-xs leading-snug text-stone-500">{sub}</p>}
        </div>
        <div className="rounded-xl bg-stone-100 p-1.5 text-stone-600"><Icon size={16} /></div>
      </div>
    </div>
  );
}

function QueueCard({ icon: Icon, label, value, sub, onClick, tone = "stock" }) {
  const tones = {
    stock: "border-[#b7412e]/20 hover:border-[#b7412e]/45 hover:bg-[#b7412e]/8",
    sales: "border-[#e06b2c]/20 hover:border-[#e06b2c]/45 hover:bg-[#e06b2c]/10",
    finance: "border-[#f0be45]/25 hover:border-[#f0be45]/60 hover:bg-[#f0be45]/12",
  };

  return (
    <button type="button" onClick={onClick} className={`premium-card rounded-2xl border bg-[#fffdf8] p-4 text-left shadow-[0_10px_26px_rgba(41,37,36,0.045)] ${tones[tone] || tones.stock}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold leading-none text-stone-950">{value}</p>
          {sub && <p className="mt-2 text-sm leading-snug text-stone-600">{sub}</p>}
        </div>
        <div className="rounded-xl bg-stone-900 p-2 text-amber-50"><Icon size={18} /></div>
      </div>
    </button>
  );
}

function SectionHeader({ title, subtitle, count }) {
  return (
    <div className="rounded-3xl border border-[#b7412e]/15 bg-[#fffdf8] p-4 shadow-[0_14px_34px_rgba(41,37,36,0.055)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 h-1 w-14 rounded-full bg-[#b7412e]" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#b7412e]">Stock Control</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-stone-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">{subtitle}</p>
        </div>
        {count !== undefined && <p className="rounded-2xl border border-[#b7412e]/15 bg-[#b7412e]/8 px-3 py-2 text-sm font-semibold text-[#8f3124]">{count} shown</p>}
      </div>
    </div>
  );
}

function FinanceHeader({ title, subtitle, meta }) {
  return (
    <div className="rounded-3xl border border-[#f0be45]/25 bg-[#fffdf8] p-4 shadow-[0_14px_34px_rgba(41,37,36,0.055)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 h-1 w-14 rounded-full bg-[#f0be45]" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9b7411]">Finance</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-stone-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">{subtitle}</p>
        </div>
        {meta && <p className="rounded-2xl border border-[#f0be45]/30 bg-[#f0be45]/15 px-3 py-2 text-sm font-semibold text-[#72530b]">{meta}</p>}
      </div>
    </div>
  );
}

function Input({ label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</span>
      <input {...props} className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-all duration-150 placeholder:text-stone-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70" />
    </label>
  );
}

function Select({ label, className = "", children, ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</span>
      <select {...props} className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-all duration-150 focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70">
        {children}
      </select>
    </label>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="premium-panel rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
      <h3 className="mb-3 text-sm font-semibold text-stone-950">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function ChecklistGrid({ title, items: checklistItems, value, onChange }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {checklistItems.map(([key, label]) => (
          <label key={key} className="flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={Boolean(value?.[key])}
              onChange={(event) => onChange({ ...value, [key]: event.target.checked })}
              className="h-4 w-4 accent-[#e06b2c]"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

function ListingCompleteness({ item }) {
  const { checks, percent } = listingCompleteness(item);
  return (
    <div className="rounded-2xl border border-[#f0be45]/35 bg-[#f0be45]/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-950">Listing completeness</p>
        <p className="rounded-xl bg-white px-3 py-1 text-sm font-semibold text-[#72530b]">{percent}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-[#e06b2c]" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {checks.map(([label, done]) => (
          <div key={label} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${done ? "border-lime-200 bg-lime-50 text-lime-800" : "border-neutral-200 bg-white text-neutral-500"}`}>
            {done ? "OK" : "Missing"}: {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ListingReadinessBadge({ item }) {
  const readiness = listingReadiness(item);
  const className = {
    Draft: "border-neutral-200 bg-neutral-100 text-neutral-700",
    "Needs Photos": "border-[#f0be45]/40 bg-[#f0be45]/20 text-[#72530b]",
    "Needs Translation": "border-orange-200 bg-orange-50 text-orange-900",
    "Ready for eBay": "border-lime-200 bg-lime-50 text-lime-800",
  }[readiness];
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{readiness}</span>;
}

function ListingWarningsPanel({ item }) {
  const warnings = listingWarnings(item);
  if (!warnings.length) {
    return <div className="rounded-2xl border border-lime-200 bg-lime-50 p-3 text-sm font-semibold text-lime-800">No listing warnings.</div>;
  }
  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">Listing warnings</p>
      <ul className="mt-2 grid gap-1.5 text-sm text-orange-950 sm:grid-cols-2">
        {warnings.map((warning) => <li key={warning}>- {warning}</li>)}
      </ul>
    </div>
  );
}

function ResearchPanel({ item, onChange, onCopy, onOpenGoogleSearch, onResearchQueryChange, onUseEbayTitle }) {
  const warnings = researchWarnings(item);
  const query = String(item.researchQuery || "").trim();
  return (
    <div className="rounded-2xl border border-[#f0be45]/30 bg-[#fffdf8] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6511]">Research Panel</p>
          <p className="mt-1 text-sm text-stone-600">Use the eBay title as a simple Google search query. Paste useful findings into Research Notes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onCopy("research query", query)} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy Research Query</button>
          <button type="button" onClick={() => onCopy("research notes", item.researchNotes || "")} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy Research Notes</button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">Research warnings</p>
          <ul className="mt-2 grid gap-1.5 text-sm text-orange-950 sm:grid-cols-3">
            {warnings.map((warning) => <li key={warning}>- {warning}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <Input label="Search Query" value={item.researchQuery || ""} onChange={(e) => onResearchQueryChange(e.target.value)} />
        <button type="button" onClick={onUseEbayTitle} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Use eBay Title</button>
        <button type="button" onClick={onOpenGoogleSearch} className="rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-amber-50 hover:bg-[#3f2b24]">Open Google Search</button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Price research low EUR" value={item.priceResearchLow || item.researchedLowPrice || ""} onChange={(e) => onChange({ ...item, priceResearchLow: e.target.value, researchedLowPrice: e.target.value })} />
        <Input label="Price research mid EUR" value={item.priceResearchMid || item.researchedMidPrice || ""} onChange={(e) => onChange({ ...item, priceResearchMid: e.target.value, researchedMidPrice: e.target.value })} />
        <Input label="Price research high EUR" value={item.priceResearchHigh || item.researchedHighPrice || ""} onChange={(e) => onChange({ ...item, priceResearchHigh: e.target.value, researchedHighPrice: e.target.value })} />
        <Input label="Suggested listing price EUR" value={item.suggestedListingPrice || ""} onChange={(e) => onChange({ ...item, suggestedListingPrice: e.target.value })} />
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Research Notes</span>
        <textarea value={item.researchNotes || ""} onChange={(e) => onChange({ ...item, researchNotes: e.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
      </label>
    </div>
  );
}

function TranslationButtons({ onTranslate }) {
  const buttonClass = "rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-orange-900 hover:bg-orange-50";
  return (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" onClick={() => onTranslate("de")} className={buttonClass}>Translate DE</button>
      <button type="button" onClick={() => onTranslate("en")} className={buttonClass}>Translate EN</button>
      <button type="button" onClick={() => onTranslate("deepl")} className={buttonClass}>Open DeepL</button>
    </div>
  );
}

export default function ResellerItApp() {
  const [items, setItems] = useState(loadInitialItems);
  const [expenses, setExpenses] = useState(loadInitialExpenses);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseMonthFilter, setExpenseMonthFilter] = useState(CURRENT_MONTH);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("All categories");
  const [ebayImportBatches, setEbayImportBatches] = useState(loadEbayImportBatches);
  const [importMonth, setImportMonth] = useState(CURRENT_MONTH);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvError, setCsvError] = useState("");
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stockSection, setStockSection] = useState("needsAttention");
  const [financeSection, setFinanceSection] = useState("thisMonth");
  const [classificationFilter, setClassificationFilter] = useState("All classifications");
  const [expandedProofId, setExpandedProofId] = useState(null);
  const [advancedFeesOpen, setAdvancedFeesOpen] = useState(false);
  const [activeAdvancedSection, setActiveAdvancedSection] = useState("");
  const [closingMonth, setClosingMonth] = useState(CURRENT_MONTH);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryClassification, setInventoryClassification] = useState("All classifications");
  const [inventoryStatus, setInventoryStatus] = useState("All statuses");
  const [inventoryCategory, setInventoryCategory] = useState("All categories");
  const [inventoryIssueFilter, setInventoryIssueFilter] = useState("All items");
  const [inventorySort, setInventorySort] = useState("Newest purchase date");
  const [inventoryTimelineGrouping, setInventoryTimelineGrouping] = useState("Month");
  const [inventoryTimelineMonth, setInventoryTimelineMonth] = useState("");
  const [stockViewMode, setStockViewMode] = useState("Detailed view");
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [advancedInventoryFiltersOpen, setAdvancedInventoryFiltersOpen] = useState(false);
  const [stockFilterMenu, setStockFilterMenu] = useState("");
  const [expandedCardPanel, setExpandedCardPanel] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [backupMenuOpen, setBackupMenuOpen] = useState(false);
  const [expandedEigenbelegId, setExpandedEigenbelegId] = useState(null);
  const [activeWorkflowSection, setActiveWorkflowSection] = useState("source");
  const [marketResearchOpen, setMarketResearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [searchQueryManuallyEdited, setSearchQueryManuallyEdited] = useState(false);
  const [quickAddItem, setQuickAddItem] = useState({
    purchaseDate: CURRENT_DATE,
    name: "",
    sourceName: "",
    purchasePrice: "",
    classification: "Business Stock / Resale Inventory",
  });

  useEffect(() => {
    if (!editingId && !itemFormOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setEditingId(null);
        setForm(emptyItem);
        setSearchQueryManuallyEdited(false);
        setItemFormOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId, itemFormOpen]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  function persist(nextItems) {
    const normalizedItems = normalizeItems(nextItems);
    setItems(normalizedItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: normalizedItems, expenses, updatedAt: new Date().toISOString() }));
  }

  function persistAll(nextItems, nextExpenses) {
    const normalizedItems = normalizeItems(nextItems);
    setItems(normalizedItems);
    setExpenses(nextExpenses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: normalizedItems, expenses: nextExpenses, updatedAt: new Date().toISOString() }));
  }

  function persistExpenses(nextExpenses) {
    persistAll(items, nextExpenses);
  }

  function saveCurrentItem() {
    if (!form.name.trim()) return;
    const cleanLanguage = normalizeListingLanguageValue(form);
    const clean = {
      ...form,
      name: form.name.trim(),
      classification: form.classification || DEFAULT_CLASSIFICATION,
      ebayFeeMode: form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE,
      language: cleanLanguage,
      listingLanguage: languageLabel(cleanLanguage),
      sizeSpecs: form.sizeSpecs || form.measurements || "",
      measurements: form.measurements || form.sizeSpecs || "",
      includedItems: form.includedItems || form.includedAccessories || "",
      includedAccessories: form.includedAccessories || form.includedItems || "",
      researchedLowPrice: form.researchedLowPrice || form.priceResearchLow || "",
      researchedMidPrice: form.researchedMidPrice || form.priceResearchMid || "",
      researchedHighPrice: form.researchedHighPrice || form.priceResearchHigh || "",
      priceResearchLow: form.priceResearchLow || form.researchedLowPrice || "",
      priceResearchMid: form.priceResearchMid || form.researchedMidPrice || "",
      priceResearchHigh: form.priceResearchHigh || form.researchedHighPrice || "",
      photoChecklist: normalizeBooleanRecord(form.photoChecklist, defaultPhotoChecklist),
      defectDisclosure: normalizeBooleanRecord(form.defectDisclosure, defaultDefectDisclosure),
      estimatedEbayFee: form.ebayFeeMode === "Business Estimate" ? String(ebayBaseFee(form)) : form.estimatedEbayFee,
      priceResearchUpdatedAt: form.researchQuery || form.priceResearchLow || form.priceResearchMid || form.priceResearchHigh || form.researchedLowPrice || form.researchedMidPrice || form.researchedHighPrice || form.chosenListingPrice || form.priceResearchNotes
        ? new Date().toISOString()
        : form.priceResearchUpdatedAt,
    };
    const next = editingId
      ? items.map((item) => (item.id === editingId ? { ...item, ...clean } : item))
      : [{ id: crypto.randomUUID(), ...clean }, ...items];
    persist(next);
    setForm(emptyItem);
    setSearchQueryManuallyEdited(false);
    setEditingId(null);
    setItemFormOpen(false);
  }

  function saveItem(e) {
    e.preventDefault();
    saveCurrentItem();
  }

  function updateQuickProofStatus(value) {
    if (value === "Proof available") {
      setForm({ ...form, hasReceipt: "Yes", receiptType: "Shop receipt", proofType: "Shop receipt" });
    } else if (value === "External proof recorded") {
      setForm({ ...form, hasReceipt: "Yes", proofStoredExternally: "Yes", receiptType: form.receiptType || "Shop receipt", proofType: form.proofType || "Shop receipt" });
    } else if (value === "Eigenbeleg needed") {
      setForm({ ...form, hasReceipt: "No", receiptType: "Eigenbeleg needed", proofType: "Eigenbeleg" });
    } else {
      setForm({ ...form, hasReceipt: "No", receiptType: "", proofType: "", proofStoredExternally: "No" });
    }
  }

  function editItem(item) {
    const normalized = normalizeItem(item);
    const title = normalized.ebayTitle || normalized.listingTitle || "";
    setForm({ ...normalized, researchQuery: normalized.researchQuery || title });
    setSearchQueryManuallyEdited(Boolean(normalized.researchQuery && normalized.researchQuery !== title));
    setEditingId(item.id);
    setAdvancedFeesOpen(false);
    setItemFormOpen(true);
    setActiveWorkflowSection("source");
  }

  function openNewItemEditor() {
    setForm({
      ...emptyItem,
      purchaseDate: CURRENT_DATE,
      status: "Draft",
      classification: "Private Sale / Personal Collection",
      carrier: "DHL",
      language: "de",
      listingLanguage: "German",
      hasReceipt: "No",
      proofStoredExternally: "No",
    });
    setEditingId(null);
    setAdvancedFeesOpen(false);
    setSearchQueryManuallyEdited(false);
    setItemFormOpen(true);
    setActiveWorkflowSection("source");
  }

  function createQuickLedgerItem({ openEditor = false } = {}) {
    if (!quickAddItem.name.trim()) return;
    const newItem = {
      ...emptyItem,
      id: crypto.randomUUID(),
      purchaseDate: quickAddItem.purchaseDate || CURRENT_DATE,
      name: quickAddItem.name.trim(),
      sourceName: quickAddItem.sourceName.trim(),
      purchasePrice: quickAddItem.purchasePrice,
      classification: quickAddItem.classification || "Business Stock / Resale Inventory",
      status: "Draft",
      hasReceipt: "No",
      receiptType: "",
      proofType: "",
      proofStoredExternally: "No",
      listingTitle: "",
      ebayTitle: "",
      conditionText: "",
      descriptionText: "",
      htmlDescription: "",
      generatedPlainDescription: "",
      generatedHtmlDescription: "",
    };
    persist([newItem, ...items]);
    setQuickAddItem({
      purchaseDate: CURRENT_DATE,
      name: "",
      sourceName: "",
      purchasePrice: "",
      classification: newItem.classification,
    });
    if (openEditor) editItem(newItem);
  }

  function closeItemEditor() {
    setEditingId(null);
    setForm(emptyItem);
    setSearchQueryManuallyEdited(false);
    setItemFormOpen(false);
  }

  function openStockQueue(section, issueFilter = "All items", status = "All statuses") {
    setActiveTab("stock");
    setStockSection(section);
    setInventoryIssueFilter(issueFilter);
    setInventoryStatus(status);
    if (section === "readyToList") setInventoryStatus("Ready to List");
  }

  function openSalesQueue() {
    setActiveTab("sales");
  }

  function openFinanceQueue(section) {
    setActiveTab("finance");
    setFinanceSection(section);
  }

  function deleteItem(id) {
    persist(items.filter((item) => item.id !== id));
  }

  function saveExpense(e) {
    e.preventDefault();
    if (!expenseForm.description.trim() || !expenseForm.amount) return;
    const clean = { ...expenseForm, description: expenseForm.description.trim() };
    const nextExpenses = editingExpenseId
      ? expenses.map((expense) => (expense.id === editingExpenseId ? { ...expense, ...clean } : expense))
      : [{ id: crypto.randomUUID(), ...clean }, ...expenses];
    persistExpenses(nextExpenses);
    setExpenseForm(emptyExpense);
    setEditingExpenseId(null);
  }

  function editExpense(expense) {
    setExpenseForm({ ...emptyExpense, ...expense });
    setEditingExpenseId(expense.id);
  }

  function deleteExpense(id) {
    persistExpenses(expenses.filter((expense) => expense.id !== id));
  }

  function updateItemStatus(id, status) {
    persist(items.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function updateItemField(id, field, value) {
    persist(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function updateItemProofStatus(id, value) {
    persist(items.map((item) => {
      if (item.id !== id) return item;
      if (value === "OK") return { ...item, hasReceipt: "Yes", receiptType: item.receiptType || "Shop receipt", proofType: item.proofType || "Shop receipt" };
      if (value === "Eigenbeleg") return { ...item, hasReceipt: "No", receiptType: "Eigenbeleg needed", proofType: "Eigenbeleg", proofStoredExternally: "No" };
      return { ...item, hasReceipt: "No", receiptType: "", proofType: "", proofStoredExternally: "No", proofFileName: "", proofFolderLocation: "", proofImageDataUrl: "", proofNotes: "" };
    }));
  }

  function updateItemListingStatus(id, value) {
    persist(items.map((item) => {
      if (item.id !== id) return item;
      if (value === "Ready") {
        const draft = generateListingDraft(item);
        return {
          ...item,
          listingTitle: item.listingTitle || draft.title,
          ebayTitle: item.ebayTitle || draft.title,
          conditionText: item.conditionText || draft.condition,
          descriptionText: item.descriptionText || draft.description,
          htmlDescription: item.htmlDescription || draft.htmlDescription,
          generatedPlainDescription: item.generatedPlainDescription || draft.description,
          generatedHtmlDescription: item.generatedHtmlDescription || draft.htmlDescription,
        };
      }
      return { ...item, listingTitle: "", conditionText: "", descriptionText: "", htmlDescription: "", generatedPlainDescription: "", generatedHtmlDescription: "" };
    }));
  }

  function duplicateItem(item) {
    const copy = {
      ...emptyItem,
      ...item,
      id: crypto.randomUUID(),
      name: `${item.name} copy`,
      status: "Draft",
      saleDate: "",
      salePrice: "",
      finalSalePrice: "",
      importedAt: undefined,
    };
    persist([copy, ...items]);
  }

  function exportJson() {
    const data = JSON.stringify({ type: "RESELLERIT_BACKUP", version: 1, items, expenses, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reseller-it-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBackupJson(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setBackupMessage("");

    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setBackupMessage("Import failed: please choose a JSON backup file.");
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      const validType = parsed?.type === "RESELLERIT_BACKUP" || parsed?.type === "RESELLIT_BACKUP";
      const hasItems = Array.isArray(parsed?.items);
      const hasExpenses = Array.isArray(parsed?.expenses);

      if (!validType || (!hasItems && !hasExpenses)) {
        setBackupMessage("Import failed: this does not look like a ResellIt backup with items and/or expenses.");
        return;
      }

      const nextItems = hasItems ? parsed.items : [];
      const nextExpenses = hasExpenses ? parsed.expenses : [];
      const ok = window.confirm(`Restore this ResellIt backup?\n\nCurrent data will be replaced with ${nextItems.length} items and ${nextExpenses.length} expenses.`);
      if (!ok) {
        setBackupMessage("Import cancelled.");
        return;
      }

      persistAll(nextItems, nextExpenses);
      setForm(emptyItem);
      setExpenseForm(emptyExpense);
      setEditingId(null);
      setEditingExpenseId(null);
      setBackupMessage(`Import complete: restored ${nextItems.length} items and ${nextExpenses.length} expenses.`);
    } catch {
      setBackupMessage("Import failed: could not read or parse this JSON file.");
    }
  }

  function exportMonthlyClosingJson() {
    const data = JSON.stringify({ type: "RESELLIT_MONTHLY_CLOSING", version: 1, month: closingMonth, summary: monthlyClosing, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resellit-monthly-closing-${closingMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function persistEbayImportBatches(nextBatches) {
    setEbayImportBatches(nextBatches);
    localStorage.setItem(EBAY_IMPORTS_KEY, JSON.stringify({ version: 1, batches: nextBatches, updatedAt: new Date().toISOString() }));
  }

  async function handleCsvUpload(e) {
    const file = e.target.files?.[0];
    setCsvError("");

    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvPreview(null);
      setCsvError("Please choose a CSV file.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCsvText(text);
      if (!parsed.columns.length) {
        setCsvPreview(null);
        setCsvError("The CSV file did not contain any rows.");
        return;
      }
      setCsvPreview({ ...parsed, fileName: file.name });
    } catch {
      setCsvPreview(null);
      setCsvError("Could not read this CSV file locally.");
    }
  }

  function saveCsvBatch() {
    if (!csvPreview) return;
    const nextBatch = {
      id: crypto.randomUUID(),
      month: importMonth,
      sourceFileName: csvPreview.fileName,
      importedAt: new Date().toISOString(),
      columns: csvPreview.columns,
      rows: csvPreview.rows,
    };
    persistEbayImportBatches([nextBatch, ...ebayImportBatches]);
    setCsvPreview(null);
    setCsvError("");
  }

  function deleteCsvBatch(id) {
    persistEbayImportBatches(ebayImportBatches.filter((batch) => batch.id !== id));
  }

  function handleProofImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, proofImageDataUrl: String(reader.result || ""), proofImageName: file.name });
    };
    reader.readAsDataURL(file);
  }

  const summary = useMemo(() => {
    const purchaseTotal = items.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = items.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0);
    const feesTotal = items.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0);
    const profit = items.reduce((sum, item) => sum + itemProfitValue(item), 0);
    const sold = items.filter(isSoldStatus).length;
    const eigenbeleg = items.filter((item) => item.hasReceipt === "No").length;
    return { purchaseTotal, salesTotal, feesTotal, profit, sold, eigenbeleg };
  }, [items]);

  const classificationCounts = useMemo(() => (
    classificationOptions.reduce((counts, classification) => {
      counts[classification] = items.filter((item) => itemClassification(item) === classification).length;
      return counts;
    }, {})
  ), [items]);

  const categoryOptions = useMemo(() => (
    Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  ), [items]);

  const inventoryHealth = useMemo(() => {
    const unsoldItems = items.filter((item) => !isSoldStatus(item));
    return {
      totalItems: items.length,
      unsoldInventoryValue: unsoldItems.reduce((sum, item) => sum + number(item.purchasePrice), 0),
      missingProofCount: items.filter(needsProofRecord).length,
      missingPriceResearchCount: items.filter((item) => !hasPriceResearch(item)).length,
      missingListingDraftCount: items.filter((item) => !hasListingDraft(item)).length,
      reviewLaterCount: items.filter((item) => itemClassification(item) === DEFAULT_CLASSIFICATION).length,
    };
  }, [items]);

  const todayWorkflow = useMemo(() => ({
    toResearch: items.filter((item) => !hasPriceResearch(item) && !isSoldStatus(item)),
    readyToList: items.filter((item) => itemStatus(item) === "Ready to List"),
    soldNotShipped: items.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatus(item))),
    missingProof: items.filter(needsProofRecord),
    needsListing: items.filter((item) => !hasListingDraft(item) && !isSoldStatus(item)),
  }), [items]);

  const salesWorkflow = useMemo(() => {
    const salesItems = items.filter(isSoldStatus);
    return {
      items: salesItems,
      awaitingShipment: salesItems.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatus(item))),
      shippedItems: salesItems.filter((item) => itemStatus(item) === "Shipped" || item.trackingNumber || item.shippedDate),
      completedSales: salesItems.filter((item) => itemStatus(item) === "Completed").slice(0, 6),
      problemItems: salesItems.filter((item) => itemStatus(item) === "Returned" || itemStatus(item) === "Refunded" || item.status === "Written Off"),
      counts: shippingWorkflowStatuses.reduce((counts, status) => {
        counts[status] = salesItems.filter((item) => itemStatus(item) === status).length;
        return counts;
      }, {}),
    };
  }, [items]);

  const shippingTrackerGroups = useMemo(() => {
    const shipmentItems = items.filter(isSoldStatus);
    return [
      ["Sold not shipped", shipmentItems.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatus(item)))],
      ["Shipped / Tracking", shipmentItems.filter((item) => {
        const status = itemStatus(item);
        return status === "Shipped" || (Boolean(item.trackingNumber || item.shippedDate) && !["Sold", "Paid", "Ready to Pack", "Packed", "Completed", "Returned", "Refunded", "Written Off"].includes(status));
      })],
      ["Returned / Problem", shipmentItems.filter((item) => itemStatus(item) === "Returned" || itemStatus(item) === "Refunded" || itemStatus(item) === "Written Off")],
    ];
  }, [items]);

  const sectionSummaries = useMemo(() => {
    const monthlyExpenses = expenses.filter((expense) => inMonth(expense.date));
    const monthlySales = items.filter((item) => inMonth(item.saleDate));
    const revenue = monthlySales.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0);
    const fees = monthlySales.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0);
    const profit = monthlySales.reduce((sum, item) => sum + itemProfitValue(item), 0);
    const expenseTotal = monthlyExpenses.reduce((sum, expense) => sum + number(expense.amount), 0);
    const packedOrShippedToday = items.filter((item) => (
      itemStatus(item) === "Packed" || (itemStatus(item) === "Shipped" && item.shippedDate === CURRENT_DATE)
    ));
    return {
      stock: {
        inventoryValue: items.filter((item) => !isSoldStatus(item)).reduce((sum, item) => sum + number(item.purchasePrice), 0),
        readyToList: items.filter((item) => itemStatus(item) === "Ready to List").length,
        missingProof: items.filter(needsProofRecord).length,
        recentSourcing: items.filter((item) => inMonth(item.purchaseDate)).length,
      },
      sales: {
        awaitingShipment: items.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatus(item))).length,
        packedOrShippedToday: packedOrShippedToday.length,
        returnsIssues: items.filter((item) => itemStatus(item) === "Returned" || itemStatus(item) === "Refunded" || itemStatus(item) === "Written Off").length,
        recentCompleted: items.filter((item) => itemStatus(item) === "Completed").slice(0, 6).length,
      },
      finance: {
        revenue,
        expenses: expenseTotal,
        estimatedProfit: profit - expenseTotal,
        pendingPayout: Math.max(0, revenue - fees),
      },
    };
  }, [expenses, items]);

  const inventoryManagerItems = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    const filteredItems = items.filter((item) => {
      const searchText = [item.name, item.category, item.ebayTitle, item.sourceName, item.sourceLocation, item.listingTitle].join(" ").toLowerCase();
      if (query && !searchText.includes(query)) return false;
      if (inventoryClassification !== "All classifications" && itemClassification(item) !== inventoryClassification) return false;
      if (inventoryStatus !== "All statuses" && itemStatus(item) !== inventoryStatus) return false;
      if (inventoryCategory !== "All categories" && item.category !== inventoryCategory) return false;
      if (inventoryIssueFilter === "Missing proof" && !needsProofRecord(item)) return false;
      if (inventoryIssueFilter === "Missing price research" && hasPriceResearch(item)) return false;
      if (inventoryIssueFilter === "Missing listing draft" && hasListingDraft(item)) return false;
      if (inventoryIssueFilter === "Review later" && itemClassification(item) !== DEFAULT_CLASSIFICATION) return false;
      if (inventoryIssueFilter === "Sold only" && !isSoldStatus(item)) return false;
      if (inventoryIssueFilter === "Unsold only" && isSoldStatus(item)) return false;
      return true;
    });

    return [...filteredItems].sort((a, b) => {
      if (inventorySort === "Oldest purchase date") return String(a.purchaseDate || "").localeCompare(String(b.purchaseDate || ""));
      if (inventorySort === "Highest expected/listing value") return expectedListingValue(b) - expectedListingValue(a);
      if (inventorySort === "Highest final sale price") return finalSaleValue(b) - finalSaleValue(a);
      if (inventorySort === "Highest estimated profit") return itemProfitValue(b) - itemProfitValue(a);
      if (inventorySort === "Missing proof first") return Number(!needsProofRecord(a)) - Number(!needsProofRecord(b));
      return String(b.purchaseDate || "").localeCompare(String(a.purchaseDate || ""));
    });
  }, [inventoryCategory, inventoryClassification, inventoryIssueFilter, inventorySearch, inventorySort, inventoryStatus, items]);

  const stockTimelineItems = useMemo(() => {
    return inventoryManagerItems
      .filter((item) => !inventoryTimelineMonth || inMonth(item.purchaseDate, inventoryTimelineMonth))
      .sort((a, b) => String(b.purchaseDate || "").localeCompare(String(a.purchaseDate || "")));
  }, [inventoryManagerItems, inventoryTimelineMonth]);

  const stockTimelineGroups = useMemo(() => {
    const groups = new Map();
    stockTimelineItems.forEach((item) => {
      const label = timelineGroupLabel(item.purchaseDate, inventoryTimelineGrouping);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(item);
    });
    return Array.from(groups.entries());
  }, [inventoryTimelineGrouping, stockTimelineItems]);

  const stockTimelineTotals = useMemo(() => ({
    itemCount: stockTimelineItems.length,
    purchaseTotal: stockTimelineItems.reduce((sum, item) => sum + number(item.purchasePrice), 0),
    soldTotal: stockTimelineItems.reduce((sum, item) => sum + finalSaleValue(item), 0),
    profitTotal: stockTimelineItems.reduce((sum, item) => sum + itemProfitValue(item), 0),
    unsoldCount: stockTimelineItems.filter((item) => !isSoldStatus(item)).length,
    missingProofCount: stockTimelineItems.filter(needsProofRecord).length,
  }), [stockTimelineItems]);

  const stockActiveFilterCount = [
    inventorySearch.trim(),
    inventoryTimelineGrouping !== "Month",
    inventoryClassification !== "All classifications",
    inventoryStatus !== "All statuses",
    inventoryTimelineMonth,
    inventoryCategory !== "All categories",
    inventoryIssueFilter !== "All items",
  ].filter(Boolean).length;
  const activeWorkflowIndex = Math.max(0, workflowSections.findIndex(([key]) => key === activeWorkflowSection));
  const previousWorkflowStep = workflowSections[activeWorkflowIndex - 1];
  const nextWorkflowStep = workflowSections[activeWorkflowIndex + 1];
  const activeItemFormMode = activeWorkflowSection === "listing" ? "listing" : "inventory";

  const stockSectionItems = useMemo(() => {
    if (stockSection === "needsAttention") {
      return inventoryManagerItems.filter((item) => needsProofRecord(item) || !hasPriceResearch(item) || !hasListingDraft(item) || itemClassification(item) === DEFAULT_CLASSIFICATION);
    }
    if (stockSection === "readyToList") {
      return inventoryManagerItems.filter((item) => itemStatus(item) === "Ready to List");
    }
    return inventoryManagerItems;
  }, [inventoryManagerItems, stockSection]);

  const proofSummary = useMemo(() => ({
    totalItems: items.length,
    proofComplete: items.filter((item) => !needsProofRecord(item)).length,
    missingProof: items.filter(needsProofRecord).length,
    needsEigenbeleg: items.filter(needsEigenbeleg).length,
    externallyStored: items.filter(externallyStoredProof).length,
  }), [items]);

  const receiptRecordGroups = useMemo(() => ({
    complete: items.filter((item) => !needsProofRecord(item)),
    needsAttention: items.filter((item) => needsProofRecord(item) || needsEigenbeleg(item) || itemClassification(item) === DEFAULT_CLASSIFICATION),
    externalFiles: items.filter((item) => externallyStoredProof(item) || item.proofFileName || item.proofFolderLocation),
    expensesMissingNotes: expenses.filter((expense) => expense.receiptAvailable === "No" && !String(expense.receiptNotes || "").trim()),
  }), [expenses, items]);

  const monthlySummary = useMemo(() => {
    const monthlyPurchases = items.filter((item) => inMonth(item.purchaseDate));
    const monthlySales = items.filter((item) => inMonth(item.saleDate));
    const purchaseTotal = monthlyPurchases.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = monthlySales.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0);
    const feesTotal = monthlySales.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0);
    const profit = monthlySales.reduce((sum, item) => sum + itemProfitValue(item), 0);
    return { purchaseTotal, salesTotal, feesTotal, profit };
  }, [items]);

  const yearlySummary = useMemo(() => {
    const yearlyPurchases = items.filter((item) => inYear(item.purchaseDate));
    const yearlySales = items.filter((item) => inYear(item.saleDate));
    const yearlyExpenses = expenses.filter((expense) => inYear(expense.date));
    const purchaseTotal = yearlyPurchases.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = yearlySales.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0);
    const feesTotal = yearlySales.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0);
    const expenseTotal = yearlyExpenses.reduce((sum, expense) => sum + number(expense.amount), 0);
    const profit = yearlySales.reduce((sum, item) => sum + itemProfitValue(item), 0) - expenseTotal;
    return { purchaseTotal, salesTotal, feesTotal, expenseTotal, profit };
  }, [expenses, items]);

  const yearlyBusinessSummary = useMemo(() => {
    const businessItems = items.filter((item) => itemClassification(item) === "Business Stock / Resale Inventory");
    const yearlyBusinessPurchases = businessItems.filter((item) => inYear(item.purchaseDate));
    const yearlyBusinessSales = businessItems.filter((item) => inYear(item.saleDate));
    const purchaseTotal = yearlyBusinessPurchases.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = yearlyBusinessSales.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0);
    const feesTotal = yearlyBusinessSales.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0);
    const profit = yearlyBusinessSales.reduce((sum, item) => sum + itemProfitValue(item), 0);
    return { purchaseTotal, salesTotal, feesTotal, profit, soldCount: yearlyBusinessSales.length };
  }, [items]);

  const monthlyClosing = (() => {
    const purchasedItems = items.filter((item) => inMonth(item.purchaseDate, closingMonth));
    const soldItems = items.filter((item) => inMonth(item.saleDate, closingMonth));
    const monthlyExpenses = expenses.filter((expense) => inMonth(expense.date, closingMonth));
    const activityItems = items.filter((item) => inMonth(item.purchaseDate, closingMonth) || inMonth(item.saleDate, closingMonth));
    const classificationBreakdown = classificationOptions.reduce((counts, classification) => {
      counts[classification] = activityItems.filter((item) => itemClassification(item) === classification).length;
      return counts;
    }, {});
    const salesTotal = soldItems.reduce((sum, item) => sum + finalSaleValue(item), 0);
    const purchaseTotal = purchasedItems.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const shippingCharged = soldItems.reduce((sum, item) => sum + shippingChargedValue(item), 0);
    const actualShippingCosts = soldItems.reduce((sum, item) => sum + actualShippingValue(item), 0);
    const packagingCosts = soldItems.reduce((sum, item) => sum + packagingCostValue(item), 0);
    const platformFeeTotal = soldItems.reduce((sum, item) => sum + platformFees(item), 0);
    const refundTotal = soldItems.reduce((sum, item) => sum + refundValue(item), 0);
    const expenseTotal = monthlyExpenses.reduce((sum, expense) => sum + number(expense.amount), 0);
    const profitEstimate = soldItems.reduce((sum, item) => sum + itemProfitValue(item), 0) - expenseTotal;
    const missingProofItems = activityItems.filter(needsProofRecord);
    const reviewItems = activityItems.filter((item) => itemClassification(item) === DEFAULT_CLASSIFICATION);

    return {
      month: closingMonth,
      salesTotal,
      purchaseTotal,
      shippingCharged,
      actualShippingCosts,
      packagingCosts,
      platformFeeTotal,
      refundTotal,
      expenseTotal,
      profitEstimate,
      classificationBreakdown,
      missingProofItems,
      reviewItems,
      purchasedCount: purchasedItems.length,
      soldCount: soldItems.length,
      activityCount: activityItems.length,
      expenseCount: monthlyExpenses.length,
    };
  })();

  const workflowQueues = useMemo(() => ({
    needsProof: items.filter(needsProofRecord),
    needsResearch: items.filter((item) => !hasPriceResearch(item) && !isSoldStatus(item)),
    needsListing: items.filter((item) => !hasListingDraft(item) && !isSoldStatus(item)),
    readyToList: items.filter((item) => itemStatus(item) === "Ready to List"),
    needsShipping: items.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatus(item))),
    needsTaxReview: items.filter((item) => needsProofRecord(item) || needsEigenbeleg(item) || itemClassification(item) === DEFAULT_CLASSIFICATION),
  }), [items]);

  const taxRecordQueues = useMemo(() => ({
    missingProof: items.filter(needsProofRecord),
    eigenbelegNeeded: items.filter(needsEigenbeleg),
    expensesWithoutReceiptNote: expenses.filter((expense) => expense.receiptAvailable === "No" && !String(expense.receiptNotes || "").trim()),
    reviewLater: items.filter((item) => itemClassification(item) === DEFAULT_CLASSIFICATION),
  }), [expenses, items]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (expenseMonthFilter && !inMonth(expense.date, expenseMonthFilter)) return false;
      if (expenseCategoryFilter !== "All categories" && expense.category !== expenseCategoryFilter) return false;
      return true;
    });
  }, [expenseCategoryFilter, expenseMonthFilter, expenses]);

  const filteredExpenseTotal = useMemo(() => (
    filteredExpenses.reduce((sum, expense) => sum + number(expense.amount), 0)
  ), [filteredExpenses]);

  const filtered = useMemo(() => {
    const nextItems = (() => {
      if (activeTab === "dashboard") return [];
      if (activeTab === "stock" && stockSection === "needsAttention") return items.filter((item) => needsProofRecord(item) || !hasPriceResearch(item) || !hasListingDraft(item) || itemClassification(item) === DEFAULT_CLASSIFICATION);
      if (activeTab === "stock" && stockSection === "readyToList") return items.filter((item) => itemStatus(item) === "Ready to List");
      if (activeTab === "sales") return items.filter((item) => ["Sold", "Paid", "Shipped", "Completed", "Returned", "Refunded"].includes(itemStatus(item)) || isSoldStatus(item));
      if (activeTab === "finance" && financeSection === "taxRecords") return items.filter((item) => needsProofRecord(item) || needsEigenbeleg(item) || itemClassification(item) === DEFAULT_CLASSIFICATION);
      return items;
    })();

    if (classificationFilter === "All classifications") return nextItems;
    return nextItems.filter((item) => itemClassification(item) === classificationFilter);
  }, [activeTab, classificationFilter, financeSection, items, stockSection]);

  const eigenbelegText = (item) => `Eigenbeleg / Self-Receipt\n\nDate: ${item.proofDate || item.purchaseDate}\nItem: ${item.name}\nClassification: ${itemClassification(item)}\nSource: ${item.sourceType} - ${item.sourceName || "private seller"}\nLocation: ${item.sourceLocation}\nPurchase price / proof amount: ${money(item.proofAmount || item.purchasePrice)}\nPayment method: ${item.paymentMethod}\nReason no invoice: ${item.noReceiptReason || "Private second-hand / flea-market purchase; no formal receipt available."}\nProof notes: ${item.proofNotes || item.notes || "-"}\n\nSigned: ______________________`;

  async function copyEigenbeleg(item) {
    try {
      await navigator.clipboard.writeText(eigenbelegText(item));
    } catch {
      window.prompt("Copy Eigenbeleg text", eigenbelegText(item));
    }
  }

  function generateCurrentListingDraft() {
    const draft = generateListingDraft(form, { preferSaved: false });
    const hasManualCondition = Boolean(String(form.conditionText || "").trim());
    const syncedResearchQuery = searchQueryManuallyEdited ? form.researchQuery : draft.title;
    setForm({
      ...form,
      listingTitle: draft.title,
      ebayTitle: draft.title,
      researchQuery: syncedResearchQuery,
      conditionText: hasManualCondition ? form.conditionText : generatedConditionBaseText(form),
      descriptionText: draft.description,
      htmlDescription: draft.htmlDescription,
      generatedPlainDescription: draft.description,
      generatedHtmlDescription: draft.htmlDescription,
    });
  }

  function generateFullListingPack() {
    const shippingNotes = form.shippingNotes || (isGermanListing(form) ? "Versicherter Versand mit Sendungsverfolgung. Abholung nach Absprache moeglich." : "Tracked shipping. Local pickup possible by arrangement.");
    const packSource = { ...form, shippingNotes, conditionText: generatedConditionBaseText(form) };
    const draft = generateListingDraft(packSource, { preferSaved: false });
    const condition = generatedConditionText(packSource);
    const syncedResearchQuery = searchQueryManuallyEdited ? form.researchQuery : draft.title;
    setForm({
      ...form,
      listingTitle: draft.title,
      ebayTitle: draft.title,
      researchQuery: syncedResearchQuery,
      conditionText: condition,
      descriptionText: draft.description,
      htmlDescription: draft.htmlDescription,
      generatedPlainDescription: draft.description,
      generatedHtmlDescription: draft.htmlDescription,
      shippingNotes,
    });
  }

  function updateListingTitle(value) {
    setForm({
      ...form,
      ebayTitle: value,
      listingTitle: value,
      researchQuery: searchQueryManuallyEdited ? form.researchQuery : value,
    });
  }

  function updateResearchQuery(value) {
    setSearchQueryManuallyEdited(true);
    setForm({ ...form, researchQuery: value });
  }

  function useEbayTitleForResearch() {
    const title = form.ebayTitle || form.listingTitle || generatedListingTitle(form);
    setSearchQueryManuallyEdited(false);
    setForm({ ...form, researchQuery: title });
  }

  function openGoogleResearchSearch() {
    const query = String(form.researchQuery || "").trim();
    if (!query) {
      setToastMessage("Search Query is empty.");
      return;
    }
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {
      window.prompt(`Copy ${label}`, text || "");
    }
  }

  async function openTranslator(target, text) {
    await copyText("translator text", text);
    const translatorUrl = target === "deepl"
      ? "https://www.deepl.com/translator"
      : `https://translate.google.com/?sl=auto&tl=${target}&op=translate`;
    window.open(translatorUrl, "_blank", "noopener,noreferrer");
    setToastMessage("Text copied. Paste into translator.");
  }

  const activeModule = modules.find(([key]) => key === activeTab);
  const activeTitle = activeModule?.[1] || "Dashboard";
  const formListingLabels = listingLabels(form);
  const formListingSectionHeadings = listingSectionHeadings(form);
  const conditionDescriptionLabel = isGermanListing(form) ? "Zustandsbeschreibung" : "Condition description";
  const conditionDefectsLabel = isGermanListing(form) ? "Mängel / Gebrauchsspuren" : "Defects / wear";

  return (
    <div className="min-h-screen bg-[#24120f] p-3 text-stone-900 sm:p-4 md:p-5">
      {toastMessage && (
        <div className="fixed right-4 top-4 z-[70] rounded-2xl border border-[#f0be45]/40 bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-stone-900 shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
          {toastMessage}
        </div>
      )}
      <div className="mx-auto grid max-w-[1680px] gap-4 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[2rem] border border-[#5a3028] bg-[#351c17] shadow-[0_20px_60px_rgba(0,0,0,0.28)] lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-auto">
          <div className="flex h-3">
            <div className="flex-1 bg-[#b7412e]" />
            <div className="flex-1 bg-[#e06b2c]" />
            <div className="flex-1 bg-[#f0be45]" />
            <div className="flex-1 bg-[#1f9d99]" />
          </div>
          <div className="space-y-4 p-4 md:p-5 lg:p-4">
          <div className="space-y-3.5">
            <div>
              <div className="bg-transparent px-1 pt-1 lg:px-0">
                <img src={resellItLogo} alt="Resell-It" className="mx-auto h-auto max-h-24 w-full object-contain sm:max-h-28 lg:max-h-28" />
              </div>
              <p className="-mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f0be45] sm:text-xs">THE COMPLETE RESELLER SYSTEM.</p>
            </div>
            <nav className="space-y-1.5">
              <button type="button" onClick={() => setActiveTab("dashboard")} className={`w-full overflow-hidden rounded-2xl border text-left transition-all duration-150 hover:-translate-y-0.5 ${activeTab === "dashboard" ? "border-[#f0be45]/60 bg-white/8 shadow-[0_8px_22px_rgba(240,190,69,0.12)]" : "border-[#5a3028] bg-[#45251f] hover:border-[#f0be45]/35 hover:bg-white/7"}`}>
                <div className="flex h-1.5">
                  <div className="flex-1 bg-[#b7412e]" />
                  <div className="flex-1 bg-[#e06b2c]" />
                  <div className="flex-1 bg-[#f0be45]" />
                  <div className="flex-1 bg-[#1f9d99]" />
                </div>
                <div className="px-4 py-3 lg:px-3.5 lg:py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#f0be45]">Home</p>
                  <p className="mt-0.5 text-base font-semibold text-[#fff7e8]">Dashboard</p>
                </div>
              </button>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {modules.map(([key, label, stripeClass, accentClass, activeTextClass, activeBgClass, hoverClass]) => (
                  <button key={key} onClick={() => setActiveTab(key)} className={`overflow-hidden rounded-2xl border text-left transition-all duration-150 hover:-translate-y-0.5 ${activeTab === key ? `${activeBgClass} ${activeTextClass} shadow-[0_8px_18px_rgba(0,0,0,0.16)]` : `border-[#5a3028] bg-[#45251f] text-[#f3e6d6] ${hoverClass}`}`}>
                    <div className={`h-1.5 ${stripeClass}`} />
                    <div className="px-3 py-2.5 lg:px-2.5 lg:py-2.5">
                      <p className={`text-[11px] font-semibold uppercase tracking-wide ${activeTab === key ? activeTextClass : accentClass}`}>Section</p>
                      <p className="mt-0.5 text-sm font-semibold">{label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </nav>

            <div className="rounded-3xl border border-[#5a3028] bg-[#45251f] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#f0be45]">Quick actions</p>
              <div className="grid gap-2">
                <button type="button" onClick={openNewItemEditor} className="rounded-xl border border-[#6c3a31] bg-[#351c17] px-3 py-2 text-left text-xs font-semibold text-[#fff7e8] hover:-translate-y-0.5 hover:bg-[#523029] hover:shadow-[0_8px_18px_rgba(0,0,0,0.16)]">Quick Add item</button>
                <button type="button" onClick={() => openStockQueue("needsAttention")} className="rounded-xl border border-[#6c3a31] bg-[#351c17] px-3 py-2 text-left text-xs font-semibold text-[#fff7e8] hover:-translate-y-0.5 hover:bg-[#523029] hover:shadow-[0_8px_18px_rgba(0,0,0,0.16)]">Open Stock Control</button>
                <button type="button" onClick={openSalesQueue} className="rounded-xl border border-[#6c3a31] bg-[#351c17] px-3 py-2 text-left text-xs font-semibold text-[#fff7e8] hover:-translate-y-0.5 hover:bg-[#523029] hover:shadow-[0_8px_18px_rgba(0,0,0,0.16)]">Sales & shipping queue</button>
              </div>
            </div>

            <div className="relative flex w-full flex-col items-start gap-2">
              <button type="button" onClick={() => setBackupMenuOpen(!backupMenuOpen)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#6c3a31] bg-[#45251f] px-3 py-2 text-xs font-semibold text-[#fff7e8] transition hover:bg-[#523029] sm:w-auto">
                <Download size={14} /> Backup
              </button>
              {backupMenuOpen && (
                <div className="z-10 w-full rounded-2xl border border-[#6c3a31] bg-[#fffaf0] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.22)] lg:absolute lg:left-0 lg:top-11">
                  <button type="button" onClick={() => { exportJson(); setBackupMenuOpen(false); }} className="flex w-full items-center justify-start rounded-xl px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100">
                    Export Backup
                  </button>
                  <label className="flex w-full cursor-pointer items-center justify-start rounded-xl px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100">
                    Import Backup
                    <input type="file" accept="application/json,.json" onChange={(e) => { importBackupJson(e); setBackupMenuOpen(false); }} className="hidden" />
                  </label>
                </div>
              )}
              {backupMessage && <p className="max-w-sm text-xs font-medium text-[#d8c7b5]">{backupMessage}</p>}
            </div>
          </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-4 rounded-[2rem] border border-[#eadfce] bg-[#f6efe2] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:p-5">
          <div className="premium-panel overflow-hidden rounded-3xl border border-[#eadfce] bg-[#fffaf0] shadow-sm">
            {activeTab === "dashboard" ? (
              <div className="flex h-2">
                <div className="flex-1 bg-[#b7412e]" />
                <div className="flex-1 bg-[#e06b2c]" />
                <div className="flex-1 bg-[#f0be45]" />
                <div className="flex-1 bg-[#1f9d99]" />
              </div>
            ) : (
              <div className={`h-2 ${activeModule?.[2] || "bg-[#f0be45]"}`} />
            )}
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">ResellIt Workspace</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">{activeTitle}</h1>
              </div>
              <p className="max-w-xl text-sm text-stone-600">{activeTab === "stock" ? "Master inventory ledger for all sourced, owned, listed, and sold stock." : "Clean local workspace for stock, sales, finance, and tax-prep records."}</p>
            </div>
          </div>

        {(editingId || itemFormOpen) && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1f120f]/75 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeItemEditor(); }}>
            <div className="w-full max-w-6xl" onMouseDown={(event) => event.stopPropagation()}>
        <form onSubmit={saveItem} className="premium-panel max-h-[calc(100vh-3rem)] overflow-y-auto rounded-3xl border border-[#eadfce] bg-[#fffaf0] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-4">
          <div className="mb-4 rounded-2xl border border-[#eadfce] bg-white/80 p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{editingId ? "Item editor" : "New item"}</p>
              <h2 className="mt-0.5 text-base font-semibold text-neutral-950">{editingId ? form.name || "Untitled item" : "New Item"}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-amber-50">{form.classification || DEFAULT_CLASSIFICATION}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(form)}`}>{itemStatus(form)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={closeItemEditor} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Close</button>
            </div>
            </div>
          </div>

          {(editingId || itemFormOpen) && (
            <div className="space-y-4">
              <div className="premium-card overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
                <div className="flex h-1.5">
                  <div className="flex-1 bg-[#b7412e]" />
                  <div className="flex-1 bg-[#e06b2c]" />
                  <div className="flex-1 bg-[#f0be45]" />
                  <div className="flex-1 bg-[#1f9d99]" />
                </div>
                <div className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-stone-950">{form.name || "Untitled item"}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-amber-50">{form.classification || DEFAULT_CLASSIFICATION}</span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(form)}`}>{itemStatus(form)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:min-w-[620px]">
                      <div className="rounded-xl bg-stone-50 p-2"><p className="text-xs text-stone-500">Purchase</p><p className="font-semibold">{money(form.purchasePrice)}</p></div>
                      <div className="rounded-xl bg-stone-50 p-2"><p className="text-xs text-stone-500">Sold</p><p className="font-semibold">{money(finalSaleValue(form))}</p></div>
                      <div className="rounded-xl bg-lime-50 p-2 text-lime-900"><p className="text-xs text-lime-700">Profit</p><p className="font-semibold">{money(itemProfitValue(form))}</p></div>
                      <div className="rounded-xl bg-stone-50 p-2"><p className="text-xs text-stone-500">Tax proof</p><p className="font-semibold">{needsProofRecord(form) ? "Missing" : quickProofStatus(form)}</p></div>
                      <div className="rounded-xl bg-stone-50 p-2"><p className="text-xs text-stone-500">Listing</p><p className="font-semibold">{hasListingDraft(form) ? "Ready" : "Draft"}</p></div>
                      <div className="rounded-xl bg-stone-50 p-2"><p className="text-xs text-stone-500">Status</p><p className="font-semibold">{itemStatus(form)}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 rounded-3xl border border-stone-200 bg-white p-2 shadow-sm sm:grid-cols-2">
                <button type="button" onClick={() => setActiveWorkflowSection(activeWorkflowSection === "listing" ? "source" : activeWorkflowSection)} className={`rounded-2xl px-4 py-3 text-left transition ${activeItemFormMode === "inventory" ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"}`}>
                  <p className="text-sm font-semibold">Inventory details</p>
                  <p className="mt-1 text-xs opacity-80">Source, price, proof, sale, and internal notes.</p>
                </button>
                <button type="button" onClick={() => setActiveWorkflowSection("listing")} className={`rounded-2xl px-4 py-3 text-left transition ${activeItemFormMode === "listing" ? "bg-[#e06b2c] text-[#24110e]" : "border border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100"}`}>
                  <p className="text-sm font-semibold">eBay Listing Help</p>
                  <p className="mt-1 text-xs opacity-80">Title, condition, photos, pricing notes, and copy-ready descriptions.</p>
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {workflowSections.map(([key, label, Icon, description]) => (
                  <button key={key} type="button" onClick={() => setActiveWorkflowSection(key)} className={`group rounded-2xl border p-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(41,37,36,0.1)] ${activeWorkflowSection === key ? "border-[#e06b2c]/60 bg-[#e06b2c]/20 ring-2 ring-[#e06b2c]/15" : "border-stone-200 bg-white hover:border-[#f0be45]/50 hover:bg-[#f0be45]/15"}`}>
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-amber-50 transition-colors duration-150 group-hover:bg-[#351c17]">
                      <Icon size={18} />
                    </div>
                    <p className="text-sm font-semibold text-stone-950">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
                  </button>
                ))}
              </div>

              <div className="premium-panel rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Item control center</p>
                    <h3 className="text-lg font-semibold text-stone-950">{workflowSections.find(([key]) => key === activeWorkflowSection)?.[1]}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previousWorkflowStep && <button type="button" onClick={() => setActiveWorkflowSection(previousWorkflowStep[0])} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Previous step</button>}
                    {nextWorkflowStep && <button type="button" onClick={() => setActiveWorkflowSection(nextWorkflowStep[0])} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Next step</button>}
                    <button type="button" onClick={() => saveCurrentItem()} className="rounded-2xl bg-[#e06b2c] px-4 py-3 text-sm font-semibold text-[#24110e] shadow-[0_10px_24px_rgba(224,107,44,0.18)] hover:bg-[#f0be45]">Save item</button>
                  </div>
                </div>

                {activeWorkflowSection === "source" && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input label="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                    <Select label="Classification" value={form.classification || DEFAULT_CLASSIFICATION} onChange={(e) => setForm({ ...form, classification: e.target.value, ebayFeeMode: e.target.value === "Private Sale / Personal Collection" ? DEFAULT_EBAY_FEE_MODE : form.ebayFeeMode })}>
                      {classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}
                    </Select>
                    <Select label="Source" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>
                      <option>Flea market</option><option>Second-hand shop</option><option>Private seller</option><option>Online marketplace</option><option>Other</option>
                    </Select>
                    <Input label="Source / seller" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} />
                    <Input label="Location" value={form.sourceLocation} onChange={(e) => setForm({ ...form, sourceLocation: e.target.value })} />
                    <Input label="Purchase date" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
                    <Input label="Purchase price EUR" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
                    <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {statusOptions.map((status) => <option key={status}>{status}</option>)}
                      {form.status && !statusOptions.includes(form.status) && <option>{form.status}</option>}
                    </Select>
                  </div>
                )}

                {activeWorkflowSection === "pricing" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#f0be45]/30 bg-[#f0be45]/10 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6511]">Core money</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Input label="Purchase price EUR" value={form.purchasePrice || ""} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
                        {isSoldStatus(form) && <Input label="Sold price EUR" value={form.finalSalePrice || form.salePrice || ""} onChange={(e) => setForm({ ...form, finalSalePrice: e.target.value })} />}
                        <Input label="Shipping cost EUR" value={form.actualShippingCost || form.shippingCost || ""} onChange={(e) => setForm({ ...form, actualShippingCost: e.target.value, shippingCost: e.target.value })} />
                        <Input label="Packaging cost EUR" value={form.packagingCost || ""} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} />
                        <Input label="Platform fees EUR" value={form.manualEbayFee || form.ebayFees || ""} onChange={(e) => setForm({ ...form, manualEbayFee: e.target.value, ebayFeeMode: "Manual" })} />
                      </div>
                      <p className="mt-3 rounded-xl bg-lime-100 p-3 text-sm font-semibold text-lime-800">Estimated/current profit: {money(itemProfitValue(form))}</p>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-950">Market Research (Optional)</h4>
                          <p className="mt-1 text-xs text-neutral-500">Use only when you need comps or search links.</p>
                        </div>
                        <button type="button" onClick={() => setMarketResearchOpen(!marketResearchOpen)} className="rounded-xl border border-[#f0be45]/40 px-3 py-2 text-sm font-semibold text-[#72530b] hover:bg-[#f0be45]/15">{marketResearchOpen ? "Hide" : "Show"}</button>
                      </div>
                      {marketResearchOpen && (
                        <div className="mt-3 space-y-3">
                          <Input label="Research query" value={form.researchQuery || ""} onChange={(e) => setForm({ ...form, researchQuery: e.target.value })} />
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Research notes</span>
                            <textarea value={form.priceResearchNotes || ""} onChange={(e) => setForm({ ...form, priceResearchNotes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {priceResearchLinks(form).map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{label}</a>)}
                            {priceResearchLinks(form).length === 0 && <p className="text-sm text-neutral-500">Enter an item name, eBay title, or research query to generate search links.</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeWorkflowSection === "listing" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={generateFullListingPack} className="rounded-2xl bg-orange-300 px-4 py-3 text-sm font-semibold text-stone-950 hover:bg-orange-200">Generate Full Listing Pack</button>
                      <ListingReadinessBadge item={form} />
                    </div>
                    <ListingCompleteness item={form} />
                    <ListingWarningsPanel item={form} />
                    <ResearchPanel
                      item={form}
                      onChange={setForm}
                      onCopy={copyText}
                      onOpenGoogleSearch={openGoogleResearchSearch}
                      onResearchQueryChange={updateResearchQuery}
                      onUseEbayTitle={useEbayTitleForResearch}
                    />
                    <div className="grid gap-3 lg:grid-cols-2">
                      <Select label="Language" value={normalizeListingLanguageValue(form)} onChange={(e) => setForm({ ...form, language: e.target.value, listingLanguage: languageLabel(e.target.value) })}>
                        {languageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </Select>
                      <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-3 lg:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">{formListingSectionHeadings.productDescription}</p>
                        <p className="mt-1 text-xs leading-5 text-stone-600">Describe what the item is, important features, compatibility, and general product information.</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <Input label="Brand" value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                          <Input label="Model" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                          <Input label="Measurements" value={form.measurements || form.sizeSpecs || ""} onChange={(e) => setForm({ ...form, measurements: e.target.value, sizeSpecs: e.target.value })} />
                          <Input label="Colour" value={form.colour || ""} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
                          <label className="block sm:col-span-2 lg:col-span-4">
                            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Product Description / About Text</span>
                            <textarea value={form.productDescriptionText || ""} onChange={(e) => setForm({ ...form, productDescriptionText: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                          </label>
                          <label className="block sm:col-span-2">
                            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Compatibility / Platform info</span>
                            <textarea value={form.compatibilityInfo || ""} onChange={(e) => setForm({ ...form, compatibilityInfo: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                          </label>
                          <label className="block sm:col-span-2">
                            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Key Features</span>
                            <textarea value={form.keyFeatures || ""} onChange={(e) => setForm({ ...form, keyFeatures: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="One feature per line or comma-separated" />
                          </label>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-orange-200 bg-white p-3 lg:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">{formListingLabels.condition}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Select label="Condition grade" value={form.conditionGrade || ""} onChange={(e) => setForm({ ...form, conditionGrade: e.target.value })}>
                            <option value="">Select condition</option>
                            {conditionGradeOptions.map((grade) => <option key={grade}>{grade}</option>)}
                            {form.conditionGrade && !conditionGradeOptions.includes(form.conditionGrade) && <option>{form.conditionGrade}</option>}
                          </Select>
                          <Select label="Tested status" value={form.testedStatus || "Not specified"} onChange={(e) => setForm({ ...form, testedStatus: e.target.value })}>
                            {testedStatusOptions.map((status) => <option key={status}>{status}</option>)}
                          </Select>
                      <label className="block sm:col-span-2">
                            <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                              {conditionDescriptionLabel}
                              <TranslationButtons onTranslate={(target) => openTranslator(target, generatedConditionText(form))} />
                            </span>
                            <textarea value={form.conditionText || ""} onChange={(e) => setForm({ ...form, conditionText: e.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                            <span className="mt-1 block text-xs leading-5 text-stone-500">Write the exact condition shown in the eBay condition field.</span>
                          </label>
                          <div className="sm:col-span-2">
                            <ChecklistGrid
                              title="Defect disclosure"
                              items={defectDisclosureItems}
                              value={normalizeBooleanRecord(form.defectDisclosure, defaultDefectDisclosure)}
                              onChange={(defectDisclosure) => setForm({ ...form, defectDisclosure })}
                            />
                          </div>
                          <label className="block sm:col-span-2">
                            <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                              {conditionDefectsLabel}
                              <TranslationButtons onTranslate={(target) => openTranslator(target, form.defectsNotes || form.conditionNotes || "")} />
                            </span>
                            <textarea value={form.defectsNotes || form.conditionNotes || ""} onChange={(e) => setForm({ ...form, defectsNotes: e.target.value, conditionNotes: "" })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                            <span className="mt-1 block text-xs leading-5 text-stone-500">Scratches, wear, missing parts, battery condition, etc.</span>
                          </label>
                        </div>
                      </div>
                      <label className="block lg:col-span-2">
                        <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                          eBay title
                          <TranslationButtons onTranslate={(target) => openTranslator(target, form.ebayTitle || form.listingTitle || generatedListingTitle(form))} />
                        </span>
                        <input value={form.ebayTitle || form.listingTitle || generatedListingTitle(form)} onChange={(e) => updateListingTitle(e.target.value)} className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                        <span className={`mt-1 block text-xs font-semibold ${(form.ebayTitle || form.listingTitle || generatedListingTitle(form)).length > 80 ? "text-red-700" : "text-stone-500"}`}>{(form.ebayTitle || form.listingTitle || generatedListingTitle(form)).length}/80 characters</span>
                      </label>
                      <Input label="Included accessories" className="lg:col-span-2" value={form.includedAccessories || form.includedItems || ""} onChange={(e) => setForm({ ...form, includedAccessories: e.target.value, includedItems: e.target.value })} />
                      <label className="block">
                        <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                          Plain description
                          <TranslationButtons onTranslate={(target) => openTranslator(target, form.generatedPlainDescription || form.descriptionText || generateListingDraft(form).description)} />
                        </span>
                        <textarea value={form.generatedPlainDescription || form.descriptionText || ""} onChange={(e) => setForm({ ...form, generatedPlainDescription: e.target.value, descriptionText: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                      </label>
                      <label className="block lg:col-span-2">
                        <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                          HTML description
                          <TranslationButtons onTranslate={(target) => openTranslator(target, form.generatedHtmlDescription || form.htmlDescription || generateHtmlDescription(form))} />
                        </span>
                        <textarea value={form.generatedHtmlDescription || form.htmlDescription || ""} onChange={(e) => setForm({ ...form, generatedHtmlDescription: e.target.value, htmlDescription: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono text-xs outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                      </label>
                      <div className="lg:col-span-2">
                        <ChecklistGrid
                          title="Photo checklist"
                          items={photoChecklistItems}
                          value={normalizeBooleanRecord(form.photoChecklist, defaultPhotoChecklist)}
                          onChange={(photoChecklist) => setForm({ ...form, photoChecklist })}
                        />
                      </div>
                      <label className="block lg:col-span-2">
                        <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                          Shipping notes
                          <TranslationButtons onTranslate={(target) => openTranslator(target, form.shippingNotes || "")} />
                        </span>
                        <textarea value={form.shippingNotes || ""} onChange={(e) => setForm({ ...form, shippingNotes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Tracked DHL, pickup possible, combined shipping..." />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => copyText("title", form.ebayTitle || form.listingTitle || generatedListingTitle(form))} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Title</button>
                      <button type="button" onClick={() => copyText(formListingLabels.condition.toLowerCase(), generatedConditionText(form))} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Condition Text</button>
                      <button type="button" onClick={() => copyText(formListingLabels.description.toLowerCase(), form.generatedPlainDescription || form.descriptionText || generateListingDraft(form).description)} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Plain Description</button>
                      <button type="button" onClick={() => copyText("HTML description", form.generatedHtmlDescription || form.htmlDescription || generateHtmlDescription(form))} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy HTML Description</button>
                      <button type="button" onClick={() => copyText("shipping notes", form.shippingNotes || "")} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Shipping Notes</button>
                    </div>
                    {hasListingPreviewInput(form) && <div className="max-h-80 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3"><div dangerouslySetInnerHTML={{ __html: form.generatedHtmlDescription || form.htmlDescription || generateHtmlDescription(form) }} /></div>}
                  </div>
                )}

                {activeWorkflowSection === "proof" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Select label="Proof type" value={form.proofType || "Eigenbeleg"} onChange={(e) => setForm({ ...form, proofType: e.target.value })}>{proofTypes.map((type) => <option key={type}>{type}</option>)}</Select>
                      <Select label="Proof status" value={quickProofStatus(form)} onChange={(e) => updateQuickProofStatus(e.target.value)}><option>Proof available</option><option>External proof recorded</option><option>Eigenbeleg needed</option><option>Missing proof</option></Select>
                      <Input label="Proof date" type="date" value={form.proofDate || form.purchaseDate} onChange={(e) => setForm({ ...form, proofDate: e.target.value })} />
                      <Input label="Proof amount EUR" value={form.proofAmount || ""} onChange={(e) => setForm({ ...form, proofAmount: e.target.value })} />
                      <Select label="Proof stored externally" value={form.proofStoredExternally || "No"} onChange={(e) => setForm({ ...form, proofStoredExternally: e.target.value })}><option>Yes</option><option>No</option></Select>
                      <Input label="Proof file name" value={form.proofFileName || ""} onChange={(e) => setForm({ ...form, proofFileName: e.target.value })} />
                      <Input label="Proof folder location" className="sm:col-span-2" value={form.proofFolderLocation || ""} onChange={(e) => setForm({ ...form, proofFolderLocation: e.target.value })} />
                      <Input label="No receipt reason" value={form.noReceiptReason || ""} onChange={(e) => setForm({ ...form, noReceiptReason: e.target.value })} />
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Legacy image attachment</span>
                      <input type="file" accept="image/*" onChange={handleProofImageUpload} className="block w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
                      <p className="mt-1 text-xs text-neutral-500">Compatibility only. Prefer file/folder references above.</p>
                    </label>
                    <textarea value={form.proofNotes || ""} onChange={(e) => setForm({ ...form, proofNotes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Proof notes..." />
                    {needsEigenbeleg(form) && <div className="rounded-2xl bg-neutral-50 p-3"><pre className="max-h-44 overflow-auto whitespace-pre-wrap text-xs text-neutral-700">{eigenbelegText(form)}</pre><button type="button" onClick={() => copyEigenbeleg(form)} className="mt-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy Eigenbeleg</button></div>}
                  </div>
                )}

                {activeWorkflowSection === "sale" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Input label="Sale date" type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} />
                      <Select label="Buyer platform" value={form.buyerPlatform || "ebay"} onChange={(e) => setForm({ ...form, buyerPlatform: e.target.value })}>
                        {buyerPlatformOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </Select>
                      <Input label="Final sale price EUR" value={form.finalSalePrice || form.salePrice || ""} onChange={(e) => setForm({ ...form, finalSalePrice: e.target.value })} />
                      <Input label="Shipping charged to buyer EUR" value={form.shippingChargedToBuyer || ""} onChange={(e) => setForm({ ...form, shippingChargedToBuyer: e.target.value })} />
                      <Input label="Actual shipping cost EUR" value={form.actualShippingCost || form.shippingCost || ""} onChange={(e) => setForm({ ...form, actualShippingCost: e.target.value })} />
                      <Input label="Packaging cost EUR" value={form.packagingCost || ""} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} />
                      <Input label="Platform fees EUR" value={form.manualEbayFee || form.ebayFees || ""} onChange={(e) => setForm({ ...form, manualEbayFee: e.target.value, ebayFeeMode: "Manual" })} />
                      <Input label="Refund amount EUR" value={form.refundAmount || ""} onChange={(e) => setForm({ ...form, refundAmount: e.target.value })} />
                      <Input label="Refund date" type="date" value={form.refundDate || ""} onChange={(e) => setForm({ ...form, refundDate: e.target.value })} />
                      <Input label="Return postage cost EUR" value={form.returnPostageCost || ""} onChange={(e) => setForm({ ...form, returnPostageCost: e.target.value })} />
                      <Input label="Refund reason" className="sm:col-span-2" value={form.refundReason || ""} onChange={(e) => setForm({ ...form, refundReason: e.target.value })} />
                      <Input label="Carrier" value={form.carrier || "DHL"} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />
                      <Input label="Tracking number" value={form.trackingNumber || ""} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
                      <Input label="Shipped date" type="date" value={form.shippedDate || ""} onChange={(e) => setForm({ ...form, shippedDate: e.target.value })} />
                      <Input label="Tracking notes" className="sm:col-span-2" value={form.trackingNotes || ""} onChange={(e) => setForm({ ...form, trackingNotes: e.target.value })} />
                      <Input label="Shipment / shipping notes" className="sm:col-span-2" value={form.shippingNotes || ""} onChange={(e) => setForm({ ...form, shippingNotes: e.target.value })} />
                    </div>
                    <div className="flex flex-wrap gap-2">{quickStatusOptions.map((status) => <button key={status} type="button" onClick={() => setForm({ ...form, status })} className={`rounded-xl px-3 py-2 text-sm font-semibold ${form.status === status ? "bg-[#e06b2c] text-[#24110e]" : "border border-neutral-300 text-neutral-700 hover:bg-[#f0be45]/20"}`}>{status}</button>)}</div>
                  </div>
                )}

                {activeWorkflowSection === "notes" && (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <Input label="Included items" value={form.includedItems || ""} onChange={(e) => setForm({ ...form, includedItems: e.target.value })} />
                    <Input label="Defects / wear" value={form.defectsNotes || ""} onChange={(e) => setForm({ ...form, defectsNotes: e.target.value })} />
                    <Input label="Payment method" value={form.paymentMethod || ""} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
                    <Input label="Legacy image name" value={form.proofImageName || ""} onChange={(e) => setForm({ ...form, proofImageName: e.target.value })} />
                    <label className="block lg:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-neutral-600">Notes</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" /></label>
                    <label className="block lg:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-neutral-600">Condition notes</span><textarea value={form.conditionNotes || ""} onChange={(e) => setForm({ ...form, conditionNotes: e.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" /></label>
                  </div>
                )}
              </div>
            </div>
          )}

          {DISABLED_LEGACY_UI && !editingId && itemFormOpen && <div className="mt-6 space-y-4 border-t border-[#eadfce] pt-5">
            <div className="premium-panel rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Advanced Item Form</p>
                  <h3 className="mt-1 text-lg font-semibold text-stone-950">{activeAdvancedSection ? advancedFormSections.find(([key]) => key === activeAdvancedSection)?.[1] : "Choose a section"}</h3>
                  <p className="mt-1 text-sm text-stone-600">Use one focused section at a time. Quick Add remains available above for fast entry.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeAdvancedSection && <button type="button" onClick={() => setActiveAdvancedSection("")} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Back to sections</button>}
                  {activeAdvancedSection && <button type="button" onClick={() => setActiveAdvancedSection("")} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Close section</button>}
                  <button type="submit" className="rounded-xl bg-[#e06b2c] px-4 py-2 text-sm font-semibold text-[#24110e] shadow-[0_8px_18px_rgba(224,107,44,0.18)] hover:bg-[#f0be45]">Save item</button>
                  <button type="button" onClick={() => { setItemFormOpen(false); setActiveAdvancedSection(""); }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Cancel</button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {advancedFormSections.map(([key, label, Icon, description, activeClass, hoverClass, iconClass]) => {
                  const selected = activeAdvancedSection === key;
                  return (
                  <button key={key} type="button" onClick={() => setActiveAdvancedSection(key)} className={`rounded-3xl border p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(41,37,36,0.09)] ${selected ? `${activeClass} ring-2` : `border-stone-200 bg-[#fffdf8] text-stone-950 ${hoverClass}`}`}>
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${selected ? "bg-white/85 text-[#351c17]" : `bg-[#351c17] ${iconClass}`}`}><Icon size={18} /></div>
                    <p className={`text-sm font-semibold ${selected ? "" : "text-stone-950"}`}>{label}</p>
                    <p className={`mt-1 text-xs leading-5 ${selected ? "opacity-85" : "text-stone-500"}`}>{description}</p>
                  </button>
                  );
                })}
              </div>
            </div>

            {activeAdvancedSection === "basic" && <>
            <FormSection title="Inventory item">
              <Input label="Item name" className="sm:col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sony CD Player" />
              <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Electronics, clothing..." />
              <Select label="Classification" value={form.classification || DEFAULT_CLASSIFICATION} onChange={(e) => setForm({ ...form, classification: e.target.value, ebayFeeMode: e.target.value === "Private Sale / Personal Collection" ? DEFAULT_EBAY_FEE_MODE : form.ebayFeeMode })}>
                {classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}
              </Select>
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
                {form.status && !statusOptions.includes(form.status) && <option>{form.status}</option>}
              </Select>
              <Input label="eBay title" className="sm:col-span-2 lg:col-span-4" value={form.ebayTitle} onChange={(e) => setForm({ ...form, ebayTitle: e.target.value })} />
            </FormSection>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-950">Classification helper</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {classificationHelp.map(([label, description]) => (
                  <div key={label} className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-xs font-semibold text-neutral-800">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>
            </>}

            {activeAdvancedSection === "sourcing" && <FormSection title="Sourcing record and receipt evidence">
              <Select label="Source type" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>
                <option>Flea market</option><option>Second-hand shop</option><option>Private seller</option><option>Online marketplace</option><option>Other</option>
              </Select>
              <Input label="Source / seller" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} placeholder="Shop or private seller" />
              <Input label="Location" value={form.sourceLocation} onChange={(e) => setForm({ ...form, sourceLocation: e.target.value })} placeholder="Landshut Flohmarkt" />
              <Input label="Purchase date" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
              <Input label="Purchase price EUR" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
              <Select label="Receipt available" value={form.hasReceipt} onChange={(e) => setForm({ ...form, hasReceipt: e.target.value, receiptType: e.target.value === "Yes" ? "Shop receipt" : "Eigenbeleg needed" })}>
                <option>Yes</option><option>No</option>
              </Select>
              <Select label="Payment method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option>Cash</option><option>Card</option><option>PayPal</option><option>Bank transfer</option><option>Other</option>
              </Select>
            </FormSection>}

            {activeAdvancedSection === "sale" && <FormSection title="Sale and shipping">
              <Input label="Sale date" type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} />
              <Select label="Buyer platform" value={form.buyerPlatform || "ebay"} onChange={(e) => setForm({ ...form, buyerPlatform: e.target.value })}>
                {buyerPlatformOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Input label="Final sale price EUR" value={form.finalSalePrice || form.salePrice || ""} onChange={(e) => setForm({ ...form, finalSalePrice: e.target.value })} />
              <Input label="Shipping charged to buyer EUR" value={form.shippingChargedToBuyer || ""} onChange={(e) => setForm({ ...form, shippingChargedToBuyer: e.target.value })} />
              <Input label="Actual shipping cost EUR" value={form.actualShippingCost || form.shippingCost || ""} onChange={(e) => setForm({ ...form, actualShippingCost: e.target.value })} />
              <Input label="Packaging cost EUR" value={form.packagingCost || ""} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} />
              <Input label="Refund amount EUR" value={form.refundAmount || ""} onChange={(e) => setForm({ ...form, refundAmount: e.target.value })} />
              <Input label="Refund date" type="date" value={form.refundDate || ""} onChange={(e) => setForm({ ...form, refundDate: e.target.value })} />
              <Input label="Return postage cost EUR" value={form.returnPostageCost || ""} onChange={(e) => setForm({ ...form, returnPostageCost: e.target.value })} />
              <Input label="Refund reason" className="sm:col-span-2" value={form.refundReason || ""} onChange={(e) => setForm({ ...form, refundReason: e.target.value })} />
              <Input label="Carrier" value={form.carrier || "DHL"} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />
              <Input label="Tracking number" value={form.trackingNumber || ""} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
              <Input label="Shipped date" type="date" value={form.shippedDate || ""} onChange={(e) => setForm({ ...form, shippedDate: e.target.value })} />
              <Input label="Tracking notes" className="sm:col-span-2" value={form.trackingNotes || ""} onChange={(e) => setForm({ ...form, trackingNotes: e.target.value })} />
            </FormSection>}

            {activeAdvancedSection === "pricing" && <div className="space-y-4">
              <div className="rounded-2xl border border-[#f0be45]/30 bg-[#f0be45]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6511]">Core money</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input label="Purchase price EUR" value={form.purchasePrice || ""} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
                  {isSoldStatus(form) && <Input label="Sold price EUR" value={form.finalSalePrice || form.salePrice || ""} onChange={(e) => setForm({ ...form, finalSalePrice: e.target.value })} />}
                  <Input label="Shipping cost EUR" value={form.actualShippingCost || form.shippingCost || ""} onChange={(e) => setForm({ ...form, actualShippingCost: e.target.value, shippingCost: e.target.value })} />
                  <Input label="Packaging cost EUR" value={form.packagingCost || ""} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} />
                  <Input label="Platform fees EUR" value={form.manualEbayFee || form.ebayFees || ""} onChange={(e) => setForm({ ...form, manualEbayFee: e.target.value, ebayFeeMode: "Manual" })} />
                </div>
                <p className="mt-3 rounded-xl bg-lime-100 p-3 text-sm font-semibold text-lime-800">Estimated/current profit: {money(itemProfitValue(form))}</p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">Fee details (Optional)</h3>
                    <p className="mt-1 text-sm text-neutral-600">Use only when you need separate promoted, other, or business fee estimates.</p>
                  </div>
                  <button type="button" onClick={() => setAdvancedFeesOpen(!advancedFeesOpen)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                    {advancedFeesOpen ? "Hide" : "Show"}
                  </button>
                </div>
                {advancedFeesOpen && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Select label="eBay fee mode" value={form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE} onChange={(e) => setForm({ ...form, ebayFeeMode: e.target.value })}>
                      {ebayFeeModes.map((mode) => <option key={mode}>{mode}</option>)}
                    </Select>
                    {(form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE) === "Business Estimate" && (
                      <>
                        <Input label="Business fee percent" value={form.feePercent || ""} onChange={(e) => setForm({ ...form, feePercent: e.target.value })} />
                        <Input label="Business fixed fee EUR" value={form.fixedFee || ""} onChange={(e) => setForm({ ...form, fixedFee: e.target.value })} />
                        <Input label="Estimated eBay fee EUR" value={String(ebayBaseFee(form))} onChange={(e) => setForm({ ...form, estimatedEbayFee: e.target.value })} readOnly />
                      </>
                    )}
                    <Input label="Promoted listing fee EUR" value={form.promotedListingFee || ""} onChange={(e) => setForm({ ...form, promotedListingFee: e.target.value })} />
                    <Input label="Other platform fees EUR" value={form.otherPlatformFees || ""} onChange={(e) => setForm({ ...form, otherPlatformFees: e.target.value })} />
                  </div>
                )}
                {(form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE) === "Business Estimate" && advancedFeesOpen && <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">Business fee calculations are estimates until reconciled with official eBay reports.</p>}
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">Market Research (Optional)</h3>
                    <p className="mt-1 text-sm text-neutral-600">Search comps only when needed; core profit does not depend on this.</p>
                  </div>
                  <button type="button" onClick={() => setMarketResearchOpen(!marketResearchOpen)} className="rounded-xl border border-[#f0be45]/40 px-3 py-2 text-sm font-semibold text-[#72530b] hover:bg-[#f0be45]/15">{marketResearchOpen ? "Hide" : "Show"}</button>
                </div>
                {marketResearchOpen && (
                  <div className="mt-3 space-y-3">
                    <Input label="Research query" value={form.researchQuery || ""} onChange={(e) => setForm({ ...form, researchQuery: e.target.value })} placeholder={form.ebayTitle || form.name || "Search phrase"} />
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Research notes</span>
                      <textarea value={form.priceResearchNotes || ""} onChange={(e) => setForm({ ...form, priceResearchNotes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Condition differences, sold comps, missing parts, bundle notes..." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {priceResearchLinks(form).map(([label, href]) => (
                        <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{label}</a>
                      ))}
                      {priceResearchLinks(form).length === 0 && <p className="text-sm text-neutral-500">Enter an item name, eBay title, or research query to generate search links.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>}

            {activeAdvancedSection === "proof" && <>
            <FormSection title="Receipt / evidence record">
              <Select label="Proof type" value={form.proofType || "Eigenbeleg"} onChange={(e) => setForm({ ...form, proofType: e.target.value })}>
                {proofTypes.map((type) => <option key={type}>{type}</option>)}
              </Select>
              <Input label="Proof date" type="date" value={form.proofDate || form.purchaseDate} onChange={(e) => setForm({ ...form, proofDate: e.target.value })} />
              <Input label="Proof amount EUR" value={form.proofAmount || ""} onChange={(e) => setForm({ ...form, proofAmount: e.target.value })} />
              <Input label="No receipt reason" value={form.noReceiptReason || ""} onChange={(e) => setForm({ ...form, noReceiptReason: e.target.value })} placeholder="e.g. private seller did not issue receipt" />
              <Select label="Proof stored externally" value={form.proofStoredExternally || "No"} onChange={(e) => setForm({ ...form, proofStoredExternally: e.target.value })}>
                <option>Yes</option><option>No</option>
              </Select>
              <Input label="Proof file name" value={form.proofFileName || ""} onChange={(e) => setForm({ ...form, proofFileName: e.target.value })} placeholder="receipt-2026-05-17.jpg" />
              <Input label="Proof folder location" className="sm:col-span-2" value={form.proofFolderLocation || ""} onChange={(e) => setForm({ ...form, proofFolderLocation: e.target.value })} placeholder="D:\\ResellIt\\Receipts\\2026-05" />
            </FormSection>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-950">Proof location</h3>
              <p className="mt-1 text-sm text-neutral-600">Store original receipts/photos in your own folder system; ResellIt records where the proof is located.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Legacy image attachment</span>
                  <input type="file" accept="image/*" onChange={handleProofImageUpload} className="block w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
                  <p className="mt-1 text-xs text-neutral-500">Compatibility only. Prefer file/folder references above.</p>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Proof notes</span>
                  <textarea value={form.proofNotes || ""} onChange={(e) => setForm({ ...form, proofNotes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Photo context, seller note, receipt reference, storage location..." />
                </label>
              </div>
              {form.proofImageDataUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={form.proofImageDataUrl} alt="Proof attachment preview" className="h-16 w-16 rounded-xl border border-neutral-200 object-cover" />
                  <p className="text-sm text-neutral-600">{form.proofImageName || "Attached image stored locally"}</p>
                </div>
              )}
            </div>
            </>}

            {activeAdvancedSection === "listing" && <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950">Listing Studio</h3>
                  <p className="mt-1 text-sm text-neutral-600">Prepare eBay listing copy locally. No scraping, AI API, or direct eBay connection.</p>
                </div>
                <button type="button" onClick={generateCurrentListingDraft} className="rounded-2xl bg-orange-300 px-4 py-3 text-sm font-semibold text-stone-950 shadow-[0_8px_18px_rgba(154,88,28,0.12)] hover:bg-orange-200">Generate Listing Studio output</button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {listingResearchLinks(form).map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{label}</a>
                ))}
              </div>
              <div className="mt-4">
                <ListingCompleteness item={form} />
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <Select label="Language" value={normalizeListingLanguageValue(form)} onChange={(e) => setForm({ ...form, language: e.target.value, listingLanguage: languageLabel(e.target.value) })}>
                  {languageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
                <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-3 lg:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">{formListingSectionHeadings.productDescription}</p>
                  <p className="mt-1 text-xs leading-5 text-stone-600">Describe what the item is, important features, compatibility, and general product information.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Input label="Brand" value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                    <Input label="Model" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                    <Input label="Measurements" value={form.measurements || form.sizeSpecs || ""} onChange={(e) => setForm({ ...form, measurements: e.target.value, sizeSpecs: e.target.value })} />
                    <Input label="Colour" value={form.colour || ""} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
                    <label className="block sm:col-span-2 lg:col-span-4">
                      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Product Description / About Text</span>
                      <textarea value={form.productDescriptionText || ""} onChange={(e) => setForm({ ...form, productDescriptionText: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Compatibility / Platform info</span>
                      <textarea value={form.compatibilityInfo || ""} onChange={(e) => setForm({ ...form, compatibilityInfo: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Key Features</span>
                      <textarea value={form.keyFeatures || ""} onChange={(e) => setForm({ ...form, keyFeatures: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="One feature per line or comma-separated" />
                    </label>
                  </div>
                </div>
                <label className="block lg:col-span-2">
                  <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                    eBay title
                    <TranslationButtons onTranslate={(target) => openTranslator(target, form.ebayTitle || form.listingTitle || generatedListingTitle(form))} />
                  </span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={form.ebayTitle || form.listingTitle || generatedListingTitle(form)} onChange={(e) => updateListingTitle(e.target.value)} className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                    <button type="button" onClick={() => copyText("title", form.ebayTitle || form.listingTitle || generatedListingTitle(form))} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Title</button>
                  </div>
                  <span className={`mt-1 block text-xs font-semibold ${(form.ebayTitle || form.listingTitle || generatedListingTitle(form)).length > 80 ? "text-red-700" : "text-stone-500"}`}>{(form.ebayTitle || form.listingTitle || generatedListingTitle(form)).length}/80 characters</span>
                </label>
                <div className="rounded-2xl border border-orange-200 bg-white p-3 lg:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">{formListingLabels.condition}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Select label="Condition grade" value={form.conditionGrade || ""} onChange={(e) => setForm({ ...form, conditionGrade: e.target.value })}>
                      <option value="">Select condition</option>
                      {conditionGradeOptions.map((grade) => <option key={grade}>{grade}</option>)}
                      {form.conditionGrade && !conditionGradeOptions.includes(form.conditionGrade) && <option>{form.conditionGrade}</option>}
                    </Select>
                    <Select label="Tested status" value={form.testedStatus || "Not specified"} onChange={(e) => setForm({ ...form, testedStatus: e.target.value })}>
                      {testedStatusOptions.map((status) => <option key={status}>{status}</option>)}
                    </Select>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                        {conditionDescriptionLabel}
                        <TranslationButtons onTranslate={(target) => openTranslator(target, generatedConditionText(form))} />
                      </span>
                      <textarea value={form.conditionText || ""} onChange={(e) => setForm({ ...form, conditionText: e.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                      <span className="mt-1 block text-xs leading-5 text-stone-500">Write the exact condition shown in the eBay condition field.</span>
                    </label>
                    <div className="sm:col-span-2">
                      <ChecklistGrid
                        title="Defect disclosure"
                        items={defectDisclosureItems}
                        value={normalizeBooleanRecord(form.defectDisclosure, defaultDefectDisclosure)}
                        onChange={(defectDisclosure) => setForm({ ...form, defectDisclosure })}
                      />
                    </div>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                        {conditionDefectsLabel}
                        <TranslationButtons onTranslate={(target) => openTranslator(target, form.defectsNotes || form.conditionNotes || "")} />
                      </span>
                      <textarea value={form.defectsNotes || form.conditionNotes || ""} onChange={(e) => setForm({ ...form, defectsNotes: e.target.value, conditionNotes: "" })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                      <span className="mt-1 block text-xs leading-5 text-stone-500">Scratches, wear, missing parts, battery condition, etc.</span>
                    </label>
                    <button type="button" onClick={() => copyText(formListingLabels.condition.toLowerCase(), generatedConditionText(form))} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100 sm:w-fit">Copy Condition Text</button>
                  </div>
                </div>
                <label className="block">
                  <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                    Plain description
                    <TranslationButtons onTranslate={(target) => openTranslator(target, form.generatedPlainDescription || form.descriptionText || generateListingDraft(form).description)} />
                  </span>
                  <textarea value={form.generatedPlainDescription || form.descriptionText || ""} onChange={(e) => setForm({ ...form, generatedPlainDescription: e.target.value, descriptionText: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                  <button type="button" onClick={() => copyText(formListingLabels.description.toLowerCase(), form.generatedPlainDescription || form.descriptionText || generateListingDraft(form).description)} className="mt-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Plain Description</button>
                </label>
                <label className="block lg:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Included accessories</span>
                  <input value={form.includedAccessories || form.includedItems || ""} onChange={(e) => setForm({ ...form, includedAccessories: e.target.value, includedItems: e.target.value })} className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Item, charger, manual..." />
                </label>
                <label className="block lg:col-span-2">
                  <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                    HTML description
                    <TranslationButtons onTranslate={(target) => openTranslator(target, form.generatedHtmlDescription || form.htmlDescription || generateHtmlDescription(form))} />
                  </span>
                  <textarea value={form.generatedHtmlDescription || form.htmlDescription || ""} onChange={(e) => setForm({ ...form, generatedHtmlDescription: e.target.value, htmlDescription: e.target.value })} className="min-h-32 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono text-xs outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                  <button type="button" onClick={() => copyText("HTML description", form.generatedHtmlDescription || form.htmlDescription || generateHtmlDescription(form))} className="mt-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy HTML Description</button>
                </label>
                <div className="lg:col-span-2">
                  <ChecklistGrid
                    title="Photo checklist"
                    items={photoChecklistItems}
                    value={normalizeBooleanRecord(form.photoChecklist, defaultPhotoChecklist)}
                    onChange={(photoChecklist) => setForm({ ...form, photoChecklist })}
                  />
                </div>
                {hasListingPreviewInput(form) && (
                  <div className="lg:col-span-2">
                    <p className="mb-1.5 text-xs font-semibold text-neutral-600">{formListingLabels.preview}</p>
                    <div className="max-h-80 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div dangerouslySetInnerHTML={{ __html: form.generatedHtmlDescription || form.htmlDescription || generateHtmlDescription(form) }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Editable source fields</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-neutral-600">
                      Shipping notes
                      <TranslationButtons onTranslate={(target) => openTranslator(target, form.shippingNotes || "")} />
                    </span>
                    <input value={form.shippingNotes || ""} onChange={(e) => setForm({ ...form, shippingNotes: e.target.value })} className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-all duration-150 placeholder:text-stone-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70" placeholder="Tracked DHL, pickup possible..." />
                  </label>
                  <Input label="Research low EUR" value={form.priceResearchLow || form.researchedLowPrice || ""} onChange={(e) => setForm({ ...form, priceResearchLow: e.target.value, researchedLowPrice: e.target.value })} />
                  <Input label="Research mid EUR" value={form.priceResearchMid || form.researchedMidPrice || ""} onChange={(e) => setForm({ ...form, priceResearchMid: e.target.value, researchedMidPrice: e.target.value })} />
                  <Input label="Research high EUR" value={form.priceResearchHigh || form.researchedHighPrice || ""} onChange={(e) => setForm({ ...form, priceResearchHigh: e.target.value, researchedHighPrice: e.target.value })} />
                  <Input label="Chosen listing price EUR" value={form.chosenListingPrice || ""} onChange={(e) => setForm({ ...form, chosenListingPrice: e.target.value })} />
                  <Input label="Research notes" value={form.priceResearchNotes || ""} onChange={(e) => setForm({ ...form, priceResearchNotes: e.target.value })} />
                </div>
                <button type="button" onClick={() => copyText("shipping notes", form.shippingNotes || "")} className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Shipping Notes</button>
              </div>
            </div>}

          {activeAdvancedSection === "notes" && <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Condition, missing receipt reason, storage location, defects, tax notes..." />
          </label>}

          </div>}
        </form>
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="rounded-3xl border border-[#eadfce] bg-[#fffaf0] p-2 shadow-[0_14px_38px_rgba(0,0,0,0.14)]">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {financeSections.map(([key, label]) => (
                <button key={key} type="button" onClick={() => setFinanceSection(key)} className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 ${financeSection === key ? "bg-[#e06b2c] text-[#24110e] shadow-sm" : "border border-stone-200 bg-white text-stone-700 hover:bg-[#f0be45]/20 hover:shadow-sm"}`}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={ShoppingCart} label="This month revenue" value={money(sectionSummaries.finance.revenue)} accentClass="bg-[#f0be45]" />
            <StatCard icon={ReceiptText} label="Expenses" value={money(sectionSummaries.finance.expenses)} sub={CURRENT_MONTH} accentClass="bg-[#f0be45]" />
            <StatCard icon={Euro} label="Estimated profit" value={money(sectionSummaries.finance.estimatedProfit)} accentClass="bg-[#f0be45]" />
            <StatCard icon={FileText} label="Pending payout estimate" value={money(sectionSummaries.finance.pendingPayout)} sub="revenue minus fees/shipping" accentClass="bg-[#f0be45]" />
          </section>
        )}

        {(activeTab === "finance" && financeSection === "taxRecords") && <div className="rounded-3xl border border-[#eadfce] bg-[#fffaf0] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
          <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr] md:items-end">
            <Select label="Filter by classification" value={classificationFilter} onChange={(e) => setClassificationFilter(e.target.value)}>
              <option>All classifications</option>
              {classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}
            </Select>
            <p className="text-sm leading-6 text-neutral-600">Use classification to keep personal collection sales separate from stock bought for resale, legacy business stock, and items that need later review.</p>
          </div>
        </div>}

        <section className="grid gap-4">
          {activeTab === "stock" && (
            <div className="rounded-xl border border-[#b7412e]/15 bg-[#fffaf0] shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
              <div className="border-b border-[#eadfce] p-2.5 sm:p-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="mb-1.5 h-0.5 w-12 rounded-full bg-[#b7412e]" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#b7412e]">Stock Control</p>
                    <h2 className="mt-0.5 text-lg font-semibold text-stone-950">Master Inventory Stock Control Sheet</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={openNewItemEditor} className="rounded-md bg-[#e06b2c] px-3 py-1.5 text-xs font-semibold text-[#24110e] shadow-sm hover:bg-[#f0be45]">
                      Add Item
                    </button>
                    <div className="rounded-md border border-[#b7412e]/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#8f3124]">
                      {stockTimelineItems.length} of {items.length} items
                    </div>
                  </div>
                </div>

              </div>

              <div className="p-1.5 sm:p-2">
                <div className="mb-2 overflow-x-auto rounded-lg border border-[#b7412e]/15 bg-white shadow-[0_4px_14px_rgba(41,37,36,0.04)]">
                  <div className="grid min-w-[760px] grid-cols-6 divide-x divide-stone-100 border-l-2 border-[#b7412e] text-[11px]">
                    {[
                      [Package, "Visible", stockTimelineTotals.itemCount],
                      [Euro, "Purchase cost", money(stockTimelineTotals.purchaseTotal)],
                      [ShoppingCart, "Sold total", money(stockTimelineTotals.soldTotal)],
                      [Euro, "Est. profit", money(stockTimelineTotals.profitTotal), "text-lime-800"],
                      [Package, "Unsold", stockTimelineTotals.unsoldCount],
                      [ReceiptText, "Missing proof", stockTimelineTotals.missingProofCount, stockTimelineTotals.missingProofCount ? "text-[#8f3124]" : ""],
                    ].map(([Icon, label, value, valueClass = "text-stone-950"]) => (
                      <div key={label} className="flex items-center gap-2 px-2 py-2">
                        <Icon size={13} className="shrink-0 text-[#b7412e]" />
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
                          <p className={`truncate text-sm font-semibold ${valueClass}`}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-2 overflow-x-auto rounded-lg border border-[#b7412e]/20 bg-[#fff6e6] shadow-[0_4px_14px_rgba(183,65,46,0.06)]">
                  <div className="grid min-w-[760px] grid-cols-[7rem_1.6fr_1.1fr_7rem_13rem] items-center gap-1 border-b border-[#b7412e]/10 bg-[#fff2dc] px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                    <span>Date</span>
                    <span>Item</span>
                    <span>Source</span>
                    <span className="text-right">Purchase</span>
                    <span className="text-center text-[#8f3124]">Quick Stock Entry</span>
                  </div>
                  <div className="grid min-w-[760px] grid-cols-[7rem_1.6fr_1.1fr_7rem_13rem] items-center gap-1 border-l-2 border-[#b7412e] px-1.5 py-1.5">
                    <input type="date" value={quickAddItem.purchaseDate} onChange={(e) => setQuickAddItem({ ...quickAddItem, purchaseDate: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") createQuickLedgerItem(); }} className="h-7 rounded border border-stone-200 bg-white px-1 text-[11px] text-stone-900 outline-none focus:border-[#b7412e]/30 focus:ring-1 focus:ring-[#b7412e]/15" />
                    <input value={quickAddItem.name} onChange={(e) => setQuickAddItem({ ...quickAddItem, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") createQuickLedgerItem(); }} className="h-7 rounded border border-stone-200 bg-white px-2 text-[11px] font-semibold text-stone-900 outline-none focus:border-[#b7412e]/30 focus:ring-1 focus:ring-[#b7412e]/15" placeholder="New stock item" />
                    <input value={quickAddItem.sourceName} onChange={(e) => setQuickAddItem({ ...quickAddItem, sourceName: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") createQuickLedgerItem(); }} className="h-7 rounded border border-stone-200 bg-white px-2 text-[11px] text-stone-900 outline-none focus:border-[#b7412e]/30 focus:ring-1 focus:ring-[#b7412e]/15" placeholder="Source" />
                    <input type="number" step="0.01" value={quickAddItem.purchasePrice} onChange={(e) => setQuickAddItem({ ...quickAddItem, purchasePrice: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") createQuickLedgerItem(); }} className="h-7 rounded border border-stone-200 bg-white px-1 text-right text-[11px] text-stone-900 outline-none focus:border-[#b7412e]/30 focus:ring-1 focus:ring-[#b7412e]/15" placeholder="0.00" />
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => createQuickLedgerItem()} className="h-7 rounded border border-[#b7412e]/20 bg-white px-2 text-[11px] font-semibold text-[#8f3124] hover:bg-[#fff6e6]">Add</button>
                      <button type="button" onClick={() => createQuickLedgerItem({ openEditor: true })} className="h-7 rounded bg-[#e06b2c] px-2 text-[11px] font-semibold text-[#24110e] hover:bg-[#f0be45]">Add & Edit</button>
                    </div>
                  </div>
                </div>

                <div className="relative mb-2 flex flex-wrap gap-1.5">
                  {[
                    ["search", Search, "Search", inventorySearch.trim()],
                    ["group", ClipboardList, "Group", inventoryTimelineGrouping !== "Month"],
                    ["classification", Package, "Type", inventoryClassification !== "All classifications"],
                    ["status", Info, "Status", inventoryStatus !== "All statuses"],
                    ["date", ReceiptText, "Date", inventoryTimelineMonth],
                    ["view", FileText, "View", stockViewMode === "Compact view"],
                  ].map(([key, Icon, label, active]) => (
                    <button key={key} type="button" onClick={() => setStockFilterMenu(stockFilterMenu === key ? "" : key)} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${active ? "border-[#b7412e]/30 bg-[#b7412e]/8 text-[#8f3124]" : "border-stone-200 bg-white text-stone-600 hover:border-[#b7412e]/20 hover:bg-[#fff6e6]"}`}>
                      <Icon size={11} /> {label}
                    </button>
                  ))}
                  {stockActiveFilterCount > 0 && <button type="button" onClick={() => { setInventorySearch(""); setInventoryTimelineGrouping("Month"); setInventoryClassification("All classifications"); setInventoryStatus("All statuses"); setInventoryTimelineMonth(""); setInventoryCategory("All categories"); setInventoryIssueFilter("All items"); setStockFilterMenu(""); }} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-500 hover:bg-stone-50">Clear</button>}

                  {stockFilterMenu && (
                    <div className="absolute left-0 top-8 z-20 w-72 rounded-xl border border-stone-200 bg-white p-3 shadow-[0_18px_42px_rgba(41,37,36,0.16)]">
                      {stockFilterMenu === "search" && <Input label="Search" value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder="Name, category, source, title..." />}
                      {stockFilterMenu === "group" && <Select label="Group by" value={inventoryTimelineGrouping} onChange={(e) => setInventoryTimelineGrouping(e.target.value)}><option>Month</option><option>Week</option><option>Year</option><option>Ungrouped</option></Select>}
                      {stockFilterMenu === "classification" && <Select label="Classification" value={inventoryClassification} onChange={(e) => setInventoryClassification(e.target.value)}><option>All classifications</option>{classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}</Select>}
                      {stockFilterMenu === "status" && <Select label="Status" value={inventoryStatus} onChange={(e) => setInventoryStatus(e.target.value)}><option>All statuses</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</Select>}
                      {stockFilterMenu === "date" && <Input label="Month filter" type="month" value={inventoryTimelineMonth} onChange={(e) => setInventoryTimelineMonth(e.target.value)} />}
                      {stockFilterMenu === "view" && <Select label="View" value={stockViewMode} onChange={(e) => setStockViewMode(e.target.value)}><option>Compact view</option><option>Detailed view</option></Select>}
                    </div>
                  )}
                </div>

                {stockTimelineItems.length === 0 && (
                  <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600">No inventory items match the current timeline filters.</p>
                )}

                {stockTimelineItems.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
                    <table className={`${stockViewMode === "Compact view" ? "min-w-[840px]" : "min-w-[1040px]"} w-full border-collapse text-left text-[11px]`}>
                      <thead className="sticky top-0 z-10 bg-[#fff8ea] text-[10px] uppercase tracking-wide text-stone-500">
                        <tr className="border-b border-stone-200">
                          <th className="px-1.5 py-1.5 font-semibold">Date</th>
                          <th className="px-1.5 py-1.5 font-semibold">Item</th>
                          <th className="px-1.5 py-1.5 font-semibold">Class.</th>
                          <th className="px-1.5 py-1.5 font-semibold">Status</th>
                          <th className="px-1.5 py-1.5 font-semibold">Source</th>
                          <th className="px-1.5 py-1.5 text-right font-semibold">Purchase</th>
                          <th className="px-1.5 py-1.5 text-right font-semibold">Sold</th>
                          {stockViewMode === "Detailed view" && <th className="px-1.5 py-1.5 text-right font-semibold">Profit</th>}
                          {stockViewMode === "Detailed view" && <th className="px-1.5 py-1.5 font-semibold">Proof</th>}
                          {stockViewMode === "Detailed view" && <th className="px-1.5 py-1.5 font-semibold">Listing</th>}
                          <th className="px-1.5 py-1.5 text-center font-semibold">Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockTimelineGroups.map(([groupLabel, groupItems]) => (
                          <React.Fragment key={groupLabel}>
                            <tr>
                              <td colSpan={stockViewMode === "Compact view" ? 8 : 11} className="border-b border-stone-200 bg-[#fffaf0] px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8f3124]">
                                {groupLabel} <span className="font-medium text-stone-400">({groupItems.length})</span>
                              </td>
                            </tr>
                            {groupItems.map((item) => {
                              const sold = isSoldStatus(item);
                              const proofStatus = quickProofStatus(item) === "Eigenbeleg needed" ? "Eigenbeleg" : needsProofRecord(item) ? "Missing" : "OK";
                              const listingStatus = hasListingDraft(item) ? "Ready" : "Needed";
                              const inputClass = "h-6 w-full truncate rounded border border-transparent bg-transparent px-1 text-[11px] text-stone-900 outline-none hover:border-stone-200 hover:bg-white focus:border-[#b7412e]/30 focus:bg-white focus:ring-1 focus:ring-[#b7412e]/15";
                              return (
                                <tr key={item.id} className="border-b border-stone-100 last:border-b-0 hover:bg-[#fffaf0]/75">
                                  <td className="w-24 px-1.5 py-0.5">
                                    <input type="date" value={item.purchaseDate || ""} onChange={(e) => updateItemField(item.id, "purchaseDate", e.target.value)} className={inputClass} />
                                  </td>
                                  <td className="w-60 px-1.5 py-0.5">
                                    <input value={item.name || ""} onChange={(e) => updateItemField(item.id, "name", e.target.value)} className={`${inputClass} font-semibold`} placeholder="Item name" />
                                  </td>
                                  <td className="w-28 px-1.5 py-0.5">
                                    <select value={itemClassification(item)} onChange={(e) => updateItemField(item.id, "classification", e.target.value)} className={inputClass}>
                                      {classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}
                                    </select>
                                  </td>
                                  <td className="w-24 px-1.5 py-0.5">
                                    <select value={itemStatus(item)} onChange={(e) => updateItemField(item.id, "status", e.target.value)} className={inputClass}>
                                      {statusOptions.map((status) => <option key={status}>{status}</option>)}
                                    </select>
                                  </td>
                                  <td className="w-36 px-1.5 py-0.5">
                                    <input value={item.sourceName || item.sourceLocation || ""} onChange={(e) => updateItemField(item.id, "sourceName", e.target.value)} className={inputClass} placeholder="Source" />
                                  </td>
                                  <td className="w-24 px-1.5 py-0.5">
                                    <input type="number" step="0.01" value={item.purchasePrice || ""} onChange={(e) => updateItemField(item.id, "purchasePrice", e.target.value)} className={`${inputClass} text-right tabular-nums`} placeholder="0.00" />
                                  </td>
                                  <td className="w-24 px-1.5 py-0.5">
                                    <input type="number" step="0.01" value={item.finalSalePrice !== undefined ? item.finalSalePrice : item.salePrice || ""} onChange={(e) => updateItemField(item.id, "finalSalePrice", e.target.value)} className={`${inputClass} text-right tabular-nums`} placeholder="0.00" />
                                  </td>
                                  {stockViewMode === "Detailed view" && <td className={`w-24 px-1.5 py-0.5 text-right font-semibold tabular-nums ${sold ? "text-lime-800" : "text-stone-400"}`}>{sold ? money(itemProfitValue(item)) : "-"}</td>}
                                  {stockViewMode === "Detailed view" && <td className="w-20 px-1.5 py-0.5">
                                    <select value={proofStatus} onChange={(e) => updateItemProofStatus(item.id, e.target.value)} className={`${inputClass} font-semibold ${proofStatus === "Missing" ? "text-red-700" : proofStatus === "Eigenbeleg" ? "text-[#8a5b10]" : "text-lime-800"}`}>
                                      <option>OK</option>
                                      <option>Missing</option>
                                      <option>Eigenbeleg</option>
                                    </select>
                                  </td>}
                                  {stockViewMode === "Detailed view" && <td className="w-20 px-1.5 py-0.5">
                                    <select value={listingStatus} onChange={(e) => updateItemListingStatus(item.id, e.target.value)} className={`${inputClass} font-semibold ${listingStatus === "Ready" ? "text-lime-800" : "text-[#8a5b10]"}`}>
                                      <option>Ready</option>
                                      <option>Needed</option>
                                    </select>
                                  </td>}
                                  <td className="w-10 px-1 py-0.5 text-center">
                                    <button type="button" onClick={() => editItem(item)} className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent bg-transparent text-stone-500 hover:border-stone-200 hover:bg-white hover:text-[#8f3124]" title="Open full item workspace" aria-label={`Open ${item.name || "item"} workspace`}>
                                      <Edit3 size={12} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {DISABLED_LEGACY_UI && activeTab === "stock" && ["needsAttention", "inventory", "readyToList"].includes(stockSection) && (
            <div className="grid gap-5">
              <SectionHeader title={stockSectionDetails[stockSection][0]} subtitle={stockSectionDetails[stockSection][1]} count={stockSectionItems.length} />

              <div className="rounded-3xl border border-[#b7412e]/10 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3 border-b border-stone-100 pb-3">
                  <div className="h-8 w-1 rounded-full bg-[#b7412e]" />
                  <div>
                    <h3 className="text-sm font-semibold text-stone-950">Queue health</h3>
                    <p className="text-xs text-stone-500">Counts that explain why items need action.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <StatCard icon={Package} label="Total items" value={inventoryHealth.totalItems} />
                  <StatCard icon={Euro} label="Unsold inventory value" value={money(inventoryHealth.unsoldInventoryValue)} />
                  <StatCard icon={ReceiptText} label="Missing proof" value={inventoryHealth.missingProofCount} />
                  <StatCard icon={ShoppingCart} label="Missing price research" value={inventoryHealth.missingPriceResearchCount} />
                  <StatCard icon={FileText} label="Missing listing draft" value={inventoryHealth.missingListingDraftCount} />
                  <StatCard icon={FileText} label="Review later" value={inventoryHealth.reviewLaterCount} />
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#fffdf8] p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-3 border-b border-stone-200/70 pb-3">
                  <div className="h-8 w-1 rounded-full bg-[#b7412e]/80" />
                  <div>
                    <h3 className="text-sm font-semibold text-stone-950">Inventory controls</h3>
                    <p className="text-xs text-stone-500">Search, filter, and sort this subsection without changing records.</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Input label="Search inventory" value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder="Name, category, eBay title, source..." />
                  <Select label="Classification" value={inventoryClassification} onChange={(e) => setInventoryClassification(e.target.value)}>
                    <option>All classifications</option>
                    {classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}
                  </Select>
                  <Select label="Status" value={inventoryStatus} onChange={(e) => setInventoryStatus(e.target.value)}>
                    <option>All statuses</option>
                    {statusOptions.map((status) => <option key={status}>{status}</option>)}
                  </Select>
                  <Select label="Sort" value={inventorySort} onChange={(e) => setInventorySort(e.target.value)}>
                    <option>Newest purchase date</option>
                    <option>Oldest purchase date</option>
                    <option>Highest expected/listing value</option>
                    <option>Highest final sale price</option>
                    <option>Highest estimated profit</option>
                    <option>Missing proof first</option>
                  </Select>
                </div>
                <div className="mt-3">
                  <button type="button" onClick={() => setAdvancedInventoryFiltersOpen(!advancedInventoryFiltersOpen)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                    {advancedInventoryFiltersOpen ? "Hide advanced filters" : "Advanced filters"}
                  </button>
                </div>
                {advancedInventoryFiltersOpen && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Select label="Category" value={inventoryCategory} onChange={(e) => setInventoryCategory(e.target.value)}>
                      <option>All categories</option>
                      {categoryOptions.map((category) => <option key={category}>{category}</option>)}
                    </Select>
                    <Select label="Inventory filter" value={inventoryIssueFilter} onChange={(e) => setInventoryIssueFilter(e.target.value)}>
                      <option>All items</option>
                      <option>Missing proof</option>
                      <option>Missing price research</option>
                      <option>Missing listing draft</option>
                      <option>Review later</option>
                      <option>Sold only</option>
                      <option>Unsold only</option>
                    </Select>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#fffdf8] p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-3 border-b border-stone-200/70 pb-3">
                  <div className="h-8 w-1 rounded-full bg-[#b7412e]/80" />
                  <div>
                    <h3 className="text-sm font-semibold text-stone-950">{stockSectionDetails[stockSection][0]} items</h3>
                    <p className="text-xs text-stone-500">Operational item cards grouped under the selected workflow queue.</p>
                  </div>
                </div>
              <div className="grid gap-3">
                {stockSectionItems.length === 0 && <p className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600 shadow-sm">No inventory items match the current filters.</p>}
                {stockSectionItems.map((item) => (
                  <article key={item.id} className="premium-card rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
                    <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                      <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-neutral-950">{item.name}</h3>
                            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-amber-50">{itemClassification(item)}</span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(item)}`}>{itemStatus(item)}</span>
                          </div>
                          <p className="mt-1 text-sm text-neutral-600">{item.category || "No category"} / bought {item.purchaseDate || "no date"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Expected</p><p className="font-semibold">{money(expectedListingValue(item))}</p></div>
                          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Final sale</p><p className="font-semibold">{money(finalSaleValue(item))}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Profit</p><p className="font-semibold">{money(itemProfitValue(item))}</p></div>
                          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Health</p><p className="font-semibold">{[needsProofRecord(item) && "Proof", !hasPriceResearch(item) && "Price", !hasListingDraft(item) && "Draft", itemClassification(item) === DEFAULT_CLASSIFICATION && "Review"].filter(Boolean).join(", ") || "OK"}</p></div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 xl:max-w-sm xl:justify-end">
                        <button type="button" onClick={() => editItem(item)} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Edit</button>
                        <button type="button" onClick={() => duplicateItem(item)} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Duplicate</button>
                        {["Ready to List", "Listed", "Sold", "Shipped", "Completed"].map((status) => (
                          <button key={status} type="button" onClick={() => updateItemStatus(item.id, status)} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${itemStatus(item) === status ? statusBadgeClass({ status }) : "border-neutral-300 text-neutral-700 hover:bg-[#f0be45]/20"}`}>{status}</button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              </div>
            </div>
          )}

          {DISABLED_LEGACY_UI && activeTab === "stock" && stockSection === "listingStudio" && (
            <div className="grid gap-5">
              <SectionHeader title={stockSectionDetails.listingStudio[0]} subtitle={stockSectionDetails.listingStudio[1]} count={items.length} />

              <div className="rounded-3xl border border-[#b7412e]/10 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3 border-b border-stone-100 pb-3">
                  <div className="h-8 w-1 rounded-full bg-[#b7412e]" />
                  <div>
                    <h3 className="text-sm font-semibold text-stone-950">Listing readiness</h3>
                    <p className="text-xs text-stone-500">Draft coverage across the current stock catalogue.</p>
                  </div>
                </div>
                <StatCard icon={FileText} label="Missing listing draft" value={inventoryHealth.missingListingDraftCount} sub={`${items.length} total items`} />
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#fffdf8] p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-3 border-b border-stone-200/70 pb-3">
                  <div className="h-8 w-1 rounded-full bg-[#b7412e]/80" />
                  <div>
                    <h3 className="text-sm font-semibold text-stone-950">Listing workbench</h3>
                    <p className="text-xs text-stone-500">Open item editing to create or refine listing copy and HTML.</p>
                  </div>
                </div>
              <div className="grid gap-3">
                {items.length === 0 && <p className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600 shadow-sm">No items yet. Add an item first, then prepare its listing here.</p>}
                {items.map((item) => {
                  const draft = generateListingDraft(item);
                  const draftLabels = listingLabels(item);
                  const hasPlainDescription = Boolean(item.descriptionText);
                  const hasHtmlDescription = Boolean(item.htmlDescription);
                  return (
                    <article key={item.id} className="premium-card rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-neutral-950">{item.name}</h3>
                            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-amber-50">{itemClassification(item)}</span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(item)}`}>{itemStatus(item)}</span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl bg-neutral-50 p-3">
                              <p className="text-xs font-semibold text-neutral-500">{draftLabels.title}</p>
                              <p className="mt-1 text-sm font-semibold text-neutral-900">{draft.title || draftLabels.missing}</p>
                            </div>
                            <div className="rounded-xl bg-neutral-50 p-3">
                              <p className="text-xs font-semibold text-neutral-500">{draftLabels.condition}</p>
                              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-neutral-700">{draft.condition || draftLabels.missing}</p>
                            </div>
                            <div className={`rounded-xl p-3 ${hasPlainDescription ? "bg-lime-50 text-lime-900" : "bg-red-50 text-red-800"}`}>
                              <p className="text-xs font-semibold opacity-75">{draftLabels.description}</p>
                              <p className="mt-1 text-sm font-semibold">{hasPlainDescription ? draftLabels.exists : draftLabels.missing}</p>
                            </div>
                            <div className={`rounded-xl p-3 ${hasHtmlDescription ? "bg-lime-50 text-lime-900" : "bg-red-50 text-red-800"}`}>
                              <p className="text-xs font-semibold opacity-75">HTML description</p>
                              <p className="mt-1 text-sm font-semibold">{hasHtmlDescription ? draftLabels.exists : draftLabels.missing}</p>
                            </div>
                          </div>
                        </div>
                        <button type="button" onClick={() => editItem(item)} className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-300 px-4 py-3 text-sm font-semibold text-stone-950 shadow-[0_8px_18px_rgba(154,88,28,0.12)] hover:bg-orange-200 xl:w-auto">
                          {hasListingDraft(item) ? "Edit listing" : "Open Listing Studio"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="grid gap-4">
              <section className="overflow-hidden rounded-3xl border border-[#3f2b24]/50 bg-[#fff8ea] shadow-[0_18px_38px_rgba(41,37,36,0.11)]">
                <div className="h-1 bg-[#3f2b24]" />
                <div className="flex flex-col gap-2 border-b border-[#dfcfb8] bg-[#f8edda] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-950">Dealer Control Panel</h2>
                    <p className="mt-1 text-sm text-stone-600">Start, research, backup, import, and manage sales from one place.</p>
                  </div>
                  <span className="w-fit rounded-full border border-[#3f2b24]/20 bg-[#fffaf0] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d493d]">ResellIt Ops</span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
                  <button type="button" onClick={openNewItemEditor} className="group min-h-28 rounded-2xl border border-[#cdbb9d] bg-[#fffdf8] p-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_7px_18px_rgba(41,37,36,0.05)] transition hover:-translate-y-0.5 hover:border-[#6d493d] hover:bg-white hover:shadow-[0_13px_26px_rgba(41,37,36,0.1)]">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950">New Item</span>
                    <span className="mt-2 block text-sm leading-5 text-stone-600">Add stock or create a new eBay listing.</span>
                  </button>
                  <button type="button" onClick={() => openStockQueue("needsAttention", "All items", "Draft")} className="group min-h-28 rounded-2xl border border-[#cdbb9d] bg-[#fffdf8] p-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_7px_18px_rgba(41,37,36,0.05)] transition hover:-translate-y-0.5 hover:border-[#6d493d] hover:bg-white hover:shadow-[0_13px_26px_rgba(41,37,36,0.1)]">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950">Draft Listings</span>
                    <span className="mt-2 block text-sm leading-5 text-stone-600">Continue unfinished listings, research, photos and translations.</span>
                  </button>
                  <button type="button" onClick={openSalesQueue} className="group min-h-28 rounded-2xl border border-[#cdbb9d] bg-[#fffdf8] p-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_7px_18px_rgba(41,37,36,0.05)] transition hover:-translate-y-0.5 hover:border-[#6d493d] hover:bg-white hover:shadow-[0_13px_26px_rgba(41,37,36,0.1)]">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950">Sales Queue</span>
                    <span className="mt-2 block text-sm leading-5 text-stone-600">Check sold items, shipping, tracking, and status.</span>
                  </button>
                  <button type="button" onClick={exportJson} className="group min-h-28 rounded-2xl border border-[#cdbb9d] bg-[#fffdf8] p-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_7px_18px_rgba(41,37,36,0.05)] transition hover:-translate-y-0.5 hover:border-[#6d493d] hover:bg-white hover:shadow-[0_13px_26px_rgba(41,37,36,0.1)]">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950">Backup</span>
                    <span className="mt-2 block text-sm leading-5 text-stone-600">Export your ResellIt database.</span>
                  </button>
                  <label className="group min-h-28 cursor-pointer rounded-2xl border border-[#cdbb9d] bg-[#fffdf8] p-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_7px_18px_rgba(41,37,36,0.05)] transition hover:-translate-y-0.5 hover:border-[#6d493d] hover:bg-white hover:shadow-[0_13px_26px_rgba(41,37,36,0.1)]">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950">Import</span>
                    <span className="mt-2 block text-sm leading-5 text-stone-600">Restore a backup file.</span>
                    <input type="file" accept="application/json,.json" onChange={importBackupJson} className="hidden" />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-[0_10px_30px_rgba(41,37,36,0.06)]">
                <div className="mb-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#b7412e] via-[#f0be45] to-[#1f9d99]" />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Today</p>
                    <h2 className="text-xl font-semibold text-stone-950">Next Actions</h2>
                  </div>
                  <button type="button" onClick={() => openStockQueue("needsAttention")} className="text-left text-xs font-semibold text-[#8f3124] hover:text-[#b7412e] sm:text-right">Open Stock Control</button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Research", todayWorkflow.toResearch.length, "stock", "needsAttention", "Missing price research"],
                    ["List", todayWorkflow.readyToList.length, "stock", "readyToList", "All items"],
                    ["Ship", todayWorkflow.soldNotShipped.length, "sales", "awaitingShipment", ""],
                    ["Proof", todayWorkflow.missingProof.length, "stock", "needsAttention", "Missing proof"],
                  ].map(([label, value, tab, section, issue]) => (
                    <button key={label} type="button" onClick={() => { if (tab === "stock") openStockQueue(section, issue || "All items"); else openSalesQueue(section); }} className="rounded-2xl border border-stone-200 bg-[#fffdf8] p-4 text-left transition hover:border-[#e06b2c]/35 hover:bg-[#fff6e6]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
                      <p className="mt-2 text-3xl font-semibold text-stone-950">{value}</p>
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 xl:grid-cols-3">
                <section className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-[0_10px_30px_rgba(41,37,36,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#b7412e]">Stock Snapshot</p>
                  <div className="mt-4 grid gap-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2"><span className="text-sm text-stone-500">Items</span><span className="font-semibold text-stone-950">{items.length}</span></div>
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2"><span className="text-sm text-stone-500">Unsold cost</span><span className="font-semibold text-stone-950">{money(sectionSummaries.stock.inventoryValue)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-sm text-stone-500">Ready to list</span><span className="font-semibold text-stone-950">{sectionSummaries.stock.readyToList}</span></div>
                  </div>
                </section>

                <section className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-[0_10px_30px_rgba(41,37,36,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#e06b2c]">Sales Snapshot</p>
                  <div className="mt-4 grid gap-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2"><span className="text-sm text-stone-500">Month sales</span><span className="font-semibold text-stone-950">{money(monthlySummary.salesTotal)}</span></div>
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2"><span className="text-sm text-stone-500">Awaiting shipment</span><span className="font-semibold text-stone-950">{sectionSummaries.sales.awaitingShipment}</span></div>
                    <div className="flex items-center justify-between"><span className="text-sm text-stone-500">Month profit</span><span className="font-semibold text-lime-800">{money(monthlySummary.profit)}</span></div>
                  </div>
                </section>

                <section className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-[0_10px_30px_rgba(41,37,36,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1f9d99]">Tax Readiness</p>
                  <div className="mt-4 grid gap-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2"><span className="text-sm text-stone-500">Proof complete</span><span className="font-semibold text-stone-950">{proofSummary.proofComplete}</span></div>
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2"><span className="text-sm text-stone-500">Missing proof</span><span className="font-semibold text-stone-950">{proofSummary.missingProof}</span></div>
                    <div className="flex items-center justify-between"><span className="text-sm text-stone-500">Eigenbeleg needed</span><span className="font-semibold text-stone-950">{proofSummary.needsEigenbeleg}</span></div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {DISABLED_LEGACY_UI && activeTab === "dashboard" && (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-950">Monthly reseller dashboard</h2>
                <p className="mt-1 text-sm text-neutral-600">Working view for the current month. Use it to compare eBay sales against purchases, fees, shipping, and missing receipt records before preparing your monthly bookkeeping pack.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <StatCard icon={ShoppingCart} label="Sales" value={money(monthlySummary.salesTotal)} />
                  <StatCard icon={ReceiptText} label="Inventory cash spent" value={money(monthlySummary.purchaseTotal)} />
                  <StatCard icon={Euro} label="Fees + shipping" value={money(monthlySummary.feesTotal)} />
                  <StatCard icon={Package} label="Inventory items" value={items.length} sub={`${summary.sold} sold total`} />
                </div>
                <div className="mt-4 rounded-2xl border border-orange-100 bg-[#fffaf0] p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-950">Today workflow</h3>
                      <p className="text-xs text-neutral-500">Quick queues for the next daily actions.</p>
                    </div>
                    <button type="button" onClick={() => openStockQueue("needsAttention")} className="text-left text-xs font-semibold text-orange-700 hover:text-orange-900 sm:text-right">Open Stock Control</button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Items to research", todayWorkflow.toResearch.length, "stock", "needsAttention", "Price checks"],
                      ["Ready to list", todayWorkflow.readyToList.length, "stock", "readyToList", "Listing queue"],
                      ["Sold not shipped", todayWorkflow.soldNotShipped.length, "sales", "awaitingShipment", "Ship next"],
                      ["Missing proof", todayWorkflow.missingProof.length, "stock", "needsAttention", "Proof gaps"],
                    ].map(([label, value, tab, section, sub]) => (
                      <button key={label} type="button" onClick={() => { if (tab === "stock") openStockQueue(section, label === "Items to research" ? "Missing price research" : label === "Missing proof" ? "Missing proof" : "All items"); else openSalesQueue(section); }} className="rounded-xl border border-stone-200 bg-white p-3 text-left transition hover:border-[#f0be45]/60 hover:bg-[#f0be45]/10">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-stone-500">{label}</p>
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">{sub}</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                  <h3 className="text-sm font-semibold text-neutral-950">Classification counts</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {classificationOptions.map((classification) => (
                      <div key={classification} className="rounded-xl bg-white p-3">
                        <p className="text-xs font-semibold text-neutral-600">{classification}</p>
                        <p className="mt-1 text-2xl font-semibold text-neutral-950">{classificationCounts[classification] || 0}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-950">German tax-prep checklist</h2>
                <div className="mt-4 space-y-3 text-sm text-neutral-700">
                  <p className="rounded-2xl bg-neutral-50 p-3">1. Record every sourced item with purchase date, seller/source, location, and payment method.</p>
                  <p className="rounded-2xl bg-neutral-50 p-3">2. Attach receipt status or prepare an Eigenbeleg when no formal receipt exists.</p>
                  <p className="rounded-2xl bg-neutral-50 p-3">3. Reconcile monthly eBay sales, fees, shipping, returns, and inventory status.</p>
                  <p className="rounded-2xl bg-neutral-50 p-3">4. Review EÜR-style yearly totals before sending records to tax software or a Steuerberater.</p>
                </div>
              </div>
            </div>
          )}

          {(activeTab === "finance" && financeSection === "taxRecords") && (
            <div className="grid gap-5">
              <div className="rounded-3xl border border-stone-200 bg-[#fffdf8] p-5 shadow-[0_12px_32px_rgba(41,37,36,0.05)]">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="mb-3 h-1 w-14 rounded-full bg-[#b7412e]" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#b7412e]">Receipt Records</p>
                    <h2 className="mt-1 text-xl font-semibold text-stone-950">Tax Proof Manager</h2>
                    <p className="mt-1 text-sm leading-6 text-stone-600">Check which purchases have a receipt record, which need attention, and where external files are stored.</p>
                  </div>
                  <p className="rounded-2xl border border-[#b7412e]/15 bg-[#b7412e]/8 px-3 py-2 text-sm font-semibold text-[#8f3124]">{items.length} items</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <StatCard icon={Package} label="Total items" value={proofSummary.totalItems} />
                  <StatCard icon={ReceiptText} label="Complete" value={proofSummary.proofComplete} />
                  <StatCard icon={FileText} label="Missing Proof" value={proofSummary.missingProof} />
                  <StatCard icon={FileText} label="Eigenbeleg Needed" value={proofSummary.needsEigenbeleg} />
                  <StatCard icon={ReceiptText} label="External references" value={proofSummary.externallyStored} />
                </div>
              </div>

              <div className="rounded-3xl border border-lime-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 border-b border-lime-100 pb-3">
                  <h3 className="text-lg font-semibold text-stone-950">Complete Records</h3>
                  <p className="text-sm text-stone-600">Items with a usable receipt record or tax proof reference.</p>
                </div>
                <div className="grid gap-3">
                  {receiptRecordGroups.complete.length === 0 && <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">No complete receipt records yet.</p>}
                  {receiptRecordGroups.complete.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-lime-100 bg-lime-50/45 p-4">
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-stone-950">{item.name}</h4>
                            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">Complete</span>
                          </div>
                          <p className="mt-1 text-sm text-stone-600">{item.proofType || item.receiptType || "Receipt Record"} / {item.purchaseDate || "no date"} / {money(item.proofAmount || item.purchasePrice)}</p>
                        </div>
                        <button type="button" onClick={() => editItem(item)} className="rounded-xl border border-lime-200 bg-white px-3 py-2 text-sm font-semibold text-lime-800 hover:bg-lime-50">Edit record</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#b7412e]/15 bg-[#fffdf8] p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 border-b border-[#b7412e]/10 pb-3">
                  <h3 className="text-lg font-semibold text-stone-950">Needs Attention</h3>
                  <p className="text-sm text-stone-600">Missing proof, Eigenbeleg tasks, missing receipt notes, or items marked for review.</p>
                </div>
                <div className="grid gap-3">
                {receiptRecordGroups.needsAttention.length === 0 && receiptRecordGroups.expensesMissingNotes.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-stone-600">No receipt records need attention.</p>}
                {receiptRecordGroups.needsAttention.map((item) => {
                  const eigenbelegOpen = expandedEigenbelegId === item.id;
                  const statusLabel = needsProofRecord(item) ? "Missing Proof" : needsEigenbeleg(item) ? "Eigenbeleg Needed" : "Review Needed";
                  const statusClass = needsProofRecord(item) ? "bg-red-50 text-red-700 border-red-100" : needsEigenbeleg(item) ? "bg-[#f0be45]/25 text-[#6f4e05] border-[#f0be45]/30" : "bg-orange-50 text-orange-800 border-orange-100";
                  return (
                    <article key={item.id} className="premium-card rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-stone-950">{item.name}</h3>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</span>
                            {itemClassification(item) === DEFAULT_CLASSIFICATION && <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">Review Needed</span>}
                          </div>
                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Purchase date</p><p className="font-semibold">{item.purchaseDate || "-"}</p></div>
                            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Purchase price</p><p className="font-semibold">{money(item.purchasePrice)}</p></div>
                            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Receipt record</p><p className="font-semibold">{item.proofType || item.receiptType || "Not set"}</p></div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button type="button" onClick={() => editItem(item)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Edit record</button>
                          {needsEigenbeleg(item) && <button type="button" onClick={() => setExpandedEigenbelegId(eigenbelegOpen ? null : item.id)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">{eigenbelegOpen ? "Hide Eigenbeleg" : "Eigenbeleg"}</button>}
                        </div>
                      </div>

                      {eigenbelegOpen && (
                        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Eigenbeleg preview</p>
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => copyEigenbeleg(item)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Copy</button>
                              <button type="button" onClick={() => window.print()} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Print</button>
                            </div>
                          </div>
                          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs text-stone-700">{eigenbelegText(item)}</pre>
                        </div>
                      )}
                    </article>
                  );
                })}
                {receiptRecordGroups.expensesMissingNotes.map((expense) => (
                  <article key={expense.id} className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-stone-950">{expense.description}</h4>
                          <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">Missing receipt note</span>
                        </div>
                        <p className="mt-1 text-sm text-stone-600">{expense.date} / {expense.category} / {money(expense.amount)}</p>
                      </div>
                      <button type="button" onClick={() => { editExpense(expense); openFinanceQueue("reconciliation"); }} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Edit expense</button>
                    </div>
                  </article>
                ))}
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 border-b border-stone-100 pb-3">
                  <h3 className="text-lg font-semibold text-stone-950">External File References</h3>
                  <p className="text-sm text-stone-600">Receipt files, folder references, and proof locations stored outside ResellIt.</p>
                </div>
                <div className="grid gap-3">
                  {receiptRecordGroups.externalFiles.length === 0 && <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">No external receipt file references recorded.</p>}
                  {receiptRecordGroups.externalFiles.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-stone-200 bg-[#fffdf8] p-4">
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-stone-950">{item.name}</h4>
                            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">External reference</span>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                            <div className="rounded-xl bg-white p-3"><p className="text-xs text-stone-500">File name</p><p className="break-all font-semibold">{item.proofFileName || item.proofImageName || "-"}</p></div>
                            <div className="rounded-xl bg-white p-3"><p className="text-xs text-stone-500">Folder / proof location</p><p className="break-all font-semibold">{item.proofFolderLocation || "Stored externally"}</p></div>
                          </div>
                        </div>
                        <button type="button" onClick={() => editItem(item)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Edit reference</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "finance" && financeSection === "reconciliation" && (
            <div className="grid gap-5">
              <FinanceHeader title={financeSectionDetails.reconciliation[0]} subtitle={financeSectionDetails.reconciliation[1]} meta={`${ebayImportBatches.length} imported batches`} />

              <div className="rounded-3xl border border-[#f0be45]/20 bg-white p-5 shadow-sm">
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <StatCard icon={Download} label="Unresolved imported records" value={ebayImportBatches.reduce((sum, batch) => sum + batch.rows.length, 0)} sub="CSV rows saved for matching" accentClass="bg-[#f0be45]" />
                  <StatCard icon={Euro} label="Fee reconciliation" value={money(monthlyClosing.platformFeeTotal)} sub="Compare against platform reports" accentClass="bg-[#f0be45]" />
                  <StatCard icon={FileText} label="Payout matching" value={money(sectionSummaries.finance.pendingPayout)} sub="Placeholder estimate" accentClass="bg-[#f0be45]" />
                </div>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">eBay import tools</h2>
                    <p className="mt-1 max-w-3xl text-sm text-neutral-600">Upload monthly eBay CSV reports locally so sales, fees, payouts, and imported platform records can be checked together.</p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-4 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Stored batches</p>
                    <p className="mt-1 text-2xl font-semibold text-neutral-950">{ebayImportBatches.length}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                    <h3 className="text-sm font-semibold text-neutral-950">Import batch</h3>
                    <div className="mt-3 grid gap-3">
                      <Input label="Batch month" type="month" value={importMonth} onChange={(e) => setImportMonth(e.target.value)} />
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-neutral-600">CSV file</span>
                        <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="block w-full rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-amber-50" />
                      </label>
                      {csvError && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{csvError}</p>}
                      {csvPreview && (
                        <button type="button" onClick={saveCsvBatch} className="inline-flex items-center justify-center rounded-2xl bg-orange-300 px-4 py-3 text-sm font-semibold text-stone-950 hover:bg-orange-200">
                          Save Import Batch
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-neutral-950">Mapping helper</h3>
                    <p className="mt-1 text-sm text-neutral-600">Exact eBay column mapping comes later. For now, check whether your report includes columns that could map to these reconciliation fields.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ebayMappingHints.map((hint) => (
                        <span key={hint} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">{hint}</span>
                      ))}
                    </div>
                    {csvPreview && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Detected columns</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {csvPreview.columns.map((column, index) => (
                            <span key={`${column}-${index}`} className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">{column}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {csvPreview && (
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-950">Preview: {csvPreview.fileName}</h2>
                      <p className="text-sm text-neutral-600">{csvPreview.rows.length} rows detected for {importMonth}</p>
                    </div>
                    <p className="text-xs font-medium text-neutral-500">Preview shows up to 10 rows</p>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          {csvPreview.columns.map((column, index) => (
                            <th key={`${column}-${index}`} className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.rows.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-b border-neutral-100">
                            {csvPreview.columns.map((column, columnIndex) => (
                              <td key={`${column}-${columnIndex}`} className="max-w-64 truncate px-3 py-2 text-neutral-700">{row[column]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-950">Saved eBay report batches</h2>
                <div className="mt-4 grid gap-3">
                  {ebayImportBatches.length === 0 && <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">No imported eBay CSV batches yet.</p>}
                  {ebayImportBatches.map((batch) => (
                    <div key={batch.id} className="flex flex-col gap-3 rounded-2xl bg-neutral-50 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-neutral-950">{batch.sourceFileName}</p>
                        <p className="mt-1 text-sm text-neutral-600">Month: {batch.month} / Rows: {batch.rows.length} / Imported: {new Date(batch.importedAt).toLocaleString("de-DE")}</p>
                      </div>
                      <button type="button" onClick={() => deleteCsvBatch(batch.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "finance" && financeSection === "taxRecords" && (
            <div className="grid gap-5">
              <FinanceHeader title={financeSectionDetails.taxRecords[0]} subtitle={financeSectionDetails.taxRecords[1]} meta={`${workflowQueues.needsTaxReview.length + taxRecordQueues.expensesWithoutReceiptNote.length} open checks`} />

              <div className="rounded-3xl border border-[#f0be45]/20 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">Tax readiness</h2>
                    <p className="mt-1 text-sm text-neutral-600">See what is ready, what needs a receipt record, and what needs a classification decision.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatCard icon={ReceiptText} label="Tax Ready" value={Math.max(0, items.length - workflowQueues.needsTaxReview.length)} sub="No open item tax checks" accentClass="bg-[#f0be45]" />
                  <StatCard icon={FileText} label="Needs Record" value={taxRecordQueues.missingProof.length + taxRecordQueues.eigenbelegNeeded.length + taxRecordQueues.expensesWithoutReceiptNote.length} sub="Proof, Eigenbeleg, or expense note" accentClass="bg-[#f0be45]" />
                  <StatCard icon={Info} label="Review Needed" value={taxRecordQueues.reviewLater.length} sub="Unsure / Review Later" accentClass="bg-[#f0be45]" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <QueueCard icon={ReceiptText} label="Missing proof" value={taxRecordQueues.missingProof.length} sub="Items without receipt or proof location" onClick={() => openStockQueue("needsAttention", "Missing proof")} />
                  <QueueCard icon={FileText} label="Eigenbeleg needed" value={taxRecordQueues.eigenbelegNeeded.length} sub="Self-receipts to draft or file" onClick={() => openFinanceQueue("taxRecords")} tone="finance" />
                  <QueueCard icon={ReceiptText} label="Expenses without receipt note" value={taxRecordQueues.expensesWithoutReceiptNote.length} sub="Add missing receipt context" onClick={() => openFinanceQueue("reconciliation")} tone="finance" />
                  <QueueCard icon={Info} label="Unsure / Review Later" value={taxRecordQueues.reviewLater.length} sub="Classification needs decision" onClick={() => openFinanceQueue("taxRecords")} tone="finance" />
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-neutral-950">Expense receipt-note gaps</h3>
                <div className="mt-3 grid gap-2">
                  {taxRecordQueues.expensesWithoutReceiptNote.length === 0 && <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">No expenses without receipt notes.</p>}
                  {taxRecordQueues.expensesWithoutReceiptNote.map((expense) => (
                    <article key={expense.id} className="rounded-2xl bg-neutral-50 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-neutral-950">{expense.description}</p>
                          <p className="mt-1 text-sm text-neutral-600">{expense.date} / {expense.category} / {expense.paymentMethod}</p>
                        </div>
                        <button type="button" onClick={() => { editExpense(expense); openFinanceQueue("reconciliation"); }} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Edit expense</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "sales" && (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-[#e06b2c]/20 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-2 h-1 w-14 rounded-full bg-[#e06b2c]" />
                    <h2 className="text-xl font-semibold text-neutral-950">Sold Items / Sales & Shipping</h2>
                    <p className="mt-1 text-sm text-neutral-600">Review sold item bookkeeping, shipping, refunds, and problem orders.</p>
                  </div>
                  <p className="rounded-xl border border-[#e06b2c]/20 bg-[#fff7ec] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#9c481b]">{salesWorkflow.items.length} sold records</p>
                </div>
                <p className="mt-4 rounded-2xl border border-[#eadfce] bg-[#fffaf0] p-3 text-sm leading-6 text-neutral-700">For detailed order status, use eBay. ResellIt stores only the records needed for stock and tax tracking.</p>
              </div>

              <div className="grid gap-4">
                {shippingTrackerGroups.map(([groupLabel, groupItems]) => (
                  <section key={groupLabel} className="rounded-2xl border border-[#eadfce] bg-[#fffaf0] p-4 shadow-sm">
                    <div className="flex flex-col gap-1 border-b border-[#eadfce] pb-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8a3915]">{groupLabel}</h3>
                      <span className="text-xs font-semibold text-neutral-500">{groupItems.length} items</span>
                    </div>
                    <div className="mt-3 divide-y divide-[#eadfce] rounded-xl border border-[#eadfce] bg-white">
                      {groupItems.length === 0 && <p className="p-4 text-sm text-neutral-500">No items to review.</p>}
                      {groupItems.map((item) => (
                        <article key={item.id} className="p-3">
                          <div className="grid gap-3 lg:grid-cols-[1fr_2fr_auto] lg:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-semibold text-neutral-950">{item.name || "Untitled item"}</h4>
                                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(item)}`}>{itemStatus(item)}</span>
                              </div>
                              <p className="mt-1 text-xs text-neutral-500">Sold {item.saleDate || "date not set"}</p>
                              <p className="mt-1 text-xs font-semibold text-neutral-600">{buyerPlatformLabel(item.buyerPlatform)}</p>
                            </div>

                            <div className="grid gap-2 text-xs text-neutral-700 sm:grid-cols-3 xl:grid-cols-5">
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Sale price</span>{money(finalSaleValue(item))}</p>
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Purchase cost</span>{money(item.purchasePrice)}</p>
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Platform fees</span>{money(platformFees(item))}</p>
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Buyer shipping</span>{money(shippingChargedValue(item))}</p>
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Actual shipping</span>{money(actualShippingValue(item))}</p>
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Packaging</span>{money(packagingCostValue(item))}</p>
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Refund</span>{refundValue(item) ? money(refundValue(item)) : "-"}</p>
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Net profit</span><strong className={itemProfitValue(item) >= 0 ? "text-lime-800" : "text-red-700"}>{money(itemProfitValue(item))}</strong></p>
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Tracking</span>{item.trackingNumber || "-"}</p>
                              <p><span className="block font-semibold uppercase tracking-wide text-neutral-500">Notes</span>{item.trackingNotes || item.notes || item.refundReason || "-"}</p>
                            </div>

                            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                              <button type="button" onClick={() => editItem(item)} className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50">Edit</button>
                              <a href={dhlTrackingUrl(item.trackingNumber)} target="_blank" rel="noreferrer" className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${item.trackingNumber ? "bg-[#fff7ec] text-[#8a3915] hover:bg-[#f0be45]/30" : "pointer-events-none bg-neutral-100 text-neutral-400"}`}>Open DHL</a>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <div className="rounded-2xl border border-dashed border-[#e06b2c]/35 bg-white p-4">
                <h3 className="text-sm font-semibold text-neutral-950">eBay Import / Reconciliation coming next</h3>
                <p className="mt-1 text-sm text-neutral-600">Future imports can reconcile eBay order reports with ResellIt stock, tax proof, and local records.</p>
              </div>
            </div>
          )}

          {activeTab === "finance" && financeSection === "thisMonth" && (
            <div id="monthly-closing-summary" className="grid gap-5 print:block">
              <FinanceHeader title={financeSectionDetails.thisMonth[0]} subtitle={financeSectionDetails.thisMonth[1]} meta={CURRENT_MONTH} />

              <div className="rounded-3xl border border-[#f0be45]/20 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 border-b border-[#f0be45]/20 pb-3">
                  <h3 className="text-lg font-semibold text-neutral-950">Monthly performance</h3>
                  <p className="text-sm text-neutral-600">Fast view of what came in, what went out, and what may still need matching.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <StatCard icon={ShoppingCart} label="Revenue" value={money(sectionSummaries.finance.revenue)} accentClass="bg-[#f0be45]" />
                  <StatCard icon={ReceiptText} label="Expenses" value={money(sectionSummaries.finance.expenses)} accentClass="bg-[#f0be45]" />
                  <StatCard icon={Euro} label="Estimated profit" value={money(sectionSummaries.finance.estimatedProfit)} accentClass="bg-[#f0be45]" />
                  <StatCard icon={Package} label="Sold items" value={monthlyClosing.soldCount} accentClass="bg-[#f0be45]" />
                  <StatCard icon={FileText} label="Pending payouts estimate" value={money(sectionSummaries.finance.pendingPayout)} accentClass="bg-[#f0be45]" />
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">Month-end organizer</h2>
                    <p className="mt-1 max-w-3xl text-sm text-neutral-600">Export or print the monthly pack when sales, fees, shipping, expenses, and receipt records have been checked.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[180px_auto_auto]">
                    <Input label="Closing month" type="month" value={closingMonth} onChange={(e) => setClosingMonth(e.target.value)} />
                    <button type="button" onClick={exportMonthlyClosingJson} className="inline-flex items-center justify-center rounded-2xl bg-orange-300 px-4 py-3 text-sm font-semibold text-stone-950 hover:bg-orange-200 print:hidden">Export JSON</button>
                    <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 print:hidden">Print Summary</button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={ShoppingCart} label="Sales total" value={money(monthlyClosing.salesTotal)} sub={`${monthlyClosing.soldCount} sold items`} />
                  <StatCard icon={ReceiptText} label="Inventory cash spent" value={money(monthlyClosing.purchaseTotal)} sub={`${monthlyClosing.purchasedCount} purchased items`} />
                  <StatCard icon={Euro} label="Shipping charged" value={money(monthlyClosing.shippingCharged)} />
                  <StatCard icon={Package} label="Actual shipping costs" value={money(monthlyClosing.actualShippingCosts)} />
                  <StatCard icon={Package} label="Packaging costs" value={money(monthlyClosing.packagingCosts)} />
                  <StatCard icon={Euro} label="Refunds / returns" value={money(monthlyClosing.refundTotal)} />
                  <StatCard icon={FileText} label="Platform fees" value={money(monthlyClosing.platformFeeTotal)} sub="eBay/import matching" />
                  <StatCard icon={ReceiptText} label="Expenses" value={money(monthlyClosing.expenseTotal)} sub={`${monthlyClosing.expenseCount} expense records`} />
                  <StatCard icon={Euro} label="Profit estimate" value={money(monthlyClosing.profitEstimate)} sub="sold item profit - expenses" />
                  <StatCard icon={ReceiptText} label="Missing proof" value={monthlyClosing.missingProofItems.length} />
                  <StatCard icon={FileText} label="Review later" value={monthlyClosing.reviewItems.length} sub="Unsure / Review Later" />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm print:break-inside-avoid">
                  <h3 className="text-sm font-semibold text-neutral-950">Counts by classification</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {classificationOptions.map((classification) => (
                      <div key={classification} className="rounded-2xl bg-neutral-50 p-4">
                        <p className="text-xs font-semibold text-neutral-600">{classification}</p>
                        <p className="mt-1 text-2xl font-semibold text-neutral-950">{monthlyClosing.classificationBreakdown[classification] || 0}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm print:break-inside-avoid">
                  <h3 className="text-sm font-semibold text-neutral-950">Closing checks</h3>
                  <div className="mt-3 grid gap-3">
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Items missing proof</p>
                      {monthlyClosing.missingProofItems.length === 0 ? (
                        <p className="mt-1 text-sm text-neutral-600">No missing proof records found for this month.</p>
                      ) : (
                        <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                          {monthlyClosing.missingProofItems.map((item) => <li key={item.id}>{item.name} / {itemClassification(item)}</li>)}
                        </ul>
                      )}
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Unsure / Review Later</p>
                      {monthlyClosing.reviewItems.length === 0 ? (
                        <p className="mt-1 text-sm text-neutral-600">No review-later items found for this month.</p>
                      ) : (
                        <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                          {monthlyClosing.reviewItems.map((item) => <li key={item.id}>{item.name} / {item.status}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "finance" && financeSection === "reconciliation" && (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-[#f0be45]/20 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">Bookkeeping prep</h2>
                    <p className="mt-1 text-sm text-neutral-600">Add expenses and receipt notes so imported payouts, fees, and month-end totals are easier to match.</p>
                  </div>
                  <StatCard icon={Euro} label="Filtered monthly total" value={money(filteredExpenseTotal)} sub={`${filteredExpenses.length} records`} />
                </div>
              </div>

              <form onSubmit={saveExpense} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">{editingExpenseId ? "Edit expense" : "Add expense"}</h3>
                    <p className="mt-1 text-sm text-neutral-500">Stored locally with the rest of your ResellIt records.</p>
                  </div>
                  {editingExpenseId && <button type="button" onClick={() => { setEditingExpenseId(null); setExpenseForm(emptyExpense); }} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel edit</button>}
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Input label="Date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                  <Select label="Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                    {expenseCategories.map((category) => <option key={category}>{category}</option>)}
                  </Select>
                  <Input label="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Tape, boxes, fuel..." />
                  <Input label="Amount EUR" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                  <Select label="Payment method" value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}>
                    <option>Cash</option><option>Card</option><option>PayPal</option><option>Bank transfer</option><option>Other</option>
                  </Select>
                  <Select label="Receipt available" value={expenseForm.receiptAvailable} onChange={(e) => setExpenseForm({ ...expenseForm, receiptAvailable: e.target.value })}>
                    <option>Yes</option><option>No</option>
                  </Select>
                  <Select label="Linked item optional" value={expenseForm.linkedItemId} onChange={(e) => setExpenseForm({ ...expenseForm, linkedItemId: e.target.value })}>
                    <option value="">No linked item</option>
                    {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                  <Input label="Receipt notes" value={expenseForm.receiptNotes} onChange={(e) => setExpenseForm({ ...expenseForm, receiptNotes: e.target.value })} placeholder="Receipt location, note, missing reason..." />
                </div>
                <button type="submit" className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-orange-300 px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-orange-200 sm:w-auto">
                  {editingExpenseId ? "Save Expense" : "Add Expense"}
                </button>
              </form>

              <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-3">
                  <Input label="Filter month" type="month" value={expenseMonthFilter} onChange={(e) => setExpenseMonthFilter(e.target.value)} />
                  <Select label="Filter category" value={expenseCategoryFilter} onChange={(e) => setExpenseCategoryFilter(e.target.value)}>
                    <option>All categories</option>
                    {expenseCategories.map((category) => <option key={category}>{category}</option>)}
                  </Select>
                </div>
              </div>

              <div className="grid gap-3">
                {filteredExpenses.length === 0 && <p className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600 shadow-sm">No expenses match the current filters.</p>}
                {filteredExpenses.map((expense) => {
                  const linkedItem = items.find((item) => item.id === expense.linkedItemId);
                  return (
                    <article key={expense.id} className="premium-card rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-neutral-950">{expense.description}</h3>
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">{expense.category}</span>
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">{expense.receiptAvailable === "Yes" ? "Receipt" : "No receipt"}</span>
                          </div>
                          <p className="mt-1 text-sm text-neutral-600">{expense.date} / {expense.paymentMethod}{linkedItem ? ` / linked to ${linkedItem.name}` : ""}</p>
                          {expense.receiptNotes && <p className="mt-1 text-sm text-neutral-500">{expense.receiptNotes}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="rounded-2xl bg-stone-900 px-4 py-2 text-sm font-semibold text-amber-50">{money(expense.amount)}</p>
                          <button type="button" onClick={() => editExpense(expense)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Edit</button>
                          <button type="button" onClick={() => deleteExpense(expense.id)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Delete</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "finance" && financeSection === "yearEnd" && (
            <div className="grid gap-5">
              <FinanceHeader title={financeSectionDetails.yearEnd[0]} subtitle={financeSectionDetails.yearEnd[1]} meta={CURRENT_YEAR} />

              <div className="rounded-3xl border border-[#f0be45]/20 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 border-b border-[#f0be45]/20 pb-3">
                  <h2 className="text-lg font-semibold text-neutral-950">Annual tax prep totals</h2>
                  <p className="text-sm text-neutral-600">Year-to-date support overview for German reseller self-reporting. This is tax support, not legal or tax advice.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={ReceiptText} label={`Inventory cash spent ${CURRENT_YEAR}`} value={money(yearlySummary.purchaseTotal)} accentClass="bg-[#f0be45]" />
                  <StatCard icon={ShoppingCart} label={`Gross sales ${CURRENT_YEAR}`} value={money(yearlySummary.salesTotal)} accentClass="bg-[#f0be45]" />
                  <StatCard icon={Euro} label="Fees + shipping" value={money(yearlySummary.feesTotal)} accentClass="bg-[#f0be45]" />
                  <StatCard icon={ReceiptText} label="Expenses" value={money(yearlySummary.expenseTotal)} accentClass="bg-[#f0be45]" />
                  <StatCard icon={Euro} label="Estimated EÜR profit" value={money(yearlySummary.profit)} accentClass="bg-[#f0be45]" />
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 border-b border-neutral-100 pb-3">
                  <h3 className="text-lg font-semibold text-neutral-950">Business-only view</h3>
                  <p className="text-sm text-neutral-600">Uses items classified as Business Stock / Resale Inventory where possible.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <StatCard icon={ShoppingCart} label="Business sales" value={money(yearlyBusinessSummary.salesTotal)} sub={`${yearlyBusinessSummary.soldCount} sold items`} />
                  <StatCard icon={ReceiptText} label="Business inventory cash spent" value={money(yearlyBusinessSummary.purchaseTotal)} />
                  <StatCard icon={Euro} label="Business fees + shipping" value={money(yearlyBusinessSummary.feesTotal)} />
                  <StatCard icon={ReceiptText} label="All expense records" value={money(yearlySummary.expenseTotal)} sub="Expense records are not classification-split" />
                  <StatCard icon={Euro} label="Business item profit" value={money(yearlyBusinessSummary.profit)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "tools" && (
            <div className="grid gap-4">
            <div className="premium-panel overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-4 h-1 w-12 rounded-full bg-[#1f9d99]" />
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Backup reminder</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-700">Export a local backup after important inventory, sales, or expense updates.</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">App info</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-700">ResellIt is localStorage-only in this browser. No backend or cloud sync is connected.</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Future tools</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-700">Templates, settings, and help utilities can be expanded here without changing the core workflow.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-950">Tools</h2>
                <p className="mt-1 text-sm text-neutral-600">Local utilities for backups, future templates, settings, and help. Data stays in this browser unless you export it.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={exportJson} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-[#f0be45]/20">Export Backup</button>
                  <label className="cursor-pointer rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-[#f0be45]/20">
                    Import Backup
                    <input type="file" accept="application/json,.json" onChange={importBackupJson} className="hidden" />
                  </label>
                </div>
                {backupMessage && <p className="mt-3 rounded-xl bg-stone-50 p-3 text-sm text-stone-700">{backupMessage}</p>}
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-neutral-950">Future utilities</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-sm font-semibold text-neutral-800">Templates</p><p className="mt-1 text-xs text-neutral-500">Reusable listing and sourcing presets.</p></div>
                  <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-sm font-semibold text-neutral-800">Settings</p><p className="mt-1 text-xs text-neutral-500">Future local preferences.</p></div>
                  <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-sm font-semibold text-neutral-800">Help</p><p className="mt-1 text-xs text-neutral-500">Workflow notes and reminders.</p></div>
                </div>
              </div>
            </div>
            </div>
          )}

          {activeTab !== "stock" && activeTab !== "sales" && filtered.map((item) => {
            const itemProfit = itemProfitValue(item);
            const classification = itemClassification(item);
            const proofExpanded = expandedProofId === item.id;
            const priceExpanded = expandedCardPanel === `${item.id}:price`;
            const listingExpanded = expandedCardPanel === `${item.id}:listing`;
            const feeExpanded = expandedCardPanel === `${item.id}:fees`;
            const proofStatus = needsProofRecord(item) ? "Missing proof" : "Proof recorded";
            const listingDraft = generateListingDraft(item);
            const itemListingLabels = listingLabels(item);
            return (
              <article key={item.id} className="premium-card rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-950 md:text-lg">{item.name}</h3>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(item)}`}>{itemStatus(item)}</span>
                      <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-amber-50">{classification}</span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{item.category || "No category"}</span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{item.sourceType} / {item.sourceLocation || "No location"} / bought {item.purchaseDate}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => editItem(item)} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"><Edit3 size={16} /> Edit</button>
                    <button onClick={() => deleteItem(item.id)} className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                  <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Purchase</p><p className="mt-1 font-semibold">{money(item.purchasePrice)}</p></div>
                  <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Listing</p><p className="mt-1 font-semibold">{money(item.chosenListingPrice || item.expectedSalePrice)}</p></div>
                  {isSoldStatus(item) && <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Final sale</p><p className="mt-1 font-semibold">{money(finalSaleValue(item))}</p></div>}
                  <div className={`rounded-2xl border p-3 ${proofBadgeClass(item)}`}><p className="text-xs opacity-75">Proof</p><p className="mt-1 font-semibold">{proofStatus}</p></div>
                  <div className="col-span-2 rounded-2xl bg-lime-100 p-3 text-lime-900 md:col-span-1"><p className="text-xs text-lime-700">Profit</p><p className="mt-1 font-semibold">{money(itemProfit)}</p></div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setExpandedCardPanel(priceExpanded ? "" : `${item.id}:price`)} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">{priceExpanded ? "Hide price" : "Price"}</button>
                  <button type="button" onClick={() => setExpandedCardPanel(listingExpanded ? "" : `${item.id}:listing`)} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">{listingExpanded ? "Hide listing" : "Listing"}</button>
                  <button type="button" onClick={() => setExpandedProofId(proofExpanded ? null : item.id)} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">{proofExpanded ? "Hide proof" : "Proof"}</button>
                  <button type="button" onClick={() => setExpandedCardPanel(feeExpanded ? "" : `${item.id}:fees`)} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">{feeExpanded ? "Hide fees" : "Fees"}</button>
                </div>

                {priceExpanded && <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Price research</p>
                      <p className="mt-1 text-sm text-neutral-600">Use sold/completed listings where possible; active listings are asking prices, not confirmed sale prices.</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                        <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Low</p><p className="font-semibold">{money(item.priceResearchLow || item.researchedLowPrice)}</p></div>
                        <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Mid</p><p className="font-semibold">{money(item.priceResearchMid || item.researchedMidPrice)}</p></div>
                        <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">High</p><p className="font-semibold">{money(item.priceResearchHigh || item.researchedHighPrice)}</p></div>
                        <div className="rounded-xl bg-stone-100 p-3 text-stone-900"><p className="text-xs text-stone-500">Chosen</p><p className="font-semibold">{money(item.chosenListingPrice || item.expectedSalePrice)}</p></div>
                      </div>
                      {item.priceResearchNotes && <p className="mt-3 text-sm text-neutral-600">{item.priceResearchNotes}</p>}
                      {item.priceResearchUpdatedAt && <p className="mt-2 text-xs text-neutral-500">Updated: {new Date(item.priceResearchUpdatedAt).toLocaleString("de-DE")}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                      {priceResearchLinks(item).map(([label, href]) => (
                        <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{label}</a>
                      ))}
                    </div>
                  </div>
                </div>}

                {listingExpanded && (
                  <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Listing Studio</p>
                        <p className="mt-1 font-semibold text-neutral-950">{listingDraft.title}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">{listingDraft.condition}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => copyText(itemListingLabels.title.toLowerCase(), listingDraft.title)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{itemListingLabels.copyTitle}</button>
                        <button type="button" onClick={() => copyText(itemListingLabels.condition.toLowerCase(), listingDraft.condition)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{itemListingLabels.copyCondition}</button>
                        <button type="button" onClick={() => copyText(itemListingLabels.description.toLowerCase(), listingDraft.description)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{itemListingLabels.copyDescription}</button>
                        <button type="button" onClick={() => copyText("HTML description", listingDraft.htmlDescription)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{itemListingLabels.copyHtmlDescription}</button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-xs font-semibold text-neutral-500">{itemListingLabels.included}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{item.includedAccessories || item.includedItems || itemListingLabels.notSpecified}</p>
                      </div>
                      <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-xs font-semibold text-neutral-500">Source fields</p>
                        <p className="mt-1 text-sm text-neutral-700">{[item.brand, item.model, item.sizeSpecs, item.colour, item.conditionGrade].filter(Boolean).join(" / ") || itemListingLabels.noSourceFields}</p>
                      </div>
                    </div>
                    <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs text-neutral-700">{listingDraft.description}</pre>
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs font-semibold text-neutral-500">{itemListingLabels.preview}</p>
                      <div className="max-h-80 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                        <div dangerouslySetInnerHTML={{ __html: listingDraft.htmlDescription }} />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {listingResearchLinks(item).map(([label, href]) => (
                        <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{label}</a>
                      ))}
                    </div>
                  </div>
                )}

                {feeExpanded && <div className="mt-3 rounded-2xl bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Fee model</p>
                    <p className="mt-1 text-sm">Mode: <strong>{item.ebayFeeMode || (item.ebayFees ? "Legacy fee field" : DEFAULT_EBAY_FEE_MODE)}</strong></p>
                    <p className="mt-2 text-sm text-neutral-600">eBay/platform fees: <strong>{money(platformFees(item))}</strong></p>
                    {(item.ebayFeeMode || DEFAULT_EBAY_FEE_MODE) === "Business Estimate" && <p className="mt-2 text-xs font-medium text-neutral-500">Estimate only; reconcile with eBay report.</p>}
                  </div>}

                {proofExpanded && (
                  <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Proof details</p>
                        <p className="mt-2 text-sm">Type: <strong>{item.proofType || item.receiptType || "Eigenbeleg"}</strong></p>
                        <p className="mt-1 text-sm">Date: <strong>{item.proofDate || item.purchaseDate || "-"}</strong></p>
                        <p className="mt-1 text-sm">Amount: <strong>{money(item.proofAmount || item.purchasePrice)}</strong></p>
                        <p className="mt-1 text-sm">External proof: <strong>{item.proofStoredExternally || (item.proofFileName || item.proofFolderLocation ? "Yes" : "No")}</strong></p>
                        {item.proofFileName && <p className="mt-1 text-sm">File: <strong>{item.proofFileName}</strong></p>}
                        {item.proofFolderLocation && <p className="mt-1 text-sm break-all">Folder: <strong>{item.proofFolderLocation}</strong></p>}
                        {item.noReceiptReason && <p className="mt-2 text-sm text-neutral-600">No receipt reason: {item.noReceiptReason}</p>}
                        {item.proofImageDataUrl && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Legacy stored image</p>
                            <img src={item.proofImageDataUrl} alt={`${item.name} proof detail`} className="mt-2 max-h-56 rounded-2xl border border-neutral-200 object-contain" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Eigenbeleg draft</p>
                          <button type="button" onClick={() => copyEigenbeleg(item)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-white">Copy Eigenbeleg</button>
                        </div>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs text-neutral-700">{eigenbelegText(item)}</pre>
                        {item.proofNotes && <p className="mt-3 text-sm text-neutral-600">{item.proofNotes}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
        </main>
      </div>
    </div>
  );
}
