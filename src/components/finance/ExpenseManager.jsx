import { useState } from "react";
import { Euro, FileText } from "lucide-react";
import { emptyEvidenceRecord, evidenceTypeOptions, expenseBusinessClassifications } from "../../resellitSchema.js";
import { auditExpenseIssues } from "../../expenseManager.js";
import { StatCard } from "../shared/Cards.jsx";
import { Input, Select } from "../shared/FormControls.jsx";

const classificationLabels = { private: "Private", business: "Business", mixed: "Mixed", review: "Review" };

function Textarea({ label, ...props }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</span><textarea {...props} className="min-h-20 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70" /></label>;
}

export function ExpenseManager({
  expenseForm, editingExpenseId, expenseMonthFilter, expenseCategoryFilter,
  expenseBusinessClassificationFilter, expenseProofFilter, filteredExpenses,
  filteredExpenseTotal, expenseCategories, items, purchaseTransactions,
  evidenceRecords, money, onSaveExpense, onSetExpenseForm, onCancelExpenseEdit,
  onSetExpenseMonthFilter, onSetExpenseCategoryFilter, onSetExpenseBusinessClassificationFilter,
  onSetExpenseProofFilter, onEditExpense, onDeleteExpense, onSaveExpenseEvidence,
}) {
  const [evidenceFormOpen, setEvidenceFormOpen] = useState(false);
  const [editingEvidenceId, setEditingEvidenceId] = useState("");
  const [evidenceForm, setEvidenceForm] = useState({ ...emptyEvidenceRecord, evidenceType: "Receipt", evidenceStatus: "Available" });
  const [evidenceError, setEvidenceError] = useState("");
  const diagnostics = auditExpenseIssues(filteredExpenses, evidenceRecords);
  const issueCount = diagnostics.reduce((sum, entry) => sum + entry.issues.length, 0);
  const linkedEvidence = editingExpenseId ? evidenceRecords.filter((record) => record.expenseId === editingExpenseId || expenseForm.evidenceIds?.includes(record.id)) : [];

  function openNewEvidence() {
    setEditingEvidenceId("");
    setEvidenceError("");
    setEvidenceForm({ ...emptyEvidenceRecord, evidenceType: "Receipt", evidenceStatus: "Available", documentNumber: expenseForm.documentNumber || "", documentDate: expenseForm.documentDate || expenseForm.date || "", issuer: expenseForm.vendorName || "", amount: expenseForm.amount || "", currency: expenseForm.currency || "EUR" });
    setEvidenceFormOpen(true);
  }

  function openEvidence(record) {
    setEditingEvidenceId(record.id);
    setEvidenceError("");
    setEvidenceForm({ ...record });
    setEvidenceFormOpen(true);
  }

  function saveEvidence() {
    const result = onSaveExpenseEvidence(evidenceForm, editingExpenseId, editingEvidenceId);
    if (!result?.ok) { setEvidenceError(result?.errors?.join(" · ") || "Evidence could not be saved."); return; }
    setEvidenceFormOpen(false);
    setEditingEvidenceId("");
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-[#f0be45]/20 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h2 className="text-lg font-semibold text-neutral-950">Expense Manager</h2><p className="mt-1 text-sm text-neutral-600">Record everyday costs now and optional document details for future reporting preparation.</p></div><div className="grid gap-2 sm:grid-cols-2"><StatCard icon={Euro} label="Filtered Total" value={money(filteredExpenseTotal)} sub={`${filteredExpenses.length} records`} /><StatCard icon={FileText} label="Data Issues" value={issueCount} sub="Read-only checks" /></div></div>
      </div>

      <form onSubmit={onSaveExpense} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-neutral-950">{editingExpenseId ? "Edit Expense" : "Add Expense"}</h3><p className="mt-1 text-sm text-neutral-500">Date, description, category, and amount are the everyday fields.</p></div>{editingExpenseId && <button type="button" onClick={onCancelExpenseEdit} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold">Cancel Edit</button>}</div>
        <section className="rounded-2xl border border-stone-200 p-4"><h4 className="font-semibold text-neutral-950">Expense Details</h4><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Input label="Date" type="date" value={expenseForm.date} onChange={(e) => onSetExpenseForm({ ...expenseForm, date: e.target.value })} /><Input label="Description" value={expenseForm.description} onChange={(e) => onSetExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Tape, boxes, fuel..." /><Select label="Category" value={expenseForm.category} onChange={(e) => onSetExpenseForm({ ...expenseForm, category: e.target.value })}>{expenseCategories.map((value) => <option key={value}>{value}</option>)}</Select><Input label="Amount" type="number" step="0.01" value={expenseForm.amount} onChange={(e) => onSetExpenseForm({ ...expenseForm, amount: e.target.value })} /><Input label="Currency" value={expenseForm.currency} onChange={(e) => onSetExpenseForm({ ...expenseForm, currency: e.target.value })} /><Select label="Payment Method" value={expenseForm.paymentMethod} onChange={(e) => onSetExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}><option>Cash</option><option>Card</option><option>PayPal</option><option>Bank transfer</option><option>Other</option></Select></div></section>
        <details className="mt-3 rounded-2xl border border-stone-200"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Optional Record Details</summary><div className="grid gap-4 border-t border-stone-200 p-4">
          <section><h4 className="font-semibold">Vendor</h4><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Input label="Vendor Name" value={expenseForm.vendorName} onChange={(e) => onSetExpenseForm({ ...expenseForm, vendorName: e.target.value })} /><Input label="Vendor Address" value={expenseForm.vendorAddress} onChange={(e) => onSetExpenseForm({ ...expenseForm, vendorAddress: e.target.value })} /><Input label="Document Number" value={expenseForm.documentNumber} onChange={(e) => onSetExpenseForm({ ...expenseForm, documentNumber: e.target.value })} /><Input label="Document Date" type="date" value={expenseForm.documentDate} onChange={(e) => onSetExpenseForm({ ...expenseForm, documentDate: e.target.value })} /></div></section>
          <section><h4 className="font-semibold">Classification</h4><div className="mt-3 grid gap-3 md:grid-cols-2"><Select label="Business Classification" value={expenseForm.businessClassification} onChange={(e) => onSetExpenseForm({ ...expenseForm, businessClassification: e.target.value })}>{expenseBusinessClassifications.map((value) => <option key={value} value={value}>{classificationLabels[value]}</option>)}</Select><Input label="Reporting Category" value={expenseForm.reportingCategory} onChange={(e) => onSetExpenseForm({ ...expenseForm, reportingCategory: e.target.value })} placeholder="Optional future mapping" /></div></section>
          <section><h4 className="font-semibold">Links</h4><div className="mt-3 grid gap-3 md:grid-cols-3"><Select label="Linked Item" value={expenseForm.linkedItemId} onChange={(e) => onSetExpenseForm({ ...expenseForm, linkedItemId: e.target.value })}><option value="">No linked item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select label="Purchase Transaction" value={expenseForm.purchaseTransactionId} onChange={(e) => onSetExpenseForm({ ...expenseForm, purchaseTransactionId: e.target.value })}><option value="">No linked purchase</option>{purchaseTransactions.map((record) => <option key={record.id} value={record.id}>{record.invoiceNumber || record.supplierName || record.purchaseDate}</option>)}</Select><Input label="eBay Transaction / Reference" value={expenseForm.ebayTransactionId} onChange={(e) => onSetExpenseForm({ ...expenseForm, ebayTransactionId: e.target.value })} /></div></section>
          <section><h4 className="font-semibold">Records & Proof</h4><div className="mt-3 grid gap-3 md:grid-cols-2"><Select label="Receipt Available" value={expenseForm.receiptAvailable} onChange={(e) => onSetExpenseForm({ ...expenseForm, receiptAvailable: e.target.value })}><option>Yes</option><option>No</option></Select><Textarea label="Notes" value={expenseForm.notes} onChange={(e) => onSetExpenseForm({ ...expenseForm, notes: e.target.value, receiptNotes: e.target.value })} /></div>{editingExpenseId ? <div className="mt-3"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={openNewEvidence} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold">Add Evidence Metadata</button>{linkedEvidence.map((record) => <button key={record.id} type="button" onClick={() => openEvidence(record)} className="rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-800">{record.evidenceType}: {record.documentNumber || record.fileName || "Recorded"}</button>)}</div></div> : <p className="mt-3 text-xs text-stone-500">Save the expense before linking evidence metadata.</p>}</section>
        </div></details>
        <button type="submit" className="mt-4 rounded-2xl bg-orange-300 px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-orange-200">{editingExpenseId ? "Save Expense" : "Add Expense"}</button>
      </form>

      {evidenceFormOpen && <section className="rounded-3xl border border-orange-200 bg-orange-50/40 p-4 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-semibold">{editingEvidenceId ? "Edit Evidence" : "Add Evidence Metadata"}</h3><p className="text-sm text-stone-600">Metadata only; no file is copied into ResellIt.</p></div><button type="button" onClick={() => setEvidenceFormOpen(false)} className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Close</button></div>{evidenceError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{evidenceError}</p>}<div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Select label="Evidence Type" value={evidenceForm.evidenceType} onChange={(e) => setEvidenceForm({ ...evidenceForm, evidenceType: e.target.value })}>{evidenceTypeOptions.map((value) => <option key={value}>{value}</option>)}</Select><Input label="Document Number" value={evidenceForm.documentNumber} onChange={(e) => setEvidenceForm({ ...evidenceForm, documentNumber: e.target.value })} /><Input label="Document Date" type="date" value={evidenceForm.documentDate} onChange={(e) => setEvidenceForm({ ...evidenceForm, documentDate: e.target.value })} /><Input label="Issuer" value={evidenceForm.issuer} onChange={(e) => setEvidenceForm({ ...evidenceForm, issuer: e.target.value })} /><Input label="Amount" value={evidenceForm.amount} onChange={(e) => setEvidenceForm({ ...evidenceForm, amount: e.target.value })} /><Input label="File Name" value={evidenceForm.fileName} onChange={(e) => setEvidenceForm({ ...evidenceForm, fileName: e.target.value })} /><Input label="External Path" value={evidenceForm.externalPath} onChange={(e) => setEvidenceForm({ ...evidenceForm, externalPath: e.target.value })} /><Input label="External URL" value={evidenceForm.externalUrl} onChange={(e) => setEvidenceForm({ ...evidenceForm, externalUrl: e.target.value })} /><div className="md:col-span-2 xl:col-span-4"><Textarea label="Notes" value={evidenceForm.notes} onChange={(e) => setEvidenceForm({ ...evidenceForm, notes: e.target.value })} /></div></div><button type="button" onClick={saveEvidence} className="mt-3 rounded-xl bg-orange-300 px-4 py-2.5 text-sm font-semibold">Save Evidence</button></section>}

      <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Input label="Filter Month" type="month" value={expenseMonthFilter} onChange={(e) => onSetExpenseMonthFilter(e.target.value)} /><Select label="Filter Category" value={expenseCategoryFilter} onChange={(e) => onSetExpenseCategoryFilter(e.target.value)}><option>All categories</option>{expenseCategories.map((value) => <option key={value}>{value}</option>)}</Select><Select label="Business Classification" value={expenseBusinessClassificationFilter} onChange={(e) => onSetExpenseBusinessClassificationFilter(e.target.value)}><option>All classifications</option>{expenseBusinessClassifications.map((value) => <option key={value} value={value}>{classificationLabels[value]}</option>)}</Select><Select label="Proof Status" value={expenseProofFilter} onChange={(e) => onSetExpenseProofFilter(e.target.value)}><option>All proof statuses</option><option>Proof recorded</option><option>Missing proof</option></Select></div></div>

      <div className="overflow-x-auto rounded-3xl border border-neutral-200 bg-white shadow-sm"><table className="w-full min-w-[900px] table-fixed text-left text-sm"><thead className="bg-stone-50 text-xs text-stone-600"><tr>{["Date", "Description", "Category", "Vendor", "Amount", "Classification", "Proof", "Action"].map((label) => <th key={label} className="px-3 py-2 font-semibold">{label}</th>)}</tr></thead><tbody>{filteredExpenses.map((expense) => { const proof = evidenceRecords.some((record) => record.expenseId === expense.id) || expense.evidenceIds?.length || expense.documentNumber || expense.receiptAvailable === "Yes"; return <tr key={expense.id} className="border-t border-stone-100 hover:bg-stone-50"><td className="whitespace-nowrap px-3 py-2">{expense.date}</td><td className="truncate px-3 py-2 font-semibold" title={expense.description}>{expense.description}</td><td className="px-3 py-2">{expense.category}</td><td className="truncate px-3 py-2" title={expense.vendorName}>{expense.vendorName || "—"}</td><td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{money(expense.amount)}</td><td className="px-3 py-2">{classificationLabels[expense.businessClassification] || "Review"}</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${proof ? "bg-lime-50 text-lime-800" : "bg-amber-50 text-amber-800"}`}>{proof ? "Recorded" : "Missing"}</span></td><td className="whitespace-nowrap px-3 py-2"><button type="button" onClick={() => onEditExpense(expense)} className="mr-2 font-semibold text-stone-700">Edit</button><button type="button" onClick={() => onDeleteExpense(expense.id)} className="font-semibold text-red-700">Delete</button></td></tr>; })}</tbody></table>{filteredExpenses.length === 0 && <p className="p-5 text-sm text-neutral-600">No expenses match the current filters.</p>}</div>
    </div>
  );
}
