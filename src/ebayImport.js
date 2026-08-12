import { actualShippingValue, finalSaleValue, itemStatusValue, platformFees, refundValue, shippingChargedValue } from "./resellitLogic.js";
import { number } from "./resellitSchema.js";

export const ebayImportTargetFields = ["transactionType", "orderId", "transactionId", "itemIdCandidate", "sku", "itemTitle", "orderDate", "saleDate", "payoutDate", "refundDate", "saleAmount", "buyerShipping", "platformFee", "promotedFee", "otherFee", "shippingLabelCost", "refundAmount", "payoutAmount", "currency", "buyerName", "country"];
export const emptyNormalizedEbayRecord = {
  id: "", batchId: "", sourceRowIndex: 0, sourceFileName: "", importedAt: "",
  transactionType: "", orderId: "", transactionId: "", itemIdCandidate: "", sku: "", itemTitle: "",
  orderDate: "", saleDate: "", payoutDate: "", refundDate: "",
  saleAmount: "", buyerShipping: "", platformFee: "", promotedFee: "", otherFee: "", shippingLabelCost: "", refundAmount: "", payoutAmount: "",
  currency: "EUR", buyerName: "", country: "", rawRow: {}, mappingStatus: "needs_review", matchStatus: "unmatched", resolutionStatus: "open",
  matchedItemId: "", matchedSaleFieldConfidence: 0, candidateMatches: [], duplicateKey: "", duplicateStatus: "unique", notes: "",
};
export const emptyEbayMappingProfile = { id: "", name: "", sourceHeaders: [], mappings: {}, createdAt: "", updatedAt: "" };

const aliases = {
  transactionType: ["type", "transaction type", "transaction event"], orderId: ["order id", "order number"], transactionId: ["transaction id", "transaction number"],
  itemIdCandidate: ["item id", "ebay item id"], sku: ["sku", "custom label"], itemTitle: ["item title", "title", "listing title"],
  orderDate: ["order date"], saleDate: ["sale date", "transaction date", "date"], payoutDate: ["payout date"], refundDate: ["refund date"],
  saleAmount: ["sale amount", "item subtotal", "item price", "sold for"], buyerShipping: ["shipping charged", "postage and packaging", "shipping"],
  platformFee: ["final value fee", "ebay fee", "fees"], promotedFee: ["promoted listing fee", "promoted fee"], otherFee: ["other fee"],
  shippingLabelCost: ["shipping label cost", "postage cost"], refundAmount: ["refund amount", "refund"], payoutAmount: ["payout amount", "net amount", "payout"],
  currency: ["currency"], buyerName: ["buyer name", "buyer username"], country: ["country", "buyer country"],
};

export function detectCsvDelimiter(text) {
  const sample = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).slice(0, 8).join("\n");
  const counts = [[",", 0], [";", 0], ["\t", 0]];
  let quoted = false;
  for (const char of sample) {
    if (char === '"') quoted = !quoted;
    if (!quoted) counts.forEach((entry) => { if (char === entry[0]) entry[1] += 1; });
  }
  return counts.sort((a, b) => b[1] - a[1])[0][1] ? counts[0][0] : ",";
}

export function normalizeCsvHeaders(headers = []) {
  const seen = new Map();
  return headers.map((header, index) => {
    const base = String(header || "").trim() || `Column ${index + 1}`;
    const count = (seen.get(base.toLowerCase()) || 0) + 1;
    seen.set(base.toLowerCase(), count);
    return count === 1 ? base : `${base} (${count})`;
  });
}

export function parseEbayCsv(text, delimiter = detectCsvDelimiter(text)) {
  const source = String(text || "").replace(/^\uFEFF/, "");
  const matrix = []; let row = []; let cell = ""; let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]; const next = source[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") index += 1; row.push(cell.trim()); if (row.some(Boolean)) matrix.push(row); row = []; cell = ""; }
    else cell += char;
  }
  row.push(cell.trim()); if (row.some(Boolean)) matrix.push(row);
  if (!matrix.length) return { delimiter, columns: [], rows: [] };
  const columns = normalizeCsvHeaders(matrix[0]);
  const rows = matrix.slice(1).filter((cells) => cells.some((value) => String(value).trim())).map((cells) => Object.fromEntries(columns.map((column, index) => [column, cells[index] || ""])));
  return { delimiter, columns, rows };
}

