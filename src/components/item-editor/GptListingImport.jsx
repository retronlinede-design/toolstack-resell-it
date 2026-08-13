import { useMemo, useState } from "react";
import { listingReadiness } from "../../ebayListingTemplate.js";
import { ebayConditionText } from "../../resellitSchema.js";
import {
  applyListingPackagePatchToItem,
  compareListingPackage,
  parseAndValidateListingPackage,
  prepareListingPackagePatch,
} from "../../gptListingPackage.js";

const GROUPS = [
  ["Generated Listing Copy", (row) => row.group === "Generated Copy"],
  ["Facts to Confirm", (row) => row.group === "Facts" || row.group === "Condition"],
  ["Recommendations", (row) => row.group === "Recommendations"],
  ["Imported Research", (row) => row.group === "Research"],
];

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function stateClass(state) {
  if (state === "New") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (state === "Same") return "border-stone-200 bg-stone-100 text-stone-600";
  if (state === "Different") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

export function GptListingImport({ form, setForm, sanitizeHtmlPreview }) {
  const [open, setOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);
  const [stage, setStage] = useState("paste");
  const [applyErrors, setApplyErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const comparisonRows = useMemo(
    () => validationResult?.ok ? compareListingPackage(validationResult, form) : [],
    [validationResult, form],
  );
  const prepared = useMemo(
    () => validationResult?.ok ? prepareListingPackagePatch(validationResult, form, selectedFieldIds) : null,
    [validationResult, form, selectedFieldIds],
  );
  const proposedItem = useMemo(
    () => prepared ? applyListingPackagePatchToItem(form, prepared.patch) : form,
    [prepared, form],
  );

  function openImport() {
    setOpen(true);
    setPasteText("");
    setValidationResult(null);
    setSelectedFieldIds([]);
    setApplyErrors([]);
    setStage("paste");
  }

  function closeImport() {
    setOpen(false);
    setPasteText("");
    setValidationResult(null);
    setSelectedFieldIds([]);
    setApplyErrors([]);
    setStage("paste");
  }

  function parseForReview() {
    const result = parseAndValidateListingPackage(pasteText);
    setValidationResult(result);
    setApplyErrors([]);
    if (!result.ok) {
      setSelectedFieldIds([]);
      setStage("paste");
      return;
    }
    const rows = compareListingPackage(result, form);
    setSelectedFieldIds(rows.filter((row) => row.defaultSelected && !row.disabled).map((row) => row.id));
    setStage("review");
  }

  function toggleField(row) {
    if (row.disabled || row.state === "Protected" || row.state === "Invalid") return;
    setSelectedFieldIds((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id]);
  }

  function reviewConfirmation() {
    const nextPrepared = prepareListingPackagePatch(validationResult, form, selectedFieldIds);
    if (nextPrepared.validationErrors.length) {
      setApplyErrors(nextPrepared.validationErrors);
      return;
    }
    setApplyErrors([]);
    setStage("confirm");
  }

  function applyToForm() {
    const nextPrepared = prepareListingPackagePatch(validationResult, form, selectedFieldIds);
    if (nextPrepared.validationErrors.length) {
      setApplyErrors(nextPrepared.validationErrors);
      setStage("review");
      return;
    }
    setForm((currentForm) => applyListingPackagePatchToItem(currentForm, nextPrepared.patch));
    closeImport();
    setSuccessMessage("GPT listing applied to form. Save Item to keep changes.");
  }

  const protectedErrors = validationResult?.errors.filter((error) => error.kind === "protected") || [];
  const invalidErrors = validationResult?.errors.filter((error) => error.kind !== "protected") || [];
  const selectedCount = prepared?.changedFields.length || 0;

  return (
    <>
      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#b7412e]/20 bg-[#fff8ea] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-950">Update Listing from GPT</p>
          <p className="mt-1 text-xs text-stone-600">Paste, validate, and review generated listing content before it reaches this form.</p>
        </div>
        <button type="button" onClick={openImport} className="rounded-xl border border-[#b7412e]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#8f3124] hover:bg-[#fff8ea]">Update Listing from GPT</button>
      </div>

      {successMessage && (
        <div role="status" className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage("")} className="text-xs font-semibold text-emerald-800">Dismiss</button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-3" role="dialog" aria-modal="true" aria-labelledby="gpt-listing-import-title">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-3xl border border-stone-200 bg-[#fffdf8] p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="gpt-listing-import-title" className="text-xl font-semibold text-stone-950">Update Listing from GPT</h2>
                <p className="mt-1 text-sm text-stone-600">Paste a ResellIt Listing Package from your listing GPT.</p>
              </div>
              <button type="button" onClick={closeImport} className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100">Cancel</button>
            </div>

            {stage === "paste" && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-stone-600">Listing Package JSON</span>
                  <textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} className="min-h-72 w-full rounded-2xl border border-stone-300 bg-white px-3 py-3 font-mono text-xs leading-5 text-stone-900 outline-none focus:border-[#b7412e] focus:ring-2 focus:ring-[#b7412e]/10" placeholder='{"format":"resellit_listing","version":1,...}' />
                </label>

                {protectedErrors.length > 0 && (
                  <section className="rounded-2xl border border-red-300 bg-red-50 p-3">
                    <h3 className="text-sm font-semibold text-red-900">Protected Fields Ignored</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">{protectedErrors.map((error) => <li key={`${error.code}:${error.path}`}>{error.path}: {error.message}</li>)}</ul>
                  </section>
                )}
                {invalidErrors.length > 0 && (
                  <section className="rounded-2xl border border-red-200 bg-red-50 p-3">
                    <h3 className="text-sm font-semibold text-red-900">Package Cannot Be Reviewed</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">{invalidErrors.map((error, index) => <li key={`${error.code}:${error.path}:${index}`}>{error.path ? `${error.path}: ` : ""}{error.message}</li>)}</ul>
                  </section>
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={closeImport} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700">Cancel</button>
                  <button type="button" onClick={parseForReview} disabled={!pasteText.trim()} className="rounded-xl bg-[#b7412e] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">Parse & Review</button>
                </div>
              </div>
            )}

            {stage === "review" && validationResult?.ok && (
              <div className="mt-4 space-y-4">
                {GROUPS.map(([title, matches]) => {
                  const rows = comparisonRows.filter(matches);
                  if (!rows.length) return null;
                  return (
                    <section key={title} className="rounded-2xl border border-stone-200 bg-white p-3">
                      <h3 className="text-sm font-semibold text-stone-950">{title}</h3>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[760px] table-fixed text-left text-xs">
                          <thead><tr className="border-b border-stone-200 text-stone-500"><th className="w-[18%] p-2">Field</th><th className="w-[28%] p-2">Current Value</th><th className="w-[28%] p-2">GPT Value</th><th className="w-[10%] p-2">State</th><th className="w-[16%] p-2">Apply?</th></tr></thead>
                          <tbody>{rows.map((row) => (
                            <tr key={row.id} className="border-b border-stone-100 align-top last:border-0">
                              <td className="p-2 font-semibold text-stone-800">{row.label}</td>
                              <td className="whitespace-pre-wrap break-words p-2 text-stone-600">{displayValue(row.currentValue)}</td>
                              <td className="whitespace-pre-wrap break-words p-2 text-stone-900">{displayValue(row.packageValue)}</td>
                              <td className="p-2"><span className={`inline-flex rounded-full border px-2 py-1 font-semibold ${stateClass(row.state)}`}>{row.state}</span></td>
                              <td className="p-2">
                                <label className={`flex items-center gap-2 ${row.disabled ? "text-stone-400" : "cursor-pointer text-stone-700"}`}>
                                  <input type="checkbox" checked={selectedFieldIds.includes(row.id)} disabled={row.disabled} onChange={() => toggleField(row)} />
                                  <span>{row.state === "Different" ? "Use GPT Value" : row.defaultSelected ? "Apply" : "Review & Apply"}</span>
                                </label>
                              </td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </section>
                  );
                })}

                <section className="rounded-2xl border border-orange-200 bg-orange-50/60 p-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <PreviewValue label="eBay Title" value={proposedItem.ebayTitle} sub={`${Array.from(String(proposedItem.ebayTitle || "")).length}/80 characters`} />
                    <PreviewValue label="Chosen Listing Price" value={proposedItem.chosenListingPrice} />
                    <PreviewValue label="eBay Condition Text" value={ebayConditionText(proposedItem)} />
                    <PreviewValue label="Product Description / Item Details" value={proposedItem.productDescriptionText} />
                    <PreviewValue label="Plain Description" value={proposedItem.generatedPlainDescription} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-stone-800">Current Readiness: {listingReadiness(form)} <span aria-hidden="true">→</span> After Import Readiness: {listingReadiness(proposedItem)}</p>
                  {proposedItem.generatedHtmlDescription && <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-stone-200 bg-white p-3"><div dangerouslySetInnerHTML={{ __html: sanitizeHtmlPreview(proposedItem.generatedHtmlDescription) }} /></div>}
                </section>

                {applyErrors.length > 0 && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{applyErrors.map((error) => error.message).join(" ")}</p>}
                <div className="flex flex-wrap justify-between gap-2">
                  <button type="button" onClick={() => setStage("paste")} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700">Back to Package</button>
                  <button type="button" onClick={reviewConfirmation} disabled={selectedCount === 0} className="rounded-xl bg-[#b7412e] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">Apply Selected Fields</button>
                </div>
              </div>
            )}

            {stage === "confirm" && prepared && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-lg font-semibold text-stone-950">Apply {prepared.changedFields.length} fields from GPT package?</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">Existing conflicting values will change only where you explicitly approved them. Protected fields are excluded. Purchase, sales, Finance, compliance, and evidence data will not be touched.</p>
                  <p className="mt-2 text-sm font-semibold text-stone-800">This updates the open form only. Use Save Item afterward to keep the changes.</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setStage("review")} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700">Back</button>
                  <button type="button" onClick={applyToForm} className="rounded-xl bg-[#b7412e] px-4 py-2 text-sm font-semibold text-white">Apply to Item</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PreviewValue({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-orange-100 bg-white p-3">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-900">{displayValue(value)}</p>
      {sub && <p className="mt-1 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}
