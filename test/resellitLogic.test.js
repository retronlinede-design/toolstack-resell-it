import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DEFAULT_EBAY_FEE_MODE,
  MAX_LEGACY_PROOF_IMAGE_BYTES,
  duplicateItemForDraft,
  hasListingDraft,
  isFullBackupPayload,
  isSoldStatus,
  markListingNeeded,
  normalizeItem,
  platformFees,
  sanitizeHtmlPreview,
  summarizeSoldPerformance,
} from "../src/resellitLogic.js";

test("legacy ebayFees are preserved as legacy platform fees during normalization", () => {
  const item = normalizeItem({
    name: "Legacy fee item",
    status: "Sold",
    salePrice: "59",
    purchasePrice: "22",
    ebayFees: "7.50",
  });

  assert.equal(item.ebayFeeMode, "Legacy");
  assert.equal(platformFees(item), 7.5);
});

test("saleDate alone does not make an item sold", () => {
  assert.equal(isSoldStatus({ status: "Draft", saleDate: "2026-05-18" }), false);
  assert.equal(isSoldStatus({ status: "Draft", finalSalePrice: "12" }), true);
  assert.equal(isSoldStatus({ status: "Sold", saleDate: "2026-05-18" }), true);
});

test("sold-only performance excludes unsold inventory from profit", () => {
  const summary = summarizeSoldPerformance([
    { name: "Unsold stock", status: "Draft", purchasePrice: "100" },
    { name: "Sold stock", status: "Sold", salePrice: "30", purchasePrice: "10" },
  ]);

  assert.equal(summary.sold, 1);
  assert.equal(summary.salesTotal, 30);
  assert.equal(summary.profit, 20);
});

test("partial JSON backup payloads are rejected", () => {
  assert.equal(isFullBackupPayload({ type: "RESELLERIT_BACKUP", items: [], expenses: [] }), true);
  assert.equal(isFullBackupPayload({ type: "RESELLERIT_BACKUP", items: [] }), false);
  assert.equal(isFullBackupPayload({ type: "RESELLERIT_BACKUP", expenses: [] }), false);
  assert.equal(isFullBackupPayload({ type: "OTHER_BACKUP", items: [], expenses: [] }), false);
});

test("persistence failure guards preserve form/editor state before reset behavior", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /if \(!persist\(next\)\) return;\s*setForm\(emptyItem\);\s*setSearchQueryManuallyEdited\(false\);\s*setEditingId\(null\);\s*setItemFormOpen\(false\);/s);
  assert.match(source, /if \(!persist\(\[newItem, \.\.\.items\]\)\) return;\s*setQuickAddItem\(/s);
  assert.match(source, /if \(!persistExpenses\(nextExpenses\)\) return;\s*setExpenseForm\(emptyExpense\);\s*setEditingExpenseId\(null\);/s);
  assert.match(source, /function persistExpenses\(nextExpenses\) {\s*return persistAll\(items, nextExpenses\);\s*}/s);
});

test("duplicate draft clears sale, shipping, refund, fee, tracking, platform fields", () => {
  const duplicate = duplicateItemForDraft({
    name: "Sold item",
    status: "Completed",
    saleDate: "2026-05-18",
    salePrice: "50",
    finalSalePrice: "50",
    buyerPlatform: "kleinanzeigen",
    shippingChargedToBuyer: "5",
    actualShippingCost: "4",
    packagingCost: "1",
    carrier: "Hermes",
    trackingNumber: "123",
    shippedDate: "2026-05-19",
    trackingNotes: "delivered",
    refundAmount: "2",
    refundDate: "2026-05-20",
    returnPostageCost: "3",
    refundReason: "return",
    ebayFees: "6",
    ebayFeeMode: "Manual",
    feePercent: "10",
    fixedFee: "0.35",
    estimatedEbayFee: "6",
    manualEbayFee: "6",
    promotedListingFee: "1",
    otherPlatformFees: "2",
    shippingCost: "4",
    shippingNotes: "ship after payment",
  }, "copy-id");

  assert.equal(duplicate.id, "copy-id");
  assert.equal(duplicate.status, "Draft");
  assert.equal(duplicate.buyerPlatform, "ebay");
  assert.equal(duplicate.carrier, "DHL");
  assert.equal(duplicate.ebayFeeMode, DEFAULT_EBAY_FEE_MODE);

  for (const field of [
    "saleDate",
    "salePrice",
    "finalSalePrice",
    "shippingChargedToBuyer",
    "actualShippingCost",
    "packagingCost",
    "trackingNumber",
    "shippedDate",
    "trackingNotes",
    "refundAmount",
    "refundDate",
    "returnPostageCost",
    "refundReason",
    "ebayFees",
    "feePercent",
    "fixedFee",
    "estimatedEbayFee",
    "manualEbayFee",
    "promotedListingFee",
    "otherPlatformFees",
    "shippingCost",
    "shippingNotes",
  ]) {
    assert.equal(duplicate[field], "", `${field} should be cleared`);
  }
});

test("listing needed clears fields that make a draft look ready", () => {
  const item = markListingNeeded({
    listingTitle: "Title",
    ebayTitle: "eBay Title",
    conditionText: "Condition",
    descriptionText: "Description",
    htmlDescription: "<p>Description</p>",
    generatedPlainDescription: "Generated",
    generatedHtmlDescription: "<p>Generated</p>",
  });

  assert.equal(hasListingDraft(item), false);
});

test("oversized legacy proof image data is stripped during normalization", () => {
  const item = normalizeItem({
    name: "Proof item",
    proofImageDataUrl: `data:image/png;base64,${"a".repeat(MAX_LEGACY_PROOF_IMAGE_BYTES + 1)}`,
    proofImageName: "receipt.png",
  });

  assert.equal(item.proofImageDataUrl, "");
  assert.equal(item.proofImageName, "");
  assert.match(item.proofNotes, /too large/);
});

test("HTML previews are sanitized without changing normal listing HTML shape", () => {
  const html = '<div style="color:red" onclick="bad()"><p>Normal listing</p><a href="javascript:bad()">link</a><script>bad()</script></div>';
  const sanitized = sanitizeHtmlPreview(html);

  assert.match(sanitized, /<p>Normal listing<\/p>/);
  assert.doesNotMatch(sanitized, /onclick=/);
  assert.doesNotMatch(sanitized, /javascript:/);
  assert.doesNotMatch(sanitized, /<script>/);
});
