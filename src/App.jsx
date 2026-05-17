import React, { useMemo, useState } from "react";
import { Plus, Package, ReceiptText, ShoppingCart, FileText, Euro, Download, Trash2, Edit3 } from "lucide-react";

const STORAGE_KEY = "toolstack.resellerit.v1";
const EBAY_IMPORTS_KEY = "toolstack.resellit.ebayImports.v1";
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);
const CURRENT_YEAR = new Date().getFullYear().toString();
const ebayMappingHints = ["order date", "item title", "sale price", "fees", "shipping", "refund", "payout"];
const DEFAULT_CLASSIFICATION = "Unsure / Review Later";
const classificationOptions = [
  "Private Sale / Personal Collection",
  "Business Stock / Resale Inventory",
  "Legacy Stock / Previous Business",
  DEFAULT_CLASSIFICATION,
];
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
  ebayFees: "",
  shippingCost: "",
  notes: "",
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold leading-none text-neutral-950">{value}</p>
          {sub && <p className="mt-2 text-xs leading-snug text-neutral-500">{sub}</p>}
        </div>
        <div className="rounded-xl bg-neutral-100 p-2 text-neutral-700"><Icon size={18} /></div>
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
  const [ebayImportBatches, setEbayImportBatches] = useState(loadEbayImportBatches);
  const [importMonth, setImportMonth] = useState(CURRENT_MONTH);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvError, setCsvError] = useState("");
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [classificationFilter, setClassificationFilter] = useState("All classifications");

  function persist(nextItems) {
    setItems(nextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: nextItems, updatedAt: new Date().toISOString() }));
  }

  function saveItem(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const clean = { ...form, name: form.name.trim() };
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteItem(id) {
    persist(items.filter((item) => item.id !== id));
  }

  function exportJson() {
    const data = JSON.stringify({ type: "RESELLERIT_BACKUP", version: 1, items, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reseller-it-backup-${new Date().toISOString().slice(0, 10)}.json`;
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

  const summary = useMemo(() => {
    const purchaseTotal = items.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = items.reduce((sum, item) => sum + number(item.salePrice), 0);
    const feesTotal = items.reduce((sum, item) => sum + number(item.ebayFees) + number(item.shippingCost), 0);
    const profit = salesTotal - purchaseTotal - feesTotal;
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

  const monthlySummary = useMemo(() => {
    const monthlyPurchases = items.filter((item) => inMonth(item.purchaseDate));
    const monthlySales = items.filter((item) => inMonth(item.saleDate));
    const purchaseTotal = monthlyPurchases.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = monthlySales.reduce((sum, item) => sum + number(item.salePrice), 0);
    const feesTotal = monthlySales.reduce((sum, item) => sum + number(item.ebayFees) + number(item.shippingCost), 0);
    const profit = salesTotal - purchaseTotal - feesTotal;
    return { purchaseTotal, salesTotal, feesTotal, profit };
  }, [items]);

  const yearlySummary = useMemo(() => {
    const yearlyPurchases = items.filter((item) => inYear(item.purchaseDate));
    const yearlySales = items.filter((item) => inYear(item.saleDate));
    const purchaseTotal = yearlyPurchases.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = yearlySales.reduce((sum, item) => sum + number(item.salePrice), 0);
    const feesTotal = yearlySales.reduce((sum, item) => sum + number(item.ebayFees) + number(item.shippingCost), 0);
    const profit = salesTotal - purchaseTotal - feesTotal;
    return { purchaseTotal, salesTotal, feesTotal, profit };
  }, [items]);

  const filtered = useMemo(() => {
    let nextItems = [];
    if (activeTab === "dashboard") nextItems = [];
    else if (activeTab === "inventory") nextItems = items;
    else if (activeTab === "sourcing") nextItems = items.filter((item) => item.status === "Sourced" || item.status === "Listed");
    else if (activeTab === "receipts") nextItems = items.filter((item) => item.hasReceipt === "No" || item.receiptType || item.notes);
    else if (activeTab === "tax") nextItems = items;
    else if (activeTab === "ebay-import" || activeTab === "reconciliation" || activeTab === "expenses") nextItems = [];
    else nextItems = items;

    if (classificationFilter === "All classifications") return nextItems;
    return nextItems.filter((item) => itemClassification(item) === classificationFilter);
  }, [activeTab, classificationFilter, items]);

  const eigenbelegText = (item) => `Eigenbeleg / Self-Receipt\n\nDate: ${item.purchaseDate}\nItem: ${item.name}\nSource: ${item.sourceType} - ${item.sourceName || "private seller"}\nLocation: ${item.sourceLocation}\nPurchase price: ${money(item.purchasePrice)}\nPayment method: ${item.paymentMethod}\nReason no invoice: Private second-hand / flea-market purchase; no formal receipt available.\nNotes: ${item.notes || "-"}\n\nSigned: ______________________`;

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
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyItem); }} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel edit</button>}
          </div>

          <div className="space-y-3">
            <FormSection title="Inventory item">
              <Input label="Item name" className="sm:col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sony CD Player" />
              <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Electronics, clothing..." />
              <Select label="Classification" value={form.classification || DEFAULT_CLASSIFICATION} onChange={(e) => setForm({ ...form, classification: e.target.value })}>
                {classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}
              </Select>
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Sourced</option><option>Listed</option><option>Sold</option><option>Returned</option><option>Written off</option><option>Kept private</option>
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
              <Input label="Sale price EUR" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
              <Input label="eBay fees EUR" value={form.ebayFees} onChange={(e) => setForm({ ...form, ebayFees: e.target.value })} />
              <Input label="Shipping cost EUR" value={form.shippingCost} onChange={(e) => setForm({ ...form, shippingCost: e.target.value })} />
            </FormSection>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Condition, missing receipt reason, storage location, defects, tax notes..." />
          </label>

          <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto">
            <Plus size={16} /> {editingId ? "Save Changes" : "Add Item"}
          </button>
        </form>

        <nav className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:flex xl:flex-wrap">
          {modules.map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${activeTab === key ? "bg-neutral-950 text-white" : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>{label}</button>
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

          {activeTab === "expenses" && (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">Expenses Module</h2>
              <p className="mt-1 text-sm text-neutral-600">Planned localStorage module for reseller business expenses such as packaging, labels, tools, mileage notes, storage, and platform-related costs. No new expense data model has been added in this pass.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {["Packaging", "Shipping labels", "Tools & supplies", "Mileage notes"].map((label) => (
                  <div key={label} className="rounded-2xl bg-neutral-50 p-4 text-sm font-semibold text-neutral-700">{label}</div>
                ))}
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
                <StatCard icon={Euro} label="Estimated EÜR profit" value={money(yearlySummary.profit)} />
              </div>
            </div>
          )}

          {filtered.map((item) => {
            const itemProfit = number(item.salePrice) - number(item.purchasePrice) - number(item.ebayFees) - number(item.shippingCost);
            const classification = itemClassification(item);
            return (
              <article key={item.id} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-neutral-950">{item.name}</h3>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{item.status}</span>
                      <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-medium text-white">{classification}</span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{item.category || "No category"}</span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{item.sourceType} / {item.sourceLocation || "No location"} / bought {item.purchaseDate}</p>
                    {item.ebayTitle && <p className="mt-1 text-sm text-neutral-700">eBay: {item.ebayTitle}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editItem(item)} className="rounded-xl border border-neutral-300 p-2 text-neutral-700 hover:bg-neutral-50"><Edit3 size={16} /></button>
                    <button onClick={() => deleteItem(item.id)} className="rounded-xl border border-neutral-300 p-2 text-neutral-700 hover:bg-neutral-50"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Purchase</p><p className="mt-1 font-semibold">{money(item.purchasePrice)}</p></div>
                  <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Expected sale</p><p className="mt-1 font-semibold">{money(item.expectedSalePrice)}</p></div>
                  <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Actual sale</p><p className="mt-1 font-semibold">{money(item.salePrice)}</p></div>
                  <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Fees + shipping</p><p className="mt-1 font-semibold">{money(number(item.ebayFees) + number(item.shippingCost))}</p></div>
                  <div className="col-span-2 rounded-2xl bg-neutral-950 p-3 text-white lg:col-span-1"><p className="text-xs text-neutral-300">Profit</p><p className="mt-1 font-semibold">{money(itemProfit)}</p></div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Receipt record</p>
                    <p className="mt-1 text-sm">Receipt: <strong>{item.hasReceipt}</strong> / Type: <strong>{item.receiptType}</strong> / Payment: <strong>{item.paymentMethod}</strong></p>
                    <p className="mt-2 text-sm text-neutral-600">{item.notes || "No notes."}</p>
                  </div>
                  {item.hasReceipt === "No" && (
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Eigenbeleg draft</p>
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-neutral-700">{eigenbelegText(item)}</pre>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
