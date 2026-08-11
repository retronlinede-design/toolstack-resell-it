# ResellIt Canonical vs Legacy Field Audit

**Audit date:** 2026-08-10  
**Scope:** Read-only source investigation. No migrations or application changes were performed.  
**Primary sources:** `src/resellitSchema.js`, `src/resellitLogic.js`, `src/ebayListingTemplate.js`, `src/App.jsx`, extracted components, and regression tests.

## Executive Findings

ResellIt does not yet have one uniformly enforced canonical model. It has three overlapping layers:

1. Item fields remain authoritative for almost all financial calculations, operational views, and editing.
2. Normalized `purchaseRecords` and `evidenceRecords` are authoritative only for compliance-readiness checks and some Eigenbeleg generation.
3. Listing fields have newer and older aliases that normalization fills in both directions, while reads use explicit precedence.

The highest-risk conflicts are:

- `finalSalePrice` wins calculations over `salePrice`, but some editors update only the new field while the Sales editor mirrors both.
- `actualShippingCost` wins over `shippingCost`, with the same inconsistent mirroring pattern.
- `manualEbayFee` and fee mode determine fees; legacy `ebayFees` remains a fallback. `estimatedEbayFee` is stored but not used by calculations.
- Profit and purchase summaries use item `purchasePrice`, not `purchaseRecords` cost fields.
- Compliance readiness uses the existence of normalized purchase/evidence records, while most proof UI edits only item-level proof fields.
- `sellerClassification` controls compliance and business relevance, while `classification` still controls many filters, reports, and “business” summaries. Conflicting values can therefore produce inconsistent screens.
- New listing fields generally win (`ebay.conditionText`, generated descriptions, accessories, measurements), but normalization mirrors missing values without resolving conflicts.

All item fields and normalized record arrays are preserved by the version-2 backup/restore path. Normalization preserves conflicting populated aliases rather than choosing and rewriting one value, except for status mapping and limited legacy migration rules.

## Persistence and Backup Rules Applying to All Families

- Item fields are defined in `emptyItem` in `src/resellitSchema.js`. `normalizeItem` starts with `{ ...emptyItem, ...item }`, so every defined field is preserved, and unknown item properties also survive the object spread.
- Primary persistence serializes normalized items plus expenses, purchase records, evidence records, and Eigenbelege under `toolstack.resellit.v1`.
- Full backup export writes the current `items` array and normalized supporting record arrays. Restore validates the root backup shape, calls `normalizeRootAppData`, and persists the normalized result.
- Consequently, every populated old/new item alias discussed below survives backup export. Restore normalization may fill missing counterparts, but normally does not delete either populated side.
- `purchaseRecords` and `evidenceRecords` are first-class root arrays and are preserved independently of item-level purchase/proof fields.
- There is no conflict log, field timestamp, source marker, or reconciliation mechanism. Precedence is determined at read time by `A || B`, nullish fallback, or subsystem-specific selectors.

## Sales Fields

### `salePrice`, `finalSalePrice`, and `saleDate`

**Defined:** `emptyItem` defines all three. `saleDate` and `salePrice` are older item-level sale fields; `finalSalePrice` is the newer explicit sale amount.

**Written:**

- The main item editor exposes sale date and final sale price. It displays `finalSalePrice || salePrice` but writes only `finalSalePrice` in multiple editor paths.
- The Sales Hub editor displays the same precedence and deliberately writes the entered amount to both `finalSalePrice` and `salePrice`.
- The inventory table displays `finalSalePrice` when it is not `undefined`, otherwise `salePrice`, but writes inline edits only to `finalSalePrice`.
- Duplication and “mark listing needed” cleanup clear the sale fields as appropriate.

**Read/display:** `finalSaleValue(item)` returns `number(item.finalSalePrice || item.salePrice)`. Sales cards, inventory sold totals, monthly/yearly summaries, profit review, and final-sale displays use this helper. Sale date is displayed in Sales and edited in the main/Sales editors.

**Calculations:**

- Sale revenue, profit, gross fee base, sold performance, monthly/yearly sales, and closing reports use `finalSaleValue`.
- `isSoldStatus` returns true if a recognized sold status is present **or** `finalSaleValue(item) > 0`.
- `saleDate` does not itself make an item sold. It is used to place already-sold items into month/year periods. A positive sale price without a sale date is considered sold but excluded from date-period reports.

