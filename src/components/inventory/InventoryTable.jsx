import { Fragment } from "react";
import { ClipboardList, Edit3, Euro, FileText, Info, Package, ReceiptText, Search, ShoppingCart } from "lucide-react";
import { Input, Select } from "../shared/FormControls.jsx";

export function InventoryTable({
  items,
  stockTimelineItems,
  stockTimelineGroups,
  stockTimelineTotals,
  stockTableWidth,
  visibleStockColumnKeys,
  stockColumnWidths,
  stockViewMode,
  stockFilterMenu,
  stockActiveFilterCount,
  quickAddItem,
  inventorySearch,
  inventoryTimelineGrouping,
  inventoryClassification,
  inventoryStatus,
  inventoryTimelineMonth,
  classificationOptions,
  complianceReadinessByItemId,
  complianceStatusLabel,
  sellerClassificationLabel,
  statusOptions,
  stockColumnLabelMap,
  money,
  isSoldStatus,
  quickProofStatus,
  needsProofRecord,
  itemStatus,
  itemProfitValue,
  stockResizeHandle,
  onOpenNewItemEditor,
  onCreateQuickLedgerItem,
  onSetQuickAddItem,
  onSetStockFilterMenu,
  onSetInventorySearch,
  onSetInventoryTimelineGrouping,
  onSetInventoryClassification,
  onSetInventoryStatus,
  onSetInventoryTimelineMonth,
  onSetInventoryCategory,
  onSetInventoryIssueFilter,
  onSetStockViewMode,
  onResetStockColumnWidths,
  onUpdateItemField,
  onUpdateItemProofStatus,
  onEditItem,
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#b7412e]/15 bg-[#fffaf0] shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
      <div className="border-b border-[#eadfce] p-2.5 sm:p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-1.5 h-0.5 w-12 rounded-full bg-[#b7412e]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[#b7412e]">Stock Control</p>
            <h2 className="mt-0.5 text-lg font-semibold text-stone-950">Master Inventory Stock Control Sheet</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onOpenNewItemEditor} className="rounded-md bg-[#e06b2c] px-3 py-1.5 text-xs font-semibold text-[#24110e] shadow-sm hover:bg-[#f0be45]">
              Add Item
            </button>
            <div className="rounded-md border border-[#b7412e]/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#8f3124]">
              {stockTimelineItems.length} of {items.length} items
            </div>
          </div>
        </div>

      </div>

      <div className="min-w-0 p-1.5 sm:p-2">
        <div className="mb-2 rounded-lg border border-[#b7412e]/15 bg-white shadow-[0_4px_14px_rgba(41,37,36,0.04)]">
          <div className="grid grid-cols-2 divide-x divide-y divide-stone-100 border-l-2 border-[#b7412e] text-[11px] sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
            {[
              [Package, "Visible", stockTimelineTotals.itemCount],
              [Euro, "Purchase cost", money(stockTimelineTotals.purchaseTotal)],
              [ShoppingCart, "Sold total", money(stockTimelineTotals.soldTotal)],
              [Euro, "Est. profit", money(stockTimelineTotals.profitTotal), "text-lime-800"],
              [Package, "Unsold", stockTimelineTotals.unsoldCount],
              [ReceiptText, "Missing proof", stockTimelineTotals.missingProofCount, stockTimelineTotals.missingProofCount ? "text-[#8f3124]" : ""],
            ].map(([Icon, label, value, valueClass = "text-stone-950"]) => (
              <div key={label} className="flex items-center gap-2 px-2 py-2">
                <Icon size={13} className="shrink-0 text-[#b7412e]" />
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
                  <p className={`truncate text-sm font-semibold ${valueClass}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-2 rounded-lg border border-[#b7412e]/20 bg-[#fff6e6] shadow-[0_4px_14px_rgba(183,65,46,0.06)]">
          <div className="hidden grid-cols-[6.5rem_minmax(8rem,1.4fr)_minmax(7rem,1fr)_4.25rem_8.5rem] items-center gap-1 border-b border-[#b7412e]/10 bg-[#fff2dc] px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500 md:grid">
            <span>Date</span>
            <span>Item</span>
            <span>Source</span>
            <span className="text-right">Purchase</span>
            <span className="text-center text-[#8f3124]">Quick Stock Entry</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-1 border-l-2 border-[#b7412e] px-1.5 py-1.5 md:grid-cols-[6.5rem_minmax(8rem,1.4fr)_minmax(7rem,1fr)_4.25rem_8.5rem]">
            <input type="date" value={quickAddItem.purchaseDate} onChange={(e) => onSetQuickAddItem({ ...quickAddItem, purchaseDate: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") onCreateQuickLedgerItem(); }} className="h-7 rounded border border-stone-200 bg-white px-1 text-[11px] text-stone-900 outline-none focus:border-[#b7412e]/30 focus:ring-1 focus:ring-[#b7412e]/15" />
            <input value={quickAddItem.name} onChange={(e) => onSetQuickAddItem({ ...quickAddItem, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") onCreateQuickLedgerItem(); }} className="h-7 rounded border border-stone-200 bg-white px-2 text-[11px] font-semibold text-stone-900 outline-none focus:border-[#b7412e]/30 focus:ring-1 focus:ring-[#b7412e]/15" placeholder="New stock item" />
            <input value={quickAddItem.sourceName} onChange={(e) => onSetQuickAddItem({ ...quickAddItem, sourceName: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") onCreateQuickLedgerItem(); }} className="h-7 rounded border border-stone-200 bg-white px-2 text-[11px] text-stone-900 outline-none focus:border-[#b7412e]/30 focus:ring-1 focus:ring-[#b7412e]/15" placeholder="Source" />
            <input type="number" step="0.01" value={quickAddItem.purchasePrice} onChange={(e) => onSetQuickAddItem({ ...quickAddItem, purchasePrice: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") onCreateQuickLedgerItem(); }} className="h-7 rounded border border-stone-200 bg-white px-1 text-right text-[11px] text-stone-900 outline-none focus:border-[#b7412e]/30 focus:ring-1 focus:ring-[#b7412e]/15" placeholder="0.00" />
            <div className="col-span-2 flex justify-end gap-1 md:col-span-1">
              <button type="button" onClick={() => onCreateQuickLedgerItem()} className="h-7 rounded border border-[#b7412e]/20 bg-white px-2 text-[11px] font-semibold text-[#8f3124] hover:bg-[#fff6e6]">Add</button>
              <button type="button" onClick={() => onCreateQuickLedgerItem({ openEditor: true })} className="h-7 rounded bg-[#e06b2c] px-2 text-[11px] font-semibold text-[#24110e] hover:bg-[#f0be45]">Add & Edit</button>
            </div>
          </div>
        </div>

        <div className="relative mb-2 flex flex-wrap gap-1.5">
          {[
            ["search", Search, "Search", inventorySearch.trim()],
            ["group", ClipboardList, "Group", inventoryTimelineGrouping !== "Month"],
            ["classification", Package, "Type", inventoryClassification !== "All classifications"],
            ["status", Info, "Status", inventoryStatus !== "All statuses"],
            ["date", ReceiptText, "Date", inventoryTimelineMonth],
            ["view", FileText, "View", stockViewMode === "Compact view"],
          ].map(([key, Icon, label, active]) => (
            <button key={key} type="button" onClick={() => onSetStockFilterMenu(stockFilterMenu === key ? "" : key)} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${active ? "border-[#b7412e]/30 bg-[#b7412e]/8 text-[#8f3124]" : "border-stone-200 bg-white text-stone-600 hover:border-[#b7412e]/20 hover:bg-[#fff6e6]"}`}>
              <Icon size={11} /> {label}
            </button>
          ))}
          {stockActiveFilterCount > 0 && <button type="button" onClick={() => { onSetInventorySearch(""); onSetInventoryTimelineGrouping("Month"); onSetInventoryClassification("All classifications"); onSetInventoryStatus("All statuses"); onSetInventoryTimelineMonth(""); onSetInventoryCategory("All categories"); onSetInventoryIssueFilter("All items"); onSetStockFilterMenu(""); }} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-500 hover:bg-stone-50">Clear</button>}
          <button type="button" onClick={onResetStockColumnWidths} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-500 hover:bg-stone-50">Reset Widths</button>

          {stockFilterMenu && (
            <div className="absolute left-0 top-8 z-20 w-72 rounded-xl border border-stone-200 bg-white p-3 shadow-[0_18px_42px_rgba(41,37,36,0.16)]">
              {stockFilterMenu === "search" && <Input label="Search" value={inventorySearch} onChange={(e) => onSetInventorySearch(e.target.value)} placeholder="Name, category, source, title..." />}
              {stockFilterMenu === "group" && <Select label="Group by" value={inventoryTimelineGrouping} onChange={(e) => onSetInventoryTimelineGrouping(e.target.value)}><option>Month</option><option>Week</option><option>Year</option><option>Ungrouped</option></Select>}
              {stockFilterMenu === "classification" && <Select label="Classification" value={inventoryClassification} onChange={(e) => onSetInventoryClassification(e.target.value)}><option>All classifications</option>{classificationOptions.map((classification) => <option key={classification}>{classification}</option>)}</Select>}
              {stockFilterMenu === "status" && <Select label="Status" value={inventoryStatus} onChange={(e) => onSetInventoryStatus(e.target.value)}><option>All statuses</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</Select>}
              {stockFilterMenu === "date" && <Input label="Month filter" type="month" value={inventoryTimelineMonth} onChange={(e) => onSetInventoryTimelineMonth(e.target.value)} />}
              {stockFilterMenu === "view" && <Select label="View" value={stockViewMode} onChange={(e) => onSetStockViewMode(e.target.value)}><option>Compact view</option><option>Detailed view</option></Select>}
            </div>
          )}
        </div>

        {stockTimelineItems.length === 0 && (
          <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600">No inventory items match the current timeline filters.</p>
        )}

        {stockTimelineItems.length > 0 && (
          <div className="w-full max-w-full overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="table-fixed border-collapse text-left text-[11px]" style={{ width: "100%", minWidth: stockTableWidth }}>
              <colgroup>
                {visibleStockColumnKeys.map((key) => <col key={key} style={{ width: stockColumnWidths[key] }} />)}
              </colgroup>
              <thead className="sticky top-0 z-10 bg-[#fff8ea] text-[10px] uppercase tracking-wide text-stone-500">
                <tr className="border-b border-stone-200">
                  {visibleStockColumnKeys.map((key) => {
                    const numericColumn = ["purchase", "sold", "profit"].includes(key);
                    const centeredColumn = key === "edit";
                    return (
                      <th key={key} className={`relative select-none py-1.5 font-semibold ${numericColumn ? "px-0.5 text-right" : centeredColumn ? "px-0.5 text-center" : "px-1"}`} style={{ width: stockColumnWidths[key] }}>
                        <span className="block truncate pr-2">{stockColumnLabelMap[key]}</span>
                        {stockResizeHandle(key)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {stockTimelineGroups.map(([groupLabel, groupItems]) => (
                  <Fragment key={groupLabel}>
                    <tr>
                      <td colSpan={visibleStockColumnKeys.length} className="border-b border-stone-200 bg-[#fffaf0] px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8f3124]">
                        {groupLabel} <span className="font-medium text-stone-400">({groupItems.length})</span>
                      </td>
                    </tr>
                    {groupItems.map((item) => {
                      const sold = isSoldStatus(item);
                      const proofStatus = quickProofStatus(item) === "Eigenbeleg needed" ? "Eigenbeleg" : needsProofRecord(item) ? "Missing" : "OK";
                      const complianceStatus = complianceReadinessByItemId[item.id]?.status || "not_applicable";
                      const inputClass = "min-h-6 w-full rounded border border-transparent bg-transparent px-1 text-[11px] text-stone-900 outline-none hover:border-stone-200 hover:bg-white focus:border-[#b7412e]/30 focus:bg-white focus:ring-1 focus:ring-[#b7412e]/15";
                      return (
                        <tr key={item.id} className="border-b border-stone-100 last:border-b-0 hover:bg-[#fffaf0]/75">
                          <td className="px-1 py-0.5" style={{ width: stockColumnWidths.date }}>
                            <input type="date" value={item.purchaseDate || ""} onChange={(e) => onUpdateItemField(item.id, "purchaseDate", e.target.value)} className={inputClass} />
                          </td>
                          <td className="px-1 py-0.5" style={{ width: stockColumnWidths.item }}>
                            <textarea value={item.name || ""} onChange={(e) => onUpdateItemField(item.id, "name", e.target.value)} title={item.name || ""} rows={1} className={`${inputClass} min-w-0 resize-none overflow-hidden whitespace-normal break-words font-semibold leading-5`} placeholder="Item name" />
                          </td>
                          <td className="px-1 py-0.5" style={{ width: stockColumnWidths.status }}>
                            <select value={itemStatus(item)} onChange={(e) => onUpdateItemField(item.id, "status", e.target.value)} className={inputClass}>
                              {statusOptions.map((status) => <option key={status}>{status}</option>)}
                            </select>
                          </td>
                          <td className="px-1 py-0.5" style={{ width: stockColumnWidths.seller }}>
                            <span className="block truncate rounded border border-transparent px-1 py-1 text-[11px] font-semibold text-stone-700" title={sellerClassificationLabel(item.sellerClassification)}>
                              {sellerClassificationLabel(item.sellerClassification)}
                            </span>
                          </td>
                          <td className="px-1 py-0.5" style={{ width: stockColumnWidths.compliance }}>
                            <span className="block truncate rounded border border-transparent px-1 py-1 text-[11px] font-semibold text-stone-700" title={complianceStatusLabel(complianceStatus)}>
                              {complianceStatusLabel(complianceStatus)}
                            </span>
                          </td>
                          <td className="px-1 py-0.5" style={{ width: stockColumnWidths.source }}>
                            <input value={item.sourceName || item.sourceLocation || ""} onChange={(e) => onUpdateItemField(item.id, "sourceName", e.target.value)} className={inputClass} placeholder="Source" />
                          </td>
                          <td className="px-0.5 py-0.5" style={{ width: stockColumnWidths.purchase }}>
                            <input type="number" step="0.01" value={item.purchasePrice || ""} onChange={(e) => onUpdateItemField(item.id, "purchasePrice", e.target.value)} className={`${inputClass} whitespace-nowrap text-right tabular-nums`} placeholder="0.00" />
                          </td>
                          <td className="px-0.5 py-0.5" style={{ width: stockColumnWidths.sold }}>
                            <input type="number" step="0.01" value={item.finalSalePrice !== undefined ? item.finalSalePrice : item.salePrice || ""} onChange={(e) => onUpdateItemField(item.id, "finalSalePrice", e.target.value)} className={`${inputClass} whitespace-nowrap text-right tabular-nums`} placeholder="0.00" />
                          </td>
                          {stockViewMode === "Detailed view" && <td className={`whitespace-nowrap px-0.5 py-0.5 text-right font-semibold tabular-nums ${sold ? "text-lime-800" : "text-stone-400"}`} style={{ width: stockColumnWidths.profit }}>{sold ? money(itemProfitValue(item)) : "-"}</td>}
                          {stockViewMode === "Detailed view" && <td className="px-1 py-0.5" style={{ width: stockColumnWidths.proof }}>
                            <select value={proofStatus} onChange={(e) => onUpdateItemProofStatus(item.id, e.target.value)} className={`${inputClass} font-semibold ${proofStatus === "Missing" ? "text-red-700" : proofStatus === "Eigenbeleg" ? "text-[#8a5b10]" : "text-lime-800"}`}>
                              <option>OK</option>
                              <option>Missing</option>
                              <option>Eigenbeleg</option>
                            </select>
                          </td>}
                          <td className="px-0.5 py-0.5 text-center" style={{ width: stockColumnWidths.edit }}>
                            <button type="button" onClick={() => onEditItem(item)} className="inline-flex h-6 w-6 items-center justify-center rounded border border-transparent bg-transparent text-stone-500 hover:border-stone-200 hover:bg-white hover:text-[#8f3124]" title="Open full item workspace" aria-label={`Open ${item.name || "item"} workspace`}>
                              <Edit3 size={12} />
                            </button>
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
      </div>
    </div>
  );
}
