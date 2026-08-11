# ResellIt Finance Current-State Audit

**Audit date:** 2026-08-11  
**Scope:** Current Finance UI, selectors, calculations, exports, expenses, eBay imports, tax-record views, and alignment with Purchase Transactions/Allocations.  
**Method:** Read-only source inspection. No application, schema, persistence, UI, or calculation files were modified.

## Executive Summary

Finance remains operationally compatible with ResellIt because it continues to use the established item-first financial model. Purchases created through Purchases & Invoices V2 affect Finance only because V2 intentionally copies each allocation into `item.purchasePrice` and the transaction date/source into item fields. Purchase Transactions and Allocations themselves have no direct effect on Finance.

That is safe for the present transition, but Finance is not yet architecturally integrated with the new purchase system. The most important rule is to avoid adding `purchaseTransactions.grossTotal` to existing item-based purchase totals: V2 already creates item costs equal to allocations, so doing both would double-count acquisitions.

Sales-to-Finance alignment is comparatively strong. Finance consistently uses canonical `finalSalePrice`, buyer shipping, actual shipping, packaging, platform fees, refunds, return postage, and `saleDate`. Expense handling is usable but structurally thin: expenses have no business/private classification, evidence ID, purchase-transaction link, vendor, currency, or reconciliation status.

Monthly Closing is a useful management summary, although it mixes acquisition cash flow, sold-item margin, general expenses, proof checks, and classification counts. Year-End & EÜR is explicitly an estimate and is not EÜR-ready: it uses item purchase dates and operational classification, expenses are not classification-aware, transaction evidence is ignored, and no accounting recognition/export policy exists.

The eBay panel is an import staging area rather than reconciliation. It parses and stores raw CSV rows, previews columns, and deletes batches, but performs no field mapping, item/sale matching, fee posting, payout matching, or reconciliation-state tracking.

Tax Records substantially overlaps Tools Compliance Center, Item Editor Records & Proof, and Purchases & Invoices. It also has multiple active render blocks, producing duplicated/competing tax-record experiences. Finance should ultimately retain compact financial record-readiness and export checks, while document management and detailed compliance work should live with Purchases/Tools.

## 1. Current Finance Hub Structure

### Active hub tiles and actions

| Name | Purpose | Data/calculations | State | Duplication |
|---|---|---|---|---|
| Monthly Closing | Month-end totals, checks, export and print | Items selected by `purchaseDate`/`saleDate`; expenses by date; item financial helpers | Functional management summary | Dashboard monthly figures, Stock totals, Sales profit data |
| Expense Manager | Create, edit, filter and delete general expenses | Root `expenses` array | Functional | Tax Records repeats missing-receipt-note checks |
| Year-End & EÜR | Annual all-item and “business-only” estimates | `yearlySummary`, `yearlyBusinessSummary` | Functional as an estimate; not EÜR-ready | Monthly Closing and Sales totals |
| Export Monthly JSON | Direct download of current `monthlyClosing` object | `exportMonthlyClosingJson()` | Functional | Monthly Closing contains another Export JSON action |
| eBay Reconciliation | Upload, preview and retain eBay CSV batches | Separate `EBAY_IMPORTS_KEY` localStorage payload; item-derived comparison cards | Partial/staging only | Sales Hub cross-links here; no shared matching engine yet |
| Tax Records | Proof/readiness queues and item/expense checks | Item proof fields, operational classification, expenses; some legacy Eigenbeleg UI | Functional but duplicated and architecturally dated | Tools Compliance Center, Records & Proof, Purchases & Invoices |

### Disabled/planned tiles

- **Profit Report:** disabled placeholder; no report implementation.
- **Accountant Export:** disabled placeholder; no export package or schema.
- **Payout Matching:** disabled placeholder; the active eBay panel also shows a “Payout matching” estimate, but no matching exists.

### Panel hierarchy issue

`activeFinancePanel === "tax_records"` appears in multiple active render blocks:

