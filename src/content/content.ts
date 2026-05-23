import type { PopupStats, ScanRequest, ScanResponse } from '../types';

const initialStats: PopupStats = {
  totalKeywords: 0,
  exactMatches: 0,
  regexMatches: 0,
  fuzzyMatches: 0
};

function persistStats(stats: PopupStats): void {
  chrome.storage.local.set(stats);
}

function scanPage(): void {
  const text = document.body?.innerText ?? '';
  const request: ScanRequest = {
    url: location.href,
    text,
    timestamp: Date.now()
  };

  const stats: PopupStats = {
    totalKeywords: request.text.trim().length > 0 ? 1 : 0,
    exactMatches: 0,
    regexMatches: 0,
    fuzzyMatches: 0
  };

  persistStats(stats);
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (message === 'scan-now') {
    scanPage();
    const response: ScanResponse = { ok: true };
    sendResponse(response);
    return true;
  }

  return false;
});

scanPage();

void initialStats;