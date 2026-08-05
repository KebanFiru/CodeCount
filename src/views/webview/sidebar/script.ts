export function getSidebarScript(): string {
	return `
	(function () {
		var vscode = acquireVsCodeApi();

		var state = vscode.getState() || {
			activeTab: 'languages',
			expandedKeys: [],
			filterText: ''
		};

		function saveState() {
			vscode.setState(state);
		}

		function post(message) {
			vscode.postMessage(message);
		}

		var root = document.getElementById('root');
		var filterInput = document.getElementById('filter-input');
		var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab'));
		var panels = {
			languages: document.getElementById('panel-languages'),
			contributors: document.getElementById('panel-contributors')
		};

		function setActiveTab(tab, opts) {
			state.activeTab = tab;
			tabButtons.forEach(function (btn) {
				var isActive = btn.dataset.tab === tab;
				btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
				btn.tabIndex = isActive ? 0 : -1;
			});
			Object.keys(panels).forEach(function (key) {
				panels[key].classList.toggle('active', key === tab);
			});
			if (!opts || !opts.skipPost) {
				post({ type: 'setTab', tab: tab });
			}
			saveState();
		}

		tabButtons.forEach(function (btn) {
			btn.addEventListener('click', function () {
				setActiveTab(btn.dataset.tab);
			});
			btn.addEventListener('keydown', function (ev) {
				if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') { return; }
				var idx = tabButtons.indexOf(btn);
				var nextIdx = ev.key === 'ArrowRight'
					? (idx + 1) % tabButtons.length
					: (idx - 1 + tabButtons.length) % tabButtons.length;
				tabButtons[nextIdx].focus();
				setActiveTab(tabButtons[nextIdx].dataset.tab);
			});
		});

		// -- Filter --

		function applyFilter() {
			var text = state.filterText.toLowerCase();
			document.querySelectorAll('.acc-item[data-row-key]').forEach(function (item) {
				var header = item.querySelector(':scope > .acc-header');
				if (!header) { return; }
				var haystack = (header.dataset.filterText || header.textContent || '').toLowerCase();
				var match = !text || haystack.indexOf(text) !== -1;
				item.classList.toggle('is-filtered-out', !match);
			});
		}

		if (filterInput) {
			filterInput.value = state.filterText;
			filterInput.addEventListener('input', function () {
				state.filterText = filterInput.value;
				saveState();
				applyFilter();
			});
		}

		// -- Accordion expand/collapse (event delegation) --

		function findChildrenContainer(key) {
			return document.querySelector('.acc-children[data-children-for="' + cssEscape(key) + '"]');
		}

		function cssEscape(value) {
			if (window.CSS && CSS.escape) { return CSS.escape(value); }
			var backslash = String.fromCharCode(92);
			var out = '';
			for (var i = 0; i < value.length; i++) {
				var ch = value.charAt(i);
				if (ch === '"' || ch === backslash) {
					out += backslash;
				}
				out += ch;
			}
			return out;
		}

		function setLoading(key) {
			var container = findChildrenContainer(key);
			if (container) {
				container.innerHTML = '<div class="loading-row">Loading…</div>';
			}
		}

		function setError(key, message) {
			var container = findChildrenContainer(key);
			if (container) {
				container.innerHTML = '<div class="error-row"></div>';
				container.querySelector('.error-row').textContent = message || 'Something went wrong.';
			}
		}

		function setChildren(key, html) {
			var container = findChildrenContainer(key);
			if (container) {
				container.innerHTML = html;
			}
		}

		document.addEventListener('click', function (ev) {
			var target = ev.target.closest('[data-action]');
			if (!target) { return; }
			var action = target.dataset.action;

			if (action === 'expand') {
				var key = target.dataset.key;
				var expanded = target.getAttribute('aria-expanded') === 'true';
				var container = findChildrenContainer(key);
				if (expanded) {
					target.setAttribute('aria-expanded', 'false');
					if (container) { container.hidden = true; }
					state.expandedKeys = state.expandedKeys.filter(function (k) { return k !== key; });
					saveState();
					return;
				}

				target.setAttribute('aria-expanded', 'true');
				if (container) { container.hidden = false; }
				if (state.expandedKeys.indexOf(key) === -1) {
					state.expandedKeys.push(key);
				}
				saveState();

				post({
					type: 'expand',
					section: target.dataset.section,
					key: key,
					languageId: target.dataset.lang,
					author: target.dataset.author
				});
				return;
			}

			if (action === 'openFileHistory') {
				post({
					type: 'openFileHistory',
					filePath: target.dataset.filePath,
					absolutePath: target.dataset.absolutePath
				});
				return;
			}

			if (action === 'openContributorFile') {
				post({
					type: 'openContributorFile',
					author: target.dataset.author,
					filePath: target.dataset.filePath
				});
				return;
			}

			if (action === 'openDashboard') {
				post({ type: 'openDashboard' });
				return;
			}

			if (action === 'initRepo') {
				post({ type: 'initRepo' });
				return;
			}
		});

		document.addEventListener('keydown', function (ev) {
			if (ev.key !== 'Enter' && ev.key !== ' ') { return; }
			var target = ev.target;
			if (target && target.classList && target.classList.contains('acc-header')) {
				// Buttons already activate on Enter/Space natively; nothing extra needed,
				// this handler exists only to document keyboard reachability.
			}
		});

		// Re-request children for whatever was expanded before this render (survives
		// hidden webviews and full data refreshes alike).
		function reExpandPersisted() {
			state.expandedKeys.forEach(function (key) {
				var header = document.querySelector('.acc-header[data-key="' + cssEscape(key) + '"]');
				if (!header) { return; }
				header.setAttribute('aria-expanded', 'true');
				var container = findChildrenContainer(key);
				if (container) { container.hidden = false; }
				post({
					type: 'expand',
					section: header.dataset.section,
					key: key,
					languageId: header.dataset.lang,
					author: header.dataset.author
				});
			});
		}

		// -- Narrow width fallback (in case container queries aren't supported) --

		function updateNarrow() {
			root.classList.toggle('is-narrow', root.clientWidth < 220);
		}
		if (window.ResizeObserver) {
			new ResizeObserver(updateNarrow).observe(root);
		} else {
			window.addEventListener('resize', updateNarrow);
		}
		updateNarrow();

		// -- Messages from the extension --

		window.addEventListener('message', function (event) {
			var msg = event.data;
			if (!msg || !msg.type) { return; }

			if (msg.type === 'data') {
				var p = msg.payload;
				document.getElementById('branch-summary').innerHTML = p.branchSummaryHtml;
				document.getElementById('no-commits-banner').innerHTML = p.noCommitsBannerHtml;
				document.getElementById('stat-tiles').innerHTML = p.statTilesHtml;
				document.getElementById('empty-state').innerHTML = p.emptyStateHtml || '';
				panels.languages.innerHTML = p.languagesHtml;
				panels.contributors.innerHTML = p.contributorsHtml;
				document.getElementById('tab-view').style.display = p.showTabs === false ? 'none' : '';
				setActiveTab(state.activeTab, { skipPost: true });
				applyFilter();
				reExpandPersisted();
				return;
			}

			if (msg.type === 'children') {
				setChildren(msg.key, msg.html);
				return;
			}

			if (msg.type === 'loading') {
				setLoading(msg.key);
				return;
			}

			if (msg.type === 'error') {
				setError(msg.key, msg.message);
				return;
			}
		});

		post({ type: 'ready' });
	})();
	`;
}
