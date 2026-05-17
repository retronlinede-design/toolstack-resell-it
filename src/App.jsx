import React, { useMemo, useState } from "react";
import { Plus, Package, ReceiptText, ShoppingCart, FileText, Euro, Download, Trash2, Edit3 } from "lucide-react";

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
const statusOptions = ["Draft", "Sourced", "Ready to List", "Listed", "Sold", "Shipped", "Completed", "Returned", "Written Off"];
const legacyStatusLabels = { "Written off": "Written Off", "Kept private": "Completed" };
const expenseCategories = ["Packaging", "Shipping supplies", "Fuel / travel", "Flea-market fees", "Storage", "Office supplies", "Platform/service costs", "Other"];
const classificationHelp = [
  ["Private Sale / Personal Collection", "Originally owned personal item."],
  ["Business Stock / Resale Inventory", "Bought or sourced with resale intent."],
  ["Legacy Stock / Previous Business", "Existing old stock from a previous business."],
  ["Unsure / Review Later", "Needs later review before reporting decisions."],
];

const modules = [
  ["dashboard", "Dashboard"],
  ["inventory", "Inventory"],
  ["sourcing", "Sourcing Records"],
  ["receipts", "Receipts / Eigenbelege"],
  ["ebay-import", "eBay Import"],
  ["reconciliation", "Monthly Reconciliation"],
  ["monthly-closing", "Monthly Closing"],
  ["expenses", "Expenses"],
  ["tax", "Tax Summary"],
];

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
  researchQuery: "",
  researchedLowPrice: "",
  researchedMidPrice: "",
  researchedHighPrice: "",
  chosenListingPrice: "",
  priceResearchNotes: "",
  priceResearchUpdatedAt: "",
  listingTitle: "",
  conditionText: "",
  descriptionText: "",
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
  return Boolean(item.proofImageDataUrl || item.proofNotes || item.proofAmount || item.receiptType || item.proofType);
}

function itemStatus(item) {
  return legacyStatusLabels[item.status] || item.status || "Draft";
}

function expectedListingValue(item) {
  return number(item.chosenListingPrice || item.expectedSalePrice);
}

function hasPriceResearch(item) {
  return Boolean(item.researchQuery || item.researchedLowPrice || item.researchedMidPrice || item.researchedHighPrice || item.chosenListingPrice || item.priceResearchNotes);
}

function hasListingDraft(item) {
  return Boolean(item.listingTitle || item.conditionText || item.descriptionText);
}