**Backup/restore:** all three fields are preserved as item properties. Normalization does not synchronize `salePrice` and `finalSalePrice`.

**Conflict behavior:** a non-empty `finalSalePrice` always wins over `salePrice`. Because the test is truthiness-based, string `"0"` is also truthy and wins, then converts to numeric zero. Clearing `finalSalePrice` exposes the legacy `salePrice` again. Main-editor and table edits can leave a stale legacy value underneath; the Sales editor mirrors both and reduces this risk.

**Recommended canonical field:** `finalSalePrice` for the final item-level sale amount; `saleDate` for the effective sale date until a normalized sale/transaction entity exists.

**Legacy treatment:**

- `salePrice`: **migrate**, then retain as **read-only compatibility** for one bounded migration period; eventually remove.
- `finalSalePrice`: **retain** as current canonical item field.
- `saleDate`: **retain** now; eventually move to a canonical sale transaction if multiple sales/events are introduced.

## Shipping Fields

### `shippingCost`, `actualShippingCost`, and `shippingChargedToBuyer`

**Defined:** all three are item fields. `shippingCost` is the legacy actual-cost field; `actualShippingCost` is the newer explicit seller cost; `shippingChargedToBuyer` is distinct revenue.

**Written:**

- Main editor paths display `actualShippingCost || shippingCost`. One path writes only `actualShippingCost`; another mirrors both.
- The Sales Hub mirrors entered seller shipping cost into both fields.
- Inventory does not expose these shipping fields as standard inline columns.
- `shippingChargedToBuyer` is edited directly in the main and Sales editors and has no alias.

**Read/display:** `actualShippingValue` reads `actualShippingCost || shippingCost`; `shippingChargedValue` reads only `shippingChargedToBuyer`. Sales rows and monthly closing show buyer shipping separately from actual shipping.

**Calculations:** profit adds buyer-paid shipping and subtracts actual seller shipping. The fee estimate’s gross-sale base also includes buyer-paid shipping. Monthly closing sums actual shipping through the helper. Sales data-gap checks use the helper, so either actual-cost field satisfies the check.

**Backup/restore:** all fields are preserved. No shipping alias normalization occurs.

**Conflict behavior:** populated `actualShippingCost` wins. A stale `shippingCost` becomes visible again when the new field is cleared. Conflicting buyer-charged shipping is not possible within this family because it has a separate economic meaning and no alias.

**Recommended canonical fields:** `actualShippingCost` for seller expense; `shippingChargedToBuyer` for buyer revenue.

**Legacy treatment:** `shippingCost` should be **migrated**, then retained as **read-only compatibility**, and removed after verified migration. The two canonical fields should be **retained**.

## eBay and Platform Fee Fields

### Names actually present

The requested names `ebayFeePercent`, `ebayFeeFixed`, and `promotedFeePercent` do **not** exist in the current schema or application. The actual fields are:

- `feePercent`
- `fixedFee`
- `promotedListingFee` (an absolute EUR amount, not a percentage)

The other actual fields are `ebayFees`, `manualEbayFee`, `estimatedEbayFee`, `ebayFeeMode`, and `otherPlatformFees`.

### Definition and writing

- `ebayFeeMode` defaults to `Private Germany`; visible choices are `Private Germany`, `Business Estimate`, and `Manual`. Normalization can also assign internal mode `Legacy`, even though it is not in the visible options.
- Advanced fee UI edits `feePercent`, `fixedFee`, `promotedListingFee`, and `otherPlatformFees`.
- Manual fee inputs display `manualEbayFee || ebayFees`, write `manualEbayFee`, and set mode to `Manual`.
- On item save, `estimatedEbayFee` is replaced with `String(ebayBaseFee(form))` only in `Business Estimate` mode; otherwise its existing value is preserved.
- The estimated-fee UI is read-only and displays a fresh call to `ebayBaseFee(form)`, even though its change handler nominally targets `estimatedEbayFee`.
- Duplicate/reset logic clears fee values and resets the mode.

### Read precedence and calculations

`ebayBaseFee` applies these rules:

1. Mode is `item.ebayFeeMode`, or `Legacy` when `ebayFees` exists without a mode, otherwise the default.
2. `Manual`: use `manualEbayFee || ebayFees`.
3. `Business Estimate`: compute `(final sale + shipping charged) * feePercent / 100 + fixedFee`.
4. `Legacy`: use `ebayFees`.
5. Other modes, including `Private Germany`: base fee is zero.

