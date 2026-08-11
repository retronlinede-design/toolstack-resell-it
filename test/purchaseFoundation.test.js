import assert from "node:assert/strict";
import test from "node:test";
import {
  CURRENT_DATE,
  PURCHASE_RECONCILIATION_TOLERANCE,
  emptyPurchaseAllocation,
  emptyPurchaseRecord,
  emptyPurchaseTransaction,
  isValidPurchaseAllocation,
  isValidPurchaseTransaction,
  normalizeEvidenceRecord,
  normalizePurchaseAllocation,
  normalizePurchaseRecord,
  normalizePurchaseTransaction,
  normalizeRootAppData,
  reconcilePurchaseTransaction,
  validatePurchaseAllocation,
  validatePurchaseIntegrity,
  validatePurchaseTransaction,
} from "../src/resellitSchema.js";
import { itemProfitValue } from "../src/resellitLogic.js";
import { STORAGE_KEY, STORAGE_LOAD_WARNING, loadInitialAppData } from "../src/resellitStorage.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  const writes = [];
  return {
    writes,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { writes.push([key, value]); values.set(key, value); },
  };
}

test("purchase transaction and allocation defaults are stable", () => {
  assert.deepEqual(Object.keys(emptyPurchaseTransaction), [
    "id", "transactionType", "purchaseDate", "invoiceDate", "invoiceNumber",
    "supplierName", "supplierAddressLine1", "supplierAddressLine2", "supplierPostalCode", "supplierCity", "supplierCountry",
    "sellerType", "sourceType", "sourcePlatform", "sourceLocation", "currency", "grossTotal",
    "subtotal", "taxAmount", "shippingAmount", "discountAmount", "paymentMethod", "receiptStatus",
    "evidenceIds", "notes", "createdAt", "updatedAt", "migratedFromLegacyItem",
  ]);
  assert.deepEqual(Object.keys(emptyPurchaseAllocation), [
    "id", "purchaseTransactionId", "itemId", "description", "quantity", "invoiceLineAmount",
    "allocatedPurchaseCost", "allocationMethod", "allocationNotes", "createdAt", "updatedAt",
  ]);
});

test("empty and older root data include empty purchase infrastructure collections", () => {
  assert.deepEqual(normalizeRootAppData({}).purchaseTransactions, []);
  assert.deepEqual(normalizeRootAppData({}).purchaseAllocations, []);
  const oldBackup = normalizeRootAppData({ version: 2, items: [], expenses: [], purchaseRecords: [], evidenceRecords: [] });
  assert.deepEqual(oldBackup.purchaseTransactions, []);
  assert.deepEqual(oldBackup.purchaseAllocations, []);
});

test("purchase transaction normalization preserves IDs, unknown fields, numeric strings, and unique evidence IDs", () => {
  const input = {
    id: 42,
    purchaseDate: "2026-08-01",
    currency: "eur",
    grossTotal: 400,
    evidenceIds: [" evidence-1 ", "evidence-1", "", null, "evidence-2"],
    futureField: "preserved",
  };
  const snapshot = structuredClone(input);
  const normalized = normalizePurchaseTransaction(input);
  assert.equal(normalized.id, "42");
  assert.equal(normalized.currency, "EUR");
  assert.equal(normalized.grossTotal, "400");
  assert.deepEqual(normalized.evidenceIds, ["evidence-1", "evidence-2"]);
  assert.equal(normalized.futureField, "preserved");
  assert.deepEqual(input, snapshot);
});

test("purchase allocation normalization preserves stable relationships without fabricating them", () => {
  const input = { id: 7, purchaseTransactionId: 8, itemId: 9, quantity: 2, allocatedPurchaseCost: 20, futureField: true };
  const snapshot = structuredClone(input);
  const normalized = normalizePurchaseAllocation(input);
  assert.equal(normalized.id, "7");
  assert.equal(normalized.purchaseTransactionId, "8");
  assert.equal(normalized.itemId, "9");
  assert.equal(normalized.quantity, "2");
  assert.equal(normalized.allocatedPurchaseCost, "20");
  assert.equal(normalized.futureField, true);
  assert.deepEqual(input, snapshot);
  assert.equal(normalizePurchaseAllocation({}).purchaseTransactionId, "");
});

test("purchase transaction validation requires only stable ID, purchase date, and currency", () => {
  assert.deepEqual(validatePurchaseTransaction({ id: "", purchaseDate: "", currency: "" }), ["id is required"]);
  assert.equal(isValidPurchaseTransaction({ id: "transaction-1", purchaseDate: CURRENT_DATE, currency: "EUR" }), true);
  assert.equal(isValidPurchaseTransaction({ id: "transaction-1", purchaseDate: CURRENT_DATE, currency: "EUR", invoiceNumber: "", supplierName: "", evidenceIds: [] }), true);
});

test("purchase allocation validation requires stable ID and complete allocation relationship", () => {
  assert.deepEqual(validatePurchaseAllocation({}), [
    "id is required",
    "purchaseTransactionId is required",
    "itemId is required",
    "allocatedPurchaseCost is required",
  ]);
  assert.equal(isValidPurchaseAllocation({ id: "allocation-1", purchaseTransactionId: "transaction-1", itemId: "item-1", allocatedPurchaseCost: "20" }), true);
});