1. A classification-filter panel near the hub/Stock Register region.
2. A large legacy-style “Tax Proof Manager”/receipt-record UI.
3. A newer `FinanceHeader` “Tax Records” readiness panel.

These can render for the same state, so Tax Records is not a single coherent panel. This is the clearest current Finance UI defect.

## 2. Finance Summary Metrics

### Shared formulas

- `finalSaleValue(item) = number(item.finalSalePrice)`.
- `shippingChargedValue(item) = number(item.shippingChargedToBuyer)`.
- `actualShippingValue(item) = number(item.actualShippingCost || item.shippingCost)`.
- `packagingCostValue(item) = number(item.packagingCost)`.
- `refundValue(item) = number(item.refundAmount) + number(item.returnPostageCost)`.
- `platformFees(item) = ebayBaseFee(item) + promotedListingFee + otherPlatformFees`.
- `itemProfitValue(item) = final sale + buyer shipping - item.purchasePrice - platform fees - actual shipping - packaging - refunds/return postage`.
- `isSoldStatus(item)` is true for normalized sold lifecycle states or a positive canonical final sale value.

### Metric matrix

| Displayed metric | Exact current formula/scope | General expenses? | Purchase architecture effect | Label assessment |
|---|---|---:|---|---|
| Gross Revenue | Current-calendar-month sold items by `saleDate`; `finalSalePrice + shippingChargedToBuyer` | No | None except items created by V2 | Accurate because buyer shipping is included |
| Expenses | Current-calendar-month expense records | Yes, this is the expense total | None | Accurate |
| Estimated Net Profit (performance cards) | Current-month sum of `itemProfitValue` minus current-month expenses | Yes | Uses `item.purchasePrice` only | Reasonable management label; not accounting net income |
| Sold Items | `monthlyClosing.soldCount` for selected closing month | N/A | None | Accurate |
| Pending Payouts Estimate | `max(0, gross revenue - platformFees - actualShipping)` for current calendar month | No packaging, refunds, expenses, or actual payout data | None | Misleading/weak; it is not payout matching and omits material deductions |
| Sales Value | Selected closing month, sum of `finalSalePrice` only | No | None | Accurate; excludes buyer shipping intentionally |
| Purchase Spend | Items whose `purchaseDate` falls in selected month; sum `item.purchasePrice` | No | V2 affects it through compatibility item fields; transaction totals ignored | Accurate as item-recorded acquisition spend, but not transaction-derived cash ledger |
| Buyer Shipping | Selected month sold items; `shippingChargedToBuyer` | No | None | Accurate |
| Actual Shipping Costs | Selected month sold items; canonical/fallback shipping cost | No | None | Accurate |
| Packaging Costs | Selected month sold items; `packagingCost` | No | None | Accurate |
| Returns & Refunds | Selected month sold items; `refundAmount + returnPostageCost` | No | None | Partly misleading: grouped by sale month, not refund date |
| Platform Fees | Selected month sold items; eBay/manual/estimated/legacy fee plus promoted and other platform fees | No | None | Accurate as combined platform fees |
| Estimated Net Profit (closing) | Selected month sold-item profit minus selected-month expenses | Yes | Purchase cost recognized through sold items’ `purchasePrice` | Useful management estimate; mixes sale-month margin with expense-date totals |
| Missing Proof | Purchase- or sale-active items in selected month evaluated from item proof fields | N/A | Transaction evidence ignored | Incomplete after Purchases & Invoices |
| Review Later | Activity items with operational classification `Unsure / Review Later` | N/A | Transaction/allocation ignored | Accurate for operational classification only |
| Inventory cash spent (annual) | Items purchased in current year; sum `item.purchasePrice` | No | V2 compatibility fields included; transactions ignored | Better called recorded item purchase spend; “inventory cash spent” is understandable but not transaction-reconciled |
| Gross sales (annual) | Current-year sold items by `saleDate`; final sale plus buyer shipping | No | None | Accurate |
| Fees + shipping (annual) | Platform fees plus actual shipping; packaging excluded | No | None | Label is incomplete because packaging is omitted |
| Expenses (annual) | Expense records dated in current year | Yes | None | Accurate |
| Estimated EÜR profit | Current-year sold-item profits minus annual expenses | Yes | Uses sold items’ purchase costs, not transaction totals | Too authoritative; this is an operational estimate, not a validated EÜR result |
| Business sales | Same annual gross sales, restricted by operational `classification` | No | None | Classification basis is outdated/ambiguous |
| Business inventory cash spent | Annual item purchase costs restricted by operational classification | No | Transaction seller/source data ignored | Technically reflects current filter, but not seller/compliance classification |
| Business fees + shipping | Platform fees plus shipping on operationally classified business items | No | None | Packaging excluded |
| Business item profit | Sum item profit for business-classified sold items | No general expenses | None | Accurate as item margin, not business net profit |

