# ResellIt GPT Listing Package Workflow Audit

**Audit date:** 2026-08-13  
**Scope:** Current Item Editor, eBay Listing UI, listing generation/readiness, canonical-field behavior, and a proposed machine-readable Listing Package v1.  
**Method:** Read-only inspection of the current source. No code, schema, persistence, data, or UI was changed.

## Executive Summary

ResellIt can support a paste/parse/validate/preview/apply workflow without replacing its item model. The safest design is to let the external GPT provide final German listing copy and research recommendations, while ResellIt remains authoritative for physical inspection facts, acquisition records, lifecycle, sales, finance, and compliance.

The current Research & Condition section combines two unlike responsibilities. Tested status, condition grade, defects, and condition notes are durable item facts; search queries, comparison ranges, and research notes are optional preparation data. The latter can be hidden from the normal workflow without breaking current financial calculations or the existing listing-readiness helper.

Listing Package v1 should write only canonical fields. Generated copy can be selected by default when the target is empty, but factual or consequential fields—condition, accessories, category, measurements, and price—must require review. The package must never contain or apply purchase, lifecycle, sale, fee, shipping-cost, refund, payout, classification, compliance, or evidence fields.

Current listing readiness requires an eBay title, chosen listing price, `productDescriptionText`, explicit `ebay.conditionText`, and shipping notes. It does not require research queries or low/mid/high values. A future importer must populate or deliberately adapt the description/readiness relationship; merely importing `generatedPlainDescription` will not currently satisfy the `productDescriptionText` check.

## 1. Current Item Editor

The editor exposes one six-section navigation, with Previous/Next moving through the same order and Save Item available from every section.

| Order | Section | Current purpose | Main content |
|---|---|---|---|
| 1 | Item | Identity and stock state | Item Name, Category, Operational Classification, Draft/Listed status (post-sale statuses read-only), Included Accessories & Items |
| 2 | Purchase | Acquisition record | Purchase Date, Purchase Price, Source Type, Source / Seller, Purchase Location, Payment Method, proof status and purchase notes |
| 3 | Research & Condition | Physical assessment plus market research | Tested Status, Condition Grade, Defects & Wear, Condition Notes, suggested/chosen prices, research query/range/notes, external research links |
| 4 | eBay Listing | Listing preparation and output | Readiness, title, price, accessories, description details, measurements/specs, condition wording, defect checklist, shipping notes, language, photo checklist, generation/copy/output tools |
| 5 | Records & Proof | Source-document metadata | Proof status/type/date/amount, external references, no-receipt reason, proof notes, conditional Eigenbeleg support |
| 6 | Advanced | Optional administration | Seller Classification, detailed compliance status/presence checks, compatibility/legacy administration and danger-zone actions |

### Research & Condition field inventory

| User-facing label | Field | Canonical status | Used elsewhere | Required by eBay Listing/readiness | Safe normal-UI treatment |
|---|---|---|---|---|---|
| Tested Status | `testedStatus` | Canonical physical fact | Condition generation and eBay Listing condition helpers | Not directly required; contributes generated condition copy | Retain prominently under Condition & Testing; GPT value requires review |
| Condition Grade | `conditionGrade` | Canonical physical fact | Title fallback and generated condition text/HTML/plain description | Not directly required because readiness requires explicit `ebay.conditionText` | Retain prominently; GPT suggestion requires review |
| Suggested Listing Price (€) | `suggestedListingPrice` | Canonical recommendation; not an alias of chosen price | Research display; normalization seeds it from chosen price only when missing | No | Hide from primary intake or show as imported recommendation; review before apply |
| Chosen Listing Price (€) | `chosenListingPrice` | Canonical user decision | Expected/listed values, Stock/Dashboard displays, listing output and readiness | Yes (`Price`) | Keep in eBay Listing; never default-overwrite an existing value |
| Defects & Wear | `defectsNotes` | Active physical fact | Generated condition and listing preview | Not directly required | Retain prominently; user-confirmed, review-only import |
| Condition Notes | `conditionNotes` | Active physical fact, but current eBay editor sometimes clears it when writing `defectsNotes` | Generated condition and preview | Not directly required | Retain; clarify overlap with `defectsNotes` before importer implementation |
| Research Query | `researchQuery` | Canonical search/preparation field | Research links, research-presence checks, editor search defaults | No | Safe to hide from normal UI; optionally retain in Advanced/history |
| Research Low (€) | `priceResearchLow` | Canonical; legacy `researchedLowPrice` | Research displays and “has research” issue logic | No | Hide from primary UI; package may carry as recommendation/history |
| Research Mid (€) | `priceResearchMid` | Canonical; legacy `researchedMidPrice` | Research displays and “has research” issue logic | No | Hide from primary UI |
| Research High (€) | `priceResearchHigh` | Canonical; legacy `researchedHighPrice` | Research displays and “has research” issue logic | No | Hide from primary UI |
| Research Notes | UI writes `priceResearchNotes` | Legacy according to canonical audit; canonical is `researchNotes` | Research display and “has research” logic currently still read `priceResearchNotes` | No | Future importer should write canonical `researchNotes`; UI compatibility needs later cleanup |