function normalizedHeader(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
export function suggestEbayMappings(columns = []) {
  const mappings = {}; const confidence = {};
  for (const target of ebayImportTargetFields) {
    const names = aliases[target] || [];
    const exact = columns.find((column) => names.includes(normalizedHeader(column)));
    const partial = exact || columns.find((column) => names.some((name) => normalizedHeader(column).includes(name)));
    if (partial) { mappings[target] = partial; confidence[target] = exact ? 1 : 0.7; }
  }
  return { mappings, confidence };
}

function stableHash(value) { let hash = 2166136261; for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(36); }
export function generateEbayDuplicateKey(record) {
  if (record.transactionId) return `transaction:${String(record.transactionId).trim().toLowerCase()}`;
  if (record.orderId) return `order:${[record.orderId, record.transactionType, record.saleAmount || record.refundAmount || record.payoutAmount, record.saleDate || record.orderDate || record.refundDate || record.payoutDate].map((v) => String(v || "").trim().toLowerCase()).join("|")}`;
  return `fallback:${stableHash([record.transactionType, record.itemTitle, record.sku, record.saleDate || record.orderDate || record.refundDate || record.payoutDate, record.saleAmount, record.refundAmount, record.payoutAmount, record.currency].map((v) => String(v || "").trim().toLowerCase()).join("|"))}`;
}

export function normalizeEbayImportRecord(record = {}) {
  const next = { ...emptyNormalizedEbayRecord, ...record };
  for (const key of Object.keys(emptyNormalizedEbayRecord)) if (["rawRow", "candidateMatches", "sourceRowIndex", "matchedSaleFieldConfidence"].includes(key)) continue; else next[key] = String(next[key] ?? emptyNormalizedEbayRecord[key]);
  next.sourceRowIndex = Number(next.sourceRowIndex) || 0; next.matchedSaleFieldConfidence = Number(next.matchedSaleFieldConfidence) || 0;
  next.rawRow = next.rawRow && typeof next.rawRow === "object" ? { ...next.rawRow } : {}; next.candidateMatches = Array.isArray(next.candidateMatches) ? next.candidateMatches.map((candidate) => ({ ...candidate })) : [];
  next.currency = String(next.currency || "EUR").toUpperCase(); next.duplicateKey = next.duplicateKey || generateEbayDuplicateKey(next);
  return next;
}
export function normalizeEbayImportRecords(records) { return Array.isArray(records) ? records.map(normalizeEbayImportRecord) : []; }
export function normalizeEbayMappingProfiles(profiles) { return Array.isArray(profiles) ? profiles.map((profile) => ({ ...emptyEbayMappingProfile, ...profile, id: String(profile?.id || ""), name: String(profile?.name || ""), sourceHeaders: Array.isArray(profile?.sourceHeaders) ? profile.sourceHeaders.map(String) : [], mappings: profile?.mappings && typeof profile.mappings === "object" ? { ...profile.mappings } : {} })) : []; }

export function mapEbayRows({ rows = [], mappings = {}, batchId = "", sourceFileName = "", importedAt = "", idFactory = (index) => `${batchId}-${index}` } = {}) {
  return rows.map((rawRow, index) => {
    const values = Object.fromEntries(ebayImportTargetFields.map((target) => [target, mappings[target] ? rawRow[mappings[target]] || "" : ""]));
    const amountPresent = [values.saleAmount, values.refundAmount, values.payoutAmount, values.platformFee].some((value) => String(value).trim());
    const identityPresent = values.itemTitle || values.orderId || values.transactionId;
    const datePresent = values.saleDate || values.orderDate || values.refundDate || values.payoutDate;
    return normalizeEbayImportRecord({ ...values, id: idFactory(index), batchId, sourceRowIndex: index + 1, sourceFileName, importedAt, rawRow, mappingStatus: datePresent && identityPresent && amountPresent ? "mapped" : "needs_review" });
  });
}
export function validateNormalizedEbayRecord(record) { const next = normalizeEbayImportRecord(record); return next.mappingStatus === "mapped" ? [] : ["Record needs mapping review"]; }

function normalizedText(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function dateDistance(a, b) { if (!a || !b) return Infinity; return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000; }
export function scoreEbayItemMatches(record, items = []) {
  const title = normalizedText(record.itemTitle); const sku = normalizedText(record.sku); const amount = number(record.saleAmount); const date = record.saleDate || record.orderDate;
  return items.map((item) => { let score = 0; const reasons = []; const titles = [item.name, item.ebayTitle, item.listingTitle].map(normalizedText).filter(Boolean);
    if (sku && [item.sku, item.customLabel, item.ebayItemId].map(normalizedText).includes(sku)) { score += 55; reasons.push("SKU or eBay identifier match"); }
    if (title && titles.includes(title)) { score += 45; reasons.push("Exact title match"); } else if (title && titles.some((value) => value.includes(title) || title.includes(value))) { score += 25; reasons.push("Similar title"); }
    if (amount && Math.abs(finalSaleValue(item) - amount) < 0.01) { score += 20; reasons.push("Sale amount match"); } else if (amount && Math.abs(finalSaleValue(item) - amount) <= 2) { score += 10; reasons.push("Sale amount close"); }
    const days = dateDistance(date, item.saleDate); if (days === 0) { score += 15; reasons.push("Sale date match"); } else if (days <= 3) { score += 8; reasons.push("Sale date close"); }
    if (["Sold", "Complete", "Returned"].includes(itemStatusValue(item))) { score += 5; reasons.push("Sale lifecycle"); }
    if ((item.buyerPlatform || "ebay") === "ebay") score += 3;
    if (record.transactionId && [item.ebayTransactionId, item.transactionId].includes(record.transactionId)) { score += 60; reasons.push("Transaction reference match"); }
    return { itemId: item.id, score: Math.min(score, 100), reasons }; }).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score);
}
export function addMatchSuggestions(records = [], items = []) { return records.map((record) => { const candidates = scoreEbayItemMatches(record, items); const conflict = candidates.length > 1 && candidates[0].score === candidates[1].score; return normalizeEbayImportRecord({ ...record, candidateMatches: candidates.slice(0, 5), matchStatus: conflict ? "conflict" : candidates.length ? "suggested" : "unmatched", matchedSaleFieldConfidence: candidates[0]?.score || 0 }); }); }
export function markEbayDuplicates(records = [], existing = []) { const counts = new Map(); [...existing, ...records].forEach((record) => counts.set(record.duplicateKey || generateEbayDuplicateKey(record), (counts.get(record.duplicateKey || generateEbayDuplicateKey(record)) || 0) + 1)); const existingKeys = new Set(existing.map((record) => record.duplicateKey || generateEbayDuplicateKey(record))); return records.map((record) => ({ ...record, duplicateStatus: counts.get(record.duplicateKey) > 1 ? (existingKeys.has(record.duplicateKey) ? "duplicate" : "possible_duplicate") : "unique" })); }

export function compareEbayRecordToItem(record, item) {
  const comparisons = [
    ["Sale Amount", record.saleAmount, finalSaleValue(item)], ["Sale Date", record.saleDate || record.orderDate, item?.saleDate || ""],
    ["Platform Fees", number(record.platformFee) + number(record.promotedFee) + number(record.otherFee), platformFees(item)],
    ["Buyer Shipping", record.buyerShipping, shippingChargedValue(item)], ["Shipping Cost", record.shippingLabelCost, actualShippingValue(item)],
    ["Refund", record.refundAmount, refundValue(item)], ["Status", record.transactionType, itemStatusValue(item)],
  ];
  return comparisons.map(([field, imported, current]) => ({ field, imported, current, status: !String(current ?? "").trim() ? "Missing in ResellIt" : number(imported) && number(current) ? (number(imported) === number(current) ? "Aligned" : "Different") : normalizedText(imported) === normalizedText(current) ? "Aligned" : "Different" }));
}
