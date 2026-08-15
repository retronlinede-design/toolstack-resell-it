import {
  INCLUDED_ACCESSORY_TYPE_VALUES,
  materializeImportedAccessories,
  semanticIncludedAccessories,
} from "./includedAccessories.js";
import { generateListingDraft, listingReadiness } from "./ebayListingTemplate.js";
import { normalizeItem } from "./resellitSchema.js";

const FORMAT = "resellit_listing";
const VERSION = 1;
const LANGUAGE = "de";

const REQUIRED_GENERATED_FIELDS = [
  "ebayTitle",
  "ebayConditionText",
  "productDescriptionText",
  "generatedPlainDescription",
];

export const TESTED_STATUS_VALUES = Object.freeze([
  "Not specified",
  "Tested working",
  "Partially tested",
  "Not tested",
  "Defective / repair needed",
]);
const TESTED_STATUSES = new Set(TESTED_STATUS_VALUES);

export const CONDITION_GRADE_VALUES = Object.freeze([
  "Neu",
  "Sehr gut",
  "Gut",
  "Akzeptabel",
  "Defekt / Ersatzteile",
  "Sonstiges",
]);
const CONDITION_GRADES = new Set(CONDITION_GRADE_VALUES);

const ALLOWED_KEYS = {
  "": ["format", "version", "language", "itemName", "facts", "generated", "recommendations", "research"],
  facts: ["identity", "condition"],
  "facts.identity": ["brand", "model", "colour", "measurements", "compatibilityInfo"],
  "facts.condition": ["testedStatus", "conditionGrade", "conditionNotes", "defectsNotes", "includedAccessories"],
  generated: ["ebayTitle", "ebayConditionText", "productDescriptionText", "generatedPlainDescription", "generatedHtmlDescription", "keyFeatures"],
  recommendations: ["category", "suggestedListingPrice", "chosenListingPrice", "shippingNotes", "listingStrategy"],
  research: ["query", "low", "mid", "high", "currency", "summary", "sources"],
};

const REQUIRED_OBJECTS = ["facts", "facts.identity", "facts.condition", "generated", "recommendations", "research"];
const PLACEHOLDERS = new Set(["unknown", "n/a", "not provided"]);
const PROTECTED_NAMES = new Set([
  "id", "itemId", "status", "personalCollection", "purchaseDate", "purchasePrice", "sourceType", "sourceName",
  "sourceLocation", "sourcePlatform", "paymentMethod", "purchaseTransactionId", "purchaseAllocationId",
  "purchaseTransactions", "purchaseAllocations", "saleDate", "finalSalePrice", "salePrice", "buyerPlatform",
  "buyerName", "transactionId", "orderId", "ebayTransactionId", "ebayFees", "manualEbayFee", "estimatedEbayFee",
  "ebayFeeMode", "promotedListingFee", "promotedFeePercent", "otherPlatformFees", "shippingChargedToBuyer",
  "actualShippingCost", "shippingCost", "packagingCost", "payoutAmount", "refundAmount", "refundDate",
  "refundReason", "returnPostageCost", "classification", "sellerClassification", "businessRelevance", "compliance",
  "complianceStatus", "hasReceipt", "receiptType", "proofType", "proofDate", "proofAmount", "proofNotes",
  "evidenceIds", "evidenceRecords", "purchaseRecords", "eigenbelege", "createdAt", "updatedAt", "importedAt",
  "migratedFromLegacyItem", "photoChecklist",
]);

export const LISTING_PACKAGE_READINESS_METADATA = Object.freeze({
  descriptionRequiredField: "productDescriptionText",
  generatedDescriptionField: "generatedPlainDescription",
  generatedDescriptionAloneSatisfiesReadiness: false,
  finalDescriptionOwner: "resellit_template",
  packageGeneratedDescriptionsAuthoritativeForNewItems: false,
  productDescriptionScope: "concise_product_overview_only",
});