## 2. Research Fields and Dependencies

| Field | Current activity | Calculation/readiness effect | Alias notes | Recommendation |
|---|---|---|---|---|
| `researchQuery` | Editable; seeds research links and can default from listing title | No financial calculation; used by `hasPriceResearch()` and `priceResearchUpdatedAt` | None identified | Hide from normal workflow; retain stored data |
| `priceResearchLow` | Editable and displayed | No financial/readiness calculation; contributes “research present” issue state | Canonical over `researchedLowPrice`; UI currently mirrors both | Optional package recommendation; canonical write only |
| `priceResearchMid` | Editable and displayed | Same as low | Canonical over `researchedMidPrice` | Optional canonical import |
| `priceResearchHigh` | Editable and displayed | Same as low | Canonical over `researchedHighPrice` | Optional canonical import |
| `researchNotes` | Normalized canonical field, but not the main current editor writer | No listing-readiness dependency | Canonical over `priceResearchNotes` | Package may write canonical research summary; hide from primary UI |
| `priceResearchNotes` | Current visible editor field and display source | Used by `hasPriceResearch()` and timestamp logic | Legacy alias | Read-only compatibility; importer must not write it |
| `suggestedListingPrice` | Editable recommendation | No current readiness or financial formula | Distinct concept from chosen price; normalization fills it from chosen only as fallback | Review-only GPT recommendation |
| `chosenListingPrice` | Editable decision and prominent listing value | Required by readiness; used for listed/expected value displays | Not an alias of suggested price | Review-only import; preserve user choice on conflicts |
| `researchBrand`, `researchModel`, `researchReference`, `researchYear`, `researchEAN`, `researchSerial`, `researchConfidence` | Present in schema/advanced listing support; not prominent in the six-section Research panel | Not used by readiness or finance | No audited legacy family except brand/model fallbacks | Hide/Advanced; omit from v1 unless a proven use appears |
| `priceResearchUpdatedAt` | Set when research data exists on item save | Administrative timestamp only | None | Importer may set its own package metadata, but should not fabricate this item timestamp in v1 |

Hiding research UI will not make listing readiness incomplete. It may change issue queues driven by `hasPriceResearch()`, so those queues should later be retired or redefined as “listing package/recommendation available” rather than requiring manual research fields.

## 3. Physical Condition and Testing

The physical item must remain under user control. GPT can structure supplied observations, but it cannot verify the object.

