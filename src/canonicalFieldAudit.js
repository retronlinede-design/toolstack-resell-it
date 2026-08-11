import { STORAGE_KEY } from "./resellitStorage.js";

export const CANONICAL_ALIAS_PAIRS = [
  { key: "salePrice", legacyPath: "salePrice", canonicalPath: "finalSalePrice", numeric: true },
  { key: "shippingCost", legacyPath: "shippingCost", canonicalPath: "actualShippingCost", numeric: true },
  { key: "ebayFees", legacyPath: "ebayFees", canonicalPath: "manualEbayFee", numeric: true },
  { key: "conditionText", legacyPath: "conditionText", canonicalPath: "ebay.conditionText" },
  { key: "descriptionText", legacyPath: "descriptionText", canonicalPath: "generatedPlainDescription" },
  { key: "htmlDescription", legacyPath: "htmlDescription", canonicalPath: "generatedHtmlDescription" },
  { key: "includedItems", legacyPath: "includedItems", canonicalPath: "includedAccessories" },
  { key: "sizeSpecs", legacyPath: "sizeSpecs", canonicalPath: "measurements" },
  { key: "researchedLowPrice", legacyPath: "researchedLowPrice", canonicalPath: "priceResearchLow", numeric: true },
  { key: "researchedMidPrice", legacyPath: "researchedMidPrice", canonicalPath: "priceResearchMid", numeric: true },
  { key: "researchedHighPrice", legacyPath: "researchedHighPrice", canonicalPath: "priceResearchHigh", numeric: true },
  { key: "priceResearchNotes", legacyPath: "priceResearchNotes", canonicalPath: "researchNotes" },
];

const CLASSIFICATION_ALIGNMENT = {
  "Private Sale / Personal Collection": "private",
  "Business Stock / Resale Inventory": "business",
};

function valueAtPath(value, path) {
  return path.split(".").reduce((current, key) => current?.[key], value);
}

function populated(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizedText(value) {
  return String(value).trim();
}

function valuesEqual(legacyValue, canonicalValue, numeric) {
  if (numeric) {
    const legacyNumber = Number(normalizedText(legacyValue));
    const canonicalNumber = Number(normalizedText(canonicalValue));
    if (Number.isFinite(legacyNumber) && Number.isFinite(canonicalNumber)) {
      return legacyNumber === canonicalNumber;
    }
  }
  return normalizedText(legacyValue) === normalizedText(canonicalValue);
}

function classifyPair(legacyValue, canonicalValue, numeric) {
  const hasLegacy = populated(legacyValue);
  const hasCanonical = populated(canonicalValue);
  if (!hasLegacy && !hasCanonical) return "neitherPopulated";
  if (hasLegacy && !hasCanonical) return "legacyOnly";
  if (!hasLegacy && hasCanonical) return "canonicalOnly";
  return valuesEqual(legacyValue, canonicalValue, numeric) ? "equal" : "conflicting";
}

function itemIdentity(item, index) {
  return {
    itemId: String(item?.id || ""),
    itemName: String(item?.name || ""),
    itemIndex: index,
  };
}

function auditClassification(items) {
  const result = {
    counts: {
      neitherPopulated: 0,
      classificationOnly: 0,
      sellerClassificationOnly: 0,
      aligned: 0,
      differentClassification: 0,
      reviewRequired: 0,
    },
    differentClassification: [],
    reviewRequired: [],
  };

  items.forEach((item, index) => {
    const classification = item?.classification;
    const sellerClassification = item?.sellerClassification;
    const hasClassification = populated(classification);
    const hasSellerClassification = populated(sellerClassification);
    let classificationResult;

    if (!hasClassification && !hasSellerClassification) classificationResult = "neitherPopulated";
    else if (hasClassification && !hasSellerClassification) classificationResult = "classificationOnly";
    else if (!hasClassification && hasSellerClassification) classificationResult = "sellerClassificationOnly";
    else {
      const expectedSellerClassification = CLASSIFICATION_ALIGNMENT[classification];
      if (!expectedSellerClassification) classificationResult = "reviewRequired";
      else classificationResult = expectedSellerClassification === sellerClassification ? "aligned" : "differentClassification";
    }

    result.counts[classificationResult] += 1;
    if (classificationResult === "differentClassification" || classificationResult === "reviewRequired") {
      const entry = {
        ...itemIdentity(item, index),
        classification,
        sellerClassification,
      };
      const detailList = classificationResult === "differentClassification" ? result.differentClassification : result.reviewRequired;
      detailList.push(entry);
    }
  });

  return result;
}

export function auditCanonicalFieldConflicts(items) {
  const safeItems = Array.isArray(items) ? items : [];
  const pairs = {};

  for (const pair of CANONICAL_ALIAS_PAIRS) {
    const result = {
      legacyPath: pair.legacyPath,
      canonicalPath: pair.canonicalPath,
      numeric: Boolean(pair.numeric),
      counts: {
        neitherPopulated: 0,
        legacyOnly: 0,
        canonicalOnly: 0,
        equal: 0,
        conflicting: 0,
      },
      conflicts: [],
    };

    safeItems.forEach((item, index) => {
      const legacyValue = valueAtPath(item, pair.legacyPath);
      const canonicalValue = valueAtPath(item, pair.canonicalPath);
      const classification = classifyPair(legacyValue, canonicalValue, pair.numeric);
      result.counts[classification] += 1;

      if (classification === "conflicting") {
        result.conflicts.push({
          ...itemIdentity(item, index),
          legacyValue,
          canonicalValue,
        });
      }
    });

    pairs[pair.key] = result;
  }

  return {
    itemCount: safeItems.length,
    pairs,
    classification: auditClassification(safeItems),
  };
}

export function auditStoredCanonicalFieldConflicts(storage, storageKey = STORAGE_KEY) {
  if (!storage || typeof storage.getItem !== "function") {
    throw new TypeError("A readable storage object is required");
  }
  const raw = storage.getItem(storageKey);
  if (raw === null) return auditCanonicalFieldConflicts([]);
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) {
    throw new TypeError("Stored ResellIt payload does not contain an items array");
  }
  return auditCanonicalFieldConflicts(parsed.items);
}
