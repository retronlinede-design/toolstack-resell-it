import assert from "node:assert/strict";
import test from "node:test";
import {
  CANONICAL_ALIAS_PAIRS,
  auditCanonicalFieldConflicts,
  auditStoredCanonicalFieldConflicts,
} from "../src/canonicalFieldAudit.js";
import { STORAGE_KEY } from "../src/resellitStorage.js";

const legacyOnly = {
  id: "legacy-1",
  name: "Legacy item",
  salePrice: "10",
  shippingCost: "4.50",
  ebayFees: "2",
  conditionText: "Used",
  descriptionText: "Legacy plain",
  htmlDescription: "<p>Legacy</p>",
  includedItems: "Cable",
  sizeSpecs: "20 cm",
  researchedLowPrice: "8",
  researchedMidPrice: "10",
  researchedHighPrice: "12",
  priceResearchNotes: "Old notes",
  chosenListingPrice: "11",
  classification: "Private Sale / Personal Collection",
  sellerClassification: "private",
};

const canonicalOnly = {
  id: "canonical-1",
  name: "Canonical item",
  finalSalePrice: "15",
  actualShippingCost: "5",
  manualEbayFee: "3",
  ebay: { conditionText: "Very good" },
  generatedPlainDescription: "Canonical plain",
  generatedHtmlDescription: "<p>Canonical</p>",
  includedAccessories: "Charger",
  measurements: "30 cm",
  priceResearchLow: "12",
  priceResearchMid: "15",
  priceResearchHigh: "18",
  researchNotes: "New notes",
  suggestedListingPrice: "17",
  classification: "Business Stock / Resale Inventory",
  sellerClassification: "business",
};

const numericallyEqual = {
  id: "equal-1",
  name: "Numeric formatting",
  salePrice: "10",
  finalSalePrice: "10.00",
  shippingCost: "4.5",
  actualShippingCost: "4.50",
  ebayFees: "2.00",
  manualEbayFee: "2",
  researchedLowPrice: "8.0",
  priceResearchLow: "8.00",
  researchedMidPrice: "10",
  priceResearchMid: "10.0",
  researchedHighPrice: "12.00",
  priceResearchHigh: "12",
  chosenListingPrice: "11",
  suggestedListingPrice: "11.00",
};

const conflicting = {
  id: "conflict-1",
  name: "Conflicting item",
  salePrice: "20",
  finalSalePrice: "21",
  shippingCost: "5",
  actualShippingCost: "6",
  ebayFees: "2",
  manualEbayFee: "3",
  conditionText: "Used",
  ebay: { conditionText: "Damaged" },
  descriptionText: "Old plain",
  generatedPlainDescription: "New plain",
  htmlDescription: "<p>Old</p>",
  generatedHtmlDescription: "<p>New</p>",
  includedItems: "Cable",
  includedAccessories: "Cable and charger",
  sizeSpecs: "Small",
  measurements: "40 cm",
  researchedLowPrice: "10",
  priceResearchLow: "11",
  researchedMidPrice: "20",
  priceResearchMid: "21",
  researchedHighPrice: "30",
  priceResearchHigh: "31",
  priceResearchNotes: "Old notes",
  researchNotes: "New notes",
  chosenListingPrice: "25",
  suggestedListingPrice: "26",
  classification: "Business Stock / Resale Inventory",
  sellerClassification: "private",
};

test("canonical field audit classifies every alias pair and identifies conflicts", () => {
  const audit = auditCanonicalFieldConflicts([{}, legacyOnly, canonicalOnly, numericallyEqual, conflicting]);

  assert.equal(audit.itemCount, 5);
  assert.equal(Object.keys(audit.pairs).length, CANONICAL_ALIAS_PAIRS.length);
  for (const pair of Object.values(audit.pairs)) {
    assert.equal(Object.values(pair.counts).reduce((sum, count) => sum + count, 0), 5);
  }

  assert.deepEqual(audit.pairs.salePrice.counts, {
    neitherPopulated: 1,
    legacyOnly: 1,
    canonicalOnly: 1,
    equal: 1,
    conflicting: 1,
  });
  assert.deepEqual(audit.pairs.salePrice.conflicts, [{
    itemId: "conflict-1",
    itemName: "Conflicting item",
    itemIndex: 4,
    legacyValue: "20",
    canonicalValue: "21",
  }]);
});

test("numeric aliases compare values rather than string formatting", () => {
  const audit = auditCanonicalFieldConflicts([numericallyEqual]);
  for (const key of [
    "salePrice",
    "shippingCost",
    "ebayFees",
    "researchedLowPrice",
    "researchedMidPrice",
    "researchedHighPrice",
  ]) {
    assert.equal(audit.pairs[key].counts.equal, 1, `${key} should be numerically equal`);
    assert.equal(audit.pairs[key].counts.conflicting, 0);
  }
});

test("classification differences are separate consistency reviews, not alias conflicts", () => {
  const audit = auditCanonicalFieldConflicts([
    legacyOnly,
    canonicalOnly,
    conflicting,
    { id: "review-1", name: "Review", classification: "Unsure / Review Later", sellerClassification: "business" },
    {},
  ]);

  assert.deepEqual(audit.classification.counts, {
    neitherPopulated: 1,
    classificationOnly: 0,
    sellerClassificationOnly: 0,
    aligned: 2,
    differentClassification: 1,
    reviewRequired: 1,
  });
  assert.equal(audit.classification.differentClassification[0].itemId, "conflict-1");
  assert.equal(audit.classification.reviewRequired[0].itemId, "review-1");
});

test("chosen and suggested listing prices are not audited as aliases", () => {
  const item = { chosenListingPrice: "25", suggestedListingPrice: "30" };
  const audit = auditCanonicalFieldConflicts([item]);

  assert.equal(CANONICAL_ALIAS_PAIRS.length, 12);
  assert.equal(audit.pairs.chosenListingPrice, undefined);
  assert.deepEqual(item, { chosenListingPrice: "25", suggestedListingPrice: "30" });
});

test("stored-data adapter reads current items without writing storage", () => {
  const calls = [];
  const storage = {
    getItem(key) {
      calls.push(["getItem", key]);
      return JSON.stringify({ items: [conflicting] });
    },
    setItem() {
      calls.push(["setItem"]);
      throw new Error("read-only audit must not write");
    },
  };

  const audit = auditStoredCanonicalFieldConflicts(storage);
  assert.equal(audit.pairs.salePrice.counts.conflicting, 1);
  assert.deepEqual(calls, [["getItem", STORAGE_KEY]]);
});

test("canonical field audit does not mutate its input items", () => {
  const items = [structuredClone(conflicting), structuredClone(legacyOnly)];
  const before = structuredClone(items);

  auditCanonicalFieldConflicts(items);

  assert.deepEqual(items, before);
});