## 3. Purchase Architecture Alignment

### Current Finance reads

| Collection/field | Finance use now |
|---|---|
| `item.purchasePrice` | Authoritative for monthly/yearly purchase spend, stock cost, and sold-item profit |
| `item.purchaseDate` | Authoritative purchase period for monthly/yearly totals and activity |
| Item source/payment/proof fields | Used in Tax Records and proof queues, not monetary totals |
| `purchaseTransactions.grossTotal` | Not read anywhere in Finance |
| `purchaseAllocations.allocatedPurchaseCost` | Not read anywhere in Finance |
| `purchaseRecords` | Used by compliance readiness and Eigenbeleg infrastructure outside Finance calculations; not used in Finance totals |
| `evidenceRecords` | Used by compliance helpers, but Finance Tax Records largely evaluates item proof fields; transaction-level invoice evidence is not surfaced |

Current purchase totals therefore still derive entirely from `item.purchasePrice`.

### Effect of Purchases & Invoices

- V1 linking an existing item creates an allocation but does **not** change `item.purchasePrice`; Finance is unchanged.
- V2 batch creation intentionally sets each new `item.purchasePrice` equal to its allocation. Finance sees those new item costs exactly as it sees item-first acquisitions.
- Editing an allocation after creation does not update `item.purchasePrice`; Finance continues using the item value and can diverge from the allocation.
- Editing a transaction gross total has no Finance effect.
- Reconciliation status has no Finance effect.
- Transaction evidence has no Finance proof/readiness effect unless separately represented in item fields/current compliance links.

Thus Finance aligns with the transitional compatibility policy, but not with the structured purchase architecture itself.

## 4. Double-Counting Risk

Current code does not double-count transaction totals because it never reads them. The future risk is high:

```text
PurchaseTransaction grossTotal:        €400
Sum of generated item.purchasePrice:   €400
Naive combined Finance total:          €800
```

The same risk exists if Finance combines `purchaseAllocations.allocatedPurchaseCost` with item purchase costs.

### Recommended source-of-truth rules

1. **During transition:** keep item purchase fields authoritative for operational calculations. Treat transactions/allocations as reconciliation and provenance only.
2. **Future transaction-based purchase cash flow:** count each Purchase Transaction gross total once; never add item purchase costs to that cash-flow total.
3. **Future item cost/margin:** use allocation cost per item; never add transaction gross total to sold-item cost of goods.
4. **Unlinked legacy items:** retain bounded fallback to `item.purchasePrice` until migrated.
5. **Linked items with conflicts:** report the conflict; do not silently select or synchronize values.
6. Keep separate named concepts: transaction cash spend, allocated stock cost, unsold stock cost, and sold-item allocated cost.

## 5. Purchase Cost Recognition in Current Software

- **Purchase summaries:** all item purchase costs are counted immediately in the month/year of `item.purchaseDate`, regardless of whether the item has sold.
- **Item profit:** purchase cost is deducted only when the item is included in a sold-item profit calculation.
- **Unsold stock:** Stock Control separately shows unsold/current stock cost. Finance does not provide a distinct year-end unsold-stock reconciliation.
- **Monthly Purchase Spend:** all items purchased in the selected month, including sold and unsold items.
- **Annual inventory cash spent:** all items purchased in the current year.
- **Business purchase total:** same item-first calculation, restricted to operational classification `Business Stock / Resale Inventory`.
- **No transaction-date view:** transaction purchase/invoice dates and gross totals are ignored.
- **No allocation-recognition view:** allocation changes do not flow to Finance.

