import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  generateHtmlDescription,
  generateListingDraft,
  generatedConditionText,
} from "../src/ebayListingTemplate.js";
import {
  CURRENT_DATE,
  DEFAULT_CLASSIFICATION,
  DEFAULT_EBAY_FEE_MODE,
  DEFAULT_LANGUAGE,
  DEFAULT_LISTING_LANGUAGE,
  createDraftEigenbelegForItem,
  defaultEigenbeleg,
  defaultEvidenceRecord,
  defaultItem,
  defaultPurchaseRecord,
  eigenbelegFromLegacyItem,
  emptyItem,
  emptyEigenbeleg,
  emptyEvidenceRecord,
  emptyPurchaseRecord,
  evidenceRecordFromLegacyItem,
  getComplianceSummary,
  getItemTaxReadiness,
  isBusinessRelevant,
  isValidEigenbeleg,
  isValidEvidenceRecord,
  isValidPurchaseRecord,
  itemRequiresEigenbeleg,
  normalizeEigenbeleg,
  normalizeEvidenceRecord,
  normalizeItem as normalizeSchemaItem,
  normalizePurchaseRecord,
  normalizeRootAppData,
  purchaseRecordFromLegacyItem,
  scaffoldTaxComplianceRecordsFromItems,
  sellerClassificationLabel,
  sellerClassificationOptions,
  statusLabel,
  statusOptions,
  validateEigenbeleg,
  validateEvidenceRecord,
  validatePurchaseRecord,
} from "../src/resellitSchema.js";
import {
  MAX_LEGACY_PROOF_IMAGE_BYTES,
  duplicateItemForDraft,
  ebayConditionText,
  hasListingDraft,
  isActiveStockItem,
  isFullBackupPayload,
  isSoldStatus,
  itemStatus,
  itemStatusValue,
  markListingNeeded,
  normalizeItem,
  platformFees,
  sanitizeHtmlPreview,
  summarizeSoldPerformance,
} from "../src/resellitLogic.js";

test("emptyItem and defaultItem schema shape remains stable", () => {
  const expectedKeys = [
    "name",
    "category",
    "classification",
    "sellerClassification",
    "sourceType",
    "sourceName",
    "sourceLocation",
    "purchaseDate",
    "purchasePrice",
    "hasReceipt",
    "receiptType",
    "paymentMethod",
    "expectedSalePrice",
    "status",
    "ebayTitle",
    "saleDate",
    "salePrice",
    "finalSalePrice",
    "buyerPlatform",
    "shippingChargedToBuyer",
    "actualShippingCost",
    "packagingCost",
    "carrier",
    "trackingNumber",
    "shippedDate",
    "trackingNotes",
    "refundAmount",
    "refundDate",
    "returnPostageCost",
    "refundReason",
    "ebayFees",
    "ebayFeeMode",
    "feePercent",
    "fixedFee",
    "estimatedEbayFee",
    "manualEbayFee",
    "promotedListingFee",
    "otherPlatformFees",
    "shippingCost",
    "proofType",
    "proofDate",
    "proofAmount",
    "proofNotes",
    "noReceiptReason",
    "proofImageDataUrl",
    "proofImageName",
    "proofFileName",
    "proofFolderLocation",
    "proofStoredExternally",
    "researchQuery",
    "researchedLowPrice",
    "researchedMidPrice",
    "researchedHighPrice",
    "chosenListingPrice",
    "priceResearchNotes",
    "priceResearchUpdatedAt",
    "language",
    "listingLanguage",
    "listingTitle",
    "ebay",
    "brand",
    "model",
    "sizeSpecs",
    "measurements",
    "colour",
    "productDescriptionText",
    "compatibilityInfo",
    "keyFeatures",
    "conditionGrade",
    "conditionText",
    "conditionNotes",
    "defectDisclosure",
    "descriptionText",
    "htmlDescription",
    "generatedPlainDescription",
    "generatedHtmlDescription",
    "includedItems",
    "includedAccessories",
    "defectsNotes",
    "testedStatus",
    "shippingNotes",
    "photoChecklist",
    "priceResearchLow",
    "priceResearchMid",
    "priceResearchHigh",
    "researchBrand",
    "researchModel",
    "researchReference",
    "researchYear",
    "researchEAN",
    "researchSerial",
    "researchNotes",
    "suggestedListingPrice",
    "minimumAcceptPrice",
    "researchConfidence",
    "notes",
  ];

  assert.equal(defaultItem, emptyItem);
  assert.deepEqual(Object.keys(emptyItem), expectedKeys);
  assert.deepEqual(emptyItem.ebay, { conditionText: "" });
  assert.equal(emptyItem.purchaseDate, CURRENT_DATE);
  assert.equal(emptyItem.proofDate, CURRENT_DATE);
  assert.equal(emptyItem.classification, DEFAULT_CLASSIFICATION);
  assert.equal(emptyItem.sellerClassification, "private");
  assert.equal(emptyItem.ebayFeeMode, DEFAULT_EBAY_FEE_MODE);
  assert.equal(emptyItem.language, DEFAULT_LANGUAGE);
  assert.equal(emptyItem.listingLanguage, DEFAULT_LISTING_LANGUAGE);
});

test("seller classification defaults and labels remain stable", () => {
  assert.deepEqual(sellerClassificationOptions, [
    ["private", "Private Sale"],
    ["pre_registration", "Pre-Registration Stock"],
    ["business", "Business Stock"],
    ["excluded", "Excluded"],
  ]);
  assert.equal(sellerClassificationLabel("private"), "Private Sale");
  assert.equal(sellerClassificationLabel("pre_registration"), "Pre-Registration Stock");
  assert.equal(sellerClassificationLabel("business"), "Business Stock");
  assert.equal(sellerClassificationLabel("excluded"), "Excluded");
  assert.equal(sellerClassificationLabel("bad"), "Private Sale");
});

test("personal_collection status normalizes and displays correctly", () => {
  assert.ok(statusOptions.includes("personal_collection"));
  assert.equal(statusLabel("personal_collection"), "Personal Collection");

  const item = normalizeSchemaItem({ name: "Archive item", status: "personal_collection" });
  assert.equal(item.status, "personal_collection");
  assert.equal(itemStatusValue(item), "personal_collection");
  assert.equal(itemStatus(item), "Personal Collection");

  const legacyItem = normalizeSchemaItem({ name: "Legacy archive item", status: "Personal Collection" });
  assert.equal(legacyItem.status, "personal_collection");
});

