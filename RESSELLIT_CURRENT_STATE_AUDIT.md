# ResellIt Current-State Audit

**Audit date:** 2026-08-10  
**Scope:** Read-only review of the repository at the time of audit  
**Application:** `toolstack-resell-it`  
**Method:** Source inspection plus non-writing lint and unit-test execution. A production build was deliberately not run because it would update `dist/`, contrary to the requirement that only this report be created.

## Executive Summary

ResellIt is a functional, local-first React/Vite single-page application for individual reseller inventory, listing preparation, sales tracking, basic finance, and German-oriented record readiness. Its strongest areas are the unusually broad item schema, practical stock ledger, generated eBay listing copy, local JSON backup/restore, calculation helpers, and the start of a normalized tax/compliance model.

The product is best classified as a capable prototype or early internal tool, not yet a production-grade bookkeeping, tax, or marketplace integration system. All business data lives in browser `localStorage`; there is no authentication, database, cloud synchronization, automatic backup, audit log, multi-user protection, or server-side validation. Evidence files are primarily represented by metadata or external paths, not managed end to end.

The user-facing application has five main destinations: Home, Stock Control, Sales, Finance, and Tools. Stock Control is the most complete operational hub. Sales is functional for status and financial-field editing but derives everything from inventory items rather than maintaining a dedicated order/transaction ledger. Finance supplies summaries, expenses, CSV staging, tax-readiness queues, monthly closing, and year-end estimates, but reconciliation mapping and accountant-grade exports remain incomplete. Tools clearly labels several future features as unavailable.

The main technical risk is concentration: `src/App.jsx` is roughly 3,800 lines and owns navigation, persistence, business actions, derived reporting data, and much of the UI. This raises regression risk and makes behavior harder to verify. Domain logic has begun moving into `resellitSchema.js`, `resellitLogic.js`, and focused components, which is the right direction.

Static quality is mixed but encouraging. ESLint passes. The Node test suite reports 52 passing tests and one failure. The failure is a source-text assertion expecting an exact Sales close-button expression; the current button also resets the selected sale item, so the failure appears to be a brittle test expectation rather than evidence that the close control is absent. There are no browser-level component, accessibility, persistence, or end-to-end tests.

**Overall current-state rating:** strong local prototype, suitable for controlled personal use with disciplined manual backups; not yet suitable as the sole authoritative accounting/compliance record or as a production multi-device service.

## Application Structure

### Runtime and dependencies

- React 19 with React DOM, bundled by Vite 8.
- Tailwind CSS is integrated through the Vite plugin and used through utility classes.
- `lucide-react` supplies icons.
- There is no router, state-management library, form library, validation library, database SDK, backend client, or eBay SDK.
- The app mounts from `src/main.jsx` and renders the default export from `src/App.jsx`.

### Source organization

- `src/App.jsx` is the application shell and dominant feature module. It owns state, navigation, persistence, import/export, calculations, most forms, and most hub content.
- `src/resellitSchema.js` contains defaults, options, normalization, validation, classification, compliance readiness, and legacy-to-normalized record scaffolding.
- `src/resellitLogic.js` exposes monetary calculations, sale-status helpers, backup-shape validation, HTML sanitization, duplication, and listing-reset logic.
- `src/ebayListingTemplate.js` generates listing titles, condition copy, bilingual labels/headings, descriptions, warnings, readiness, and HTML.
- Extracted UI components cover the stock table, eBay studio, expense manager, cards, and basic form controls.
- `test/resellitLogic.test.js` is a large Node test file combining unit tests with source-text architecture assertions.

### Architectural assessment

The extracted domain modules are a sound foundation, but `App.jsx` remains a monolith. State changes and persistence are tightly coupled to UI handlers, while some UI architecture tests inspect source strings instead of behavior. There are also overlapping legacy and current data fields (for example `salePrice`/`finalSalePrice`, `shippingCost`/`actualShippingCost`, and old/new listing description fields). Normalization limits breakage but increases maintenance cost.