These are management behaviors, not a formal accounting recognition policy.

## 6. Expense Manager

### Record fields

- `id`
- `date`
- `category`
- `description`
- `amount`
- `paymentMethod`
- `receiptAvailable`
- `receiptNotes`
- optional `linkedItemId`

Categories are Packaging, Shipping supplies, Fuel/travel, Flea-market fees, Storage, Office supplies, Platform/service costs, and Other.

### UI behavior

- Add and edit require nonblank description and a truthy amount.
- Edit reuses the form; delete occurs immediately without a confirmation prompt.
- Filters: month and category.
- Filtered total sums displayed expense amounts.
- Expense rows show category, receipt/no-receipt badge, payment method, optional linked item, notes, value, Edit and Delete.
- Annual and monthly summaries include expenses by `expense.date`.

### Gaps for future EÜR preparation

- No business/private classification or seller classification.
- No currency field.
- No vendor/payee, invoice/document number, tax breakdown, or transaction date versus document date distinction.
- No `evidenceIds`, purchase-transaction link, or direct evidence-record creation.
- No eBay transaction/import link.
- No reconciliation, review, lock/closed-period, export category mapping, or provenance.
- Receipt handling is a Yes/No flag plus free text.
- Linking supports only one item and cannot link to a shared purchase or document.

The model is adequate for basic personal expense tracking and management estimates, but insufficient as an EÜR preparation record without careful extension.

## 7. eBay Reconciliation

### What currently works

- Accepts local `.csv` files.
- Reads text locally; no upload service.
- Parses comma-delimited rows with basic quoted-cell handling.
- Uses the first row as column names.
- Shows detected columns and up to ten preview rows.
- Allows the user to assign a batch month.
- Saves raw batch metadata, columns, and all row objects under separate `toolstack.resellit.ebayImports.v1` localStorage.
- Lists saved batches and allows deletion.
- Displays mapping hints: order date, item title, sale price, fees, shipping, refund, payout.

### What does not happen

- No actual column mapping.
- No locale/dialect configuration or semicolon/tab support.
- No eBay order/transaction identity normalization.
- No matching to inventory items or Sales Hub records.
- No write to sale values, platform fees, shipping, refunds, payouts, or evidence.
- No duplicate import detection.
- No row-level reconciliation status.
- No fee or payout linkage.
- No unresolved-versus-resolved distinction: every saved row is counted as “Unresolved imported records.”
- “Fee reconciliation” is merely current item-derived monthly platform fees.
- “Payout matching” is the placeholder pending-payout estimate, not imported payout matching.

### Ownership recommendation

The parsing/matching engine should be shared. Finance should own fee/payout reconciliation and period completeness; Sales should own sale-record matching and corrections. The current Sales Hub correctly cross-links into Finance rather than duplicating the raw-import UI.

## 8. Sales → Finance Alignment

Finance reads the fields actively edited by Sales Hub:

| Sales field | Finance use |
|---|---|
| `finalSalePrice` | Sales value, revenue and profit |
| `saleDate` | Monthly/yearly sale scope |
| `buyerPlatform` | Fee-gap queues and display; not a Finance grouping dimension |
| `shippingChargedToBuyer` | Gross revenue and item profit |
| `actualShippingCost` | Fees/shipping totals and item profit; bounded fallback to legacy `shippingCost` |
| `packagingCost` | Monthly closing and item profit |
| `manualEbayFee`, fee mode and legacy fee inputs | `platformFees()` |
| `otherPlatformFees`, promoted fee | `platformFees()` |
| `refundAmount` | Item profit and refund summary |
| `returnPostageCost` | Item profit and refund summary |
| `refundDate` | Not used for Finance period scope |
| `refundReason` | Not used in Finance summaries |
| status | Determines sold/returned inclusion through `isSoldStatus()` |