test("personal_collection items are excluded from active stock helpers", () => {
  assert.equal(isActiveStockItem({ status: "Draft" }), true);
  assert.equal(isActiveStockItem({ status: "personal_collection" }), false);
  assert.equal(isActiveStockItem(normalizeSchemaItem({ status: "Personal Collection" })), false);
});

test("schema normalization migrates legacy conditionText into ebay.conditionText", () => {
  const item = normalizeSchemaItem({
    conditionText: "Legacy condition description",
  });

  assert.equal(item.ebay.conditionText, "Legacy condition description");
});

test("schema normalization migrates missing sellerClassification to private", () => {
  assert.equal(normalizeSchemaItem({ name: "Legacy item" }).sellerClassification, "private");
  assert.equal(normalizeSchemaItem({ name: "Business item", sellerClassification: "business" }).sellerClassification, "business");
  assert.equal(normalizeSchemaItem({ name: "Invalid item", sellerClassification: "unknown" }).sellerClassification, "private");
});

test("business inclusion follows seller classification", () => {
  assert.equal(isBusinessRelevant({ sellerClassification: "private" }), false);
  assert.equal(isBusinessRelevant({ sellerClassification: "excluded" }), false);
  assert.equal(isBusinessRelevant({ sellerClassification: "pre_registration" }), true);
  assert.equal(isBusinessRelevant({ sellerClassification: "business" }), true);
  assert.equal(isBusinessRelevant({}), false);
});

test("item tax readiness marks private and excluded items not applicable", () => {
  assert.deepEqual(getItemTaxReadiness({ id: "private-1", sellerClassification: "private" }, [], [], []), {
    status: "not_applicable",
    issues: [],
    purchaseRecordPresent: false,
    evidencePresent: false,
    eigenbelegRequired: true,
    eigenbelegPresent: false,
  });
  assert.equal(getItemTaxReadiness({ id: "excluded-1", sellerClassification: "excluded" }, [], [], []).status, "not_applicable");
});

test("item tax readiness detects ready business records", () => {
  const item = normalizeSchemaItem({
    id: "item-1",
    sellerClassification: "business",
    hasReceipt: "Yes",
    proofType: "Shop receipt",
    receiptType: "Shop receipt",
  });
  const readiness = getItemTaxReadiness(
    item,
    [{ itemId: "item-1", grossPurchasePrice: "12" }],
    [{ itemId: "item-1", evidenceStatus: "Available" }],
    [],
  );

  assert.deepEqual(readiness, {
    status: "ready",
    issues: [],
    purchaseRecordPresent: true,
    evidencePresent: true,
    eigenbelegRequired: false,
    eigenbelegPresent: false,
  });
});

test("item tax readiness detects incomplete and eigenbeleg states", () => {
  const incomplete = getItemTaxReadiness(
    { id: "item-1", sellerClassification: "business", hasReceipt: "Yes", proofType: "Shop receipt", receiptType: "Shop receipt" },
    [],
    [{ itemId: "item-1", evidenceStatus: "Missing" }],
    [],
  );
  assert.equal(incomplete.status, "incomplete");
  assert.deepEqual(incomplete.issues, ["purchase_record_missing", "evidence_missing"]);

  const needsEigenbeleg = getItemTaxReadiness(
    { id: "item-2", sellerClassification: "pre_registration", hasReceipt: "No", proofType: "Eigenbeleg", receiptType: "Eigenbeleg needed" },
    [{ itemId: "item-2", grossPurchasePrice: "20" }],
    [{ itemId: "item-2", evidenceStatus: "Available" }],
    [],
  );
  assert.equal(itemRequiresEigenbeleg({ hasReceipt: "No" }), true);
  assert.equal(needsEigenbeleg.status, "needs_eigenbeleg");
  assert.deepEqual(needsEigenbeleg.issues, ["eigenbeleg_missing"]);

  const readyWithEigenbeleg = getItemTaxReadiness(
    { id: "item-2", sellerClassification: "pre_registration", hasReceipt: "No", proofType: "Eigenbeleg", receiptType: "Eigenbeleg needed" },
    [{ itemId: "item-2", grossPurchasePrice: "20" }],
    [{ itemId: "item-2", evidenceStatus: "Available" }],
    [{ itemId: "item-2", purchaseRecordId: "purchase-2", reasonNoReceipt: "No receipt", amount: "20", status: "Generated" }],
  );
  assert.equal(readyWithEigenbeleg.status, "ready");
  assert.equal(readyWithEigenbeleg.eigenbelegPresent, true);
});

test("compliance summary counts item readiness states", () => {
  const items = [
    { id: "ready", sellerClassification: "business", hasReceipt: "Yes", proofType: "Shop receipt", receiptType: "Shop receipt" },
    { id: "incomplete", sellerClassification: "business", hasReceipt: "Yes", proofType: "Shop receipt", receiptType: "Shop receipt" },
    { id: "needs-eigenbeleg", sellerClassification: "pre_registration", hasReceipt: "No", proofType: "Eigenbeleg", receiptType: "Eigenbeleg needed" },
    { id: "not-applicable", sellerClassification: "private" },
  ];
  const summary = getComplianceSummary(
    items,
    [
      { itemId: "ready", grossPurchasePrice: "12" },
      { itemId: "needs-eigenbeleg", grossPurchasePrice: "20" },
    ],
    [
      { itemId: "ready", evidenceStatus: "Available" },
      { itemId: "needs-eigenbeleg", evidenceStatus: "Available" },
    ],
    [],
  );

  assert.deepEqual(summary, {
    ready: 1,
    incomplete: 1,
    needsEigenbeleg: 1,
    notApplicable: 1,
  });
});

test("draft Eigenbeleg generation uses item data when no purchase record exists", () => {
  const draft = createDraftEigenbelegForItem({
    id: "item-1",
    name: "Vintage camera",
    sellerClassification: "business",
    sourceType: "Flea market",
    sourceName: "Sunday market",
    sourceLocation: "Berlin",
    purchaseDate: "2026-06-10",
    purchasePrice: "25",
    paymentMethod: "Cash",
    hasReceipt: "No",
    proofType: "Eigenbeleg",
    receiptType: "Eigenbeleg needed",
  }, [], []);

  assert.equal(draft.itemId, "item-1");
  assert.equal(draft.purchaseRecordId, "");
  assert.equal(draft.purchaseDate, "2026-06-10");
  assert.equal(draft.amount, "25");
  assert.equal(draft.paymentMethod, "Cash");
  assert.equal(draft.reasonNoReceipt, "Purchased from a private seller. No receipt was available.");
  assert.equal(draft.status, "draft");
  assert.match(draft.generatedText, /Vintage camera/);
  assert.match(draft.generatedText, /Sunday market/);
  assert.match(draft.generatedText, /Berlin/);
  assert.match(draft.generatedText, /Private seller/);
});

