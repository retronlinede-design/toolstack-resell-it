import assert from "node:assert/strict";
import test from "node:test";
import {
  LISTING_PACKAGE_FIELD_MAP,
  LISTING_PACKAGE_READINESS_METADATA,
  compareListingPackage,
  parseAndValidateListingPackage,
  parseListingPackage,
  prepareListingPackagePatch,
  validateListingPackage,
} from "../src/gptListingPackage.js";

function validPackage(overrides = {}) {
  const base = {
    format: "resellit_listing",
    version: 1,
    language: "de",
    facts: {
      identity: { brand: null, model: null, colour: null, measurements: null, compatibilityInfo: null },
      condition: { testedStatus: null, conditionGrade: null, conditionNotes: null, defectsNotes: null, includedAccessories: null },
    },
    generated: {
      ebayTitle: "Sony Walkman WM-EX 500 Kassettenspieler",
      ebayConditionText: "Gebrauchter Zustand mit leichten Spuren.",
      productDescriptionText: "Tragbarer Kassettenspieler von Sony.",
      generatedPlainDescription: "Sony Walkman in gebrauchtem Zustand.",
      generatedHtmlDescription: null,
      keyFeatures: null,
    },
    recommendations: {
      category: null,
      suggestedListingPrice: null,
      chosenListingPrice: null,
      shippingNotes: null,
      listingStrategy: null,
    },
    research: { query: null, low: null, mid: null, high: null, currency: "EUR", summary: null, sources: [] },
  };
  return merge(base, overrides);
}

function merge(base, overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return overrides;
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) result[key] = merge(result[key], value);
    else result[key] = value;
  }
  return result;
}

function errorCodes(result) {
  return result.errors.map((error) => error.code);
}

test("valid Listing Package parses, normalizes title whitespace, and exposes stable result metadata", () => {
  const packageValue = validPackage({ generated: { ebayTitle: "  Sony   Walkman   WM-EX 500  " } });
  const result = parseAndValidateListingPackage(`  ${JSON.stringify(packageValue)}  `);

  assert.equal(result.ok, true);
  assert.equal(result.package.generated.ebayTitle, "Sony Walkman WM-EX 500");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(result.protectedKeys, []);
  assert.ok(result.mappedFields.some((field) => field.targetPath === "ebayTitle"));
  assert.deepEqual(result.metadata, LISTING_PACKAGE_READINESS_METADATA);
});

test("strict parser rejects malformed, fenced, commented, multiple, and non-object JSON", () => {
  for (const input of ["{bad", '{"a":1} commentary', '{"a":1}{"b":2}']) {
    assert.equal(parseListingPackage(input).ok, false);
    assert.ok(errorCodes(parseListingPackage(input)).includes("malformed_json"));
  }
  assert.ok(errorCodes(parseListingPackage("```json\n{}\n```")).includes("markdown_fence"));
  assert.ok(errorCodes(parseListingPackage("[]")).includes("invalid_root"));
});

test("format, version, language, required objects, and generated fields are strict", () => {
  assert.ok(errorCodes(validateListingPackage(validPackage({ format: "other" }))).includes("unsupported_format"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ version: 2 }))).includes("unsupported_version"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ language: "en" }))).includes("unsupported_language"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ facts: null }))).includes("missing_object"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ generated: { ebayTitle: "" } }))).includes("missing_generated_field"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ generated: { generatedPlainDescription: "N/A" } }))).includes("missing_generated_field"));
});

test("title, enums, numeric values, currency, and research ordering are validated", () => {
  assert.ok(errorCodes(validateListingPackage(validPackage({ generated: { ebayTitle: "ä".repeat(81) } }))).includes("title_too_long"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ facts: { condition: { testedStatus: "Probably works" } } }))).includes("invalid_enum"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ facts: { condition: { conditionGrade: "Excellent" } } }))).includes("invalid_enum"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ recommendations: { chosenListingPrice: -1 } }))).includes("negative_number"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ recommendations: { suggestedListingPrice: "10.00" } }))).includes("invalid_number"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ research: { currency: "USD" } }))).includes("invalid_currency"));
  assert.ok(errorCodes(validateListingPackage(validPackage({ research: { low: 30, mid: 20, high: 40 } }))).includes("invalid_research_order"));
});