| Concept | Current field(s) | Assessment |
|---|---|---|
| Tested/working status | `testedStatus` | Canonical controlled value: Not specified, Tested working, Partially tested, Not tested, Defective / repair needed. Retain manual control. |
| Separate working status | No independent canonical `workingStatus` was found | Do not invent one in Package v1; use `testedStatus` plus notes. |
| Condition grade | `conditionGrade` | Canonical physical classification. Retain manual control. |
| Condition notes | `conditionNotes` | Active factual notes used by condition generation. Retain. |
| Defects and wear | `defectsNotes` plus `defectDisclosure` boolean map | Active factual observations. Retain; import only with explicit review. |
| Functional issues | Represented by `testedStatus`, `defectDisclosure.partiallyWorking`, `defectDisclosure.repairNeeded`, `defectDisclosure.notTested`, and notes | No separate field. Preserve this structure. |
| Included contents | Canonical `includedAccessories`; legacy `includedItems` | Physical package contents. Retain manual verification; GPT suggestion requires review. |
| Measurements/specifications | Canonical `measurements`; legacy `sizeSpecs` | Often factual and user-measured. GPT-provided values require review. |
| eBay condition wording | `ebay.conditionText` | Canonical listing copy, not the factual source itself. GPT-generated German wording is appropriate, but requires review because it asserts facts. |

`conditionNotes` and `defectsNotes` overlap. Generation reads both, while an eBay editor writer assigns `defectsNotes` and clears `conditionNotes`. Before controlled import, keep both readable and avoid automatic consolidation; Package v1 should preferably use a factual observation proposal rather than silently choosing one storage field.

## 4. Current eBay Listing Fields

### Primary listing inputs

| Label/control | Field path | Canonical/alias | Readiness | Generation/copy | GPT import safety |
|---|---|---|---|---|---|
| eBay Title | `ebayTitle` (writer also maintains `listingTitle` through handler) | `ebayTitle` is the preferred active title; `listingTitle` is compatibility/fallback | Required, although a generated fallback can satisfy the title check | Copied and used in output; max-80 warning | Safe-by-default only when empty; different title requires approval |
| Chosen Listing Price (€) | `chosenListingPrice` | Canonical decision | Required | Displayed in listing pack | Review required |
| Included Accessories & Items | `includedAccessories`, with `includedItems` fallback/mirror | Canonical `includedAccessories`; legacy `includedItems` | No | Plain/HTML output | Review required because factual |
| Product Description / Item Details | `productDescriptionText` | Active source field | Required | Feeds generated plain/HTML output | GPT-generated content can be safe-by-default when empty; define relationship to final description carefully |
| Brand | `brand` | Active identity field | No | Title/product output | Review required |
| Model | `model` | Active identity field | No | Title/product output | Review required |
| Measurements & Size Specs | `measurements` with `sizeSpecs` mirror | Canonical `measurements`; legacy `sizeSpecs` | No | Product output | Review required |
| Colour | `colour` | Active factual field | No | Product output | Review required |
| Compatibility / Platform | `compatibilityInfo` | Active technical field | No | Product output | Review required |
| Key Features | `keyFeatures` | Active descriptive field | No | Title fallback and product output | Safe when empty if clearly generated; conflicts require review |
| Defects & Wear | `defectsNotes` with `conditionNotes` fallback | Both active; overlapping | No | Condition generation | Review required |
| Condition Grade | `conditionGrade` | Canonical factual field | No | Condition/title generation | Review required |
| Tested Status | `testedStatus` | Canonical factual field | No | Condition generation | Review required |
| Defect Disclosure checklist | `defectDisclosure.*` | Canonical boolean map | No | Condition generation | Review required; should not be inferred casually |
| Shipping Notes | `shippingNotes` | Canonical listing instruction | Required | Plain/HTML output and copy | Review required; likely better as a ResellIt/user template than GPT research output |
| Language | `language`, with display compatibility `listingLanguage` | Canonical `language` (`de`/`en`); `listingLanguage` derived display value | Language mismatch warning | Chooses labels/templates | Package v1 should require German and normally set neither field; importer can validate German contract |
| Photo Checklist | `photoChecklist.*` | Canonical boolean map | Not part of readiness | UI checklist only | Never GPT-import as completed; GPT cannot verify photos |

### Listing output fields