test("draft Eigenbeleg generation links purchase and evidence records", () => {
  const draft = createDraftEigenbelegForItem(
    { id: "item-1", name: "Vintage camera", sellerClassification: "business", purchaseDate: "2026-06-10", purchasePrice: "25" },
    [{
      id: "purchase-1",
      itemId: "item-1",
      sourceSessionId: "session-1",
      purchaseDate: "2026-06-05",
      allocatedPurchaseCost: "22",
      grossPurchasePrice: "24",
      currency: "EUR",
      paymentMethod: "Cash",
      sellerType: "Private seller",
      sourceName: "Seller A",
      sourceLocation: "Munich",
    }],
    [{ id: "evidence-1", itemId: "item-1", evidenceType: "Seller message", evidenceStatus: "Available", title: "Chat screenshot" }],
  );

  assert.equal(draft.itemId, "item-1");
  assert.equal(draft.purchaseRecordId, "purchase-1");
  assert.equal(draft.sourceSessionId, "session-1");
  assert.equal(draft.purchaseDate, "2026-06-05");
  assert.equal(draft.amount, "22");
  assert.equal(draft.currency, "EUR");
  assert.deepEqual(draft.evidenceIds, ["evidence-1"]);
  assert.equal(draft.sellerDescription, "Private seller - Seller A");
  assert.match(draft.acquisitionDescription, /Vintage camera/);
  assert.match(draft.acquisitionDescription, /Munich/);
  assert.match(draft.generatedText, /Seller message: Chat screenshot/);
});

test("compliance readiness detects generated draft Eigenbeleg", () => {
  const item = {
    id: "item-1",
    name: "Vintage camera",
    sellerClassification: "business",
    hasReceipt: "No",
    proofType: "Eigenbeleg",
    receiptType: "Eigenbeleg needed",
  };
  const purchaseRecords = [{ id: "purchase-1", itemId: "item-1", grossPurchasePrice: "20" }];
  const evidenceRecords = [{ id: "evidence-1", itemId: "item-1", evidenceStatus: "Available" }];
  const draft = createDraftEigenbelegForItem(item, purchaseRecords, evidenceRecords);
  const readiness = getItemTaxReadiness(item, purchaseRecords, evidenceRecords, [draft]);

  assert.equal(readiness.status, "ready");
  assert.equal(readiness.eigenbelegPresent, true);
});

test("tax compliance schema defaults remain stable", () => {
  assert.equal(defaultPurchaseRecord, emptyPurchaseRecord);
  assert.equal(defaultEvidenceRecord, emptyEvidenceRecord);
  assert.equal(defaultEigenbeleg, emptyEigenbeleg);

  assert.deepEqual(Object.keys(emptyPurchaseRecord), [
    "id",
    "itemId",
    "sourceSessionId",
    "purchaseDate",
    "purchaseType",
    "sellerName",
    "sellerType",
    "sourceName",
    "sourceLocation",
    "sourcePlatform",
    "grossPurchasePrice",
    "allocatedPurchaseCost",
    "currency",
    "paymentMethod",
    "receiptStatus",
    "proofStatus",
    "evidenceIds",
    "notes",
    "migratedFromLegacyItem",
    "createdAt",
    "updatedAt",
  ]);
  assert.deepEqual(Object.keys(emptyEvidenceRecord), [
    "id",
    "itemId",
    "purchaseRecordId",
    "sourceSessionId",
    "expenseId",
    "ebayTransactionId",
    "evidenceType",
    "evidenceStatus",
    "title",
    "documentDate",
    "issuer",
    "amount",
    "currency",
    "storageType",
    "fileName",
    "mimeType",
    "fileSize",
    "indexedDbBlobKey",
    "externalPath",
    "externalUrl",
    "notes",
    "migratedFromLegacyItem",
    "createdAt",
    "updatedAt",
  ]);
  assert.deepEqual(Object.keys(emptyEigenbeleg), [
    "id",
    "itemId",
    "purchaseRecordId",
    "sourceSessionId",
    "language",
    "generationType",
    "sellerDescription",
    "acquisitionDescription",
    "reasonNoReceipt",
    "purchaseDate",
    "amount",
    "currency",
    "paymentMethod",
    "evidenceIds",
    "generatedText",
    "generatedHtml",
    "pdfEvidenceId",
    "status",
    "finalizedAt",
    "migratedFromLegacyItem",
    "createdAt",
    "updatedAt",
  ]);
});

test("tax compliance schema normalization keeps safe defaults and arrays", () => {
  assert.deepEqual(normalizePurchaseRecord({ itemId: "item-1", grossPurchasePrice: "12", evidenceIds: [" proof-1 ", "", null] }), {
    ...emptyPurchaseRecord,
    itemId: "item-1",
    grossPurchasePrice: "12",
    allocatedPurchaseCost: "12",
    evidenceIds: ["proof-1"],
  });

  assert.deepEqual(normalizeEvidenceRecord({ itemId: "item-1", storageType: "bad", evidenceType: "bad", evidenceStatus: "bad" }), {
    ...emptyEvidenceRecord,
    itemId: "item-1",
  });

  assert.deepEqual(normalizeEigenbeleg({ itemId: "item-1", purchaseRecordId: "purchase-1", language: "English", amount: "12", evidenceIds: ["evidence-1"] }), {
    ...emptyEigenbeleg,
    itemId: "item-1",
    purchaseRecordId: "purchase-1",
    language: "en",
    amount: "12",
    evidenceIds: ["evidence-1"],
  });
});

