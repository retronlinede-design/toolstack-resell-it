import { useEffect, useMemo, useRef, useState } from "react";
import { Package, ReceiptText, ShoppingCart, FileText, Euro, Download, Trash2, Edit3, Info, Search, ClipboardList, Truck, StickyNote } from "lucide-react";
import resellItLogo from "./assets/resellitlogo2.png";
import { ExpenseManager } from "./components/finance/ExpenseManager.jsx";
import { InventoryTable } from "./components/inventory/InventoryTable.jsx";
import { EbayStudio } from "./components/item-editor/EbayStudio.jsx";
import { StatCard, QueueCard } from "./components/shared/Cards.jsx";
import { Input, Select } from "./components/shared/FormControls.jsx";
import {
  generateHtmlDescription,
  generateListingDraft,
  generatedConditionBaseText,
  generatedConditionText,
  generatedListingTitle,
  hasListingPreviewInput,
  isGermanListing,
  listingCompleteness,
  listingLabels,
  listingReadiness,
  listingSectionHeadings,
  listingShippingText,
  listingWarnings,
} from "./ebayListingTemplate.js";
import {
  actualShippingValue,
  duplicateItemForDraft,
  ebayBaseFee,
  finalSaleValue,
  hasListingDraft,
  isActiveStockItem,
  isFullBackupPayload,
  isSoldStatus,
  itemProfitValue,
  itemStatus,
  itemStatusValue,
  packagingCostValue,
  platformFees,
  refundValue,
  sanitizeHtmlPreview,
  shippingChargedValue,
  summarizeSoldPerformance,
} from "./resellitLogic.js";
import {
  DEFAULT_CLASSIFICATION,
  DEFAULT_EBAY_FEE_MODE,
  DEFAULT_LANGUAGE,
  DEFAULT_LISTING_LANGUAGE,
  CURRENT_DATE,
  CURRENT_MONTH,
  CURRENT_YEAR,
  MAX_LEGACY_PROOF_IMAGE_BYTES,
  buyerPlatformLabel,
  buyerPlatformOptions,
  classificationOptions,
  conditionGradeOptions,
  createDraftEigenbelegForItem,
  defaultDefectDisclosure,
  defaultPhotoChecklist,
  defectDisclosureItems,
  ebayConditionText,
  ebayFeeModes,
  emptyExpense,
  emptyItem,
  expenseCategories,
  inMonth,
  inYear,
  isLegacyProofImageTooLarge,
  getComplianceSummary,
  getItemTaxReadiness,
  isBusinessRelevant,
  itemClassification,
  languageLabel,
  languageOptions,
  normalizeBooleanRecord,
  normalizeEigenbeleg,
  normalizeEvidenceRecords,
  normalizeEigenbelege,
  normalizeItem,
  normalizeItems,
  normalizeListingLanguageValue,
  normalizePurchaseRecords,
  normalizeRootAppData,
  number,
  photoChecklistItems,
  proofTypes,
  quickStatusOptions,
  sellerClassificationLabel,
  sellerClassificationOptions,
  shippingWorkflowStatuses,
  statusLabel,
  statusOptions,
  testedStatusOptions,
} from "./resellitSchema.js";

const STORAGE_KEY = "toolstack.resellit.v1";
const OLD_STORAGE_KEY = "toolstack.resellerit.v1";
const EBAY_IMPORTS_KEY = "toolstack.resellit.ebayImports.v1";
const STOCK_COLUMN_WIDTHS_KEY = "resellit.stockColumnWidths.v1";
const DEFAULT_STOCK_COLUMN_WIDTHS = {
  date: 70,
  item: 140,
  status: 80,
  seller: 92,
  compliance: 104,
  source: 90,
  purchase: 58,
  sold: 58,
  profit: 60,
  proof: 60,
  edit: 44,
};
const STOCK_COLUMN_LABELS = [
  ["date", "Date"],
  ["item", "Item"],
  ["status", "Status"],
  ["seller", "Seller"],
  ["compliance", "Compliance"],
  ["source", "Source"],
  ["purchase", "Purchase"],
  ["sold", "Sold"],
  ["profit", "Profit"],
  ["proof", "Proof"],
  ["edit", "Actions"],
];
const STOCK_COLUMN_LABEL_MAP = Object.fromEntries(STOCK_COLUMN_LABELS);
const STOCK_COLUMN_WIDTH_LIMITS = {
  item: [90, 360],
  date: [70, 120],
  status: [80, 160],
  seller: [80, 170],
  compliance: [92, 170],
  source: [80, 180],
  purchase: [54, 110],
  sold: [54, 110],
  profit: [54, 110],
  proof: [54, 110],
  edit: [44, 90],
};

function clampStockColumnWidth(key, value, fallback) {
  const numericValue = Number(value);
  const [min, max] = STOCK_COLUMN_WIDTH_LIMITS[key] || [44, 360];
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

function normalizeStockColumnWidths(widths = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_STOCK_COLUMN_WIDTHS).map(([key, fallback]) => [
      key,
      clampStockColumnWidth(key, widths[key], fallback),
    ]),
  );
}

function loadStockColumnWidths() {
  if (typeof window === "undefined") return DEFAULT_STOCK_COLUMN_WIDTHS;
  try {
    const stored = window.localStorage.getItem(STOCK_COLUMN_WIDTHS_KEY);
    if (!stored) return DEFAULT_STOCK_COLUMN_WIDTHS;
    return normalizeStockColumnWidths(JSON.parse(stored));
  } catch {
    return DEFAULT_STOCK_COLUMN_WIDTHS;
  }
}

const DISABLED_LEGACY_UI = false;
const ebayMappingHints = ["order date", "item title", "sale price", "fees", "shipping", "refund", "payout"];
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

function taxReadinessStatusLabel(status) {
  return {
    not_applicable: "N/A",
    ready: "Ready",
    incomplete: "Incomplete",
    needs_eigenbeleg: "Needs Eigenbeleg",
  }[status] || "Incomplete";
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

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
    const normalizedData = normalizeRootAppData(parsed, demoItems);
    if (shouldMigrateOldData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...parsed,
        version: normalizedData.version,
        items: normalizedData.items,
        expenses: normalizedData.expenses,
        purchaseRecords: normalizedData.purchaseRecords,
        evidenceRecords: normalizedData.evidenceRecords,
        eigenbelege: normalizedData.eigenbelege,
        updatedAt: new Date().toISOString(),
      }));
    }
    return normalizedData.items;
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
    return normalizeRootAppData(parsed).expenses;
  } catch {
    return [];
  }
}

function loadInitialPurchaseRecords() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(OLD_STORAGE_KEY);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeRootAppData(parsed).purchaseRecords;
  } catch {
    return [];
  }
}

function loadInitialEvidenceRecords() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(OLD_STORAGE_KEY);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeRootAppData(parsed).evidenceRecords;
  } catch {
    return [];
  }
}