`platformFees` adds `promotedListingFee` and `otherPlatformFees` to that base. Profit subtracts `platformFees`. `estimatedEbayFee` is **not read by any fee calculation**.

### Normalization and conflicts

- If `ebayFees` is populated, `manualEbayFee` is empty, and the incoming record has no explicit mode or the default mode, normalization changes the mode to `Legacy`.
- If both `manualEbayFee` and `ebayFees` exist, mode decides. In `Manual`, `manualEbayFee` wins; in `Legacy`, `ebayFees` wins; in `Business Estimate`, neither amount is used.
- A populated/stale `estimatedEbayFee` never overrides the live formula. It can disagree with the current inputs and still remain in storage.
- `promotedListingFee` is always treated as a currency amount. Introducing or importing `promotedFeePercent` would currently have no effect and would only survive as an unknown property.
- `ebayFeePercent` and `ebayFeeFixed`, if present in imported JSON, are not migrated to actual fields and do not affect calculations.

### UI and backup

The main item editor exposes the fee mode and all current calculation inputs. Sales exposes a single manual platform-fee amount. Item detail shows the selected mode and calculated platform fees. All actual and unknown imported fields survive backup/restore, but unknown requested-name variants remain inert.

### Recommendations

- `ebayFeeMode`: **retain** as the strategy selector, but formally include/document `Legacy` during migration.
- `manualEbayFee`: **retain** as canonical reconciled base fee.
- `feePercent` and `fixedFee`: **retain** as canonical estimate inputs; do not create differently named aliases without a migration plan.
- `promotedListingFee`: **retain** as canonical absolute promoted fee; its label should continue to state EUR.
- `otherPlatformFees`: **retain**.
- `ebayFees`: **migrate** to `manualEbayFee` with mode `Manual` (or a documented imported/reconciled mode), then **read-only compatibility**, then remove.
- `estimatedEbayFee`: either **remove after migration** as redundant cached data or redefine as an immutable estimate snapshot with timestamp/input metadata. It should not be treated as canonical now.
- `ebayFeePercent`, `ebayFeeFixed`, `promotedFeePercent`: **do not adopt** as aliases. If real historical payloads contain them, add an explicit one-time migration; otherwise remove/ignore unknown copies after backup analysis.

## Purchase and Source Fields

### Item-level purchase fields

`emptyItem` defines `sourceType`, `sourceName`, `sourceLocation`, `purchaseDate`, `purchasePrice`, `paymentMethod`, and related receipt/proof fields. Quick add, inventory inline editing, and the main item editor write these fields. The inventory ledger, item details, timeline grouping, monthly/yearly summaries, inventory value, profit, and legacy Eigenbeleg text read them.

`purchasePrice` is the authoritative cost for **all current profit and management-report calculations**. Purchase date is the authoritative date for inventory timelines and purchase-period reports. Source fields are the primary operational display values.

### `purchaseRecords`

The normalized record defines its own `purchaseDate`, purchase type, seller/source fields, `grossPurchasePrice`, `allocatedPurchaseCost`, currency, payment method, receipt/proof status, evidence IDs, notes, and timestamps. It is persisted and backed up, but the current UI has no general purchase-record CRUD workflow. State setters primarily receive normalized data during load, persist, and backup restore.

Purchase records are read by:

- Compliance readiness, which checks whether any record exists for the item.
- Draft Eigenbeleg generation, which prefers the first linked purchase record for date, allocated/gross amount, payment method, source, seller, currency, and linkage.
- Compliance queues and summaries indirectly.

They are **not** read by profit, inventory value, monthly purchases, year-end purchase totals, or item purchase displays.

### Normalization and migration

- Item normalization does not create or synchronize purchase records.
- Root normalization preserves and normalizes an existing `purchaseRecords` array.
- `purchaseRecordFromLegacyItem` can scaffold a record, preferring item `purchasePrice` over `proofAmount`, but the application deliberately does not call automatic scaffolding during load/persist.
- Purchase record normalization sets `allocatedPurchaseCost` from `grossPurchasePrice` only when allocation is absent.

### Conflict behavior