Recommended target boundaries are: application shell/navigation, storage repository, inventory domain, listing domain, sales domain, finance/reporting domain, compliance domain, and import/export services. This can be achieved incrementally without changing the local-first product model.

## Navigation / Hubs

The app uses local React state rather than URL routing. `activeTab` selects Home/dashboard, Stock Control, Sales, Finance, or Tools. Detail tiles use additional state such as `activeFinancePanel`, `activeSalesPanel`, and `activeToolPanel` and scroll opened panels into view.

### Strengths

- The five destinations align with the reseller workflow and use consistent hub-specific accent colors.
- Hubs generally open detail panels only when requested, reducing default-page clutter.
- Cross-hub shortcuts connect issue queues, listing work, sales, finance reconciliation, and item editing.
- Escape closes the active item editor; panel close controls are generally available.

### Gaps and risks

- Navigation has no URLs, browser history, deep links, refresh restoration, or shareable hub/panel state.
- Several layers of state (`activeTab`, section, panel, form/editor, filters) can create implicit combinations that are difficult to reason about.
- The labels “Home,” “dashboard,” section keys, and panel keys are conceptually overlapping.
- Mobile and keyboard navigation behavior cannot be established from unit tests.
- Navigation state and filters mostly reset on reload; only data and stock column widths persist.

## Stock Control

Stock Control is the most complete feature area. It presents a master ledger and supports quick item creation, inline edits, a detailed item editor, search, classification/status/category/issue filters, sorting, timeline grouping, compact/detailed views, and resizable persisted columns.

### Working capabilities

- Quick stock entry captures date, item, source, cost, and classification.
- Active stock excludes items archived as `personal_collection`.
- The table exposes date, item, status, seller classification, compliance, source, purchase, sold price, profit, proof, and actions depending on view mode.
- Inline editing covers core ledger fields and persists changes.
- Status, classification, issue, category, timeline, and search filters can be combined and cleared.
- Needs-attention queues identify missing proof, research, listing drafts, and unresolved classification.
- Items can be edited, duplicated into a clean draft, marked as needing a listing, archived to personal collection, or permanently deleted after confirmation.
- Permanent deletion intentionally preserves purchase/evidence/final compliance records while removing linked drafts, which favors record retention.

### Concerns

- The “active stock” concept combines operational inventory with some sold workflow states; reporting depends on separate status helpers and can be difficult to explain.
- Inline edits persist immediately, with no undo, change history, dirty-state indicator, or bulk operation support.
- Permanent deletion can orphan retained compliance records by design; the UI should explicitly expose and manage those retained records.
- Quick add defaults items to business resale classification, which is efficient but could cause compliance misclassification if users do not review it.
- The data table is dense, and responsive/keyboard/screen-reader behavior is not covered by tests.

## Item Editor

The item editor captures sourcing, classification, purchase data, research, proof, listing preparation, condition, shipping, advanced sale fields, and notes. It is the primary data-entry surface and contains both simplified workflow sections and advanced sections.

### Strengths

- Broad domain coverage supports the complete lifecycle from sourcing to sale and return.
- Seller classification is distinct from the older high-level classification, allowing private, pre-registration, business, and excluded handling.
- Condition grade, exact eBay condition text, tested status, defects, included items, photos, pricing research, and bilingual listing inputs are represented.
- Save failure preserves editor state and surfaces an error instead of clearing work.
- Duplicate-to-draft deliberately clears sale, shipping, refund, fee, tracking, and platform fields.
- Listing-needed reset clears fields that might falsely imply readiness.

### Concerns

- The editor is very large and has many similar or legacy fields. Users may not understand which values are authoritative.
- Required-field validation is minimal at the UI boundary; item name is the principal enforced requirement.
- Monetary and date fields are stored as strings and validated mostly through normalization/calculation fallbacks.
- There is no form-level error summary, schema-driven validation, autosave draft, unsaved-changes warning, or undo.
- Proof attachment fields include a legacy data URL but current workflows mainly record filenames/folder locations; file lifecycle is not integrated.
- `DISABLED_LEGACY_UI` is currently `false`, so blocks guarded by it remain rendered despite the name. This naming makes feature intent ambiguous and increases the chance of accidental regressions.

