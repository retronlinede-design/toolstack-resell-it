import {
  generateHtmlDescription,
  generateListingDraft,
  generatedConditionText,
  generatedListingTitle,
  hasListingPreviewInput,
} from "../../ebayListingTemplate.js";
import {
  ebayConditionText,
  languageLabel,
  normalizeBooleanRecord,
  normalizeListingLanguageValue,
} from "../../resellitSchema.js";
import { Input, Select } from "../shared/FormControls.jsx";

export function EbayStudio({
  form,
  setForm,
  formListingLabels,
  formListingSectionHeadings,
  conditionDefectsLabel,
  listingChecksOpen,
  listingAdvancedDetailsOpen,
  listingConditionHelpersOpen,
  listingAdditionalNotesOpen,
  listingLanguageOpen,
  listingAdvancedOutputOpen,
  conditionGradeOptions,
  testedStatusOptions,
  defectDisclosureItems,
  defaultDefectDisclosure,
  languageOptions,
  ListingReadinessBadge,
  ListingCompleteness,
  ListingWarningsPanel,
  ChecklistGrid,
  sanitizeHtmlPreview,
  onToggleListingChecks,
  onToggleListingAdvancedDetails,
  onToggleListingConditionHelpers,
  onToggleListingAdditionalNotes,
  onToggleListingLanguage,
  onToggleListingAdvancedOutput,
  onGenerateFullListingPack,
  onUpdateListingTitle,
  onCopyText,
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-orange-200 bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-950">1. Seller Input Info</h3>
          </div>
          <ListingReadinessBadge item={form} />
        </div>
        <div className="mt-3 rounded-xl border border-orange-200 bg-white">
          <button type="button" onClick={onToggleListingChecks} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-orange-900 hover:bg-orange-50">
            <span>Listing Checks</span>
            <span aria-hidden="true">{listingChecksOpen ? "▲" : "▼"}</span>
          </button>
          {listingChecksOpen && (
            <div className="space-y-3 border-t border-orange-100 p-3">
              <ListingCompleteness item={form} />
              <ListingWarningsPanel item={form} />
            </div>
          )}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">eBay Title</span>
            <input value={form.ebayTitle || form.listingTitle || generatedListingTitle(form)} onChange={(e) => onUpdateListingTitle(e.target.value)} className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
            <span className={`mt-1 block text-xs font-semibold ${(form.ebayTitle || form.listingTitle || generatedListingTitle(form)).length > 80 ? "text-red-700" : "text-stone-500"}`}>{(form.ebayTitle || form.listingTitle || generatedListingTitle(form)).length}/80 characters</span>
          </label>
          <Input label="Listed Price / Target Price" value={form.chosenListingPrice || ""} onChange={(e) => setForm({ ...form, chosenListingPrice: e.target.value })} />
          <Input label="Accessories / Included Items" className="lg:col-span-2" value={form.includedAccessories || form.includedItems || ""} onChange={(e) => setForm({ ...form, includedAccessories: e.target.value, includedItems: e.target.value })} />
          <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-3 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">{formListingSectionHeadings.productDescription}</p>
          <p className="mt-1 text-xs leading-5 text-stone-600">Describe what the item is, important features, compatibility, and general product information.</p>
          <div className="mt-3 grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Description / Item Details</span>
              <textarea value={form.productDescriptionText || ""} onChange={(e) => setForm({ ...form, productDescriptionText: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
            </label>
            <div className="rounded-xl border border-orange-200 bg-white">
              <button type="button" onClick={onToggleListingAdvancedDetails} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-orange-900 hover:bg-orange-50">
                <span>Advanced Details</span>
                <span aria-hidden="true">{listingAdvancedDetailsOpen ? "▲" : "▼"}</span>
              </button>
              {listingAdvancedDetailsOpen && (
                <div className="grid gap-3 border-t border-orange-100 p-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input label="Brand" value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                  <Input label="Model" value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                  <Input label="Measurements / Size Specs" value={form.measurements || form.sizeSpecs || ""} onChange={(e) => setForm({ ...form, measurements: e.target.value, sizeSpecs: e.target.value })} />
                  <Input label="Colour" value={form.colour || ""} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Compatibility / Platform info</span>
                    <textarea value={form.compatibilityInfo || ""} onChange={(e) => setForm({ ...form, compatibilityInfo: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Key Features</span>
                    <textarea value={form.keyFeatures || ""} onChange={(e) => setForm({ ...form, keyFeatures: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="One feature per line or comma-separated" />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-white p-3 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">{formListingLabels.condition}</p>
          <div className="mt-3 grid gap-3">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Condition Text</span>
              <textarea value={ebayConditionText(form)} onChange={(e) => setForm({ ...form, ebay: { ...(form.ebay || {}), conditionText: e.target.value } })} className="min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
              <span className="mt-1 block text-xs leading-5 text-stone-500">Write the exact condition shown in the eBay condition field.</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">{conditionDefectsLabel}</span>
              <textarea value={form.defectsNotes || form.conditionNotes || ""} onChange={(e) => setForm({ ...form, defectsNotes: e.target.value, conditionNotes: "" })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
              <span className="mt-1 block text-xs leading-5 text-stone-500">Scratches, wear, missing parts, battery condition, etc.</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Condition Preview</span>
              <textarea value={generatedConditionText(form)} readOnly className="min-h-20 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 outline-none" />
            </label>
            <div className="rounded-xl border border-orange-200 bg-white">
              <button type="button" onClick={onToggleListingConditionHelpers} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-orange-900 hover:bg-orange-50">
                <span>Advanced Condition Helpers</span>
                <span aria-hidden="true">{listingConditionHelpersOpen ? "▲" : "▼"}</span>
              </button>
              {listingConditionHelpersOpen && (
                <div className="grid gap-3 border-t border-orange-100 p-3 sm:grid-cols-2">
                  <Select label="Condition grade" value={form.conditionGrade || ""} onChange={(e) => setForm({ ...form, conditionGrade: e.target.value })}>
                    <option value="">Select condition</option>
                    {conditionGradeOptions.map((grade) => <option key={grade}>{grade}</option>)}
                    {form.conditionGrade && !conditionGradeOptions.includes(form.conditionGrade) && <option>{form.conditionGrade}</option>}
                  </Select>
                  <Select label="Tested status" value={form.testedStatus || "Not specified"} onChange={(e) => setForm({ ...form, testedStatus: e.target.value })}>
                    {testedStatusOptions.map((status) => <option key={status}>{status}</option>)}
                  </Select>
                  <div className="sm:col-span-2">
                    <ChecklistGrid
                      title="Defect disclosure"
                      items={defectDisclosureItems}
                      value={normalizeBooleanRecord(form.defectDisclosure, defaultDefectDisclosure)}
                      onChange={(defectDisclosure) => setForm({ ...form, defectDisclosure })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Shipping Notes</span>
            <textarea value={form.shippingNotes || ""} onChange={(e) => setForm({ ...form, shippingNotes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" placeholder="Tracked DHL, combined shipping..." />
          </label>
          <div className="rounded-xl border border-orange-200 bg-white lg:col-span-2">
            <button type="button" onClick={onToggleListingAdditionalNotes} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-orange-900 hover:bg-orange-50">
              <span>Additional Notes</span>
              <span aria-hidden="true">{listingAdditionalNotesOpen ? "▲" : "▼"}</span>
            </button>
            {listingAdditionalNotesOpen && (
              <label className="block border-t border-orange-100 p-3">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Notes</span>
                <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-20 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
              </label>
            )}
          </div>
          <div className="rounded-xl border border-orange-200 bg-white lg:col-span-2">
            <button type="button" onClick={onToggleListingLanguage} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-orange-900 hover:bg-orange-50">
              <span>Advanced / Language</span>
              <span aria-hidden="true">{listingLanguageOpen ? "▲" : "▼"}</span>
            </button>
            {listingLanguageOpen && (
              <div className="border-t border-orange-100 p-3">
                <Select label="Language" value={normalizeListingLanguageValue(form)} onChange={(e) => setForm({ ...form, language: e.target.value, listingLanguage: languageLabel(e.target.value) })}>
                  {languageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3 text-center">
        <button
          type="button"
          onClick={onGenerateFullListingPack}
          className="rounded-2xl bg-[#e06b2c] px-5 py-3 text-sm font-semibold text-[#24110e] shadow-[0_10px_24px_rgba(224,107,44,0.18)] hover:bg-[#f0be45]"
        >
          Generate eBay Listing
        </button>
        <p className="mt-2 text-xs text-stone-600">
          Uses the seller input above to create the eBay copy below.
        </p>
      </div>

      <section className="rounded-2xl border border-orange-200 bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-neutral-950">2. Generated eBay Listing Output</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => onCopyText("title", form.ebayTitle || form.listingTitle || generatedListingTitle(form))} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Title</button>
          <button type="button" onClick={() => onCopyText(formListingLabels.condition.toLowerCase(), generatedConditionText(form))} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Condition</button>
          <button type="button" onClick={() => onCopyText("HTML description", form.generatedHtmlDescription || form.htmlDescription || generateHtmlDescription(form))} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy HTML Description</button>
        </div>
        {hasListingPreviewInput(form) && <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3"><div dangerouslySetInnerHTML={{ __html: sanitizeHtmlPreview(form.generatedHtmlDescription || form.htmlDescription || generateHtmlDescription(form)) }} /></div>}
        <div className="mt-3 rounded-xl border border-orange-200 bg-white">
          <button type="button" onClick={onToggleListingAdvancedOutput} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-orange-900 hover:bg-orange-50">
            <span>Advanced Output</span>
            <span aria-hidden="true">{listingAdvancedOutputOpen ? "▲" : "▼"}</span>
          </button>
          {listingAdvancedOutputOpen && (
            <div className="grid gap-3 border-t border-orange-100 p-3 lg:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Generated Plain Description</span>
                <textarea value={form.generatedPlainDescription || form.descriptionText || ""} onChange={(e) => setForm({ ...form, generatedPlainDescription: e.target.value, descriptionText: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
              </label>
              <label className="block lg:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Raw Generated HTML</span>
                <textarea value={form.generatedHtmlDescription || form.htmlDescription || ""} onChange={(e) => setForm({ ...form, generatedHtmlDescription: e.target.value, htmlDescription: e.target.value })} className="min-h-28 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-mono text-xs outline-none transition focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200" />
              </label>
              <div className="flex flex-wrap gap-2 lg:col-span-2">
                <button type="button" onClick={() => onCopyText(formListingLabels.description.toLowerCase(), form.generatedPlainDescription || form.descriptionText || generateListingDraft(form).description)} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Plain Description</button>
                <button type="button" onClick={() => onCopyText("shipping notes", form.shippingNotes || "")} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900 hover:bg-orange-100">Copy Shipping Notes</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
