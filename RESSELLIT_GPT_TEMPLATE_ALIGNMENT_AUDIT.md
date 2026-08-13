# ResellIt GPT Template Alignment Audit

## Executive conclusion

The current GPT package does **not** guarantee the same final listing structure as ResellIt's established local generator. ResellIt already has a deterministic German plain-text and styled HTML template, but the package also supplies `generatedPlainDescription` and optional `generatedHtmlDescription`. Saved generated values take precedence in normal copy/preview paths, so GPT-created items can bypass the ResellIt template entirely.

The safest architecture is **Option B — ResellIt owns the final template**. GPT should supply concise structured German content and fact-sensitive proposed wording; ResellIt should assemble `generatedPlainDescription` and `generatedHtmlDescription` from those inputs. This preserves headings, ordering, shipping normalization, structured accessories, and conditional standard notes in one place.

## 1. Existing listing-template behavior

Primary implementation: `src/ebayListingTemplate.js`.

### Title

`generatedListingTitle(item)` behaves as follows:

1. If `ebayTitle` or legacy `listingTitle` exists, it returns that manual/saved title, whitespace-normalized and capped at 80 Unicode characters.
2. Otherwise it builds core identity from `brand`, `model`, `name`, and `category`, removing exact case-insensitive duplicates.
3. It then attempts to append title-priority accessory terms, up to two `keyFeatures`, and the condition grade, but only when each addition still fits 80 characters.
4. Structured accessories map German high-priority types to concise title terms, notably `original_box` → `OVP` and `manual` → `Anleitung`.
5. Core identity is built before accessories; optional accessory terms do not displace it.

### Condition

`generatedConditionText(item)` first uses the canonical `ebay.conditionText` through `ebayConditionText(item)`. If that is present, it is used exactly and locally derived grade/testing/defect text is not appended.

If no explicit eBay condition text exists, it combines:

- a localized condition-grade phrase;
- tested status when specified;
- selected defect-disclosure flags;
- `conditionNotes`;
- `defectsNotes`, prefixed with the localized defects label.

The final fallback is a German or English instruction to review the description for condition details.

### Final template section order

Both locally generated plain text and HTML use the same logical order:

1. `ARTIKEL`
2. `PRODUKTBESCHREIBUNG` when product lines exist
3. `ZUSTAND`
4. `LIEFERUMFANG`
5. `VERSAND`
6. `HINWEISE`

The English equivalents are `ITEM`, `ABOUT THE ITEM`, `CONDITION`, `WHAT IS INCLUDED`, `SHIPPING`, and `NOTES`.

There is no separate generic feature heading. Key features are inserted as product-description lines. There is also no automatic general “additional accessory disclaimer” beyond the included-items fallback described below.

## 2. Plain-description template

The internal `generatedPlainDescription(item, condition)` constructs sections separated by one blank line. A heading appears on its own line, followed immediately by its content.

### ARTIKEL

Content order:

- generated/final eBay title;
- `Artikel: {name}`;
- `Marke: {brand}`;
- `Modell: {model}`;
- `Kategorie: {category}`;
- `Größe / Spezifikation: {measurements or legacy sizeSpecs}`;
- `Farbe: {colour}`.

Only populated fields are emitted. The title can therefore repeat identity already represented by the subsequent labeled lines; this is deliberate template structure.

### PRODUKTBESCHREIBUNG

`productDescriptionLines(item)` emits, in order:

1. `productDescriptionText` when present;
2. a localized compatibility line from `compatibilityInfo`;
3. each `keyFeatures` entry, split on newlines or commas;
4. measurements/specification and colour lines.

When `productDescriptionText` is absent, it additionally synthesizes a category sentence and maker/model sentence. When it is present, those synthetic lines are suppressed, but compatibility, features, measurements, and colour are still appended.

### ZUSTAND

Contains the single result of `generatedConditionText(item)`. With imported `ebay.conditionText`, this is the imported eBay condition wording exactly.

### LIEFERUMFANG

Each normalized structured accessory name is rendered as a `- name` bullet. IDs, type, title priority, and notes are not rendered. If no accessories exist, the German fallback is `Lieferumfang wie beschrieben.`

