import { useMemo, useRef, useState } from "react";
import { buildReviewedListingPackage, compareListingPackage, parseAndValidateListingPackage, prepareGptImportedItem } from "../../gptListingPackage.js";
import { sanitizeHtmlPreview } from "../../resellitLogic.js";

const GROUPS = [
  ["Listing Inputs", (row) => row.group === "Listing Inputs"],
  ["Physical Facts", (row) => row.group === "Facts" || row.group === "Condition"],
  ["Recommendations", (row) => row.group === "Recommendations"],
  ["Research", (row) => row.group === "Research"],
];

function display(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map((entry) => entry?.name || String(entry)).join(", ");
  return String(value);
}

export function GptItemImport({ newItemDefaults, onCreateItem, open, onOpenChange }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [reviewOverrides, setReviewOverrides] = useState({});
  const [stage, setStage] = useState("paste");
  const [committing, setCommitting] = useState(false);
  const commitGuard = useRef(false);
  const reviewedResult = useMemo(() => result?.ok ? buildReviewedListingPackage(result, reviewOverrides) : null, [result, reviewOverrides]);
  const rows = useMemo(() => reviewedResult ? compareListingPackage(reviewedResult, newItemDefaults) : [], [reviewedResult, newItemDefaults]);
  const prepared = useMemo(() => reviewedResult?.ok ? prepareGptImportedItem(reviewedResult, selectedIds, newItemDefaults) : null, [reviewedResult, selectedIds, newItemDefaults]);

  function reset() {
    onOpenChange(false); setText(""); setResult(null); setSelectedIds([]); setReviewOverrides({}); setStage("paste"); setCommitting(false); commitGuard.current = false;
  }

  function parse() {
    setReviewOverrides({});
    const parsed = parseAndValidateListingPackage(text);
    setResult(parsed);
    if (!parsed.ok) { setStage("paste"); setSelectedIds([]); return; }
    const nextRows = compareListingPackage(parsed, newItemDefaults);
    setSelectedIds(nextRows.filter((row) => row.defaultSelected && !row.disabled).map((row) => row.id));
    setStage("review");
  }

  function edit(row, rawValue) {
    let value = rawValue;
    if (row.editor === "number") {
      const trimmed = rawValue.trim();
      value = trimmed === "" ? null : Number.isFinite(Number(trimmed)) ? Number(trimmed) : rawValue;
    } else if (!row.required && rawValue === "") {
      value = null;
    }
    setReviewOverrides((current) => ({ ...current, [row.sourcePath]: value }));
  }

  function restore(row) {
    setReviewOverrides((current) => {
      const next = { ...current };
      delete next[row.sourcePath];
      return next;
    });
  }

  function toggle(row) {
    if (row.disabled) return;
    setSelectedIds((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id]);
  }

  function create() {
    if (commitGuard.current || !prepared?.item || prepared.validationErrors.length) return;
    commitGuard.current = true;
    setCommitting(true);
    const created = onCreateItem(prepared.item);
    if (created === false) { commitGuard.current = false; setCommitting(false); return; }
    reset();
  }

  return (
    <>
      <button type="button" onClick={() => onOpenChange(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#e06b2c] px-3 py-2 text-xs font-semibold text-[#24110e] hover:bg-[#f0be45]">Import GPT Item</button>
      {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-3" role="dialog" aria-modal="true" aria-labelledby="gpt-item-import-title">
        <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-3xl bg-[#fffdf8] p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3"><div><h2 id="gpt-item-import-title" className="text-xl font-semibold text-stone-950">Import GPT Item</h2><p className="mt-1 text-sm text-stone-600">Paste a ResellIt Listing Package to create a new Draft stock item.</p></div><button type="button" onClick={reset} className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold">Cancel</button></div>
          {stage === "paste" && <div className="mt-4 space-y-3">
            <label className="block"><span className="mb-1 block text-xs font-semibold text-stone-600">ResellIt Package JSON</span><textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-72 w-full rounded-2xl border border-stone-300 bg-white p-3 font-mono text-xs" /></label>
            {result && !result.ok && <section className="rounded-xl border border-red-200 bg-red-50 p-3"><h3 className="text-sm font-semibold text-red-900">Package Cannot Be Created</h3><ul className="mt-2 list-disc pl-5 text-sm text-red-800">{result.errors.map((error, index) => <li key={`${error.path}:${index}`}>{error.path ? `${error.path}: ` : ""}{error.message}</li>)}</ul></section>}
            <div className="flex justify-end gap-2"><button type="button" onClick={reset} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" disabled={!text.trim()} onClick={parse} className="rounded-xl bg-[#b7412e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Parse & Review</button></div>
          </div>}
          {stage === "review" && result?.ok && <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3"><p className="text-sm font-medium text-orange-950">Final plain and HTML descriptions will be generated by the ResellIt template.</p>{Object.keys(reviewOverrides).length > 0 && <button type="button" onClick={() => setReviewOverrides({})} className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-950 hover:bg-orange-100">Reset all edits</button>}</div>
            {GROUPS.map(([title, match]) => {
              const groupRows = rows.filter(match); if (!groupRows.length) return null;
              return <section key={title} className="rounded-2xl border border-stone-200 bg-white p-3"><h3 className="text-sm font-semibold">{title}</h3><div className="mt-2 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b text-stone-500"><th className="p-2">Field</th><th className="p-2">Reviewed Value</th><th className="p-2">State</th><th className="p-2">Create With?</th></tr></thead><tbody>{groupRows.map((row) => {
                const edited = Object.prototype.hasOwnProperty.call(reviewOverrides, row.sourcePath);
                const fieldErrors = (reviewedResult?.errors || []).filter((error) => error.path === row.sourcePath || error.path.startsWith(`${row.sourcePath}.`));
                const inputClass = `w-full rounded-lg border bg-white px-2 py-1.5 text-xs text-stone-900 ${fieldErrors.length ? "border-red-400" : "border-stone-300"}`;
                return <tr key={row.id} className={`border-b border-stone-100 align-top ${selectedIds.includes(row.id) ? "bg-orange-50/40" : ""}`}><td className="p-2 font-semibold">{row.label}</td><td className="max-w-md p-2">{row.editor === "text" && <input type="text" value={row.packageValue ?? ""} onChange={(event) => edit(row, event.target.value)} className={inputClass} aria-invalid={fieldErrors.length > 0} />}{row.editor === "textarea" && <textarea rows={3} value={row.packageValue ?? ""} onChange={(event) => edit(row, event.target.value)} className={`${inputClass} min-w-72 resize-y`} aria-invalid={fieldErrors.length > 0} />}{row.editor === "number" && <input type="number" min="0" step="any" value={row.packageValue ?? ""} onChange={(event) => edit(row, event.target.value)} className={`${inputClass} max-w-40`} aria-invalid={fieldErrors.length > 0} />}{row.editor === "select" && <select value={row.packageValue ?? ""} onChange={(event) => edit(row, event.target.value)} className={inputClass} aria-invalid={fieldErrors.length > 0}>{!row.required && <option value="">Not specified</option>}{(row.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select>}{row.editor === "readonly" && <span className="whitespace-pre-wrap">{display(row.packageValue)}</span>}{fieldErrors.map((error, index) => <p key={`${error.code}:${index}`} className="mt-1 text-xs font-medium text-red-700">{error.message}</p>)}{edited && <button type="button" onClick={() => restore(row)} className="mt-1 text-xs font-semibold text-orange-800 underline decoration-orange-300 underline-offset-2">Restore original</button>}</td><td className="p-2">{row.state}</td><td className="p-2"><label className={row.disabled ? "text-stone-400" : "cursor-pointer"}><input className="mr-2" type="checkbox" checked={selectedIds.includes(row.id)} disabled={row.disabled} onChange={() => toggle(row)} />{row.defaultSelected ? "Include" : "Confirm & Include"}</label></td></tr>;
              })}</tbody></table></div></section>;
            })}
            {(reviewedResult?.errors || []).some((error) => !rows.some((row) => error.path === row.sourcePath || error.path.startsWith(`${row.sourcePath}.`))) && <section className="rounded-xl border border-red-200 bg-red-50 p-3" aria-live="polite"><h3 className="text-sm font-semibold text-red-900">Review these values</h3><ul className="mt-1 list-disc pl-5 text-sm text-red-800">{reviewedResult.errors.filter((error) => !rows.some((row) => error.path === row.sourcePath || error.path.startsWith(`${row.sourcePath}.`))).map((error, index) => <li key={`${error.path}:${index}`}>{error.message}</li>)}</ul></section>}
            <section className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50 p-3">
              <div className="grid gap-2 sm:grid-cols-3"><div><p className="text-xs font-semibold text-stone-500">Final eBay Title</p><p className="mt-1 font-semibold text-stone-900">{prepared?.item?.ebayTitle || "—"}</p></div><div><p className="text-xs font-semibold text-stone-500">Listing Readiness</p><p className="mt-1 font-semibold text-stone-900">{prepared?.listingReadiness}</p></div><div><p className="text-xs font-semibold text-stone-500">Intake Completeness</p><p className="mt-1 font-semibold text-stone-900">{prepared?.purchaseDetailsReadiness.status}</p>{prepared?.purchaseDetailsReadiness.missingFields.length > 0 && <p className="mt-1 text-xs text-stone-600">Missing: {prepared.purchaseDetailsReadiness.missingFields.join(", ")}</p>}</div></div>
              {prepared?.item && <><div><p className="text-xs font-semibold text-stone-500">Final ResellIt Plain Description</p><pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-orange-100 bg-white p-3 text-xs text-stone-800">{prepared.item.generatedPlainDescription}</pre></div><div><p className="text-xs font-semibold text-stone-500">Final ResellIt HTML Preview</p><div className="mt-1 max-h-64 overflow-auto rounded-xl border border-orange-100 bg-white p-3"><div dangerouslySetInnerHTML={{ __html: sanitizeHtmlPreview(prepared.item.generatedHtmlDescription) }} /></div></div></>}
            </section>
            {prepared?.validationErrors.length > 0 && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{prepared.validationErrors.map((error) => error.message).join(" ")}</p>}
            <div className="flex justify-between gap-2"><button type="button" onClick={() => setStage("paste")} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold">Back</button><button type="button" disabled={!reviewedResult?.ok || !prepared?.item || prepared.validationErrors.length > 0} onClick={() => setStage("confirm")} className="rounded-xl bg-[#b7412e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Create Item</button></div>
          </div>}
          {stage === "confirm" && prepared?.item && <div className="mt-5 space-y-4"><section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><h3 className="text-lg font-semibold">Create “{prepared.item.name}” as a Draft item?</h3><p className="mt-2 text-sm text-stone-700">Only selected listing fields will be imported. Purchase, sales, Finance, compliance, and evidence data are excluded.</p><p className="mt-2 text-sm font-semibold">After creation, the saved item will open on Purchase for completion.</p></section><div className="flex justify-end gap-2"><button type="button" onClick={() => setStage("review")} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold">Back</button><button type="button" disabled={committing} onClick={create} className="rounded-xl bg-[#b7412e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{committing ? "Creating…" : "Create Draft Item"}</button></div></div>}
        </div>
      </div>}
    </>
  );
}
