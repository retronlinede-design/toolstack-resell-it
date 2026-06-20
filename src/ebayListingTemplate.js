import {
  defaultDefectDisclosure,
  defectDisclosureItems,
  ebayConditionText,
  itemClassification,
  languageLabel,
  normalizeBooleanRecord,
  normalizeListingLanguageValue,
} from "./resellitLogic.js";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bulletLines(value) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function listingLanguage(item) {
  return languageLabel(normalizeListingLanguageValue(item));
}

export function isGermanListing(item) {
  return listingLanguage(item) === "German";
}

export function listingLabels(item) {
  return isGermanListing(item)
    ? {
      title: "Titel",
      condition: "Zustand",
      description: "Beschreibung",
      included: "Lieferumfang",
      shipping: "Versand",
      notes: "Hinweise",
      brand: "Marke",
      model: "Modell",
      sizeSpecs: "Größe / Spezifikation",
      colour: "Farbe",
      category: "Kategorie",
      price: "Angebotspreis",
      defects: "Mängel / Gebrauchsspuren",
      researchNotes: "Recherchehinweise",
      copyTitle: "Titel kopieren",
      copyCondition: "Zustand kopieren",
      copyDescription: "Beschreibung kopieren",
      copyHtmlDescription: "HTML-Beschreibung kopieren",
      missing: "Fehlt",
      exists: "Vorhanden",
      notSpecified: "Nicht angegeben",
      noSourceFields: "Noch keine Quelldaten eingetragen",
      preview: "HTML-Beschreibung Vorschau",
    }
    : {
      title: "Title",
      condition: "Condition",
      description: "Description",
      included: "What is included",
      shipping: "Shipping",
      notes: "Notes",
      brand: "Brand",
      model: "Model",
      sizeSpecs: "Size / specs",
      colour: "Colour",
      category: "Category",
      price: "Listing price",
      defects: "Defects / wear",
      researchNotes: "Research notes",
      copyTitle: "Copy title",
      copyCondition: "Copy condition",
      copyDescription: "Copy plain description",
      copyHtmlDescription: "Copy HTML description",
      missing: "Missing",
      exists: "Exists",
      notSpecified: "Not specified",
      noSourceFields: "No source fields added yet",
      preview: "HTML description preview",
    };
}

function compactWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncateTitle(value, limit = 80) {
  const clean = compactWhitespace(value);
  if (clean.length <= limit) return clean;
  const words = clean.split(" ");
  const kept = [];
  for (const word of words) {
    const candidate = [...kept, word].join(" ");
    if (candidate.length > limit) break;
    kept.push(word);
  }
  return kept.join(" ") || clean.slice(0, limit).trim();
}

export function generatedListingTitle(item) {
  const manualTitle = compactWhitespace(item.ebayTitle || item.listingTitle);
  if (manualTitle) return truncateTitle(manualTitle);

  const features = bulletLines(item.keyFeatures).slice(0, 2);
  const condition = isGermanListing(item)
    ? germanConditionGrade(item.conditionGrade)
    : item.conditionGrade;
  const parts = [
    item.brand,
    item.model,
    item.name,
    item.category,
    ...features,
    condition,
  ].map(compactWhitespace).filter(Boolean);
  const deduped = parts.filter((part, index) => parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index);
  return truncateTitle(deduped.join(" "));
}

export function germanConditionGrade(grade) {
  const normalized = String(grade || "").trim().toLowerCase();
  if (!normalized) return "";
  if (["new", "neu", "brand new", "new with tags", "new in box", "nib"].includes(normalized)) return "Neu";
  if (["like new", "as new", "mint", "neuwertig"].includes(normalized)) return "Neuwertig";
  if (["very good", "sehr gut"].includes(normalized)) return "Sehr guter gebrauchter Zustand";
  if (["good", "gut"].includes(normalized)) return "Guter gebrauchter Zustand";
  if (["used", "pre-owned", "preowned", "gebraucht"].includes(normalized)) return "Gebraucht";
  if (["fair", "acceptable", "akzeptabel"].includes(normalized)) return "Akzeptabler gebrauchter Zustand";
  if (["for parts", "defective", "defekt", "parts only"].includes(normalized)) return "Als defekt / für Ersatzteile";
  return grade;
}

export function generatedConditionBaseText(item) {
  if (isGermanListing(item)) {
    return germanConditionGrade(item.conditionGrade) || "";
  }
  return item.conditionGrade || "";
}

