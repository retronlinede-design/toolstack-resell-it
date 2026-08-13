export const INCLUDED_ACCESSORY_TYPES = Object.freeze([
  ["accessory", "Accessory"],
  ["manual", "Manual"],
  ["original_box", "Original Box / OVP"],
  ["case", "Case"],
  ["charger", "Charger"],
  ["cable", "Cable"],
  ["battery", "Battery"],
  ["strap", "Strap"],
  ["remote", "Remote"],
  ["software_media", "Software / Media"],
  ["paperwork", "Paperwork"],
  ["other", "Other"],
]);

export const INCLUDED_ACCESSORY_TYPE_VALUES = Object.freeze(INCLUDED_ACCESSORY_TYPES.map(([value]) => value));

const TITLE_PRIORITY_TYPES = new Set(["manual", "original_box"]);

export function defaultAccessoryTitlePriority(type) {
  return TITLE_PRIORITY_TYPES.has(type);
}

export function createIncludedAccessory(values = {}, idFactory = () => crypto.randomUUID()) {
  const type = INCLUDED_ACCESSORY_TYPE_VALUES.includes(values.type) ? values.type : "accessory";
  return {
    id: String(values.id || idFactory()),
    name: String(values.name || "").trim(),
    type,
    titlePriority: values.titlePriority === undefined ? defaultAccessoryTitlePriority(type) : Boolean(values.titlePriority),
    notes: String(values.notes || "").trim(),
  };
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function inferredType(name) {
  const normalized = String(name).trim().toLowerCase();
  if (/^(bedienungsanleitung|anleitung|manual|instruction manual)$/.test(normalized)) return "manual";
  if (/^(originalverpackung|original box|ovp)$/.test(normalized)) return "original_box";
  if (/^(tasche|carry case|case)$/.test(normalized)) return "case";
  if (/^(original )?(ladegerät|charger)$/.test(normalized)) return "charger";
  if (/^(kabel|cable)$/.test(normalized)) return "cable";
  if (/^(akku|batterie|battery)$/.test(normalized)) return "battery";
  if (/^(gurt|strap)$/.test(normalized)) return "strap";
  if (/^(fernbedienung|remote)$/.test(normalized)) return "remote";
  return "accessory";
}

function legacyParts(value) {
  const text = String(value || "").trim();
  if (!text) return [];
  if (!/[,;\n]/.test(text)) return [text];
  return text.split(/[,;\n]+/).map((part) => part.trim()).filter(Boolean);
}

export function normalizeIncludedAccessories(value, legacyValue = "") {
  const source = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)
    ? legacyValue
    : value;
  const rawEntries = Array.isArray(source) ? source : legacyParts(source);
  const normalized = [];

  rawEntries.forEach((entry, index) => {
    const raw = typeof entry === "string" ? { name: entry } : entry;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
    const name = String(raw.name || "").trim();
    if (!name) return;
    const type = INCLUDED_ACCESSORY_TYPE_VALUES.includes(raw.type) ? raw.type : inferredType(name);
    const fallbackId = `accessory-${stableHash(`${index}:${name.toLowerCase()}:${type}`)}`;
    normalized.push(createIncludedAccessory({ ...raw, id: String(raw.id || fallbackId), name, type }, () => fallbackId));
  });
  return normalized;
}

export function materializeImportedAccessories(entries, idFactory = null) {
  return entries.map((entry, index) => createIncludedAccessory(
    entry,
    idFactory || (() => `accessory-${stableHash(`gpt:${index}:${entry.name.toLowerCase()}:${entry.type}`)}`),
  ));
}

export function includedAccessoryIssues(entries) {
  const normalizedNames = new Map();
  const issues = [];
  (Array.isArray(entries) ? entries : []).forEach((entry, index) => {
    const name = String(entry?.name || "").trim();
    if (!name) {
      issues.push({ code: "blank_name", index, message: "Included item name is required." });
      return;
    }
    const key = name.toLocaleLowerCase();
    if (normalizedNames.has(key)) issues.push({ code: "duplicate_name", index, duplicateOf: normalizedNames.get(key), message: `Duplicate included item: ${name}` });
    else normalizedNames.set(key, index);
  });
  return issues;
}

export function includedAccessoryNames(value, legacyValue = "") {
  return normalizeIncludedAccessories(value, legacyValue).map((entry) => entry.name);
}

export function semanticIncludedAccessories(value) {
  return normalizeIncludedAccessories(value).map((entry) => ({
    name: entry.name.trim().toLocaleLowerCase(),
    type: entry.type,
    titlePriority: entry.titlePriority,
    notes: entry.notes.trim(),
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

export function titlePriorityAccessoryTerms(value, german = true) {
  const labels = german
    ? { original_box: "OVP", manual: "Anleitung", case: "Tasche", charger: "Ladegerät", remote: "Fernbedienung" }
    : { original_box: "Original Box", manual: "Manual", case: "Case", charger: "Charger", remote: "Remote" };
  return normalizeIncludedAccessories(value)
    .filter((entry) => entry.titlePriority)
    .map((entry) => labels[entry.type] || entry.name)
    .filter((term, index, terms) => terms.findIndex((candidate) => candidate.toLocaleLowerCase() === term.toLocaleLowerCase()) === index);
}