## Sales Hub

The Sales Hub is a tile-driven operational view over item data. It provides sold items, completed sales, returns/refunds, sales data gaps, profit review, CSV import access, and eBay reconciliation shortcuts. Sale editing writes back to the same inventory item records.

### Working capabilities

- Counts and queues are derived from item status.
- Users can edit sale date/price, platform, shipping charged, actual shipping, packaging, fees, tracking, refund data, and related status fields.
- Profit review uses shared calculation helpers rather than duplicated display math.
- Data-gap queues identify incomplete sold records.
- Cross-links route users into Finance import/reconciliation.

### Limitations

- There is no independent order, order-line, payment, payout, shipment, refund-event, or buyer-transaction entity.
- One inventory item effectively represents one sale lifecycle; partial sales, quantities, bundles, split shipments, multiple refunds, relisting history, and repeated sales are not modeled cleanly.
- eBay imports are not matched to sale records, so the hub remains manually maintained.
- There is no marketplace status synchronization or API integration.
- The current source-test failure is in the Sales Hub close-button assertion. The UI closes the panel and clears `salesEditItemId`; the test expects only the first state change.

## Finance Hub

Finance is organized around tile-selected panels rather than rendering all detail content by default. It includes monthly closing, expense management, eBay reconciliation/import, tax records, and year-end/EÜR estimates.

### Working capabilities

- Current-month and year summaries derive purchases, sales, item profit, fees, shipping, refunds, expenses, and review queues.
- Monthly closing supports month selection, summary cards, review lists, JSON export, and print-oriented presentation.
- Expense records support create/edit/delete, category and month filters, receipt status/notes, optional item linking, and totals.
- Tax queues expose missing proof, Eigenbeleg requirements, unresolved classification, and expenses lacking receipt notes.
- Year-end views distinguish business inventory where possible and explicitly note that general expenses are not classification-split.
- CSV batches can be uploaded, previewed, labeled by month, persisted, exported as part of full backups, and removed.

### Limitations

- Financial figures are management estimates, not a double-entry ledger or accountant-grade books.
- Expenses do not have business/private allocation, tax treatment, VAT fields, depreciation, counterparty, invoice number, or robust evidence linkage in the UI.
- The year-end/EÜR view is a summary aid, not an ELSTER/EÜR submission workflow.
- Imported eBay rows are staged as arbitrary column/value objects; exact mapping, matching, deduplication, validation, and reconciliation are explicitly deferred.
- Currency is effectively EUR-centric despite some records carrying a currency field.
- There is no locking/closing state, audit trail, correction entry, or reproducible report snapshot.

## Tools Hub

The Tools Hub clearly separates active utilities from future placeholders.

### Active

- Full JSON backup export and restore.
- Compliance Center with readiness totals and queues.
- Listing queue shortcut.
- eBay import/reconciliation shortcut.
- App information, help guide, and backup instructions.

### Coming soon or disabled

- Monthly Report tile.
- Tax Export Package.
- Profit Summary.
- Unmatched eBay Transactions tool.
- Listing templates.
- Condition text templates.
- Eigenbeleg text templates.

The explicit “Coming soon” and disabled styling are good product honesty. However, monthly-closing JSON already exists elsewhere, so naming should clarify the distinction between the current export and the planned formal Monthly Report.

## Tax & Compliance

The code contains a meaningful normalized compliance model: purchase records, evidence records, Eigenbelege, seller classification, readiness rules, validation helpers, summaries, and legacy scaffolding helpers.

### Current behavior

- Business-relevant items require a linked purchase record and non-missing evidence.
- Items without a receipt can additionally require an Eigenbeleg.
- Private and excluded items are marked not applicable by the readiness calculation.
- Draft Eigenbelege can be generated from item/purchase/evidence data, previewed, edited, saved, copied, and regenerated while still drafts.
- Finalized compliance records are intentionally protected from some item-deletion behavior.
- Migration/scaffolding helpers exist but are not automatically persisted, avoiding silent fabrication of tax records.