### VERSAND

Uses `shippingNotes` after removing sentences/lines containing pickup or collection wording. If nothing remains, German output defaults to `Versicherter Versand mit Sendungsverfolgung.`

### HINWEISE

Includes general `item.notes`, followed conditionally by:

`Privatverkauf. Keine Garantie, Gewährleistung oder Rücknahme.`

That standard sentence is included only when **Operational Classification** equals `Private Sale / Personal Collection`; `sellerClassification: private` alone does not trigger it. If neither notes nor that classification-based disclaimer exists, the fallback is `Keine weiteren Hinweise.`

## 3. HTML template

`generateHtmlDescription(item)` mirrors the same six-section content model but applies a fixed ResellIt presentation:

- outer dark-brown background container, maximum width 720px;
- cream inner card, Arial/Helvetica, 15px text, border and rounded corners;
- teal, yellow, orange, and red accent bars;
- a top `<h2>` containing the generated/final title;
- one styled card per logical section;
- paragraph output for article, product, condition, shipping, and notes;
- an unordered list for included items.

All dynamic locally generated text passes through `escapeHtml()`. Newlines inside a paragraph become `<br>`. The template never injects raw `productDescriptionText`, condition, notes, or accessories as HTML.

The HTML has no additional business content beyond the plain template, although the visual title is repeated above the `ARTIKEL` section. The application sanitizes HTML for preview. Imported `generatedHtmlDescription` is separately screened for active content by the GPT package validator and sanitized again for preview, but a saved imported HTML value still bypasses the local layout.

Important precedence behavior:

- `generateListingDraft(item)` defaults to `preferSaved: true`.
- It returns saved `generatedPlainDescription` (or legacy `descriptionText`) instead of locally assembled plain text when available.
- It returns saved `generatedHtmlDescription` (or legacy `htmlDescription`) instead of locally assembled HTML when available.
- Copy and preview controls also prefer those saved fields.
- **Generate Locally** calls the draft generator with `preferSaved: false`, then overwrites the open form's generated plain/HTML output (and current compatibility aliases) with the local template result.

Thus a GPT-created item and a locally generated item need not have the same output until Generate Locally is deliberately used.

## 4. Role of `productDescriptionText`

`productDescriptionText` is designed as the item's core descriptive prose inside `PRODUKTBESCHREIBUNG`, not as the entire final listing.

Its UI guidance says to describe what the item is, important features, compatibility, and general product information. The template independently owns:

- identity labels;
- condition section;
- included-items section;
- shipping section;
- notes and conditional private-sale wording.

The current GPT package's complete German value is aligned only if it remains focused on product/item details. If it also names included accessories, test results, condition, shipping, or seller disclaimers, those concepts will be repeated when ResellIt generates its template.

## 5. GPT fields compared with template inputs

| GPT package field | Canonical target | Existing template use | Duplication risk |
|---|---|---|---|
| `generated.productDescriptionText` | `productDescriptionText` | First line(s) of `PRODUKTBESCHREIBUNG` | High if it repeats condition, accessories, shipping, identity labels, or disclaimer |
| `generated.generatedPlainDescription` | `generatedPlainDescription` | Preferred as already-final copy; bypasses local plain template | Direct competing final output |
| `generated.generatedHtmlDescription` | `generatedHtmlDescription` | Preferred as already-final HTML; bypasses local styled HTML | Direct competing final output and styling |
| `generated.ebayConditionText` | `ebay.conditionText` | Exact content of `ZUSTAND` | Correct input, but repeated if product/final GPT prose also states condition/testing |
| `generated.keyFeatures` | `keyFeatures` | Appended within `PRODUKTBESCHREIBUNG`; first two may inform a locally generated title | Repeated if already written into `productDescriptionText` |
| `recommendations.shippingNotes` | `shippingNotes` | Exact normalized content of `VERSAND` | Repeated if final GPT prose includes shipping |
| `facts.condition.includedAccessories` | `includedAccessories` | Bullet list under `LIEFERUMFANG`; important types can inform local title | Repeated if product/final GPT prose lists the same contents |