If item `purchasePrice` and purchase-record cost disagree, operational finance/profit uses the item value, while an Eigenbeleg uses `allocatedPurchaseCost`, then `grossPurchasePrice`, then item proof/purchase values. Compliance merely sees a record as present and does not compare amounts/dates. The UI therefore can show one acquisition cost while generating a self-receipt with another.

### Recommendations

- Near term canonical operational field: `item.purchasePrice`, because that is what all calculations use today.
- Long-term canonical acquisition model: `purchaseRecords`, particularly `allocatedPurchaseCost` for per-item cost and `grossPurchasePrice` for source transaction total.
- Item purchase/source fields: **retain** until complete purchase-record UI and calculation migration; then **read-only compatibility** or derived cache.
- `purchaseRecords`: **retain** and complete; migrate item fields deliberately only after conflict-report tooling exists.
- Never silently make purchase records authoritative without a reconciliation report, because existing records can disagree with visible item totals.

## Evidence and Proof Fields

### Item-level fields

The item stores `hasReceipt`, `receiptType`, `proofType`, `proofDate`, `proofAmount`, `proofNotes`, `noReceiptReason`, `proofStoredExternally`, filenames/folder paths, and legacy image metadata/data URL.

These are written by quick proof controls, inventory proof status actions, and the main item editor. UI queues, receipt summaries, legacy Eigenbeleg copy, item details, and proof badges read them. `itemRequiresEigenbeleg` uses `hasReceipt`, `proofType`, and `receiptType`.

Within item-level fields, there is no universal precedence:

- Proof display often uses `proofType || receiptType`.
- Eigenbeleg detection checks exact combinations across both.
- Quick status actions generally update `hasReceipt`, `receiptType`, and `proofType` together, but the full editor allows some independent edits.
- Proof date display/input falls back to purchase date; proof amount falls back to purchase price.

### `evidenceRecords`

The normalized evidence model contains item/purchase/source/expense/eBay links, evidence type/status, title/date/issuer/amount/currency, storage type, filename/blob key/external location, notes, migration marker, and timestamps.

Evidence records are persisted/backed up and used by compliance readiness and Eigenbeleg generation. There is no complete evidence-record CRUD UI. Current proof UI predominantly edits item-level fields, not `evidenceRecords`.

### Calculations and readiness

- Financial calculations do not use item proof amounts or evidence-record amounts.
- Compliance readiness considers evidence present when a linked evidence record has any status except `Missing`.
- Item-level proof may look complete in UI but does not satisfy normalized compliance readiness without an evidence record.
- Conversely, an evidence record can satisfy readiness while item-level `hasReceipt`/proof displays still look incomplete.
- Eigenbeleg generation prefers purchase-record amount and only then item `proofAmount`/`purchasePrice`; linked evidence is included as descriptive support.

### Normalization and conflicts

- Item proof aliases are not reconciled with evidence records.
- Legacy conversion helpers can build evidence records from item proof fields, but are not automatically persisted.
- Oversized legacy proof-image data URLs are removed during item normalization and a note is appended; other proof metadata remains.
- Conflicting `hasReceipt`, `receiptType`, and `proofType` values remain. For example, `hasReceipt: "Yes"` with `proofType: "Eigenbeleg"` can still cause `itemRequiresEigenbeleg` to return true.

### Recommendations

- Current operational canonical fields: item `hasReceipt`, `proofType`, `proofDate`, `proofAmount`, and `proofNotes`, because current editors and displays use them.
- Long-term canonical evidence model: `evidenceRecords`; proof availability and document metadata should derive from linked records.
- `receiptType`: **migrate** into evidence/purchase status and then retain as **read-only compatibility** before removal.
- Item proof metadata: **retain** until evidence CRUD and migration/reconciliation are complete; then migrate and derive/read-only.
- `evidenceRecords`: **retain** and complete as the long-term canonical model.
- Add future conflict checks before migration; do not currently infer that item proof metadata and evidence records describe the same document.

## Classification Fields

### `classification`

Values are human-readable operational categories: Private Sale / Personal Collection, Business Stock / Resale Inventory, Legacy Stock / Previous Business, and Unsure / Review Later. It defaults to review-later. Quick add defaults it to business stock. Main editor and filters write/read it.

It drives inventory filtering, classification counts, needs-attention/review queues, monthly breakdowns, and the current yearly “business” purchase/sale summaries. `itemClassification` reads only this field with a default.

### `sellerClassification`