test("tax compliance validation helpers report required fields", () => {
  assert.deepEqual(validatePurchaseRecord(emptyPurchaseRecord), [
    "itemId is required",
    "grossPurchasePrice or allocatedPurchaseCost is required",
  ]);
  assert.deepEqual(validateEvidenceRecord({ ...emptyEvidenceRecord, itemId: "item-1", storageType: "indexeddb" }), [
    "indexedDbBlobKey is required for indexeddb evidence",
  ]);
  assert.deepEqual(validateEigenbeleg(emptyEigenbeleg), [
    "itemId is required",
    "purchaseRecordId is required",
    "reasonNoReceipt is required",
    "amount is required",
  ]);

  assert.equal(isValidPurchaseRecord({ itemId: "item-1", grossPurchasePrice: "12" }), true);
  assert.equal(isValidEvidenceRecord({ itemId: "item-1" }), true);
  assert.equal(isValidEigenbeleg({ itemId: "item-1", purchaseRecordId: "purchase-1", reasonNoReceipt: "No receipt", amount: "12" }), true);
});

test("legacy item tax migration scaffolding creates item-linked records without persistence", () => {
  const legacyItem = normalizeSchemaItem({
    id: "item-1",
    name: "Vintage camera",
    sourceType: "Flea market",
    sourceName: "Sunday market",
    sourceLocation: "Berlin",
    purchaseDate: "2026-06-01",
    purchasePrice: "18",
    paymentMethod: "Cash",
    hasReceipt: "No",
    proofType: "Eigenbeleg",
    proofFileName: "camera-proof.txt",
    proofFolderLocation: "Receipts/2026",
    proofStoredExternally: "Yes",
    noReceiptReason: "Private seller did not issue receipt",
  });

  const purchaseRecord = purchaseRecordFromLegacyItem(legacyItem, { id: "purchase-1" });
  const evidenceRecord = evidenceRecordFromLegacyItem(legacyItem, { id: "evidence-1", purchaseRecordId: purchaseRecord.id });
  const eigenbeleg = eigenbelegFromLegacyItem(legacyItem, purchaseRecord, { id: "eigenbeleg-1" });

  assert.equal(purchaseRecord.itemId, "item-1");
  assert.equal(purchaseRecord.receiptStatus, "Eigenbeleg needed");
  assert.equal(purchaseRecord.proofStatus, "External proof recorded");
  assert.equal(purchaseRecord.allocatedPurchaseCost, "18");
  assert.equal(purchaseRecord.migratedFromLegacyItem, true);

  assert.equal(evidenceRecord.itemId, "item-1");
  assert.equal(evidenceRecord.purchaseRecordId, "purchase-1");
  assert.equal(evidenceRecord.evidenceType, "Eigenbeleg");
  assert.equal(evidenceRecord.storageType, "external_path");
  assert.equal(evidenceRecord.externalPath, "Receipts/2026");
  assert.equal(evidenceRecord.migratedFromLegacyItem, true);

  assert.equal(eigenbeleg.itemId, "item-1");
  assert.equal(eigenbeleg.purchaseRecordId, "purchase-1");
  assert.equal(eigenbeleg.reasonNoReceipt, "Private seller did not issue receipt");
  assert.equal(eigenbeleg.amount, "18");
  assert.equal(eigenbeleg.status, "Draft");

  const scaffold = scaffoldTaxComplianceRecordsFromItems([legacyItem]);
  assert.equal(scaffold.purchaseRecords.length, 1);
  assert.equal(scaffold.evidenceRecords.length, 1);
  assert.equal(scaffold.eigenbelege.length, 1);
  assert.equal(scaffold.purchaseRecords[0].itemId, "item-1");
});

test("legacy ebayFees are preserved as legacy platform fees during normalization", () => {
  const item = normalizeItem({
    name: "Legacy fee item",
    status: "Sold",
    salePrice: "59",
    purchasePrice: "22",
    ebayFees: "7.50",
  });

  assert.equal(item.ebayFeeMode, "Legacy");
  assert.equal(platformFees(item), 7.5);
});

test("saleDate alone does not make an item sold", () => {
  assert.equal(isSoldStatus({ status: "Draft", saleDate: "2026-05-18" }), false);
  assert.equal(isSoldStatus({ status: "Draft", finalSalePrice: "12" }), true);
  assert.equal(isSoldStatus({ status: "Sold", saleDate: "2026-05-18" }), true);
});

test("sold-only performance excludes unsold inventory from profit", () => {
  const summary = summarizeSoldPerformance([
    { name: "Unsold stock", status: "Draft", purchasePrice: "100" },
    { name: "Sold stock", status: "Sold", salePrice: "30", purchasePrice: "10" },
  ]);

  assert.equal(summary.sold, 1);
  assert.equal(summary.salesTotal, 30);
  assert.equal(summary.profit, 20);
});

test("partial JSON backup payloads are rejected", () => {
  assert.equal(isFullBackupPayload({ type: "RESELLERIT_BACKUP", items: [], expenses: [] }), true);
  assert.equal(isFullBackupPayload({ type: "RESELLERIT_BACKUP", items: [], expenses: [], purchaseRecords: [] }), true);
  assert.equal(isFullBackupPayload({ type: "RESELLERIT_BACKUP", items: [], expenses: [], purchaseRecords: [], evidenceRecords: [] }), true);
  assert.equal(isFullBackupPayload({ type: "RESELLERIT_BACKUP", items: [], expenses: [], purchaseRecords: [], evidenceRecords: [], eigenbelege: [] }), true);
  assert.equal(isFullBackupPayload({ type: "RESELLERIT_BACKUP", items: [] }), false);
  assert.equal(isFullBackupPayload({ type: "RESELLERIT_BACKUP", expenses: [] }), false);
  assert.equal(isFullBackupPayload({ type: "OTHER_BACKUP", items: [], expenses: [] }), false);
});

test("root app data normalization accepts old backups without purchaseRecords", () => {
  const data = normalizeRootAppData({
    type: "RESELLERIT_BACKUP",
    version: 1,
    items: [{ name: "Legacy item" }],
    expenses: [{ description: "Tape", amount: "3" }],
  });

  assert.equal(data.version, 1);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].name, "Legacy item");
  assert.deepEqual(data.expenses, [{ description: "Tape", amount: "3" }]);
  assert.deepEqual(data.purchaseRecords, []);
  assert.deepEqual(data.evidenceRecords, []);
  assert.deepEqual(data.eigenbelege, []);
});

test("root app data normalization preserves new backup purchaseRecords", () => {
  const data = normalizeRootAppData({
    type: "RESELLERIT_BACKUP",
    version: 2,
    items: [{ id: "item-1", name: "Item" }],
    expenses: [],
    purchaseRecords: [{ itemId: "item-1", grossPurchasePrice: "12", receiptStatus: "Receipt available" }],
  });

  assert.equal(data.version, 2);
  assert.equal(data.purchaseRecords.length, 1);
  assert.equal(data.purchaseRecords[0].itemId, "item-1");
  assert.equal(data.purchaseRecords[0].grossPurchasePrice, "12");
  assert.equal(data.purchaseRecords[0].allocatedPurchaseCost, "12");
  assert.equal(data.purchaseRecords[0].receiptStatus, "Receipt available");
});