### Material gaps

- The normalized purchase/evidence models are more advanced than the UI. There is no complete CRUD manager for purchase records or evidence records.
- A draft Eigenbeleg can be generated without a purchase record, but schema validation requires `purchaseRecordId`; generated drafts can therefore remain structurally incomplete.
- Readiness treats any non-“Missing” evidence status as present, including “Needs review” or “Archived”; this may be too permissive for tax readiness.
- Readiness treats an Eigenbeleg as present when its status is anything other than “Not needed,” including an incomplete draft. “Present” is not the same as final or legally adequate.
- The app does not provide legal guarantees, retention controls, immutable documents, signatures, sequential document numbering, or jurisdiction/version metadata.
- Evidence may be a filename/path note only; browser code cannot ensure the referenced file exists or remains unchanged.

This module should be framed as record-preparation assistance, not tax advice or compliance certification. A German tax professional should validate workflows, fields, retention periods, Eigenbeleg wording, VAT assumptions, and EÜR output before production reliance.

## eBay Workflow

The listing workflow is more mature than the transaction-import workflow.

### Listing preparation

- Generates an eBay-oriented title with an 80-character limit.
- Supports German and English labels/headings and language mismatch warnings.
- Generates exact condition copy, product details, feature bullets, included-items text, defect disclosures, private-seller notes, and shipping text.
- Produces plain text and styled HTML, with preview sanitization before `dangerouslySetInnerHTML`.
- Calculates completeness/readiness and warning lists.
- Provides sold/active eBay, Google, Kleinanzeigen, ChatGPT, and DeepL research links.
- Removes pickup/collection wording from generated shipping copy.

### Gaps

- “Generate eBay Listing” creates local copy only; it does not create or revise a live eBay listing.
- There is no eBay authentication, Inventory API/Trading API integration, category/aspect mapping, image upload, policy selection, SKU synchronization, or live listing ID.
- Translation buttons open external services; they do not translate inside the app.
- CSV parsing is comma-only at the delimiter level and processes physical lines independently. Multiline quoted fields and semicolon/tab-delimited German exports can parse incorrectly.
- Import mapping is only a header-hint check. Rows are not normalized, matched, reconciled, or posted to inventory/sales.
- HTML sanitization is a useful defense, but security behavior should be covered by dedicated adversarial tests or a maintained sanitizer library if arbitrary imported HTML becomes possible.

## Data Model

### Root persisted model

The primary version-2 payload contains:

- `items`
- `expenses`
- `purchaseRecords`
- `evidenceRecords`
- `eigenbelege`
- `updatedAt`

eBay CSV batches and stock column widths are stored under separate keys.

### Item model

Items contain identity/category; old and new classifications; source/purchase fields; receipt/proof metadata; price research; listing language/title/content; brand/model/specifications; condition/testing/defect/photo checklists; sale, shipping, fees, refund, tracking; and notes.

### Normalized supporting records

- Purchase records represent source, seller, dates, cost allocation, payment, receipt/proof status, and evidence links.
- Evidence records can represent receipt/invoice/Eigenbeleg and other evidence, with metadata-only, IndexedDB-key, external-path, or external-URL storage modes.
- Eigenbelege represent generation context, acquisition facts, reason, amount, text/HTML, evidence links, status, and finalization metadata.

### Model risks

- Parallel legacy/current fields create unclear sources of truth.
- Referential integrity is convention-based; there are no database constraints.
- IDs use `crypto.randomUUID()`, which is appropriate locally, but orphan references and duplicate imports are not systematically checked.
- Record versioning is root-level only; there are no formal migration functions keyed by source version.
- `normalizeRootAppData` accepts the numeric version but normalizes into the current shape without rejecting unknown future versions.
- Many numeric values remain strings, and arbitrary expense objects receive little normalization compared with the other entities.
- Current constants derive date/month/year at module load time, so an app left open across midnight/month/year will retain stale default/current periods until reload.

## Persistence / Backup

### Current implementation

