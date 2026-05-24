import type { ContentPipelineState, PopupStats, ScanRequest, ScanResponse, ScanTarget, KeywordMatch } from '../types';
import { applyHighlights, clearHighlights } from './highlighter';
import { collectScanTargets, readDocumentText } from './scanner';
import { hideTooltip } from './tooltip';

const initialStats: PopupStats = {
  totalKeywords: 0,
  exactMatches: 0,
  regexMatches: 0,
  fuzzyMatches: 0
};

function createRequest(): ScanRequest {
  return {
    url: location.href,
    text: readDocumentText(document.body ?? document),
    timestamp: Date.now()
  };
}

function persistStats(stats: PopupStats): void {
  chrome.storage.local.set(stats);
}

function buildMatches(targets: ScanTarget[]): Array<{ target: ScanTarget; match: KeywordMatch }> {
  return targets.map((target) => ({
    target,
    match: {
      keyword: target.text,
      matchedText: target.text,
      algorithm: 'Fuzzy',
      source: 'fuzzy',
      startIndex: 0,
      endIndex: target.text.length,
      occurrenceCount: 1,
      targetIndex: target.index,
      executionTimeMs: 0
    }
  }));
}

function buildPipelineState(): ContentPipelineState {
  const request = createRequest();
  const targets = collectScanTargets(document);

  return {
    request,
    targets,
    stats: {
      totalKeywords: request.text.length > 0 ? 1 : 0,
      exactMatches: 0,
      regexMatches: 0,
      fuzzyMatches: 0
    }
  };
}

function runScan(): ScanResponse {
  clearHighlights(document);
  hideTooltip();

  const pipeline = buildPipelineState();
  const matchedTargets = buildMatches(pipeline.targets);
  applyHighlights(matchedTargets);
  persistStats(pipeline.stats);

  return {
    ok: true,
    result: {
      matches: matchedTargets.map(({ match }) => match),
      totalMatches: pipeline.stats.totalKeywords,
      exactMatches: pipeline.stats.exactMatches,
      regexMatches: pipeline.stats.regexMatches,
      fuzzyMatches: pipeline.stats.fuzzyMatches,
      scannedTextLength: pipeline.request.text.length,
      executionTimeMs: 0
    }
  };
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (message === 'scan-now') {
    sendResponse(runScan());
    return true;
  }

  return false;
});

let scanTimer: number | undefined;
let internalMutation = false;

function scheduleScan(): void {
  if (scanTimer !== undefined) {
    window.clearTimeout(scanTimer);
  }

  scanTimer = window.setTimeout(() => {
    internalMutation = true;
    runScan();
    window.setTimeout(() => {
      internalMutation = false;
    }, 0);
  }, 150);
}

const observer = new MutationObserver((mutations) => {
  if (internalMutation) {
    return;
  }

  if (mutations.some((mutation) => mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0 || mutation.type === 'characterData')) {
    scheduleScan();
  }
});

const observerRoot = document.body ?? document.documentElement;

if (observerRoot) {
  observer.observe(observerRoot, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

runScan();

void initialStats;