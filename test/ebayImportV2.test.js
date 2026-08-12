import assert from "node:assert/strict";
import test from "node:test";
import { addMatchSuggestions, compareEbayRecordToItem, generateEbayDuplicateKey, mapEbayRows, markEbayDuplicates, normalizeCsvHeaders, normalizeEbayImportRecord, parseEbayCsv, scoreEbayItemMatches, suggestEbayMappings } from "../src/ebayImport.js";
import { normalizeRootAppData } from "../src/resellitSchema.js";

test("CSV parser handles comma, semicolon, tab, quoted commas, multiline fields, UTF-8, duplicate headers, and blanks", () => {
  const comma = parseEbayCsv('Title,Amount,Notes\n"Kamera, groß",10,"line one\nline two"\n\n');
  assert.equal(comma.delimiter, ","); assert.equal(comma.rows[0].Title, "Kamera, groß"); assert.equal(comma.rows[0].Notes, "line one\nline two"); assert.equal(comma.rows.length, 1);
  assert.equal(parseEbayCsv("Title;Amount\nÄÖÜ;12").delimiter, ";");
  assert.equal(parseEbayCsv("Title\tAmount\nCamera\t12").delimiter, "\t");
  assert.deepEqual(normalizeCsvHeaders(["Title", "Title", ""]), ["Title", "Title (2)", "Column 3"]);
});

test("suggested and explicit mappings normalize rows while preserving unmapped rows", () => {
  const columns = ["Transaction ID", "Item title", "Sale date", "Sold for", "Currency"];
  const suggested = suggestEbayMappings(columns);
  assert.equal(suggested.mappings.transactionId, "Transaction ID"); assert.equal(suggested.confidence.transactionId, 1);
  const rows = [{ "Transaction ID": "T1", "Item title": "Camera", "Sale date": "2026-08-01", "Sold for": "20", Currency: "EUR" }, { "Transaction ID": "", "Item title": "", "Sale date": "", "Sold for": "", Currency: "" }];
  const result = mapEbayRows({ rows, mappings: suggested.mappings, batchId: "b", sourceFileName: "x.csv", importedAt: "now" });
  assert.equal(result[0].mappingStatus, "mapped"); assert.equal(result[0].saleAmount, "20"); assert.equal(result[1].mappingStatus, "needs_review"); assert.deepEqual(result[1].rawRow, rows[1]);
});

test("duplicate keys prioritize transaction ID then order tuple then stable fallback", () => {
  assert.equal(generateEbayDuplicateKey({ transactionId: "ABC" }), "transaction:abc");
  assert.equal(generateEbayDuplicateKey({ orderId: "O1", transactionType: "Sale", saleAmount: "10", saleDate: "2026-01-01" }), generateEbayDuplicateKey({ orderId: "O1", transactionType: "Sale", saleAmount: "10", saleDate: "2026-01-01" }));
  assert.equal(generateEbayDuplicateKey({ itemTitle: "Camera", saleAmount: "10", saleDate: "2026-01-01" }), generateEbayDuplicateKey({ itemTitle: "Camera", saleAmount: "10", saleDate: "2026-01-01" }));
});

test("duplicates are detected within and across batches without deletion", () => {
  const a = normalizeEbayImportRecord({ id: "a", transactionId: "T1" }); const b = normalizeEbayImportRecord({ id: "b", transactionId: "T1" });
  assert.deepEqual(markEbayDuplicates([a, b]).map((entry) => entry.duplicateStatus), ["possible_duplicate", "possible_duplicate"]);
  assert.equal(markEbayDuplicates([b], [a])[0].duplicateStatus, "duplicate");
});

test("matching scores SKU, title, sale amount, date, and reports conflicting candidates", () => {
  const record = normalizeEbayImportRecord({ itemTitle: "Vintage Camera", sku: "SKU-1", saleAmount: "100", saleDate: "2026-08-01" });
  const items = [{ id: "one", name: "Vintage Camera", sku: "SKU-1", finalSalePrice: "100.00", saleDate: "2026-08-01", status: "Sold", buyerPlatform: "ebay" }, { id: "two", name: "Vintage Camera", sku: "SKU-1", finalSalePrice: "100", saleDate: "2026-08-01", status: "Sold", buyerPlatform: "ebay" }];
  const scores = scoreEbayItemMatches(record, items); assert.equal(scores[0].score, 100); assert.ok(scores[0].reasons.includes("SKU or eBay identifier match"));
  assert.equal(addMatchSuggestions([record], items)[0].matchStatus, "conflict");
});

test("confirmed review state persists in normalized data without mutating items", () => {
  const item = { id: "item-1", name: "Camera", finalSalePrice: "50", saleDate: "2026-08-01", status: "Complete" }; const before = structuredClone(item);
  const record = normalizeEbayImportRecord({ id: "r", matchStatus: "confirmed", resolutionStatus: "resolved", matchedItemId: item.id, saleAmount: "55", saleDate: "2026-08-02" });
  assert.equal(record.matchStatus, "confirmed"); assert.deepEqual(item, before);
  const comparison = compareEbayRecordToItem(record, item); assert.equal(comparison.find((entry) => entry.field === "Sale Amount").status, "Different");
});

test("old backups and old raw batches remain compatible with empty V2 collections", () => {
  const old = normalizeRootAppData({ version: 2, items: [], expenses: [] }); assert.deepEqual(old.normalizedEbayRecords, []); assert.deepEqual(old.ebayMappingProfiles, []);
  const restored = normalizeRootAppData({ version: 2, items: [], expenses: [], normalizedEbayRecords: [{ id: "r" }], ebayMappingProfiles: [{ id: "p" }] }); assert.equal(restored.normalizedEbayRecords.length, 1); assert.equal(restored.ebayMappingProfiles.length, 1);
});