Because generated title, plain copy, HTML, and structured source inputs all coexist, the current contract supports two independent composition systems rather than one deterministic final output.

## 6. Representative JBL comparison

Representative item: **JBL On Stage 200iD Lautsprecherdock**.

The supplied GPT product description says, in substance:

- what the product is;
- compatible 30-pin Apple devices;
- 3.5 mm AUX support;
- included power supply, original packaging, and manual.

The described GPT plain output also contains product introduction, tested/working wording, connection details, `Lieferumfang`, and an additional accessory disclaimer.

If ResellIt locally generates from the same structured fields, its output shape is approximately:

```text
ARTIKEL
{eBay title}
Artikel: JBL On Stage 200iD Lautsprecherdock
Marke: JBL
Modell: On Stage 200iD
Kategorie: ...

PRODUKTBESCHREIBUNG
{productDescriptionText}
Kompatibilität / Plattform: ...
{key feature lines}

ZUSTAND
{ebay.conditionText}

LIEFERUMFANG
- Netzteil
- Originalverpackung
- Bedienungsanleitung

VERSAND
{shippingNotes, or the tracked-shipping default}

HINWEISE
{notes / conditional private-sale wording / fallback}
```

Concrete duplication from the representative content:

- `30-Pin` and `AUX` can appear in `productDescriptionText`, `compatibilityInfo`, and `keyFeatures`.
- Netzteil, Originalverpackung, and Bedienungsanleitung appear inside the GPT product prose and again under the structured `LIEFERUMFANG` list.
- Tested/working wording in GPT plain copy repeats the dedicated `ZUSTAND` value.
- A GPT-created accessory disclaimer has no matching local template source and may conflict with or sit alongside ResellIt's own notes/private-sale wording.
- If saved GPT plain copy is used, the established section ordering and conditional standard notes appear only if GPT happened to reproduce them correctly.
- Clicking Generate Locally replaces the saved GPT plain/HTML output with ResellIt's structure, exposing any duplication embedded in `productDescriptionText` and other structured inputs.

Therefore the representative GPT output is content-rich but not template-aligned.

## 7. Structured input versus final output

### GPT should provide structured German input

- `itemName`, identity, category recommendation, measurements, colour, and compatibility;
- concise `productDescriptionText` limited to product/item overview;
- distinct `keyFeatures`, without repeating the overview verbatim;
- proposed `ebay.conditionText`, subject to physical-fact review;
- structured `includedAccessories`, subject to explicit confirmation;
- suggested/chosen-price recommendations, subject to review;
- concise `shippingNotes` recommendation;
- retained research context where useful.

The GPT contract should explicitly forbid condition/testing, included items, shipping, and seller disclaimer content inside `productDescriptionText`.

### ResellIt should produce final output

- `generatedPlainDescription` from the local section template;
- `generatedHtmlDescription` from the local styled/escaped HTML template.

GPT should not be required to provide final plain or HTML output in the preferred architecture. During a compatibility transition, those keys could remain accepted but should not be the default authoritative output for newly created items.

## 8. Architecture options

### Option A — GPT owns final description

Advantages: GPT can create fluid prose and the current import path already accepts both final fields.

Risks: output varies by prompt/model; established headings and standard wording can disappear; structured facts may disagree with final prose; HTML styling/safety becomes external; Generate Locally produces materially different output. This option does not make GPT-created and manually prepared listings indistinguishable.

### Option B — ResellIt owns final template

Advantages: one deterministic section order; one HTML style; one escaping path; structured accessories remain authoritative; shipping pickup filtering and defaults remain consistent; standard notes are centrally controlled; local/manual and GPT-created items converge on identical output.

Risk: `productDescriptionText` and `keyFeatures` need a tighter non-duplicating GPT contract. This is small and controllable.

### Option C — Hybrid final plain plus local HTML wrapper

This can preserve GPT prose while standardizing presentation, but the current HTML generator is not a wrapper around arbitrary final plain copy. It independently reconstructs all six sections. Implementing a generic wrapper would either flatten the structure or require parsing GPT prose back into sections, reintroducing ambiguity. It also leaves plain text inconsistent with locally prepared items.

### Recommendation