export const LISTING_PACKAGE_FIELD_MAP = Object.freeze([
  field("itemName", "name", "Item Name", "Listing Inputs", "safe_generated", { editor: "text", required: true }),
  field("generated.ebayTitle", "ebayTitle", "eBay Title", "Listing Inputs", "safe_generated", { editor: "text", required: true }),
  field("generated.ebayConditionText", "ebay.conditionText", "eBay Condition Text", "Listing Inputs", "review_condition", { editor: "textarea", required: true }),
  field("generated.productDescriptionText", "productDescriptionText", "Product Description", "Listing Inputs", "safe_generated", { editor: "textarea", required: true }),
  field("generated.generatedPlainDescription", "generatedPlainDescription", "Deprecated Package Plain Description", "Compatibility Output", "deprecated_output", { editor: "readonly" }),
  field("generated.generatedHtmlDescription", "generatedHtmlDescription", "Deprecated Package HTML Description", "Compatibility Output", "deprecated_output", { editor: "readonly" }),
  field("generated.keyFeatures", "keyFeatures", "Key Features", "Listing Inputs", "safe_generated", { editor: "textarea" }),
  field("facts.identity.brand", "brand", "Brand", "Facts", "review_fact", { editor: "text" }),
  field("facts.identity.model", "model", "Model", "Facts", "review_fact", { editor: "text" }),
  field("facts.identity.colour", "colour", "Colour", "Facts", "review_fact", { editor: "text" }),
  field("facts.identity.measurements", "measurements", "Measurements & Specifications", "Facts", "review_fact", { editor: "text" }),
  field("facts.identity.compatibilityInfo", "compatibilityInfo", "Compatibility Information", "Facts", "review_fact", { editor: "textarea" }),
  field("facts.condition.testedStatus", "testedStatus", "Tested Status", "Condition", "review_fact", { editor: "select", options: TESTED_STATUS_VALUES }),
  field("facts.condition.conditionGrade", "conditionGrade", "Condition Grade", "Condition", "review_fact", { editor: "select", options: CONDITION_GRADE_VALUES }),
  field("facts.condition.conditionNotes", "conditionNotes", "Condition Notes", "Condition", "review_condition", { editor: "textarea" }),
  field("facts.condition.defectsNotes", "defectsNotes", "Defects & Wear", "Condition", "review_condition", { editor: "textarea" }),
  field("facts.condition.includedAccessories", "includedAccessories", "Included Accessories & Items", "Facts", "review_fact", { editor: "readonly" }),
  field("recommendations.category", "category", "Category", "Recommendations", "review_recommendation", { editor: "text" }),
  field("recommendations.suggestedListingPrice", "suggestedListingPrice", "Suggested Listing Price (€)", "Recommendations", "review_recommendation", { editor: "number" }),
  field("recommendations.chosenListingPrice", "chosenListingPrice", "Chosen Listing Price (€)", "Recommendations", "review_recommendation", { editor: "number" }),
  field("recommendations.shippingNotes", "shippingNotes", "Shipping Notes", "Recommendations", "review_recommendation", { editor: "textarea" }),
  field("research.low", "priceResearchLow", "Research Low (€)", "Research", "research_context", { editor: "number" }),
  field("research.mid", "priceResearchMid", "Research Mid (€)", "Research", "research_context", { editor: "number" }),
  field("research.high", "priceResearchHigh", "Research High (€)", "Research", "research_context", { editor: "number" }),
  field("research.summary", "researchNotes", "Research Summary", "Research", "research_context", { editor: "textarea" }),
]);

function field(sourcePath, targetPath, label, group, safetyClass, config = {}) {
  const { editor = "readonly", required = false, options = null } = config;
  return Object.freeze({ id: sourcePath, sourcePath, targetPath, label, group, safetyClass, numeric: editor === "number", editor, required, options });
}

function diagnostic(code, path, message, kind = "invalid") {
  return { code, path, message, kind };
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function getPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function setPath(target, path, value) {
  const keys = path.split(".");
  let cursor = target;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) cursor[key] = value;
    else cursor = cursor[key] ||= {};
  });
}

function normalizedWhitespace(value) {
  return String(value).trim().replace(/\s+/gu, " ");
}

function isPlaceholder(value) {
  return typeof value === "string" && PLACEHOLDERS.has(normalizedWhitespace(value).toLowerCase());
}

function looksProtected(path) {
  const parts = path.split(".");
  const key = parts.at(-1);
  if (PROTECTED_NAMES.has(key)) return true;
  return parts.some((part) => /^(purchase|source|payment|sale|buyer|order|transaction|refund|payout|proof|receipt|evidence|eigenbeleg|compliance|classification|fee|shipping|packaging|photoChecklist|ids?$)/i.test(part)
    || /(?:created|updated|imported|migrated)At$/i.test(part));
}