Values are stable codes: `private`, `pre_registration`, `business`, and `excluded`. It defaults to `private`; normalization replaces an invalid/missing value with `private`. The main editor exposes it as “Seller mode,” and inventory displays it.

It drives `isBusinessRelevant`, normalized tax readiness, compliance summaries, and Compliance Center labels/queues. It is intentionally not wired into general financial calculations.

### Conflict behavior

The fields are independent and no mapping is performed. An item can be `Business Stock / Resale Inventory` but `sellerClassification: private`; it will be included in item-based business/year-end totals but compliance will be “not applicable.” The reverse can exclude it from those business totals while requiring normalized purchase/evidence records. Quick add’s business `classification` does not set seller classification, so normalized default `private` can create this conflict immediately.

### Recommendations

- `sellerClassification`: **retain** as canonical tax/business-relevance classification because it uses stable codes and already drives compliance.
- `classification`: retain temporarily as an operational/history classification, but its overlap with seller classification must be resolved. Recommended eventual treatment is **migrate** into a separately named operational category or a derived presentation; do not silently delete it.
- Before any migration, produce a conflict queue and require explicit decisions for `Legacy Stock`, `Unsure`, pre-registration, and excluded cases.
- General financial “business” reports should eventually use one documented canonical classification rule rather than the current split.

## Listing Fields

### Condition: `conditionText` vs `ebay.conditionText`

Both are defined on the item. `ebayConditionText` reads `ebay.conditionText` first using nullish precedence, then top-level `conditionText`. Normalization copies top-level text into the nested field only when the nested value is blank. It never copies nested text back to the legacy field.

Current eBay Studio inputs write only `ebay.conditionText`. Listing generation reads through `ebayConditionText`. Listing generation/save actions also set nested condition text; some generated-pack paths write a top-level `conditionText` in the returned draft object as well. Listing reset clears both.

If both differ, nested `ebay.conditionText` wins—even an empty string wins in `ebayConditionText` because it uses nullish rather than truthy fallback. Normalization normally prevents a blank nested value when legacy text exists, but unnormalized in-memory objects could exhibit this edge case.

**Canonical:** `ebay.conditionText` — **retain**.  
**Legacy:** top-level `conditionText` — **migrate**, then **read-only compatibility**, then remove.

### Plain description: `descriptionText` vs `generatedPlainDescription`

Both are defined. Normalization fills each from the other only when missing, with `generatedPlainDescription` preferred during the first assignment. Current textarea edits mirror both. Generation writes the same generated text to both. Listing/readiness helpers generally read `generatedPlainDescription || descriptionText`.

One current Listing Studio completeness view checks `descriptionText` directly, so an unnormalized object containing only the generated field may appear inconsistent until normalization. If both differ, generated text wins in listing draft/readiness/copy paths, while direct legacy checks can still see the old value.

**Canonical:** `generatedPlainDescription` — **retain**.  
**Legacy:** `descriptionText` — **migrate**, then **read-only compatibility**, then remove after all direct reads are converted.

### HTML description: `htmlDescription` vs `generatedHtmlDescription`

This pair follows the same bidirectional fill-on-missing normalization. Current editors and generation mirror both. Preview and draft helpers prefer `generatedHtmlDescription || htmlDescription`. A legacy completeness view checks `htmlDescription` directly.

If both differ, generated HTML wins for copy/preview/exported listing draft; legacy-only UI checks may report the other value. Sanitization is applied at preview rendering, not when storing either field.

**Canonical:** `generatedHtmlDescription` — **retain**.  
**Legacy:** `htmlDescription` — **migrate**, then **read-only compatibility**, then remove.

### Included content: `includedItems` vs `includedAccessories`

Both are defined. Normalization fills both directions on missing values. Most current listing UI displays `includedAccessories || includedItems` and mirrors edits to both. One workflow input writes only `includedItems`. Save normalization then fills only a missing counterpart; if `includedAccessories` already contains a different non-empty value, the conflict remains.

Listing templates generally prefer `includedAccessories` over `includedItems`. If they differ, accessories wins in listing output, while the item-only editor field can show or modify the losing value.

**Canonical:** `includedAccessories` (the broader current listing field) — **retain**.  
**Legacy:** `includedItems` — **migrate**, then **read-only compatibility**, then remove. If “included items” is preferred product language, invert the naming only through a planned migration, not by continuing both.

