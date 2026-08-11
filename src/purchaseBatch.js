import {
  DEFAULT_CLASSIFICATION,
  emptyItem,
  normalizeItem,
  normalizePurchaseAllocation,
  normalizePurchaseTransaction,
  reconcilePurchaseTransaction,
  validatePurchaseAllocation,
  validatePurchaseTransaction,
} from "./resellitSchema.js";

export function createStockRowDraft(tempId, values = {}) {
  return {
    tempId: String(tempId),
    name: "",
    category: "",
    quantity: "1",
    invoiceLineAmount: "",
    allocatedPurchaseCost: "",
    classification: DEFAULT_CLASSIFICATION,
    notes: "",
    ...values,
  };
}

export function validateStockRowDrafts(rows = []) {
  const errors = [];
  if (!rows.length) errors.push("At least one stock item is required");
  const seenIds = new Set();
  rows.forEach((row, index) => {
    const label = `Stock row ${index + 1}`;
    if (!String(row.tempId || "")) errors.push(`${label}: temporary row ID is required`);
    else if (seenIds.has(String(row.tempId))) errors.push(`${label}: duplicate temporary row ID`);
    seenIds.add(String(row.tempId || ""));
    if (!String(row.name || "").trim()) errors.push(`${label}: Item Name is required`);
    if (row.allocatedPurchaseCost === undefined || row.allocatedPurchaseCost === null || String(row.allocatedPurchaseCost).trim() === "") errors.push(`${label}: Allocated Purchase Cost is required`);
  });
  return errors;
}

export function mapPurchaseTransactionToItemDefaults(transaction) {
  return {
    purchaseDate: transaction.purchaseDate,
    sourceType: transaction.sourceType || emptyItem.sourceType,
    sourceName: transaction.supplierName || transaction.sourcePlatform || "",
    sourceLocation: transaction.sourceLocation || "",
    paymentMethod: transaction.paymentMethod || emptyItem.paymentMethod,
  };
}

export function calculateDraftAllocationSummary(transactionDraft, stockRows = []) {
  const transaction = normalizePurchaseTransaction({ ...transactionDraft, id: "__draft_transaction__" });
  const allocations = stockRows.map((row, index) => normalizePurchaseAllocation({
    id: `__draft_allocation_${index}__`,
    purchaseTransactionId: transaction.id,
    itemId: `__draft_item_${index}__`,
    allocatedPurchaseCost: row.allocatedPurchaseCost,
  }));
  return reconcilePurchaseTransaction(transaction, allocations);
}

export function preparePurchaseWithItems({ transactionDraft, stockRows, requireBalanced = true, generateId, timestamp }) {
  const transactionForValidation = normalizePurchaseTransaction({ ...transactionDraft, id: "__validation__" });
  const errors = [
    ...validatePurchaseTransaction(transactionForValidation).filter((error) => error !== "id is required"),
    ...(!String(transactionDraft?.purchaseDate || "").trim() ? ["Purchase Date is required"] : []),
    ...(!String(transactionDraft?.currency || "").trim() ? ["Currency is required"] : []),
    ...(!transactionForValidation.grossTotal ? ["Gross Total is required"] : []),
    ...validateStockRowDrafts(stockRows),
  ];
  const reconciliation = calculateDraftAllocationSummary(transactionForValidation, stockRows);
  if (requireBalanced && !reconciliation.isBalanced) errors.push("Purchase must be balanced before creation");
  if (errors.length) return { ok: false, errors, transaction: null, items: [], allocations: [], reconciliation };
  if (typeof generateId !== "function") return { ok: false, errors: ["Stable ID generator is required"], transaction: null, items: [], allocations: [], reconciliation };

  const transactionId = generateId();
  const transaction = normalizePurchaseTransaction({ ...transactionDraft, id: transactionId, createdAt: timestamp, updatedAt: timestamp });
  const sourceDefaults = mapPurchaseTransactionToItemDefaults(transaction);
  const items = [];
  const allocations = [];

  stockRows.forEach((row) => {
    const itemId = generateId();
    const allocationId = generateId();
    const item = normalizeItem({
      ...emptyItem,
      id: itemId,
      name: String(row.name).trim(),
      category: String(row.category || ""),
      classification: row.classification || DEFAULT_CLASSIFICATION,
      status: "Draft",
      purchasePrice: String(row.allocatedPurchaseCost),
      notes: String(row.notes || ""),
      ...sourceDefaults,
    });
    const allocation = normalizePurchaseAllocation({
      id: allocationId,
      purchaseTransactionId: transactionId,
      itemId,
      description: item.name,
      quantity: String(row.quantity || "1"),
      invoiceLineAmount: String(row.invoiceLineAmount || ""),
      allocatedPurchaseCost: String(row.allocatedPurchaseCost),
      allocationMethod: "Manual",
      allocationNotes: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    items.push(item);
    allocations.push(allocation);
  });

  const generatedIds = [transaction.id, ...items.map((item) => item.id), ...allocations.map((allocation) => allocation.id)];
  if (new Set(generatedIds).size !== generatedIds.length) errors.push("Generated IDs must be unique");
  allocations.forEach((allocation) => errors.push(...validatePurchaseAllocation(allocation).map((error) => `${allocation.description}: ${error}`)));
  if (errors.length) return { ok: false, errors, transaction: null, items: [], allocations: [], reconciliation };
  return { ok: true, errors: [], transaction, items, allocations, reconciliation };
}