function inspectKeys(value, path, errors, protectedKeys) {
  if (!isPlainObject(value)) return;
  const allowed = new Set(ALLOWED_KEYS[path] || []);
  for (const key of Object.keys(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (!allowed.has(key)) {
      if (looksProtected(childPath)) {
        protectedKeys.push(childPath);
        errors.push(diagnostic("protected_key", childPath, `Protected field is not allowed: ${childPath}`, "protected"));
      } else {
        errors.push(diagnostic("unknown_key", childPath, `Unknown field is not allowed: ${childPath}`));
      }
      continue;
    }
    if (ALLOWED_KEYS[childPath]) inspectKeys(value[key], childPath, errors, protectedKeys);
  }
}

function validateOptionalString(value, path, errors) {
  if (value === undefined || value === null) return;
  if (typeof value !== "string") {
    errors.push(diagnostic("invalid_type", path, `${path} must be a string or null`));
    return;
  }
  if (!value.trim() || isPlaceholder(value)) errors.push(diagnostic("invalid_optional_value", path, `${path} must use null instead of an empty or placeholder value`));
}

function validateNumber(value, path, errors) {
  if (value === undefined || value === null) return;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(diagnostic("invalid_number", path, `${path} must be a finite JSON number or null`));
  } else if (value < 0) {
    errors.push(diagnostic("negative_number", path, `${path} cannot be negative`));
  }
}

function hasUnsafeHtml(html) {
  return /<\s*\/?\s*(script|iframe|form)\b/i.test(html)
    || /\son[a-z]+\s*=/i.test(html)
    || /(?:href|src|action)\s*=\s*["']?\s*javascript:/i.test(html);
}

function normalizePackage(source) {
  const result = structuredClone(source);
  result.itemName = result.itemName.trim();
  result.generated.ebayTitle = normalizedWhitespace(result.generated.ebayTitle);
  for (const key of REQUIRED_GENERATED_FIELDS.filter((key) => key !== "ebayTitle")) result.generated[key] = result.generated[key].trim();
  if (Array.isArray(result.facts.condition.includedAccessories)) {
    result.facts.condition.includedAccessories = result.facts.condition.includedAccessories.map((entry) => ({
      name: entry.name.trim(),
      type: entry.type,
      titlePriority: entry.titlePriority,
      notes: entry.notes === null ? null : entry.notes.trim(),
    }));
  }
  return result;
}

function validatePackageAccessories(value, errors) {
  const path = "facts.condition.includedAccessories";
  if (value === undefined || value === null) return;
  if (typeof value === "string") {
    if (!value.trim() || isPlaceholder(value)) errors.push(diagnostic("invalid_accessories", path, `${path} legacy string must be non-empty`));
    return;
  }
  if (!Array.isArray(value)) {
    errors.push(diagnostic("invalid_accessories", path, `${path} must be an array, legacy string, or null`));
    return;
  }
  const names = new Set();
  value.forEach((entry, index) => {
    const entryPath = `${path}.${index}`;
    if (!isPlainObject(entry)) {
      errors.push(diagnostic("invalid_accessory_entry", entryPath, "Included accessory must be an object"));
      return;
    }
    for (const key of Object.keys(entry)) {
      if (!["name", "type", "titlePriority", "notes"].includes(key)) {
        errors.push(diagnostic(key === "id" ? "accessory_id_forbidden" : "unknown_key", `${entryPath}.${key}`, key === "id" ? "GPT packages must not provide included accessory IDs" : `Unknown included accessory field: ${key}`));
      }
    }
    if (typeof entry.name !== "string" || !entry.name.trim() || isPlaceholder(entry.name)) errors.push(diagnostic("invalid_accessory_name", `${entryPath}.name`, "Included accessory name must be non-empty"));
    else {
      const normalizedName = normalizedWhitespace(entry.name).toLocaleLowerCase();
      if (names.has(normalizedName)) errors.push(diagnostic("duplicate_accessory", `${entryPath}.name`, `Duplicate included accessory: ${entry.name}`));
      names.add(normalizedName);
    }
    if (!INCLUDED_ACCESSORY_TYPE_VALUES.includes(entry.type)) errors.push(diagnostic("invalid_accessory_type", `${entryPath}.type`, "Invalid included accessory type"));
    if (typeof entry.titlePriority !== "boolean") errors.push(diagnostic("invalid_accessory_priority", `${entryPath}.titlePriority`, "titlePriority must be boolean"));
    if (entry.notes !== null && typeof entry.notes !== "string") errors.push(diagnostic("invalid_accessory_notes", `${entryPath}.notes`, "notes must be a string or null"));
    if (typeof entry.notes === "string" && (!entry.notes.trim() || isPlaceholder(entry.notes))) errors.push(diagnostic("invalid_accessory_notes", `${entryPath}.notes`, "Use null instead of empty or placeholder notes"));
  });
}

function mappedProposals(packageValue) {
  return LISTING_PACKAGE_FIELD_MAP.flatMap((definition) => {
    const value = getPath(packageValue, definition.sourcePath);
    if (value === null || value === undefined || (typeof value === "string" && !value.trim())) return [];
    return [{ ...definition, value }];
  });
}

export function parseListingPackage(text) {
  const errors = [];
  if (typeof text !== "string") return { ok: false, value: null, errors: [diagnostic("invalid_input", "", "Listing Package input must be text")] };
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, value: null, errors: [diagnostic("empty_input", "", "Listing Package input is empty")] };
  if (trimmed.startsWith("```") || trimmed.endsWith("```")) return { ok: false, value: null, errors: [diagnostic("markdown_fence", "", "Markdown code fences are not allowed")] };
  let value;
  try {
    value = JSON.parse(trimmed);
  } catch {
    return { ok: false, value: null, errors: [diagnostic("malformed_json", "", "Input must contain exactly one valid JSON object with no surrounding commentary")] };
  }
  if (!isPlainObject(value)) errors.push(diagnostic("invalid_root", "", "Listing Package root must be one JSON object"));
  return { ok: errors.length === 0, value: errors.length ? null : value, errors };
}