### Measurements/specifications: `measurements` vs `sizeSpecs`

Both are defined and normalization fills missing values both ways. Current editors generally display `measurements || sizeSpecs` and mirror edits. Save also populates both. Listing generation prefers `measurements`; one item-detail source-fields view reads `sizeSpecs` directly.

If both differ, generated listing text uses `measurements`, while item-detail metadata can show `sizeSpecs`. Neither is structurally typed, so dimensions, size, and technical specifications are conflated.

**Canonical:** `measurements` for current free text — **retain**. Consider a future structured specification model rather than another alias.  
**Legacy:** `sizeSpecs` — **migrate**, then **read-only compatibility**, then remove after direct displays migrate.

### Listing title: additional discovered alias

`ebayTitle` and `listingTitle` are both item fields and are used as fallbacks. Generated title/readiness logic can use either, and resets clear both. Current eBay editor primarily presents “eBay Title,” while some generator code treats `listingTitle` as a saved title.

If both differ, precedence varies by helper; several paths prefer `ebayTitle`, while others inspect both. Recommended canonical is `listingTitle` if marketplace-neutral reuse is intended, or `ebayTitle` if the product remains eBay-specific. A product decision is required. Until then both should be **retained**, with a conflict report; neither should be silently removed.

## Status Fields and Normalization

### Current visible item statuses

The primary item status list is:

- `Draft`
- `Sourced`
- `Ready to List`
- `Listed`
- `Sold`
- `Shipped`
- `Complete`
- `Returned`
- `personal_collection`, displayed as `Personal Collection`

Quick controls omit Draft, Sourced, and personal collection. Sales editing restricts primary choices to Sold, Shipped, Complete, and Returned, while preserving an unexpected current value as an extra option.

### Legacy values and mappings

Normalization and `itemStatusValue` map:

| Legacy status | Current status |
|---|---|
| `Paid` | `Sold` |
| `Ready to Pack` | `Sold` |
| `Packed` | `Sold` |
| `Completed` | `Complete` |
| `Refunded` | `Returned` |
| `Written Off` / `Written off` | `Returned` |
| `Kept private` | `Complete` |
| `Personal Collection` | `personal_collection` |

`soldStatusOptions` still includes legacy values defensively, even though normalized stored items should use current values. `isSoldStatus` also treats any item with positive final sale value as sold regardless of status.

### Writes, reads, UI, and calculations

Status is written by the item editor, inventory table, quick status buttons, Sales editor, archive action, duplicate/reset actions, and quick creation. It drives workflow queues, inventory activity, Sales grouping, filters, badges, and whether an item is treated as active stock. Financial inclusion relies on `isSoldStatus`, not status alone.

### Backup/restore and conflicts

Backup writes the current item status. Restore normalization replaces known legacy values with current values, so the original legacy string does not survive restoration as the active value. Unknown statuses survive and can be shown as extra UI options.

A status can conflict with financial fields: a Draft with a positive sale price is financially sold, while a Sold item with no price is still sold. A `saleDate` alone does not cause sold status. This is intentional according to tests but should be documented.

### Recommendations

- Current normalized status values: **retain** as canonical.
- Legacy values: **migrate** during normalization, keep recognition as **read-only compatibility** for bounded backup support, then remove after old backup support expires.
- `personal_collection`: retain the stable code and presentation mapping.
- Long term, sale lifecycle and inventory lifecycle may need separate fields/entities; do not expand this single status enum indefinitely.

## Other Duplicate or Alias Families Discovered

### Price research

- Old: `researchedLowPrice`, `researchedMidPrice`, `researchedHighPrice`, `priceResearchNotes`, `chosenListingPrice`.
- New: `priceResearchLow`, `priceResearchMid`, `priceResearchHigh`, `researchNotes`, `suggestedListingPrice`.
- Normalization mirrors low/mid/high both directions, seeds new notes from old notes, and seeds suggested price from chosen price. It does not mirror new notes/suggested price back consistently.
- Research/readiness UI uses a mixture. Recommended canonical family is the `priceResearch*`, `researchNotes`, and `suggestedListingPrice` set; old fields should be migrated then compatibility-only.

### Listing language

- `language` is the stable code (`de`/`en`); `listingLanguage` is a human label (`German`/`English`).
- Normalization derives both and overwrites `listingLanguage` from the normalized language code.
- Canonical should be `language`; `listingLanguage` should be derived and eventually removed from storage.

