import assert from "node:assert/strict";
import test from "node:test";
import { ebayCostPostingReview, isEbayCostPostingEligible, normalizeEbayImportRecord, prepareEbayCostPosting } from "../src/ebayImport.js";
import { itemProfitValue } from "../src/resellitLogic.js";

function record(overrides = {}) { return normalizeEbayImportRecord({ id: "r", matchStatus: "confirmed", resolutionStatus: "resolved", matchedItemId: "i", duplicateStatus: "unique", platformFee: "5", promotedFee: "2", otherFee: "1", buyerShipping: "6", shippingLabelCost: "4", ...overrides }); }

test("cost posting eligibility requires confirmed unique match and supported imported value", () => {
  const item = { id: "i" };
  assert.equal(isEbayCostPostingEligible(record(), item), true);
  assert.equal(isEbayCostPostingEligible(record({ matchStatus: "unmatched" }), item), false);
  assert.equal(isEbayCostPostingEligible(record({ duplicateStatus: "possible_duplicate" }), item), false);
  assert.equal(isEbayCostPostingEligible(record({ platformFee: "", promotedFee: "", otherFee: "", buyerShipping: "", shippingLabelCost: "" }), item), false);
});

test("missing canonical cost values default selected, aligned disable, and conflicts stay unchecked", () => {
  const missing = ebayCostPostingReview(record(), { id: "i" });
  assert.ok(missing.every((entry) => entry.status === "Missing in ResellIt" && entry.defaultSelected));
  const aligned = ebayCostPostingReview(record(), { id: "i", manualEbayFee: "5.00", promotedListingFee: "2", otherPlatformFees: "1", shippingChargedToBuyer: "6", actualShippingCost: "4" });
  assert.ok(aligned.every((entry) => entry.status === "Aligned" && entry.disabled && !entry.defaultSelected));
  const conflicts = ebayCostPostingReview(record(), { id: "i", manualEbayFee: "9", promotedListingFee: "9", otherPlatformFees: "9", shippingChargedToBuyer: "9", actualShippingCost: "9" });
  assert.ok(conflicts.every((entry) => entry.status === "Different" && !entry.defaultSelected && !entry.disabled));
});

test("explicit selections map only to canonical targets and platform fee sets Manual mode", () => {
  const item = { id: "i", ebayFeeMode: "Private Germany", ebayFees: "legacy", shippingCost: "legacy ship", estimatedEbayFee: "estimate", packagingCost: "3", refundAmount: "7", refundDate: "2026-01-01", returnPostageCost: "2", payoutAmount: "99" };
  const beforeItem = structuredClone(item); const source = record(); const beforeSource = structuredClone(source);
  const result = prepareEbayCostPosting(source, item, { manualEbayFee: true, promotedListingFee: true, otherPlatformFees: true, shippingChargedToBuyer: true, actualShippingCost: true });
  assert.deepEqual(result.proposedItemPatch, { manualEbayFee: "5", promotedListingFee: "2", otherPlatformFees: "1", shippingChargedToBuyer: "6", actualShippingCost: "4", ebayFeeMode: "Manual" });
  for (const excluded of ["ebayFees", "shippingCost", "estimatedEbayFee", "packagingCost", "refundAmount", "refundDate", "returnPostageCost", "payoutAmount"]) assert.equal(result.proposedItemPatch[excluded], undefined);
  assert.deepEqual(item, beforeItem); assert.deepEqual(source, beforeSource);
});

test("fee mode changes only when manual platform fee is selected", () => {
  const item = { id: "i", ebayFeeMode: "Private Germany" };
  assert.equal(prepareEbayCostPosting(record(), item, { promotedListingFee: true }).proposedItemPatch.ebayFeeMode, undefined);
  assert.equal(prepareEbayCostPosting(record(), item, { otherPlatformFees: true }).proposedItemPatch.ebayFeeMode, undefined);
  assert.equal(prepareEbayCostPosting(record(), item, { manualEbayFee: true }).proposedItemPatch.ebayFeeMode, "Manual");
});

test("partial posting is supported and exposes unchanged available fields", () => {
  const result = prepareEbayCostPosting(record(), { id: "i" }, { manualEbayFee: true });
  assert.deepEqual(result.changedFields, ["manualEbayFee"]);
  assert.deepEqual(result.unchangedFields, ["promotedListingFee", "otherPlatformFees", "shippingChargedToBuyer", "actualShippingCost"]);
  assert.deepEqual(result.proposedItemPatch, { manualEbayFee: "5", ebayFeeMode: "Manual" });
});

test("nested cost metadata preserves legacy V3 sale posting history", () => {
  const oldV3 = normalizeEbayImportRecord({ postingStatus: "posted", postedAt: "sale-time", postedItemId: "i", postedFields: ["saleDate", "finalSalePrice"] });
  assert.deepEqual(oldV3.posting.sale, { status: "posted", postedAt: "sale-time", postedFields: ["saleDate", "finalSalePrice"] });
  assert.deepEqual(oldV3.posting.costs, { status: "not_posted", postedAt: "", postedFields: [] });
  const both = normalizeEbayImportRecord({ ...oldV3, posting: { sale: oldV3.posting.sale, costs: { status: "partially_posted", postedAt: "cost-time", postedFields: ["manualEbayFee"] } } });
  assert.equal(both.posting.sale.status, "posted"); assert.equal(both.posting.costs.status, "partially_posted");
});

test("canonical cost posting changes profit only through explicitly applied authoritative fields", () => {
  const current = { finalSalePrice: "100", purchasePrice: "20", ebayFeeMode: "Private Germany" };
  const before = itemProfitValue(current);
  const prepared = prepareEbayCostPosting(record({ promotedFee: "", otherFee: "", buyerShipping: "", shippingLabelCost: "" }), { id: "i", ...current }, { manualEbayFee: true });
  const updated = { ...current, ...prepared.proposedItemPatch };
  assert.equal(itemProfitValue(updated), before - 5);
});
