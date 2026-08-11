import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateDraftAllocationSummary,
  createStockRowDraft,
  mapPurchaseTransactionToItemDefaults,
  preparePurchaseWithItems,
  validateStockRowDrafts,
} from "../src/purchaseBatch.js";
import { number, normalizeRootAppData } from "../src/resellitSchema.js";

const transactionDraft = {
  purchaseDate: "2026-08-10",
  transactionType: "Invoice",
  invoiceNumber: "INV-20",
  supplierName: "Dealer XYZ",
  sourceType: "Dealer purchase",
  sourcePlatform: "Direct",
  sourceLocation: "Berlin",
  currency: "EUR",
  grossTotal: "20",
  paymentMethod: "Bank transfer",
  receiptStatus: "Receipt available",
};

function sequentialIds() {
  let value = 0;
  return () => `generated-${++value}`;
}

function prepare(rows, overrides = {}) {
  return preparePurchaseWithItems({
    transactionDraft: { ...transactionDraft, ...(overrides.transactionDraft || {}) },
    stockRows: rows,
    requireBalanced: overrides.requireBalanced ?? true,
    generateId: overrides.generateId || sequentialIds(),
    timestamp: "2026-08-11T12:00:00.000Z",
  });
}

test("one purchase creates one Draft item and one correctly linked allocation", () => {
  const row = createStockRowDraft("row-1", { name: "Camera", category: "Electronics", allocatedPurchaseCost: "20", invoiceLineAmount: "20" });
  const result = prepare([row]);
  assert.equal(result.ok, true);
  assert.equal(result.items.length, 1);
  assert.equal(result.allocations.length, 1);
  assert.equal(result.items[0].status, "Draft");
  assert.equal(result.items[0].purchasePrice, "20");
  assert.equal(result.items[0].purchaseDate, transactionDraft.purchaseDate);
  assert.equal(result.items[0].sourceType, transactionDraft.sourceType);
  assert.equal(result.items[0].sourceName, transactionDraft.supplierName);
  assert.equal(result.items[0].sourceLocation, transactionDraft.sourceLocation);
  assert.equal(result.items[0].paymentMethod, transactionDraft.paymentMethod);
  assert.equal(result.allocations[0].purchaseTransactionId, result.transaction.id);
  assert.equal(result.allocations[0].itemId, result.items[0].id);
  assert.equal(result.allocations[0].allocationMethod, "Manual");
});

test("one purchase creates 20 items and allocations with unique stable IDs", () => {
  const rows = Array.from({ length: 20 }, (_, index) => createStockRowDraft(`row-${index + 1}`, { name: `Item ${index + 1}`, allocatedPurchaseCost: "1" }));
  const result = prepare(rows);
  assert.equal(result.ok, true);
  assert.equal(result.items.length, 20);
  assert.equal(result.allocations.length, 20);
  const ids = [result.transaction.id, ...result.items.map((item) => item.id), ...result.allocations.map((allocation) => allocation.id)];
  assert.equal(new Set(ids).size, 41);
  result.allocations.forEach((allocation, index) => {
    assert.equal(allocation.purchaseTransactionId, result.transaction.id);
    assert.equal(allocation.itemId, result.items[index].id);
  });
});

test("batch items contain no populated sale, shipping, fee, or listing data", () => {
  const result = prepare([createStockRowDraft("row-1", { name: "Camera", allocatedPurchaseCost: "20" })]);
  const item = result.items[0];
  for (const field of ["saleDate", "finalSalePrice", "shippingChargedToBuyer", "actualShippingCost", "ebayFees", "manualEbayFee", "trackingNumber", "refundAmount", "ebayTitle", "listingTitle"]) assert.equal(item[field], "");
});

test("transaction evidence is not duplicated onto generated items", () => {
  const result = prepare([createStockRowDraft("row-1", { name: "Camera", allocatedPurchaseCost: "20" })], { transactionDraft: { evidenceIds: ["evidence-1"] } });
  assert.deepEqual(result.transaction.evidenceIds, ["evidence-1"]);
  assert.equal(result.items[0].evidenceIds, undefined);
});

