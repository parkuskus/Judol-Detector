type ScanStats = {
  totalKeywords: number;
  exactMatches: number;
  fuzzyMatches: number;
};

const initialStats: ScanStats = {
  totalKeywords: 0,
  exactMatches: 0,
  fuzzyMatches: 0
};

function persistStats(stats: ScanStats): void {
  chrome.storage.local.set(stats);
}

function scanPage(): void {
  const text = document.body?.innerText ?? '';
  const stats: ScanStats = {
    totalKeywords: text.trim().length > 0 ? 1 : 0,
    exactMatches: 0,
    fuzzyMatches: 0
  };

  persistStats(stats);
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (message === 'scan-now') {
    scanPage();
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

scanPage();

void initialStats;