test("root app data normalization preserves new backup evidenceRecords", () => {
  const data = normalizeRootAppData({
    type: "RESELLERIT_BACKUP",
    version: 2,
    items: [{ id: "item-1", name: "Item" }],
    expenses: [],
    purchaseRecords: [],
    evidenceRecords: [{ itemId: "item-1", evidenceType: "Invoice", evidenceStatus: "Available", storageType: "metadata_only", title: "Invoice 1" }],
  });

  assert.equal(data.version, 2);
  assert.equal(data.evidenceRecords.length, 1);
  assert.equal(data.evidenceRecords[0].itemId, "item-1");
  assert.equal(data.evidenceRecords[0].evidenceType, "Invoice");
  assert.equal(data.evidenceRecords[0].evidenceStatus, "Available");
  assert.equal(data.evidenceRecords[0].storageType, "metadata_only");
  assert.equal(data.evidenceRecords[0].title, "Invoice 1");
});

test("root app data normalization preserves new backup eigenbelege", () => {
  const data = normalizeRootAppData({
    type: "RESELLERIT_BACKUP",
    version: 2,
    items: [{ id: "item-1", name: "Item" }],
    expenses: [],
    purchaseRecords: [],
    evidenceRecords: [],
    eigenbelege: [{ itemId: "item-1", purchaseRecordId: "purchase-1", reasonNoReceipt: "No receipt", amount: "12", status: "Generated" }],
  });

  assert.equal(data.version, 2);
  assert.equal(data.eigenbelege.length, 1);
  assert.equal(data.eigenbelege[0].itemId, "item-1");
  assert.equal(data.eigenbelege[0].purchaseRecordId, "purchase-1");
  assert.equal(data.eigenbelege[0].reasonNoReceipt, "No receipt");
  assert.equal(data.eigenbelege[0].amount, "12");
  assert.equal(data.eigenbelege[0].status, "Generated");
});

test("missing purchaseRecords initialize to an empty collection", () => {
  assert.deepEqual(normalizeRootAppData({ items: [], expenses: [] }).purchaseRecords, []);
  assert.deepEqual(normalizeRootAppData({ items: [], expenses: [], purchaseRecords: "bad" }).purchaseRecords, []);
});

test("missing evidenceRecords initialize to an empty collection", () => {
  assert.deepEqual(normalizeRootAppData({ items: [], expenses: [] }).evidenceRecords, []);
  assert.deepEqual(normalizeRootAppData({ items: [], expenses: [], evidenceRecords: "bad" }).evidenceRecords, []);
});

test("missing eigenbelege initialize to an empty collection", () => {
  assert.deepEqual(normalizeRootAppData({ items: [], expenses: [] }).eigenbelege, []);
  assert.deepEqual(normalizeRootAppData({ items: [], expenses: [], eigenbelege: "bad" }).eigenbelege, []);
});

test("persistence failure guards preserve form/editor state before reset behavior", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /if \(!persist\(next\)\) return;\s*setForm\(emptyItem\);\s*setSearchQueryManuallyEdited\(false\);\s*setEditingId\(null\);\s*setItemFormOpen\(false\);/s);
  assert.match(source, /if \(!persist\(\[newItem, \.\.\.items\]\)\) return;\s*setQuickAddItem\(/s);
  assert.match(source, /if \(!persistExpenses\(nextExpenses\)\) return;\s*setExpenseForm\(emptyExpense\);\s*setEditingExpenseId\(null\);/s);
  assert.match(source, /function persistExpenses\(nextExpenses\) {\s*return persistAll\(items, nextExpenses\);\s*}/s);
});

test("App persistence shape includes purchaseRecords without automatic scaffolding", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /const \[purchaseRecords, setPurchaseRecords\] = useState\(loadInitialPurchaseRecords\);/);
  assert.match(source, /purchaseRecords: normalizedPurchaseRecords/);
  assert.match(source, /purchaseRecords: normalizePurchaseRecords\(purchaseRecords\)/);
  assert.match(source, /const nextPurchaseRecords = normalizedData\.purchaseRecords;/);
  assert.doesNotMatch(source, /scaffoldTaxComplianceRecordsFromItems\(/);
});

test("App persistence shape includes evidenceRecords without automatic evidence migration", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /const \[evidenceRecords, setEvidenceRecords\] = useState\(loadInitialEvidenceRecords\);/);
  assert.match(source, /evidenceRecords: normalizedEvidenceRecords/);
  assert.match(source, /evidenceRecords: normalizeEvidenceRecords\(evidenceRecords\)/);
  assert.match(source, /const nextEvidenceRecords = normalizedData\.evidenceRecords;/);
  assert.doesNotMatch(source, /evidenceRecordFromLegacyItem\(/);
});

test("App persistence shape includes eigenbelege without automatic Eigenbeleg migration", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /const \[eigenbelege, setEigenbelege\] = useState\(loadInitialEigenbelege\);/);
  assert.match(source, /eigenbelege: normalizedEigenbelege/);
  assert.match(source, /eigenbelege: normalizeEigenbelege\(eigenbelege\)/);
  assert.match(source, /const nextEigenbelege = normalizedData\.eigenbelege;/);
  assert.doesNotMatch(source, /eigenbelegFromLegacyItem\(/);
});

test("App draft Eigenbeleg action updates existing drafts without overwriting finalized records", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /function generateDraftEigenbeleg\(itemId\) {/);
  assert.match(source, /createDraftEigenbelegForItem\(item, purchaseRecords, evidenceRecords\)/);
  assert.match(source, /const existingDraft = eigenbelege\.find\(\(entry\) => entry\.itemId === itemId && \["draft", "Draft"\]\.includes\(entry\.status\)\);/);
  assert.match(source, /eigenbelege\.map\(\(entry\) => \(entry\.id === existingDraft\.id \? { \.\.\.draft, id: existingDraft\.id, createdAt: entry\.createdAt \|\| draft\.createdAt } : entry\)\)/);
  assert.match(source, /: \[draft, \.\.\.eigenbelege\];/);
});

