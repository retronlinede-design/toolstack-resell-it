import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  auditExpenseIssues,
  createExpenseEvidenceRecord,
  expenseTotal,
  filterExpenses,
} from "../src/expenseManager.js";
import {
  CURRENT_DATE,
  emptyExpense,
  expenseBusinessClassifications,
  normalizeExpense,
  normalizeRootAppData,
} from "../src/resellitSchema.js";

test("old expenses normalize with safe V2 defaults and remain backup compatible", () => {
  const old = { id: "old-1", date: "2026-07-03", category: "Packaging", description: "Boxes", amount: "12.50", paymentMethod: "Cash", receiptAvailable: "No", receiptNotes: "Paper note", linkedItemId: "item-1" };
  const normalized = normalizeExpense(old);
  assert.deepEqual(normalized, { ...emptyExpense, ...old, businessClassification: "review", currency: "EUR", evidenceIds: [], notes: "Paper note" });
  assert.deepEqual(normalizeRootAppData({ items: [], expenses: [old] }).expenses, [normalized]);
});

test("new expense normalization preserves vendor, document, links, classifications, and unique evidence IDs", () => {
  const input = {
    id: 22, date: "2026-08-02", documentDate: "2026-08-01", category: "Office supplies",
    description: "Printer paper", vendorName: "Paper Shop", vendorAddress: "Main St 1",
    amount: 20, currency: "eur", paymentMethod: "Card", businessClassification: "business",
    reportingCategory: "Future mapping", receiptAvailable: "Yes", documentNumber: "R-12",
    evidenceIds: ["proof-1", "proof-1", ""], linkedItemId: "item-1",
    purchaseTransactionId: "purchase-1", ebayTransactionId: "ebay-1", notes: "Note",
  };
  const before = structuredClone(input);
  const result = normalizeExpense(input);
  assert.equal(result.id, "22");
  assert.equal(result.amount, "20");
  assert.equal(result.currency, "EUR");
  assert.equal(result.vendorName, "Paper Shop");
  assert.equal(result.documentNumber, "R-12");
  assert.deepEqual(result.evidenceIds, ["proof-1"]);
  assert.equal(result.purchaseTransactionId, "purchase-1");
  assert.deepEqual(input, before);
});

test("business classification accepts only stable values without inferring seller mode", () => {
  assert.deepEqual(expenseBusinessClassifications, ["private", "business", "mixed", "review"]);
  for (const value of expenseBusinessClassifications) assert.equal(normalizeExpense({ businessClassification: value }).businessClassification, value);
  assert.equal(normalizeExpense({ businessClassification: "unknown", sellerClassification: "business" }).businessClassification, "review");
});

test("expense evidence is metadata-only, linked to expense, and valid without item linkage", () => {
  const result = createExpenseEvidenceRecord({ evidenceType: "Invoice", documentNumber: "INV-1", documentDate: "2026-08-01", issuer: "Vendor", amount: "20", fileName: "invoice.pdf", externalPath: "D:/records/invoice.pdf", notes: "Original stored externally" }, "expense-1", "evidence-1", "2026-08-11T12:00:00.000Z");
  assert.deepEqual(result.errors, []);
  assert.equal(result.record.expenseId, "expense-1");
  assert.equal(result.record.itemId, "");
  assert.equal(result.record.purchaseTransactionId, "");
  assert.equal(result.record.storageType, "external_path");
});

test("expense totals and date-based month filtering retain existing behavior", () => {
  const expenses = [
    normalizeExpense({ id: "1", date: "2026-08-01", documentDate: "2026-07-30", amount: "10", businessClassification: "private" }),
    normalizeExpense({ id: "2", date: "2026-08-20", amount: "15", businessClassification: "business" }),
    normalizeExpense({ id: "3", date: "2026-07-20", amount: "40", businessClassification: "business" }),
  ];
  const august = filterExpenses(expenses, { month: "2026-08" });
  assert.deepEqual(august.map((entry) => entry.id), ["1", "2"]);
  assert.equal(expenseTotal(august), 25);
  assert.equal(filterExpenses(expenses, { month: "2026-08", businessClassification: "business" }).length, 1);
});

test("proof filters use receipt, document, or evidence references", () => {
  const expenses = [
    normalizeExpense({ id: "receipt", receiptAvailable: "Yes" }),
    normalizeExpense({ id: "number", documentNumber: "R-1" }),
    normalizeExpense({ id: "evidence", evidenceIds: ["proof"] }),
    normalizeExpense({ id: "missing" }),
  ];
  assert.deepEqual(filterExpenses(expenses, { proofStatus: "Proof recorded" }).map((entry) => entry.id), ["receipt", "number", "evidence"]);
  assert.deepEqual(filterExpenses(expenses, { proofStatus: "Missing proof" }).map((entry) => entry.id), ["missing"]);
});

test("expense diagnostics report completeness issues without mutation", () => {
  const expenses = [
    { id: "bad", date: CURRENT_DATE, description: "", amount: "", businessClassification: "review", receiptAvailable: "Yes", evidenceIds: ["missing"] },
    { id: "business", description: "Travel", amount: "10", businessClassification: "business", vendorName: "" },
    { id: "private", description: "Personal", amount: "5", businessClassification: "private" },
  ];
  const before = structuredClone(expenses);
  const result = auditExpenseIssues(expenses, []);
  assert.deepEqual(result[0].issues, ["missing_description", "missing_amount", "classification_review", "linked_evidence_missing"]);
  assert.deepEqual(result[1].issues, ["business_vendor_missing"]);
  assert.deepEqual(result[2].issues, []);
  assert.deepEqual(expenses, before);
});

test("delete confirmation preserves evidence and current Finance reducers remain amount/date based", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /window\.confirm\(`Delete expense/);
  assert.match(appSource, /Linked evidence records will be preserved/);
  assert.match(appSource, /persistExpenses\(expenses\.filter\(\(entry\) => entry\.id !== id\)\)/);
  assert.doesNotMatch(appSource, /deleteExpense[\s\S]{0,500}setEvidenceRecords/);
  assert.match(appSource, /monthlyExpenses\.reduce\(\(sum, expense\) => sum \+ number\(expense\.amount\), 0\)/);
  assert.match(appSource, /yearlyExpenses\.reduce\(\(sum, expense\) => sum \+ number\(expense\.amount\), 0\)/);
  assert.match(appSource, /inMonth\(expense\.date, closingMonth\)/);
});