function selectedDefectLabels(item) {
  const flags = normalizeBooleanRecord(item.defectDisclosure, defaultDefectDisclosure);
  return defectDisclosureItems
    .filter(([key]) => flags[key])
    .map(([, label]) => label);
}

function generatedDefectDisclosureText(item) {
  const selected = selectedDefectLabels(item);
  if (!selected.length) return "";
  if (isGermanListing(item)) {
    const translations = {
      scratches: "Kratzer",
      dents: "Dellen",
      cracks: "Risse",
      discoloration: "Verfärbungen",
      "missing parts": "fehlende Teile",
      "not tested": "nicht getestet",
      "partially working": "teilweise funktionsfähig",
      "repair needed": "reparaturbedürftig",
      other: "sonstige Mängel",
    };
    return `Geprüfte Mängel: ${selected.map((label) => translations[label] || label).join(", ")}.`;
  }
  return `Reviewed defects: ${selected.join(", ")}.`;
}

function conditionDetailLines(item) {
  const labels = listingLabels(item);
  return [
    item.testedStatus && item.testedStatus !== "Not specified" && `${isGermanListing(item) ? "Teststatus" : "Tested status"}: ${item.testedStatus}`,
    generatedDefectDisclosureText(item),
    item.conditionNotes,
    item.defectsNotes && `${labels.defects}: ${item.defectsNotes}`,
  ].filter(Boolean);
}

export function generatedConditionText(item) {
  const manualCondition = ebayConditionText(item).trim();
  if (manualCondition) return manualCondition;
  const baseCondition = generatedConditionBaseText(item);
  return [baseCondition, ...conditionDetailLines(item)].filter(Boolean).join("\n") || (isGermanListing(item) ? "Bitte Zustand selbst prüfen und Beschreibung beachten." : "Please review the description for condition details.");
}

function privateSellerNote(item) {
  return isGermanListing(item)
    ? "Privatverkauf. Keine Garantie, Gewährleistung oder Rücknahme."
    : "Private sale. No warranty, guarantee, or returns.";
}

export function listingSectionHeadings(item) {
  return isGermanListing(item)
    ? { article: "ARTIKEL", productDescription: "PRODUKTBESCHREIBUNG", condition: "ZUSTAND", included: "LIEFERUMFANG", shipping: "VERSAND", notes: "HINWEISE" }
    : { article: "ITEM", productDescription: "ABOUT THE ITEM", condition: "CONDITION", included: "WHAT IS INCLUDED", shipping: "SHIPPING", notes: "NOTES" };
}

function htmlParagraphs(lines) {
  return lines.map((line) => `      <p style="margin:0 0 8px;">${escapeHtml(line).replaceAll("\n", "<br>")}</p>`).join("\n");
}

function htmlBulletList(lines) {
  return [
    '      <ul style="margin:0;padding-left:18px;">',
    ...lines.map((line) => `        <li style="margin:0 0 5px;">${escapeHtml(line)}</li>`),
    "      </ul>",
  ].join("\n");
}

function htmlRetroSection(heading, colour, contentHtml) {
  return [
    `    <div style="border-left:5px solid ${colour};background:#fffdf5;margin:0 0 12px;padding:12px 12px 10px;border-radius:4px;">`,
    `      <h3 style="margin:0 0 8px;font-size:15px;letter-spacing:.04em;color:#2b211d;font-weight:700;">${escapeHtml(heading)}</h3>`,
    contentHtml,
    "    </div>",
  ].join("\n");
}

