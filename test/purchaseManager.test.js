import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createPurchaseAllocationRecord,
  createPurchaseTransactionRecord,
  createTransactionEvidenceRecord,
  deletePurchaseTransactionData,
  purchaseReconciliationStatus,
  removePurchaseAllocation,
  updatePurchaseAllocationRecord,
  updatePurchaseTransactionRecord,
} from "../src/purchaseManager.js";
import { isValidEvidenceRecord, normalizeRootAppData } from "../src/resellitSchema.js";
import { itemProfitValue } from "../src/resellitLogic.js";

const timestamp = "2026-08-11T10:00:00.000Z";

test("Purchase Manager creates and edits normalized transactions with stable IDs", () => {
  const created = createPurchaseTransactionRecord({ purchaseDate: "2026-08-01", currency: "eur", grossTotal: "100", supplierName: "Dealer" }, "transaction-1", timestamp);
  assert.deepEqual(created.errors, []);
  assert.equal(created.record.id, "transaction-1");
  assert.equal(created.record.currency, "EUR");
  const edited = updatePurchaseTransactionRecord(created.record, { supplierName: "Dealer XYZ", grossTotal: "120" }, "2026-08-11T11:00:00.000Z");
  assert.deepEqual(edited.errors, []);
  assert.equal(edited.record.id, "transaction-1");
  assert.equal(edited.record.createdAt, timestamp);
  assert.equal(edited.record.supplierName, "Dealer XYZ");
  assert.equal(edited.record.grossTotal, "120");
});

test("deleting a transaction removes allocations but preserves items and evidence", () => {
  const items = [{ id: "item-1", purchasePrice: "20" }];
  const evidenceRecords = [{ id: "evidence-1", purchaseTransactionId: "transaction-1" }];
  const result = deletePurchaseTransactionData("transaction-1", {
    transactions: [{ id: "transaction-1" }, { id: "transaction-2" }],
    allocations: [{ id: "allocation-1", purchaseTransactionId: "transaction-1", itemId: "item-1" }, { id: "allocation-2", purchaseTransactionId: "transaction-2", itemId: "item-1" }],
    items,
    evidenceRecords,
  });
  assert.deepEqual(result.transactions.map((record) => record.id), ["transaction-2"]);
  assert.deepEqual(result.allocations.map((record) => record.id), ["allocation-2"]);
  assert.equal(result.items, items);
  assert.equal(result.evidenceRecords, evidenceRecords);
});

test("linking stock defaults allocation from item purchasePrice without changing the item", () => {
  const item = { id: "item-1", name: "Camera", purchasePrice: "35" };
  const snapshot = structuredClone(item);
  const result = createPurchaseAllocationRecord("transaction-1", item, "allocation-1", timestamp);
  assert.deepEqual(result.errors, []);
  assert.equal(result.record.invoiceLineAmount, "35");
  assert.equal(result.record.allocatedPurchaseCost, "35");
  assert.equal(result.record.allocationMethod, "Existing Item Cost");
  assert.deepEqual(item, snapshot);
});

test("allocation editing and unlinking do not mutate inventory", () => {
  const allocation = createPurchaseAllocationRecord("transaction-1", { id: "item-1", name: "Camera", purchasePrice: "35" }, "allocation-1", timestamp).record;
  const updated = updatePurchaseAllocationRecord(allocation, { allocatedPurchaseCost: "40", quantity: "2", allocationNotes: "Two units" }, "2026-08-11T11:00:00.000Z");
  assert.deepEqual(updated.errors, []);
  assert.equal(updated.record.allocatedPurchaseCost, "40");
  assert.deepEqual(removePurchaseAllocation("allocation-1", [allocation]), []);
});

test("Purchase Manager reconciliation exposes balanced, under, and over allocation status", () => {
  const transaction = { id: "transaction-1", grossTotal: "100" };
  const allocation = (cost) => [{ id: "allocation-1", purchaseTransactionId: "transaction-1", itemId: "item-1", allocatedPurchaseCost: cost }];
  assert.equal(purchaseReconciliationStatus(transaction, allocation("100")).status, "Balanced");
  assert.equal(purchaseReconciliationStatus(transaction, allocation("90")).status, "Under-allocated");
  assert.equal(purchaseReconciliationStatus(transaction, allocation("110")).status, "Over-allocated");
});

test("metadata evidence links to a transaction and remains valid without itemId", () => {
  const result = createTransactionEvidenceRecord({ evidenceType: "Invoice", documentNumber: "INV-142", documentDate: "2026-08-01", issuer: "Dealer", amount: "100", fileName: "invoice.pdf", externalPath: "Invoices/2026" }, "transaction-1", "evidence-1", timestamp);
  assert.deepEqual(result.errors, []);
  assert.equal(result.record.purchaseTransactionId, "transaction-1");
  assert.equal(result.record.itemId, "");
  assert.equal(result.record.documentNumber, "INV-142");
  assert.equal(result.record.storageType, "external_path");
  assert.equal(isValidEvidenceRecord(result.record), true);
  assert.equal(isValidEvidenceRecord({ itemId: "item-1" }), true);
});

test("older backups remain valid and no transactions are created automatically", () => {
  const data = normalizeRootAppData({ version: 2, items: [{ id: "item-1", purchasePrice: "20" }], expenses: [], purchaseRecords: [{ itemId: "item-1", grossPurchasePrice: "20" }] });
  assert.deepEqual(data.purchaseTransactions, []);
  assert.deepEqual(data.purchaseAllocations, []);
  assert.equal(data.purchaseRecords.length, 1);
});

test("item purchase calculations remain authoritative after allocation operations", () => {
  const item = { id: "item-1", finalSalePrice: "100", purchasePrice: "20", ebayFeeMode: "Manual", manualEbayFee: "5" };
  const before = itemProfitValue(item);
  createPurchaseAllocationRecord("transaction-1", item, "allocation-1", timestamp);
  assert.equal(itemProfitValue(item), before);
  assert.equal(item.purchasePrice, "20");
});

test("Stock Control exposes the Purchase Manager and its required empty states", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const tableSource = readFileSync(new URL("../src/components/inventory/InventoryTable.jsx", import.meta.url), "utf8");
  const managerSource = readFileSync(new URL("../src/components/purchases/PurchaseInvoiceManager.jsx", import.meta.url), "utf8");
  assert.match(tableSource, /Purchases & Invoices/);
  assert.match(appSource, /<PurchaseInvoiceManager/);
  assert.match(managerSource, /No purchase records yet\./);
  assert.match(managerSource, /No stock items linked to this purchase yet\./);
  assert.match(managerSource, /No documents linked yet\./);
  assert.match(managerSource, /window\.confirm/);
});
