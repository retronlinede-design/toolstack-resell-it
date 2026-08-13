import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LISTING_PACKAGE_FIELD_MAP,
  LISTING_PACKAGE_READINESS_METADATA,
  applyListingPackagePatchToItem,
  compareListingPackage,
  generateGptItemTemplateOutput,
  parseAndValidateListingPackage,
  parseListingPackage,
  prepareCanonicalGptItem,
  prepareListingPackagePatch,
  prepareGptImportedItem,
  prepareGptListingUpdate,
  purchaseDetailsReadiness,
  validateListingPackage,
} from "../src/gptListingPackage.js";
import { normalizeItem as normalizeSchemaItem } from "../src/resellitSchema.js";
import { generateHtmlDescription, generateListingDraft, listingReadiness } from "../src/ebayListingTemplate.js";

function validPackage(overrides = {}) {
  const base = {
    format: "resellit_listing",
    version: 1,
    language: "de",
    itemName: "Sony Walkman WM-EX 500",
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
  assert.deepEqual(prepared.patch.includedAccessories.map(({ name, type, titlePriority, notes }) => ({ name, type, titlePriority, notes })), [{ name: "Kopfhörer", type: "accessory", titlePriority: false, notes: "" }]);
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
    finalDescriptionOwner: "resellit_template",
    packageGeneratedDescriptionsAuthoritativeForNewItems: false,
    productDescriptionScope: "concise_product_overview_only",
  });
});

test("canonical patch application preserves nested eBay data and protected item domains", () => {
  const item = {
    id: "item-1",
    status: "Draft",
    purchaseDate: "2026-08-01",
    purchasePrice: "25",
    finalSalePrice: "",
    manualEbayFee: "",
    actualShippingCost: "",
    refundAmount: "",
    sellerClassification: "private",
    evidenceIds: ["evidence-1"],
    ebay: { conditionText: "Current", categoryId: "123", listingId: "listing-1" },
  };
  const patch = { ebayTitle: "Imported title", ebay: { conditionText: "Imported condition" } };
  const itemSnapshot = structuredClone(item);
  const patchSnapshot = structuredClone(patch);
  const proposed = applyListingPackagePatchToItem(item, patch);

  assert.deepEqual(proposed.ebay, { conditionText: "Imported condition", categoryId: "123", listingId: "listing-1" });
  for (const field of ["status", "purchaseDate", "purchasePrice", "finalSalePrice", "manualEbayFee", "actualShippingCost", "refundAmount", "sellerClassification", "evidenceIds"]) {
    assert.deepEqual(proposed[field], item[field]);
  }
  assert.deepEqual(item, itemSnapshot);
  assert.deepEqual(patch, patchSnapshot);
});