| Label/output | Field | Canonical/legacy | Behavior | GPT import safety |
|---|---|---|---|---|
| eBay Condition Text | `ebay.conditionText` | Canonical; root `conditionText` legacy | Required by readiness, copied, rendered in output | Review required; default selection only if empty and package clearly derives from user facts |
| Generated Plain Description | `generatedPlainDescription` | Canonical; `descriptionText` legacy | Saved, copied, previewed; generation prefers saved value | Safe-by-default when empty |
| Raw Generated HTML | `generatedHtmlDescription` | Canonical; `htmlDescription` legacy | Saved, copied, sanitized for preview | Safe-by-default when empty if valid/sanitized; could also be generated locally from imported plain fields |
| Generated title | `generatedListingTitle()` result | Computed, not a stored field | Uses manual title first, otherwise brand/model/name/category/features/condition | Becomes fallback-only if GPT supplies title |
| Generated condition | `generatedConditionText()` result | Computed; respects `ebay.conditionText` first | Uses grade, tested state, defect flags and notes | Fallback-only if GPT supplies reviewed condition text |

Category-specific fields currently consist of general product identity/details (`brand`, `model`, `measurements`, `colour`, `compatibilityInfo`, `keyFeatures`) rather than a typed eBay category-aspects model. Package v1 should not claim to support arbitrary eBay item specifics.

## 5. Language and Translation

Current language infrastructure includes:

- `language` (`de`/`en`) as the normalized value and `listingLanguage` (`German`/`English`) as compatibility/display text.
- German/English label dictionaries, section headings, condition-grade translations, default shipping/private-sale text, and language-mismatch warnings.
- A collapsed Language selector in EbayStudio.
- translation launch actions for German, English, and DeepL in legacy/secondary listing UI.
- generated descriptions are not stored as distinct parallel German/English variants; the same fields hold the current selected-language output.

If the external GPT contract guarantees final German output, normal workflow can hide the language selector and translation actions. Keep normalization and bilingual generation as fallback compatibility. Existing English records must remain readable; do not mass-convert them. Package v1 should declare `language: "de"`, and validation should reject or require review for other languages.

## 6. Existing Generation Logic

| Function/control | Current role | Future classification |
|---|---|---|
| `generatedListingTitle()` | Builds/truncates title from stored identity/features/condition; respects manual title | Fallback only; still useful when no package is available |
| `generatedConditionBaseText()` / `germanConditionGrade()` | Maps condition grade into German wording | Fallback only |
| `generatedConditionText()` | Combines explicit condition text or factual condition fields | Still useful as fallback and preview safety |
| `generateListingDraft()` | Produces title, condition, plain description and HTML; prefers saved output | Fallback only; candidate to hide from normal flow |
| `generateHtmlDescription()` | Builds styled HTML from item facts/copy | Still useful: package may omit HTML and allow deterministic local generation |
| Generate eBay Listing | Writes generated title/condition/descriptions into form state | Candidate to hide after import is stable; retain fallback initially |
| Copy Title / Condition / Plain / HTML / Shipping | Copies final prepared fields | Still useful |
| Translation buttons / `openTranslator()` | Opens translation/search helpers | Candidate to hide; eventual removal after compatibility period |
| `listingLabels()`, `listingSectionHeadings()`, `isGermanListing()` | Language-aware output support | Retain for existing data and fallback generation |

No generator should be deleted in the first import implementation. Hiding it behind “Generate locally” or Advanced provides a safe fallback.

## 7. Listing Readiness Dependencies

`listingCompleteness()` checks exactly five conditions:

1. **eBay Title:** explicit `ebayTitle`, legacy/fallback `listingTitle`, or a non-empty generated title.
2. **Price:** truthy `chosenListingPrice`.
3. **Description / Item Details:** non-empty `productDescriptionText`.
4. **Condition Text:** non-empty canonical `ebay.conditionText` (via `ebayConditionText()`, which falls back to legacy root `conditionText`).
5. **Shipping Notes:** non-empty `shippingNotes`.

`listingWarnings()` adds missing-check warnings, title-over-80, and possible language mismatch. `listingReadiness()` returns Missing required fields if any check fails, Needs info for other warnings, otherwise Ready.

Important implications:

- Research query/range/notes and suggested price are not readiness dependencies and can be hidden safely.
- `generatedPlainDescription` alone does **not** satisfy Description / Item Details; the check uses `productDescriptionText`.
- Generated condition fallback does **not** satisfy the explicit condition check unless `ebay.conditionText` or legacy `conditionText` is stored.
- Shipping notes remain required even though a local generator can supply default shipping wording.

