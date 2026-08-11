import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  auditPurchaseCostAlignment,
  auditPurchaseEvidenceReadiness,
  buildPurchaseFinanceDiagnostics,
  itemAuthoritativePurchaseTotal,
} from "../src/financeDiagnostics.js";

test("Finance purchase totals remain item-authoritative and cannot double count transaction gross", () => {
  const items = [{ id: "a", purchasePrice: "150" }, { id: "b", purchasePrice: "250.00" }];
  const transactions = [{ id: "purchase-1", purchaseDate: "2026-08-01", currency: "EUR", grossTotal: "400" }];
  assert.equal(itemAuthoritativePurchaseTotal(items), 400);
  assert.equal(itemAuthoritativePurchaseTotal(items), 400, "transaction gross must not be added to item costs");
  assert.equal(transactions[0].grossTotal, "400");
});

test("allocation cost audit distinguishes aligned, numeric-equivalent, conflicts, and missing values", () => {
  const input = {
    items: [
      { id: "a", name: "Aligned", purchasePrice: "10" },
      { id: "b", name: "Equivalent", purchasePrice: "10.00" },
      { id: "c", name: "Conflict", purchasePrice: "12" },
      { id: "d", name: "No cost", purchasePrice: "" },
      { id: "e", name: "No allocation", purchasePrice: "5" },
    ],
    purchaseTransactions: [{ id: "t", invoiceNumber: "INV-1" }],
    purchaseAllocations: [
      { id: "1", purchaseTransactionId: "t", itemId: "a", allocatedPurchaseCost: "10" },
      { id: "2", purchaseTransactionId: "t", itemId: "b", allocatedPurchaseCost: "10" },
      { id: "3", purchaseTransactionId: "t", itemId: "c", allocatedPurchaseCost: "13" },
      { id: "4", purchaseTransactionId: "t", itemId: "missing", allocatedPurchaseCost: "4" },
      { id: "5", purchaseTransactionId: "t", itemId: "d", allocatedPurchaseCost: "4" },
      { id: "6", purchaseTransactionId: "t", itemId: "e", allocatedPurchaseCost: "" },
    ],
  };
  const before = structuredClone(input);
  assert.deepEqual(auditPurchaseCostAlignment(input).map((entry) => entry.status), [
    "Aligned", "Aligned", "Conflict", "Missing item", "Missing item cost", "Missing allocation cost",
  ]);
  assert.deepEqual(input, before);
});

test("transaction evidence readiness supports direct transaction links and evidenceIds without breaking item evidence", () => {
  const transactions = [
    { id: "direct", evidenceIds: [] },
    { id: "by-id", evidenceIds: ["invoice-2"] },
    { id: "missing", evidenceIds: [] },
  ];
  const evidence = [
    { id: "invoice-1", purchaseTransactionId: "direct" },
    { id: "invoice-2", purchaseTransactionId: "" },
    { id: "item-proof", itemId: "item-1", purchaseTransactionId: "" },
  ];
  assert.deepEqual(auditPurchaseEvidenceReadiness(transactions, evidence).map((entry) => entry.status), [
    "Document Present", "Document Present", "Missing Document",
  ]);
  assert.equal(evidence[2].itemId, "item-1");
});

test("purchase health reports balanced, under, over, integrity, and evidence counts without mutation", () => {
  const input = {
    purchaseTransactions: [
      { id: "balanced", purchaseDate: "2026-08-01", currency: "EUR", grossTotal: "10" },
      { id: "under", purchaseDate: "2026-08-01", currency: "EUR", grossTotal: "10" },
      { id: "over", purchaseDate: "2026-08-01", currency: "EUR", grossTotal: "10" },
    ],
    purchaseAllocations: [
      { id: "a", purchaseTransactionId: "balanced", itemId: "one", allocatedPurchaseCost: "10" },
      { id: "b", purchaseTransactionId: "under", itemId: "two", allocatedPurchaseCost: "9" },
      { id: "c", purchaseTransactionId: "over", itemId: "three", allocatedPurchaseCost: "11" },
    ],
    items: [{ id: "one", purchasePrice: "10" }, { id: "two", purchasePrice: "9" }, { id: "three", purchasePrice: "11" }],
    evidenceRecords: [{ id: "proof", purchaseTransactionId: "balanced" }],
  };
  const before = structuredClone(input);
  const result = buildPurchaseFinanceDiagnostics(input);
  assert.deepEqual(result.counts, { total: 3, balanced: 1, underAllocated: 1, overAllocated: 1, costConflicts: 0, missingDocuments: 2 });
  assert.equal(result.integrityIssueCount, 0);
  assert.deepEqual(input, before);
});

test("Finance UI keeps selected closing month authoritative while Dashboard remains current-month scoped", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /inMonth\(item\.saleDate, closingMonth\)/);
  assert.match(source, /money\(monthlyClosing\.grossRevenue\)/);
  assert.match(source, /money\(monthlyClosing\.expenseTotal\)/);
  assert.match(source, /money\(monthlyClosing\.estimatedProceedsAfterFeesShipping\)/);
  assert.match(source, /Monthly Closing — \$\{monthLabel\(closingMonth\)\}/);
  assert.match(source, /const monthlySummary = useMemo[\s\S]*inMonth\(item\.saleDate\)/);
  assert.doesNotMatch(source, /Monthly performance[\s\S]{0,2500}sectionSummaries\.finance/);
});
