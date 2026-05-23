import './popup.css';

import type { PopupStats } from '../types';

const defaultStats: PopupStats = {
  totalKeywords: 0,
  exactMatches: 0,
  regexMatches: 0,
  fuzzyMatches: 0
};

function renderStats(stats: PopupStats): void {
  const statsElement = document.getElementById('stats');
  if (!statsElement) {
    return;
  }

  statsElement.innerHTML = `
    <div class="card"><span>Total keyword</span><strong>${stats.totalKeywords}</strong></div>
    <div class="card"><span>Exact match</span><strong>${stats.exactMatches}</strong></div>
    <div class="card"><span>Regex match</span><strong>${stats.regexMatches}</strong></div>
    <div class="card"><span>Fuzzy match</span><strong>${stats.fuzzyMatches}</strong></div>
  `;
}

function loadStats(): void {
  chrome.storage.local.get(defaultStats, (items: Partial<PopupStats>) => {
    renderStats({
      totalKeywords: items.totalKeywords ?? defaultStats.totalKeywords,
      exactMatches: items.exactMatches ?? defaultStats.exactMatches,
      regexMatches: items.regexMatches ?? defaultStats.regexMatches,
      fuzzyMatches: items.fuzzyMatches ?? defaultStats.fuzzyMatches
    });
  });
}

document.addEventListener('DOMContentLoaded', loadStats);