Recommended post-import readiness policy:

- Preserve the five-check concept but redefine description completion to accept a validated final `generatedPlainDescription` (or deliberately map the package’s structured item-details content to `productDescriptionText`).
- Continue requiring explicit canonical `ebay.conditionText` after review.
- Continue requiring a chosen price, not merely a recommendation.
- Keep shipping policy under user/ResellIt control; a package recommendation should require review.
- Replace manual “research present” issue logic with package/import status or remove it from normal readiness.

## 8. Canonical Field Safety Map

### Fields Package v1 may propose

| Package concept | Canonical item target | Policy |
|---|---|---|
| German eBay title | `ebayTitle` | Safe default when empty; conflict review |
| German condition wording | `ebay.conditionText` | Review because it asserts condition |
| Final German plain description | `generatedPlainDescription` | Safe default when empty; conflict review |
| Optional final HTML | `generatedHtmlDescription` | Safe default when empty after validation/sanitized preview |
| Product/item details | `productDescriptionText` | Safe default when empty if generated; factual conflicts require review |
| Included contents | `includedAccessories` | Review |
| Measurements/specifications | `measurements` | Review |
| Research low/mid/high | `priceResearchLow`, `priceResearchMid`, `priceResearchHigh` | Optional recommendation/history; review |
| Research summary | `researchNotes` | Optional; safe when empty |
| Suggested price | `suggestedListingPrice` | Review/recommendation |
| Chosen price proposal | `chosenListingPrice` | Explicit review always |
| Category suggestion | `category` | Explicit review |
| Brand/model/colour/compatibility/features | `brand`, `model`, `colour`, `compatibilityInfo`, `keyFeatures` | Review, except generated feature copy may default when empty |
| Tested status/condition/defects | `testedStatus`, `conditionGrade`, `defectsNotes`, `conditionNotes`, `defectDisclosure` | Never default; explicit factual confirmation |

### Legacy fields Package v1 must not write

`listingTitle`, root `conditionText`, `descriptionText`, `htmlDescription`, `includedItems`, `sizeSpecs`, `researchedLowPrice`, `researchedMidPrice`, `researchedHighPrice`, and `priceResearchNotes`. Existing normalization may continue reading them.

### Protected fields Package v1 must never import

- Purchase/source: `purchaseDate`, `purchasePrice`, source fields, payment method, purchase transaction/allocation links.
- Lifecycle: `status`, Personal Collection, listing/sale lifecycle progression.
- Sales: `saleDate`, `finalSalePrice`, legacy `salePrice`, buyer/platform and transaction match fields.
- Fees/shipping/refunds/payouts: all fee modes/amounts, buyer shipping, actual/legacy shipping costs, packaging, tracking, refund and payout data.
- Compliance/classification: `classification`, `sellerClassification`, business relevance and tax-readiness data.
- Proof/evidence: receipt/proof fields, evidence IDs, documents, Eigenbelege.
- Administrative: stable IDs, timestamps, migration flags, backup/persistence metadata.
- Photo checklist completion.

## 9. Proposed ResellIt Listing Package v1

```json
{
  "format": "resellit_listing",
  "version": 1,
  "language": "de",
  "facts": {
    "identity": {
      "brand": null,
      "model": null,
      "colour": null,
      "measurements": null,
      "compatibilityInfo": null
    },
    "condition": {
      "testedStatus": null,
      "conditionGrade": null,
      "conditionNotes": null,
      "defectsNotes": null,
      "includedAccessories": null
    }
  },
  "generated": {
    "ebayTitle": "",
    "ebayConditionText": "",
    "productDescriptionText": "",
    "generatedPlainDescription": "",
    "generatedHtmlDescription": null,
    "keyFeatures": null
  },
  "recommendations": {
    "category": null,
    "suggestedListingPrice": null,
    "chosenListingPrice": null,
    "shippingNotes": null,
    "listingStrategy": null
  },
  "research": {
    "query": null,
    "low": null,
    "mid": null,
    "high": null,
    "currency": "EUR",
    "summary": null,
    "sources": []
  }
}
```

