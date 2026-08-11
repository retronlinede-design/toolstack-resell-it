import { useState } from "react";
import { FileText, Plus, Search, X } from "lucide-react";
import {
  emptyEvidenceRecord,
  emptyPurchaseAllocation,
  emptyPurchaseTransaction,
  evidenceTypeOptions,
  receiptStatusOptions,
  sellerTypeOptions,
  validatePurchaseIntegrity,
} from "../../resellitSchema.js";
import { purchaseReconciliationStatus } from "../../purchaseManager.js";
import { Input, Select } from "../shared/FormControls.jsx";

const transactionTypes = ["Purchase", "Invoice", "Receipt", "Bulk Lot", "Private Purchase", "Other"];
const allocationMethods = ["Existing Item Cost", "Invoice Line", "Equal Split", "Manual", "Other"];

function money(value, currency = "EUR") {
  return Number(value || 0).toLocaleString("de-DE", { style: "currency", currency: currency || "EUR" });
}

function statusClass(status) {
  if (status === "Balanced") return "border-lime-200 bg-lime-50 text-lime-800";
  if (status === "Over-allocated") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function Textarea({ label, ...props }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</span><textarea {...props} className="min-h-20 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70" /></label>;
}

export function PurchaseInvoiceManager({
  items,
  transactions,
  allocations,
  evidenceRecords,
  onClose,
  onSaveTransaction,
  onDeleteTransaction,
  onAddAllocations,
  onSaveAllocation,
  onRemoveAllocation,
  onSaveEvidence,
}) {
  const [view, setView] = useState("list");
  const [selectedTransactionId, setSelectedTransactionId] = useState("");
  const [transactionForm, setTransactionForm] = useState({ ...emptyPurchaseTransaction });
  const [formError, setFormError] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [editingAllocationId, setEditingAllocationId] = useState("");
  const [allocationForm, setAllocationForm] = useState({ ...emptyPurchaseAllocation });
  const [evidenceFormOpen, setEvidenceFormOpen] = useState(false);
  const [editingEvidenceId, setEditingEvidenceId] = useState("");
  const [evidenceForm, setEvidenceForm] = useState({ ...emptyEvidenceRecord, evidenceType: "Invoice", evidenceStatus: "Available" });

  const selectedTransaction = transactions.find((record) => record.id === selectedTransactionId) || null;
  const selectedAllocations = allocations.filter((record) => record.purchaseTransactionId === selectedTransactionId);
  const selectedEvidence = evidenceRecords.filter((record) => record.purchaseTransactionId === selectedTransactionId);
  const integrity = validatePurchaseIntegrity({ purchaseTransactions: transactions, purchaseAllocations: allocations, items, evidenceRecords });
  const integrityIssueCount = Object.values(integrity).reduce((sum, issues) => sum + issues.length, 0);
  const linkedItemIds = new Set(selectedAllocations.map((record) => record.itemId));
  const stockQuery = stockSearch.trim().toLowerCase();
  const availableItems = items.filter((item) => !linkedItemIds.has(item.id) && (!stockQuery || [item.name, item.category, item.sourceName].join(" ").toLowerCase().includes(stockQuery)));

  function openNew() {
    setTransactionForm({ ...emptyPurchaseTransaction, grossTotal: "" });
    setSelectedTransactionId("");
    setFormError("");
    setView("form");
  }

  function openTransaction(transaction) {
    setSelectedTransactionId(transaction.id);
    setSelectedItemIds([]);
    setStockSearch("");
    setView("detail");
  }

  function editTransaction(transaction) {
    setSelectedTransactionId(transaction.id);
    setTransactionForm({ ...transaction });
    setFormError("");
    setView("form");
  }

  function saveTransaction() {
    if (!transactionForm.purchaseDate || !transactionForm.currency || String(transactionForm.grossTotal).trim() === "") {
      setFormError("Purchase Date, Currency, and Gross Total are required.");
      return;
    }
    const saved = onSaveTransaction(transactionForm, Boolean(selectedTransactionId));
    if (!saved?.ok) {
      setFormError(saved?.errors?.join(" · ") || "Purchase could not be saved.");
      return;
    }
    setSelectedTransactionId(saved.record.id);
    setView("detail");
  }

  function confirmDelete(transaction) {
    if (!window.confirm(`Delete purchase ${transaction.invoiceNumber || transaction.purchaseDate}? Linked stock items will not be deleted.`)) return;
    onDeleteTransaction(transaction.id);
    if (selectedTransactionId === transaction.id) {
      setSelectedTransactionId("");
      setView("list");
    }
  }

  function editAllocation(allocation) {
    setEditingAllocationId(allocation.id);
    setAllocationForm({ ...allocation });
  }

  function saveAllocation() {
    const result = onSaveAllocation(allocationForm);
    if (!result?.ok) return;
    setEditingAllocationId("");
  }

  function confirmRemoveAllocation(allocation) {
    if (!window.confirm("Unlink this stock item from the purchase? The inventory item will not be deleted.")) return;
    onRemoveAllocation(allocation.id);
  }

  function openNewEvidence() {
    setEditingEvidenceId("");
    setEvidenceForm({ ...emptyEvidenceRecord, evidenceType: "Invoice", evidenceStatus: "Available", documentDate: selectedTransaction?.invoiceDate || selectedTransaction?.purchaseDate || "", issuer: selectedTransaction?.supplierName || "", amount: selectedTransaction?.grossTotal || "", currency: selectedTransaction?.currency || "EUR" });
    setEvidenceFormOpen(true);
  }

  function editEvidence(record) {
    setEditingEvidenceId(record.id);
    setEvidenceForm({ ...record });
    setEvidenceFormOpen(true);
  }

  function saveEvidence() {
    const result = onSaveEvidence(evidenceForm, selectedTransactionId, editingEvidenceId);
    if (!result?.ok) {
      setFormError(result?.errors?.join(" · ") || "Document metadata could not be saved.");
      return;
    }
    setEvidenceFormOpen(false);
    setEditingEvidenceId("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-950/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Purchases & Invoices">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-stone-200 bg-[#fffaf0] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-[#9c481b]">Stock Control</p><h2 className="text-xl font-semibold text-stone-950">Purchases & Invoices</h2><p className="mt-1 text-sm text-stone-600">Record purchases, link existing stock, and reconcile allocated costs.</p></div>
          <button type="button" onClick={onClose} aria-label="Close Purchases & Invoices" className="rounded-xl border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50"><X size={18} /></button>
        </header>

        <main className="p-4 sm:p-6">
          {integrityIssueCount > 0 && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Purchase data integrity review: {integrityIssueCount} issue{integrityIssueCount === 1 ? "" : "s"}. No records were changed automatically.</p>}
          {view === "list" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-stone-950">Purchase Records</h3><p className="text-sm text-stone-600">{transactions.length} recorded purchases</p></div><button type="button" onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-[#b7412e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#963424]"><Plus size={16} /> New Purchase</button></div>
              {transactions.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center"><FileText className="mx-auto text-stone-400" /><p className="mt-3 text-sm text-stone-600">No purchase records yet.</p><button type="button" onClick={openNew} className="mt-4 rounded-xl bg-[#b7412e] px-4 py-2 text-sm font-semibold text-white">New Purchase</button></div> : (
                <div className="grid gap-3">
                  {transactions.map((transaction) => {
                    const summary = purchaseReconciliationStatus(transaction, allocations);
                    return <article key={transaction.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1.2fr_1.2fr_1fr_repeat(4,.8fr)_auto] md:items-center"><div><p className="text-xs font-semibold text-stone-500">Purchase Date</p><p className="mt-1 text-sm font-semibold text-stone-950">{transaction.purchaseDate}</p></div><div><p className="text-xs font-semibold text-stone-500">Supplier / Source</p><p className="mt-1 truncate text-sm text-stone-800">{transaction.supplierName || transaction.sourcePlatform || transaction.sourceLocation || "Not recorded"}</p></div><div><p className="text-xs font-semibold text-stone-500">Invoice Number</p><p className="mt-1 text-sm text-stone-800">{transaction.invoiceNumber || "—"}</p></div><div><p className="text-xs font-semibold text-stone-500">Gross Total</p><p className="mt-1 text-sm font-semibold">{money(summary.grossTotal, transaction.currency)}</p></div><div><p className="text-xs font-semibold text-stone-500">Linked Items</p><p className="mt-1 text-sm font-semibold">{summary.allocationCount}</p></div><div><p className="text-xs font-semibold text-stone-500">Allocated</p><p className="mt-1 text-sm font-semibold">{money(summary.allocatedTotal, transaction.currency)}</p></div><div><p className="text-xs font-semibold text-stone-500">Difference</p><p className="mt-1 text-sm font-semibold">{money(summary.difference, transaction.currency)}</p></div><div className="flex flex-wrap items-center justify-end gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(summary.status)}`}>{summary.status}</span><button type="button" onClick={() => openTransaction(transaction)} className="text-xs font-semibold text-[#8f3124]">Open</button><button type="button" onClick={() => editTransaction(transaction)} className="text-xs font-semibold text-stone-600">Edit</button><button type="button" onClick={() => confirmDelete(transaction)} className="text-xs font-semibold text-red-700">Delete</button></div></div></article>;
                  })}
                </div>
              )}
            </div>
          )}

          {view === "form" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-stone-950">{selectedTransactionId ? "Edit Purchase" : "New Purchase"}</h3><p className="text-sm text-stone-600">Supplier and invoice details are encouraged but optional.</p></div><button type="button" onClick={() => setView(selectedTransactionId ? "detail" : "list")} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">Cancel</button></div>
              {formError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
              <section className="rounded-2xl border border-stone-200 bg-white p-4"><h4 className="font-semibold text-stone-950">Purchase Details</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Input label="Purchase Date" type="date" value={transactionForm.purchaseDate} onChange={(e) => setTransactionForm({ ...transactionForm, purchaseDate: e.target.value })} /><Select label="Transaction Type" value={transactionForm.transactionType} onChange={(e) => setTransactionForm({ ...transactionForm, transactionType: e.target.value })}>{transactionTypes.map((value) => <option key={value}>{value}</option>)}</Select><Input label="Invoice Date" type="date" value={transactionForm.invoiceDate} onChange={(e) => setTransactionForm({ ...transactionForm, invoiceDate: e.target.value })} /><Input label="Invoice Number" value={transactionForm.invoiceNumber} onChange={(e) => setTransactionForm({ ...transactionForm, invoiceNumber: e.target.value })} /></div></section>
              <section className="rounded-2xl border border-stone-200 bg-white p-4"><h4 className="font-semibold text-stone-950">Supplier</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Input label="Supplier Name" value={transactionForm.supplierName} onChange={(e) => setTransactionForm({ ...transactionForm, supplierName: e.target.value })} /><Select label="Seller Type" value={transactionForm.sellerType} onChange={(e) => setTransactionForm({ ...transactionForm, sellerType: e.target.value })}>{sellerTypeOptions.map((value) => <option key={value}>{value}</option>)}</Select><Input label="Source Type" value={transactionForm.sourceType} onChange={(e) => setTransactionForm({ ...transactionForm, sourceType: e.target.value })} /><Input label="Source Platform" value={transactionForm.sourcePlatform} onChange={(e) => setTransactionForm({ ...transactionForm, sourcePlatform: e.target.value })} /><Input label="Purchase Location" value={transactionForm.sourceLocation} onChange={(e) => setTransactionForm({ ...transactionForm, sourceLocation: e.target.value })} /><Input label="Address Line 1" value={transactionForm.supplierAddressLine1} onChange={(e) => setTransactionForm({ ...transactionForm, supplierAddressLine1: e.target.value })} /><Input label="Address Line 2" value={transactionForm.supplierAddressLine2} onChange={(e) => setTransactionForm({ ...transactionForm, supplierAddressLine2: e.target.value })} /><Input label="Postal Code" value={transactionForm.supplierPostalCode} onChange={(e) => setTransactionForm({ ...transactionForm, supplierPostalCode: e.target.value })} /><Input label="City" value={transactionForm.supplierCity} onChange={(e) => setTransactionForm({ ...transactionForm, supplierCity: e.target.value })} /><Input label="Country" value={transactionForm.supplierCountry} onChange={(e) => setTransactionForm({ ...transactionForm, supplierCountry: e.target.value })} /></div></section>
              <section className="rounded-2xl border border-stone-200 bg-white p-4"><h4 className="font-semibold text-stone-950">Amounts</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Input label="Currency" value={transactionForm.currency} onChange={(e) => setTransactionForm({ ...transactionForm, currency: e.target.value })} /><Input label="Gross Total" type="number" step="0.01" value={transactionForm.grossTotal} onChange={(e) => setTransactionForm({ ...transactionForm, grossTotal: e.target.value })} /><Select label="Payment Method" value={transactionForm.paymentMethod} onChange={(e) => setTransactionForm({ ...transactionForm, paymentMethod: e.target.value })}><option>Cash</option><option>Card</option><option>PayPal</option><option>Bank transfer</option><option>Other</option></Select><Select label="Receipt Status" value={transactionForm.receiptStatus} onChange={(e) => setTransactionForm({ ...transactionForm, receiptStatus: e.target.value })}>{receiptStatusOptions.map((value) => <option key={value}>{value}</option>)}</Select></div><details className="mt-4 rounded-xl border border-stone-200 bg-stone-50"><summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-stone-700">Advanced Amount Breakdown</summary><div className="grid gap-3 border-t border-stone-200 p-3 sm:grid-cols-2 lg:grid-cols-4"><Input label="Subtotal" type="number" step="0.01" value={transactionForm.subtotal} onChange={(e) => setTransactionForm({ ...transactionForm, subtotal: e.target.value })} /><Input label="Tax Amount" type="number" step="0.01" value={transactionForm.taxAmount} onChange={(e) => setTransactionForm({ ...transactionForm, taxAmount: e.target.value })} /><Input label="Shipping Amount" type="number" step="0.01" value={transactionForm.shippingAmount} onChange={(e) => setTransactionForm({ ...transactionForm, shippingAmount: e.target.value })} /><Input label="Discount Amount" type="number" step="0.01" value={transactionForm.discountAmount} onChange={(e) => setTransactionForm({ ...transactionForm, discountAmount: e.target.value })} /></div></details></section>
              <section className="rounded-2xl border border-stone-200 bg-white p-4"><Textarea label="Notes" value={transactionForm.notes} onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })} /></section>
              <div className="flex justify-end"><button type="button" onClick={saveTransaction} className="rounded-xl bg-[#b7412e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#963424]">Save Purchase</button></div>
            </div>
          )}

          {view === "detail" && selectedTransaction && (() => {
            const summary = purchaseReconciliationStatus(selectedTransaction, allocations);
            return <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><button type="button" onClick={() => setView("list")} className="text-xs font-semibold text-[#8f3124]">← Purchase Records</button><h3 className="mt-1 text-lg font-semibold text-stone-950">{selectedTransaction.invoiceNumber || selectedTransaction.supplierName || selectedTransaction.purchaseDate}</h3><p className="text-sm text-stone-600">{selectedTransaction.supplierName || "Supplier not recorded"}</p></div><div className="flex gap-2"><button type="button" onClick={() => editTransaction(selectedTransaction)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">Edit</button><button type="button" onClick={() => confirmDelete(selectedTransaction)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Delete</button></div></div>
              <section className="grid grid-cols-2 gap-2 rounded-2xl border border-stone-200 bg-white p-3 sm:grid-cols-5">{[["Gross Total", money(summary.grossTotal, selectedTransaction.currency)], ["Allocated Total", money(summary.allocatedTotal, selectedTransaction.currency)], ["Difference", money(summary.difference, selectedTransaction.currency)], ["Linked Items", summary.allocationCount], ["Status", summary.status]].map(([label, value]) => <div key={label} className="rounded-xl bg-stone-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-1 text-sm font-semibold text-stone-950">{value}</p></div>)}</section>
              <section className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex items-center justify-between"><div><h4 className="font-semibold text-stone-950">Linked Stock Items</h4><p className="text-xs text-stone-500">Allocations do not overwrite item purchase prices.</p></div></div>{selectedAllocations.length === 0 ? <p className="mt-4 rounded-xl bg-stone-50 p-4 text-sm text-stone-600">No stock items linked to this purchase yet.</p> : <div className="mt-3 grid gap-2">{selectedAllocations.map((allocation) => { const item = items.find((entry) => entry.id === allocation.itemId); return <div key={allocation.id} className="rounded-xl border border-stone-200 p-3">{editingAllocationId === allocation.id ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Input label="Quantity" type="number" step="1" value={allocationForm.quantity} onChange={(e) => setAllocationForm({ ...allocationForm, quantity: e.target.value })} /><Input label="Invoice Line Amount" type="number" step="0.01" value={allocationForm.invoiceLineAmount} onChange={(e) => setAllocationForm({ ...allocationForm, invoiceLineAmount: e.target.value })} /><Input label="Allocated Purchase Cost" type="number" step="0.01" value={allocationForm.allocatedPurchaseCost} onChange={(e) => setAllocationForm({ ...allocationForm, allocatedPurchaseCost: e.target.value })} /><Select label="Allocation Method" value={allocationForm.allocationMethod} onChange={(e) => setAllocationForm({ ...allocationForm, allocationMethod: e.target.value })}>{allocationMethods.map((value) => <option key={value}>{value}</option>)}</Select><Input label="Allocation Notes" value={allocationForm.allocationNotes} onChange={(e) => setAllocationForm({ ...allocationForm, allocationNotes: e.target.value })} /><div className="flex gap-2 sm:col-span-2 lg:col-span-5"><button type="button" onClick={saveAllocation} className="rounded-lg bg-[#b7412e] px-3 py-2 text-xs font-semibold text-white">Save Allocation</button><button type="button" onClick={() => setEditingAllocationId("")} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold">Cancel</button></div></div> : <div className="grid gap-2 sm:grid-cols-[1.5fr_repeat(4,1fr)_auto] sm:items-center"><div><p className="text-sm font-semibold text-stone-950">{item?.name || allocation.description || "Missing item"}</p><p className="text-xs text-stone-500">Current Item Cost: {money(item?.purchasePrice, selectedTransaction.currency)}</p></div><p className="text-xs"><span className="block text-stone-500">Invoice Line</span>{money(allocation.invoiceLineAmount, selectedTransaction.currency)}</p><p className="text-xs"><span className="block text-stone-500">Allocated</span>{money(allocation.allocatedPurchaseCost, selectedTransaction.currency)}</p><p className="text-xs"><span className="block text-stone-500">Quantity</span>{allocation.quantity}</p><p className="text-xs"><span className="block text-stone-500">Method</span>{allocation.allocationMethod || "Manual"}</p><div className="flex gap-2"><button type="button" onClick={() => editAllocation(allocation)} className="text-xs font-semibold text-[#8f3124]">Edit</button><button type="button" onClick={() => confirmRemoveAllocation(allocation)} className="text-xs font-semibold text-red-700">Unlink</button></div></div>}</div>; })}</div>}
                <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3"><label className="relative block"><Search size={14} className="absolute left-3 top-3 text-stone-400" /><input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-sm" placeholder="Search existing stock…" /></label><div className="mt-2 max-h-44 overflow-auto">{availableItems.map((item) => <label key={item.id} className="flex items-center justify-between gap-3 border-b border-stone-200 px-2 py-2 text-sm last:border-0"><span><span className="font-semibold text-stone-900">{item.name || "Untitled item"}</span><span className="ml-2 text-xs text-stone-500">Current cost {money(item.purchasePrice, selectedTransaction.currency)}</span></span><input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={(e) => setSelectedItemIds((current) => e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /></label>)}</div><button type="button" disabled={!selectedItemIds.length} onClick={() => { onAddAllocations(selectedTransactionId, selectedItemIds); setSelectedItemIds([]); }} className="mt-3 rounded-lg bg-[#e06b2c] px-3 py-2 text-xs font-semibold text-[#24110e] disabled:opacity-40">Link Selected Items</button></div>
              </section>
              <section className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex items-center justify-between"><div><h4 className="font-semibold text-stone-950">Documents</h4><p className="text-xs text-stone-500">Metadata and external references only. No file is uploaded.</p></div><button type="button" onClick={openNewEvidence} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700"><Plus size={13} className="mr-1 inline" /> Add Document</button></div>{selectedEvidence.length === 0 ? <p className="mt-4 rounded-xl bg-stone-50 p-4 text-sm text-stone-600">No documents linked yet.</p> : <div className="mt-3 grid gap-2">{selectedEvidence.map((record) => <div key={record.id} className="flex items-center justify-between rounded-xl border border-stone-200 p-3"><div><p className="text-sm font-semibold text-stone-950">{record.evidenceType} {record.documentNumber ? `· ${record.documentNumber}` : ""}</p><p className="mt-1 text-xs text-stone-500">{record.documentDate || "No date"} · {record.issuer || "No issuer"} · {money(record.amount, record.currency)}</p></div><button type="button" onClick={() => editEvidence(record)} className="text-xs font-semibold text-[#8f3124]">Edit</button></div>)}</div>}
                {evidenceFormOpen && <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/40 p-3"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Select label="Evidence Type" value={evidenceForm.evidenceType} onChange={(e) => setEvidenceForm({ ...evidenceForm, evidenceType: e.target.value })}>{evidenceTypeOptions.map((value) => <option key={value}>{value}</option>)}</Select><Input label="Document Number" value={evidenceForm.documentNumber} onChange={(e) => setEvidenceForm({ ...evidenceForm, documentNumber: e.target.value })} /><Input label="Document Date" type="date" value={evidenceForm.documentDate} onChange={(e) => setEvidenceForm({ ...evidenceForm, documentDate: e.target.value })} /><Input label="Issuer" value={evidenceForm.issuer} onChange={(e) => setEvidenceForm({ ...evidenceForm, issuer: e.target.value })} /><Input label="Amount" type="number" step="0.01" value={evidenceForm.amount} onChange={(e) => setEvidenceForm({ ...evidenceForm, amount: e.target.value })} /><Input label="File Name" value={evidenceForm.fileName} onChange={(e) => setEvidenceForm({ ...evidenceForm, fileName: e.target.value })} /><Input label="External Path" value={evidenceForm.externalPath} onChange={(e) => setEvidenceForm({ ...evidenceForm, externalPath: e.target.value })} /><Input label="External URL" type="url" value={evidenceForm.externalUrl} onChange={(e) => setEvidenceForm({ ...evidenceForm, externalUrl: e.target.value })} /><div className="sm:col-span-2 lg:col-span-4"><Textarea label="Notes" value={evidenceForm.notes} onChange={(e) => setEvidenceForm({ ...evidenceForm, notes: e.target.value })} /></div></div><div className="mt-3 flex gap-2"><button type="button" onClick={saveEvidence} className="rounded-lg bg-[#b7412e] px-3 py-2 text-xs font-semibold text-white">Save Document</button><button type="button" onClick={() => setEvidenceFormOpen(false)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold">Cancel</button></div></div>}
              </section>
              {selectedTransaction.notes && <section className="rounded-2xl border border-stone-200 bg-white p-4"><h4 className="font-semibold text-stone-950">Notes</h4><p className="mt-2 whitespace-pre-wrap text-sm text-stone-600">{selectedTransaction.notes}</p></section>}
            </div>;
          })()}
        </main>
      </div>
    </div>
  );
}