- Primary storage key: `toolstack.resellit.v1`.
- Legacy key migration: `toolstack.resellerit.v1`.
- eBay batches: `toolstack.resellit.ebayImports.v1`.
- Stock column widths: `resellit.stockColumnWidths.v1`.
- Writes use normalized JSON and catch storage quota/unavailability errors.
- Full backup export and confirmation-based restore are implemented.
- Partial backup payloads are rejected by helper logic and covered by tests.

### Risks

- `localStorage` is device/browser/profile/origin specific and can be cleared by users, browser policies, privacy tools, or origin changes.
- There is no encryption, login boundary, cloud copy, scheduled backup, integrity hash, backup rotation, or recovery history.
- Persistence is whole-document replacement. Concurrent tabs can overwrite each other; there is no `storage` event conflict handling or optimistic version check.
- eBay batches live under a separate key, increasing the importance that backup/export always includes them and restore handles them consistently.
- Legacy migration behavior is split across separate initializers; partial migration failures may be hard to diagnose.
- Proof blobs are not a scalable fit for `localStorage`; the code strips oversized legacy data URLs, which protects capacity but can discard embedded evidence while only appending a note.

Before relying on the tool for business records, users should export backups frequently and keep multiple dated copies outside the browser.

## Dead / Legacy Code

- `App.jsx` contains substantial blocks guarded by `DISABLED_LEGACY_UI`. Because the constant currently equals `false`, the name contradicts the behavior: `DISABLED_LEGACY_UI && ...` blocks are hidden, while other paths remain current. The flag and guarded sections need an explicit inventory before removal.
- The final generic item renderer is excluded for Stock, Sales, Finance, and Tools and is effectively tied to the dashboard/other-tab condition; the dashboard itself returns an empty `filtered` set. This suggests old card-list rendering may now be unreachable.
- `stockSectionDetails`, `financeSection`, expanded proof/card state, classification filtering, and older editor sections appear partly associated with legacy render paths and should be confirmed with coverage before cleanup.
- Demo items remain runtime fallback data. On missing or malformed storage the app can show sample records, which may be mistaken for restored user data.
- Duplicate item fields and migration aliases remain intentionally for backward compatibility but should be documented and eventually migrated to canonical fields.
- Default Vite/React assets and the template-style README remain in the repository even though branded assets and a real application are present.
- Several planned schema capabilities (`indexeddb` evidence, external URLs, source sessions) are not connected to complete user workflows.

No dead or legacy code should be deleted until behavior-level tests establish the currently reachable paths and a real backup is used to test migration.

## UX Consistency

### Strengths

- Consistent rounded-card visual language, hub-specific colors, shared cards, and shared form controls.
- Helpful explanatory copy accompanies most complex financial and compliance areas.
- Empty states, status badges, queue counts, close buttons, and destructive confirmations are commonly present.
- Future tools are visibly disabled rather than pretending to work.
- German locale currency formatting and bilingual listing support fit the intended user context.

### Issues

- The app mixes English UI, German domain terms, and bilingual listing controls without a full application-language strategy.
- Similar actions use “Close,” “Close Sales Edit,” Escape, archive, delete, and panel resets with inconsistent secondary-state behavior.
- Some controls are custom dense table inputs without explicit labels; placeholder/title text is not a substitute for accessible labeling.
- Hub tile panels may create long scroll jumps and make location/state less obvious than routed pages or dialogs.
- There is no global unsaved-change protection or consistent save-state indicator.
- Toast and inline messages are not visibly implemented as ARIA live regions in the reviewed code.
- Color carries substantial hub/status meaning; contrast and color-independent cues need formal verification.
- Responsive behavior is designed with Tailwind breakpoints but has no automated viewport testing.

## Testing

### Audit results

- `npm run lint`: **pass**.
- `npm test`: **fail overall — 53 tests, 52 passed, 1 failed**.
- Failing test: `Sales Hub uses tile-driven panels without changing sales data ownership`.
- Failure cause observed: a regular expression expects the close button to call only `setActiveSalesPanel(null)`. Current code calls both `setActiveSalesPanel(null)` and `setSalesEditItemId(null)`. This is a test/source-shape mismatch unless product requirements prohibit clearing the sale editor.
- Production build: not run, because Vite would write to `dist/` and violate this audit's “only create the report” constraint.

