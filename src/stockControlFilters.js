import { listingReadiness } from "./ebayListingTemplate.js";
import { purchaseDetailsReadiness } from "./gptListingPackage.js";
import { hasListingDraft, isSoldStatus } from "./resellitLogic.js";
import { DEFAULT_CLASSIFICATION, itemClassification } from "./resellitSchema.js";

export function stockItemNeedsProof(item) {
  return !(
    item.hasReceipt === "Yes" ||
    item.proofStoredExternally === "Yes" ||
    item.proofFileName ||
    item.proofFolderLocation ||
    item.proofImageDataUrl ||
    item.proofNotes
  );
}

export function stockItemNeedsAttention(item) {
  return (
    purchaseDetailsReadiness(item).status === "Needs Purchase Details" ||
    stockItemNeedsProof(item) ||
    !hasListingDraft(item) ||
    itemClassification(item) === DEFAULT_CLASSIFICATION
  );
}

export function matchesStockIssueFilter(item, filter) {
  if (filter === "Needs Attention") return stockItemNeedsAttention(item);
  if (filter === "Needs Purchase Details") return purchaseDetailsReadiness(item).status === "Needs Purchase Details";
  if (filter === "Missing Proof") return stockItemNeedsProof(item);
  if (filter === "Needs Listing Preparation") return !hasListingDraft(item);
  if (filter === "Ready for Listing") return !isSoldStatus(item) && listingReadiness(item) === "Ready";
  if (filter === "Review later") return itemClassification(item) === DEFAULT_CLASSIFICATION;
  return true;
}