test("App exposes draft Eigenbeleg preview, editing, saving, and regeneration only for drafts", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /const \[draftEigenbelegForm, setDraftEigenbelegForm\] = useState/);
  assert.match(source, /const currentDraftEigenbeleg = eigenbelege\.find\(\(entry\) => entry\.itemId === form\.id && \["draft", "Draft"\]\.includes\(entry\.status\)\) \|\| null;/);
  assert.match(source, /const draftEigenbelegValues = currentDraftEigenbeleg && draftEigenbelegForm\.id === currentDraftEigenbeleg\.id/);
  assert.match(source, /function regenerateDraftEigenbeleg\(itemId\) {/);
  assert.match(source, /const existingDraft = eigenbelege\.find\(\(entry\) => entry\.itemId === itemId && \["draft", "Draft"\]\.includes\(entry\.status\)\);/);
  assert.match(source, /function saveDraftEigenbeleg\(\) {/);
  assert.match(source, /const existingDraft = eigenbelege\.find\(\(entry\) => entry\.id === currentDraftEigenbeleg\?\.id && \["draft", "Draft"\]\.includes\(entry\.status\)\);/);
  assert.match(source, /Draft status/);
  assert.match(source, /Generated date/);
  assert.match(source, /Linked purchase record/);
  assert.match(source, /Linked item/);
  assert.match(source, /Reason no receipt/);
  assert.match(source, /Seller description/);
  assert.match(source, /Acquisition description/);
  assert.match(source, /Generated text/);
  assert.match(source, /Regenerate Draft/);
  assert.match(source, /Save Draft/);
  assert.doesNotMatch(source, /Finalize Draft|Generate PDF|PDF button/);
});