function loadInitialEigenbelege() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(OLD_STORAGE_KEY);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeRootAppData(parsed).eigenbelege;
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
    "Missing required fields": "border-red-200 bg-red-50 text-red-700",
    "Needs info": "border-[#f0be45]/40 bg-[#f0be45]/20 text-[#72530b]",
    Ready: "border-lime-200 bg-lime-50 text-lime-800",
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
  const [purchaseRecords, setPurchaseRecords] = useState(loadInitialPurchaseRecords);
  const [evidenceRecords, setEvidenceRecords] = useState(loadInitialEvidenceRecords);
  const [eigenbelege, setEigenbelege] = useState(loadInitialEigenbelege);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseMonthFilter, setExpenseMonthFilter] = useState(CURRENT_MONTH);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("All categories");
  const [ebayImportBatches, setEbayImportBatches] = useState(loadEbayImportBatches);
  const [importMonth, setImportMonth] = useState(CURRENT_MONTH);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvError, setCsvError] = useState("");
  const [form, setForm] = useState(emptyItem);
  const [draftEigenbelegForm, setDraftEigenbelegForm] = useState({
    id: "",
    reasonNoReceipt: "",
    sellerDescription: "",
    acquisitionDescription: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeToolPanel, setActiveToolPanel] = useState(null);
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
  const [stockColumnWidths, setStockColumnWidths] = useState(loadStockColumnWidths);
  const [resizingColumnKey, setResizingColumnKey] = useState("");
  const stockColumnResizeRef = useRef(null);
  const toolPanelRef = useRef(null);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [advancedInventoryFiltersOpen, setAdvancedInventoryFiltersOpen] = useState(false);
  const [stockFilterMenu, setStockFilterMenu] = useState("");
  const [expandedCardPanel, setExpandedCardPanel] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [backupMenuOpen, setBackupMenuOpen] = useState(false);
  const [expandedEigenbelegId, setExpandedEigenbelegId] = useState(null);
  const [activeWorkflowSection, setActiveWorkflowSection] = useState("source");
  const [marketResearchOpen, setMarketResearchOpen] = useState(false);
  const [listingAdvancedDetailsOpen, setListingAdvancedDetailsOpen] = useState(false);
  const [listingAdvancedOutputOpen, setListingAdvancedOutputOpen] = useState(false);
  const [listingLanguageOpen, setListingLanguageOpen] = useState(false);
  const [listingConditionHelpersOpen, setListingConditionHelpersOpen] = useState(false);
  const [listingAdditionalNotesOpen, setListingAdditionalNotesOpen] = useState(false);
  const [listingChecksOpen, setListingChecksOpen] = useState(false);
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

  useEffect(() => {
    if (activeTab !== "tools" || !activeToolPanel) return;
    toolPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeTab, activeToolPanel]);

  useEffect(() => {
    try {
      localStorage.setItem(STOCK_COLUMN_WIDTHS_KEY, JSON.stringify(normalizeStockColumnWidths(stockColumnWidths)));
    } catch {
      // Width settings are optional UI preferences; item persistence is handled separately.
    }
  }, [stockColumnWidths]);

  useEffect(() => {
    if (!resizingColumnKey) return undefined;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    function handleMouseMove(event) {
      const resizeState = stockColumnResizeRef.current;
      if (!resizeState) return;
      const nextWidth = resizeState.startWidth + event.clientX - resizeState.startX;
      setStockColumnWidths((currentWidths) => normalizeStockColumnWidths({
        ...currentWidths,
        [resizeState.key]: nextWidth,
      }));
    }

    function handleMouseUp() {
      stockColumnResizeRef.current = null;
      setResizingColumnKey("");
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = previousUserSelect;
    };
  }, [resizingColumnKey]);

  function persist(nextItems) {
    const normalizedItems = normalizeItems(nextItems);
    const normalizedPurchaseRecords = normalizePurchaseRecords(purchaseRecords);
    const normalizedEvidenceRecords = normalizeEvidenceRecords(evidenceRecords);
    const normalizedEigenbelege = normalizeEigenbelege(eigenbelege);
    const payload = JSON.stringify({ version: 2, items: normalizedItems, expenses, purchaseRecords: normalizedPurchaseRecords, evidenceRecords: normalizedEvidenceRecords, eigenbelege: normalizedEigenbelege, updatedAt: new Date().toISOString() });
    try {
      localStorage.setItem(STORAGE_KEY, payload);
    } catch {
      setBackupMessage("Save failed: browser storage is full or unavailable. Export a backup and remove large legacy attachments.");
      setToastMessage("Save failed: browser storage is full.");
      return false;
    }
    setItems(normalizedItems);
    setPurchaseRecords(normalizedPurchaseRecords);
    setEvidenceRecords(normalizedEvidenceRecords);
    setEigenbelege(normalizedEigenbelege);
    return true;
  }

  function persistAll(nextItems, nextExpenses, nextPurchaseRecords = purchaseRecords, nextEvidenceRecords = evidenceRecords, nextEigenbelege = eigenbelege) {
    const normalizedItems = normalizeItems(nextItems);
    const normalizedPurchaseRecords = normalizePurchaseRecords(nextPurchaseRecords);
    const normalizedEvidenceRecords = normalizeEvidenceRecords(nextEvidenceRecords);
    const normalizedEigenbelege = normalizeEigenbelege(nextEigenbelege);
    const payload = JSON.stringify({ version: 2, items: normalizedItems, expenses: nextExpenses, purchaseRecords: normalizedPurchaseRecords, evidenceRecords: normalizedEvidenceRecords, eigenbelege: normalizedEigenbelege, updatedAt: new Date().toISOString() });
    try {
      localStorage.setItem(STORAGE_KEY, payload);
    } catch {
      setBackupMessage("Save failed: browser storage is full or unavailable. Export a backup and remove large legacy attachments.");
      setToastMessage("Save failed: browser storage is full.");
      return false;
    }
    setItems(normalizedItems);
    setExpenses(nextExpenses);
    setPurchaseRecords(normalizedPurchaseRecords);
    setEvidenceRecords(normalizedEvidenceRecords);
    setEigenbelege(normalizedEigenbelege);
    return true;
  }

  function persistExpenses(nextExpenses) {
    return persistAll(items, nextExpenses);
  }

  function persistEigenbelege(nextEigenbelege) {
    return persistAll(items, expenses, purchaseRecords, evidenceRecords, nextEigenbelege);
  }

  function generateDraftEigenbeleg(itemId) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    const draft = {
      ...createDraftEigenbelegForItem(item, purchaseRecords, evidenceRecords),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const existingDraft = eigenbelege.find((entry) => entry.itemId === itemId && ["draft", "Draft"].includes(entry.status));
    const nextEigenbelege = existingDraft
      ? eigenbelege.map((entry) => (entry.id === existingDraft.id ? { ...draft, id: existingDraft.id, createdAt: entry.createdAt || draft.createdAt } : entry))
      : [draft, ...eigenbelege];
    if (!persistEigenbelege(nextEigenbelege)) return;
    setToastMessage("Draft Eigenbeleg generated.");
  }

  function regenerateDraftEigenbeleg(itemId) {
    const item = items.find((entry) => entry.id === itemId);
    const existingDraft = eigenbelege.find((entry) => entry.itemId === itemId && ["draft", "Draft"].includes(entry.status));
    if (!item || !existingDraft) return;
    const draft = {
      ...createDraftEigenbelegForItem(item, purchaseRecords, evidenceRecords),
      id: existingDraft.id,
      createdAt: existingDraft.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const nextEigenbelege = eigenbelege.map((entry) => (entry.id === existingDraft.id ? draft : entry));
    if (!persistEigenbelege(nextEigenbelege)) return;
    setDraftEigenbelegForm({
      id: draft.id,
      reasonNoReceipt: draft.reasonNoReceipt,
      sellerDescription: draft.sellerDescription,
      acquisitionDescription: draft.acquisitionDescription,
    });
    setToastMessage("Draft Eigenbeleg regenerated.");
  }

  function saveDraftEigenbeleg() {
    const existingDraft = eigenbelege.find((entry) => entry.id === currentDraftEigenbeleg?.id && ["draft", "Draft"].includes(entry.status));
    if (!existingDraft) return;
    const updatedDraft = normalizeEigenbeleg({
      ...existingDraft,
      reasonNoReceipt: draftEigenbelegValues.reasonNoReceipt,
      sellerDescription: draftEigenbelegValues.sellerDescription,
      acquisitionDescription: draftEigenbelegValues.acquisitionDescription,
      updatedAt: new Date().toISOString(),
    });
    const nextEigenbelege = eigenbelege.map((entry) => (entry.id === updatedDraft.id ? updatedDraft : entry));
    if (!persistEigenbelege(nextEigenbelege)) return;
    setToastMessage("Draft Eigenbeleg saved.");
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
    if (!persist(next)) return;
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
      ebay: {
        conditionText: "",
      },
      conditionText: "",
      descriptionText: "",
      htmlDescription: "",
      generatedPlainDescription: "",
      generatedHtmlDescription: "",
    };
    if (!persist([newItem, ...items])) return;
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
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    if (!window.confirm(`Delete "${item.name || "this item"}" permanently? The item will be removed, but finalized Eigenbelege, purchase records, and evidence records will remain.`)) return;
    const nextItems = items.filter((entry) => entry.id !== id);
    const nextEigenbelege = eigenbelege.filter((entry) => entry.itemId !== id || !["draft", "Draft"].includes(entry.status));
    if (!persistAll(nextItems, expenses, purchaseRecords, evidenceRecords, nextEigenbelege)) return;
    if (editingId === id || form.id === id) closeItemEditor();
    setToastMessage("Item deleted. Draft Eigenbelege removed.");
  }

  function moveItemToPersonalCollection() {
    if (!form.id) {
      setForm({ ...form, status: "personal_collection" });
      return;
    }
    const nextItems = items.map((item) => (item.id === form.id ? { ...item, status: "personal_collection" } : item));
    if (!persist(nextItems)) return;
    setForm({ ...form, status: "personal_collection" });
    setToastMessage("Moved to Personal Collection.");
  }

  function saveExpense(e) {
    e.preventDefault();
    if (!expenseForm.description.trim() || !expenseForm.amount) return;
    const clean = { ...expenseForm, description: expenseForm.description.trim() };
    const nextExpenses = editingExpenseId
      ? expenses.map((expense) => (expense.id === editingExpenseId ? { ...expense, ...clean } : expense))
      : [{ id: crypto.randomUUID(), ...clean }, ...expenses];
    if (!persistExpenses(nextExpenses)) return;
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

  function startStockColumnResize(key, event) {
    event.preventDefault();
    event.stopPropagation();
    stockColumnResizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: stockColumnWidths[key],
    };
    setResizingColumnKey(key);
  }

  function resetStockColumnWidths() {
    setStockColumnWidths(DEFAULT_STOCK_COLUMN_WIDTHS);
  }

  function stockResizeHandle(key) {
    return (
      <span
        role="separator"
        aria-label={`Resize ${STOCK_COLUMN_LABEL_MAP[key]} column`}
        aria-orientation="vertical"
        onMouseDown={(event) => startStockColumnResize(key, event)}
        className={`absolute right-0 top-0 h-full w-2 cursor-col-resize border-r transition ${resizingColumnKey === key ? "border-[#b7412e] bg-[#b7412e]/15" : "border-transparent hover:border-[#b7412e]/40 hover:bg-[#b7412e]/10"}`}
      />
    );
  }

  function updateItemProofStatus(id, value) {
    persist(items.map((item) => {
      if (item.id !== id) return item;
      if (value === "OK") return { ...item, hasReceipt: "Yes", receiptType: item.receiptType || "Shop receipt", proofType: item.proofType || "Shop receipt" };
      if (value === "Eigenbeleg") return { ...item, hasReceipt: "No", receiptType: "Eigenbeleg needed", proofType: "Eigenbeleg", proofStoredExternally: "No" };
      return { ...item, hasReceipt: "No", receiptType: "", proofType: "", proofStoredExternally: "No", proofFileName: "", proofFolderLocation: "", proofImageDataUrl: "", proofNotes: "" };
    }));
  }

  function duplicateItem(item) {
    const copy = duplicateItemForDraft(item, crypto.randomUUID());
    persist([copy, ...items]);
  }

  function exportJson() {
    const data = JSON.stringify({ type: "RESELLERIT_BACKUP", version: 2, items, expenses, purchaseRecords: normalizePurchaseRecords(purchaseRecords), evidenceRecords: normalizeEvidenceRecords(evidenceRecords), eigenbelege: normalizeEigenbelege(eigenbelege), exportedAt: new Date().toISOString() }, null, 2);
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

      if (!isFullBackupPayload(parsed)) {
        setBackupMessage("Import failed: this must be a full ResellIt backup with both items and expenses.");
        return;
      }

      const normalizedData = normalizeRootAppData(parsed);
      const nextItems = normalizedData.items;
      const nextExpenses = normalizedData.expenses;
      const nextPurchaseRecords = normalizedData.purchaseRecords;
      const nextEvidenceRecords = normalizedData.evidenceRecords;
      const nextEigenbelege = normalizedData.eigenbelege;
      const ok = window.confirm(`Restore this ResellIt backup?\n\nCurrent data will be replaced with ${nextItems.length} items and ${nextExpenses.length} expenses.`);
      if (!ok) {
        setBackupMessage("Import cancelled.");
        return;
      }

      if (!persistAll(nextItems, nextExpenses, nextPurchaseRecords, nextEvidenceRecords, nextEigenbelege)) return;
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
    try {
      localStorage.setItem(EBAY_IMPORTS_KEY, JSON.stringify({ version: 1, batches: nextBatches, updatedAt: new Date().toISOString() }));
    } catch {
      setBackupMessage("Import batch save failed: browser storage is full or unavailable.");
      setToastMessage("Import batch save failed.");
      return false;
    }
    setEbayImportBatches(nextBatches);
    return true;
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
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_LEGACY_PROOF_IMAGE_BYTES) {
      setBackupMessage("Legacy proof image was not attached because it is too large for browser storage. Record a file/folder reference instead.");
      setToastMessage("Proof image too large for browser storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const proofImageDataUrl = String(reader.result || "");
      if (isLegacyProofImageTooLarge(proofImageDataUrl)) {
        setBackupMessage("Legacy proof image was not attached because it is too large for browser storage. Record a file/folder reference instead.");
        setToastMessage("Proof image too large for browser storage.");
        return;
      }
      setForm({ ...form, proofImageDataUrl, proofImageName: file.name });
    };
    reader.readAsDataURL(file);
  }

  const summary = useMemo(() => {
    const soldPerformance = summarizeSoldPerformance(items);
    const purchaseTotal = items.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const eigenbeleg = items.filter((item) => item.hasReceipt === "No").length;
    return { purchaseTotal, ...soldPerformance, eigenbeleg };
  }, [items]);

  const complianceSummary = useMemo(() => (
    getComplianceSummary(items, purchaseRecords, evidenceRecords, eigenbelege)
  ), [eigenbelege, evidenceRecords, items, purchaseRecords]);
  const complianceReadinessByItemId = useMemo(() => (
    Object.fromEntries(items.map((item) => [
      item.id,
      getItemTaxReadiness(item, purchaseRecords, evidenceRecords, eigenbelege),
    ]))
  ), [eigenbelege, evidenceRecords, items, purchaseRecords]);
  const complianceIssueQueues = useMemo(() => {
    const entries = items.map((item) => ({
      item,
      readiness: complianceReadinessByItemId[item.id] || getItemTaxReadiness(item, purchaseRecords, evidenceRecords, eigenbelege),
    }));
    return {
      missingPurchaseRecords: entries.filter(({ readiness }) => readiness.issues.includes("purchase_record_missing")).map(({ item }) => item),
      missingEvidence: entries.filter(({ readiness }) => readiness.issues.includes("evidence_missing")).map(({ item }) => item),
      needsEigenbeleg: entries.filter(({ readiness }) => readiness.issues.includes("eigenbeleg_missing")).map(({ item }) => item),
    };
  }, [complianceReadinessByItemId, eigenbelege, evidenceRecords, items, purchaseRecords]);
  const formTaxReadiness = useMemo(() => (
    getItemTaxReadiness(form, purchaseRecords, evidenceRecords, eigenbelege)
  ), [eigenbelege, evidenceRecords, form, purchaseRecords]);
  const currentDraftEigenbeleg = eigenbelege.find((entry) => entry.itemId === form.id && ["draft", "Draft"].includes(entry.status)) || null;
  const currentDraftPurchaseRecord = purchaseRecords.find((record) => record.id === currentDraftEigenbeleg?.purchaseRecordId) || null;
  const draftEigenbelegValues = currentDraftEigenbeleg && draftEigenbelegForm.id === currentDraftEigenbeleg.id
    ? draftEigenbelegForm
    : {
        id: currentDraftEigenbeleg?.id || "",
        reasonNoReceipt: currentDraftEigenbeleg?.reasonNoReceipt || "",
        sellerDescription: currentDraftEigenbeleg?.sellerDescription || "",
        acquisitionDescription: currentDraftEigenbeleg?.acquisitionDescription || "",
      };

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
    const activeItems = items.filter(isActiveStockItem);
    const unsoldItems = activeItems.filter((item) => !isSoldStatus(item));
    return {
      totalItems: items.length,
      unsoldInventoryValue: unsoldItems.reduce((sum, item) => sum + number(item.purchasePrice), 0),
      missingProofCount: activeItems.filter(needsProofRecord).length,
      missingPriceResearchCount: activeItems.filter((item) => !hasPriceResearch(item)).length,
      missingListingDraftCount: activeItems.filter((item) => !hasListingDraft(item)).length,
      reviewLaterCount: activeItems.filter((item) => itemClassification(item) === DEFAULT_CLASSIFICATION).length,
    };
  }, [items]);

  const activeStockItems = useMemo(() => items.filter(isActiveStockItem), [items]);

  const todayWorkflow = useMemo(() => ({
    toResearch: activeStockItems.filter((item) => !hasPriceResearch(item) && !isSoldStatus(item)),
    readyToList: activeStockItems.filter((item) => itemStatusValue(item) === "Ready to List"),
    soldNotShipped: activeStockItems.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatusValue(item))),
    missingProof: activeStockItems.filter(needsProofRecord),
    needsListing: activeStockItems.filter((item) => !hasListingDraft(item) && !isSoldStatus(item)),
  }), [activeStockItems]);

  const salesWorkflow = useMemo(() => {
    const salesItems = activeStockItems.filter(isSoldStatus);
    return {
      items: salesItems,
      awaitingShipment: salesItems.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatusValue(item))),
      shippedItems: salesItems.filter((item) => itemStatusValue(item) === "Shipped" || item.trackingNumber || item.shippedDate),
      completedSales: salesItems.filter((item) => itemStatusValue(item) === "Completed").slice(0, 6),
      problemItems: salesItems.filter((item) => itemStatusValue(item) === "Returned" || itemStatusValue(item) === "Refunded" || itemStatusValue(item) === "Written Off"),
      counts: shippingWorkflowStatuses.reduce((counts, status) => {
        counts[status] = salesItems.filter((item) => itemStatusValue(item) === status).length;
        return counts;
      }, {}),
    };
  }, [activeStockItems]);

  const shippingTrackerGroups = useMemo(() => {
    const shipmentItems = activeStockItems.filter(isSoldStatus);
    return [
      ["Sold not shipped", shipmentItems.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatusValue(item)))],
      ["Shipped / Tracking", shipmentItems.filter((item) => {
        const status = itemStatusValue(item);
        return status === "Shipped" || (Boolean(item.trackingNumber || item.shippedDate) && !["Sold", "Paid", "Ready to Pack", "Packed", "Completed", "Returned", "Refunded", "Written Off"].includes(status));
      })],
      ["Returned / Problem", shipmentItems.filter((item) => itemStatusValue(item) === "Returned" || itemStatusValue(item) === "Refunded" || itemStatusValue(item) === "Written Off")],
    ];
  }, [activeStockItems]);

  const sectionSummaries = useMemo(() => {
    const monthlyExpenses = expenses.filter((expense) => inMonth(expense.date));
    const monthlySales = items.filter((item) => isSoldStatus(item) && inMonth(item.saleDate));
    const revenue = monthlySales.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0);
    const fees = monthlySales.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0);
    const profit = monthlySales.reduce((sum, item) => sum + itemProfitValue(item), 0);
    const expenseTotal = monthlyExpenses.reduce((sum, expense) => sum + number(expense.amount), 0);
    const packedOrShippedToday = activeStockItems.filter((item) => (
      itemStatusValue(item) === "Packed" || (itemStatusValue(item) === "Shipped" && item.shippedDate === CURRENT_DATE)
    ));
    return {
      stock: {
        inventoryValue: activeStockItems.filter((item) => !isSoldStatus(item)).reduce((sum, item) => sum + number(item.purchasePrice), 0),
        readyToList: activeStockItems.filter((item) => itemStatusValue(item) === "Ready to List").length,
        missingProof: activeStockItems.filter(needsProofRecord).length,
        recentSourcing: activeStockItems.filter((item) => inMonth(item.purchaseDate)).length,
      },
      sales: {
        awaitingShipment: activeStockItems.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatusValue(item))).length,
        packedOrShippedToday: packedOrShippedToday.length,
        returnsIssues: activeStockItems.filter((item) => itemStatusValue(item) === "Returned" || itemStatusValue(item) === "Refunded" || itemStatusValue(item) === "Written Off").length,
        recentCompleted: activeStockItems.filter((item) => itemStatusValue(item) === "Completed").slice(0, 6).length,
      },
      finance: {
        revenue,
        expenses: expenseTotal,
        estimatedProfit: profit - expenseTotal,
        pendingPayout: Math.max(0, revenue - fees),
      },
    };
  }, [activeStockItems, expenses, items]);

  const inventoryManagerItems = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    const filteredItems = items.filter((item) => {
      const searchText = [item.name, item.category, item.ebayTitle, item.sourceName, item.sourceLocation, item.listingTitle].join(" ").toLowerCase();
      if (query && !searchText.includes(query)) return false;
      if (!isActiveStockItem(item) && !query && inventoryStatus !== "personal_collection") return false;
      if (inventoryClassification !== "All classifications" && itemClassification(item) !== inventoryClassification) return false;
      if (inventoryStatus !== "All statuses" && itemStatusValue(item) !== inventoryStatus) return false;
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
    soldTotal: stockTimelineItems.filter(isSoldStatus).reduce((sum, item) => sum + finalSaleValue(item), 0),
    profitTotal: stockTimelineItems.filter(isSoldStatus).reduce((sum, item) => sum + itemProfitValue(item), 0),
    unsoldCount: stockTimelineItems.filter((item) => !isSoldStatus(item)).length,
    missingProofCount: stockTimelineItems.filter(needsProofRecord).length,
  }), [stockTimelineItems]);

  const visibleStockColumnKeys = useMemo(() => {
    const baseColumns = ["date", "item", "status", "seller", "compliance", "source", "purchase", "sold"];
    return stockViewMode === "Detailed view" ? [...baseColumns, "profit", "proof", "edit"] : [...baseColumns, "edit"];
  }, [stockViewMode]);

  const stockTableWidth = visibleStockColumnKeys.reduce((sum, key) => sum + stockColumnWidths[key], 0);

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
      return inventoryManagerItems.filter((item) => isActiveStockItem(item) && (needsProofRecord(item) || !hasPriceResearch(item) || !hasListingDraft(item) || itemClassification(item) === DEFAULT_CLASSIFICATION));
    }
    if (stockSection === "readyToList") {
      return inventoryManagerItems.filter((item) => isActiveStockItem(item) && itemStatusValue(item) === "Ready to List");
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
    const monthlySales = items.filter((item) => isSoldStatus(item) && inMonth(item.saleDate));
    const purchaseTotal = monthlyPurchases.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = monthlySales.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0);
    const feesTotal = monthlySales.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0);
    const profit = monthlySales.reduce((sum, item) => sum + itemProfitValue(item), 0);
    return { purchaseTotal, salesTotal, feesTotal, profit };
  }, [items]);

  const yearlySummary = useMemo(() => {
    const yearlyPurchases = items.filter((item) => inYear(item.purchaseDate));
    const yearlySales = items.filter((item) => isSoldStatus(item) && inYear(item.saleDate));
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
    const yearlyBusinessSales = businessItems.filter((item) => isSoldStatus(item) && inYear(item.saleDate));
    const purchaseTotal = yearlyBusinessPurchases.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = yearlyBusinessSales.reduce((sum, item) => sum + finalSaleValue(item) + shippingChargedValue(item), 0);
    const feesTotal = yearlyBusinessSales.reduce((sum, item) => sum + platformFees(item) + actualShippingValue(item), 0);
    const profit = yearlyBusinessSales.reduce((sum, item) => sum + itemProfitValue(item), 0);
    return { purchaseTotal, salesTotal, feesTotal, profit, soldCount: yearlyBusinessSales.length };
  }, [items]);

  const monthlyClosing = (() => {
    const purchasedItems = items.filter((item) => inMonth(item.purchaseDate, closingMonth));
    const soldItems = items.filter((item) => isSoldStatus(item) && inMonth(item.saleDate, closingMonth));
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
    needsProof: activeStockItems.filter(needsProofRecord),
    needsResearch: activeStockItems.filter((item) => !hasPriceResearch(item) && !isSoldStatus(item)),
    needsListing: activeStockItems.filter((item) => !hasListingDraft(item) && !isSoldStatus(item)),
    readyToList: activeStockItems.filter((item) => itemStatusValue(item) === "Ready to List"),
    needsShipping: activeStockItems.filter((item) => ["Sold", "Paid", "Ready to Pack", "Packed"].includes(itemStatusValue(item))),
    needsTaxReview: activeStockItems.filter((item) => needsProofRecord(item) || needsEigenbeleg(item) || itemClassification(item) === DEFAULT_CLASSIFICATION),
  }), [activeStockItems]);

  const taxRecordQueues = useMemo(() => ({
    missingProof: activeStockItems.filter(needsProofRecord),
    eigenbelegNeeded: activeStockItems.filter(needsEigenbeleg),
    expensesWithoutReceiptNote: expenses.filter((expense) => expense.receiptAvailable === "No" && !String(expense.receiptNotes || "").trim()),
    reviewLater: activeStockItems.filter((item) => itemClassification(item) === DEFAULT_CLASSIFICATION),
  }), [activeStockItems, expenses]);

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
      if (activeTab === "stock" && stockSection === "needsAttention") return activeStockItems.filter((item) => needsProofRecord(item) || !hasPriceResearch(item) || !hasListingDraft(item) || itemClassification(item) === DEFAULT_CLASSIFICATION);
      if (activeTab === "stock" && stockSection === "readyToList") return activeStockItems.filter((item) => itemStatusValue(item) === "Ready to List");
      if (activeTab === "sales") return activeStockItems.filter((item) => ["Sold", "Paid", "Shipped", "Completed", "Returned", "Refunded"].includes(itemStatusValue(item)) || isSoldStatus(item));
      if (activeTab === "finance" && financeSection === "taxRecords") return activeStockItems.filter((item) => needsProofRecord(item) || needsEigenbeleg(item) || itemClassification(item) === DEFAULT_CLASSIFICATION);
      return items;
    })();

    if (classificationFilter === "All classifications") return nextItems;
    return nextItems.filter((item) => itemClassification(item) === classificationFilter);
  }, [activeStockItems, activeTab, classificationFilter, financeSection, items, stockSection]);

  const eigenbelegText = (item) => `Eigenbeleg / Self-Receipt\n\nDate: ${item.proofDate || item.purchaseDate}\nItem: ${item.name}\nClassification: ${itemClassification(item)}\nSource: ${item.sourceType} - ${item.sourceName || "private seller"}\nLocation: ${item.sourceLocation}\nPurchase price / proof amount: ${money(item.proofAmount || item.purchasePrice)}\nPayment method: ${item.paymentMethod}\nReason no invoice: ${item.noReceiptReason || "Private second-hand / flea-market purchase; no formal receipt available."}\nProof notes: ${item.proofNotes || item.notes || "-"}\n\nSigned: ______________________`;

  async function copyEigenbeleg(item) {
    try {
      await navigator.clipboard.writeText(eigenbelegText(item));
    } catch {
      window.prompt("Copy Eigenbeleg text", eigenbelegText(item));
    }
  }

  function generateCurrentListingDraft() {
    const currentEbayCondition = ebayConditionText(form);
    const initializedEbayCondition = currentEbayCondition || generatedConditionBaseText(form);
    const draftSource = { ...form, ebay: { ...(form.ebay || {}), conditionText: initializedEbayCondition } };
    const draft = generateListingDraft(draftSource, { preferSaved: false });
    const syncedResearchQuery = searchQueryManuallyEdited ? form.researchQuery : draft.title;
    setForm({
      ...form,
      language: form.language || DEFAULT_LANGUAGE,
      listingLanguage: form.listingLanguage || DEFAULT_LISTING_LANGUAGE,
      listingTitle: draft.title,
      ebayTitle: draft.title,
      researchQuery: syncedResearchQuery,
      ebay: {
        ...(form.ebay || {}),
        conditionText: initializedEbayCondition,
      },
      descriptionText: draft.description,
      htmlDescription: draft.htmlDescription,
      generatedPlainDescription: draft.description,
      generatedHtmlDescription: draft.htmlDescription,
    });
  }

  function generateFullListingPack() {
    const shippingNotes = listingShippingText(form);
    const currentEbayCondition = ebayConditionText(form);
    const initializedEbayCondition = currentEbayCondition || generatedConditionBaseText(form);
    const packSource = { ...form, shippingNotes, ebay: { ...(form.ebay || {}), conditionText: initializedEbayCondition } };
    const draft = generateListingDraft(packSource, { preferSaved: false });
    const syncedResearchQuery = searchQueryManuallyEdited ? form.researchQuery : draft.title;
    setForm({
      ...form,
      language: form.language || DEFAULT_LANGUAGE,
      listingLanguage: form.listingLanguage || DEFAULT_LISTING_LANGUAGE,
      listingTitle: draft.title,
      ebayTitle: draft.title,
      researchQuery: syncedResearchQuery,
      ebay: {
        ...(form.ebay || {}),
        conditionText: initializedEbayCondition,
      },
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
              <button type="button" onClick={moveItemToPersonalCollection} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Move to Personal Collection</button>
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

              <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold text-stone-950">Compliance Status</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {form.id && isBusinessRelevant(form) && formTaxReadiness.eigenbelegRequired && !currentDraftEigenbeleg && (
                      <button type="button" onClick={() => generateDraftEigenbeleg(form.id)} className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">Generate Draft Eigenbeleg</button>
                    )}
                    <span className="w-fit rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">{taxReadinessStatusLabel(formTaxReadiness.status)}</span>
                  </div>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Seller mode", sellerClassificationLabel(form.sellerClassification)],
                    ["Business relevant", yesNo(isBusinessRelevant(form))],
                    ["Purchase record present", yesNo(formTaxReadiness.purchaseRecordPresent)],
                    ["Evidence present", yesNo(formTaxReadiness.evidencePresent)],
                    ["Eigenbeleg required", yesNo(formTaxReadiness.eigenbelegRequired)],
                    ["Eigenbeleg present", yesNo(formTaxReadiness.eigenbelegPresent)],
                    ["Status", taxReadinessStatusLabel(formTaxReadiness.status)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-stone-50 p-2">
                      <p className="text-xs text-stone-500">{label}</p>
                      <p className="mt-0.5 font-semibold text-stone-900">{value}</p>
                    </div>
                  ))}
                </div>
                {currentDraftEigenbeleg && (
                  <div className="mt-4 space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ["Draft status", currentDraftEigenbeleg.status],
                        ["Generated date", currentDraftEigenbeleg.createdAt || currentDraftEigenbeleg.updatedAt || "-"],
                        ["Linked purchase record", currentDraftPurchaseRecord?.id || currentDraftEigenbeleg.purchaseRecordId || "None"],
                        ["Linked item", form.name || currentDraftEigenbeleg.itemId || "-"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-white p-2">
                          <p className="text-xs text-stone-500">{label}</p>
                          <p className="mt-0.5 break-words font-semibold text-stone-900">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 lg:grid-cols-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Reason no receipt</span>
                        <textarea value={draftEigenbelegValues.reasonNoReceipt} onChange={(event) => setDraftEigenbelegForm({ ...draftEigenbelegValues, reasonNoReceipt: event.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Seller description</span>
                        <textarea value={draftEigenbelegValues.sellerDescription} onChange={(event) => setDraftEigenbelegForm({ ...draftEigenbelegValues, sellerDescription: event.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Acquisition description</span>
                        <textarea value={draftEigenbelegValues.acquisitionDescription} onChange={(event) => setDraftEigenbelegForm({ ...draftEigenbelegValues, acquisitionDescription: event.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                      </label>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs font-semibold text-stone-500">Generated text</p>
                      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-800">{currentDraftEigenbeleg.generatedText || "-"}</pre>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => regenerateDraftEigenbeleg(form.id)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Regenerate Draft</button>
                      <button type="button" onClick={saveDraftEigenbeleg} className="rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-amber-50 hover:bg-stone-800">Save Draft</button>
                    </div>
                  </div>
                )}
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
                    <Select label="Seller mode" value={form.sellerClassification || "private"} onChange={(e) => setForm({ ...form, sellerClassification: e.target.value })}>
                      {sellerClassificationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </Select>
                    <Select label="Source" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>
                      <option>Flea market</option><option>Second-hand shop</option><option>Private seller</option><option>Online marketplace</option><option>Other</option>
                    </Select>
                    <Input label="Source / seller" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} />
                    <Input label="Location" value={form.sourceLocation} onChange={(e) => setForm({ ...form, sourceLocation: e.target.value })} />
                    <Input label="Purchase date" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
                    <Input label="Purchase price EUR" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
                    <Select label="Status" value={form.status || "Draft"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
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
                  <EbayStudio
                    form={form}
                    setForm={setForm}
                    formListingLabels={formListingLabels}
                    formListingSectionHeadings={formListingSectionHeadings}
                    conditionDefectsLabel={conditionDefectsLabel}
                    listingChecksOpen={listingChecksOpen}
                    listingAdvancedDetailsOpen={listingAdvancedDetailsOpen}
                    listingConditionHelpersOpen={listingConditionHelpersOpen}
                    listingAdditionalNotesOpen={listingAdditionalNotesOpen}
                    listingLanguageOpen={listingLanguageOpen}
                    listingAdvancedOutputOpen={listingAdvancedOutputOpen}
                    conditionGradeOptions={conditionGradeOptions}
                    testedStatusOptions={testedStatusOptions}
                    defectDisclosureItems={defectDisclosureItems}
                    defaultDefectDisclosure={defaultDefectDisclosure}
                    languageOptions={languageOptions}
                    ListingReadinessBadge={ListingReadinessBadge}
                    ListingCompleteness={ListingCompleteness}
                    ListingWarningsPanel={ListingWarningsPanel}
                    ChecklistGrid={ChecklistGrid}
                    sanitizeHtmlPreview={sanitizeHtmlPreview}
                    onToggleListingChecks={() => setListingChecksOpen(!listingChecksOpen)}
                    onToggleListingAdvancedDetails={() => setListingAdvancedDetailsOpen(!listingAdvancedDetailsOpen)}
                    onToggleListingConditionHelpers={() => setListingConditionHelpersOpen(!listingConditionHelpersOpen)}
                    onToggleListingAdditionalNotes={() => setListingAdditionalNotesOpen(!listingAdditionalNotesOpen)}
                    onToggleListingLanguage={() => setListingLanguageOpen(!listingLanguageOpen)}
                    onToggleListingAdvancedOutput={() => setListingAdvancedOutputOpen(!listingAdvancedOutputOpen)}
                    onGenerateFullListingPack={generateFullListingPack}
                    onUpdateListingTitle={updateListingTitle}
                    onCopyText={copyText}
                  />
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

              {form.id && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-red-900">Danger Zone</h3>
                      <p className="mt-1 text-xs text-red-700">Permanent delete removes the item and linked draft Eigenbelege. Finalized Eigenbelege, evidence, and purchase records remain.</p>
                    </div>
                    <button type="button" onClick={() => deleteItem(form.id)} className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Delete Permanently</button>
                  </div>
                </div>
              )}
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
                {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
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
                      <textarea value={ebayConditionText(form)} onChange={(e) => setForm({ ...form, ebay: { ...(form.ebay || {}), conditionText: e.target.value } })} className="min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
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
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtmlPreview(form.generatedHtmlDescription || form.htmlDescription || generateHtmlDescription(form)) }} />
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
                    <input value={form.shippingNotes || ""} onChange={(e) => setForm({ ...form, shippingNotes: e.target.value })} className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-all duration-150 placeholder:text-stone-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70" placeholder="Tracked DHL..." />
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
            <InventoryTable
              items={items}
              stockTimelineItems={stockTimelineItems}
              stockTimelineGroups={stockTimelineGroups}
              stockTimelineTotals={stockTimelineTotals}
              stockTableWidth={stockTableWidth}
              visibleStockColumnKeys={visibleStockColumnKeys}
              stockColumnWidths={stockColumnWidths}
              stockViewMode={stockViewMode}
              stockFilterMenu={stockFilterMenu}
              stockActiveFilterCount={stockActiveFilterCount}
              quickAddItem={quickAddItem}
              inventorySearch={inventorySearch}
              inventoryTimelineGrouping={inventoryTimelineGrouping}
              inventoryClassification={inventoryClassification}
              inventoryStatus={inventoryStatus}
              inventoryTimelineMonth={inventoryTimelineMonth}
              classificationOptions={classificationOptions}
              complianceReadinessByItemId={complianceReadinessByItemId}
              complianceStatusLabel={taxReadinessStatusLabel}
              sellerClassificationLabel={sellerClassificationLabel}
              statusLabel={statusLabel}
              statusOptions={statusOptions}
              stockColumnLabelMap={STOCK_COLUMN_LABEL_MAP}
              money={money}
              isSoldStatus={isSoldStatus}
              quickProofStatus={quickProofStatus}
              needsProofRecord={needsProofRecord}
              itemProfitValue={itemProfitValue}
              stockResizeHandle={stockResizeHandle}
              onOpenNewItemEditor={openNewItemEditor}
              onCreateQuickLedgerItem={createQuickLedgerItem}
              onSetQuickAddItem={setQuickAddItem}
              onSetStockFilterMenu={setStockFilterMenu}
              onSetInventorySearch={setInventorySearch}
              onSetInventoryTimelineGrouping={setInventoryTimelineGrouping}
              onSetInventoryClassification={setInventoryClassification}
              onSetInventoryStatus={setInventoryStatus}
              onSetInventoryTimelineMonth={setInventoryTimelineMonth}
              onSetInventoryCategory={setInventoryCategory}
              onSetInventoryIssueFilter={setInventoryIssueFilter}
              onSetStockViewMode={setStockViewMode}
              onResetStockColumnWidths={resetStockColumnWidths}
              onUpdateItemField={updateItemField}
              onUpdateItemProofStatus={updateItemProofStatus}
              onEditItem={editItem}
            />
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
                    {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
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
                          <button key={status} type="button" onClick={() => updateItemStatus(item.id, status)} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${itemStatusValue(item) === status ? statusBadgeClass({ status }) : "border-neutral-300 text-neutral-700 hover:bg-[#f0be45]/20"}`}>{statusLabel(status)}</button>
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

              <div className="grid gap-4 xl:grid-cols-4">
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

                <section className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-[0_10px_30px_rgba(41,37,36,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6d493d]">Compliance</p>
                  <div className="mt-4 grid gap-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2"><span className="text-sm text-stone-500">Ready</span><span className="font-semibold text-stone-950">{complianceSummary.ready}</span></div>
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2"><span className="text-sm text-stone-500">Incomplete</span><span className="font-semibold text-stone-950">{complianceSummary.incomplete}</span></div>
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2"><span className="text-sm text-stone-500">Needs Eigenbeleg</span><span className="font-semibold text-stone-950">{complianceSummary.needsEigenbeleg}</span></div>
                    <div className="flex items-center justify-between"><span className="text-sm text-stone-500">Not applicable</span><span className="font-semibold text-stone-950">{complianceSummary.notApplicable}</span></div>
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
            <ExpenseManager
              expenseForm={expenseForm}
              editingExpenseId={editingExpenseId}
              expenseMonthFilter={expenseMonthFilter}
              expenseCategoryFilter={expenseCategoryFilter}
              filteredExpenses={filteredExpenses}
              filteredExpenseTotal={filteredExpenseTotal}
              expenseCategories={expenseCategories}
              items={items}
              money={money}
              onSaveExpense={saveExpense}
              onSetExpenseForm={setExpenseForm}
              onCancelExpenseEdit={() => { setEditingExpenseId(null); setExpenseForm(emptyExpense); }}
              onSetExpenseMonthFilter={setExpenseMonthFilter}
              onSetExpenseCategoryFilter={setExpenseCategoryFilter}
              onEditExpense={editExpense}
              onDeleteExpense={deleteExpense}
            />
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
              <div className="rounded-3xl border border-[#1f9d99]/20 bg-white p-5 shadow-sm">
                <div className="mb-4 h-1 w-12 rounded-full bg-[#1f9d99]" />
                <h2 className="text-2xl font-semibold text-neutral-950">Tools</h2>
                <p className="mt-1 max-w-2xl text-sm text-neutral-600">Manage backups, reports, listing helpers, issue checks, and app utilities.</p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-950">Backup & Import</h3>
                      <p className="mt-1 text-xs text-neutral-500">Local JSON backup tools.</p>
                    </div>
                    <span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-800">Active</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => { setActiveToolPanel(null); exportJson(); }} className="rounded-2xl border border-[#1f9d99]/30 bg-[#1f9d99]/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#1f9d99]/50 hover:bg-[#1f9d99]/15 hover:shadow-sm">
                      <p className="text-sm font-semibold text-neutral-950">Export Backup</p>
                      <p className="mt-1 text-xs leading-5 text-neutral-600">Download all local ResellIt data.</p>
                    </button>
                    <label className="cursor-pointer rounded-2xl border border-[#1f9d99]/30 bg-[#1f9d99]/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#1f9d99]/50 hover:bg-[#1f9d99]/15 hover:shadow-sm" onClick={() => setActiveToolPanel(null)}>
                      <span className="block text-sm font-semibold text-neutral-950">Import Backup</span>
                      <span className="mt-1 block text-xs leading-5 text-neutral-600">Restore a local JSON backup.</span>
                      <input type="file" accept="application/json,.json" onChange={importBackupJson} className="hidden" />
                    </label>
                  </div>
                  {backupMessage && <p className="mt-3 rounded-xl bg-stone-50 p-3 text-sm text-stone-700">{backupMessage}</p>}
                </section>

                <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-950">Reports</h3>
                      <p className="mt-1 text-xs text-neutral-500">Exports and summaries.</p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Coming soon</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Monthly Report", "Month-end overview."],
                      ["Tax Export Package", "Accountant-ready bundle."],
                      ["Profit Summary", "Sales and cost summary."],
                    ].map(([label, description]) => (
                      <button key={label} type="button" disabled className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left opacity-75">
                        <p className="text-sm font-semibold text-stone-700">{label}</p>
                        <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-950">Issues</h3>
                      <p className="mt-1 text-xs text-neutral-500">Data quality checks.</p>
                    </div>
                    <span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-800">Active</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button type="button" aria-expanded={activeToolPanel === "compliance_center"} aria-controls="tools-panel-compliance-center" onClick={() => setActiveToolPanel("compliance_center")} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${activeToolPanel === "compliance_center" ? "border-[#1f9d99]/50 bg-[#1f9d99]/15" : "border-[#1f9d99]/25 bg-[#1f9d99]/8 hover:border-[#1f9d99]/40"}`}>
                      <p className="text-sm font-semibold text-neutral-950">Compliance Center</p>
                      <p className="mt-1 text-xs leading-5 text-neutral-600">Review item readiness queues.</p>
                    </button>
                    {[
                      ["Unmatched eBay Transactions", "Find imports needing matching."],
                    ].map(([label, description]) => (
                      <button key={label} type="button" disabled className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left opacity-75">
                        <p className="text-sm font-semibold text-stone-700">{label}</p>
                        <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-950">eBay Listing Helper</h3>
                      <p className="mt-1 text-xs text-neutral-500">Listing and import work queues.</p>
                    </div>
                    <span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-800">Active</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => { setActiveToolPanel(null); openStockQueue("needsAttention", "Missing listing draft"); }} className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-100 hover:shadow-sm">
                      <p className="text-sm font-semibold text-orange-950">Open Listing Queue</p>
                      <p className="mt-1 text-xs leading-5 text-orange-900/75">Show items missing listing drafts.</p>
                    </button>
                    <button type="button" onClick={() => { setActiveToolPanel(null); openFinanceQueue("reconciliation"); }} className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-100 hover:shadow-sm">
                      <p className="text-sm font-semibold text-orange-950">Open eBay Import / Reconciliation</p>
                      <p className="mt-1 text-xs leading-5 text-orange-900/75">Open existing CSV import tools.</p>
                    </button>
                  </div>
                </section>

                <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-950">Templates</h3>
                      <p className="mt-1 text-xs text-neutral-500">Reusable text presets.</p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Coming soon</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Listing Templates", "Reusable listing structures."],
                      ["Condition Text Templates", "Saved condition wording."],
                      ["Eigenbeleg Text Templates", "Reusable self-receipt text."],
                    ].map(([label, description]) => (
                      <button key={label} type="button" disabled className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left opacity-75">
                        <p className="text-sm font-semibold text-stone-700">{label}</p>
                        <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-950">Settings & Help</h3>
                      <p className="mt-1 text-xs text-neutral-500">App information and guidance.</p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Mixed</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <button type="button" onClick={() => setActiveToolPanel("app_info")} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${activeToolPanel === "app_info" ? "border-[#1f9d99]/50 bg-[#1f9d99]/15" : "border-[#1f9d99]/25 bg-[#1f9d99]/8 hover:border-[#1f9d99]/40"}`}>
                      <p className="text-sm font-semibold text-neutral-950">App Info</p>
                      <p className="mt-1 text-xs leading-5 text-neutral-600">Storage and sync status.</p>
                    </button>
                    <button type="button" onClick={() => setActiveToolPanel("help")} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${activeToolPanel === "help" ? "border-[#1f9d99]/50 bg-[#1f9d99]/15" : "border-[#1f9d99]/25 bg-[#1f9d99]/8 hover:border-[#1f9d99]/40"}`}>
                      <p className="text-sm font-semibold text-neutral-950">Help Guide</p>
                      <p className="mt-1 text-xs leading-5 text-neutral-600">Workflow guide.</p>
                    </button>
                    <button type="button" onClick={() => setActiveToolPanel("backup_instructions")} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${activeToolPanel === "backup_instructions" ? "border-[#1f9d99]/50 bg-[#1f9d99]/15" : "border-[#1f9d99]/25 bg-[#1f9d99]/8 hover:border-[#1f9d99]/40"}`}>
                      <p className="text-sm font-semibold text-neutral-950">Backup Instructions</p>
                      <p className="mt-1 text-xs leading-5 text-neutral-600">Backup and restore notes.</p>
                    </button>
                  </div>
                </section>
              </div>

              {activeToolPanel && (
                <section ref={toolPanelRef} className="rounded-3xl border border-[#1f9d99]/25 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#1f9d99]">Tool Details</p>
                      {activeToolPanel === "app_info" && (
                        <>
                          <h3 className="mt-1 text-lg font-semibold text-neutral-950">App Info</h3>
                          <div className="mt-3 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                            <p className="rounded-2xl bg-stone-50 p-3">ResellIt stores data in this browser using localStorage.</p>
                            <p className="rounded-2xl bg-stone-50 p-3">No backend or cloud sync is connected.</p>
                          </div>
                        </>
                      )}
                      {activeToolPanel === "help" && (
                        <>
                          <h3 className="mt-1 text-lg font-semibold text-neutral-950">Help Guide</h3>
                          <div className="mt-3 grid gap-3 text-sm text-neutral-700 sm:grid-cols-3">
                            <p className="rounded-2xl bg-stone-50 p-3">Use Stock Control for item entry and active selling work.</p>
                            <p className="rounded-2xl bg-stone-50 p-3">Use Finance for expenses, imports, and tax record checks.</p>
                            <p className="rounded-2xl bg-stone-50 p-3">Use Tools for backups and utility shortcuts.</p>
                          </div>
                        </>
                      )}
                      {activeToolPanel === "backup_instructions" && (
                        <>
                          <h3 className="mt-1 text-lg font-semibold text-neutral-950">Backup Instructions</h3>
                          <div className="mt-3 grid gap-3 text-sm text-neutral-700 sm:grid-cols-3">
                            <p className="rounded-2xl bg-stone-50 p-3">Export a backup after important inventory, sales, or expense updates.</p>
                            <p className="rounded-2xl bg-stone-50 p-3">Keep the JSON file somewhere outside the browser.</p>
                            <p className="rounded-2xl bg-stone-50 p-3">Import replaces current local data after confirmation.</p>
                          </div>
                        </>
                      )}
                      {activeToolPanel === "compliance_center" && (
                        <>
                          <h3 id="tools-panel-compliance-center" className="mt-1 text-lg font-semibold text-neutral-950">Compliance Center</h3>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                              ["Ready", complianceSummary.ready],
                              ["Incomplete", complianceSummary.incomplete],
                              ["Needs Eigenbeleg", complianceSummary.needsEigenbeleg],
                              ["Not applicable", complianceSummary.notApplicable],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-2xl bg-stone-50 p-3">
                                <p className="text-xs font-semibold text-stone-500">{label}</p>
                                <p className="mt-1 text-xl font-semibold text-stone-950">{value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 grid gap-3 lg:grid-cols-3">
                            {[
                              ["Missing Purchase Records", complianceIssueQueues.missingPurchaseRecords],
                              ["Missing Evidence", complianceIssueQueues.missingEvidence],
                              ["Needs Eigenbeleg", complianceIssueQueues.needsEigenbeleg],
                            ].map(([label, queue]) => (
                              <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-sm font-semibold text-stone-950">{label}</h4>
                                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-stone-600">{queue.length}</span>
                                </div>
                                <div className="mt-3 space-y-2">
                                  {queue.length === 0 && <p className="rounded-xl bg-white p-3 text-sm text-stone-500">No items.</p>}
                                  {queue.map((item) => (
                                    <div key={item.id} className="rounded-xl bg-white p-3">
                                      <p className="text-sm font-semibold text-stone-950">{item.name || "Untitled item"}</p>
                                      <p className="mt-1 text-xs text-stone-500">{sellerClassificationLabel(item.sellerClassification)}</p>
                                      <button type="button" onClick={() => editItem(item)} className="mt-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">Open Item</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <button type="button" onClick={() => setActiveToolPanel(null)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Close</button>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab !== "stock" && activeTab !== "sales" && activeTab !== "tools" && filtered.map((item) => {
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
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtmlPreview(listingDraft.htmlDescription) }} />
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
