function jsonValuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => jsonValuesEqual(value, right[index]));
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    if (!jsonValuesEqual(leftKeys, rightKeys)) return false;
    return leftKeys.every((key) => jsonValuesEqual(left[key], right[key]));
  }
  return false;
}

export function createItemEditorBaseline(form) {
  return structuredClone(form);
}

export function itemEditorHasChanges(form, baseline) {
  return baseline !== null && !jsonValuesEqual(form, baseline);
}

export function draftEigenbelegEditorSnapshot(record) {
  if (!record) return null;
  return {
    id: record.id || "",
    reasonNoReceipt: record.reasonNoReceipt || "",
    sellerDescription: record.sellerDescription || "",
    acquisitionDescription: record.acquisitionDescription || "",
  };
}

export function updateItemEditorBaselineField(baseline, field, value) {
  return baseline === null ? null : { ...structuredClone(baseline), [field]: value };
}
