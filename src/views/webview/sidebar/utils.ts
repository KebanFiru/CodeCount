export const escapeHtml = (value: string): string => {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
};

const LANGUAGE_NAMES: Record<string, string> = {
	typescript: 'TypeScript',
	typescriptreact: 'TypeScript React',
	javascript: 'JavaScript',
	javascriptreact: 'JavaScript React',
	python: 'Python',
	java: 'Java',
	csharp: 'C#',
	cpp: 'C++',
	c: 'C',
	rust: 'Rust',
	go: 'Go',
	kotlin: 'Kotlin',
	swift: 'Swift',
	objective_c: 'Objective-C',
	php: 'PHP',
	ruby: 'Ruby',
	perl: 'Perl',
	scala: 'Scala',
	r: 'R',
	sql: 'SQL',
	html: 'HTML',
	css: 'CSS',
	scss: 'SCSS',
	less: 'Less',
	sass: 'SASS',
	xml: 'XML',
	json: 'JSON',
	jsonc: 'JSON with Comments',
	yaml: 'YAML',
	yml: 'YAML',
	toml: 'TOML',
	markdown: 'Markdown',
	md: 'Markdown',
	plaintext: 'Plain Text',
	ignore: 'Ignore File'
};

export const formatLanguageLabel = (languageId: string): string => {
	if (!languageId) {
		return 'Unknown';
	}
	return languageId
		.split(/[-_]/g)
		.map(part => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
		.join(' ');
};

export const getLanguageFullName = (languageId: string): string => {
	return LANGUAGE_NAMES[languageId.toLowerCase()] || formatLanguageLabel(languageId);
};

const CHART_COLOR_VARS = [
	'--vscode-charts-blue',
	'--vscode-charts-green',
	'--vscode-charts-orange',
	'--vscode-charts-purple',
	'--vscode-charts-yellow',
	'--vscode-charts-red'
];

export const chartColorVar = (index: number): string => {
	return `var(${CHART_COLOR_VARS[index % CHART_COLOR_VARS.length]})`;
};

export const clampPercent = (value: number): number => {
	if (!Number.isFinite(value)) {
		return 0;
	}
	return Math.max(0, Math.min(100, value));
};

export const basename = (filePath: string): string => {
	const normalized = filePath.replace(/\\/g, '/');
	const idx = normalized.lastIndexOf('/');
	return idx >= 0 ? normalized.slice(idx + 1) : normalized;
};
