import { Fragment, useState } from "react";
import { AlertTriangle, FileText, Filter, MoreHorizontal, PackagePlus, Plus, Search } from "lucide-react";
import { Input, Select } from "../shared/FormControls.jsx";
import { GptItemImport } from "./GptItemImport.jsx";

function proofLabel(item) {
  if (item.proofStoredExternally === "Yes" || item.proofFileName || item.proofFolderLocation) return "External";
  if (item.proofType === "Invoice" || item.receiptType === "Invoice") return "Invoice";
  if (item.hasReceipt === "Yes" || item.proofType === "Shop receipt" || item.receiptType === "Shop receipt") return "Receipt";
  if (item.proofType === "Eigenbeleg" || item.receiptType === "Eigenbeleg needed") return "Eigenbeleg";
  return "Missing";
}

function proofClass(label) {
  if (label === "Missing") return "border-red-200 bg-red-50 text-red-700";
  if (label === "Eigenbeleg") return "border-amber-200 bg-amber-50 text-amber-800";
  if (label === "External") return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-lime-200 bg-lime-50 text-lime-800";
}

function statusClass(status) {
  if (["Sold", "Complete"].includes(status)) return "border-lime-200 bg-lime-50 text-lime-800";
  if (status === "Listed") return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "Returned") return "border-red-200 bg-red-50 text-red-700";
  return "border-stone-200 bg-white text-stone-700";
}

function operationalClassificationLabel(value) {
  return {
    "Private Sale / Personal Collection": "Private Sale",
    "Business Stock / Resale Inventory": "Business Stock",
  }[value] || value;
}