export function validateListingPackage(source) {
  const errors = [];
  const warnings = [];
  const protectedKeys = [];
  if (!isPlainObject(source)) {
    return { ok: false, package: null, errors: [diagnostic("invalid_root", "", "Listing Package root must be one JSON object")], warnings, protectedKeys, mappedFields: [], metadata: LISTING_PACKAGE_READINESS_METADATA };
  }

  inspectKeys(source, "", errors, protectedKeys);
  if (source.format !== FORMAT) errors.push(diagnostic("unsupported_format", "format", `format must be ${FORMAT}`));
  if (source.version !== VERSION) errors.push(diagnostic("unsupported_version", "version", `version must be ${VERSION}`));
  if (source.language !== LANGUAGE) errors.push(diagnostic("unsupported_language", "language", `language must be ${LANGUAGE}`));
  if (typeof source.itemName !== "string" || !source.itemName.trim() || isPlaceholder(source.itemName)) errors.push(diagnostic("missing_item_name", "itemName", "itemName must be a non-empty string"));

  for (const path of REQUIRED_OBJECTS) {
    if (!isPlainObject(getPath(source, path))) errors.push(diagnostic("missing_object", path, `${path} must be an object`));
  }
  if (errors.some((error) => error.code === "missing_object")) {
    return { ok: false, package: null, errors, warnings, protectedKeys, mappedFields: [], metadata: LISTING_PACKAGE_READINESS_METADATA };
  }

  for (const key of REQUIRED_GENERATED_FIELDS) {
    const path = `generated.${key}`;
    const value = source.generated[key];
    if (typeof value !== "string" || !value.trim() || isPlaceholder(value)) errors.push(diagnostic("missing_generated_field", path, `${path} must be a non-empty string`));
  }

  if (typeof source.generated.ebayTitle === "string" && Array.from(normalizedWhitespace(source.generated.ebayTitle)).length > 80) {
    errors.push(diagnostic("title_too_long", "generated.ebayTitle", "eBay title must be at most 80 Unicode characters"));
  }

  for (const path of [
    "facts.identity.brand", "facts.identity.model", "facts.identity.colour", "facts.identity.measurements", "facts.identity.compatibilityInfo",
    "facts.condition.conditionNotes", "facts.condition.defectsNotes",
    "generated.generatedHtmlDescription", "generated.keyFeatures", "recommendations.category", "recommendations.shippingNotes",
    "recommendations.listingStrategy", "research.query", "research.summary",
  ]) validateOptionalString(getPath(source, path), path, errors);
  validatePackageAccessories(source.facts.condition.includedAccessories, errors);

  const testedStatus = source.facts.condition.testedStatus;
  if (testedStatus !== undefined && testedStatus !== null && !TESTED_STATUSES.has(testedStatus)) errors.push(diagnostic("invalid_enum", "facts.condition.testedStatus", "Invalid testedStatus value"));
  const conditionGrade = source.facts.condition.conditionGrade;
  if (conditionGrade !== undefined && conditionGrade !== null && !CONDITION_GRADES.has(conditionGrade)) errors.push(diagnostic("invalid_enum", "facts.condition.conditionGrade", "Invalid conditionGrade value"));

  for (const path of ["recommendations.suggestedListingPrice", "recommendations.chosenListingPrice", "research.low", "research.mid", "research.high"]) {
    validateNumber(getPath(source, path), path, errors);
  }
  if (source.research.currency !== "EUR") errors.push(diagnostic("invalid_currency", "research.currency", "research.currency must be EUR"));
  if (source.research.sources !== undefined && (!Array.isArray(source.research.sources) || source.research.sources.some((entry) => typeof entry !== "string" || !entry.trim() || isPlaceholder(entry)))) {
    errors.push(diagnostic("invalid_sources", "research.sources", "research.sources must be an array of non-empty strings"));
  }
  if ([source.research.low, source.research.mid, source.research.high].every((value) => typeof value === "number" && Number.isFinite(value))
    && !(source.research.low <= source.research.mid && source.research.mid <= source.research.high)) {
    errors.push(diagnostic("invalid_research_order", "research", "Research values must satisfy low <= mid <= high"));
  }
  if (typeof source.generated.generatedHtmlDescription === "string" && hasUnsafeHtml(source.generated.generatedHtmlDescription)) {
    errors.push(diagnostic("unsafe_html", "generated.generatedHtmlDescription", "Generated HTML contains active or unsafe content"));
  }

  const packageValue = errors.length ? null : normalizePackage(source);
  return {
    ok: errors.length === 0,
    package: packageValue,
    errors,
    warnings,
    protectedKeys,
    mappedFields: packageValue ? mappedProposals(packageValue) : [],
    metadata: LISTING_PACKAGE_READINESS_METADATA,
  };
}