The nested JSON keys are contract concepts, not direct arbitrary field paths. The validator must explicitly map each allowed key to its canonical target and reject unknown/protected keys.

## 10. Facts Versus Generated Copy Versus Recommendations

- **`facts`** contains claims about the actual object. These should only be emitted when supplied or confirmed by the user. Every factual field requires review; none should be default-applied over existing data.
- **`generated`** contains GPT-authored German listing copy. Empty canonical targets may be selected by default; differences require approval. Condition wording is still review-sensitive because it embodies factual claims.
- **`recommendations`** contains choices, not facts. Category, price, shipping policy, and strategy require explicit user selection. `listingStrategy` is preview-only unless a future canonical field is added.
- **`research`** contains supporting context. It may be stored in canonical research fields but must not silently determine the chosen price or factual condition.

## 11. Import Protection Policy

### Safe to select by default when current target is empty

- `generated.ebayTitle` → `ebayTitle`
- `generated.productDescriptionText` → `productDescriptionText`
- `generated.generatedPlainDescription` → `generatedPlainDescription`
- validated `generated.generatedHtmlDescription` → `generatedHtmlDescription`
- `generated.keyFeatures` → `keyFeatures`
- `research.summary` → `researchNotes`
- research range values, if the product decision is to preserve research history

### Always require review

- All `facts.*`, especially tested status, condition, defects, contents and measurements.
- `generated.ebayConditionText`.
- Category, suggested/chosen price, shipping notes, compatibility, brand/model/colour.
- Any different value, regardless of otherwise-safe classification.

### Never import

All protected fields listed in Section 8. Unknown keys must be invalid rather than ignored silently.

## 12. Preview and Apply Design

Use a compact table:

| Field | Current Value | GPT Value | Status | Apply? |
|---|---|---|---|---|

States and behavior:

- **New:** target empty and value valid. Selected by default only for safe generated fields; factual/recommendation fields remain unchecked.
- **Same:** semantically equal (including numeric formatting equivalence). Disabled.
- **Different:** existing value differs. Unchecked; user must explicitly choose the GPT value.
- **Protected:** package attempted a disallowed key. Disabled and prominently reported.
- **Invalid:** wrong type, enum, number, language, length, or structure. Disabled with reason.

Preview should group Generated Copy, Facts to Confirm, Recommendations, and Research. It should show the resulting title length, price, condition text and description preview before commit. Apply must create a strict canonical patch, never mutate inputs, never mirror legacy aliases, and require final confirmation.

## 13. Entry Point

The correct primary location is **Item Editor → eBay Listing → Import GPT Listing**. It has the active item context, naturally precedes listing preview/copy, and avoids implying that packages create purchases or stock records. Do not add a Dashboard or Stock Control primary action in v1. An Advanced/debug inspector may show raw parsed JSON, but normal users should see mapped fields and validation results.

## 14. Research & Condition Simplification

Recommended future navigation:

1. Item
2. Purchase
3. Condition & Testing
4. eBay Listing
5. Records & Proof
6. Advanced

Condition & Testing should retain:

- Tested Status
- Condition Grade
- Defects & Wear
- Condition Notes
- Defect checklist where useful
- Included Accessories & Items (either here or Item, but not duplicated prominently)
- Measurements where they are user-observed facts

Remove Market Research from the normal section. Existing research data can remain readable in a collapsed “Imported Research” or Advanced area. Suggested/chosen prices belong in eBay Listing, with clear “recommendation” versus “selected price” labels.

## 15. Existing Data Compatibility

No migration is required merely to hide fields. Existing research, language, generated output, and legacy aliases remain in normalized items and backups. Risks are:

- Current normalization mirrors several aliases, so importer code must construct a canonical patch and avoid normal UI writers that mirror legacy fields.
- `researchNotes` is canonical, but current visible UI primarily writes `priceResearchNotes`; imported research may not appear in that old control until UI cleanup.
- `productDescriptionText` versus `generatedPlainDescription` readiness semantics can surprise users.
- Existing English listings require language controls to remain accessible somewhere.
- Existing saved generated HTML must remain sanitized on preview.
- Hiding research can leave old “needs research” issue queues conceptually obsolete even though data remains valid.

