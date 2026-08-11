import { number, reconcilePurchaseTransaction, validatePurchaseIntegrity } from "./resellitSchema.js";

function populated(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function itemAuthoritativePurchaseTotal(items = []) {
  return items.reduce((sum, item) => sum + number(item?.purchasePrice), 0);
}

export function auditPurchaseCostAlignment({ items = [], purchaseAllocations = [], purchaseTransactions = [] } = {}) {
  const itemById = new Map(items.map((item) => [String(item?.id || ""), item]));
  const transactionById = new Map(purchaseTransactions.map((transaction) => [String(transaction?.id || ""), transaction]));
  return purchaseAllocations.map((allocation) => {
    const item = itemById.get(String(allocation?.itemId || ""));
    const transaction = transactionById.get(String(allocation?.purchaseTransactionId || ""));
    const hasItemCost = populated(item?.purchasePrice);
    const hasAllocationCost = populated(allocation?.allocatedPurchaseCost);
    let status = "Aligned";
    if (!item) status = "Missing item";
    else if (!hasItemCost) status = "Missing item cost";
    else if (!hasAllocationCost) status = "Missing allocation cost";
    else if (number(item.purchasePrice) !== number(allocation.allocatedPurchaseCost)) status = "Conflict";
    return {
      allocationId: String(allocation?.id || ""), itemId: String(allocation?.itemId || ""),
      itemName: item?.name || "Missing item", itemPurchaseCost: item?.purchasePrice ?? "",
      allocatedPurchaseCost: allocation?.allocatedPurchaseCost ?? "",
      purchaseTransactionId: String(allocation?.purchaseTransactionId || ""),
      purchaseLabel: transaction?.invoiceNumber || transaction?.supplierName || transaction?.purchaseDate || "Missing purchase",
      status,
    };
  });
}

export function auditPurchaseEvidenceReadiness(purchaseTransactions = [], evidenceRecords = []) {
  const evidenceIds = new Set(evidenceRecords.map((record) => String(record?.id || "")).filter(Boolean));
  const transactionIdsWithEvidence = new Set(evidenceRecords.map((record) => String(record?.purchaseTransactionId || "")).filter(Boolean));
  return purchaseTransactions.map((transaction) => {
    const linkedById = (Array.isArray(transaction?.evidenceIds) ? transaction.evidenceIds : []).some((id) => evidenceIds.has(String(id)));
    const present = linkedById || transactionIdsWithEvidence.has(String(transaction?.id || ""));
    return { transactionId: String(transaction?.id || ""), status: present ? "Document Present" : "Missing Document", documentPresent: present };
  });
}

export function buildPurchaseFinanceDiagnostics({ purchaseTransactions = [], purchaseAllocations = [], items = [], evidenceRecords = [] } = {}) {
  const reconciliations = purchaseTransactions.map((transaction) => {
    const result = reconcilePurchaseTransaction(transaction, purchaseAllocations);
    return { transaction, ...result, status: result.isBalanced ? "Balanced" : result.difference > 0 ? "Under-allocated" : "Over-allocated" };
  });
  const integrity = validatePurchaseIntegrity({ purchaseTransactions, purchaseAllocations, items, evidenceRecords });
  const integrityIssueCount = Object.values(integrity).reduce((sum, issues) => sum + issues.length, 0);
  const costAlignment = auditPurchaseCostAlignment({ items, purchaseAllocations, purchaseTransactions });
  const evidenceReadiness = auditPurchaseEvidenceReadiness(purchaseTransactions, evidenceRecords);
  return {
    reconciliations, integrity, integrityIssueCount, costAlignment, evidenceReadiness,
    counts: {
      total: purchaseTransactions.length,
      balanced: reconciliations.filter((entry) => entry.status === "Balanced").length,
      underAllocated: reconciliations.filter((entry) => entry.status === "Under-allocated").length,
      overAllocated: reconciliations.filter((entry) => entry.status === "Over-allocated").length,
      costConflicts: costAlignment.filter((entry) => entry.status !== "Aligned").length,
      missingDocuments: evidenceReadiness.filter((entry) => !entry.documentPresent).length,
    },
  };
}
