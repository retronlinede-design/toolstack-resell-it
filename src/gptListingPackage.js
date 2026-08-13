import {
  INCLUDED_ACCESSORY_TYPE_VALUES,
  materializeImportedAccessories,
  semanticIncludedAccessories,
} from "./includedAccessories.js";

const FORMAT = "resellit_listing";
const VERSION = 1;
const LANGUAGE = "de";

const REQUIRED_GENERATED_FIELDS = [
  "ebayTitle",
  "ebayConditionText",
  "productDescriptionText",
  "generatedPlainDescription",
];

const TESTED_STATUSES = new Set([
  "Not specified",
  "Tested working",
  "Partially tested",
  "Not tested",
  "Defective / repair needed",
]);

const CONDITION_GRADES = new Set([
  "Neu",
  "Sehr gut",
  "Gut",
  "Akzeptabel",
  "Defekt / Ersatzteile",
  "Sonstiges",
]);

const ALLOWED_KEYS = {
  "": ["format", "version", "language", "facts", "generated", "recommendations", "research"],
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
});

export const LISTING_PACKAGE_FIELD_MAP = Object.freeze([
  field("generated.ebayTitle", "ebayTitle", "eBay Title", "Generated Copy", "safe_generated"),
  field("generated.ebayConditionText", "ebay.conditionText", "eBay Condition Text", "Generated Copy", "review_condition"),
  field("generated.productDescriptionText", "productDescriptionText", "Description & Item Details", "Generated Copy", "safe_generated"),
  field("generated.generatedPlainDescription", "generatedPlainDescription", "Generated Plain Description", "Generated Copy", "safe_generated"),
  field("generated.generatedHtmlDescription", "generatedHtmlDescription", "Generated HTML Description", "Generated Copy", "safe_generated"),
  field("generated.keyFeatures", "keyFeatures", "Key Features", "Generated Copy", "safe_generated"),
  field("facts.identity.brand", "brand", "Brand", "Facts", "review_fact"),
  field("facts.identity.model", "model", "Model", "Facts", "review_fact"),
  field("facts.identity.colour", "colour", "Colour", "Facts", "review_fact"),
  field("facts.identity.measurements", "measurements", "Measurements & Specifications", "Facts", "review_fact"),
  field("facts.identity.compatibilityInfo", "compatibilityInfo", "Compatibility Information", "Facts", "review_fact"),
  field("facts.condition.testedStatus", "testedStatus", "Tested Status", "Condition", "review_fact"),
  field("facts.condition.conditionGrade", "conditionGrade", "Condition Grade", "Condition", "review_fact"),
  field("facts.condition.conditionNotes", "conditionNotes", "Condition Notes", "Condition", "review_condition"),
  field("facts.condition.defectsNotes", "defectsNotes", "Defects & Wear", "Condition", "review_condition"),
  field("facts.condition.includedAccessories", "includedAccessories", "Included Accessories & Items", "Facts", "review_fact"),
  field("recommendations.category", "category", "Category", "Recommendations", "review_recommendation"),
  field("recommendations.suggestedListingPrice", "suggestedListingPrice", "Suggested Listing Price (€)", "Recommendations", "review_recommendation", true),
  field("recommendations.chosenListingPrice", "chosenListingPrice", "Chosen Listing Price (€)", "Recommendations", "review_recommendation", true),
  field("recommendations.shippingNotes", "shippingNotes", "Shipping Notes", "Recommendations", "review_recommendation"),
  field("research.low", "priceResearchLow", "Research Low (€)", "Research", "research_context", true),
  field("research.mid", "priceResearchMid", "Research Mid (€)", "Research", "research_context", true),
  field("research.high", "priceResearchHigh", "Research High (€)", "Research", "research_context", true),
  field("research.summary", "researchNotes", "Research Summary", "Research", "research_context"),
]);

function field(sourcePath, targetPath, label, group, safetyClass, numeric = false) {
  return Object.freeze({ id: sourcePath, sourcePath, targetPath, label, group, safetyClass, numeric });
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