Alignment is good at the field/formula level. Main gaps are period handling for refunds and lack of platform-specific reconciliation.

Finance also reads legacy/fallback fee and shipping fields that Sales no longer independently edits. This is intentional compatibility but remains a conflict risk.

## 9. Returns and Refunds

- `Returned` is a sold status, so returned items remain included in sale-period summaries.
- `refundAmount` and `returnPostageCost` reduce `itemProfitValue`.
- Monthly/annual profit assigns the deductions to the item’s `saleDate`, not `refundDate`.
- `monthlyClosing.refundTotal` includes refund amount plus return postage, again selected by sale month.
- Sales Value and Gross Revenue are not reduced directly; refunds appear as a separate deduction inside profit and the Returns & Refunds card.
- `refundReason` is operational context only.
- General Expenses do not receive refund/return entries automatically.

This is internally consistent for sale-cohort management profit, but inconsistent with a cash/period view when a refund occurs in a later month or year. “Returns & Refunds” also combines customer refund and seller-paid return postage into one value.

## 10. Monthly Closing

### Controls and outputs

- Closing month selector.
- JSON export of the complete `monthlyClosing` object.
- Browser print summary.
- Current-calendar-month performance header cards, notably independent of the selected closing month.
- Selected-month organizer totals.
- Operational classification counts for purchase/sale activity items.
- Missing-proof and Review Later queues.

### Important scope inconsistency

The top “Monthly performance” cards use `sectionSummaries`, which always uses the current calendar month. The organizer below uses the user-selected `closingMonth`. If another month is selected, the panel displays two different periods without making that difference clear.

### Appropriate management summaries

- Sales value and buyer shipping.
- Actual shipping, packaging, platform fees.
- Purchase spend.
- Expense total.
- Sold count and purchase count.
- Estimated net profit, clearly described as an estimate.
- Missing-data queues.

### Potentially confusing for future EÜR work

- Purchase spend includes all purchased stock immediately, while profit uses only sold-item purchase costs.
- Refunds follow sale month rather than refund date.
- Current-month header can disagree with selected month.
- Purchase proof checks ignore transaction-linked documents.
- Operational classifications are mixed with financial closing.
- Pending payout is not a real payout balance.
- Export is a ResellIt JSON summary, not an accountant or tax-software format.

## 11. Year-End & EÜR

### All-item annual totals

- Purchases: item purchase costs by item purchase year.
- Gross sales: final sale plus buyer shipping by sale year.
- Fees + shipping: platform fees plus actual shipping; excludes packaging.
- Expenses: all expense records by expense year.
- Estimated EÜR profit: annual sold-item profit minus all annual expenses.

### Business-only totals

- Filters items by operational `classification === "Business Stock / Resale Inventory"`.
- Does not use `sellerClassification`.
- Includes business item sales, purchases, fees/shipping and item profit.
- Shows all expense records separately because expenses cannot be classification-split.
- Business item profit excludes general expenses.

### Why it is not EÜR-ready

1. Purchase Transactions and Allocations are ignored.
2. Transaction reconciliation and document linkage are ignored.
3. Operational classification is used instead of an explicit reporting policy; `sellerClassification` is unused.
4. Expenses cannot be classified as business/private or mapped to reporting categories.
5. Refunds are scoped by sale date rather than refund date.
6. No distinction exists between transaction cash spend, allocated stock cost, unsold stock, and sold-item cost recognition.
7. No closed-period, adjustment, carryover, or audit trail exists.
8. No validation of evidence completeness for included figures.
9. No external export mapping or source-line traceability.
10. “Estimated EÜR profit” is a management calculation, not a filing-ready result.

## 12. Tax Records

Tax Records currently combines:

- Item-level proof completeness.
- Eigenbeleg needs and previews.
- Operational classification review.
- Expenses missing receipt notes.
- External item proof file references.
- Compliance readiness summaries and queues.