test("purchase integrity reports duplicate IDs, missing references, duplicate item allocations, and evidence linkage", () => {
  const integrity = validatePurchaseIntegrity({
    purchaseTransactions: [
      { id: "transaction-1", evidenceIds: ["evidence-1", "missing-evidence"] },
      { id: "transaction-1" },
    ],
    purchaseAllocations: [
      { id: "allocation-1", purchaseTransactionId: "transaction-1", itemId: "item-1", allocatedPurchaseCost: "10" },
      { id: "allocation-1", purchaseTransactionId: "transaction-1", itemId: "item-1", allocatedPurchaseCost: "10" },
      { id: "allocation-3", purchaseTransactionId: "missing-transaction", itemId: "missing-item", allocatedPurchaseCost: "10" },
    ],
    items: [{ id: "item-1" }],
    evidenceRecords: [
      { id: "evidence-1", itemId: "item-1", purchaseTransactionId: "transaction-1" },
      { id: "evidence-2", itemId: "item-1", purchaseTransactionId: "missing-transaction" },
    ],
  });
  assert.deepEqual(integrity.duplicateTransactionIds, ["transaction-1"]);
  assert.deepEqual(integrity.duplicateAllocationIds, ["allocation-1"]);
  assert.deepEqual(integrity.allocationsMissingTransaction.map((record) => record.id), ["allocation-3"]);
  assert.deepEqual(integrity.allocationsMissingItem.map((record) => record.id), ["allocation-3"]);
  assert.deepEqual(integrity.transactionEvidenceMissing, [{ transactionId: "transaction-1", evidenceId: "missing-evidence" }]);
  assert.deepEqual(integrity.evidenceMissingTransaction.map((record) => record.id), ["evidence-2"]);
  assert.deepEqual(integrity.duplicateItemAllocations.map((record) => record.id), ["allocation-1"]);
});

test("purchase reconciliation handles balanced, under, over, and cent rounding cases without mutation", () => {
  const transaction = { id: "transaction-1", grossTotal: "400" };
  const balancedAllocations = [
    { id: "a-1", purchaseTransactionId: "transaction-1", itemId: "item-1", allocatedPurchaseCost: "365" },
    { id: "a-2", purchaseTransactionId: "transaction-1", itemId: "item-2", allocatedPurchaseCost: "35" },
  ];
  const snapshot = structuredClone({ transaction, balancedAllocations });
  assert.deepEqual(reconcilePurchaseTransaction(transaction, balancedAllocations), {
    grossTotal: 400, allocatedTotal: 400, difference: 0, allocationCount: 2, isBalanced: true,
  });
  assert.equal(reconcilePurchaseTransaction(transaction, [{ ...balancedAllocations[0], allocatedPurchaseCost: "300" }]).difference, 100);
  assert.equal(reconcilePurchaseTransaction(transaction, [{ ...balancedAllocations[0], allocatedPurchaseCost: "401" }]).difference, -1);
  const rounded = reconcilePurchaseTransaction(
    { id: "rounding", grossTotal: "0.30" },
    [
      { id: "r-1", purchaseTransactionId: "rounding", itemId: "item-1", allocatedPurchaseCost: "0.10" },
      { id: "r-2", purchaseTransactionId: "rounding", itemId: "item-2", allocatedPurchaseCost: "0.20" },
    ],
  );
  assert.equal(PURCHASE_RECONCILIATION_TOLERANCE, 0.005);
  assert.equal(rounded.isBalanced, true);
  assert.equal(rounded.difference, 0);
  assert.deepEqual({ transaction, balancedAllocations }, snapshot);
});

test("evidence transaction fields are optional and legacy evidence remains compatible", () => {
  const legacy = normalizeEvidenceRecord({ itemId: "item-1", evidenceType: "Invoice", evidenceStatus: "Available" });
  assert.equal(legacy.purchaseTransactionId, "");
  assert.equal(legacy.documentNumber, "");
  const linked = normalizeEvidenceRecord({ itemId: "item-1", purchaseTransactionId: 12, documentNumber: 142 });
  assert.equal(linked.purchaseTransactionId, "12");
  assert.equal(linked.documentNumber, "142");
});

test("existing purchase records and item calculations remain unchanged", () => {
  const legacyRecord = { itemId: "item-1", grossPurchasePrice: "12" };
  assert.deepEqual(normalizePurchaseRecord(legacyRecord), { ...emptyPurchaseRecord, itemId: "item-1", grossPurchasePrice: "12", allocatedPurchaseCost: "12" });
  assert.equal(itemProfitValue({ finalSalePrice: "100", purchasePrice: "20", shippingChargedToBuyer: "5", actualShippingCost: "10", packagingCost: "2", manualEbayFee: "5", ebayFeeMode: "Manual", refundAmount: "0", returnPostageCost: "0" }), 68);
});

test("malformed storage safety returns empty new collections without overwriting source data", () => {
  const malformed = "{bad json";
  const storage = memoryStorage({ [STORAGE_KEY]: malformed });
  const result = loadInitialAppData(storage);
  assert.deepEqual(result.data.purchaseTransactions, []);
  assert.deepEqual(result.data.purchaseAllocations, []);
  assert.equal(result.warning, STORAGE_LOAD_WARNING);
  assert.equal(storage.getItem(STORAGE_KEY), malformed);
  assert.deepEqual(storage.writes, []);
});
