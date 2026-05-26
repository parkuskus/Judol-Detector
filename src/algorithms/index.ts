import type { DetectionContext, KeywordMatch } from '../types';
import { createBoyerMooreEngine } from './boyerMoore';
import { createFuzzyEngine } from './weightedLevenshtein';
import { createKmpEngine } from './kmp';
import { createRegexEngine } from './regex';
import { normalizeKeyword, nowMs } from './shared';

export interface DetectionTimings {
	kmp: number;
	bm: number;
	regex: number;
	fuzzy: number;
}

export async function runDetectionEngines(context: DetectionContext): Promise<KeywordMatch[]> {
	const { matches } = await runDetectionEnginesDetailed(context);
	return matches;
}

export async function runDetectionEnginesDetailed(context: DetectionContext): Promise<{ matches: KeywordMatch[]; timings: DetectionTimings }> {
	const kmpEngine = createKmpEngine();
	const boyerMooreEngine = createBoyerMooreEngine();
	const regexEngine = createRegexEngine();
	const fuzzyEngine = createFuzzyEngine();

	const kmpStart = nowMs();
	const kmpMatches = await kmpEngine.detect(context);
	const kmpTime = nowMs() - kmpStart;

	const bmStart = nowMs();
	const bmMatches = await boyerMooreEngine.detect(context);
	const bmTime = nowMs() - bmStart;

	const exactKeywords = new Set<string>();
	for (const match of [...kmpMatches, ...bmMatches]) {
		exactKeywords.add(normalizeKeyword(match.keyword));
	}

	const regexStart = nowMs();
	const regexMatches = await regexEngine.detect(context);
	const regexTime = nowMs() - regexStart;

	const fuzzyStart = nowMs();
	const fuzzyMatches = await fuzzyEngine.detect({
		...context,
		exactMatchedKeywords: exactKeywords
	});
	const fuzzyTime = nowMs() - fuzzyStart;

	const matches: KeywordMatch[] = [];
	[kmpMatches, bmMatches, regexMatches, fuzzyMatches].forEach((engineMatches) => {
		matches.push(...engineMatches.map((match) => ({ ...match })));
	});

	return {
		matches,
		timings: {
			kmp: kmpTime,
			bm: bmTime,
			regex: regexTime,
			fuzzy: fuzzyTime
		}
	};
}