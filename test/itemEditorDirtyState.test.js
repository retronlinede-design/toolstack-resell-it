import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createItemEditorBaseline,
  draftEigenbelegEditorSnapshot,
  itemEditorHasChanges,
  updateItemEditorBaselineField,
} from "../src/itemEditorDirtyState.js";
import { emptyItem, normalizeItem } from "../src/resellitSchema.js";

test("untouched new and normalized existing editor forms are clean", () => {
  const newForm = { ...emptyItem, ebay: { ...emptyItem.ebay }, includedAccessories: [] };
  const newBaseline = createItemEditorBaseline(newForm);
  assert.equal(itemEditorHasChanges(newForm, newBaseline), false);

  const normalized = normalizeItem({ id: "existing", name: "Camera", conditionText: "Used" });
  const openedForm = { ...normalized, researchQuery: normalized.researchQuery || normalized.ebayTitle || normalized.listingTitle || "" };
  assert.equal(itemEditorHasChanges(openedForm, createItemEditorBaseline(openedForm)), false);
});

test("scalar, nested eBay, accessory, checklist, proof, and GPT-applied changes are dirty", () => {
  const form = normalizeItem({
    id: "item-1",
    name: "Camera",
    ebay: { conditionText: "Used" },
    includedAccessories: [{ id: "a", name: "Charger", type: "accessory", titlePriority: false, notes: "" }],
  });
  const baseline = createItemEditorBaseline(form);
  const variants = [
    { ...form, name: "Edited camera" },
    { ...form, ebay: { ...form.ebay, conditionText: "Edited condition" } },
    { ...form, includedAccessories: [...form.includedAccessories, { id: "b", name: "Case", type: "accessory", titlePriority: false, notes: "" }] },
    { ...form, photoChecklist: { ...form.photoChecklist, front: !form.photoChecklist.front } },
    { ...form, proofFileName: "receipt.jpg" },
    { ...form, ebayTitle: "GPT-applied title", generatedPlainDescription: "Generated locally" },
  ];
  for (const changed of variants) assert.equal(itemEditorHasChanges(changed, baseline), true);
  assert.equal(itemEditorHasChanges(form, baseline), false);
});

test("UI-only state does not participate in item form comparison", () => {
  const form = normalizeItem({ id: "item-1", name: "Camera" });
  const baseline = createItemEditorBaseline(form);
  const uiState = { activeWorkflowSection: "item", previewOpen: false };
  const changedUiState = { ...uiState, activeWorkflowSection: "listing", previewOpen: true };
  assert.notDeepEqual(changedUiState, uiState);
  assert.equal(itemEditorHasChanges(form, baseline), false);
});

test("Personal Collection advances only baseline status and preserves unrelated dirtiness", () => {
  const form = normalizeItem({ id: "item-1", name: "Camera", status: "Draft", notes: "Original" });
  const baseline = createItemEditorBaseline(form);
  const changedForm = { ...form, status: "personal_collection", notes: "Unsaved note" };
  const advancedBaseline = updateItemEditorBaselineField(baseline, "status", "personal_collection");
  assert.equal(advancedBaseline.status, "personal_collection");
  assert.equal(advancedBaseline.notes, "Original");
  assert.equal(itemEditorHasChanges(changedForm, advancedBaseline), true);
  assert.equal(itemEditorHasChanges({ ...form, status: "personal_collection" }, advancedBaseline), false);
});

test("Draft Eigenbeleg snapshots are independent and refresh after their own save", () => {
  const record = { id: "e-1", reasonNoReceipt: "Private sale", sellerDescription: "Seller", acquisitionDescription: "Purchase", generatedText: "Derived" };
  const baseline = draftEigenbelegEditorSnapshot(record);
  const edited = { ...baseline, sellerDescription: "Edited seller" };
  assert.equal(itemEditorHasChanges(edited, baseline), true);
  const refreshed = createItemEditorBaseline(edited);
  assert.equal(itemEditorHasChanges(edited, refreshed), false);
  assert.equal(Object.hasOwn(baseline, "generatedText"), false);
});

test("App guards dismissal and replacement while preserving terminal cleanup paths", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /function closeItemEditorUnconditionally\(\)/);
  assert.match(source, /function requestCloseItemEditor\(\)/);
  assert.match(source, /function requestItemEditorReplacement\(action\)/);
  assert.match(source, /pendingItemEditorActionRef\.current = action/);
  assert.match(source, /function keepEditingItem\(\)/);
  assert.match(source, /function discardItemEditorChanges\(\)/);
  assert.match(source, /onMouseDown=\{\(event\) => \{ if \(event\.target === event\.currentTarget\) requestCloseItemEditor\(\); \}\}/);
  assert.match(source, /onClick=\{requestCloseItemEditor\}[^>]*>Close<\/button>/);
  assert.match(source, /title="Unsaved changes" closeLabel="Keep Editing"/);
  assert.match(source, />Discard Changes<\/button>/);
  assert.match(source, /if \(itemEditorIsDirty \|\| draftEigenbelegIsDirty\)/);
  assert.match(source, /if \(!persist\(next\)\) return;\s*closeItemEditorUnconditionally\(\);/s);
  assert.match(source, /if \(editingId === id \|\| form\.id === id\) closeItemEditorUnconditionally\(\);/);
});

test("editor open paths capture exact baselines and replacements are deferred", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /const openedForm = \{ \.\.\.normalized, researchQuery: normalized\.researchQuery \|\| title \};/);
  assert.match(source, /setItemEditorBaseline\(createItemEditorBaseline\(openedForm\)\)/);
  assert.match(source, /if \(editingId \|\| itemFormOpen\) requestItemEditorReplacement\(openItem\)/);
  assert.match(source, /if \(editingId \|\| itemFormOpen\) requestItemEditorReplacement\(establishNewItemEditor\)/);
  assert.match(source, /const pendingAction = pendingItemEditorActionRef\.current;\s*closeItemEditorUnconditionally\(\);\s*pendingAction\?\.\(\);/s);
  assert.match(source, /openPersistedItemEditor\(createdItem, "purchase"\)/);
});

test("nested and confirmation dialogs own Escape without closing the item editor", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const modalSource = readFileSync(new URL("../src/components/shared/ModalDialog.jsx", import.meta.url), "utf8");
  const gptSource = readFileSync(new URL("../src/components/item-editor/GptListingImport.jsx", import.meta.url), "utf8");
  assert.match(appSource, /document\.querySelector\('\[data-item-editor-nested-dialog="true"\]'\)/);
  assert.match(modalSource, /event\.stopPropagation\(\)/);
  assert.match(gptSource, /data-item-editor-nested-dialog="true"/);
  assert.match(gptSource, /event\.key !== "Escape"/);
  assert.match(gptSource, /event\.stopPropagation\(\)/);
});
