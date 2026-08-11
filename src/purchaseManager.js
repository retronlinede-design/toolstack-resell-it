import {
  normalizeEvidenceRecord,
  normalizePurchaseAllocation,
  normalizePurchaseTransaction,
  reconcilePurchaseTransaction,
  validateEvidenceRecord,
  validatePurchaseAllocation,
  validatePurchaseTransaction,
} from "./resellitSchema.js";

export function purchaseReconciliationStatus(transaction, allocations) {
  const reconciliation = reconcilePurchaseTransaction(transaction, allocations);
  if (reconciliation.isBalanced) return { ...reconciliation, status: "Balanced" };
  return { ...reconciliation, status: reconciliation.difference > 0 ? "Under-allocated" : "Over-allocated" };
}

export function createPurchaseTransactionRecord(values, id, timestamp) {
  const record = normalizePurchaseTransaction({ ...values, id, createdAt: timestamp, updatedAt: timestamp });
  return { record, errors: [...validatePurchaseTransaction(record), ...(!record.grossTotal ? ["grossTotal is required"] : [])] };
}

export function updatePurchaseTransactionRecord(current, values, timestamp) {
  const record = normalizePurchaseTransaction({ ...current, ...values, id: current.id, createdAt: current.createdAt, updatedAt: timestamp });
  return { record, errors: [...validatePurchaseTransaction(record), ...(!record.grossTotal ? ["grossTotal is required"] : [])] };
}

export function deletePurchaseTransactionData(transactionId, { transactions, allocations, items, evidenceRecords }) {
  return {
    transactions: transactions.filter((record) => record.id !== transactionId),
    allocations: allocations.filter((record) => record.purchaseTransactionId !== transactionId),
    items,
    evidenceRecords,
  };
}

export function createPurchaseAllocationRecord(transactionId, item, id, timestamp) {
  const record = normalizePurchaseAllocation({
    id,
    purchaseTransactionId: transactionId,
    itemId: item.id,
    description: item.name || "",
    quantity: "1",
    invoiceLineAmount: item.purchasePrice || "",
    allocatedPurchaseCost: item.purchasePrice || "",
    allocationMethod: item.purchasePrice ? "Existing Item Cost" : "Manual",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return { record, errors: validatePurchaseAllocation(record) };
}

export function updatePurchaseAllocationRecord(current, values, timestamp) {
  const record = normalizePurchaseAllocation({ ...current, ...values, id: current.id, purchaseTransactionId: current.purchaseTransactionId, itemId: current.itemId, createdAt: current.createdAt, updatedAt: timestamp });
  return { record, errors: validatePurchaseAllocation(record) };
}

export function removePurchaseAllocation(allocationId, allocations) {
  return allocations.filter((record) => record.id !== allocationId);
}

export function createTransactionEvidenceRecord(values, purchaseTransactionId, id, timestamp) {
  const record = normalizeEvidenceRecord({
    ...values,
    id,
    itemId: "",
    purchaseTransactionId,
    storageType: values.externalUrl ? "external_url" : values.externalPath ? "external_path" : "metadata_only",
    evidenceStatus: values.externalUrl || values.externalPath ? "External reference" : "Available",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return { record, errors: validateEvidenceRecord(record) };
}

export function updateTransactionEvidenceRecord(current, values, timestamp) {
  const record = normalizeEvidenceRecord({
    ...current,
    ...values,
    id: current.id,
    purchaseTransactionId: current.purchaseTransactionId,
    storageType: values.externalUrl ? "external_url" : values.externalPath ? "external_path" : "metadata_only",
    evidenceStatus: values.externalUrl || values.externalPath ? "External reference" : "Available",
    createdAt: current.createdAt,
    updatedAt: timestamp,
  });
  return { record, errors: validateEvidenceRecord(record) };
}
