import type { ScanTarget } from '../types';

const TEXT_SELECTOR = 'body *';

function isSkippableElement(element: Element): boolean {
	return ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(element.tagName);
}

function normalizeText(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

export function collectScanTargets(root: ParentNode = document): ScanTarget[] {
	const targets: ScanTarget[] = [];
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
	let currentNode: Node | null = walker.currentNode;

	while (currentNode !== null) {
		if (currentNode instanceof Element && !isSkippableElement(currentNode)) {
			const text = normalizeText(currentNode.textContent ?? '');
			if (text.length > 0) {
				targets.push({ element: currentNode as HTMLElement, text });
			}
		}

		currentNode = walker.nextNode();
	}

	return targets;
}

export function readDocumentText(root: ParentNode = document.body ?? document): string {
	return normalizeText(root.textContent ?? '');
}