### Coverage strengths

- Schema defaults and normalization.
- Classification and status normalization.
- Sale/profit calculations and sold-only behavior.
- Compliance readiness, validation, summaries, and legacy scaffolding.
- Backup payload compatibility and persistence source guards.
- Item duplication and listing reset behavior.
- Listing generation, condition text, language, HTML sanitization, and shipping wording.
- Some hub architecture and visibility expectations through source-text assertions.

### Coverage gaps

- No rendered React component tests.
- No browser/end-to-end workflow tests.
- No localStorage quota, corrupted payload, cross-tab conflict, or restore round-trip integration test.
- No accessibility testing.
- No visual/responsive regression testing.
- No CSV edge-case suite for multiline quotes, alternate delimiters, encoding, duplicate headers, or large reports.
- No full reconciliation tests because reconciliation is not implemented.
- No direct testing of item editor validation and most interactive state transitions.
- Source-regex tests are brittle and can fail on harmless code-shape changes; behavior-focused tests should replace them.

## Feature Matrix

| Area | Feature | State | Assessment |
|---|---|---:|---|
| Navigation | Five primary hubs | Working | State-driven; no routes/deep links |
| Home | Operational overview/queues | Working | Derived from local records |
| Stock | Master inventory ledger | Working | Strongest operational surface |
| Stock | Quick add and inline edit | Working | Immediate persistence; no undo |
| Stock | Search/filter/sort/timeline | Working | Broad filter set |
| Stock | Resizable saved columns | Working | Preference stored separately |
| Stock | Archive/delete/duplicate | Working | Retention behavior needs clear UX |
| Item Editor | Source, listing, proof, sale data | Working | Very broad but complex |
| Item Editor | Robust validation/unsaved guard | Missing | Only limited validation |
| Sales | Status-based queues and editing | Working | Uses item as sale record |
| Sales | Orders/payouts/refund events | Missing | Needs normalized transaction model |
| Finance | Expense manager | Working | Basic local expense ledger |
| Finance | Monthly closing | Working/estimate | JSON and print support |
| Finance | Year-end/EÜR summary | Working/estimate | Not submission-ready |
| Finance | eBay CSV upload/preview | Partial | Stores raw batches |
| Finance | CSV mapping/reconciliation | Planned | Explicitly deferred |
| Compliance | Readiness calculations | Working | Rules need legal/product validation |
| Compliance | Purchase/evidence schemas | Partial | Logic exists; UI CRUD incomplete |
| Compliance | Draft Eigenbeleg | Working/partial | Draft lifecycle; final workflow incomplete |
| eBay | Listing copy and HTML | Working | Strong local helper |
| eBay | Live listing API | Missing | No eBay connection |
| eBay | Transaction synchronization | Missing | Import is manual staging only |
| Tools | JSON backup/restore | Working | Manual, local, whole-payload |
| Tools | Compliance Center | Working | Read-only issue queues |
| Tools | Formal reports/tax package | Planned | Disabled tiles |
| Tools | Templates | Planned | Disabled tiles |
| Persistence | Browser localStorage | Working | Single-device and fragile |
| Persistence | Database/cloud sync | Missing | No backend |
| Security | Authentication/access control | Missing | Local browser boundary only |
| Testing | Domain unit tests | Good baseline | 52 passing |
| Testing | UI/E2E/accessibility | Missing | Major confidence gap |

## Cleanup Roadmap

### Priority 0 — establish a safe baseline

1. Resolve the single failing Sales Hub test by deciding whether clearing `salesEditItemId` is desired, then test behavior rather than an exact source string.
2. Add a documented manual smoke-test checklist and capture a known-good backup fixture.
3. Replace the template README with product setup, storage, backup, limitations, and recovery documentation.
4. Clearly label demo/fallback data so malformed storage cannot be mistaken for real recovered records.

### Priority 1 — reduce ambiguity without changing behavior