It does not understand transaction-level invoices created in Purchases & Invoices, and its “complete” logic is primarily item-proof based.

### Redundancy

- **Tools Compliance Center:** already owns detailed readiness using `purchaseRecords`, `evidenceRecords`, and Eigenbelege.
- **Item Editor Records & Proof:** owns item proof metadata.
- **Purchases & Invoices:** owns transaction documents, invoice numbers, allocations and integrity/reconciliation.
- **Finance Tax Records:** repeats counts, queues, editing links and Eigenbeleg-oriented UI.

Finance should ultimately retain a compact financial-record-readiness view: missing documents affecting the selected period, unreconciled purchases/sales, expense receipt gaps, and export blockers. Detailed document editing should remain in Purchases/Item Editor, and detailed compliance state in Tools.

## 13. Evidence and Document Alignment

| Evidence kind | Finance exposure/use |
|---|---|
| Invoice linked to Purchase Transaction | Not displayed or counted in Finance readiness |
| Item receipt/proof metadata | Heavily displayed in Tax Records |
| `evidenceRecords` item evidence | Indirectly affects compliance readiness, but not most Finance proof groups |
| Expense evidence | No evidence linkage; only receipt flag and notes |
| eBay evidence/transaction evidence | No Finance document management or matching |
| Eigenbelege | Displayed/generated through item-first paths; detailed handling overlaps Tools/Item Editor |

Finance should show document readiness and links relevant to financial reconciliation, not become the primary document editor. Actual invoice/receipt metadata belongs with the transaction or expense that owns it.

## 14. Private Seller vs Future Business Use

### Useful now

- Sale value and item-profit tracking.
- Shipping, packaging, fees and refund visibility.
- General expense capture.
- Monthly management summary.
- Purchase spend based on current item records.
- eBay CSV retention/preview as a manual reference.
- Missing-record reminders when treated as optional diagnostics.

### Secondary until business registration/use

- Tax Records readiness scores.
- Business-only annual view.
- Estimated EÜR output.
- Accountant export plans.
- Compliance-heavy classification decisions.

The current hub places Tax Records and Year-End & EÜR alongside core operational tools with equal visual weight. They should remain available but visually secondary until their data model and reporting policy are mature.

## 15. Finance Hub UI Assessment

### Strengths

- Clear hub/tile design consistent with Sales and Tools.
- Details stay panel-driven instead of crowding the hub.
- Monthly, expenses, reconciliation and year-end are understandable destinations.
- Sales Hub cross-link to eBay Reconciliation is sensible.
- Expense form and selected-month closing are usable.

### Weaknesses

- No cross-link to Purchases & Invoices despite purchase spend being central to Finance.
- Tax Records has overlapping active render implementations.
- Export Monthly JSON is duplicated as a hub tile and inside Monthly Closing.
- “Coming Soon” consumes substantial space for disabled tools.
- Monthly Closing repeats Dashboard/Stock/Sales information without consistently clarifying scope.
- The selected-month/current-month mismatch is visually hidden.
- Payout and reconciliation terminology overstates current capability.
- Year-End/EÜR prominence exceeds its reliability.

### UI-only cleanup opportunities

- Collapse disabled tools into a compact planned-features note.
- Keep one Tax Records panel.
- Make Purchases & Invoices a visible cross-link, not a second manager inside Finance.
- Keep the export action inside Monthly Closing only.
- Explicitly label current-calendar-month versus selected closing month.
- Rename placeholder reconciliation metrics until real matching exists.

## 16. Data Source Matrix