export function parseAndValidateListingPackage(text) {
  const parsed = parseListingPackage(text);
  if (!parsed.ok) return { ok: false, package: null, errors: parsed.errors, warnings: [], protectedKeys: [], mappedFields: [], metadata: LISTING_PACKAGE_READINESS_METADATA };
  return validateListingPackage(parsed.value);
}

export function buildReviewedListingPackage(validationResult, reviewOverrides = {}) {
  if (!validationResult?.ok || !validationResult.package) {
    return validationResult || { ok: false, package: null, errors: [diagnostic("invalid_result", "", "A validated Listing Package is required")], warnings: [], protectedKeys: [], mappedFields: [], metadata: LISTING_PACKAGE_READINESS_METADATA };
  }

  const originalMappedIds = new Set((validationResult.mappedFields || []).map((proposal) => proposal.id));
  const editableFields = new Map(LISTING_PACKAGE_FIELD_MAP.filter((definition) => definition.editor !== "readonly").map((definition) => [definition.sourcePath, definition]));
  const candidate = structuredClone(validationResult.package);
  const overrideErrors = [];

  for (const [sourcePath, value] of Object.entries(reviewOverrides || {})) {
    if (!editableFields.has(sourcePath) || !originalMappedIds.has(sourcePath)) {
      overrideErrors.push(diagnostic("invalid_review_override", sourcePath, `Field cannot be edited during review: ${sourcePath}`));
      continue;
    }
    setPath(candidate, sourcePath, structuredClone(value));
  }

  const revalidated = validateListingPackage(candidate);
  const mappedFields = LISTING_PACKAGE_FIELD_MAP
    .filter((definition) => originalMappedIds.has(definition.id))
    .map((definition) => ({ ...definition, value: getPath(candidate, definition.sourcePath) }));
  const errors = [...overrideErrors, ...revalidated.errors];
  return {
    ...revalidated,
    ok: errors.length === 0,
    package: errors.length === 0 ? revalidated.package : null,
    errors,
    mappedFields,
  };
}

