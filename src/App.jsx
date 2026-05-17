import React, { useMemo, useState } from "react";
import { Plus, Package, ReceiptText, ShoppingCart, FileText, Euro, Download, Trash2, Edit3 } from "lucide-react";

const STORAGE_KEY = "toolstack.resellerit.v1";

const emptyItem = {
  name: "",
  category: "",
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
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("inventory");

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

  const summary = useMemo(() => {
    const purchaseTotal = items.reduce((sum, item) => sum + number(item.purchasePrice), 0);
    const salesTotal = items.reduce((sum, item) => sum + number(item.salePrice), 0);
    const feesTotal = items.reduce((sum, item) => sum + number(item.ebayFees) + number(item.shippingCost), 0);
    const profit = salesTotal - purchaseTotal - feesTotal;
    const sold = items.filter((item) => item.status === "Sold").length;
    const eigenbeleg = items.filter((item) => item.hasReceipt === "No").length;
    return { purchaseTotal, salesTotal, feesTotal, profit, sold, eigenbeleg };
  }, [items]);

  const filtered = useMemo(() => {
    if (activeTab === "inventory") return items;
    if (activeTab === "sourcing") return items.filter((item) => item.status === "Sourced" || item.status === "Listed");
    if (activeTab === "sales") return items.filter((item) => item.status === "Sold" || item.salePrice);
    if (activeTab === "tax") return items;
    return items;
  }, [activeTab, items]);

  const eigenbelegText = (item) => `Eigenbeleg / Self-Receipt\n\nDate: ${item.purchaseDate}\nItem: ${item.name}\nSource: ${item.sourceType} - ${item.sourceName || "private seller"}\nLocation: ${item.sourceLocation}\nPurchase price: ${money(item.purchasePrice)}\nPayment method: ${item.paymentMethod}\nReason no invoice: Private second-hand / flea-market purchase; no formal receipt available.\nNotes: ${item.notes || "-"}\n\nSigned: ______________________`;

  return (
    <div className="min-h-screen bg-neutral-50 px-3 py-4 text-neutral-900 sm:px-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
        <header className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">ToolStack</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl">ResellIt</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">Stock, sourcing, receipts, Eigenbelege, eBay sales, and tax-support summaries for a small German reseller business.</p>
            </div>
            <button onClick={exportJson} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 sm:w-auto">
              <Download size={16} /> Export Backup
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Package} label="Items" value={items.length} sub={`${summary.sold} sold`} />
          <StatCard icon={ReceiptText} label="Purchases" value={money(summary.purchaseTotal)} />
          <StatCard icon={ShoppingCart} label="Sales" value={money(summary.salesTotal)} />
          <StatCard icon={Euro} label="Profit" value={money(summary.profit)} sub="after purchase, fees, shipping" />
          <StatCard icon={FileText} label="Eigenbelege" value={summary.eigenbeleg} sub="missing formal receipts" />
        </section>

        <form onSubmit={saveItem} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">{editingId ? "Edit Item" : "Add Item"}</h2>
              <p className="mt-1 text-sm text-neutral-500">Capture sourcing, receipt, listing, and sale details.</p>
            </div>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyItem); }} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel edit</button>}
          </div>

          <div className="space-y-3">
            <FormSection title="Item">
              <Input label="Item name" className="sm:col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sony CD Player" />
              <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Electronics, clothing..." />
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option>Sourced</option><option>Listed</option><option>Sold</option><option>Returned</option><option>Written off</option><option>Kept private</option>
              </Select>
              <Input label="eBay title" className="sm:col-span-2 lg:col-span-4" value={form.ebayTitle} onChange={(e) => setForm({ ...form, ebayTitle: e.target.value })} />
            </FormSection>

            <FormSection title="Sourcing">
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

            <FormSection title="Sale">
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

        <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {[
            ["inventory", "Inventory"],
            ["sourcing", "Sourcing"],
            ["sales", "Sales"],
            ["tax", "Tax Summary"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${activeTab === key ? "bg-neutral-950 text-white" : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>{label}</button>
          ))}
        </nav>

        <section className="grid gap-4">
          {activeTab === "tax" && (
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">Tax Support Summary</h2>
              <p className="mt-1 text-sm text-neutral-600">This is a support overview, not tax advice. Export and keep your detailed receipts, invoices, Eigenbelege, and sales records.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={ReceiptText} label="Deductible purchases" value={money(summary.purchaseTotal)} />
                <StatCard icon={ShoppingCart} label="Gross sales" value={money(summary.salesTotal)} />
                <StatCard icon={Euro} label="Fees + shipping" value={money(summary.feesTotal)} />
                <StatCard icon={Euro} label="Estimated profit" value={money(summary.profit)} />
              </div>
            </div>
          )}

          {filtered.map((item) => {
            const itemProfit = number(item.salePrice) - number(item.purchasePrice) - number(item.ebayFees) - number(item.shippingCost);
            return (
              <article key={item.id} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-neutral-950">{item.name}</h3>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{item.status}</span>
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