test("GPT Listing Import UI uses Phase 2 helpers and updates only open form after confirmation", () => {
  const source = readFileSync(new URL("../src/components/item-editor/GptListingImport.jsx", import.meta.url), "utf8");
  const studioSource = readFileSync(new URL("../src/components/item-editor/EbayStudio.jsx", import.meta.url), "utf8");

  assert.match(studioSource, /<GptListingImport form=\{form\} setForm=\{setForm\}/);
  assert.match(source, />Update Listing from GPT<\/button>/);
  assert.match(source, /Paste a ResellIt Listing Package from your listing GPT\./);
  assert.match(source, />Parse & Review<\/button>/);
  assert.match(source, /parseAndValidateListingPackage\(pasteText\)/);
  assert.match(source, /compareListingPackage\(result, form\)/);
  assert.match(source, /prepareGptListingUpdate\(validationResult, selectedFieldIds, form\)/);
  assert.match(source, /Listing Inputs/);
  assert.match(source, /Facts to Confirm/);
  assert.match(source, /Recommendations/);
  assert.match(source, /Imported Research/);
  assert.match(source, /row\.defaultSelected && !row\.disabled/);
  assert.match(source, /row\.state === "Different" \? "Use GPT Value"/);
  assert.match(source, /Protected Fields Ignored/);
  assert.match(source, /Package Cannot Be Reviewed/);
  assert.match(source, /listingReadiness\(form\)/);
  assert.match(source, /listingReadiness\(proposedItem\)/);
  assert.match(source, /sanitizeHtmlPreview\(proposedItem\.generatedHtmlDescription\)/);
  assert.match(source, />Apply Selected Fields<\/button>/);
  assert.match(source, /Apply \{selectedCount\} structured fields from GPT package\?/);
  assert.match(source, />Apply to Item<\/button>/);
  assert.match(source, /prepareGptListingUpdate\(validationResult, selectedFieldIds, currentForm\)/);
  assert.match(source, /final descriptions regenerated by ResellIt/);
  assert.doesNotMatch(source, /saveCurrentItem|persistAll|localStorage|fetch\(|OpenAI/);
  assert.match(studioSource, />\s*Generate Locally\s*</);
});

test("cancel and invalid parse paths cannot update the item form", () => {
  const source = readFileSync(new URL("../src/components/item-editor/GptListingImport.jsx", import.meta.url), "utf8");
  const closeFunction = source.slice(source.indexOf("function closeImport()"), source.indexOf("function parseForReview()"));
  const invalidBranch = source.slice(source.indexOf("if (!result.ok)"), source.indexOf("const rows = compareListingPackage", source.indexOf("if (!result.ok)")));

  assert.doesNotMatch(closeFunction, /setForm/);
  assert.doesNotMatch(invalidBranch, /setForm|prepareListingPackagePatch/);
  assert.match(invalidBranch, /setStage\("paste"\)/);
});

test("structured GPT accessories validate, remain review facts, and receive ResellIt IDs only when applied", () => {
  const accessories = [
    { name: "Originalverpackung", type: "original_box", titlePriority: true, notes: null },
    { name: "Bedienungsanleitung", type: "manual", titlePriority: true, notes: null },
  ];
  const result = validateListingPackage(validPackage({ facts: { condition: { includedAccessories: accessories } } }));
  assert.equal(result.ok, true);
  const row = compareListingPackage(result, {}).find((entry) => entry.field === "includedAccessories");
  assert.equal(row.safetyClass, "review_fact");
  assert.equal(row.defaultSelected, false);
  const prepared = prepareListingPackagePatch(result, {}, [row.id]);
  assert.ok(prepared.patch.includedAccessories.every((entry) => entry.id && !accessories.some((source) => Object.hasOwn(source, "id"))));
});

test("GPT accessory IDs, invalid types, empty names, duplicate names, and unknown keys are rejected", () => {
  const invalidEntries = [
    { name: "Box", type: "original_box", titlePriority: true, notes: null, id: "gpt-id" },
    { name: "", type: "manual", titlePriority: true, notes: null },
    { name: "Box", type: "not_real", titlePriority: false, notes: null },
    { name: "BOX", type: "accessory", titlePriority: false, notes: null, extra: true },
  ];
  const result = validateListingPackage(validPackage({ facts: { condition: { includedAccessories: invalidEntries } } }));
  for (const code of ["accessory_id_forbidden", "invalid_accessory_name", "invalid_accessory_type", "duplicate_accessory", "unknown_key"]) assert.ok(errorCodes(result).includes(code));
});

test("structured accessory comparison is semantic and order independent", () => {
  const packageAccessories = [
    { name: "Originalverpackung", type: "original_box", titlePriority: true, notes: null },
    { name: "Anleitung", type: "manual", titlePriority: true, notes: null },
  ];
  const result = validateListingPackage(validPackage({ facts: { condition: { includedAccessories: packageAccessories } } }));
  const current = {
    includedAccessories: [
      { id: "two", name: "Anleitung", type: "manual", titlePriority: true, notes: "" },
      { id: "one", name: "Originalverpackung", type: "original_box", titlePriority: true, notes: "" },
    ],
  };
  assert.equal(compareListingPackage(result, current).find((row) => row.field === "includedAccessories").state, "Same");
  current.includedAccessories[0].titlePriority = false;
  assert.equal(compareListingPackage(result, current).find((row) => row.field === "includedAccessories").state, "Different");
});

test("itemName is required, trimmed, canonical, and old packages fail deliberately", () => {
  const missing = validPackage();
  delete missing.itemName;
  assert.ok(errorCodes(validateListingPackage(missing)).includes("missing_item_name"));
  const result = validateListingPackage(validPackage({ itemName: "  Sony Walkman  " }));
  assert.equal(result.ok, true);
  assert.equal(result.package.itemName, "Sony Walkman");
  assert.equal(result.mappedFields.find((field) => field.sourcePath === "itemName").targetPath, "name");
});

test("GPT item preparation creates a normalized Draft with separate listing and purchase readiness", () => {
  const result = validateListingPackage(validPackage({
    itemName: "Sony Walkman",
    generated: { ebayConditionText: "Gebraucht und geprüft.", productDescriptionText: "Produktdetails.", generatedPlainDescription: "Beschreibung.", ebayTitle: "Sony Walkman Kassettenspieler" },
    recommendations: { chosenListingPrice: 49, shippingNotes: "Versicherter Versand." },
    facts: { identity: { brand: "Sony" }, condition: { includedAccessories: [{ name: "Anleitung", type: "manual", titlePriority: true, notes: null }] } },
  }));
  const rows = compareListingPackage(result, {});
  const selected = rows.filter((row) => row.defaultSelected).map((row) => row.id);
  selected.push("recommendations.chosenListingPrice", "recommendations.shippingNotes", "facts.identity.brand", "facts.condition.includedAccessories", "generated.ebayConditionText");
  const prepared = prepareGptImportedItem(result, selected, { purchaseDate: "", purchasePrice: "", sourceName: "", sourceType: "", includedAccessories: [] });

  assert.equal(prepared.item.name, "Sony Walkman");
  assert.equal(prepared.item.status, "Draft");
  assert.equal(prepared.item.ebayTitle, "Sony Walkman Kassettenspieler");
  assert.equal(prepared.item.ebay.conditionText, "Gebraucht und geprüft.");
  assert.equal(prepared.item.listingTitle, "");
  assert.equal(prepared.item.conditionText, "");
  assert.equal(prepared.item.includedItems, "");
  assert.ok(prepared.item.includedAccessories[0].id);
  assert.equal(prepared.listingReadiness, "Ready for Listing");
  assert.equal(prepared.purchaseDetailsReadiness.status, "Needs Purchase Details");
  assert.equal(prepared.item.status === "Ready for Listing", false);
});

test("GPT-created items use ResellIt plain and HTML templates instead of package final output", () => {
  const packageValue = validPackage({
    itemName: "JBL On Stage 200iD Lautsprecherdock",
    generated: {
      ebayTitle: "JBL On Stage 200iD Lautsprecherdock OVP Anleitung",
      ebayConditionText: "Getestet und voll funktionsfähig.",
      productDescriptionText: "Kompaktes Lautsprecherdock für kompatible Apple-Geräte.",
      generatedPlainDescription: "GPT FINAL PLAIN MUST NOT WIN",
      generatedHtmlDescription: "<p>GPT FINAL HTML MUST NOT WIN</p>",
      keyFeatures: "30-Pin-Anschluss\n3,5-mm-AUX-Eingang",
    },
    facts: {
      identity: { brand: "JBL", model: "On Stage 200iD", colour: "Schwarz", measurements: "34 × 12 × 10 cm", compatibilityInfo: "Apple-Geräte mit 30-Pin-Anschluss" },
      condition: {
        testedStatus: "Tested working", conditionGrade: "Gut", conditionNotes: null, defectsNotes: null,
        includedAccessories: [
          { name: "Originalverpackung", type: "original_box", titlePriority: true, notes: null },
          { name: "Bedienungsanleitung", type: "manual", titlePriority: true, notes: null },
        ],
      },
    },
    recommendations: { category: "Lautsprecherdocks", chosenListingPrice: 49, shippingNotes: "Versicherter Versand mit Sendungsverfolgung. Abholung nach Absprache möglich." },
  });
  const validation = validateListingPackage(packageValue);
  const selected = validation.mappedFields
    .filter((field) => !["generated.generatedPlainDescription", "generated.generatedHtmlDescription"].includes(field.id))
    .map((field) => field.id);
  const packageSnapshot = structuredClone(packageValue);
  const prepared = prepareGptImportedItem(validation, selected, { classification: "Private Sale / Personal Collection", notes: "Sorgfältig verpackter Versand." });

  assert.doesNotMatch(prepared.item.generatedPlainDescription, /GPT FINAL PLAIN/);
  assert.doesNotMatch(prepared.item.generatedHtmlDescription, /GPT FINAL HTML/);
  for (const heading of ["ARTIKEL", "PRODUKTBESCHREIBUNG", "ZUSTAND", "LIEFERUMFANG", "VERSAND", "HINWEISE"]) assert.match(prepared.item.generatedPlainDescription, new RegExp(heading));
  assert.match(prepared.item.generatedPlainDescription, /Größe \/ Spezifikation: 34 × 12 × 10 cm/);
  assert.match(prepared.item.generatedPlainDescription, /Kompatibilität \/ Plattform: Apple-Geräte mit 30-Pin-Anschluss/);
  assert.match(prepared.item.generatedPlainDescription, /30-Pin-Anschluss/);
  assert.match(prepared.item.generatedPlainDescription, /ZUSTAND\nGetestet und voll funktionsfähig\./);
  assert.match(prepared.item.generatedPlainDescription, /VERSAND\nVersicherter Versand mit Sendungsverfolgung\./);
  assert.doesNotMatch(prepared.item.generatedPlainDescription, /Abholung/);
  assert.match(prepared.item.generatedPlainDescription, /Privatverkauf\. Keine Garantie, Gewährleistung oder Rücknahme\./);
  assert.equal(prepared.item.generatedPlainDescription.match(/Originalverpackung/g)?.length, 1);
  assert.equal(prepared.item.generatedPlainDescription.match(/Bedienungsanleitung/g)?.length, 1);
  assert.equal(prepared.item.generatedHtmlDescription.match(/Originalverpackung/g)?.length, 1);
  assert.ok(prepared.item.includedAccessories.every((entry) => entry.id));
  assert.deepEqual(packageValue, packageSnapshot);
});

test("JBL package completes parse, review, canonical preparation, template generation, and one Draft creation", () => {
  const packageValue = validPackage({
    itemName: "JBL On Stage 200iD Lautsprecherdock",
    facts: {
      identity: { brand: "JBL", model: "On Stage 200iD", colour: "Schwarz", measurements: "34 × 12 × 10 cm", compatibilityInfo: "Apple 30-Pin und 3,5-mm-AUX" },
      condition: {
        testedStatus: "Tested working", conditionGrade: "Gut", conditionNotes: "Geprüft.", defectsNotes: "Leichte Gebrauchsspuren.",
        includedAccessories: [
          { name: "Netzteil", type: "charger", titlePriority: false, notes: null },
          { name: "Originalverpackung", type: "original_box", titlePriority: true, notes: null },
          { name: "Bedienungsanleitung", type: "manual", titlePriority: true, notes: null },
        ],
      },
    },
    generated: {
      ebayTitle: "JBL On Stage 200iD Lautsprecherdock OVP Anleitung",
      ebayConditionText: "Getestet und voll funktionsfähig. Leichte Gebrauchsspuren.",
      productDescriptionText: "JBL Lautsprecherdock für kompatible Apple-Geräte.",
      generatedPlainDescription: "Compatibility plain output",
      generatedHtmlDescription: "<p>Compatibility HTML output</p>",
      keyFeatures: "30-Pin-Dock\n3,5-mm-AUX-Eingang",
    },
    recommendations: { category: "Lautsprecherdocks", suggestedListingPrice: 39.99, shippingNotes: "Versicherter Versand mit Sendungsverfolgung." },
    research: { query: "JBL On Stage 200iD gebraucht", low: 25, mid: 35, high: 45, currency: "EUR", summary: "Vergleichbare Angebote geprüft.", sources: ["eBay"] },
  });
  const parsed = parseAndValidateListingPackage(JSON.stringify(packageValue));
  assert.equal(parsed.ok, true);
  const rows = compareListingPackage(parsed, {});
  const selected = rows.filter((row) => row.group !== "Compatibility Output").map((row) => row.id);
  const canonical = prepareCanonicalGptItem(parsed, selected, { purchaseDate: "", purchasePrice: "", sourceName: "", sourceType: "" });
  assert.equal(canonical.validationErrors.length, 0);
  const generated = generateGptItemTemplateOutput(canonical.item);
  assert.equal(generated.ok, true);
  const prepared = prepareGptImportedItem(parsed, selected, { purchaseDate: "", purchasePrice: "", sourceName: "", sourceType: "" });

  assert.equal(prepared.item.name, packageValue.itemName);
  assert.equal(prepared.item.status, "Draft");
  assert.equal(prepared.item.brand, "JBL");
  assert.equal(prepared.item.model, "On Stage 200iD");
  assert.equal(prepared.item.measurements, "34 × 12 × 10 cm");
  assert.equal(prepared.item.compatibilityInfo, "Apple 30-Pin und 3,5-mm-AUX");
  assert.equal(prepared.item.testedStatus, "Tested working");
  assert.equal(prepared.item.conditionGrade, "Gut");
  assert.deepEqual(prepared.item.includedAccessories.map((entry) => entry.name), ["Netzteil", "Originalverpackung", "Bedienungsanleitung"]);
  assert.equal(prepared.item.ebayTitle, packageValue.generated.ebayTitle);
  assert.equal(prepared.item.ebay.conditionText, packageValue.generated.ebayConditionText);
  assert.equal(prepared.item.productDescriptionText, packageValue.generated.productDescriptionText);
  assert.ok(prepared.item.generatedPlainDescription);
  assert.ok(prepared.item.generatedHtmlDescription);
  for (const heading of ["ARTIKEL", "PRODUKTBESCHREIBUNG", "ZUSTAND", "LIEFERUMFANG"]) assert.match(prepared.item.generatedPlainDescription, new RegExp(heading));
  assert.match(prepared.item.ebayTitle, /OVP/);
  assert.match(prepared.item.ebayTitle, /Anleitung/);
  assert.equal(prepared.item.purchaseDate, "");
  assert.equal(prepared.item.purchasePrice, "");
  assert.equal(prepared.item.listingTitle, "");
  assert.equal(prepared.item.conditionText, "");
  assert.equal(prepared.item.includedItems, "");

  let createdCount = 0;
  let committed = false;
  const createOnce = (item) => { if (committed) return; committed = true; createdCount += 1; assert.equal(item.status, "Draft"); };
  createOnce(prepared.item);
  createOnce(prepared.item);
  assert.equal(createdCount, 1);
});

test("template-generation failures are structured and do not throw into the import UI", () => {
  const unreadableItem = new Proxy({}, { get() { throw new Error("template input failure"); } });
  const generated = generateGptItemTemplateOutput(unreadableItem);
  assert.equal(generated.ok, false);
  assert.equal(generated.output, null);
  assert.equal(generated.error.code, "template_generation_failed");
});

test("GPT and manual items with identical canonical inputs produce equivalent local output", () => {
  const validation = validateListingPackage(validPackage({
    itemName: "Sony Walkman",
    generated: { ebayTitle: "Sony Walkman WM-EX500", ebayConditionText: "Guter gebrauchter Zustand.", productDescriptionText: "Kompakter Kassettenspieler.", generatedPlainDescription: "ignored", generatedHtmlDescription: "<p>ignored</p>", keyFeatures: "Auto Reverse" },
    facts: { identity: { brand: "Sony", model: "WM-EX500", measurements: "11 × 8 cm", compatibilityInfo: "Kompaktkassetten" }, condition: { includedAccessories: [{ name: "Anleitung", type: "manual", titlePriority: true, notes: null }] } },
    recommendations: { chosenListingPrice: 60, shippingNotes: "Versicherter Versand." },
  }));
  const selected = validation.mappedFields.filter((field) => field.group !== "Compatibility Output").map((field) => field.id);
  const prepared = prepareGptImportedItem(validation, selected, {});
  const manual = { ...prepared.item, generatedPlainDescription: "", generatedHtmlDescription: "", descriptionText: "", htmlDescription: "" };

  assert.equal(prepared.item.generatedPlainDescription, generateListingDraft(manual, { preferSaved: false }).description);
  assert.equal(prepared.item.generatedHtmlDescription, generateHtmlDescription(manual, { preferSaved: false }));
  assert.equal(listingReadiness(prepared.item), listingReadiness(manual));
});

test("existing-item GPT updates regenerate local outputs without mutating the saved source item", () => {
  const validation = validateListingPackage(validPackage({ generated: { productDescriptionText: "Neue strukturierte Produktübersicht.", generatedPlainDescription: "foreign plain", generatedHtmlDescription: "<p>foreign html</p>" } }));
  const current = normalizeSchemaItem({ id: "existing", name: "Existing", ebayTitle: "Manual title", productDescriptionText: "Old overview", generatedPlainDescription: "Existing saved plain", generatedHtmlDescription: "<p>Existing saved HTML</p>", ebay: { conditionText: "Existing condition", listingId: "keep" }, chosenListingPrice: 10, shippingNotes: "Versand." });
  const snapshot = structuredClone(current);
  const update = prepareGptListingUpdate(validation, ["generated.productDescriptionText", "generated.generatedPlainDescription", "generated.generatedHtmlDescription"], current);

  assert.equal(update.item.ebayTitle, "Manual title");
  assert.equal(update.item.ebay.listingId, "keep");
  assert.match(update.item.generatedPlainDescription, /PRODUKTBESCHREIBUNG\nNeue strukturierte Produktübersicht\./);
  assert.doesNotMatch(update.item.generatedPlainDescription, /foreign plain/);
  assert.doesNotMatch(update.item.generatedHtmlDescription, /foreign html/);
  assert.deepEqual(current, snapshot);
});

test("physical facts remain gated and GPT item preparation does not mutate or import protected domains", () => {
  const packageValue = validPackage({ facts: { identity: { brand: "Sony", colour: "Black" }, condition: { testedStatus: "Tested working" } } });
  const result = validateListingPackage(packageValue);
  const defaults = { status: "Draft", purchasePrice: "", sourceName: "", saleDate: "", finalSalePrice: "", manualEbayFee: "", sellerClassification: "private", evidenceIds: [] };
  const packageSnapshot = structuredClone(packageValue);
  const defaultsSnapshot = structuredClone(defaults);
  const selected = compareListingPackage(result, defaults).filter((row) => row.defaultSelected).map((row) => row.id);
  const prepared = prepareGptImportedItem(result, selected, defaults);

  assert.equal(prepared.item.brand, "");
  assert.equal(prepared.item.colour, "");
  assert.equal(prepared.item.testedStatus, "Not specified");
  for (const field of ["purchasePrice", "sourceName", "saleDate", "finalSalePrice", "manualEbayFee", "sellerClassification", "evidenceIds"]) assert.deepEqual(prepared.item[field], normalizeSchemaItem(defaults)[field]);
  assert.deepEqual(packageValue, packageSnapshot);
  assert.deepEqual(defaults, defaultsSnapshot);
});

test("purchase details readiness is derived without proof or compliance enforcement", () => {
  assert.equal(purchaseDetailsReadiness({ purchaseDate: "2026-01-01", purchasePrice: 10, sourceName: "Seller" }).status, "Purchase Details Complete");
  assert.deepEqual(purchaseDetailsReadiness({ purchaseDate: "", purchasePrice: "", sourceName: "", sourceType: "" }).missingFields, ["Purchase Date", "Purchase Price", "Source / Seller"]);
});

test("Stock Control GPT item creation entry point persists once and opens Purchase", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const tableSource = readFileSync(new URL("../src/components/inventory/InventoryTable.jsx", import.meta.url), "utf8");
  const importSource = readFileSync(new URL("../src/components/inventory/GptItemImport.jsx", import.meta.url), "utf8");
  assert.match(tableSource, /<GptItemImport newItemDefaults=\{gptItemDefaults\} onCreateItem=\{onCreateGptItem\}/);
  assert.match(importSource, />Import GPT Item<\/button>/);
  assert.match(importSource, /stage === "paste"/);
  assert.match(importSource, /stage === "review"/);
  assert.match(importSource, /stage === "confirm"/);
  assert.match(importSource, />Parse & Review<\/button>/);
  assert.match(importSource, />Create Item<\/button>/);
  assert.match(importSource, /prepared\?\.validationErrors/);
  assert.match(importSource, /commitGuard\.current/);
  assert.match(importSource, /disabled=\{committing\}/);
  assert.match(appSource, /function createGptImportedItem\(proposedItem\)/);
  assert.match(appSource, /normalizeItem\(\{ \.\.\.proposedItem, id: crypto\.randomUUID\(\), status: "Draft" \}\)/);
  assert.match(appSource, /persist\(\[createdItem, \.\.\.items\]\)/);
  assert.match(appSource, /setEditingId\(createdItem\.id\)/);
  assert.match(appSource, /setActiveWorkflowSection\("purchase"\)/);
  assert.match(appSource, /GPT item created\. Complete purchase details and review the listing before saving\/finalizing\./);
  assert.match(tableSource, /Needs Purchase Details/);
});
