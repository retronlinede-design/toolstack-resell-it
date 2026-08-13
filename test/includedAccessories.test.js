import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createIncludedAccessory,
  defaultAccessoryTitlePriority,
  includedAccessoryIssues,
  normalizeIncludedAccessories,
} from "../src/includedAccessories.js";
import { generateHtmlDescription, generateListingDraft, generatedListingTitle, listingCompleteness } from "../src/ebayListingTemplate.js";
import { emptyItem, normalizeItem } from "../src/resellitSchema.js";

test("structured included accessories default to an empty canonical array", () => {
  assert.deepEqual(emptyItem.includedAccessories, []);
});

test("normalization converts legacy strings, string arrays, and includedItems with stable IDs", () => {
  const stringEntries = normalizeIncludedAccessories("Manual, Original box, Carry case");
  assert.deepEqual(stringEntries.map((entry) => entry.type), ["manual", "original_box", "case"]);
  assert.deepEqual(normalizeIncludedAccessories(["Cable", "Battery"]).map((entry) => entry.name), ["Cable", "Battery"]);
  const legacyItem = normalizeItem({ includedItems: "Manual; Cable" });
  assert.deepEqual(legacyItem.includedAccessories.map((entry) => entry.name), ["Manual", "Cable"]);
  assert.deepEqual(normalizeIncludedAccessories("Manual, Original box, Carry case"), stringEntries);
  assert.equal(legacyItem.includedItems, "Manual; Cable");
});

test("ambiguous legacy prose is preserved as one generic entry", () => {
  const entries = normalizeIncludedAccessories("Includes everything shown in the photographs");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, "Includes everything shown in the photographs");
  assert.equal(entries[0].type, "accessory");
});

test("new rows have stable IDs and type-aware title priority defaults", () => {
  const manual = createIncludedAccessory({ name: "Manual", type: "manual" }, () => "manual-id");
  const box = createIncludedAccessory({ name: "Box", type: "original_box" }, () => "box-id");
  const cable = createIncludedAccessory({ name: "Cable", type: "cable" }, () => "cable-id");
  assert.equal(manual.id, "manual-id");
  assert.equal(manual.titlePriority, true);
  assert.equal(box.titlePriority, true);
  assert.equal(cable.titlePriority, false);
  assert.equal(defaultAccessoryTitlePriority("accessory"), false);
});

test("normalization removes empty rows and diagnostics identify blank and exact duplicate names", () => {
  assert.deepEqual(normalizeIncludedAccessories(["", { name: "  " }, null]), []);
  const issues = includedAccessoryIssues([
    { id: "blank", name: "" },
    { id: "one", name: "Battery 1" },
    { id: "two", name: "battery 1" },
    { id: "three", name: "Battery 2" },
  ]);
  assert.deepEqual(issues.map((issue) => issue.code), ["blank_name", "duplicate_name"]);
});

test("local title generation adds important German completeness terms without displacing core identity", () => {
  const title = generatedListingTitle({
    language: "de",
    brand: "Sony",
    model: "WM-EX500",
    name: "Walkman",
    includedAccessories: [
      { id: "box", name: "Originalverpackung", type: "original_box", titlePriority: true, notes: "" },
      { id: "manual", name: "Bedienungsanleitung", type: "manual", titlePriority: true, notes: "" },
      { id: "cable", name: "Kabel", type: "cable", titlePriority: false, notes: "" },
    ],
  });
  assert.match(title, /^Sony WM-EX500 Walkman/);
  assert.match(title, /OVP/);
  assert.match(title, /Anleitung/);
  assert.doesNotMatch(title, /Kabel/);
  assert.ok(Array.from(title).length <= 80);

  const longCore = generatedListingTitle({ language: "de", brand: "VeryLongImportantBrand", model: "ExtremelyImportantModelNumber12345", name: "Professional Cassette Recorder Device", includedAccessories: [{ id: "box", name: "Box", type: "original_box", titlePriority: true }] });
  assert.match(longCore, /^VeryLongImportantBrand/);
  assert.ok(Array.from(longCore).length <= 80);
});

test("listing descriptions render clean included-item names without internal metadata", () => {
  const item = {
    language: "de",
    name: "Kamera",
    productDescriptionText: "Digitalkamera.",
    conditionText: "Gebraucht.",
    shippingNotes: "Versicherter Versand.",
    includedAccessories: [
      { id: "box-id", name: "Originalverpackung", type: "original_box", titlePriority: true, notes: "leicht berieben" },
      { id: "manual-id", name: "Bedienungsanleitung", type: "manual", titlePriority: true, notes: "" },
    ],
  };
  const draft = generateListingDraft(item, { preferSaved: false });
  const html = generateHtmlDescription(item, { preferSaved: false });
  assert.match(draft.description, /LIEFERUMFANG[\s\S]*- Originalverpackung[\s\S]*- Bedienungsanleitung/);
  assert.match(html, /<li[^>]*>Originalverpackung<\/li>/);
  assert.doesNotMatch(`${draft.description}${html}`, /box-id|manual-id|titlePriority|original_box/);
});

test("listing readiness remains unchanged when accessories are absent", () => {
  const checks = listingCompleteness({ ebayTitle: "Titel", chosenListingPrice: 20, productDescriptionText: "Text", ebay: { conditionText: "Zustand" }, shippingNotes: "Versand", includedAccessories: [] });
  assert.equal(checks.checks.every(([, complete]) => complete), true);
});

test("Item Editor exposes compact structured add, edit, priority, notes, and remove controls without legacy writes", () => {
  const editorSource = readFileSync(new URL("../src/components/item-editor/IncludedAccessoriesEditor.jsx", import.meta.url), "utf8");
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(editorSource, /Add Included Item/);
  assert.match(editorSource, /Included item name/);
  assert.match(editorSource, /Included item type/);
  assert.match(editorSource, /Include in Title/);
  assert.match(editorSource, /Optional Notes/);
  assert.match(editorSource, /entries\.filter\(\(candidate\) => candidate\.id !== entry\.id\)/);
  assert.match(appSource, /<IncludedAccessoriesEditor value=\{form\.includedAccessories\}/);
  assert.doesNotMatch(appSource, /includedItems: form\.includedItems \|\| form\.includedAccessories/);
  assert.doesNotMatch(appSource, /includedItems: e\.target\.value/);
});