test("null optional values and allowed fact enums remain valid", () => {
  const result = validateListingPackage(validPackage({
    facts: { condition: { testedStatus: "Tested working", conditionGrade: "Sehr gut" } },
    recommendations: { suggestedListingPrice: 20, chosenListingPrice: 25 },
    research: { low: 10, mid: 20, high: 30 },
  }));
  assert.equal(result.ok, true);
});

test("optional fields may be omitted while required objects and currency remain", () => {
  const sparse = validPackage();
  sparse.facts.identity = {};
  sparse.facts.condition = {};
  sparse.generated = {
    ebayTitle: sparse.generated.ebayTitle,
    ebayConditionText: sparse.generated.ebayConditionText,
    productDescriptionText: sparse.generated.productDescriptionText,
    generatedPlainDescription: sparse.generated.generatedPlainDescription,
  };
  sparse.recommendations = {};
  sparse.research = { currency: "EUR" };

  assert.equal(validateListingPackage(sparse).ok, true);
});

test("unknown and protected keys are reported and invalidate the package", () => {
  const unknown = validateListingPackage(validPackage({ generated: { surpriseCopy: "x" } }));
  assert.equal(unknown.ok, false);
  assert.ok(errorCodes(unknown).includes("unknown_key"));
  assert.equal(unknown.errors.find((error) => error.code === "unknown_key").path, "generated.surpriseCopy");

  const protectedResult = validateListingPackage(validPackage({ status: "Sold", purchasePrice: 10, shipping: { cost: 4 }, source: "dealer" }));
  assert.equal(protectedResult.ok, false);
  assert.deepEqual(protectedResult.protectedKeys.sort(), ["purchasePrice", "shipping", "source", "status"]);
  assert.ok(protectedResult.errors.every((error) => error.kind === "protected"));
  assert.ok(compareListingPackage(protectedResult, {}).every((row) => row.state === "Protected"));
});

test("active HTML content is rejected without executing or mapping it", () => {
  for (const html of [
    "<script>alert(1)</script>",
    "<iframe src='https://example.test'></iframe>",
    "<form action='/send'></form>",
    "<div onclick='bad()'>Text</div>",
    "<a href='javascript:bad()'>Text</a>",
  ]) {
    const result = validateListingPackage(validPackage({ generated: { generatedHtmlDescription: html } }));
    assert.equal(result.ok, false);
    assert.ok(errorCodes(result).includes("unsafe_html"));
  }
});

test("canonical mapping contains the exact allowed targets and no legacy aliases", () => {
  const targets = LISTING_PACKAGE_FIELD_MAP.map((entry) => entry.targetPath);
  for (const target of [
    "ebayTitle", "ebay.conditionText", "productDescriptionText", "generatedPlainDescription", "generatedHtmlDescription", "keyFeatures",
    "brand", "model", "colour", "measurements", "compatibilityInfo", "testedStatus", "conditionGrade", "conditionNotes",
    "defectsNotes", "includedAccessories", "category", "suggestedListingPrice", "chosenListingPrice", "shippingNotes",
    "priceResearchLow", "priceResearchMid", "priceResearchHigh", "researchNotes",
  ]) assert.ok(targets.includes(target), `missing canonical target ${target}`);
  for (const legacy of ["listingTitle", "conditionText", "descriptionText", "htmlDescription", "includedItems", "sizeSpecs", "researchedLowPrice", "researchedMidPrice", "researchedHighPrice", "priceResearchNotes"]) {
    assert.equal(targets.includes(legacy), false, `legacy alias ${legacy} must not be mapped`);
  }
});

test("comparison produces New, Same, and Different with numeric and whitespace equivalence", () => {
  const result = validateListingPackage(validPackage({
    facts: { identity: { brand: "Sony" } },
    recommendations: { suggestedListingPrice: 10, chosenListingPrice: 20 },
    research: { summary: "Useful research" },
  }));
  const rows = compareListingPackage(result, {
    ebayTitle: "Sony   Walkman WM-EX 500 Kassettenspieler",
    suggestedListingPrice: "10.00",
    chosenListingPrice: "25",
  });

  assert.equal(rows.find((row) => row.id === "generated.ebayTitle").state, "Same");
  assert.equal(rows.find((row) => row.id === "recommendations.suggestedListingPrice").state, "Same");
  assert.equal(rows.find((row) => row.id === "recommendations.chosenListingPrice").state, "Different");
  assert.equal(rows.find((row) => row.id === "research.summary").state, "New");
});

