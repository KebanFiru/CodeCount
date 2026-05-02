export const generateColors = (count: number): string[] => {
	const hues = [
		'hsl(200, 70%, 50%)',
		'hsl(140, 70%, 50%)',
		'hsl(40, 70%, 50%)',
		'hsl(10, 70%, 50%)',
		'hsl(270, 70%, 50%)',
		'hsl(120, 70%, 50%)',
		'hsl(320, 70%, 50%)',
		'hsl(60, 70%, 50%)',
		'hsl(180, 70%, 50%)',
		'hsl(330, 70%, 50%)',
	];
	return Array.from({ length: count }, (_, i) => hues[i % hues.length]);
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
