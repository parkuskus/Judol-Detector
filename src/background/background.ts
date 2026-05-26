import type { PopupStats } from "../types";

const badgeColor = "#f97316";

function updateBadge(total: number): void {
  const text = total > 0 ? String(total) : "";
  void chrome.action.setBadgeText({ text });
  void chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") {
    return;
  }

  if ("totalKeywords" in changes) {
    const newValue =
      (changes["totalKeywords"]?.newValue as number | undefined) ?? 0;
    updateBadge(newValue);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    void chrome.action.setBadgeText({ text: "", tabId });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    { totalKeywords: 0 },
    (items: Partial<PopupStats>) => {
      updateBadge(items.totalKeywords ?? 0);
    },
  );
});