test("draft reconciliation reports balanced batch", () => {
  const rows = [createStockRowDraft("row-1", { name: "A", allocatedPurchaseCost: "8" }), createStockRowDraft("row-2", { name: "B", allocatedPurchaseCost: "12" })];
  const summary = calculateDraftAllocationSummary(transactionDraft, rows);
  assert.equal(summary.allocatedTotal, 20);
  assert.equal(summary.difference, 0);
  assert.equal(summary.isBalanced, true);
});

test("under-allocation blocks the entire batch when balance is required", () => {
  const result = prepare([createStockRowDraft("row-1", { name: "A", allocatedPurchaseCost: "10" })]);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /must be balanced/i);
  assert.equal(result.transaction, null);
  assert.deepEqual(result.items, []);
  assert.deepEqual(result.allocations, []);
});

test("under-allocation succeeds when balance requirement is disabled", () => {
  const result = prepare([createStockRowDraft("row-1", { name: "A", allocatedPurchaseCost: "10" })], { requireBalanced: false });
  assert.equal(result.ok, true);
  assert.equal(result.reconciliation.isBalanced, false);
});

test("blank names, missing costs, duplicate temporary IDs, and invalid transactions block atomically", () => {
  const invalidCases = [
    [createStockRowDraft("row-1", { name: "", allocatedPurchaseCost: "20" })],
    [createStockRowDraft("row-1", { name: "A", allocatedPurchaseCost: "" })],
    [createStockRowDraft("row-1", { name: "A", allocatedPurchaseCost: "10" }), createStockRowDraft("row-1", { name: "B", allocatedPurchaseCost: "10" })],
  ];
  invalidCases.forEach((rows) => {
    const result = prepare(rows, { requireBalanced: false });
    assert.equal(result.ok, false);
    assert.equal(result.transaction, null);
    assert.deepEqual(result.items, []);
    assert.deepEqual(result.allocations, []);
  });
  const invalidTransaction = prepare([createStockRowDraft("row-1", { name: "A", allocatedPurchaseCost: "20" })], { transactionDraft: { purchaseDate: "" } });
  assert.equal(invalidTransaction.ok, false);
  assert.match(invalidTransaction.errors.join(" "), /Purchase Date is required/);
});

test("preparation helpers do not mutate transaction or row drafts", () => {
  const transaction = { ...transactionDraft };
  const rows = [createStockRowDraft("row-1", { name: "A", allocatedPurchaseCost: "20" })];
  const snapshot = structuredClone({ transaction, rows });
  preparePurchaseWithItems({ transactionDraft: transaction, stockRows: rows, requireBalanced: true, generateId: sequentialIds(), timestamp: "2026-08-11T12:00:00.000Z" });
  assert.deepEqual({ transaction, rows }, snapshot);
  assert.deepEqual(mapPurchaseTransactionToItemDefaults(transaction), { purchaseDate: "2026-08-10", sourceType: "Dealer purchase", sourceName: "Dealer XYZ", sourceLocation: "Berlin", paymentMethod: "Bank transfer" });
  assert.deepEqual(validateStockRowDrafts(rows), []);
});

test("generated items continue to power current item-based Stock Cost", () => {
  const rows = [createStockRowDraft("row-1", { name: "A", allocatedPurchaseCost: "8" }), createStockRowDraft("row-2", { name: "B", allocatedPurchaseCost: "12" })];
  const result = prepare(rows);
  assert.equal(result.items.reduce((sum, item) => sum + number(item.purchasePrice), 0), 20);
});

test("existing item-first workflows and older backups remain unchanged", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const managerSource = readFileSync(new URL("../src/components/purchases/PurchaseInvoiceManager.jsx", import.meta.url), "utf8");
  assert.match(appSource, /function createQuickLedgerItem/);
  assert.match(appSource, /function addPurchaseAllocations/);
  assert.match(managerSource, /New Purchase With Items/);
  assert.match(managerSource, /Step 1 of 3/);
  assert.match(managerSource, /Step 2 of 3/);
  assert.match(managerSource, /Step 3 of 3/);
  const restored = normalizeRootAppData({ version: 2, items: [{ id: "legacy-item", purchasePrice: "5" }], expenses: [] });
  assert.equal(restored.items.length, 1);
  assert.deepEqual(restored.purchaseTransactions, []);
  assert.deepEqual(restored.purchaseAllocations, []);
});
