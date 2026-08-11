import { normalizeRootAppData } from "./resellitSchema.js";

export const STORAGE_KEY = "toolstack.resellit.v1";
export const OLD_STORAGE_KEY = "toolstack.resellerit.v1";

export const STORAGE_LOAD_WARNING = "Stored ResellIt data could not be loaded. Your original browser data has been preserved. Restore from a recent backup before entering new data.";

function emptyAppData() {
  return normalizeRootAppData({
    version: 2,
    items: [],
    expenses: [],
    purchaseRecords: [],
    purchaseTransactions: [],
    purchaseAllocations: [],
    evidenceRecords: [],
    eigenbelege: [],
  });
}

export function loadInitialAppData(storage) {
  const emptyResult = { data: emptyAppData(), warning: "" };
  if (!storage) return { ...emptyResult, warning: STORAGE_LOAD_WARNING };

  let raw;
  let shouldMigrateOldData = false;
  try {
    raw = storage.getItem(STORAGE_KEY);
    if (raw === null) {
      raw = storage.getItem(OLD_STORAGE_KEY);
      shouldMigrateOldData = raw !== null;
    }
  } catch {
    return { ...emptyResult, warning: STORAGE_LOAD_WARNING };
  }

  if (raw === null) return emptyResult;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError("Invalid ResellIt storage payload");
    const data = normalizeRootAppData(parsed);

    if (shouldMigrateOldData) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify({
          ...parsed,
          version: data.version,
          items: data.items,
          expenses: data.expenses,
          purchaseRecords: data.purchaseRecords,
          purchaseTransactions: data.purchaseTransactions,
          purchaseAllocations: data.purchaseAllocations,
          evidenceRecords: data.evidenceRecords,
          eigenbelege: data.eigenbelege,
          updatedAt: new Date().toISOString(),
        }));
      } catch {
        // Valid legacy data is still safe to use if its migration copy cannot be written.
      }
    }

    return { data, warning: "" };
  } catch {
    return { ...emptyResult, warning: STORAGE_LOAD_WARNING };
  }
}

export function loadInitialBrowserAppData(browserWindow) {
  try {
    return loadInitialAppData(browserWindow?.localStorage);
  } catch {
    return { data: emptyAppData(), warning: STORAGE_LOAD_WARNING };
  }
}
