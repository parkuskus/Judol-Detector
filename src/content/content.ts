import type { ContentPipelineState, DetectionResult, PopupStats, ScanRequest, ScanResponse } from '../types';
import { applyDetectionResult, clearHighlights } from './highlighter';
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

function createEmptyDetectionResult(textLength: number): DetectionResult {
  return {
    matches: [],
    totalMatches: 0,
    exactMatches: 0,
    regexMatches: 0,
    fuzzyMatches: 0,
    scannedTextLength: textLength,
    executionTimeMs: 0
  };
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
  const detectionResult = createEmptyDetectionResult(pipeline.request.text.length);
  applyDetectionResult(detectionResult, pipeline.targets);
  persistStats(pipeline.stats);

  return {
    ok: true,
    result: {
      ...detectionResult
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