test("App item archive and permanent delete controls preserve compliance records except linked drafts", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const tableSource = readFileSync(new URL("../src/components/inventory/InventoryTable.jsx", import.meta.url), "utf8");

  assert.match(source, /function moveItemToPersonalCollection\(\) {/);
  assert.match(source, /status: "personal_collection"/);
  assert.match(source, /Move to Personal Collection/);
  assert.match(source, /Delete Permanently/);
  assert.match(source, /window\.confirm/);
  assert.match(source, /const nextItems = items\.filter\(\(entry\) => entry\.id !== id\);/);
  assert.match(source, /const nextEigenbelege = eigenbelege\.filter\(\(entry\) => entry\.itemId !== id \|\| !\["draft", "Draft"\]\.includes\(entry\.status\)\);/);
  assert.match(source, /persistAll\(nextItems, expenses, purchaseRecords, evidenceRecords, nextEigenbelege\)/);
  assert.doesNotMatch(source, /purchaseRecords\.filter\(\(.*itemId !== id/s);
  assert.doesNotMatch(source, /evidenceRecords\.filter\(\(.*itemId !== id/s);
  assert.match(source, /!isActiveStockItem\(item\) && !query && inventoryStatus !== "personal_collection"/);
  assert.match(tableSource, /statusLabel\(status\)/);
});

test("Tools Hub uses tile-driven panels without rendering the generic item list", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /const \[activeToolPanel, setActiveToolPanel\] = useState\(null\);/);
  assert.match(source, /const toolPanelRef = useRef\(null\);/);
  assert.match(source, /toolPanelRef\.current\?\.scrollIntoView\(\{ behavior: "smooth", block: "start" \}\);/);
  assert.match(source, /onClick=\{\(\) => setActiveToolPanel\("app_info"\)\}/);
  assert.match(source, /onClick=\{\(\) => setActiveToolPanel\("help"\)\}/);
  assert.match(source, /onClick=\{\(\) => setActiveToolPanel\("backup_instructions"\)\}/);
  assert.match(source, /onClick=\{\(\) => setActiveToolPanel\("compliance_center"\)\}/);
  assert.match(source, /aria-expanded=\{activeToolPanel === "compliance_center"\}/);
  assert.match(source, /aria-controls="tools-panel-compliance-center"/);
  assert.match(source, /\{activeToolPanel && \(/);
  assert.match(source, /<section ref=\{toolPanelRef\}/);
  assert.match(source, /activeToolPanel === "app_info"/);
  assert.match(source, /activeToolPanel === "help"/);
  assert.match(source, /activeToolPanel === "backup_instructions"/);
  assert.match(source, /activeToolPanel === "compliance_center"/);
  assert.match(source, /onClick=\{\(\) => setActiveToolPanel\(null\)\}[^>]*>Close<\/button>/);
  assert.match(source, /onClick=\{\(\) => \{ setActiveToolPanel\(null\); exportJson\(\); \}\}/);
  assert.match(source, /onClick=\{\(\) => \{ setActiveToolPanel\(null\); openStockQueue\("needsAttention", "Missing listing draft"\); \}\}/);
  assert.match(source, /onClick=\{\(\) => \{ setActiveToolPanel\(null\); openFinanceQueue\("reconciliation"\); \}\}/);
  assert.match(source, /activeTab !== "stock" && activeTab !== "sales" && activeTab !== "finance" && activeTab !== "tools" && filtered\.map/);
  assert.doesNotMatch(source, /setActiveToolPanel\("compliance_center"\)[^>]*disabled/s);
  assert.doesNotMatch(source, /setActiveToolPanel\("compliance_center"\)[^>]*pointer-events-none/s);
});

test("Finance Hub uses tile-driven panels without rendering finance detail content by default", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /const \[activeFinancePanel, setActiveFinancePanel\] = useState\(null\);/);
  assert.match(source, /const financePanelRef = useRef\(null\);/);
  assert.match(source, /financePanelRef\.current\?\.scrollIntoView\(\{ behavior: "smooth", block: "start" \}\);/);
  assert.match(source, /Manage monthly closing, expenses, eBay imports, tax records, and year-end summaries\./);
  assert.match(source, /setActiveFinancePanel\("monthly_closing"\)/);
  assert.match(source, /setActiveFinancePanel\("expense_manager"\)/);
  assert.match(source, /setActiveFinancePanel\("ebay_reconciliation"\)/);
  assert.match(source, /setActiveFinancePanel\("tax_records"\)/);
  assert.match(source, /setActiveFinancePanel\("year_end"\)/);
  assert.match(source, /onClick=\{exportMonthlyClosingJson\}/);
  assert.match(source, /activeFinancePanel === "monthly_closing"/);
  assert.match(source, /activeFinancePanel === "expense_manager"/);
  assert.match(source, /activeFinancePanel === "ebay_reconciliation"/);
  assert.match(source, /activeFinancePanel === "tax_records"/);
  assert.match(source, /activeFinancePanel === "year_end"/);
  assert.match(source, /onClick=\{\(\) => setActiveFinancePanel\(null\)\}[^>]*>Close<\/button>/);
  assert.match(source, /activeTab !== "stock" && activeTab !== "sales" && activeTab !== "finance" && activeTab !== "tools" && filtered\.map/);
  assert.match(source, /Profit Report/);
  assert.match(source, /Accountant Export/);
  assert.match(source, /Payout Matching/);
  assert.match(source, /<ExpenseManager/);
  assert.doesNotMatch(source, /const financeSections =/);
  assert.doesNotMatch(source, /financeSections\.map/);
});

test("Sales Hub uses tile-driven panels without changing sales data ownership", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /const \[activeSalesPanel, setActiveSalesPanel\] = useState\(null\);/);
  assert.match(source, /const salesPanelRef = useRef\(null\);/);
  assert.match(source, /salesPanelRef\.current\?\.scrollIntoView\(\{ behavior: "smooth", block: "start" \}\);/);
  assert.match(source, /Track sold items, profits, returns, refunds, and sales activity\./);
  assert.match(source, /setActiveSalesPanel\("awaiting_shipment"\)/);
  assert.match(source, /setActiveSalesPanel\("shipped_tracking"\)/);
  assert.match(source, /setActiveSalesPanel\("completed_sales"\)/);
  assert.match(source, /setActiveSalesPanel\("returns_refunds"\)/);
  assert.match(source, /setActiveSalesPanel\("sales_data_gaps"\)/);
  assert.match(source, /setActiveSalesPanel\("profit_review"\)/);
  assert.match(source, /openFinanceQueue\("reconciliation"\)/);
  assert.match(source, /activeSalesPanel && \(/);
  assert.match(source, /<section ref=\{salesPanelRef\}/);
  assert.match(source, /onClick=\{\(\) => setActiveSalesPanel\(null\)\}[^>]*>Close<\/button>/);
  assert.match(source, /salesDataGapQueues\.missingSaleDate/);
  assert.match(source, /salesDataGapQueues\.missingFinalSalePrice/);
  assert.match(source, /salesDataGapQueues\.missingPlatformFees/);
  assert.match(source, /salesDataGapQueues\.missingActualShippingCost/);
  assert.match(source, /salesDataGapQueues\.missingTracking/);
  assert.match(source, /salesDataGapQueues\.missingRefundReason/);
  assert.match(source, /salesProfitReviewQueues\.negativeProfit/);
  assert.match(source, /salesProfitReviewQueues\.missingFeeShippingData/);
  assert.match(source, /salesProfitReviewQueues\.highCostOutliers/);
  assert.match(source, /shippingTrackerGroups\.find/);
  assert.match(source, /editItem\(item\)/);
});

test("Tools Compliance Center uses existing readiness data and opens item editor", () => {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /const complianceIssueQueues = useMemo\(\(\) => {/);
  assert.match(source, /readiness\.issues\.includes\("purchase_record_missing"\)/);
  assert.match(source, /readiness\.issues\.includes\("evidence_missing"\)/);
  assert.match(source, /readiness\.issues\.includes\("eigenbeleg_missing"\)/);
  assert.match(source, /\["Ready", complianceSummary\.ready\]/);
  assert.match(source, /\["Incomplete", complianceSummary\.incomplete\]/);
  assert.match(source, /\["Needs Eigenbeleg", complianceSummary\.needsEigenbeleg\]/);
  assert.match(source, /\["Not applicable", complianceSummary\.notApplicable\]/);
  assert.match(source, /\["Missing Purchase Records", complianceIssueQueues\.missingPurchaseRecords\]/);
  assert.match(source, /\["Missing Evidence", complianceIssueQueues\.missingEvidence\]/);
  assert.match(source, /\["Needs Eigenbeleg", complianceIssueQueues\.needsEigenbeleg\]/);
  assert.match(source, /sellerClassificationLabel\(item\.sellerClassification\)/);
  assert.match(source, /onClick=\{\(\) => editItem\(item\)\}[^>]*>Open Item<\/button>/);
});

test("seller classification is exposed in editor and inventory records without calculation wiring", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const tableSource = readFileSync(new URL("../src/components/inventory/InventoryTable.jsx", import.meta.url), "utf8");

  assert.match(appSource, /<Select label="Seller mode" value=\{form\.sellerClassification \|\| "private"\}/);
  assert.match(appSource, /sellerClassificationOptions\.map/);
  assert.match(appSource, /sellerClassificationLabel=\{sellerClassificationLabel\}/);
  assert.match(tableSource, /sellerClassificationLabel\(item\.sellerClassification\)/);
});

test("compliance readiness is exposed as read-only UI", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const tableSource = readFileSync(new URL("../src/components/inventory/InventoryTable.jsx", import.meta.url), "utf8");

  assert.match(appSource, /getComplianceSummary\(items, purchaseRecords, evidenceRecords, eigenbelege\)/);
  assert.match(appSource, /getItemTaxReadiness\(form, purchaseRecords, evidenceRecords, eigenbelege\)/);
  assert.match(appSource, /Compliance Status/);
  assert.match(appSource, /complianceSummary\.needsEigenbeleg/);
  assert.match(appSource, /Generate Draft Eigenbeleg/);
  assert.match(appSource, /form\.id && isBusinessRelevant\(form\) && formTaxReadiness\.eigenbelegRequired/);
  assert.match(tableSource, /complianceReadinessByItemId\[item\.id\]\?\.status/);
  assert.match(tableSource, /complianceStatusLabel\(complianceStatus\)/);
});

