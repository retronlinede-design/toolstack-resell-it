import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ebaySalePostingReview, isEbaySalePostingEligible, normalizeEbayImportRecord, prepareEbaySalePosting } from "../src/ebayImport.js";
import { itemProfitValue } from "../src/resellitLogic.js";

function record(overrides = {}) {
  return normalizeEbayImportRecord({ id: "record-1", matchStatus: "confirmed", resolutionStatus: "resolved", matchedItemId: "item-1", duplicateStatus: "unique", saleDate: "2026-08-10", saleAmount: "50", ...overrides });
}

test("only confirmed, matched, non-duplicate records with sale data are eligible", () => {
  const item = { id: "item-1", status: "Draft" };
  assert.equal(isEbaySalePostingEligible(record(), item), true);
  assert.equal(isEbaySalePostingEligible(record({ matchStatus: "suggested" }), item), false);
  assert.equal(isEbaySalePostingEligible(record({ duplicateStatus: "duplicate" }), item), false);
  assert.equal(isEbaySalePostingEligible(record({ duplicateStatus: "possible_duplicate" }), item), false);
  assert.equal(isEbaySalePostingEligible(record({ saleDate: "", saleAmount: "" }), item), false);
});

test("missing current values default selected while aligned and conflicting values do not", () => {
  const missing = ebaySalePostingReview(record(), { id: "item-1", saleDate: "", finalSalePrice: "" });
  assert.deepEqual(missing.map((entry) => [entry.status, entry.defaultSelected]), [["Missing in ResellIt", true], ["Missing in ResellIt", true]]);
  const aligned = ebaySalePostingReview(record(), { id: "item-1", saleDate: "2026-08-10", finalSalePrice: "50.00" });
  assert.deepEqual(aligned.map((entry) => [entry.status, entry.defaultSelected, entry.disabled]), [["Aligned", false, true], ["Aligned", false, true]]);
  const conflicts = ebaySalePostingReview(record(), { id: "item-1", saleDate: "2026-08-09", finalSalePrice: "49" });
  assert.deepEqual(conflicts.map((entry) => [entry.status, entry.defaultSelected]), [["Different", false], ["Different", false]]);
});

test("explicit conflict overwrite prepares only selected canonical fields and preview output", () => {
  const item = { id: "item-1", status: "Sold", saleDate: "2026-08-09", finalSalePrice: "49", salePrice: "legacy", manualEbayFee: "5", shippingChargedToBuyer: "3", refundAmount: "2" };
  const source = record(); const beforeItem = structuredClone(item); const beforeRecord = structuredClone(source);
  const result = prepareEbaySalePosting(source, item, { saleDate: false, finalSalePrice: true });
  assert.deepEqual(result.proposedItemPatch, { finalSalePrice: "50" });
  assert.deepEqual(result.changedFields, ["finalSalePrice"]);
  assert.deepEqual(result.unchangedFields, ["saleDate"]);
  assert.deepEqual(result.conflicts, ["saleDate", "finalSalePrice"]);
  assert.equal(result.proposedItemPatch.salePrice, undefined);
  assert.deepEqual(item, beforeItem); assert.deepEqual(source, beforeRecord);
});

test("lifecycle changes are bounded to explicit Draft or Listed to Sold", () => {
  for (const status of ["Draft", "Listed"]) assert.equal(prepareEbaySalePosting(record(), { id: "item-1", status }, { saleDate: true }, { markSold: true }).proposedItemPatch.status, "Sold");
  for (const status of ["Complete", "Returned", "Sold"]) assert.equal(prepareEbaySalePosting(record(), { id: "item-1", status }, { saleDate: true }, { markSold: true }).proposedItemPatch.status, undefined);
});

test("posting metadata normalizes safely and protects canonical posted field names", () => {
  const normalized = normalizeEbayImportRecord({ postingStatus: "posted", postedAt: "now", postedItemId: "item-1", postedFields: ["saleDate", "finalSalePrice", "salePrice", "saleDate"] });
  assert.equal(normalized.postingStatus, "posted"); assert.equal(normalized.postedAt, "now"); assert.equal(normalized.postedItemId, "item-1");
  assert.deepEqual(normalized.postedFields, ["saleDate", "finalSalePrice"]);
});

test("re-post requires review and cannot silently reapply aligned fields", () => {
  const posted = record({ postingStatus: "posted", postedFields: ["saleDate", "finalSalePrice"] });
  const item = { id: "item-1", status: "Complete", saleDate: "2026-08-10", finalSalePrice: "50" };
  assert.equal(isEbaySalePostingEligible(posted, item), true);
  const result = prepareEbaySalePosting(posted, item, {});
  assert.deepEqual(result.proposedItemPatch, {}); assert.ok(result.validationErrors.includes("Select at least one change"));
});

test("posting UI persists immutable item patches and leaves fees, shipping, refunds, and payouts untouched", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /prepareEbaySalePosting\(record, item/);
  assert.match(source, /nextItems = items\.map\(\(entry\) => entry\.id === item\.id \? \{ \.\.\.entry, \.\.\.prepared\.proposedItemPatch \} : entry\)/);
  assert.match(source, /postingStatus,[\s\S]*postedAt:[\s\S]*postedItemId:[\s\S]*postedFields:/);
  assert.doesNotMatch(source, /proposedItemPatch\.(manualEbayFee|shippingChargedToBuyer|actualShippingCost|refundAmount|payoutAmount)/);
});

test("existing Finance formula remains unchanged and newly Sold status remains Sales Hub compatible", () => {
  assert.equal(itemProfitValue({ finalSalePrice: "50", purchasePrice: "10", manualEbayFee: "5", ebayFeeMode: "Manual" }), 35);
  const result = prepareEbaySalePosting(record(), { id: "item-1", status: "Draft", saleDate: "", finalSalePrice: "" }, { saleDate: true, finalSalePrice: true }, { markSold: true });
  const updated = { id: "item-1", status: "Draft", ...result.proposedItemPatch };
  assert.equal(updated.status, "Sold"); assert.equal(updated.finalSalePrice, "50");
});