| Finance concept | Current source of truth | Future recommended source | Migration risk |
|---|---|---|---|
| Purchase cost used in item profit | `item.purchasePrice` | Linked allocation, with legacy item fallback | High: conflicts and unmigrated items |
| Purchase transaction total | Not used | `PurchaseTransaction.grossTotal` once per transaction | Critical double-count risk |
| Item allocated cost | Not used by Finance | `PurchaseAllocation.allocatedPurchaseCost` | High: allocation edits can diverge from item cost |
| Purchase cash period | `item.purchaseDate` | Transaction purchase/payment date policy | High: multi-item duplicates if counted per item |
| Sale value | `finalSalePrice` | Same canonical field or future sale transaction record | Low |
| Shipping income | `shippingChargedToBuyer` | Same sale record field | Low |
| Shipping cost | `actualShippingCost`, legacy fallback | Same canonical sale-cost field | Medium legacy conflicts |
| Packaging cost | `packagingCost` | Same, or classified expense linkage where appropriate | Medium overlap with general expenses |
| Platform fees | `platformFees()` over item fee fields | Reconciled platform transaction/fee records | High until imports match items |
| Refunds | `refundAmount + returnPostageCost`, scoped by sale date | Dated refund events linked to sale | High for cross-period reporting |
| General expenses | Root `expenses` | Expanded expense entity with evidence/classification | High migration/category mapping |
| Evidence status | Mostly item proof fields; partial compliance helpers | Evidence linked to purchase/sale/expense owners | High duplicate and missing-link risk |
| Business classification | Operational item `classification` | Explicit reporting policy using seller/business classification | High historical ambiguity |

## 17. Accounting Scope Boundary

### Finance should do

- Summarize item, purchase, sale and expense figures.
- Reconcile Purchase Transaction totals to allocations.
- Reconcile platform reports to sale/fee records.
- Identify missing, conflicting, orphaned or unreconciled data.
- Preserve traceability from summary figures to source records.
- Produce clearly scoped JSON/CSV/accountant-friendly preparation exports.
- Provide monthly and annual management estimates.

### Finance should not become

- A full double-entry general ledger.
- A tax-law decision engine.
- An ELSTER submission client.
- A VAT filing engine.
- A substitute for professional year-end adjustments.
- An automatic accounting-policy authority for inventory recognition or private/business classification.

## 18. Ranked Risks

### Critical

1. **Future acquisition double counting:** adding transaction gross totals to existing item purchase totals would count V2 purchases twice.

### High

1. Item purchase values and allocations can diverge after either is edited; Finance has no conflict report.
2. “Estimated EÜR profit” suggests more accounting readiness than the underlying data supports.
3. Business-only summaries use operational classification and ignore `sellerClassification`.
4. Refunds and return postage are assigned to sale date, not refund date.
5. Transaction-level invoice evidence is invisible to Finance proof readiness.

### Medium

1. Multiple active Tax Records blocks create duplicated/conflicting UX.
2. eBay “reconciliation” stores raw rows but does not reconcile.
3. Expenses lack classification, evidence linkage, vendor/currency and reporting mappings.
4. Monthly performance cards use current month while the organizer can show another selected month.
5. Pending payout estimate omits refunds, packaging and actual payout data.
6. Annual “Fees + shipping” excludes packaging without saying so.

### Low

1. Duplicate monthly export entry points.
2. Disabled tiles occupy excessive hub space.
3. Mixed legacy terminology remains inside the Tax Proof Manager block.
4. Some management figures are duplicated across Dashboard, Stock, Sales and Finance.

## 19. Recommended Finance V2 Structure

### Current Position

Retain a compact current-month financial summary, explicitly scoped and using existing item calculations. Avoid duplicating Stock operational counts.

### Expenses

Retain Expense Manager. Later extend its entity/evidence/classification model rather than replacing it.

### Purchases

Add a cross-link and summary of Purchase Transaction reconciliation: transaction count, unreconciled totals, allocation conflicts and missing documents. Keep creation/editing in Purchases & Invoices.

### Sales Reconciliation

Retain the eBay import destination, but present it as Import Staging until mapping/matching exists. Eventually share one matching engine with Sales.

### Monthly Closing

Retain. Resolve period-scope ambiguity, separate purchase cash flow from sold-item margin, and add data-quality blockers.

### Year-End & EÜR

Retain but visually secondary and explicitly estimated. Defer filing-oriented claims until classification, expenses, documents, and purchase authority are resolved.