export function InventoryTable({
  items,
  stockTimelineItems,
  stockTimelineGroups,
  stockDashboard,
  stockQuickFilterCounts,
  stockTimelineTotals,
  stockTableWidth,
  visibleStockColumnKeys,
  stockColumnWidths,
  quickAddItem,
  inventorySearch,
  inventoryTimelineGrouping,
  inventoryClassification,
  inventoryStatus,
  inventoryTimelineMonth,
  inventoryCategory,
  inventoryIssueFilter,
  inventorySort,
  categoryOptions,
  classificationOptions,
  statusLabel,
  statusOptions,
  money,
  isSoldStatus,
  itemProfitValue,
  expectedListingValue,
  stockResizeHandle,
  onOpenNewItemEditor,
  onCreateGptItem,
  gptItemDefaults,
  onOpenPurchaseManager,
  onCreateQuickLedgerItem,
  onSetQuickAddItem,
  onSetInventorySearch,
  onSetInventoryTimelineGrouping,
  onSetInventoryClassification,
  onSetInventoryStatus,
  onSetInventoryTimelineMonth,
  onSetInventoryCategory,
  onSetInventoryIssueFilter,
  onSetInventorySort,
  onResetStockColumnWidths,
  onUpdateItemField,
  onEditItem,
  onDuplicateItem,
  onMoveToPersonalCollection,
  onDeleteItem,
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const inputClass = "h-7 w-full rounded-md border border-transparent bg-transparent px-1 text-xs text-stone-900 outline-none hover:border-stone-200 hover:bg-white focus:border-[#b7412e]/35 focus:bg-white focus:ring-1 focus:ring-[#b7412e]/15";

  return (
    <div className="min-w-0 space-y-3">
      <section className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {[
          ["Total Items", stockDashboard.totalItems],
          ["In Stock", stockDashboard.inStock],
          ["Listed", stockDashboard.listed],
          ["Sold / Complete", stockDashboard.soldComplete],
          ["Stock Cost", money(stockDashboard.stockCost)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-stone-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onOpenNewItemEditor} className="inline-flex items-center gap-1.5 rounded-lg bg-[#b7412e] px-3 py-2 text-xs font-semibold text-white hover:bg-[#963424]"><Plus size={14} /> Add Item</button>
            <GptItemImport newItemDefaults={gptItemDefaults} onCreateItem={onCreateGptItem} />
            <button type="button" onClick={() => setQuickAddOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"><PackagePlus size={14} /> Quick Add</button>
            <button type="button" onClick={() => onSetInventoryIssueFilter("Needs attention")} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${inventoryIssueFilter === "Needs attention" ? "border-red-200 bg-red-50 text-red-700" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"}`}><AlertTriangle size={14} /> Issues</button>
            <button type="button" onClick={() => setMoreFiltersOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"><Filter size={14} /> More Filters</button>
            <button type="button" onClick={onOpenPurchaseManager} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"><FileText size={14} /> Purchases & Invoices</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_12rem] xl:w-[34rem]">
            <label className="relative block">
              <span className="sr-only">Search stock</span>
              <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-stone-400" />
              <input value={inventorySearch} onChange={(event) => onSetInventorySearch(event.target.value)} className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#b7412e]/40 focus:ring-2 focus:ring-[#b7412e]/10" placeholder="Search stock…" />
            </label>
            <select aria-label="Filter stock by status" value={inventoryStatus} onChange={(event) => onSetInventoryStatus(event.target.value)} className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-[#b7412e]/40">
              <option>All statuses</option>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              <option value="personal_collection">Personal Collection</option>
            </select>
          </div>
        </div>

        {quickAddOpen && (
          <div className="mt-3 grid gap-2 rounded-xl border border-[#b7412e]/15 bg-[#fff8ea] p-3 sm:grid-cols-2 lg:grid-cols-[8rem_minmax(12rem,1fr)_minmax(10rem,1fr)_7rem_auto] lg:items-end">
            <Input label="Purchased" type="date" value={quickAddItem.purchaseDate} onChange={(event) => onSetQuickAddItem({ ...quickAddItem, purchaseDate: event.target.value })} />
            <Input label="Item" value={quickAddItem.name} onChange={(event) => onSetQuickAddItem({ ...quickAddItem, name: event.target.value })} placeholder="New stock item" />
            <Input label="Source" value={quickAddItem.sourceName} onChange={(event) => onSetQuickAddItem({ ...quickAddItem, sourceName: event.target.value })} placeholder="Seller or shop" />
            <Input label="Cost" type="number" step="0.01" value={quickAddItem.purchasePrice} onChange={(event) => onSetQuickAddItem({ ...quickAddItem, purchasePrice: event.target.value })} placeholder="0.00" />
            <div className="flex gap-1.5">
              <button type="button" onClick={() => onCreateQuickLedgerItem()} className="h-10 rounded-lg border border-[#b7412e]/20 bg-white px-3 text-xs font-semibold text-[#8f3124] hover:bg-[#fff6e6]">Add</button>
              <button type="button" onClick={() => onCreateQuickLedgerItem({ openEditor: true })} className="h-10 rounded-lg bg-[#e06b2c] px-3 text-xs font-semibold text-[#24110e] hover:bg-[#f0be45]">Add & Edit</button>
            </div>
          </div>
        )}

        {moreFiltersOpen && (
          <div className="mt-3 grid gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Select label="Category" value={inventoryCategory} onChange={(event) => onSetInventoryCategory(event.target.value)}><option>All categories</option>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</Select>
            <Select label="Operational Classification" value={inventoryClassification} onChange={(event) => onSetInventoryClassification(event.target.value)}><option>All classifications</option>{classificationOptions.map((classification) => <option key={classification} value={classification}>{operationalClassificationLabel(classification)}</option>)}</Select>
            <Select label="Issue" value={inventoryIssueFilter} onChange={(event) => onSetInventoryIssueFilter(event.target.value)}><option>All items</option><option>Needs attention</option><option value="Needs Purchase Details">Needs Purchase Details</option><option value="Missing proof">Missing Proof</option><option value="Missing listing draft">Needs Listing Preparation</option><option>Review later</option><option>Sold only</option><option>Unsold only</option></Select>
            <Select label="Group" value={inventoryTimelineGrouping} onChange={(event) => onSetInventoryTimelineGrouping(event.target.value)}><option>Month</option><option>Week</option><option>Year</option><option>Ungrouped</option></Select>
            <Input label="Month" type="month" value={inventoryTimelineMonth} onChange={(event) => onSetInventoryTimelineMonth(event.target.value)} />
            <Select label="Sort" value={inventorySort} onChange={(event) => onSetInventorySort(event.target.value)}><option>Newest purchase date</option><option>Oldest purchase date</option><option>Highest expected/listing value</option><option>Highest final sale price</option><option>Highest estimated profit</option><option>Missing proof first</option></Select>
            <div className="flex items-end"><button type="button" onClick={onResetStockColumnWidths} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-600 hover:bg-stone-100">Reset Column Widths</button></div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {[
            ["All", "All statuses", stockQuickFilterCounts.all],
            ["Draft", "Draft", stockQuickFilterCounts.draft],
            ["Listed", "Listed", stockQuickFilterCounts.listed],
            ["Sold", "Sold", stockQuickFilterCounts.sold],
            ["Complete", "Complete", stockQuickFilterCounts.complete],
            ["Returned", "Returned", stockQuickFilterCounts.returned],
          ].map(([label, status, count]) => {
            const active = inventoryStatus === status;
            return <button key={status} type="button" onClick={() => onSetInventoryStatus(status)} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${active ? "border-[#b7412e] bg-[#b7412e] text-white" : "border-stone-200 bg-white text-stone-600 hover:border-[#b7412e]/30 hover:bg-[#fff8ea]"}`}>{label} <span className={active ? "text-white/75" : "text-stone-400"}>{count}</span></button>;
          })}
        </div>
        <p className="mt-2 text-xs font-medium text-stone-600">
          {stockTimelineTotals.itemCount} items <span className="text-stone-300">·</span> Cost {money(stockTimelineTotals.purchaseTotal)} <span className="text-stone-300">·</span> Listed {money(stockTimelineTotals.listedTotal)} <span className="text-stone-300">·</span> Sold {money(stockTimelineTotals.soldTotal)} <span className="text-stone-300">·</span> Profit {money(stockTimelineTotals.profitTotal)}
        </p>
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 px-3 py-2">
          <div>
            <h3 className="text-sm font-semibold text-stone-950">Stock Register</h3>
            <p className="text-xs text-stone-500">{stockTimelineItems.length} of {items.length} items</p>
          </div>
          {(inventorySearch || inventoryStatus !== "All statuses" || inventoryIssueFilter !== "All items" || inventoryCategory !== "All categories" || inventoryClassification !== "All classifications" || inventoryTimelineMonth) && <button type="button" onClick={() => { onSetInventorySearch(""); onSetInventoryStatus("All statuses"); onSetInventoryIssueFilter("All items"); onSetInventoryCategory("All categories"); onSetInventoryClassification("All classifications"); onSetInventoryTimelineMonth(""); }} className="text-xs font-semibold text-[#8f3124] hover:underline">Clear filters</button>}
        </div>

        {stockTimelineItems.length === 0 ? (
          <p className="p-6 text-sm text-stone-600">No stock items match the current filters.</p>
        ) : (
          <div className="max-h-[65vh] w-full overflow-auto">
            <table className="table-fixed border-collapse text-left text-xs" style={{ width: "100%", minWidth: stockTableWidth }}>
              <colgroup>{visibleStockColumnKeys.map((key) => <col key={key} style={{ width: stockColumnWidths[key] }} />)}</colgroup>
              <thead className="sticky top-0 z-10 bg-[#fff8ea] text-[10px] uppercase tracking-wide text-stone-500 shadow-[0_1px_0_rgba(120,113,108,0.22)]">
                <tr className="border-b border-stone-300">
                  {[
                    ["item", "Item"], ["date", "Purchased"], ["purchase", "Cost"], ["status", "Status"], ["source", "Source"], ["proof", "Proof"], ["listed", "Listed Price"], ["sold", "Sold Price"], ["profit", "Profit"], ["edit", "Action"],
                  ].map(([key, label]) => <th key={key} className={`relative whitespace-nowrap px-1.5 py-2 font-semibold ${["purchase", "listed", "sold", "profit"].includes(key) ? "text-right" : key === "edit" ? "text-center" : ""}`} style={{ width: stockColumnWidths[key] }}><span className="block truncate pr-1">{label}</span>{stockResizeHandle(key)}</th>)}
                </tr>
              </thead>
              <tbody>
                {stockTimelineGroups.map(([groupLabel, groupItems]) => (
                  <Fragment key={groupLabel}>
                    <tr><td colSpan={10} className="border-b border-stone-200 bg-stone-50 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">{groupLabel} ({groupItems.length})</td></tr>
                    {groupItems.map((item) => {
                      const sold = isSoldStatus(item);
                      const documentLabel = proofLabel(item);
                      return (
                        <tr key={item.id} className="border-b border-stone-100 last:border-0 hover:bg-[#fffaf0]">
                          <td className="overflow-hidden px-1.5 py-1" style={{ width: stockColumnWidths.item }}><button type="button" onClick={() => onEditItem(item)} className="block w-full truncate text-left font-semibold text-stone-950 hover:text-[#b7412e] hover:underline" title={item.name || "Untitled item"}>{item.name || "Untitled item"}</button></td>
                          <td className="whitespace-nowrap px-1 py-0.5" style={{ width: stockColumnWidths.date }}><input type="date" value={item.purchaseDate || ""} onChange={(event) => onUpdateItemField(item.id, "purchaseDate", event.target.value)} className={inputClass} /></td>
                          <td className="whitespace-nowrap px-1 py-0.5" style={{ width: stockColumnWidths.purchase }}><input type="number" step="0.01" value={item.purchasePrice || ""} onChange={(event) => onUpdateItemField(item.id, "purchasePrice", event.target.value)} className={`${inputClass} text-right tabular-nums`} placeholder="0.00" /></td>
                          <td className="whitespace-nowrap px-1 py-0.5" style={{ width: stockColumnWidths.status }}>
                            {statusOptions.includes(item.status || "Draft") ? (
                              <select value={item.status || "Draft"} onChange={(event) => onUpdateItemField(item.id, "status", event.target.value)} className={`${inputClass} border ${statusClass(item.status)}`}>{statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
                            ) : (
                              <span className={`block truncate rounded-md border px-1.5 py-1 text-[11px] font-semibold ${statusClass(item.status)}`} title={statusLabel(item.status)}>{statusLabel(item.status)}</span>
                            )}
                          </td>
                          <td className="overflow-hidden px-1 py-0.5" style={{ width: stockColumnWidths.source }}><input value={item.sourceName || item.sourceLocation || ""} onChange={(event) => onUpdateItemField(item.id, "sourceName", event.target.value)} className={`${inputClass} truncate`} placeholder="Source" title={item.sourceName || item.sourceLocation || ""} /></td>
                          <td className="whitespace-nowrap px-1.5 py-1" style={{ width: stockColumnWidths.proof }}><span className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold ${proofClass(documentLabel)}`}>{documentLabel}</span></td>
                          <td className="whitespace-nowrap px-1.5 py-1 text-right tabular-nums text-stone-700" style={{ width: stockColumnWidths.listed }}>{money(expectedListingValue(item))}</td>
                          <td className="whitespace-nowrap px-1 py-0.5" style={{ width: stockColumnWidths.sold }}><input type="number" step="0.01" value={item.finalSalePrice || ""} onChange={(event) => onUpdateItemField(item.id, "finalSalePrice", event.target.value)} className={`${inputClass} text-right tabular-nums`} placeholder="0.00" /></td>
                          <td className={`whitespace-nowrap px-1.5 py-1 text-right font-semibold tabular-nums ${sold ? "text-lime-800" : "text-stone-400"}`} style={{ width: stockColumnWidths.profit }}>{sold ? money(itemProfitValue(item)) : "–"}</td>
                          <td className="whitespace-nowrap px-1 py-0.5 text-center" style={{ width: stockColumnWidths.edit }}>
                            <details className="relative inline-block text-left">
                              <summary aria-label={`Actions for ${item.name || "item"}`} title="Actions" className="inline-flex h-7 w-8 cursor-pointer list-none items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"><MoreHorizontal size={14} /></summary>
                              <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl">
                                <button type="button" onClick={() => onEditItem(item)} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-stone-700 hover:bg-stone-50">Open Item</button>
                                <button type="button" onClick={() => onDuplicateItem(item)} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-stone-700 hover:bg-stone-50">Duplicate Item</button>
                                <button type="button" onClick={() => onMoveToPersonalCollection(item.id)} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-stone-700 hover:bg-stone-50">Move to Personal Collection</button>
                                <button type="button" onClick={() => onDeleteItem(item.id)} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-red-700 hover:bg-red-50">Delete Permanently</button>
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