### Source item title/product identity

- `name`, `ebayTitle`, and `listingTitle` overlap but are not strict aliases: name is inventory identity, the other two are marketplace copy.
- They should remain distinct semantically, while the two listing-title fields need the decision described above.

### Proof image/file references

- `proofImageDataUrl`/`proofImageName` are legacy embedded-image fields.
- `proofFileName`, `proofFolderLocation`, and `proofStoredExternally` represent external references.
- `evidenceRecords` provide the future normalized storage model with metadata, IndexedDB key, external path, or URL.
- Recommended treatment is to retain compatibility reads, migrate metadata into evidence records, and avoid embedded base64 data in item storage.

### Sale/platform identity

- `buyerPlatform` is the current platform code. There is no separate normalized sale/order record or eBay transaction linkage on the item.
- `evidenceRecords.ebayTransactionId` and raw eBay import batches exist but are not reconciled into item sales.
- This is not yet an alias conflict, but it is the boundary where future canonical transactions should replace further item-field duplication.

## Canonical Recommendation Matrix

| Family | Current calculation/display authority | Recommended canonical | Legacy treatment |
|---|---|---|---|
| Sale amount | `finalSalePrice || salePrice` | `finalSalePrice` | Migrate `salePrice`; compatibility read; remove later |
| Sale date | `saleDate` | `saleDate` until sale entity | Retain |
| Actual shipping | `actualShippingCost || shippingCost` | `actualShippingCost` | Migrate `shippingCost`; compatibility read; remove later |
| Buyer shipping | `shippingChargedToBuyer` | Same | Retain |
| Manual base fee | Mode + `manualEbayFee || ebayFees` | `manualEbayFee` | Migrate `ebayFees`; compatibility read; remove later |
| Estimated base fee | Live formula from `feePercent` + `fixedFee` | Formula inputs; optionally snapshot separately | Remove/redefine stale `estimatedEbayFee` |
| Promoted fee | `promotedListingFee` amount | Same | Retain; do not introduce percent alias implicitly |
| Purchase cost | Item `purchasePrice` in finance; record allocation in Eigenbeleg | Long-term `purchaseRecords.allocatedPurchaseCost` | Retain item field until full migration |
| Proof | Item fields in UI; evidence records in readiness | Long-term `evidenceRecords` | Migrate item proof metadata after CRUD exists |
| Classification | Split authority | `sellerClassification` for business/tax | Re-scope/migrate `classification` explicitly |
| Condition | `ebay.conditionText` first | `ebay.conditionText` | Migrate top-level `conditionText` |
| Plain description | Generated first | `generatedPlainDescription` | Migrate `descriptionText` |
| HTML description | Generated first | `generatedHtmlDescription` | Migrate `htmlDescription` |
| Included content | Accessories first in most paths | `includedAccessories` | Migrate `includedItems` |
| Measurements | Measurements first in listing | `measurements` | Migrate `sizeSpecs` |
| Listing language | Normalized code | `language` | Derive/remove stored label |
| Status | Normalized current values | Current enum/code | Compatibility-map legacy values |

## Recommended Migration Preconditions

No migration should be implemented until all of the following exist:

1. A read-only conflict report enumerating records where both aliases are non-empty and unequal.
2. A dated full backup and tested restore path.
3. Explicit precedence decisions approved for every family, especially classification, purchase, and evidence.
4. Regression fixtures containing legacy-only, new-only, equal, and conflicting values.
5. A versioned migration that is idempotent and never destroys the losing value without recording it.
6. Updated UI that writes only the canonical field after migration.
7. Calculation tests proving totals before and after migration are intentionally equal or explaining approved differences.

## Final Assessment

The current application is backward-compatible but not canonically clean. Most simple alias families have deterministic read precedence, so the app behaves consistently at runtime, but populated conflicts are preserved and hidden rather than resolved. The purchase/evidence/classification families are more consequential: separate subsystems can produce different answers from the same item because they intentionally read different models.

The safest eventual sequence is: inventory conflicts, decide canonical semantics, add behavior tests, migrate values without deletion, switch all writers, switch all readers/calculations, retain bounded compatibility reads, and only then remove legacy storage fields. Until that sequence is completed, backups should continue preserving both sides exactly as they do today.