1. Inventory every `DISABLED_LEGACY_UI` block and identify reachable versus superseded interfaces.
2. Document canonical fields and aliases; choose authoritative sale, shipping, price-research, listing-copy, and classification fields.
3. Add explicit schema version migrations instead of relying only on broad normalization.
4. Normalize and validate expenses to the same standard as purchase/evidence/Eigenbeleg records.
5. Centralize storage keys, serialization, migration, backup, and restore in a storage module.

### Priority 2 — split the monolith

1. Extract navigation/application shell.
2. Extract inventory editor/actions and selectors.
3. Extract Sales, Finance, Tools, and dashboard feature modules.
4. Move CSV parsing/import services out of the component.
5. Move all derived selectors/report calculations into pure tested domain modules.

### Priority 3 — remove verified legacy material

1. Add behavior tests for replacement paths.
2. Remove only unreachable guarded render blocks and unused state after verification.
3. Migrate stored data to canonical fields, retain one bounded compatibility migration, and then remove duplicate-field writes.
4. Remove unused starter assets and update branded documentation.

## Development Roadmap

### Phase 1 — reliability for personal local use

- Make the full test suite green and add component tests for each hub.
- Add backup restore round-trip tests and prominent “last successful backup” guidance.
- Add form validation, unsaved-change protection, and accessible status announcements.
- Improve CSV parser robustness and clearly report unsupported formats.
- Refresh “current date/month/year” dynamically instead of only at module load.

### Phase 2 — normalized operational records

- Introduce canonical sale/order, shipment, fee, payout, and refund entities linked to inventory.
- Complete purchase-record and evidence-record CRUD interfaces.
- Add referential-integrity checks and an orphan-record review tool.
- Separate business/private allocation for expenses and clarify currency handling.
- Define readiness levels that distinguish draft, reviewed, final, and actually evidenced records.

### Phase 3 — reconciliation and reporting

- Build configurable eBay CSV profiles with delimiter/encoding detection and column mapping.
- Add import idempotency, stable transaction IDs, duplicate detection, matching suggestions, and manual resolution.
- Produce reproducible monthly closing snapshots and accountant-oriented exports.
- Add formal report metadata, export versioning, and traceability back to source records.
- Validate German EÜR/tax workflows with a qualified professional before presenting them as compliant outputs.

### Phase 4 — durable persistence

- Move large evidence to IndexedDB or a deliberately chosen file/document store.
- Add integrity checks, automated versioned backups, conflict detection, and tested recovery.
- If multi-device or multi-user use is required, introduce an authenticated backend, per-user data ownership, authorization, encryption in transit/at rest, and audit history.
- Retain offline/local export so users are never locked into the service.

### Phase 5 — marketplace integration

- Add eBay OAuth and a secure server-side token model; do not place long-lived secrets in browser code.
- Map inventory to eBay categories, item specifics, policies, images, SKUs, and listing IDs.
- Synchronize orders and transaction details into the normalized sales model.
- Add retry/idempotency handling, API error queues, rate-limit awareness, and reconciliation between remote and local state.

## Final Assessment

ResellIt already delivers meaningful value as a personal reseller operations workspace. The stock ledger, item editor, listing generator, sales calculations, finance summaries, and compliance scaffolding show strong domain understanding and are more substantial than a typical prototype. The code also demonstrates care around backward compatibility, failed local saves, retained compliance records, sanitized listing previews, and explicit labeling of unfinished tools.

The next milestone should be reliability and clarity, not additional surface area. The immediate priorities are to restore a green test baseline, define canonical data fields, isolate persistence, replace brittle source assertions with behavior tests, and split `App.jsx` by domain. After that, normalize sales transactions and complete evidence/purchase workflows before building formal reconciliation or tax exports.

For now, the app is appropriate for controlled personal use when the user understands that browser storage is fragile and performs frequent external backups. It should not be treated as the only copy of evidence, a legally authoritative compliance system, a live eBay integration, or a substitute for professional tax/accounting review. With the staged roadmap above, it has a credible path from strong local prototype to dependable reseller operations product.
