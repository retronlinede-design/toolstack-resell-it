import React, { useMemo, useState } from "react";
import { Plus, Package, ReceiptText, ShoppingCart, FileText, Euro, Download, Trash2, Edit3, Info, Search, ClipboardList, Truck, StickyNote } from "lucide-react";
import resellItLogo from "./assets/resellitlogo1.png";

const STORAGE_KEY = "toolstack.resellerit.v1";
const EBAY_IMPORTS_KEY = "toolstack.resellit.ebayImports.v1";
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);
const CURRENT_YEAR = new Date().getFullYear().toString();
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
const proofTypes = ["Shop receipt", "Invoice", "Eigenbeleg", "Flea-market photo", "Private seller note", "Other"];
const statusOptions = ["Draft", "Sourced", "Ready to List", "Listed", "Sold", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned", "Written Off"];
const quickStatusOptions = ["Ready to List", "Listed", "Sold", "Ready to Pack", "Packed", "Shipped", "Completed"];
const shippingWorkflowStatuses = ["Sold", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned"];
const legacyStatusLabels = { "Written off": "Written Off", "Kept private": "Completed" };
const expenseCategories = ["Packaging", "Shipping supplies", "Fuel / travel", "Flea-market fees", "Storage", "Office supplies", "Platform/service costs", "Other"];
const itemTemplates = [
  ["Private personal item", {
    classification: "Private Sale / Personal Collection",
    sourceType: "Private seller",
    status: "Draft",
    hasReceipt: "No",
    receiptType: "Eigenbeleg needed",
    proofType: "Private seller note",
    ebayFeeMode: DEFAULT_EBAY_FEE_MODE,
  }],
  ["Flea-market stock", {
    classification: "Business Stock / Resale Inventory",
    sourceType: "Flea market",
    status: "Sourced",
    hasReceipt: "No",
    receiptType: "Eigenbeleg needed",
    proofType: "Eigenbeleg",
  }],
  ["Second-hand shop stock", {
    classification: "Business Stock / Resale Inventory",
    sourceType: "Second-hand shop",
    status: "Sourced",
    hasReceipt: "Yes",
    receiptType: "Shop receipt",
    proofType: "Shop receipt",
  }],
  ["Legacy stock", {
    classification: "Legacy Stock / Previous Business",
    sourceType: "Other",
    status: "Draft",
    hasReceipt: "No",
    receiptType: "Eigenbeleg needed",
    proofType: "Eigenbeleg",
  }],
];
const classificationHelp = [
  ["Private Sale / Personal Collection", "Originally owned personal item."],
  ["Business Stock / Resale Inventory", "Bought or sourced with resale intent."],
  ["Legacy Stock / Previous Business", "Existing old stock from a previous business."],
  ["Unsure / Review Later", "Needs later review before reporting decisions."],
];
const workflowSections = [
  ["basic", "Basic Info", Info, "Identity, category, source, and status"],
  ["pricing", "Pricing & Research", Search, "Comps, listing price, fees, and profit"],
  ["listing", "Listing Studio", ClipboardList, "eBay title, copy, HTML, and research links"],
  ["proof", "Proof & Receipts", ReceiptText, "Receipt status, file references, Eigenbeleg"],
  ["sale", "Shipping & Sale", Truck, "Final sale, shipping, and completion"],
  ["notes", "Notes & Extras", StickyNote, "Defects, included items, and metadata"],
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
const stockSections = [["items", "Items"], ["sourcing", "Sourcing"], ["proof", "Proof"], ["listings", "Listings"]];
const financeSections = [["expenses", "Expenses"], ["monthly", "Monthly"], ["tax", "Tax Summary"], ["ebay", "eBay Import"]];

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
  shippingChargedToBuyer: "",
  actualShippingCost: "",
  carrier: "DHL",
  trackingNumber: "",
  shippedDate: "",
  trackingNotes: "",
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
  listingTitle: "",
  brand: "",
  model: "",
  sizeSpecs: "",
  colour: "",
  conditionGrade: "",
  conditionText: "",
  conditionNotes: "",
  descriptionText: "",
  htmlDescription: "",
  includedItems: "",
  defectsNotes: "",
  shippingNotes: "",
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

function itemClassification(item) {
  return item.classification || DEFAULT_CLASSIFICATION;
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
  return finalSaleValue(item) + shippingChargedValue(item) - number(item.purchasePrice) - actualShippingValue(item) - platformFees(item);
}

function hasProofRecord(item) {
  return Boolean(
    item.proofStoredExternally === "Yes" ||
    item.proofFileName ||
    item.proofFolderLocation ||
    item.proofImageDataUrl ||
    item.proofNotes ||
    item.proofAmount ||
    item.receiptType ||
    item.proofType
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
  if (status === "Ready to Pack") return "bg-[#f0be45]/25 text-[#6f4e05] border-[#f0be45]/35";
  if (status === "Packed") return "bg-[#e06b2c]/20 text-[#8a3915] border-[#e06b2c]/30";
  if (status === "Shipped") return "bg-[#1f9d99]/15 text-[#0f5f5b] border-[#1f9d99]/25";
  if (status === "Ready to List" || status === "Listed") return "bg-[#f0be45]/25 text-[#6f4e05] border-[#f0be45]/35";
  if (status === "Returned" || status === "Written Off") return "bg-red-50 text-red-700 border-red-200";
  return "bg-stone-100 text-stone-700 border-stone-200";
}

function proofBadgeClass(item) {
  if (hasProofRecord(item)) return "bg-lime-50 text-lime-800 border-lime-200";
  if (needsEigenbeleg(item)) return "bg-[#f0be45]/20 text-[#6f4e05] border-[#f0be45]/35";
  return "bg-red-50 text-red-700 border-red-200";
}

function expectedListingValue(item) {
  return number(item.chosenListingPrice || item.expectedSalePrice);
}

function hasPriceResearch(item) {
  return Boolean(item.researchQuery || item.researchedLowPrice || item.researchedMidPrice || item.researchedHighPrice || item.chosenListingPrice || item.priceResearchNotes);
}

function hasListingDraft(item) {
  return Boolean(item.listingTitle || item.conditionText || item.descriptionText || item.htmlDescription);
}

function isSoldStatus(item) {
  return ["Sold", "Ready to Pack", "Packed", "Shipped", "Completed", "Returned"].includes(itemStatus(item)) || Boolean(item.finalSalePrice || item.salePrice || item.saleDate);
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

function receiptOrInvoiceProof(item) {
  return ["Shop receipt", "Invoice"].includes(item.proofType || item.receiptType);
}

function priceResearchQuery(item) {
  return (item.researchQuery || item.ebayTitle || item.name || "").trim();
}

function priceResearchLinks(item) {
  const query = encodeURIComponent(priceResearchQuery(item));
  if (!query) return [];

  return [
    ["eBay DE active", `https://www.ebay.de/sch/i.html?_nkw=${query}`],
    ["eBay DE sold/completed", `https://www.ebay.de/sch/i.html?_nkw=${query}&LH_Complete=1&LH_Sold=1`],
    ["Google", `https://www.google.com/search?q=${query}`],
    ["Kleinanzeigen", `https://www.kleinanzeigen.de/s-suchanfrage.html?keywords=${query}`],
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

function listingPrice(item) {
  return item.chosenListingPrice || item.expectedSalePrice || "";
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

function generatedListingTitle(item) {
  return item.listingTitle || item.ebayTitle || [item.brand, item.model, item.name, item.sizeSpecs, item.colour].filter(Boolean).join(" - ") || item.name;
}

function generatedConditionText(item) {
  return item.conditionText || [item.conditionGrade, item.conditionNotes || item.notes, item.defectsNotes && `Defects / wear: ${item.defectsNotes}`].filter(Boolean).join("\n") || "Please review the description for condition details.";
}

function generateHtmlDescription(item, plainDescription) {
  const details = [
    ["Brand", item.brand],
    ["Model", item.model],
    ["Size / specs", item.sizeSpecs],
    ["Colour", item.colour],
    ["Condition", item.conditionGrade],
  ].filter(([, value]) => value);
  const included = bulletLines(item.includedItems);
  const notes = [
    item.conditionNotes && ["Condition notes", item.conditionNotes],
    item.defectsNotes && ["Defects / wear", item.defectsNotes],
    item.shippingNotes && ["Shipping", item.shippingNotes],
    item.priceResearchNotes && ["Research notes", item.priceResearchNotes],
  ].filter(Boolean);

  return [
    '<div style="max-width:700px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#2b211d;line-height:1.5;">',
    `  <h2 style="font-size:22px;margin:0 0 12px;">${escapeHtml(generatedListingTitle(item))}</h2>`,
    details.length ? '  <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">' : "",
    ...details.map(([label, value]) => `    <tr><th style="text-align:left;border:1px solid #e5ded4;padding:8px;background:#faf7ef;">${escapeHtml(label)}</th><td style="border:1px solid #e5ded4;padding:8px;">${escapeHtml(value)}</td></tr>`),
    details.length ? "  </table>" : "",
    `  <h3 style="font-size:16px;margin:16px 0 8px;">Condition</h3>`,
    `  <p style="margin:0 0 12px;">${escapeHtml(generatedConditionText(item)).replaceAll("\n", "<br>")}</p>`,
    included.length ? '  <h3 style="font-size:16px;margin:16px 0 8px;">What is included</h3>' : "",
    included.length ? "  <ul>" : "",
    ...included.map((line) => `    <li>${escapeHtml(line)}</li>`),
    included.length ? "  </ul>" : "",
    notes.map(([label, value]) => `  <h3 style="font-size:16px;margin:16px 0 8px;">${escapeHtml(label)}</h3>\n  <p style="margin:0 0 12px;">${escapeHtml(value).replaceAll("\n", "<br>")}</p>`).join("\n"),
    plainDescription ? `  <h3 style="font-size:16px;margin:16px 0 8px;">Description</h3>\n  <p style="margin:0;">${escapeHtml(plainDescription).replaceAll("\n", "<br>")}</p>` : "",
    "</div>",
  ].filter(Boolean).join("\n");
}

function generateListingDraft(item) {
  const title = generatedListingTitle(item);
  const condition = generatedConditionText(item);
  const price = listingPrice(item);
  const descriptionParts = [
    item.name && `Item: ${item.name}`,
    item.brand && `Brand: ${item.brand}`,
    item.model && `Model: ${item.model}`,
    item.category && `Category: ${item.category}`,
    item.sizeSpecs && `Size / specs: ${item.sizeSpecs}`,
    item.colour && `Colour: ${item.colour}`,
    price && `Listing price: ${money(price)}`,
    condition && `Condition: ${condition}`,
    item.includedItems && `Included: ${item.includedItems}`,
    item.defectsNotes && `Defects / notes: ${item.defectsNotes}`,
    item.shippingNotes && `Shipping: ${item.shippingNotes}`,
    item.priceResearchNotes && `Research notes: ${item.priceResearchNotes}`,
  ].filter(Boolean);
  const description = item.descriptionText || descriptionParts.join("\n");

  return {
    title,
    condition,
    description,
    htmlDescription: item.htmlDescription || generateHtmlDescription(item, description),
  };
}

function loadInitialItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoItems;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : demoItems;
  } catch {
    return demoItems;
  }
}

function loadInitialExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
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

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-[#fffdf8] p-3 shadow-[0_10px_26px_rgba(41,37,36,0.045)]">
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

function Input({ label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</span>
      <input {...props} className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70" />
    </label>
  );
}

function Select({ label, className = "", children, ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</span>
      <select {...props} className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70">
        {children}
      </select>
    </label>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
      <h3 className="mb-3 text-sm font-semibold text-stone-950">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
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
  const [stockSection, setStockSection] = useState("items");
  const [financeSection, setFinanceSection] = useState("expenses");
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
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [advancedInventoryFiltersOpen, setAdvancedInventoryFiltersOpen] = useState(false);
  const [expandedCardPanel, setExpandedCardPanel] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [backupMenuOpen, setBackupMenuOpen] = useState(false);
  const [proofFilter, setProofFilter] = useState("All");
  const [expandedEigenbelegId, setExpandedEigenbelegId] = useState(null);
  const [activeWorkflowSection, setActiveWorkflowSection] = useState("basic");

  function persist(nextItems) {
    setItems(nextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: nextItems, expenses, updatedAt: new Date().toISOString() }));
  }

  function persistAll(nextItems, nextExpenses) {
    setItems(nextItems);
    setExpenses(nextExpenses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: nextItems, expenses: nextExpenses, updatedAt: new Date().toISOString() }));
  }

  function persistExpenses(nextExpenses) {
    persistAll(items, nextExpenses);
  }

  function saveCurrentItem({ keepAdding = false } = {}) {
    if (!form.name.trim()) return;
    const clean = {
      ...form,
      name: form.name.trim(),
      classification: form.classification || DEFAULT_CLASSIFICATION,
      ebayFeeMode: form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE,
      estimatedEbayFee: form.ebayFeeMode === "Business Estimate" ? String(ebayBaseFee(form)) : form.estimatedEbayFee,
      priceResearchUpdatedAt: form.researchQuery || form.researchedLowPrice || form.researchedMidPrice || form.researchedHighPrice || form.chosenListingPrice || form.priceResearchNotes
        ? new Date().toISOString()
        : form.priceResearchUpdatedAt,
    };
    const next = editingId
      ? items.map((item) => (item.id === editingId ? { ...item, ...clean } : item))
      : [{ id: crypto.randomUUID(), ...clean }, ...items];
    persist(next);
    setForm(emptyItem);
    setEditingId(null);
    if (keepAdding) setItemFormOpen(false);
  }

  function saveItem(e) {
    e.preventDefault();
    saveCurrentItem();
  }

  function applyItemTemplate(template) {
    setForm({
      ...form,
      ...template,
      ebayFeeMode: template.classification === "Private Sale / Personal Collection" ? DEFAULT_EBAY_FEE_MODE : form.ebayFeeMode,
    });
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
    setForm({ ...emptyItem, ...item });
    setEditingId(item.id);
    setActiveTab("dashboard");
    setAdvancedFeesOpen(false);
    setItemFormOpen(true);
    setActiveWorkflowSection("basic");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  function updateItemShipmentStatus(id, status) {
    const today = new Date().toISOString().slice(0, 10);
    persist(items.map((item) => {
      if (item.id !== id) return item;
      const updates = { status, carrier: item.carrier || "DHL" };
      if (status === "Shipped" && !item.shippedDate) updates.shippedDate = today;
      return { ...item, ...updates };
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
    const sold = items.filter((item) => item.status === "Sold").length;
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
      missingProofCount: items.filter((item) => !hasProofRecord(item)).length,
      missingPriceResearchCount: items.filter((item) => !hasPriceResearch(item)).length,
      missingListingDraftCount: items.filter((item) => !hasListingDraft(item)).length,
      reviewLaterCount: items.filter((item) => itemClassification(item) === DEFAULT_CLASSIFICATION).length,
    };
  }, [items]);

  const todayWorkflow = useMemo(() => ({
    toResearch: items.filter((item) => !hasPriceResearch(item) && !isSoldStatus(item)),
    readyToList: items.filter((item) => itemStatus(item) === "Ready to List"),
    soldNotShipped: items.filter((item) => ["Sold", "Ready to Pack", "Packed"].includes(itemStatus(item))),
    missingProof: items.filter((item) => !hasProofRecord(item)),
  }), [items]);

  const salesWorkflow = useMemo(() => {
    const salesItems = items.filter(isSoldStatus);
    return {
      items: salesItems,
      awaitingShipment: salesItems.filter((item) => ["Sold", "Ready to Pack", "Packed"].includes(itemStatus(item))),
      shippedItems: salesItems.filter((item) => itemStatus(item) === "Shipped" || item.trackingNumber || item.shippedDate),
      completedSales: salesItems.filter((item) => itemStatus(item) === "Completed").slice(0, 6),
      problemItems: salesItems.filter((item) => itemStatus(item) === "Returned" || item.status === "Written Off"),
      counts: shippingWorkflowStatuses.reduce((counts, status) => {
        counts[status] = salesItems.filter((item) => itemStatus(item) === status).length;
        return counts;
      }, {}),
    };
  }, [items]);

  const inventoryManagerItems = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    const filteredItems = items.filter((item) => {
      const searchText = [item.name, item.category, item.ebayTitle, item.sourceName, item.sourceLocation, item.listingTitle].join(" ").toLowerCase();
      if (query && !searchText.includes(query)) return false;
      if (inventoryClassification !== "All classifications" && itemClassification(item) !== inventoryClassification) return false;
      if (inventoryStatus !== "All statuses" && itemStatus(item) !== inventoryStatus) return false;
      if (inventoryCategory !== "All categories" && item.category !== inventoryCategory) return false;
      if (inventoryIssueFilter === "Missing proof" && hasProofRecord(item)) return false;
      if (inventoryIssueFilter === "Missing price research" && hasPriceResearch(item)) return false;
      if (inventoryIssueFilter === "Missing listing draft" && hasListingDraft(item)) return false;
      if (inventoryIssueFilter === "Sold only" && !isSoldStatus(item)) return false;
      if (inventoryIssueFilter === "Unsold only" && isSoldStatus(item)) return false;
      return true;
    });

    return [...filteredItems].sort((a, b) => {
      if (inventorySort === "Oldest purchase date") return String(a.purchaseDate || "").localeCompare(String(b.purchaseDate || ""));
      if (inventorySort === "Highest expected/listing value") return expectedListingValue(b) - expectedListingValue(a);
      if (inventorySort === "Highest final sale price") return finalSaleValue(b) - finalSaleValue(a);
      if (inventorySort === "Highest estimated profit") return itemProfitValue(b) - itemProfitValue(a);
      if (inventorySort === "Missing proof first") return Number(hasProofRecord(a)) - Number(hasProofRecord(b));
      return String(b.purchaseDate || "").localeCompare(String(a.purchaseDate || ""));
    });
  }, [inventoryCategory, inventoryClassification, inventoryIssueFilter, inventorySearch, inventorySort, inventoryStatus, items]);

  const proofSummary = useMemo(() => ({
    totalItems: items.length,
    proofComplete: items.filter(hasProofRecord).length,
    missingProof: items.filter((item) => !hasProofRecord(item)).length,
    needsEigenbeleg: items.filter(needsEigenbeleg).length,
    externallyStored: items.filter(externallyStoredProof).length,
  }), [items]);

  const proofManagerItems = useMemo(() => (
    items.filter((item) => {
      if (proofFilter === "Missing proof") return !hasProofRecord(item);
      if (proofFilter === "Needs Eigenbeleg") return needsEigenbeleg(item);
      if (proofFilter === "Externally stored") return externallyStoredProof(item);
      if (proofFilter === "Receipt / invoice") return receiptOrInvoiceProof(item);
      if (proofFilter === "Private items") return itemClassification(item) === "Private Sale / Personal Collection";
      if (proofFilter === "Business stock") return itemClassification(item) === "Business Stock / Resale Inventory";
      if (proofFilter === "Legacy stock") return itemClassification(item) === "Legacy Stock / Previous Business";
      return true;
    })
  ), [items, proofFilter]);

  const monthlySummary = useMemo(() => {
    const monthlyPurchases = items.filter((item) => inMonth(item.purchaseDate));
    const monthlySales = items.filter((item) => inMonth(item.saleDate));
    const purchaseTotal = monthlyPurchases.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = monthlySales.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0);
    const feesTotal = monthlySales.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0);
    const profit = monthlySales.reduce((sum, item) => sum + itemProfitValue(item), 0) - monthlyPurchases.filter((item) => !inMonth(item.saleDate)).reduce((sum, item) => sum + number(item.purchasePrice), 0);
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
    const profit = yearlySales.reduce((sum, item) => sum + itemProfitValue(item), 0) - yearlyPurchases.filter((item) => !inYear(item.saleDate)).reduce((sum, item) => sum + number(item.purchasePrice), 0) - expenseTotal;
    return { purchaseTotal, salesTotal, feesTotal, expenseTotal, profit };
  }, [expenses, items]);

  const monthlyClosing = useMemo(() => {
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
    const platformFeeTotal = soldItems.reduce((sum, item) => sum + platformFees(item), 0);
    const expenseTotal = monthlyExpenses.reduce((sum, expense) => sum + number(expense.amount), 0);
    const profitEstimate = salesTotal + shippingCharged - purchaseTotal - actualShippingCosts - platformFeeTotal - expenseTotal;
    const missingProofItems = activityItems.filter((item) => !hasProofRecord(item));
    const reviewItems = activityItems.filter((item) => itemClassification(item) === DEFAULT_CLASSIFICATION);

    return {
      month: closingMonth,
      salesTotal,
      purchaseTotal,
      shippingCharged,
      actualShippingCosts,
      platformFeeTotal,
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
  }, [closingMonth, expenses, items]);

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
    let nextItems = [];
    if (activeTab === "dashboard") nextItems = [];
    else if (activeTab === "stock" && stockSection === "sourcing") nextItems = items.filter((item) => item.status === "Sourced" || item.status === "Listed");
    else if (activeTab === "sales") nextItems = items.filter((item) => ["Sold", "Shipped", "Completed", "Returned"].includes(itemStatus(item)) || isSoldStatus(item));
    else if (activeTab === "finance" && financeSection === "tax") nextItems = items;
    else nextItems = items;

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
    const draft = generateListingDraft(form);
    setForm({
      ...form,
      listingTitle: draft.title,
      conditionText: draft.condition,
      descriptionText: draft.description,
      htmlDescription: draft.htmlDescription,
    });
  }

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {
      window.prompt(`Copy ${label}`, text || "");
    }
  }

  const activeModule = modules.find(([key]) => key === activeTab);
  const activeTitle = activeModule?.[1] || "Dashboard";

  return (
    <div className="min-h-screen bg-[#24120f] p-3 text-stone-900 sm:p-4 md:p-5">
      <div className="mx-auto grid max-w-[1680px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[2rem] border border-[#5a3028] bg-[#351c17] shadow-[0_20px_60px_rgba(0,0,0,0.28)] lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-auto">
          <div className="flex h-3">
            <div className="flex-1 bg-[#b7412e]" />
            <div className="flex-1 bg-[#e06b2c]" />
            <div className="flex-1 bg-[#f0be45]" />
            <div className="flex-1 bg-[#1f9d99]" />
          </div>
          <div className="space-y-4 p-4 md:p-5">
          <div className="space-y-4">
            <div>
              <div className="rounded-3xl bg-black/35 p-3">
                <img src={resellItLogo} alt="Resell-It" className="mx-auto h-auto max-h-28 w-full object-contain sm:max-h-32 lg:max-h-36" />
              </div>
            </div>
            <nav className="space-y-2">
              <button type="button" onClick={() => setActiveTab("dashboard")} className={`w-full overflow-hidden rounded-2xl border text-left transition ${activeTab === "dashboard" ? "border-[#f0be45]/60 bg-white/8 shadow-[0_8px_22px_rgba(240,190,69,0.12)]" : "border-[#5a3028] bg-[#45251f] hover:border-[#f0be45]/35 hover:bg-white/7"}`}>
                <div className="flex h-1.5">
                  <div className="flex-1 bg-[#b7412e]" />
                  <div className="flex-1 bg-[#e06b2c]" />
                  <div className="flex-1 bg-[#f0be45]" />
                  <div className="flex-1 bg-[#1f9d99]" />
                </div>
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#f0be45]">Home</p>
                  <p className="mt-0.5 text-base font-semibold text-[#fff7e8]">Dashboard</p>
                </div>
              </button>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {modules.map(([key, label, stripeClass, accentClass, activeTextClass, activeBgClass, hoverClass]) => (
                  <button key={key} onClick={() => setActiveTab(key)} className={`overflow-hidden rounded-2xl border text-left transition ${activeTab === key ? `${activeBgClass} ${activeTextClass} shadow-[0_8px_18px_rgba(0,0,0,0.16)]` : `border-[#5a3028] bg-[#45251f] text-[#f3e6d6] ${hoverClass}`}`}>
                    <div className={`h-1.5 ${stripeClass}`} />
                    <div className="px-3 py-2.5">
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
                <button type="button" onClick={() => { setActiveTab("dashboard"); setEditingId(null); setForm(emptyItem); setItemFormOpen(false); }} className="rounded-xl border border-[#6c3a31] bg-[#351c17] px-3 py-2 text-left text-xs font-semibold text-[#fff7e8] hover:bg-[#523029]">Quick Add item</button>
                <button type="button" onClick={() => { setActiveTab("stock"); setStockSection("items"); }} className="rounded-xl border border-[#6c3a31] bg-[#351c17] px-3 py-2 text-left text-xs font-semibold text-[#fff7e8] hover:bg-[#523029]">Open Stock Control</button>
                <button type="button" onClick={() => setActiveTab("sales")} className="rounded-xl border border-[#6c3a31] bg-[#351c17] px-3 py-2 text-left text-xs font-semibold text-[#fff7e8] hover:bg-[#523029]">Sales & shipping queue</button>
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
          <div className="overflow-hidden rounded-3xl border border-[#eadfce] bg-[#fffaf0] shadow-sm">
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
              <p className="max-w-xl text-sm text-stone-600">Clean local workspace for stock, sales, finance, and tax-prep records.</p>
            </div>
          </div>

        {activeTab === "dashboard" && (
        <>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ShoppingCart} label={`Monthly sales ${CURRENT_MONTH}`} value={money(monthlySummary.salesTotal)} />
          <StatCard icon={ReceiptText} label="Monthly purchases" value={money(monthlySummary.purchaseTotal)} />
          <StatCard icon={Euro} label="Monthly fees" value={money(monthlySummary.feesTotal)} sub="eBay fees + shipping" />
          <StatCard icon={FileText} label="Estimated profit" value={money(monthlySummary.profit)} sub="sales minus purchases, fees, shipping" />
        </section>

        <form onSubmit={saveItem} className="rounded-3xl border border-[#eadfce] bg-[#fffaf0] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-4">
          <div className="mb-4 rounded-2xl border border-[#eadfce] bg-white/80 p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{editingId ? "Item Workspace" : "Add item"}</p>
              <h2 className="mt-0.5 text-base font-semibold text-neutral-950">{editingId ? "Edit Item" : "Quick Add"}</h2>
              <p className="mt-1 text-xs leading-5 text-neutral-500">Fast daily capture first. Open the advanced form only when you need deeper fields.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!editingId && (
                <div className="inline-flex rounded-2xl border border-stone-200 bg-[#fffdf8] p-1">
                  <button type="button" className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${itemFormOpen ? "text-stone-600 hover:bg-[#f0be45]/25" : "bg-[#e06b2c] text-[#24110e] shadow-sm"}`}>Quick Add</button>
                  <button type="button" onClick={() => setItemFormOpen(!itemFormOpen)} className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${itemFormOpen ? "bg-[#e06b2c] text-[#24110e] shadow-sm" : "text-stone-600 hover:bg-[#f0be45]/25"}`}>{itemFormOpen ? "Advanced open" : "Advanced Form"}</button>
                </div>
              )}
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyItem); setItemFormOpen(false); }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Cancel edit</button>}
            </div>
            </div>
          </div>

          {editingId && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
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
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${proofBadgeClass(form)}`}>{quickProofStatus(form)}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${hasListingDraft(form) ? "bg-lime-100 text-lime-800" : "bg-orange-100 text-orange-800"}`}>{hasListingDraft(form) ? "Listing ready" : "Listing draft needed"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:min-w-[520px]">
                      <div className="rounded-2xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Purchase</p><p className="font-semibold">{money(form.purchasePrice)}</p></div>
                      <div className="rounded-2xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Listing</p><p className="font-semibold">{money(form.chosenListingPrice || form.expectedSalePrice)}</p></div>
                      <div className="rounded-2xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Final sale</p><p className="font-semibold">{money(finalSaleValue(form))}</p></div>
                      <div className="rounded-2xl bg-lime-50 p-3 text-lime-900"><p className="text-xs text-lime-700">Profit</p><p className="font-semibold">{money(itemProfitValue(form))}</p></div>
                      <div className="rounded-2xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Proof</p><p className="font-semibold">{hasProofRecord(form) ? "Recorded" : "Missing"}</p></div>
                      <div className="rounded-2xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Listing</p><p className="font-semibold">{hasListingDraft(form) ? "Ready" : "Draft"}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {workflowSections.map(([key, label, Icon, description]) => (
                  <button key={key} type="button" onClick={() => setActiveWorkflowSection(key)} className={`group rounded-3xl border p-4 text-left shadow-sm transition ${activeWorkflowSection === key ? "border-[#e06b2c]/60 bg-[#e06b2c]/20 ring-2 ring-[#e06b2c]/15" : "border-stone-200 bg-white hover:border-[#f0be45]/50 hover:bg-[#f0be45]/15"}`}>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-amber-50 group-hover:bg-[#351c17]">
                      <Icon size={18} />
                    </div>
                    <p className="text-sm font-semibold text-stone-950">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Focused editing panel</p>
                    <h3 className="text-lg font-semibold text-stone-950">{workflowSections.find(([key]) => key === activeWorkflowSection)?.[1]}</h3>
                  </div>
                  <button type="button" onClick={() => saveCurrentItem()} className="rounded-2xl bg-[#e06b2c] px-4 py-3 text-sm font-semibold text-[#24110e] shadow-[0_10px_24px_rgba(224,107,44,0.18)] hover:bg-[#f0be45]">Save item</button>
                </div>

                {activeWorkflowSection === "basic" && (
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
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Input label="Research query" className="sm:col-span-2" value={form.researchQuery || ""} onChange={(e) => setForm({ ...form, researchQuery: e.target.value })} />
                      <Input label="Expected sale price EUR" value={form.expectedSalePrice} onChange={(e) => setForm({ ...form, expectedSalePrice: e.target.value })} />
                      <Input label="Chosen listing price EUR" value={form.chosenListingPrice || ""} onChange={(e) => setForm({ ...form, chosenListingPrice: e.target.value, expectedSalePrice: e.target.value || form.expectedSalePrice })} />
                      <Input label="Researched low EUR" value={form.researchedLowPrice || ""} onChange={(e) => setForm({ ...form, researchedLowPrice: e.target.value })} />
                      <Input label="Researched mid EUR" value={form.researchedMidPrice || ""} onChange={(e) => setForm({ ...form, researchedMidPrice: e.target.value })} />
                      <Input label="Researched high EUR" value={form.researchedHighPrice || ""} onChange={(e) => setForm({ ...form, researchedHighPrice: e.target.value })} />
                      <Select label="eBay fee mode" value={form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE} onChange={(e) => setForm({ ...form, ebayFeeMode: e.target.value })}>{ebayFeeModes.map((mode) => <option key={mode}>{mode}</option>)}</Select>
                      {(form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE) === "Business Estimate" && <Input label="Business fee percent" value={form.feePercent || ""} onChange={(e) => setForm({ ...form, feePercent: e.target.value })} />}
                      {(form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE) === "Business Estimate" && <Input label="Business fixed fee EUR" value={form.fixedFee || ""} onChange={(e) => setForm({ ...form, fixedFee: e.target.value })} />}
                      {(form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE) === "Manual" && <Input label="Manual eBay fee EUR" value={form.manualEbayFee || form.ebayFees || ""} onChange={(e) => setForm({ ...form, manualEbayFee: e.target.value })} />}
                      <Input label="Promoted listing fee EUR" value={form.promotedListingFee || ""} onChange={(e) => setForm({ ...form, promotedListingFee: e.target.value })} />
                      <Input label="Other platform fees EUR" value={form.otherPlatformFees || ""} onChange={(e) => setForm({ ...form, otherPlatformFees: e.target.value })} />
                    </div>
                    <textarea value={form.priceResearchNotes || ""} onChange={(e) => setForm({ ...form, priceResearchNotes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Price research notes..." />
                    <p className="rounded-xl bg-lime-100 p-3 text-sm font-semibold text-lime-800">Profit preview: {money(itemProfitValue(form))}</p>
                  </div>
                )}

                {activeWorkflowSection === "listing" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={generateCurrentListingDraft} className="rounded-2xl bg-orange-300 px-4 py-3 text-sm font-semibold text-stone-950 hover:bg-orange-200">Generate output</button>
                      {listingResearchLinks(form).map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{label}</a>)}
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <Input label="Brand" value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                      <Input label="Model" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                      <Input label="Size / specs" value={form.sizeSpecs || ""} onChange={(e) => setForm({ ...form, sizeSpecs: e.target.value })} />
                      <Input label="Colour" value={form.colour || ""} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
                      <Input label="Condition grade" value={form.conditionGrade || ""} onChange={(e) => setForm({ ...form, conditionGrade: e.target.value })} />
                      <Input label="eBay title legacy field" value={form.ebayTitle || ""} onChange={(e) => setForm({ ...form, ebayTitle: e.target.value })} />
                      <Input label="Listing title" value={form.listingTitle || ""} onChange={(e) => setForm({ ...form, listingTitle: e.target.value })} />
                      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-neutral-600">Condition</span><textarea value={form.conditionText || ""} onChange={(e) => setForm({ ...form, conditionText: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" /></label>
                      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-neutral-600">Plain description</span><textarea value={form.descriptionText || ""} onChange={(e) => setForm({ ...form, descriptionText: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" /></label>
                      <label className="block lg:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-neutral-600">HTML description</span><textarea value={form.htmlDescription || ""} onChange={(e) => setForm({ ...form, htmlDescription: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono text-xs outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" /></label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => copyText("title", form.listingTitle || generatedListingTitle(form))} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy title</button>
                      <button type="button" onClick={() => copyText("condition", form.conditionText || generatedConditionText(form))} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy condition</button>
                      <button type="button" onClick={() => copyText("plain description", form.descriptionText)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy plain description</button>
                      <button type="button" onClick={() => copyText("HTML description", form.htmlDescription)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy HTML description</button>
                    </div>
                    {(form.htmlDescription || form.descriptionText) && <div className="max-h-80 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3"><div dangerouslySetInnerHTML={{ __html: form.htmlDescription || generateHtmlDescription(form, form.descriptionText) }} /></div>}
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
                      <Input label="Final sale price EUR" value={form.finalSalePrice || form.salePrice || ""} onChange={(e) => setForm({ ...form, finalSalePrice: e.target.value })} />
                      <Input label="Shipping charged to buyer EUR" value={form.shippingChargedToBuyer || ""} onChange={(e) => setForm({ ...form, shippingChargedToBuyer: e.target.value })} />
                      <Input label="Actual shipping cost EUR" value={form.actualShippingCost || form.shippingCost || ""} onChange={(e) => setForm({ ...form, actualShippingCost: e.target.value })} />
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

          {!editingId && <div className="space-y-3">
            {!editingId && (
              <div className="rounded-2xl border border-[#eadfce] bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Item templates</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {itemTemplates.map(([label, template]) => (
                    <button key={label} type="button" onClick={() => applyItemTemplate(template)} className="rounded-xl border border-stone-200 bg-[#fffdf8] px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-[#f0be45]/50 hover:bg-[#f0be45]/15">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Input label="Item name" className="sm:col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sony CD Player" />
              <Select label="Classification" className="lg:col-span-2" value={form.classification || DEFAULT_CLASSIFICATION} onChange={(e) => setForm({ ...form, classification: e.target.value, ebayFeeMode: e.target.value === "Private Sale / Personal Collection" ? DEFAULT_EBAY_FEE_MODE : form.ebayFeeMode })}>
                {classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}
              </Select>
              <Input label="Expected/listing price EUR" value={form.chosenListingPrice || form.expectedSalePrice} onChange={(e) => setForm({ ...form, chosenListingPrice: e.target.value, expectedSalePrice: e.target.value })} />
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
                {form.status && !statusOptions.includes(form.status) && <option>{form.status}</option>}
              </Select>
              <Input label="Purchase/source note" className="sm:col-span-2 lg:col-span-3" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} placeholder="Private collection, flea market seller, shop name..." />
              <Select label="Proof status" className="sm:col-span-2 lg:col-span-3" value={quickProofStatus(form)} onChange={(e) => updateQuickProofStatus(e.target.value)}>
                <option>Proof available</option>
                <option>External proof recorded</option>
                <option>Eigenbeleg needed</option>
                <option>Missing proof</option>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/60 p-2">
              <span className="px-1 text-xs font-semibold text-stone-500">Status</span>
              {["Draft", "Sourced", "Ready to List", "Listed"].map((status) => (
                <button key={status} type="button" onClick={() => setForm({ ...form, status })} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${form.status === status ? "border-[#e06b2c]/60 bg-[#e06b2c]/20 text-[#8a3915]" : "border-stone-200 bg-white text-stone-700 hover:bg-[#f0be45]/20"}`}>
                  {status}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-[#eadfce] bg-white/70 p-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#e06b2c] px-3 py-2 text-xs font-semibold text-[#24110e] shadow-[0_8px_18px_rgba(224,107,44,0.18)] transition hover:bg-[#f0be45] sm:w-auto">
                <Plus size={16} /> {editingId ? "Save Changes" : "Add Item"}
              </button>
              {!editingId && (
                <button type="button" onClick={() => saveCurrentItem({ keepAdding: true })} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:border-[#f0be45]/50 hover:bg-[#f0be45]/20 sm:w-auto">
                  <Plus size={16} /> Save + Add another
                </button>
              )}
              <p className="px-1 text-xs text-stone-500 sm:ml-auto">Advanced sections stay below this action bar.</p>
            </div>
          </div>}

          {!editingId && itemFormOpen && <div className="mt-6 space-y-4 border-t border-[#eadfce] pt-5">
            <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
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
                  <button key={key} type="button" onClick={() => setActiveAdvancedSection(key)} className={`rounded-3xl border p-4 text-left transition ${selected ? `${activeClass} ring-2` : `border-stone-200 bg-[#fffdf8] text-stone-950 ${hoverClass}`}`}>
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

            {activeAdvancedSection === "sale" && <FormSection title="eBay sale and fees">
              <Input label="Expected sale price EUR" value={form.expectedSalePrice} onChange={(e) => setForm({ ...form, expectedSalePrice: e.target.value })} />
              <Input label="Sale date" type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} />
              <Input label="Final sale price EUR" value={form.finalSalePrice || form.salePrice || ""} onChange={(e) => setForm({ ...form, finalSalePrice: e.target.value })} />
              <Input label="Shipping charged to buyer EUR" value={form.shippingChargedToBuyer || ""} onChange={(e) => setForm({ ...form, shippingChargedToBuyer: e.target.value })} />
              <Input label="Actual shipping cost EUR" value={form.actualShippingCost || form.shippingCost || ""} onChange={(e) => setForm({ ...form, actualShippingCost: e.target.value })} />
              <Input label="Carrier" value={form.carrier || "DHL"} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />
              <Input label="Tracking number" value={form.trackingNumber || ""} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
              <Input label="Shipped date" type="date" value={form.shippedDate || ""} onChange={(e) => setForm({ ...form, shippedDate: e.target.value })} />
              <Input label="Tracking notes" className="sm:col-span-2" value={form.trackingNotes || ""} onChange={(e) => setForm({ ...form, trackingNotes: e.target.value })} />
            </FormSection>}

            {activeAdvancedSection === "pricing" && <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950">Advanced fee settings</h3>
                  <p className="mt-1 text-sm text-neutral-600">Most private Germany eBay sales start with zero standard selling fee. Add optional promotion or other platform fees only if they apply.</p>
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
                  {(form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE) === "Manual" && (
                    <Input label="Manual eBay fee EUR" value={form.manualEbayFee || form.ebayFees || ""} onChange={(e) => setForm({ ...form, manualEbayFee: e.target.value })} />
                  )}
                  <Input label="Promoted listing fee EUR" value={form.promotedListingFee || ""} onChange={(e) => setForm({ ...form, promotedListingFee: e.target.value })} />
                  <Input label="Other platform fees EUR" value={form.otherPlatformFees || ""} onChange={(e) => setForm({ ...form, otherPlatformFees: e.target.value })} />
                </div>
              )}
              {(form.ebayFeeMode || DEFAULT_EBAY_FEE_MODE) === "Business Estimate" && <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">Business fee calculations are estimates until reconciled with official eBay reports.</p>}
              <p className="mt-3 rounded-xl bg-lime-100 p-3 text-sm font-semibold text-lime-800">Current final profit: {money(itemProfitValue(form))}</p>
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

            {activeAdvancedSection === "pricing" && <>
            <FormSection title="Price research assistant">
              <Input label="Research query" className="sm:col-span-2" value={form.researchQuery || ""} onChange={(e) => setForm({ ...form, researchQuery: e.target.value })} placeholder={form.ebayTitle || form.name || "Search phrase"} />
              <Input label="Researched low EUR" value={form.researchedLowPrice || ""} onChange={(e) => setForm({ ...form, researchedLowPrice: e.target.value })} />
              <Input label="Researched mid EUR" value={form.researchedMidPrice || ""} onChange={(e) => setForm({ ...form, researchedMidPrice: e.target.value })} />
              <Input label="Researched high EUR" value={form.researchedHighPrice || ""} onChange={(e) => setForm({ ...form, researchedHighPrice: e.target.value })} />
              <Input label="Chosen listing price EUR" value={form.chosenListingPrice || ""} onChange={(e) => setForm({ ...form, chosenListingPrice: e.target.value, expectedSalePrice: e.target.value || form.expectedSalePrice })} />
              <label className="block sm:col-span-2 lg:col-span-4">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Price research notes</span>
                <textarea value={form.priceResearchNotes || ""} onChange={(e) => setForm({ ...form, priceResearchNotes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Condition differences, sold comps, missing parts, bundle notes..." />
              </label>
            </FormSection>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-950">Research price</h3>
              <p className="mt-1 text-sm text-neutral-600">Use sold/completed listings where possible; active listings are asking prices, not confirmed sale prices.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {priceResearchLinks(form).map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{label}</a>
                ))}
                {priceResearchLinks(form).length === 0 && <p className="text-sm text-neutral-500">Enter an item name, eBay title, or research query to generate search links.</p>}
              </div>
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

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <label className="block lg:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">eBay title</span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={form.listingTitle || ""} onChange={(e) => setForm({ ...form, listingTitle: e.target.value })} className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                    <button type="button" onClick={() => copyText("title", form.listingTitle || generatedListingTitle(form))} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy title</button>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Condition</span>
                  <textarea value={form.conditionText || ""} onChange={(e) => setForm({ ...form, conditionText: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                  <button type="button" onClick={() => copyText("condition", form.conditionText || generatedConditionText(form))} className="mt-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy condition</button>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Plain description</span>
                  <textarea value={form.descriptionText || ""} onChange={(e) => setForm({ ...form, descriptionText: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                  <button type="button" onClick={() => copyText("plain description", form.descriptionText)} className="mt-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy plain description</button>
                </label>
                <label className="block lg:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">What is included</span>
                  <input value={form.includedItems || ""} onChange={(e) => setForm({ ...form, includedItems: e.target.value })} className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Item, charger, manual..." />
                </label>
                <label className="block lg:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">HTML description</span>
                  <textarea value={form.htmlDescription || ""} onChange={(e) => setForm({ ...form, htmlDescription: e.target.value })} className="min-h-32 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono text-xs outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                  <button type="button" onClick={() => copyText("HTML description", form.htmlDescription)} className="mt-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy HTML description</button>
                </label>
                {(form.htmlDescription || form.descriptionText) && (
                  <div className="lg:col-span-2">
                    <p className="mb-1.5 text-xs font-semibold text-neutral-600">HTML description preview</p>
                    <div className="max-h-80 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div dangerouslySetInnerHTML={{ __html: form.htmlDescription || generateHtmlDescription(form, form.descriptionText) }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Editable source fields</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input label="Brand" value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                  <Input label="Model" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                  <Input label="Size / specs" value={form.sizeSpecs || ""} onChange={(e) => setForm({ ...form, sizeSpecs: e.target.value })} />
                  <Input label="Colour" value={form.colour || ""} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
                  <Input label="Condition grade" value={form.conditionGrade || ""} onChange={(e) => setForm({ ...form, conditionGrade: e.target.value })} placeholder="New, very good, used..." />
                  <Input label="Defects / wear" value={form.defectsNotes || ""} onChange={(e) => setForm({ ...form, defectsNotes: e.target.value })} placeholder="Scratches, missing parts..." />
                  <Input label="Shipping notes" value={form.shippingNotes || ""} onChange={(e) => setForm({ ...form, shippingNotes: e.target.value })} placeholder="Tracked DHL, pickup possible..." />
                  <Input label="Research notes" value={form.priceResearchNotes || ""} onChange={(e) => setForm({ ...form, priceResearchNotes: e.target.value })} />
                  <label className="block sm:col-span-2 lg:col-span-4">
                    <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Condition notes</span>
                    <textarea value={form.conditionNotes || ""} onChange={(e) => setForm({ ...form, conditionNotes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Functional test, cosmetic condition, known issues..." />
                  </label>
                </div>
              </div>
            </div>}

          {activeAdvancedSection === "notes" && <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Condition, missing receipt reason, storage location, defects, tax notes..." />
          </label>}

          </div>}
        </form>
        </>
        )}

        {activeTab === "stock" && (
          <div className="rounded-3xl border border-[#eadfce] bg-[#fffaf0] p-2 shadow-[0_14px_38px_rgba(0,0,0,0.14)]">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {stockSections.map(([key, label]) => (
                <button key={key} type="button" onClick={() => setStockSection(key)} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${stockSection === key ? "bg-[#e06b2c] text-[#24110e]" : "border border-stone-200 bg-white text-stone-700 hover:bg-[#f0be45]/20"}`}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="rounded-3xl border border-[#eadfce] bg-[#fffaf0] p-2 shadow-[0_14px_38px_rgba(0,0,0,0.14)]">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {financeSections.map(([key, label]) => (
                <button key={key} type="button" onClick={() => setFinanceSection(key)} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${financeSection === key ? "bg-[#e06b2c] text-[#24110e]" : "border border-stone-200 bg-white text-stone-700 hover:bg-[#f0be45]/20"}`}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {(activeTab === "stock" || activeTab === "sales" || (activeTab === "finance" && financeSection === "tax")) && <div className="rounded-3xl border border-[#eadfce] bg-[#fffaf0] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
          <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr] md:items-end">
            <Select label="Filter by classification" value={classificationFilter} onChange={(e) => setClassificationFilter(e.target.value)}>
              <option>All classifications</option>
              {classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}
            </Select>
            <p className="text-sm leading-6 text-neutral-600">Use classification to keep personal collection sales separate from stock bought for resale, legacy business stock, and items that need later review.</p>
          </div>
        </div>}

        <section className="grid gap-4">
          {activeTab === "stock" && stockSection === "items" && (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">Inventory Manager</h2>
                    <p className="mt-1 text-sm text-neutral-600">Search, filter, sort, and move items through the resale workflow before monthly closing.</p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-500">{inventoryManagerItems.length} shown</p>
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

              <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
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
                      <option>Sold only</option>
                      <option>Unsold only</option>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {inventoryManagerItems.length === 0 && <p className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600 shadow-sm">No inventory items match the current filters.</p>}
                {inventoryManagerItems.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
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
                          <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Health</p><p className="font-semibold">{[!hasProofRecord(item) && "Proof", !hasPriceResearch(item) && "Price", !hasListingDraft(item) && "Draft"].filter(Boolean).join(", ") || "OK"}</p></div>
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
          )}

          {activeTab === "stock" && stockSection === "listings" && (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">Listing Studio</h2>
                    <p className="mt-1 text-sm text-neutral-600">Prepare and review eBay listing copy for every inventory item. Editing opens the existing detailed item form.</p>
                  </div>
                  <StatCard icon={FileText} label="Missing listing draft" value={inventoryHealth.missingListingDraftCount} sub={`${items.length} total items`} />
                </div>
              </div>

              <div className="grid gap-3">
                {items.length === 0 && <p className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600 shadow-sm">No items yet. Add an item first, then prepare its listing here.</p>}
                {items.map((item) => {
                  const draft = generateListingDraft(item);
                  const hasPlainDescription = Boolean(item.descriptionText);
                  const hasHtmlDescription = Boolean(item.htmlDescription);
                  return (
                    <article key={item.id} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-neutral-950">{item.name}</h3>
                            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-amber-50">{itemClassification(item)}</span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(item)}`}>{itemStatus(item)}</span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl bg-neutral-50 p-3">
                              <p className="text-xs font-semibold text-neutral-500">Listing title</p>
                              <p className="mt-1 text-sm font-semibold text-neutral-900">{draft.title || "Missing"}</p>
                            </div>
                            <div className="rounded-xl bg-neutral-50 p-3">
                              <p className="text-xs font-semibold text-neutral-500">Condition</p>
                              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-neutral-700">{draft.condition || "Missing"}</p>
                            </div>
                            <div className={`rounded-xl p-3 ${hasPlainDescription ? "bg-lime-50 text-lime-900" : "bg-red-50 text-red-800"}`}>
                              <p className="text-xs font-semibold opacity-75">Plain description</p>
                              <p className="mt-1 text-sm font-semibold">{hasPlainDescription ? "Exists" : "Missing"}</p>
                            </div>
                            <div className={`rounded-xl p-3 ${hasHtmlDescription ? "bg-lime-50 text-lime-900" : "bg-red-50 text-red-800"}`}>
                              <p className="text-xs font-semibold opacity-75">HTML description</p>
                              <p className="mt-1 text-sm font-semibold">{hasHtmlDescription ? "Exists" : "Missing"}</p>
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
          )}

          {activeTab === "dashboard" && (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-950">Monthly reseller dashboard</h2>
                <p className="mt-1 text-sm text-neutral-600">Working view for the current month. Use it to compare eBay sales against purchases, fees, shipping, and missing receipt records before preparing your monthly bookkeeping pack.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <StatCard icon={ShoppingCart} label="Sales" value={money(monthlySummary.salesTotal)} />
                  <StatCard icon={ReceiptText} label="Purchases" value={money(monthlySummary.purchaseTotal)} />
                  <StatCard icon={Euro} label="Fees + shipping" value={money(monthlySummary.feesTotal)} />
                  <StatCard icon={Package} label="Inventory items" value={items.length} sub={`${summary.sold} sold total`} />
                </div>
                <div className="mt-4 rounded-2xl border border-orange-100 bg-[#fffaf0] p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-950">Today workflow</h3>
                      <p className="text-xs text-neutral-500">Quick queues for the next daily actions.</p>
                    </div>
                    <button type="button" onClick={() => { setActiveTab("stock"); setStockSection("items"); }} className="text-left text-xs font-semibold text-orange-700 hover:text-orange-900 sm:text-right">Open Stock Control</button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Items to research", todayWorkflow.toResearch.length, "stock", "items", "Price checks"],
                      ["Ready to list", todayWorkflow.readyToList.length, "stock", "listings", "Listing queue"],
                      ["Sold not shipped", todayWorkflow.soldNotShipped.length, "sales", "", "Ship next"],
                      ["Missing proof", todayWorkflow.missingProof.length, "stock", "proof", "Proof gaps"],
                    ].map(([label, value, tab, section, sub]) => (
                      <button key={label} type="button" onClick={() => { setActiveTab(tab); if (section === "items" || section === "proof" || section === "listings") setStockSection(section); }} className="rounded-xl border border-stone-200 bg-white p-3 text-left transition hover:border-[#f0be45]/60 hover:bg-[#f0be45]/10">
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

          {activeTab === "stock" && stockSection === "proof" && (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-stone-200 bg-[#fffdf8] p-5 shadow-[0_12px_32px_rgba(41,37,36,0.05)]">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-950">Proof / Receipts Manager</h2>
                    <p className="mt-1 text-sm text-stone-600">Track where receipts, invoices, seller notes, and Eigenbelege are stored. Originals stay in your own folder system.</p>
                  </div>
                  <p className="text-sm font-semibold text-stone-500">{proofManagerItems.length} shown</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <StatCard icon={Package} label="Total items" value={proofSummary.totalItems} />
                  <StatCard icon={ReceiptText} label="Proof complete" value={proofSummary.proofComplete} />
                  <StatCard icon={FileText} label="Missing proof" value={proofSummary.missingProof} />
                  <StatCard icon={FileText} label="Needs Eigenbeleg" value={proofSummary.needsEigenbeleg} />
                  <StatCard icon={ReceiptText} label="Externally stored" value={proofSummary.externallyStored} />
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#fffdf8] p-4 shadow-[0_12px_32px_rgba(41,37,36,0.05)]">
                <div className="flex flex-wrap gap-2">
                  {["All", "Missing proof", "Needs Eigenbeleg", "Externally stored", "Receipt / invoice", "Private items", "Business stock", "Legacy stock"].map((filter) => (
                    <button key={filter} type="button" onClick={() => setProofFilter(filter)} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${proofFilter === filter ? "bg-[#e06b2c] text-[#24110e]" : "border border-stone-200 bg-white text-stone-700 hover:bg-[#f0be45]/20"}`}>{filter}</button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                {proofManagerItems.length === 0 && <p className="rounded-3xl border border-stone-200 bg-[#fffdf8] p-5 text-sm text-stone-600 shadow-[0_12px_32px_rgba(41,37,36,0.05)]">No proof records match the current filter.</p>}
                {proofManagerItems.map((item) => {
                  const eigenbelegOpen = expandedEigenbelegId === item.id;
                  const proofType = item.proofType || item.receiptType || "Eigenbeleg";
                  const proofStatus = hasProofRecord(item) ? "Proof available" : "Missing proof";
                  return (
                    <article key={item.id} className="rounded-3xl border border-stone-200 bg-[#fffdf8] p-4 shadow-[0_12px_32px_rgba(41,37,36,0.05)]">
                      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-stone-950">{item.name}</h3>
                            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-amber-50">{itemClassification(item)}</span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${proofBadgeClass(item)}`}>{proofStatus}</span>
                            {needsEigenbeleg(item) && <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">Eigenbeleg needed</span>}
                          </div>
                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Purchase date</p><p className="font-semibold">{item.purchaseDate || "-"}</p></div>
                            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Purchase price</p><p className="font-semibold">{money(item.purchasePrice)}</p></div>
                            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Proof type</p><p className="font-semibold">{proofType}</p></div>
                            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Stored externally</p><p className="font-semibold">{externallyStoredProof(item) ? "Yes" : "No"}</p></div>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Proof file name</p><p className="break-all font-semibold">{item.proofFileName || "-"}</p></div>
                            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Proof folder location</p><p className="break-all font-semibold">{item.proofFolderLocation || "-"}</p></div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button type="button" onClick={() => editItem(item)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Edit proof</button>
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
              </div>
            </div>
          )}

          {activeTab === "finance" && financeSection === "ebay" && (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">eBay CSV Import</h2>
                    <p className="mt-1 max-w-3xl text-sm text-neutral-600">Upload a monthly eBay CSV/report locally for reconciliation prep. Files are parsed in this browser and saved to localStorage only. No eBay API, backend, or cloud sync is connected.</p>
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

          {activeTab === "sales" && (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-950">Sales & Shipping</h2>
                <p className="mt-1 text-sm text-neutral-600">Sold-item workflow for packing, DHL tracking, completion, returns, and monthly reconciliation checks.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={ShoppingCart} label="Monthly sales" value={money(monthlySummary.salesTotal)} />
                  <StatCard icon={Truck} label="Items awaiting shipment" value={salesWorkflow.awaitingShipment.length} />
                  <StatCard icon={Euro} label="Fees booked" value={money(monthlySummary.feesTotal)} />
                  <StatCard icon={FileText} label="Recent completed sales" value={salesWorkflow.completedSales.length} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {shippingWorkflowStatuses.map((status) => (
                  <div key={status} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass({ status })}`}>{status}</span>
                    <p className="mt-3 text-2xl font-semibold text-neutral-950">{salesWorkflow.counts[status] || 0}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-950">Items awaiting shipment</h3>
                      <p className="mt-1 text-sm text-neutral-600">Move sold items through packing and shipping. Shipped defaults to DHL if no carrier is set.</p>
                    </div>
                    <p className="rounded-2xl bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800">{salesWorkflow.awaitingShipment.length} open</p>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {salesWorkflow.awaitingShipment.length === 0 && <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">No sold items are waiting for shipment.</p>}
                    {salesWorkflow.awaitingShipment.map((item) => (
                      <article key={item.id} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-neutral-950">{item.name}</h4>
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(item)}`}>{itemStatus(item)}</span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700">{money(finalSaleValue(item))}</span>
                            </div>
                            <p className="mt-1 text-sm text-neutral-600">{item.category || "No category"} / sold {item.saleDate || "date not set"}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => updateItemShipmentStatus(item.id, "Packed")} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-[#f0be45]/20">Mark Packed</button>
                            <button type="button" onClick={() => updateItemShipmentStatus(item.id, "Shipped")} className="rounded-xl bg-[#e06b2c] px-3 py-2 text-xs font-semibold text-[#24110e] hover:bg-[#f0be45]">Mark Shipped</button>
                            <button type="button" onClick={() => updateItemShipmentStatus(item.id, "Completed")} className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-xs font-semibold text-lime-800 hover:bg-lime-100">Mark Completed</button>
                            <button type="button" onClick={() => updateItemShipmentStatus(item.id, "Returned")} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">Mark Returned</button>
                            <button type="button" onClick={() => editItem(item)} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-white">Edit</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-neutral-950">Recent completed sales</h3>
                    <div className="mt-3 grid gap-2">
                      {salesWorkflow.completedSales.length === 0 && <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">No completed sales yet.</p>}
                      {salesWorkflow.completedSales.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-neutral-50 p-3">
                          <p className="font-semibold text-neutral-950">{item.name}</p>
                          <p className="mt-1 text-sm text-neutral-600">{money(finalSaleValue(item))} / {item.saleDate || item.shippedDate || "no date"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-neutral-950">Return/problem items</h3>
                    <div className="mt-3 grid gap-2">
                      {salesWorkflow.problemItems.length === 0 && <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">No returned or written-off sold items.</p>}
                      {salesWorkflow.problemItems.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-red-50 p-3">
                          <p className="font-semibold text-red-900">{item.name}</p>
                          <p className="mt-1 text-sm text-red-700">{itemStatus(item)} / {item.trackingNotes || item.notes || "No problem note recorded"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-neutral-950">Tracking</h3>
                <p className="mt-1 text-sm text-neutral-600">DHL is the default carrier. Tracking links open DHL Sendungsverfolgung in a new tab.</p>
                <div className="mt-4 grid gap-3">
                  {salesWorkflow.shippedItems.length === 0 && <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">No shipped or tracked items yet.</p>}
                  {salesWorkflow.shippedItems.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                      <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-neutral-950">{item.name}</h4>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(item)}`}>{itemStatus(item)}</span>
                          </div>
                          {item.trackingNotes && <p className="mt-1 text-sm text-neutral-600">{item.trackingNotes}</p>}
                        </div>
                        <div className="grid gap-2 text-sm sm:grid-cols-3">
                          <p><span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">Carrier</span>{item.carrier || "DHL"}</p>
                          <p><span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">Tracking</span>{item.trackingNumber || "-"}</p>
                          <p><span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">Shipped</span>{item.shippedDate || "-"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => copyText("tracking number", item.trackingNumber || "")} disabled={!item.trackingNumber} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">Copy tracking number</button>
                          <a href={dhlTrackingUrl(item.trackingNumber)} target="_blank" rel="noreferrer" className={`rounded-xl px-3 py-2 text-xs font-semibold ${item.trackingNumber ? "bg-[#e06b2c] text-[#24110e] hover:bg-[#f0be45]" : "pointer-events-none bg-neutral-200 text-neutral-500"}`}>Open DHL tracking</a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "finance" && financeSection === "monthly" && (
            <div id="monthly-closing-summary" className="grid gap-4 print:block">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">Monthly Closing</h2>
                    <p className="mt-1 max-w-3xl text-sm text-neutral-600">Month-end tax-prep summary for private and business reseller activity. Export the local JSON or print this summary for your records.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[180px_auto_auto]">
                    <Input label="Closing month" type="month" value={closingMonth} onChange={(e) => setClosingMonth(e.target.value)} />
                    <button type="button" onClick={exportMonthlyClosingJson} className="inline-flex items-center justify-center rounded-2xl bg-orange-300 px-4 py-3 text-sm font-semibold text-stone-950 hover:bg-orange-200 print:hidden">Export JSON</button>
                    <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 print:hidden">Print Summary</button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={ShoppingCart} label="Sales total" value={money(monthlyClosing.salesTotal)} sub={`${monthlyClosing.soldCount} sold items`} />
                  <StatCard icon={ReceiptText} label="Purchase total" value={money(monthlyClosing.purchaseTotal)} sub={`${monthlyClosing.purchasedCount} purchased items`} />
                  <StatCard icon={Euro} label="Shipping charged" value={money(monthlyClosing.shippingCharged)} />
                  <StatCard icon={Package} label="Actual shipping costs" value={money(monthlyClosing.actualShippingCosts)} />
                  <StatCard icon={FileText} label="Platform fees" value={money(monthlyClosing.platformFeeTotal)} />
                  <StatCard icon={ReceiptText} label="Expenses" value={money(monthlyClosing.expenseTotal)} sub={`${monthlyClosing.expenseCount} expense records`} />
                  <StatCard icon={Euro} label="Profit estimate" value={money(monthlyClosing.profitEstimate)} sub="sales + shipping charged - purchases - shipping costs - platform fees - expenses" />
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

          {activeTab === "finance" && financeSection === "expenses" && (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">Expenses Manager</h2>
                    <p className="mt-1 text-sm text-neutral-600">Track general reselling expenses such as packaging, labels, fuel, storage, office supplies, and flea-market fees.</p>
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
                    <article key={expense.id} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
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

          {activeTab === "finance" && financeSection === "tax" && (
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">Tax Summary for EÜR-style yearly totals</h2>
              <p className="mt-1 text-sm text-neutral-600">Year-to-date support overview for German reseller self-reporting. This is tax support, not legal or tax advice.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={ReceiptText} label={`Purchases ${CURRENT_YEAR}`} value={money(yearlySummary.purchaseTotal)} />
                <StatCard icon={ShoppingCart} label={`Gross sales ${CURRENT_YEAR}`} value={money(yearlySummary.salesTotal)} />
                <StatCard icon={Euro} label="Fees + shipping" value={money(yearlySummary.feesTotal)} />
                <StatCard icon={ReceiptText} label="Business expenses" value={money(yearlySummary.expenseTotal)} />
                <StatCard icon={Euro} label="Estimated EÜR profit" value={money(yearlySummary.profit)} />
              </div>
            </div>
          )}

          {activeTab === "tools" && (
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
          )}

          {filtered.map((item) => {
            const itemProfit = itemProfitValue(item);
            const classification = itemClassification(item);
            const proofExpanded = expandedProofId === item.id;
            const priceExpanded = expandedCardPanel === `${item.id}:price`;
            const listingExpanded = expandedCardPanel === `${item.id}:listing`;
            const feeExpanded = expandedCardPanel === `${item.id}:fees`;
            const proofStatus = hasProofRecord(item) ? "Proof recorded" : "Missing proof";
            const listingDraft = generateListingDraft(item);
            return (
              <article key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
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
                        <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Low</p><p className="font-semibold">{money(item.researchedLowPrice)}</p></div>
                        <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Mid</p><p className="font-semibold">{money(item.researchedMidPrice)}</p></div>
                        <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">High</p><p className="font-semibold">{money(item.researchedHighPrice)}</p></div>
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
                        <button type="button" onClick={() => copyText("title", listingDraft.title)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy title</button>
                        <button type="button" onClick={() => copyText("condition", listingDraft.condition)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy condition</button>
                        <button type="button" onClick={() => copyText("plain description", listingDraft.description)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy plain description</button>
                        <button type="button" onClick={() => copyText("HTML description", listingDraft.htmlDescription)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy HTML description</button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-xs font-semibold text-neutral-500">What's included</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{item.includedItems || "Not specified"}</p>
                      </div>
                      <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-xs font-semibold text-neutral-500">Source fields</p>
                        <p className="mt-1 text-sm text-neutral-700">{[item.brand, item.model, item.sizeSpecs, item.colour, item.conditionGrade].filter(Boolean).join(" / ") || "No source fields added yet"}</p>
                      </div>
                    </div>
                    <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs text-neutral-700">{listingDraft.description}</pre>
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs font-semibold text-neutral-500">HTML description preview</p>
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