test("duplicate draft clears sale, shipping, refund, fee, tracking, platform fields", () => {
  const duplicate = duplicateItemForDraft({
    name: "Sold item",
    status: "Completed",
    saleDate: "2026-05-18",
    salePrice: "50",
    finalSalePrice: "50",
    buyerPlatform: "kleinanzeigen",
    shippingChargedToBuyer: "5",
    actualShippingCost: "4",
    packagingCost: "1",
    carrier: "Hermes",
    trackingNumber: "123",
    shippedDate: "2026-05-19",
    trackingNotes: "delivered",
    refundAmount: "2",
    refundDate: "2026-05-20",
    returnPostageCost: "3",
    refundReason: "return",
    ebayFees: "6",
    ebayFeeMode: "Manual",
    feePercent: "10",
    fixedFee: "0.35",
    estimatedEbayFee: "6",
    manualEbayFee: "6",
    promotedListingFee: "1",
    otherPlatformFees: "2",
    shippingCost: "4",
    shippingNotes: "ship after payment",
  }, "copy-id");

  assert.equal(duplicate.id, "copy-id");
  assert.equal(duplicate.status, "Draft");
  assert.equal(duplicate.buyerPlatform, "ebay");
  assert.equal(duplicate.carrier, "DHL");
  assert.equal(duplicate.ebayFeeMode, DEFAULT_EBAY_FEE_MODE);

  for (const field of [
    "saleDate",
    "salePrice",
    "finalSalePrice",
    "shippingChargedToBuyer",
    "actualShippingCost",
    "packagingCost",
    "trackingNumber",
    "shippedDate",
    "trackingNotes",
    "refundAmount",
    "refundDate",
    "returnPostageCost",
    "refundReason",
    "ebayFees",
    "feePercent",
    "fixedFee",
    "estimatedEbayFee",
    "manualEbayFee",
    "promotedListingFee",
    "otherPlatformFees",
    "shippingCost",
    "shippingNotes",
  ]) {
    assert.equal(duplicate[field], "", `${field} should be cleared`);
  }
});

test("listing needed clears fields that make a draft look ready", () => {
  const item = markListingNeeded({
    listingTitle: "Title",
    ebayTitle: "eBay Title",
    ebay: { conditionText: "Nested condition" },
    conditionText: "Condition",
    descriptionText: "Description",
    htmlDescription: "<p>Description</p>",
    generatedPlainDescription: "Generated",
    generatedHtmlDescription: "<p>Generated</p>",
  });

  assert.equal(hasListingDraft(item), false);
});

test("legacy condition text is migrated into the dedicated eBay condition field once", () => {
  const item = normalizeItem({
    conditionText: "Legacy eBay condition",
  });

  assert.equal(item.ebay.conditionText, "Legacy eBay condition");
  assert.equal(ebayConditionText(item), "Legacy eBay condition");
});

test("dedicated eBay condition text is not overwritten by legacy condition text", () => {
  const item = normalizeItem({
    ebay: { conditionText: "User controlled eBay condition" },
    conditionText: "Generated or inventory condition",
  });

  assert.equal(item.ebay.conditionText, "User controlled eBay condition");
  assert.equal(ebayConditionText(item), "User controlled eBay condition");
});

test("oversized legacy proof image data is stripped during normalization", () => {
  const item = normalizeItem({
    name: "Proof item",
    proofImageDataUrl: `data:image/png;base64,${"a".repeat(MAX_LEGACY_PROOF_IMAGE_BYTES + 1)}`,
    proofImageName: "receipt.png",
  });

  assert.equal(item.proofImageDataUrl, "");
  assert.equal(item.proofImageName, "");
  assert.match(item.proofNotes, /too large/);
});

test("HTML previews are sanitized without changing normal listing HTML shape", () => {
  const html = '<div style="color:red" onclick="bad()"><p>Normal listing</p><a href="javascript:bad()">link</a><script>bad()</script></div>';
  const sanitized = sanitizeHtmlPreview(html);

  assert.match(sanitized, /<p>Normal listing<\/p>/);
  assert.doesNotMatch(sanitized, /onclick=/);
  assert.doesNotMatch(sanitized, /javascript:/);
  assert.doesNotMatch(sanitized, /<script>/);
});

test("generated eBay HTML includes seller item details in product description", () => {
  const html = generateHtmlDescription({
    language: "de",
    ebayTitle: "Test title",
    productDescriptionText: "Test product description",
    conditionText: "Guter Zustand",
    shippingNotes: "Versicherter Versand mit Sendungsverfolgung.",
  }, { preferSaved: false });

  assert.match(html, /PRODUKTBESCHREIBUNG/);
  assert.match(html, /Test product description/);
  assert.ok(html.indexOf("PRODUKTBESCHREIBUNG") < html.indexOf("Test product description"));
});

test("eBay condition field is used exactly in generated listing output", () => {
  const conditionText = "Tested and working. Good used condition with minor signs of use.";
  const item = {
    language: "en",
    ebayTitle: "Test title",
    conditionGrade: "For parts",
    conditionNotes: "Generated condition note",
    defectsNotes: "Generated defect note",
    testedStatus: "Not tested",
    ebay: { conditionText },
    productDescriptionText: "Test product description",
    shippingNotes: "Tracked shipping.",
  };
  const draft = generateListingDraft(item, { preferSaved: false });
  const html = generateHtmlDescription(item, { preferSaved: false });

  assert.equal(generatedConditionText(item), conditionText);
  assert.match(draft.description, new RegExp(`CONDITION\\n${conditionText}`));
  assert.doesNotMatch(draft.description, /For parts|Generated condition note|Generated defect note|Not tested/);
  assert.match(html, /Tested and working\. Good used condition with minor signs of use\./);
  assert.doesNotMatch(html, /For parts|Generated condition note|Generated defect note|Not tested/);
});

test("generated key features appear without Merkmale label", () => {
  const html = generateHtmlDescription({
    language: "de",
    ebayTitle: "Test title",
    productDescriptionText: "Test product description",
    keyFeatures: "Feature one\nFeature two",
    conditionText: "Guter Zustand",
    shippingNotes: "Versicherter Versand mit Sendungsverfolgung.",
  }, { preferSaved: false });

  assert.match(html, /Feature one/);
  assert.match(html, /Feature two/);
  assert.doesNotMatch(html, /Merkmal/i);
});

test("generated eBay HTML and plain text do not include pickup or collection wording", () => {
  const item = {
    language: "de",
    ebayTitle: "Test title",
    productDescriptionText: "Test product description",
    conditionText: "Guter Zustand",
    includedItems: "Artikel",
    shippingNotes: "Versicherter Versand mit Sendungsverfolgung. Abholung nach Absprache moeglich.",
  };
  const html = generateHtmlDescription(item, { preferSaved: false });
  const draft = generateListingDraft(item, { preferSaved: false });
  const generatedText = `${html}\n${draft.description}`.toLowerCase();

  assert.doesNotMatch(generatedText, /pickup|collection|abholung|selbstabholung|local pickup/);
  assert.match(generatedText, /versicherter versand mit sendungsverfolgung/);
});