function valuesEqual(currentValue, packageValue, numeric, targetPath) {
  if (targetPath === "includedAccessories") {
    return JSON.stringify(semanticIncludedAccessories(currentValue)) === JSON.stringify(semanticIncludedAccessories(packageValue));
  }
  if (numeric) {
    if (currentValue === "" || currentValue === null || currentValue === undefined) return false;
    const currentNumber = Number(currentValue);
    return Number.isFinite(currentNumber) && currentNumber === packageValue;
  }
  if (typeof currentValue === "string" && typeof packageValue === "string") return normalizedWhitespace(currentValue) === normalizedWhitespace(packageValue);
  return Object.is(currentValue, packageValue);
}

function isEmpty(value) {
  return value === undefined || value === null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0);
}

export function compareListingPackage(validationResult, currentItem = {}) {
  const item = isPlainObject(currentItem) ? currentItem : {};
  const rows = (validationResult.mappedFields || []).map((proposal) => {
    const currentValue = getPath(item, proposal.targetPath);
    const state = isEmpty(currentValue) ? "New" : valuesEqual(currentValue, proposal.value, proposal.numeric, proposal.targetPath) ? "Same" : "Different";
    const defaultSelected = state === "New" && ["safe_generated", "research_context"].includes(proposal.safetyClass);
    return {
      id: proposal.id,
      field: proposal.targetPath,
      label: proposal.label,
      group: proposal.group,
      currentValue: currentValue ?? null,
      packageValue: proposal.value,
      state,
      safetyClass: proposal.safetyClass,
      sourcePath: proposal.sourcePath,
      editor: proposal.editor,
      required: proposal.required,
      options: proposal.options,
      defaultSelected,
      disabled: state === "Same",
      reason: state === "New" ? (defaultSelected ? "Safe empty target" : "Manual review required") : state === "Same" ? "Values are equivalent" : "Existing value requires explicit approval",
    };
  });
  const diagnosticRows = (validationResult.errors || []).filter((error) => error.path).map((error) => ({
    id: `diagnostic:${error.path}`,
    field: error.path,
    label: error.path,
    group: error.kind === "protected" ? "Protected" : "Invalid",
    currentValue: null,
    packageValue: null,
    state: error.kind === "protected" ? "Protected" : "Invalid",
    safetyClass: null,
    defaultSelected: false,
    disabled: true,
    reason: error.message,
  }));
  return [...rows, ...diagnosticRows];
}

export function prepareListingPackagePatch(validationResult, currentItem, selectedFieldIds = []) {
  const errors = validationResult?.errors || [diagnostic("invalid_result", "", "A validated Listing Package is required")];
  if (!validationResult?.ok) return { patch: {}, changedFields: [], skippedFields: [], conflicts: [], validationErrors: errors };
  const selected = new Set(selectedFieldIds);
  const rows = compareListingPackage(validationResult, currentItem);
  const patch = {};
  const changedFields = [];
  const skippedFields = [];
  const conflicts = rows.filter((row) => row.state === "Different").map((row) => row.field);

  for (const row of rows) {
    if ((row.state === "New" || row.state === "Different") && selected.has(row.id)) {
      const patchValue = row.field === "includedAccessories"
        ? materializeImportedAccessories(typeof row.packageValue === "string" ? [{ name: row.packageValue, type: "accessory", titlePriority: false, notes: "" }] : row.packageValue)
        : structuredClone(row.packageValue);
      setPath(patch, row.field, patchValue);
      changedFields.push(row.field);
    } else {
      skippedFields.push(row.field);
    }
  }
  return { patch, changedFields, skippedFields, conflicts, validationErrors: [] };
}

export function applyListingPackagePatchToItem(item, patch) {
  const source = isPlainObject(item) ? item : {};
  const proposed = { ...source, ...(isPlainObject(patch) ? patch : {}) };
  if (isPlainObject(patch?.ebay)) proposed.ebay = { ...(isPlainObject(source.ebay) ? source.ebay : {}), ...patch.ebay };
  return proposed;
}

export function purchaseDetailsReadiness(item) {
  const missingFields = [
    !String(item?.purchaseDate || "").trim() && "Purchase Date",
    (item?.purchasePrice === "" || item?.purchasePrice === null || item?.purchasePrice === undefined) && "Purchase Price",
    !String(item?.sourceName || item?.sourceType || "").trim() && "Source / Seller",
  ].filter(Boolean);
  return { status: missingFields.length ? "Needs Purchase Details" : "Purchase Details Complete", missingFields };
}