function isSoldStatus(item) {
  return ["Sold", "Shipped", "Completed"].includes(itemStatus(item)) || Boolean(item.finalSalePrice || item.salePrice || item.saleDate);
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

function listingPrice(item) {
  return item.chosenListingPrice || item.expectedSalePrice || "";
}

function generateListingDraft(item) {
  const title = item.listingTitle || item.ebayTitle || [item.name, item.category].filter(Boolean).join(" - ");
  const condition = item.conditionText || item.notes || "Please review photos and description for condition details.";
  const price = listingPrice(item);
  const descriptionParts = [
    item.name && `Item: ${item.name}`,
    item.category && `Category: ${item.category}`,
    price && `Listing price: ${money(price)}`,
    condition && `Condition: ${condition}`,
    item.includedItems && `Included: ${item.includedItems}`,
    item.defectsNotes && `Defects / notes: ${item.defectsNotes}`,
    item.shippingNotes && `Shipping: ${item.shippingNotes}`,
  ].filter(Boolean);

  return {
    title,
    condition,
    description: item.descriptionText || descriptionParts.join("\n"),
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
          <p className="mt-1 text-xl font-semibold leading-none text-neutral-950">{value}</p>
          {sub && <p className="mt-1 text-xs leading-snug text-neutral-500">{sub}</p>}
        </div>
        <div className="rounded-xl bg-neutral-100 p-1.5 text-neutral-700"><Icon size={16} /></div>
      </div>
    </div>
  );
}

function Input({ label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">{label}</span>
      <input {...props} className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
    </label>
  );
}

function Select({ label, className = "", children, ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">{label}</span>
      <select {...props} className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200">
        {children}
      </select>
    </label>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-950">{title}</h3>
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
  const [classificationFilter, setClassificationFilter] = useState("All classifications");
  const [expandedProofId, setExpandedProofId] = useState(null);
  const [advancedFeesOpen, setAdvancedFeesOpen] = useState(false);
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

  function saveItem(e) {
    e.preventDefault();
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
  }

  function editItem(item) {
    setForm({ ...emptyItem, ...item });
    setEditingId(item.id);
    setAdvancedFeesOpen(false);
    setItemFormOpen(true);
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
    else if (activeTab === "inventory") nextItems = [];
    else if (activeTab === "sourcing") nextItems = items.filter((item) => item.status === "Sourced" || item.status === "Listed");
    else if (activeTab === "receipts") nextItems = items.filter((item) => item.hasReceipt === "No" || item.receiptType || item.notes);
    else if (activeTab === "tax") nextItems = items;
    else if (activeTab === "ebay-import" || activeTab === "reconciliation" || activeTab === "monthly-closing" || activeTab === "expenses") nextItems = [];
    else nextItems = items;

    if (classificationFilter === "All classifications") return nextItems;
    return nextItems.filter((item) => itemClassification(item) === classificationFilter);
  }, [activeTab, classificationFilter, items]);

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
    });
  }

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {
      window.prompt(`Copy ${label}`, text || "");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-3 py-4 text-neutral-900 sm:px-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
        <header className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">ToolStack</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">ResellIt</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">Germany-focused tax-prep workspace for Kleinunternehmer and Einzelunternehmen resellers: inventory, sourcing records, receipts, Eigenbelege, eBay sales reconciliation, and EÜR-style monthly/yearly summaries.</p>
              <p className="mt-2 max-w-3xl text-xs font-medium text-neutral-500">Tax support only, not legal or tax advice. Verify filings with a Steuerberater or the Finanzamt rules that apply to your business.</p>
            </div>
            <button onClick={exportJson} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 sm:w-auto">
              <Download size={16} /> Export Backup
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ShoppingCart} label={`Monthly sales ${CURRENT_MONTH}`} value={money(monthlySummary.salesTotal)} />
          <StatCard icon={ReceiptText} label="Monthly purchases" value={money(monthlySummary.purchaseTotal)} />
          <StatCard icon={Euro} label="Monthly fees" value={money(monthlySummary.feesTotal)} sub="eBay fees + shipping" />
          <StatCard icon={FileText} label="Estimated profit" value={money(monthlySummary.profit)} sub="sales minus purchases, fees, shipping" />
        </section>

        <form onSubmit={saveItem} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">{editingId ? "Edit Item" : "Add Item"}</h2>
              <p className="mt-1 text-sm text-neutral-500">Capture inventory, sourcing evidence, receipt status, eBay listing, and sale details for later reconciliation.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setItemFormOpen(!itemFormOpen)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{itemFormOpen ? "Hide form" : "Show form"}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyItem); setItemFormOpen(false); }} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel edit</button>}
            </div>
          </div>

          {itemFormOpen && <div className="space-y-3">
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

            <FormSection title="Sourcing record and receipt evidence">
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
            </FormSection>

            <FormSection title="eBay sale and fees">
              <Input label="Expected sale price EUR" value={form.expectedSalePrice} onChange={(e) => setForm({ ...form, expectedSalePrice: e.target.value })} />
              <Input label="Sale date" type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} />
              <Input label="Final sale price EUR" value={form.finalSalePrice || form.salePrice || ""} onChange={(e) => setForm({ ...form, finalSalePrice: e.target.value })} />
              <Input label="Shipping charged to buyer EUR" value={form.shippingChargedToBuyer || ""} onChange={(e) => setForm({ ...form, shippingChargedToBuyer: e.target.value })} />
              <Input label="Actual shipping cost EUR" value={form.actualShippingCost || form.shippingCost || ""} onChange={(e) => setForm({ ...form, actualShippingCost: e.target.value })} />
            </FormSection>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
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
              <p className="mt-3 rounded-xl bg-neutral-950 p-3 text-sm font-semibold text-white">Current final profit: {money(itemProfitValue(form))}</p>
            </div>

            <FormSection title="Receipt / evidence record">
              <Select label="Proof type" value={form.proofType || "Eigenbeleg"} onChange={(e) => setForm({ ...form, proofType: e.target.value })}>
                {proofTypes.map((type) => <option key={type}>{type}</option>)}
              </Select>
              <Input label="Proof date" type="date" value={form.proofDate || form.purchaseDate} onChange={(e) => setForm({ ...form, proofDate: e.target.value })} />
              <Input label="Proof amount EUR" value={form.proofAmount || ""} onChange={(e) => setForm({ ...form, proofAmount: e.target.value })} />
              <Input label="No receipt reason" value={form.noReceiptReason || ""} onChange={(e) => setForm({ ...form, noReceiptReason: e.target.value })} placeholder="e.g. private seller did not issue receipt" />
            </FormSection>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-950">Evidence attachment</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Receipt / evidence image</span>
                  <input type="file" accept="image/*" onChange={handleProofImageUpload} className="block w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
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

            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950">Quick Listing Helper</h3>
                  <p className="mt-1 text-sm text-neutral-600">Generate an editable eBay listing draft from this inventory item. Local only; no AI or eBay API calls.</p>
                </div>
                <button type="button" onClick={generateCurrentListingDraft} className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800">Generate listing draft</button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Included items" value={form.includedItems || ""} onChange={(e) => setForm({ ...form, includedItems: e.target.value })} placeholder="Item, charger, manual..." />
                <Input label="Defects notes" value={form.defectsNotes || ""} onChange={(e) => setForm({ ...form, defectsNotes: e.target.value })} placeholder="Scratches, missing parts..." />
                <Input label="Shipping notes" value={form.shippingNotes || ""} onChange={(e) => setForm({ ...form, shippingNotes: e.target.value })} placeholder="Tracked DHL, pickup possible..." />
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <label className="block lg:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Listing title</span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={form.listingTitle || ""} onChange={(e) => setForm({ ...form, listingTitle: e.target.value })} className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                    <button type="button" onClick={() => copyText("title", form.listingTitle)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy title</button>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Condition</span>
                  <textarea value={form.conditionText || ""} onChange={(e) => setForm({ ...form, conditionText: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                  <button type="button" onClick={() => copyText("condition", form.conditionText)} className="mt-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy condition</button>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Description</span>
                  <textarea value={form.descriptionText || ""} onChange={(e) => setForm({ ...form, descriptionText: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                  <button type="button" onClick={() => copyText("description", form.descriptionText)} className="mt-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy description</button>
                </label>
              </div>
            </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Condition, missing receipt reason, storage location, defects, tax notes..." />
          </label>

          <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto">
            <Plus size={16} /> {editingId ? "Save Changes" : "Add Item"}
          </button>
          </div>}
        </form>

        <nav className="grid grid-cols-2 gap-1.5 md:grid-cols-5 xl:flex xl:flex-wrap">
          {modules.map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm ${activeTab === key ? "bg-neutral-950 text-white" : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>{label}</button>
          ))}
        </nav>

        <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr] md:items-end">
            <Select label="Filter by classification" value={classificationFilter} onChange={(e) => setClassificationFilter(e.target.value)}>
              <option>All classifications</option>
              {classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}
            </Select>
            <p className="text-sm leading-6 text-neutral-600">Use classification to keep personal collection sales separate from stock bought for resale, legacy business stock, and items that need later review.</p>
          </div>
        </div>

        <section className="grid gap-4">
          {activeTab === "inventory" && (
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
                  <article key={item.id} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                      <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-neutral-950">{item.name}</h3>
                            <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-medium text-white">{itemClassification(item)}</span>
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{itemStatus(item)}</span>
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
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <button type="button" onClick={() => editItem(item)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Edit</button>
                        <button type="button" onClick={() => duplicateItem(item)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Duplicate</button>
                        <button type="button" onClick={() => updateItemStatus(item.id, "Ready to List")} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Mark Ready to List</button>
                        <button type="button" onClick={() => updateItemStatus(item.id, "Listed")} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Mark Listed</button>
                        <button type="button" onClick={() => updateItemStatus(item.id, "Sold")} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Mark Sold</button>
                        <button type="button" onClick={() => updateItemStatus(item.id, "Shipped")} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Mark Shipped</button>
                        <button type="button" onClick={() => updateItemStatus(item.id, "Completed")} className="rounded-xl bg-neutral-950 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800">Mark Completed</button>
                      </div>
                    </div>
                  </article>
                ))}
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

          {activeTab === "ebay-import" && (
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
                        <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="block w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
                      </label>
                      {csvError && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{csvError}</p>}
                      {csvPreview && (
                        <button type="button" onClick={saveCsvBatch} className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800">
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
                      <button type="button" onClick={() => deleteCsvBatch(batch.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-white">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "reconciliation" && (
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">Monthly Reconciliation</h2>
              <p className="mt-1 text-sm text-neutral-600">Placeholder for checking eBay reports against local inventory and receipt records.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={ShoppingCart} label="Monthly sales" value={money(monthlySummary.salesTotal)} />
                <StatCard icon={ReceiptText} label="Purchases booked" value={money(monthlySummary.purchaseTotal)} />
                <StatCard icon={Euro} label="Fees booked" value={money(monthlySummary.feesTotal)} />
                <StatCard icon={FileText} label="Missing receipts" value={summary.eigenbeleg} sub="Eigenbeleg candidates" />
              </div>
            </div>
          )}

          {activeTab === "monthly-closing" && (
            <div id="monthly-closing-summary" className="grid gap-4 print:block">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">Monthly Closing</h2>
                    <p className="mt-1 max-w-3xl text-sm text-neutral-600">Month-end tax-prep summary for private and business reseller activity. Export the local JSON or print this summary for your records.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[180px_auto_auto]">
                    <Input label="Closing month" type="month" value={closingMonth} onChange={(e) => setClosingMonth(e.target.value)} />
                    <button type="button" onClick={exportMonthlyClosingJson} className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 print:hidden">Export JSON</button>
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

          {activeTab === "expenses" && (
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
                <button type="submit" className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto">
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
                          <p className="rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">{money(expense.amount)}</p>
                          <button type="button" onClick={() => editExpense(expense)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Edit</button>
                          <button type="button" onClick={() => deleteExpense(expense.id)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Delete</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "tax" && (
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

          {filtered.map((item) => {
            const itemProfit = itemProfitValue(item);
            const classification = itemClassification(item);
            const proofExpanded = expandedProofId === item.id;
            const priceExpanded = expandedCardPanel === `${item.id}:price`;
            const listingExpanded = expandedCardPanel === `${item.id}:listing`;
            const feeExpanded = expandedCardPanel === `${item.id}:fees`;
            const proofStatus = hasProofRecord(item) ? "Proof recorded" : "Missing proof";
            return (
              <article key={item.id} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-neutral-950">{item.name}</h3>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{itemStatus(item)}</span>
                      <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-medium text-white">{classification}</span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{item.category || "No category"}</span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{item.sourceType} / {item.sourceLocation || "No location"} / bought {item.purchaseDate}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => editItem(item)} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"><Edit3 size={16} /> Edit</button>
                    <button onClick={() => deleteItem(item.id)} className="rounded-xl border border-neutral-300 p-2 text-neutral-700 hover:bg-neutral-50"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                  <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Purchase</p><p className="mt-1 font-semibold">{money(item.purchasePrice)}</p></div>
                  <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Listing</p><p className="mt-1 font-semibold">{money(item.chosenListingPrice || item.expectedSalePrice)}</p></div>
                  {isSoldStatus(item) && <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Final sale</p><p className="mt-1 font-semibold">{money(finalSaleValue(item))}</p></div>}
                  <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Proof</p><p className="mt-1 font-semibold">{proofStatus}</p></div>
                  <div className="col-span-2 rounded-2xl bg-neutral-950 p-3 text-white md:col-span-1"><p className="text-xs text-neutral-300">Profit</p><p className="mt-1 font-semibold">{money(itemProfit)}</p></div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setExpandedCardPanel(priceExpanded ? "" : `${item.id}:price`)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{priceExpanded ? "Hide price research" : "Price research"}</button>
                  <button type="button" onClick={() => setExpandedCardPanel(listingExpanded ? "" : `${item.id}:listing`)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{listingExpanded ? "Hide listing draft" : "Listing draft"}</button>
                  <button type="button" onClick={() => setExpandedProofId(proofExpanded ? null : item.id)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{proofExpanded ? "Hide proof" : "Proof details"}</button>
                  <button type="button" onClick={() => setExpandedCardPanel(feeExpanded ? "" : `${item.id}:fees`)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">{feeExpanded ? "Hide fees" : "Fee details"}</button>
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
                        <div className="rounded-xl bg-neutral-950 p-3 text-white"><p className="text-xs text-neutral-300">Chosen</p><p className="font-semibold">{money(item.chosenListingPrice || item.expectedSalePrice)}</p></div>
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
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Listing draft</p>
                        <p className="mt-1 font-semibold text-neutral-950">{item.listingTitle || item.ebayTitle || item.name}</p>
                        {item.conditionText && <p className="mt-2 text-sm text-neutral-600">{item.conditionText}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => copyText("title", item.listingTitle || item.ebayTitle || item.name)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy title</button>
                        <button type="button" onClick={() => copyText("condition", item.conditionText)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy condition</button>
                        <button type="button" onClick={() => copyText("description", item.descriptionText)} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Copy description</button>
                      </div>
                    </div>
                    {item.descriptionText && <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs text-neutral-700">{item.descriptionText}</pre>}
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
                        {item.noReceiptReason && <p className="mt-2 text-sm text-neutral-600">No receipt reason: {item.noReceiptReason}</p>}
                        {item.proofImageDataUrl && <img src={item.proofImageDataUrl} alt={`${item.name} proof detail`} className="mt-3 max-h-56 rounded-2xl border border-neutral-200 object-contain" />}
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
      </div>
    </div>
  );
}