### Tax Records / Data Issues

Merge Finance Tax Records into a compact “Financial Data Issues” panel. Route document edits to Purchases/Item Editor and compliance details to Tools.

### Remove or defer

- Remove duplicate Tax Records rendering.
- Remove duplicate hub-level monthly export.
- Defer Accountant Export and Payout Matching until their underlying data exists.
- Do not build a full Profit Report until metric definitions/source authority are settled.

## 20. Recommended Implementation Order

### Phase A — Safe cleanup

**Objective:** Improve truthfulness and reduce duplication without changing formulas.

- Consolidate Tax Records to one panel.
- Clarify current-month versus selected-month labels.
- Rename placeholder payout/reconciliation metrics.
- Add a Purchases & Invoices cross-link.
- Reduce disabled-tile prominence.

**Dependencies:** None beyond current selectors.  
**Do not change:** item authority, formulas, schema, classifications.

### Phase B — Purchase architecture integration

**Objective:** Read transaction/allocation integrity without changing current financial totals.

- Show transaction reconciliation counts and differences.
- Show item-versus-allocation conflicts.
- Recognize transaction-linked evidence in readiness.
- Define explicit source-of-truth and fallback policy.

**Dependencies:** Purchase integrity/reconciliation helpers already exist; conflict helper and reporting policy are still needed.  
**Do not change:** item profit or purchase totals yet; do not migrate inventory automatically.

### Phase C — Reconciliation

**Objective:** Build a shared eBay import mapping/matching engine and stronger expense/document linkage.

- Map eBay columns into normalized import records.
- Match rows to sales/items without silent writes.
- Reconcile platform fees, refunds and payouts.
- Add resolution states and audit trail.
- Extend expenses with evidence and reporting classification.

**Dependencies:** Stable transaction identities, canonical sale fields, safe match review UI.  
**Do not change:** Sales ownership or overwrite canonical values automatically.

### Phase D — EÜR preparation

**Objective:** Produce traceable, clearly scoped preparation figures and exports.

- Establish business-inclusion policy.
- Establish dated refund/expense/purchase recognition rules.
- Map categories and evidence completeness.
- Produce source-linked annual exports and validation report.

**Dependencies:** Phases B/C, resolved classifications, expense model, reconciliation completeness.  
**Do not build:** ELSTER submission, full double-entry ledger, or automatic tax decisions.

## 21. Final Assessment

### Does Finance align with the new purchase architecture?

Partially. It aligns with the deliberate transitional rule that item purchase fields remain authoritative. It does not yet consume or report Purchase Transactions, Allocations, reconciliation, or transaction evidence.

### What is outdated?

- Item-only Tax Records/proof assumptions.
- Operational-classification-based “business” reporting.
- Raw CSV staging presented as reconciliation.
- EÜR terminology that exceeds the model’s readiness.
- Multiple Tax Records render paths.
- No Finance cross-link or summary for Purchases & Invoices.

### What is correctly aligned?

- Canonical sale amount usage.
- Comprehensive item-profit deductions.
- Sales Hub field coverage.
- Current item purchase authority and V2 compatibility-copy behavior.
- Separate general expense collection.
- Panel-driven Finance hub and month/year selectors.
- No current double counting of transaction totals.

### Five highest-value Finance changes

1. Enforce and document the no-double-counting/source-authority policy before reading transaction totals.
2. Add read-only Purchase Transaction reconciliation and item/allocation conflict summaries.
3. Consolidate Tax Records and recognize transaction-linked evidence.
4. Correct Monthly Closing period labels and refund-period limitations.
5. Build real eBay mapping/matching states before calling the feature reconciliation or payout matching.

### What to leave alone for now

- Existing item-based Stock Cost and item-profit formulas.
- Quick Add, Item Editor and legacy item-first acquisition paths.
- Existing purchaseRecords/Eigenbeleg behavior.
- Current backup format and persisted collections.
- Sales Hub ownership of sale completion.
- Full accounting, ELSTER submission and tax-decision functionality.
