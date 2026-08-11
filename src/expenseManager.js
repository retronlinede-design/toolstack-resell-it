import { inMonth, normalizeEvidenceRecord, normalizeExpense, number, validateEvidenceRecord } from "./resellitSchema.js";

function populated(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function filterExpenses(expenses = [], { month = "", category = "All categories", businessClassification = "All classifications", proofStatus = "All proof statuses" } = {}) {
  return expenses.filter((expense) => {
    if (month && !inMonth(expense.date, month)) return false;
    if (category !== "All categories" && expense.category !== category) return false;
    if (businessClassification !== "All classifications" && expense.businessClassification !== businessClassification) return false;
    if (proofStatus === "Proof recorded" && !(expense.receiptAvailable === "Yes" || expense.documentNumber || expense.evidenceIds?.length)) return false;
    if (proofStatus === "Missing proof" && (expense.receiptAvailable === "Yes" || expense.documentNumber || expense.evidenceIds?.length)) return false;
    return true;
  });
}

export function expenseTotal(expenses = []) {
  return expenses.reduce((sum, expense) => sum + number(expense.amount), 0);
}

export function auditExpenseIssues(expenses = [], evidenceRecords = []) {
  const evidenceIds = new Set(evidenceRecords.map((record) => String(record?.id || "")).filter(Boolean));
  return expenses.map((source) => {
    const expense = normalizeExpense(source);
    const linkedEvidenceMissing = expense.evidenceIds.filter((id) => !evidenceIds.has(id));
    const issues = [];
    if (!expense.description.trim()) issues.push("missing_description");
    if (!populated(expense.amount)) issues.push("missing_amount");
    if (!expense.businessClassification || expense.businessClassification === "review") issues.push("classification_review");
    if (expense.receiptAvailable === "Yes" && !expense.documentNumber && !expense.evidenceIds.length && !expense.receiptNotes.trim() && !expense.notes.trim()) issues.push("receipt_without_reference");
    if (linkedEvidenceMissing.length) issues.push("linked_evidence_missing");
    if (expense.businessClassification === "business" && !expense.vendorName.trim()) issues.push("business_vendor_missing");
    return { expenseId: expense.id, issues, linkedEvidenceMissing };
  });
}

export function createExpenseEvidenceRecord(values, expenseId, id, timestamp) {
  const record = normalizeEvidenceRecord({
    ...values,
    id,
    itemId: "",
    purchaseTransactionId: "",
    expenseId,
    storageType: values.externalUrl ? "external_url" : values.externalPath ? "external_path" : "metadata_only",
    evidenceStatus: values.externalUrl || values.externalPath ? "External reference" : "Available",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return { record, errors: validateEvidenceRecord(record) };
}

export function updateExpenseEvidenceRecord(current, values, timestamp) {
  const record = normalizeEvidenceRecord({
    ...current,
    ...values,
    id: current.id,
    expenseId: current.expenseId,
    storageType: values.externalUrl ? "external_url" : values.externalPath ? "external_path" : "metadata_only",
    evidenceStatus: values.externalUrl || values.externalPath ? "External reference" : "Available",
    createdAt: current.createdAt,
    updatedAt: timestamp,
  });
  return { record, errors: validateEvidenceRecord(record) };
}