const NON_AUTHORITATIVE_OUTPUT_IDS = new Set([
  "generated.generatedPlainDescription",
  "generated.generatedHtmlDescription",
]);

function structuredSelection(selectedFieldIds) {
  return (Array.isArray(selectedFieldIds) ? selectedFieldIds : []).filter((id) => !NON_AUTHORITATIVE_OUTPUT_IDS.has(id));
}

export function generateGptItemTemplateOutput(item) {
  try {
    const draft = generateListingDraft(item, { preferSaved: false });
    if (!String(draft.description || "").trim() || !String(draft.htmlDescription || "").trim()) {
      return { ok: false, output: null, error: diagnostic("template_generation_failed", "generated", "ResellIt could not generate the final plain and HTML descriptions.") };
    }
    return {
      ok: true,
      output: {
        generatedPlainDescription: draft.description,
        generatedHtmlDescription: draft.htmlDescription,
      },
      error: null,
    };
  } catch {
    return { ok: false, output: null, error: diagnostic("template_generation_failed", "generated", "ResellIt could not generate the final plain and HTML descriptions. Review the selected fields and try again.") };
  }
}

export function prepareCanonicalGptItem(validationResult, selectedFieldIds, newItemDefaults = {}) {
  if (!validationResult?.ok) return { item: null, prepared: null, validationErrors: validationResult?.errors || [diagnostic("invalid_result", "", "A validated Listing Package is required")] };
  const prepared = prepareListingPackagePatch(validationResult, newItemDefaults, structuredSelection(selectedFieldIds));
  if (prepared.validationErrors.length) return { item: null, prepared, validationErrors: prepared.validationErrors };
  const item = normalizeItem(applyListingPackagePatchToItem({ ...newItemDefaults, status: "Draft", language: "de" }, prepared.patch));
  if (!String(item.name || "").trim()) return { item: null, prepared, validationErrors: [diagnostic("item_name_not_selected", "itemName", "Item Name must be selected to create the item")] };
  return { item, prepared, validationErrors: [] };
}

export function prepareGptListingUpdate(validationResult, selectedFieldIds, currentItem = {}) {
  const prepared = prepareListingPackagePatch(validationResult, currentItem, structuredSelection(selectedFieldIds));
  if (prepared.validationErrors.length) return { item: null, patch: {}, ...prepared };
  const structuredItem = applyListingPackagePatchToItem(currentItem, prepared.patch);
  const generated = generateGptItemTemplateOutput(structuredItem);
  if (!generated.ok) return { item: null, patch: {}, changedFields: prepared.changedFields, skippedFields: prepared.skippedFields, conflicts: prepared.conflicts, validationErrors: [generated.error] };
  const output = generated.output;
  return {
    item: { ...structuredItem, ...output },
    patch: { ...prepared.patch, ...output },
    changedFields: [...prepared.changedFields, "generatedPlainDescription", "generatedHtmlDescription"],
    skippedFields: prepared.skippedFields,
    conflicts: prepared.conflicts,
    validationErrors: [],
  };
}

export function prepareGptImportedItem(validationResult, selectedFieldIds, newItemDefaults = {}) {
  const canonical = prepareCanonicalGptItem(validationResult, selectedFieldIds, newItemDefaults);
  const prepared = canonical.prepared;
  if (canonical.validationErrors.length) return { item: null, appliedFields: prepared?.changedFields || [], skippedFields: prepared?.skippedFields || [], listingReadiness: "Needs Listing Information", purchaseDetailsReadiness: purchaseDetailsReadiness(canonical.item || newItemDefaults), validationErrors: canonical.validationErrors };
  const generated = generateGptItemTemplateOutput(canonical.item);
  if (!generated.ok) return { item: null, appliedFields: prepared.changedFields, skippedFields: prepared.skippedFields, listingReadiness: "Needs Listing Information", purchaseDetailsReadiness: purchaseDetailsReadiness(canonical.item), validationErrors: [generated.error] };
  const proposed = { ...canonical.item, ...generated.output };
  const readiness = listingReadiness(proposed);
  return {
    item: proposed,
    appliedFields: prepared.changedFields,
    skippedFields: prepared.skippedFields,
    listingReadiness: readiness === "Ready" ? "Ready for Listing" : "Needs Listing Information",
    purchaseDetailsReadiness: purchaseDetailsReadiness(proposed),
    validationErrors: [],
  };
}
