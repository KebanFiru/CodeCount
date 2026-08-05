/**
 * The theme's chart palette, as CSS custom-property references. Safe anywhere CSS
 * is evaluated (inline styles, stylesheets) — but NOT for Chart.js, which paints to
 * a canvas and cannot resolve `var()`. Charts use `window.CCTheme.seriesList()`
 * from `chartTheme.ts`, which resolves the same tokens at runtime.
 */
const CHART_COLOR_TOKENS = [
	'--vscode-charts-blue',
	'--vscode-charts-green',
	'--vscode-charts-orange',
	'--vscode-charts-purple',
	'--vscode-charts-yellow',
	'--vscode-charts-red',
];

export const generateColors = (count: number): string[] => {
	return Array.from({ length: count }, (_, i) => {
		const token = CHART_COLOR_TOKENS[i % CHART_COLOR_TOKENS.length];
		const cycle = Math.floor(i / CHART_COLOR_TOKENS.length);
		if (cycle === 0) {
			return `var(${token})`;
		}
		// Extend the palette past the six theme hues by blending toward the
		// foreground/background, keeping every colour inside the theme.
		const mixTarget = cycle % 2 === 1 ? 'var(--vscode-editor-foreground)' : 'var(--vscode-editor-background)';
		const weight = Math.max(45, 100 - 22 * Math.ceil(cycle / 2));
		return `color-mix(in srgb, var(${token}) ${weight}%, ${mixTarget})`;
	});
};

/** Clamp a bar width to a sane, non-overflowing percentage. */
export const barWidth = (value: number, max: number): number => {
	if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
		return 0;
	}
	return Math.min(100, Math.max(1, Math.round((value / max) * 100)));
};

export const formatNumber = (value: number): string => {
	return Number.isFinite(value) ? value.toLocaleString() : '0';
};

/** Compact a repo-relative path so long directory chains don't dominate a row. */
export const shortenPath = (filePath: string, maxLength = 48): string => {
	if (filePath.length <= maxLength) {
		return filePath;
	}
	const segments = filePath.split('/');
	const name = segments.pop() ?? filePath;
	let prefix = '';
	while (segments.length > 0 && `${prefix}${segments[segments.length - 1]}/`.length + name.length + 2 < maxLength) {
		prefix = `${segments.pop()}/${prefix}`;
	}
	return prefix ? `…/${prefix}${name}` : `…/${name}`;
};

export const getLanguageFullName = (languageId: string): string => {
	const names: Record<string, string> = {
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
		ignore: 'Ignore File',
	};

	return names[languageId.toLowerCase()] || formatLanguageLabel(languageId);
};

export const getLanguageDescription = (languageId: string): string => {
	const descriptions: Record<string, string> = {
		typescript: 'Typed superset of JavaScript - excellent for large projects & enterprise apps',
		typescriptreact: 'TypeScript with React JSX - modern web app development',
		javascript: 'Dynamic scripting language - web development & Node.js backend',
		javascriptreact: 'JavaScript with React JSX - frontend web application development',
		python: 'High-level interpreted language - AI/ML, data science, automation & scripting',
		java: 'Object-oriented compiled language - enterprise applications & Android development',
		csharp: 'Modern language by Microsoft - .NET framework, games & enterprise software',
		cpp: 'High-performance compiled language - systems programming & performance-critical code',
		c: 'Low-level procedural language - operating systems, embedded systems & compilers',
		rust: 'Memory-safe compiled language - systems programming with guaranteed safety',
		go: 'Efficient compiled language - cloud infrastructure, microservices & concurrent systems',
		kotlin: 'Modern JVM language - Android development with Java interoperability',
		swift: 'Apple\'s modern language - iOS, macOS, watchOS & tvOS development',
		objective_c: 'Object-oriented extension of C - legacy iOS/macOS applications',
		php: 'Server-side scripting language - web development & CMS systems',
		ruby: 'Dynamic language - web development (Rails), automation & scripting',
		perl: 'Text processing & automation language - legacy systems & scripting',
		scala: 'Functional + object-oriented on JVM - data processing & big data',
		r: 'Statistical & data analysis language - data science & research',
		sql: 'Database query language - data retrieval, manipulation & database management',
		html: 'Markup language - web page structure & semantic content',
		css: 'Styling language - web page appearance, layout & responsive design',
		scss: 'CSS preprocessor - variables, mixins, nesting & advanced styling',
		less: 'CSS preprocessor - dynamic styling with variables & functions',
		sass: 'CSS preprocessor - powerful styling with inheritance & modular features',
		xml: 'Markup language - structured data, configuration files & web services',
		json: 'Data interchange format - APIs, configuration & data storage',
		jsonc: 'JSON with Comments - configuration files with annotations',
		yaml: 'Human-friendly data format - configuration, CI/CD pipelines & data files',
		yml: 'YAML format - configuration & data files (YAML extension)',
		toml: 'Configuration language - clear & minimal syntax for config files',
		markdown: 'Lightweight markup - documentation, README files & content writing',
		md: 'Markdown format - documentation & content (md extension)',
		plaintext: 'Unformatted text - various data files, logs & configuration',
		ignore: 'Git ignore patterns - specifies files to ignore in version control',
	};

	return descriptions[languageId.toLowerCase()] || 'Code file';
};

export const formatLanguageLabel = (languageId: string): string => {
	if (!languageId) {
		return 'Unknown';
	}
	return languageId
		.split(/[-_]/g)
		.map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
		.join(' ');
};

export const escapeHtml = (value: string): string => {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
};