test("default selection is limited to new safe generated and research context values", () => {
  const result = validateListingPackage(validPackage({
    facts: { identity: { brand: "Sony" }, condition: { conditionNotes: "Leichte Spuren" } },
    generated: { keyFeatures: "Kompakt" },
    recommendations: { category: "Audio" },
    research: { summary: "Preisvergleich" },
  }));
  const rows = compareListingPackage(result, {});

  assert.equal(rows.find((row) => row.id === "generated.ebayTitle").defaultSelected, true);
  assert.equal(rows.find((row) => row.id === "generated.keyFeatures").defaultSelected, true);
  assert.equal(rows.find((row) => row.id === "research.summary").defaultSelected, true);
  assert.equal(rows.find((row) => row.id === "facts.identity.brand").defaultSelected, false);
  assert.equal(rows.find((row) => row.id === "facts.condition.conditionNotes").defaultSelected, false);
  assert.equal(rows.find((row) => row.id === "recommendations.category").defaultSelected, false);

  const existingRows = compareListingPackage(result, { ebayTitle: "Existing title" });
  assert.equal(existingRows.find((row) => row.id === "generated.ebayTitle").state, "Different");
  assert.equal(existingRows.find((row) => row.id === "generated.ebayTitle").defaultSelected, false);
});

test("patch preparation writes only selected canonical fields without mutation", () => {
  const packageValue = validPackage({
    facts: { identity: { measurements: "20 × 10 cm" }, condition: { includedAccessories: "Kopfhörer" } },
    generated: { generatedHtmlDescription: "<p>Sicherer Inhalt</p>" },
    recommendations: { chosenListingPrice: 39.99 },
    research: { low: 20, summary: "Vergleichsdaten" },
  });
  const result = validateListingPackage(packageValue);
  const item = { id: "item-1", ebay: { conditionText: "Bestehender Text", categoryId: "123" }, listingTitle: "Legacy", includedItems: "Legacy contents" };
  const packageSnapshot = structuredClone(packageValue);
  const itemSnapshot = structuredClone(item);
  const prepared = prepareListingPackagePatch(result, item, [
    "generated.ebayTitle",
    "generated.ebayConditionText",
    "generated.generatedHtmlDescription",
    "facts.identity.measurements",
    "facts.condition.includedAccessories",
    "recommendations.chosenListingPrice",
    "research.low",
  ]);

  assert.equal(prepared.validationErrors.length, 0);
  assert.equal(prepared.patch.ebayTitle, packageValue.generated.ebayTitle);
  assert.deepEqual(prepared.patch.ebay, { conditionText: packageValue.generated.ebayConditionText });
  assert.equal(prepared.patch.generatedHtmlDescription, "<p>Sicherer Inhalt</p>");
  assert.equal(prepared.patch.measurements, "20 × 10 cm");
  assert.equal(prepared.patch.includedAccessories, "Kopfhörer");
  assert.equal(prepared.patch.chosenListingPrice, 39.99);
  assert.equal(prepared.patch.priceResearchLow, 20);
  assert.ok(prepared.changedFields.includes("ebayTitle"));
  assert.ok(prepared.changedFields.includes("ebay.conditionText"));
  for (const legacy of ["listingTitle", "conditionText", "htmlDescription", "sizeSpecs", "includedItems", "researchedLowPrice"]) assert.equal(Object.hasOwn(prepared.patch, legacy), false);
  assert.deepEqual(packageValue, packageSnapshot);
  assert.deepEqual(item, itemSnapshot);
});

test("invalid package prepares no patch and existing records remain unchanged", () => {
  const item = { id: "item-1", purchasePrice: "20", status: "Draft", ebayTitle: "Current" };
  const snapshot = structuredClone(item);
  const invalid = validateListingPackage(validPackage({ saleDate: "2026-01-01" }));
  const prepared = prepareListingPackagePatch(invalid, item, ["generated.ebayTitle"]);

  assert.deepEqual(prepared.patch, {});
  assert.ok(prepared.validationErrors.length > 0);
  assert.deepEqual(item, snapshot);
});

test("readiness metadata preserves productDescriptionText and generated description distinction", () => {
  assert.deepEqual(LISTING_PACKAGE_READINESS_METADATA, {
    descriptionRequiredField: "productDescriptionText",
    generatedDescriptionField: "generatedPlainDescription",
    generatedDescriptionAloneSatisfiesReadiness: false,
  });
});
