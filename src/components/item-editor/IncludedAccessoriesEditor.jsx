import { createIncludedAccessory, INCLUDED_ACCESSORY_TYPES, includedAccessoryIssues } from "../../includedAccessories.js";

export function IncludedAccessoriesEditor({ value, onChange }) {
  const entries = Array.isArray(value) ? value : [];
  const issues = includedAccessoryIssues(entries);

  function addEntry() {
    onChange([...entries, createIncludedAccessory()]);
  }

  function updateEntry(id, changes) {
    onChange(entries.map((entry) => {
      if (entry.id !== id) return entry;
      if (changes.type && changes.titlePriority === undefined) {
        const fresh = createIncludedAccessory({ ...entry, type: changes.type, titlePriority: undefined }, () => entry.id);
        return { ...entry, ...changes, titlePriority: fresh.titlePriority };
      }
      return { ...entry, ...changes };
    }));
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3 sm:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between gap-3">
        <div><h4 className="text-sm font-semibold text-stone-950">Included Accessories & Items</h4><p className="mt-1 text-xs text-stone-500">Record only items physically included with this item.</p></div>
        <button type="button" onClick={addEntry} className="rounded-xl border border-[#b7412e]/25 bg-white px-3 py-2 text-xs font-semibold text-[#8f3124] hover:bg-[#fff8ea]">+ Add Included Item</button>
      </div>
      {entries.length === 0 ? <p className="mt-3 rounded-xl bg-white px-3 py-4 text-sm text-stone-500">No included items recorded.</p> : (
        <div className="mt-3 space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="grid gap-2 rounded-xl border border-stone-200 bg-white p-2 md:grid-cols-[minmax(10rem,1.5fr)_minmax(9rem,0.8fr)_auto_auto] md:items-center">
              <input aria-label="Included item name" value={entry.name} onChange={(event) => updateEntry(entry.id, { name: event.target.value })} placeholder="e.g. Bedienungsanleitung" className="h-9 rounded-lg border border-stone-300 px-2.5 text-sm outline-none focus:border-[#b7412e]" />
              <select aria-label="Included item type" value={entry.type} onChange={(event) => updateEntry(entry.id, { type: event.target.value })} className="h-9 rounded-lg border border-stone-300 bg-white px-2 text-sm outline-none focus:border-[#b7412e]">{INCLUDED_ACCESSORY_TYPES.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select>
              <label className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-stone-600"><input type="checkbox" checked={entry.titlePriority} onChange={(event) => updateEntry(entry.id, { titlePriority: event.target.checked })} /> Include in Title</label>
              <button type="button" aria-label={`Remove ${entry.name || "included item"}`} onClick={() => onChange(entries.filter((candidate) => candidate.id !== entry.id))} className="h-9 rounded-lg border border-red-200 px-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">×</button>
              <details className="md:col-span-4"><summary className="cursor-pointer text-xs font-semibold text-stone-500">Optional Notes</summary><input aria-label="Included item notes" value={entry.notes} onChange={(event) => updateEntry(entry.id, { notes: event.target.value })} className="mt-2 h-9 w-full rounded-lg border border-stone-300 px-2.5 text-sm outline-none focus:border-[#b7412e]" /></details>
            </div>
          ))}
        </div>
      )}
      {issues.length > 0 && <ul className="mt-2 space-y-1 text-xs font-medium text-red-700">{issues.map((issue) => <li key={`${issue.code}:${issue.index}`}>{issue.message}</li>)}</ul>}
    </section>
  );
}
