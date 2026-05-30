import testSuite from '../test-cases.json';
import { createAhoCorasickEngine } from '../src/algorithms/ahoCorasick.ts';
import { createBoyerMooreEngine } from '../src/algorithms/boyerMoore.ts';
import { runDetectionEnginesDetailed } from '../src/algorithms/index.ts';
import { createKmpEngine } from '../src/algorithms/kmp.ts';
import { createRabinKarpEngine } from '../src/algorithms/rabinKarp.ts';
import { createRegexEngine } from '../src/algorithms/regex.ts';
import { createFuzzyEngine } from '../src/algorithms/weightedLevenshtein.ts';
import type { DetectionContext, DetectionEngine } from '../src/types/index.ts';

type JsonTestCase = {
	id: string;
	category: string;
	input: string;
	expected: boolean;
	label: string;
	rationale: string;
	notes?: string;
};

type TestSuite = {
	meta: {
		version: string;
		created: string;
		total_cases: number;
		description: string;
	};
	test_cases: JsonTestCase[];
};

type Classification = 'TP' | 'FP' | 'FN' | 'TN';

type CaseResult = {
	id: string;
	expected: boolean;
	actual: boolean;
	label: Classification;
	pass: boolean;
	pipelineMatches: number;
	perEngine: Record<string, boolean>;
};

type Metrics = {
	tp: number;
	fp: number;
	fn: number;
	tn: number;
};

const ENGINE_FACTORIES: Array<() => DetectionEngine> = [
	() => createKmpEngine(),
	() => createBoyerMooreEngine(),
	() => createAhoCorasickEngine(),
	() => createRabinKarpEngine(),
	() => createRegexEngine(),
	() => createFuzzyEngine()
];

const MOCK_KEYWORDS = [
	'slot',
	'gacor',
	'maxwin',
	'jackpot',
	'bocoran',
	'daftar sekarang',
	'togel'
].join('\n');

const globalAny = globalThis as any;
const originalFetch: typeof fetch | undefined = globalAny.fetch?.bind(globalThis);

globalAny.chrome = {
	runtime: {
		getURL: (path: string) => path
	}
};

globalAny.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

	if (url.includes('keywords/keywords.txt')) {
		return new Response(MOCK_KEYWORDS, { status: 200 });
	}

	if (originalFetch) {
		return originalFetch(input as any, init);
	}

	throw new Error(`No mocked fetch handler for ${url}`);
};

function loadTestSuite(): TestSuite {
	return testSuite as TestSuite;
}

function buildContext(input: string): DetectionContext {
	return {
		url: 'https://tc.local',
		text: input,
		timestamp: Date.now(),
		targets: [
			{
				element: {} as HTMLElement,
				text: input,
				index: 0,
				tagName: 'p'
			}
		],
		exactMatchedKeywords: new Set<string>()
	};
}

function newMetrics(): Metrics {
	return { tp: 0, fp: 0, fn: 0, tn: 0 };
}

function classify(expected: boolean, actual: boolean): Classification {
	if (expected && actual) return 'TP';
	if (!expected && actual) return 'FP';
	if (expected && !actual) return 'FN';
	return 'TN';
}

function bump(metrics: Metrics, label: Classification): void {
	if (label === 'TP') metrics.tp += 1;
	if (label === 'FP') metrics.fp += 1;
	if (label === 'FN') metrics.fn += 1;
	if (label === 'TN') metrics.tn += 1;
}

function printMetrics(name: string, metrics: Metrics): void {
	console.log(`${name} => TP=${metrics.tp} FP=${metrics.fp} FN=${metrics.fn} TN=${metrics.tn}`);
}

async function evaluateCase(testCase: JsonTestCase): Promise<CaseResult> {
	const context = buildContext(testCase.input);
	const perEngine: Record<string, boolean> = {};

	for (const createEngine of ENGINE_FACTORIES) {
		const engine = createEngine();
		const matches = await engine.detect(context);
		perEngine[engine.name] = matches.length > 0;
	}

	const pipeline = await runDetectionEnginesDetailed(context);
	const actual = pipeline.matches.length > 0;
	const label = classify(testCase.expected, actual);

	return {
		id: testCase.id,
		expected: testCase.expected,
		actual,
		label,
		pass: label === 'TP' || label === 'TN',
		pipelineMatches: pipeline.matches.length,
		perEngine
	};
}

async function main(): Promise<void> {
	const suite = loadTestSuite();
	const cases = suite.test_cases.filter((testCase) => testCase.id !== 'TC-08');

	if (cases.length !== 7) {
		throw new Error(`Expected 7 test cases after removing TC-08, got ${cases.length}`);
	}

	const pipelineMetrics = newMetrics();
	const engineMetrics = new Map<string, Metrics>();
	for (const createEngine of ENGINE_FACTORIES) {
		engineMetrics.set(createEngine().name, newMetrics());
	}

	const results: CaseResult[] = [];
	for (const testCase of cases) {
		const result = await evaluateCase(testCase);
		results.push(result);
		bump(pipelineMetrics, result.label);

		for (const [engineName, detected] of Object.entries(result.perEngine)) {
			const metrics = engineMetrics.get(engineName);
			if (!metrics) continue;
			bump(metrics, classify(testCase.expected, detected));
		}
	}

	for (const result of results) {
		const status = result.pass ? 'PASS' : 'FAIL';
		console.log(`${result.id} | expected=${result.expected} | pipelineActual=${result.actual} | ${result.label} | ${status}`);
		console.log(
			`  matches=${result.pipelineMatches} | KMP=${result.perEngine.KMP} BM=${result.perEngine.BM} AhoCorasick=${result.perEngine.AhoCorasick} RabinKarp=${result.perEngine.RabinKarp} Regex=${result.perEngine.Regex} Fuzzy=${result.perEngine.Fuzzy}`
		);

		if (result.id === 'TC-06' || result.id === 'TC-07') {
			const source = cases.find((testCase) => testCase.id === result.id);
			if (source?.notes) {
				console.log(`  notes: ${source.notes}`);
			}
		}
	}

	const passedCount = results.filter((result) => result.pass).length;
	console.log(`${passedCount}/${results.length} pipeline pass (TP+TN)`);
	printMetrics('Pipeline', pipelineMetrics);
	for (const [engineName, metrics] of engineMetrics.entries()) {
		printMetrics(engineName, metrics);
	}
}

void main();