function stripPickupCollectionWording(value) {
  return String(value || "")
    .split(/\r?\n|(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter((line) => line && !/\b(local\s+pickup|pickup|collection|abholung|selbstabholung)\b/i.test(line))
    .join("\n");
}

export function listingShippingText(item) {
  return stripPickupCollectionWording(item.shippingNotes) || (isGermanListing(item) ? "Versicherter Versand mit Sendungsverfolgung." : "Tracked shipping.");
}

function productDescriptionLines(item) {
  const labels = listingLabels(item);
  const explicitDescription = String(item.productDescriptionText || "").trim();
  const compatibility = String(item.compatibilityInfo || "").trim();
  const features = bulletLines(item.keyFeatures);
  const identity = [item.brand, item.model, item.name].filter(Boolean).join(" ");
  const categoryLine = item.category && (isGermanListing(item)
    ? `${identity || item.name || "Der Artikel"} gehört zur Kategorie ${item.category}.`
    : `${identity || item.name || "This item"} is in the ${item.category} category.`);
  const specs = [
    (item.measurements || item.sizeSpecs) && `${labels.sizeSpecs}: ${item.measurements || item.sizeSpecs}`,
    item.colour && `${labels.colour}: ${item.colour}`,
  ].filter(Boolean);
  const modelLine = item.model && item.brand && (isGermanListing(item)
    ? `Hersteller/Modell: ${item.brand} ${item.model}.`
    : `Maker/model: ${item.brand} ${item.model}.`);
  const compatibilityLine = compatibility && (isGermanListing(item)
    ? `Kompatibilität / Plattform: ${compatibility}`
    : `Compatibility / platform: ${compatibility}`);
  const featureLines = features;

  return [
    explicitDescription,
    compatibilityLine,
    ...featureLines,
    ...(explicitDescription ? specs : [categoryLine, modelLine, ...specs]),
  ].filter(Boolean);
}

export function generateHtmlDescription(item, { preferSaved = true } = {}) {
  const labels = listingLabels(item);
  const headings = listingSectionHeadings(item);
  const condition = generatedConditionText(item, { preferSaved });
  const articleLines = [
    generatedListingTitle(item),
    [labels.brand, item.brand],
    [labels.model, item.model],
    [labels.category, item.category],
    [labels.sizeSpecs, item.measurements || item.sizeSpecs],
    [labels.colour, item.colour],
  ].map((entry) => Array.isArray(entry) ? entry : ["", entry])
    .filter(([, value]) => value)
    .map(([label, value]) => label ? `${label}: ${value}` : value);
  const productLines = productDescriptionLines(item);
  const included = bulletLines(item.includedAccessories || item.includedItems);
  const shippingLines = [listingShippingText(item)];
  const notes = [
    item.notes,
    itemClassification(item) === "Private Sale / Personal Collection" && privateSellerNote(item),
  ].filter(Boolean);
  const notesLines = notes.length ? notes : [isGermanListing(item) ? "Keine weiteren Hinweise." : "No additional notes."];
  const includedLines = included.length ? included : [isGermanListing(item) ? "Lieferumfang wie beschrieben." : "Included as described."];

  return [
    '<div style="background:#2b1b14;padding:14px 10px;margin:0 auto;max-width:720px;">',
    '  <div style="max-width:700px;margin:0 auto;background:#fff8e8;color:#2b211d;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;border:1px solid #d8c4a4;border-radius:6px;overflow:hidden;">',
    '    <div style="height:6px;background:#2f9d9a;border-bottom:3px solid #e0b947;"></div>',
    '    <div style="height:3px;background:#d9783b;border-bottom:3px solid #b7412e;"></div>',
    '    <div style="padding:16px;">',
    `      <h2 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#2b211d;font-weight:700;">${escapeHtml(generatedListingTitle(item))}</h2>`,
    htmlRetroSection(headings.article, "#2f9d9a", htmlParagraphs(articleLines)),
    productLines.length ? htmlRetroSection(headings.productDescription, "#e0b947", htmlParagraphs(productLines)) : "",
    htmlRetroSection(headings.condition, "#e0b947", htmlParagraphs([condition])),
    htmlRetroSection(headings.included, "#d9783b", htmlBulletList(includedLines)),
    htmlRetroSection(headings.shipping, "#b7412e", htmlParagraphs(shippingLines)),
    htmlRetroSection(headings.notes, "#2f9d9a", htmlParagraphs(notesLines)),
    "    </div>",
    "  </div>",
    "</div>",
  ].filter(Boolean).join("\n");
}

function generatedPlainDescription(item, condition) {
  const labels = listingLabels(item);
  const headings = listingSectionHeadings(item);
  const articleLines = [
    generatedListingTitle(item),
    item.name && `${isGermanListing(item) ? "Artikel" : "Item"}: ${item.name}`,
    item.brand && `${labels.brand}: ${item.brand}`,
    item.model && `${labels.model}: ${item.model}`,
    item.category && `${labels.category}: ${item.category}`,
    (item.measurements || item.sizeSpecs) && `${labels.sizeSpecs}: ${item.measurements || item.sizeSpecs}`,
    item.colour && `${labels.colour}: ${item.colour}`,
  ].filter(Boolean);
  const productLines = productDescriptionLines(item);
  const includedLines = bulletLines(item.includedAccessories || item.includedItems);
  const notesLines = [
    item.notes,
    itemClassification(item) === "Private Sale / Personal Collection" && privateSellerNote(item),
  ].filter(Boolean);
  const sections = [
    [headings.article, articleLines],
    productLines.length && [headings.productDescription, productLines],
    [headings.condition, [condition]],
    [headings.included, includedLines.length ? includedLines.map((line) => `- ${line}`) : [isGermanListing(item) ? "Lieferumfang wie beschrieben." : "Included as described."]],
    [headings.shipping, [listingShippingText(item)]],
    [headings.notes, notesLines.length ? notesLines : [isGermanListing(item) ? "Keine weiteren Hinweise." : "No additional notes."]],
  ].filter(Boolean);

  return sections.map(([heading, lines]) => [heading, ...lines].join("\n")).join("\n\n");
}

export function generateListingDraft(item, { preferSaved = true } = {}) {
  const title = generatedListingTitle(item);
  const condition = generatedConditionText(item, { preferSaved });
  const generatedDescription = generatedPlainDescription(item, condition);
  const description = preferSaved ? item.generatedPlainDescription || item.descriptionText || generatedDescription : generatedDescription;
  const htmlDescription = generateHtmlDescription(item, { preferSaved });

  return {
    title,
    condition,
    description,
    htmlDescription: preferSaved ? item.generatedHtmlDescription || item.htmlDescription || htmlDescription : htmlDescription,
  };
}

export function listingCompleteness(item) {
  const checks = [
    ["eBay Title", Boolean(String(item.ebayTitle || item.listingTitle || generatedListingTitle(item) || "").trim())],
    ["Price", Boolean(item.chosenListingPrice)],
    ["Description / Item Details", Boolean(String(item.productDescriptionText || "").trim())],
    ["Condition Text", Boolean(ebayConditionText(item).trim())],
    ["Shipping Notes", Boolean(String(item.shippingNotes || "").trim())],
  ];
  const completeCount = checks.filter(([, done]) => done).length;
  return {
    checks,
    percent: Math.round((completeCount / checks.length) * 100),
  };
}

function listingPack(item) {
  const draft = generateListingDraft(item);
  return {
    title: item.ebayTitle || item.listingTitle || draft.title,
    price: item.chosenListingPrice || "",
    condition: ebayConditionText(item) || draft.condition,
    plainDescription: item.generatedPlainDescription || item.descriptionText || draft.description,
    htmlDescription: item.generatedHtmlDescription || item.htmlDescription || draft.htmlDescription,
    shippingNotes: item.shippingNotes || "",
  };
}

export function listingWarnings(item) {
  const pack = listingPack(item);
  const { checks } = listingCompleteness(item);
  return [
    ...checks.filter(([, done]) => !done).map(([label]) => `${label} is missing`),
    pack.title.length > 80 && "Title is over 80 characters",
    hasLanguageMismatch(item) && "Language may not match the selected listing language",
  ].filter(Boolean);
}

function hasLanguageMismatch(item) {
  const pack = listingPack(item);
  const text = `${pack.condition}\n${pack.plainDescription}\n${pack.shippingNotes}`.toLowerCase();
  if (!text.trim()) return false;
  if (normalizeListingLanguageValue(item) === "de") {
    return /\b(item|condition|shipping|included|description|private sale|no warranty)\b/.test(text);
  }
  return /\b(zustand|versand|lieferumfang|beschreibung|privatverkauf|hinweise)\b/.test(text);
}

export function listingReadiness(item) {
  const warnings = listingWarnings(item);
  const { checks } = listingCompleteness(item);
  if (checks.some(([, done]) => !done)) return "Missing required fields";
  if (warnings.length) return "Needs info";
  return "Ready";
}

export function hasListingPreviewInput(item) {
  return Boolean(item.generatedHtmlDescription || item.htmlDescription || item.generatedPlainDescription || item.descriptionText || generatedListingTitle(item) || item.conditionGrade || item.conditionNotes || item.defectsNotes || item.includedAccessories || item.includedItems || item.shippingNotes || item.notes || item.productDescriptionText || item.compatibilityInfo || item.keyFeatures);
}