**Choose Option B.** It best matches the current code and the goal of producing indistinguishable listings.

## 9. Standard ResellIt content at risk under GPT-owned output

Only wording/behavior actually present in code is listed here:

- fixed localized headings and section order;
- `Lieferumfang wie beschrieben.` when no included items exist;
- pickup/collection wording removed from shipping notes;
- `Versicherter Versand mit Sendungsverfolgung.` when no German shipping note remains;
- `Privatverkauf. Keine Garantie, Gewährleistung oder Rücknahme.` when Operational Classification is `Private Sale / Personal Collection`;
- `Keine weiteren Hinweise.` when there are no notes/disclaimer;
- localized condition-grade and defect-disclosure fallback wording when no explicit eBay condition text exists;
- HTML card styling, escaping, and consistent list formatting.

The conditional private-sale sentence deserves special attention: imported items default to an operational classification that may not trigger it. Template ownership alone does not change that existing rule, and this audit does not recommend silently changing classification.

## 10. Structured accessory alignment

The structured model correctly feeds all current local outputs:

- local title: confirmed title-priority entries can contribute concise terms; `original_box` becomes `OVP`, `manual` becomes `Anleitung`, and lower-priority entries do not displace identity;
- plain description: normalized names become bullets under `LIEFERUMFANG`;
- HTML description: normalized names become `<li>` elements under `LIEFERUMFANG`;
- internal ID, type, title priority, and notes are not exposed in output.

The package correctly rejects GPT-supplied accessory IDs and requires factual confirmation before import. Accessory notes currently are not rendered in either description. OVP/manual handling is consistent, provided GPT prose does not redundantly enumerate them inside `productDescriptionText` or final copy.

## 11. Listing readiness implications

Current readiness requires all five of:

- eBay title (`ebayTitle`, compatibility alias, or generated fallback);
- `chosenListingPrice`;
- `productDescriptionText`;
- canonical `ebay.conditionText`;
- `shippingNotes`.

It does **not** require `generatedPlainDescription`, `generatedHtmlDescription`, included accessories, or research fields. Therefore Option B preserves readiness without changing the helper: the structured content can satisfy readiness first, and final plain/HTML can be derived afterward.

One nuance remains: `listingWarnings()` checks the preferred saved/generated plain output for language mismatch. If final descriptions become locally generated consistently, that check becomes more deterministic. No readiness change is required for the preferred architecture.

## 12. Minimal implementation path (future work only)

No changes were made in this audit. The smallest future change set would be:

1. Tighten the GPT contract so `productDescriptionText` contains only the concise product/item overview, excluding condition, testing, included items, shipping, and disclaimer wording.
2. Continue importing the structured/fact-reviewed inputs already supported.
3. Stop treating GPT `generatedPlainDescription` and `generatedHtmlDescription` as authoritative defaults for newly created items; retain read compatibility during transition if needed.
4. After selected fields are approved, run the existing local template against the proposed item and populate canonical generated plain/HTML fields before final creation or save.
5. Keep `ebay.conditionText` reviewed because it is generated wording grounded in physical facts.
6. Keep structured accessories explicitly confirmed, then let the template render them once.
7. Add equivalence regression tests proving GPT-created structured input and manually entered identical input produce the same plain and HTML output.

## Final assessment

- **Does current GPT output match the established template?** Not reliably. It can bypass it through saved final plain/HTML fields.
- **Where is duplication?** Product details versus compatibility/features, condition versus final prose, accessories versus `LIEFERUMFANG`, and shipping versus the dedicated shipping section.
- **What should GPT provide?** Concise structured German content, reviewed physical facts, condition wording, recommendations, and research context.
- **What should ResellIt generate?** The final six-section plain description and styled HTML.
- **Should `generatedPlainDescription` remain GPT-provided?** No, not as the authoritative default for new GPT-created items; it should be locally generated under Option B.
- **Should `generatedHtmlDescription` remain local?** Yes. The local generator already supplies consistent structure, escaping, and styling.
- **Minimal route to indistinguishable listings:** preserve current structured imports, constrain overlapping prose, and run the existing local generator once after review rather than accepting competing final outputs.