## 16. GPT Prompt Contract

The external GPT should be instructed as follows:

### Output rules

- Output exactly one JSON object and no commentary.
- Do not wrap JSON in Markdown fences.
- Use `"format": "resellit_listing"`, `"version": 1`, and `"language": "de"` exactly.
- All human-facing listing copy must be German.
- Use UTF-8 text and valid JSON escaping.
- Use JSON numbers for monetary recommendations, rounded to at most two decimals, with no currency symbol and no thousands separators. Currency is the separate string `"EUR"`.
- Use `null` for unknown optional values. Do not use invented placeholders such as `"unknown"`, `"N/A"`, or `"not provided"`.
- Use empty strings only for required generated strings that could not be produced; such a package will fail validation.
- Do not include keys outside the schema.
- Never include purchase, lifecycle, sale, fee, shipping-cost, refund, payout, compliance, evidence, classification, ID, or timestamp data.
- Do not claim testing, included contents, defects, measurements, brand/model, or condition facts unless supplied or confirmed by the user.

### Required keys

- Top-level: `format`, `version`, `language`, `facts`, `generated`, `recommendations`, `research`.
- Required non-empty generated values: `generated.ebayTitle`, `generated.ebayConditionText`, `generated.productDescriptionText`, `generated.generatedPlainDescription`.
- `research.currency` must be `EUR`.
- Required objects must exist even when their optional values are null.

### Allowed enum values

- `facts.condition.testedStatus`: `Not specified`, `Tested working`, `Partially tested`, `Not tested`, `Defective / repair needed`, or null.
- `facts.condition.conditionGrade`: `Neu`, `Sehr gut`, `Gut`, `Akzeptabel`, `Defekt / Ersatzteile`, `Sonstiges`, or null.
- `language`: only `de` for v1.

### Validation constraints

- `generated.ebayTitle`: maximum 80 Unicode characters after trimming/whitespace normalization.
- Research and price numbers: non-negative finite JSON numbers or null.
- `research.low <= research.mid <= research.high` when all relevant values exist; otherwise warn/review.
- `research.sources`: array of concise source labels/URLs as strings; no scraped article bodies.
- `generated.generatedHtmlDescription`: valid string or null; no scripts, event handlers, iframes, forms, or remote active content. Prefer null if the GPT cannot guarantee safe HTML.
- `recommendations.listingStrategy` is advisory text only and has no item-field target in v1.

## 17. Recommended Implementation Phases

### Phase 1 — Simplify Research/Condition UI

Rename the section to Condition & Testing, retain physical facts, move chosen/suggested price to eBay Listing, hide research inputs under Advanced/import history, and update issue terminology. Do not delete fields, generators, or old data.

### Phase 2 — Parser and Validator

Implement pure helpers for JSON parsing, exact format/version checks, unknown/protected-key rejection, enum/type/range/language/title validation, canonical mapping, and comparison generation. No item writes.

### Phase 3 — Preview and Controlled Apply

Add Import GPT Listing in eBay Listing, paste area, grouped preview, New/Same/Different/Protected/Invalid states, safe defaults, explicit conflict choices, sanitized description preview, strict canonical patch, confirmation, and persistence through the existing item save pathway. Add optional import audit metadata only if separately designed.

### Phase 4 — External GPT Contract

Publish the exact contract above to the separate GPT, add fixture-based contract tests, version negotiation/error messages, and sample valid/invalid packages. Keep local generation as fallback until real usage proves it redundant.

## 18. Final Recommendation

Proceed with the workflow. The current item schema already has appropriate canonical destinations for a useful v1 package, so a new listing entity is unnecessary. Simplify the editor first, then build a strict allowlisted importer. Preserve physical-condition authority in ResellIt, accept generated German copy safely when targets are empty, require approval for recommendations and conflicts, and categorically exclude operational/financial/compliance data. The principal implementation issue to resolve is the mismatch between final generated description fields and the current readiness requirement for `productDescriptionText`.
