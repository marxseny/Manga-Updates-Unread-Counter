import { createElement, setElementText, query, removeElement, appendChild } from './domUtils.js';
import { CLASSES, SELECTORS } from './constants.js';

export function renderToolbar(parentElement, callbacks, initialFilters = {}) {
  if (query('#muuc-toolbar')) return document.getElementById("muuc-sort-button");

  const toolbar = createElement('div', {
    id: 'muuc-toolbar',
    className: 'muuc-toolbar'
  });

  const sortButton = createStyledSortButton();
  sortButton.id = "muuc-sort-button";
  sortButton.addEventListener("click", callbacks.onSortClick);
  toolbar.appendChild(sortButton);

  const statsButton = createElement('button', {
    id: 'muuc-stats-btn',
    className: `${CLASSES.sortButton} muuc-sort-btn muuc-stats-btn`,
    textContent: '📊 My Stats'
  });
  statsButton.addEventListener("click", callbacks.onStatsClick);
  toolbar.appendChild(statsButton);

  const filterButton = createElement('button', {
    id: 'muuc-adv-filter-btn',
    className: `${CLASSES.sortButton} muuc-sort-btn muuc-filter-btn`,
    textContent: '🌪️ Filters'
  });
  filterButton.addEventListener("click", callbacks.onAdvFilterClick);
  toolbar.appendChild(filterButton);

  toolbar.appendChild(createStatusControls(callbacks.onStatusChange));

  // Add Progress Bar to toolbar
  toolbar.appendChild(createProgressBar());

  parentElement.appendChild(toolbar);
  return sortButton;
}

// --- PROGRESS BAR FUNCTIONS ---
function createProgressBar() {
  const container = createElement('div', {
    id: 'muuc-progress',
    className: 'muuc-progress-container'
  });

  // Loading label
  const label = createElement('span', {
    textContent: 'Loading: ',
    style: 'margin-right: 5px;'
  });

  // Bar elements
  const barBg = createElement('div', {
    className: 'muuc-progress-bar-bg'
  });
  const barFill = createElement('div', {
    id: 'muuc-prog-fill',
    className: 'muuc-progress-bar-fill'
  });
  barBg.appendChild(barFill);

  // ETA text
  const etaText = createElement('span', {
    id: 'muuc-prog-eta',
    className: 'muuc-progress-text',
    textContent: 'ETA: --'
  });

  container.append(label, barBg, etaText);
  return container;
}

export function updateProgressBar(percent, etaString) {
  const container = document.getElementById('muuc-progress');
  const fill = document.getElementById('muuc-prog-fill');
  const eta = document.getElementById('muuc-prog-eta');

  if (container && fill && eta) {
    if (!container.classList.contains('muuc-progress-visible')) {
      container.classList.add('muuc-progress-visible');
    }
    fill.style.width = `${percent}%`;
    eta.textContent = `ETA: ${etaString}`;
  }
}

export function hideProgressBar() {
  const container = document.getElementById('muuc-progress');
  if (container) {
    container.classList.remove('muuc-progress-visible');
    // Reset after animation
    setTimeout(() => {
      const fill = document.getElementById('muuc-prog-fill');
      if (fill) fill.style.width = '0%';
    }, 300);
  }
}

export function injectDataControls(callbacks) {
  const candidates = Array.from(document.querySelectorAll(SELECTORS.totalTextContainer));
  const container = candidates.find(el => el.textContent.includes("Total:"));
  if (!container || container.querySelector('#muuc-export-btn')) return;

  const sep1 = document.createElement('span');
  sep1.textContent = ' | ';
  container.appendChild(sep1);
  const exportBtn = createElement('a', {
    id: 'muuc-export-btn',
    textContent: 'Backup Data',
    className: 'muuc-data-link muuc-link-backup'
  });
  exportBtn.addEventListener('click', callbacks.onExportClick);
  container.appendChild(exportBtn);

  const sep2 = document.createElement('span');
  sep2.textContent = ' | ';
  container.appendChild(sep2);
  const importBtn = createElement('a', {
    id: 'muuc-import-trigger',
    textContent: 'Restore Data',
    className: 'muuc-data-link muuc-link-restore'
  });
  const hiddenInput = createElement('input', {
    type: 'file',
    id: 'muuc-import-input',
    accept: '.json',
    style: 'display:none;'
  });
  hiddenInput.addEventListener('change', callbacks.onImportFile);
  importBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hiddenInput.click();
  });
  container.appendChild(importBtn);
  container.appendChild(hiddenInput);

  const sep3 = document.createElement('span');
  sep3.textContent = ' | ';
  container.appendChild(sep3);
  const deleteBtn = createElement('a', {
    id: 'muuc-delete-btn',
    textContent: 'Delete Data',
    className: 'muuc-data-link muuc-link-delete'
  });
  deleteBtn.addEventListener('click', callbacks.onDeleteClick);
  container.appendChild(deleteBtn);
}

function createStatusControls(onChange) {
  const container = createElement('span', {
    className: 'muuc-controls-container'
  });
  const label = createElement('label', {
    textContent: ' Sort by Status ',
    className: 'muuc-checkbox-label'
  });
  const checkbox = createElement('input', {
    type: 'checkbox',
    id: 'muuc-status-checkbox',
    className: 'muuc-checkbox-input'
  });
  label.appendChild(checkbox);
  const select = createElement('select', {
    id: 'muuc-status-select',
    className: 'muuc-status-select muuc-hidden'
  });
  [{
    val: 'ongoing',
    text: 'Ongoing'
  }, {
    val: 'completed',
    text: 'Completed'
  }, {
    val: 'hiatus',
    text: 'Hiatus'
  }, {
    val: 'cancelled',
    text: 'Cancelled'
  }].forEach(opt => select.appendChild(createElement('option', {
    value: opt.val,
    textContent: opt.text
  })));
  checkbox.addEventListener('change', (e) => {
    e.target.checked ? select.classList.remove('muuc-hidden') : select.classList.add('muuc-hidden');
    onChange();
  });
  select.addEventListener('change', onChange);
  container.append(label, select);
  return container;
}

export function getStatusControlState() {
  const c = query(SELECTORS.statusCheckbox),
    s = query(SELECTORS.statusSelect);
  if (!c || !s) return {
    isActive: false,
    status: 'ongoing'
  };
  return {
    isActive: c.checked,
    status: s.value
  };
}

export function createStyledSortButton() {
  const b = createElement('button');
  b.className = `${CLASSES.sortButton} muuc-sort-btn`;
  b.textContent = 'Sort';
  return b;
}

export function updateSortButtonLabel(b, t, o, s) {
  if (!b) return;
  let txt = "";
  const a = o === "asc" ? "↑" : "↓";
  if (s) {
    const c = t.charAt(0).toUpperCase() + t.slice(1);
    txt = o === "asc" ? `${c} first ${a}` : `${c} last ${a}`;
  } else {
    switch (t) {
      case "alpha":
        txt = o === "asc" ? "↓ A to Z" : "↑ Z to A";
        break;
      case "unread":
      case "release": // Garante que a opção nativa "Latest Release" use o rótulo de Unread
        txt = o === "asc" ? "↓ Least to Most unread" : "↑ Most to Least unread";
        break;
      case "rating":
        txt = o === "desc" ? "↓ Rating High to Low" : "↑ Rating Low to High";
        break;
      case "userRating":
        txt = o === "desc" ? "↓ Average High to Low" : "↑ Average Low to High";
        break;
      default:
        txt = `Sort (${t})`;
    }
  }
  setElementText(b, txt);
}

export function removeExistingSortButtonDOM() {
  const t = document.getElementById("muuc-toolbar");
  if (t) removeElement(t);
  const b = document.getElementById("muuc-sort-button");
  if (b) removeElement(b);
  const c = query(`.${CLASSES.sortButton}`);
  if (c) removeElement(c);
}

export function addOrUpdateUnreadSpan(el, diff) {
  if (!el) return;
  let txt = "";
  if (diff > 0) txt = ` Unread: ${Math.ceil(diff)}`;
  let span = query(`.${CLASSES.unreadText}`, el);
  if (!span && txt) {
    span = createElement('span', {
      className: `${CLASSES.unreadText} muuc-unread`
    });
    appendChild(el, span);
  }
  if (span) {
    txt ? setElementText(span, txt) : removeElement(span);
  }
}

export function removeUnreadSpan(el) {
  if (!el) return;
  const s = query(`.${CLASSES.unreadText}`, el);
  if (s) removeElement(s);
}

export function displayGlobalStats(s) {
  const t = query(SELECTORS.statsDisplayTarget);
  if (!t) return;
  t.innerHTML = '';
  t.textContent = '';
  t.classList.add('muuc-stats-container');
  const l1 = document.createElement('div');
  const dT = Math.floor(s.totalUnreadChapters);
  l1.innerHTML = `<span class="muuc-red">Total Unread Chapters: ${dT}</span> in <span class="muuc-red">${s.seriesWithUnread}</span> series`;
  const l2 = document.createElement('div');
  l2.innerHTML = `<span class="muuc-green">${s.seriesUpToDate} series are up to date</span>`;
  const l3 = document.createElement('div');
  l3.textContent = `Total Series: ${s.seriesWithUnread + s.seriesUpToDate}`;
  t.append(l1, l2, l3);
}

export function renderFractionalUI(row, api, user, cb) {
  if (!row) return;
  if (api && /[\.a-z]/i.test(api)) {
    let d = api.replace(/\s*[\(\[]end[\)\]]/gi, "").trim();
    if (d.includes('-')) d = d.split('-').pop().trim();
    if (/[\.a-z]/i.test(d)) {
      const link = query(SELECTORS.highestChapterLink, row) || query('a[href*="/series/"]', query('.text', row));
      let bolt = query('.muuc-bolt-api', row);
      if (!bolt && link) {
        bolt = createElement('span', {
          className: 'muuc-bolt-api',
          title: "API Subdiv"
        });
        link.after(bolt);
      }
      if (bolt) bolt.textContent = `⚡ ${d}`;
    }
  }
  const apiHasFraction = api && /[\.a-z]/i.test(api);
  if (apiHasFraction || user) {
    // Busca dinâmica para a célula de capítulo
    const cell = row.querySelector('div[class*="lcol4"]');
    if (cell) {
      cell.classList.remove('text-truncate');
      cell.style.setProperty('overflow', 'visible', 'important');
      cell.style.setProperty('white-space', 'normal', 'important');
    }
    // Busca dinâmica para o container interno
    const cont = query('div[class*="nobottom"] span', row) || query('div.d-inline', row)?.parentNode;
    if (cont) {
      let usr = query('.muuc-bolt-user', cont);
      if (!usr) {
        usr = createElement('span', {
          className: 'muuc-bolt-user',
          title: 'Click to set custom fractional chapter'
        });
        usr.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const v = prompt("Set value:", user || "");
          if (v !== null) cb(v.trim());
        });
        cont.appendChild(usr);
      }
      if (user) {
        usr.textContent = `⚡ ${user}`;
        usr.classList.add('muuc-filled');
      } else {
        usr.textContent = `⚡`;
        usr.classList.remove('muuc-filled');
      }
    }
  }
}

export function applyVisualMask(row, mask, user, status) {
  if (!row) return;
  if (mask && query(SELECTORS.highestChapterLink, row)) {
    const l = query(SELECTORS.highestChapterLink, row);
    l.textContent = `(c.${mask})`;
    l.classList.add('muuc-api-value');
  }
  if (user && query(SELECTORS.currentChapterB, row)) {
    const c = query(SELECTORS.currentChapterB, row);
    c.textContent = `c.${user}`;
    c.classList.add('muuc-local-value');
  }
  if (status && status !== "ongoing") {
    const t = query('a[href*="/series/"]', query('.text', row));
    if (t && !query('.muuc-tag', t.parentNode)) {
      let txt = "",
        cls = "";
      if (status === "cancelled") {
        txt = "CANCELLED";
        cls = "muuc-tag-cancelled";
      } else if (status === "hiatus") {
        txt = "HIATUS";
        cls = "muuc-tag-hiatus";
      } else if (status === "completed") {
        txt = "END";
        cls = "muuc-tag-completed";
      }
      if (txt) t.after(createElement('span', {
        className: `muuc-tag ${cls}`,
        textContent: txt
      }));
    }
  }
}

export function renderStatsModal(data, onCategoryToggle, onGenreToggle, hideIgnoredState, onHideIgnoredToggle, onRestoreAll) {
  const existing = document.getElementById('muuc-stats-modal');
  if (existing) removeElement(existing);
  const overlay = createElement('div', {
    id: 'muuc-stats-modal',
    className: 'muuc-modal-overlay'
  });
  const content = createElement('div', {
    className: 'muuc-modal-content'
  });
  const header = createElement('div', {
    className: 'muuc-modal-header'
  });
  header.innerHTML = `<h3 class="muuc-modal-title">Reading Stats</h3><span id="muuc-modal-close" class="muuc-modal-close">&times;</span>`;
  content.appendChild(header);

  const body = createElement('div', {
    className: 'muuc-modal-body'
  });

  body.appendChild(createChartSection("Status Distribution", data.statusCounts, "bar-status", data.totalSeries));
  body.appendChild(createChartSection("Top Genres <small>(Click to ignore)</small>", data.topGenres, "bar-genre", data.totalSeries, onGenreToggle, 10));

  const catSectionHeader = createElement('div', {
    className: 'muuc-stat-title',
    style: 'margin-top: 20px;'
  });
  catSectionHeader.innerHTML = `Category Clusters <small>(Click tag to ignore)</small>`;
  body.appendChild(catSectionHeader);

  const groups = [{
    key: 'mostCommon',
    label: 'Most Common',
    cls: 'muuc-text-mostcommon'
  }, {
    key: 'common',
    label: 'Common',
    cls: 'muuc-text-common'
  }, {
    key: 'uncommon',
    label: 'Uncommon',
    cls: 'muuc-text-uncommon'
  }, {
    key: 'rare',
    label: 'Rare',
    cls: 'muuc-text-rare'
  }, {
    key: 'unique',
    label: 'Unique (1x)',
    cls: 'muuc-text-unique'
  }];
  groups.forEach(g => {
    const items = data.groupedCategories[g.key];
    if (items && items.length > 0) {
      const accordion = createAccordionSection(g.label, items, onCategoryToggle, g.cls);
      body.appendChild(accordion);
    }
  });

  const hasIgnoredCats = data.ignoredCategories && data.ignoredCategories.length > 0;
  const hasIgnoredGenres = data.ignoredGenres && data.ignoredGenres.length > 0;

  if (hasIgnoredGenres || hasIgnoredCats) {
    const ignoredSection = createElement('div', {
      className: 'muuc-ignored-section'
    });

    const ignoredHeader = createElement('div', {
      style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;'
    });

    const titleDiv = createElement('div', {
      className: 'muuc-ignored-title',
      style: 'margin-bottom: 0;'
    });
    titleDiv.innerHTML = `Ignored Items <small>(Click to restore)</small>`;

    const controlsDiv = createElement('div', {
      style: 'display: flex; align-items: center; gap: 10px;'
    });

    const restoreBtn = createElement('button', {
      textContent: 'Restore All',
      className: 'muuc-sort-btn',
      style: 'padding: 2px 8px; font-size: 11px; height: auto;'
    });
    restoreBtn.onclick = onRestoreAll;

    const label = createElement('label', {
      style: 'font-size: 11px; cursor: pointer; display: flex; align-items: center; color: #555;'
    });
    const chk = createElement('input', {
      type: 'checkbox',
      style: 'margin: 0 5px 0 0;'
    });
    chk.checked = hideIgnoredState;
    chk.addEventListener('change', (e) => onHideIgnoredToggle(e.target.checked));
    label.append(chk, document.createTextNode("Hide"));

    controlsDiv.append(restoreBtn, label);
    ignoredHeader.append(titleDiv, controlsDiv);
    ignoredSection.appendChild(ignoredHeader);

    const itemsContainer = createElement('div', {});
    if (hideIgnoredState) {
      itemsContainer.style.display = 'none';
    }

    if (hasIgnoredGenres) {
      const subTitle = createElement('div', {
        textContent: 'Genres:',
        style: 'font-size: 11px; font-weight: bold; color: #666; margin: 5px 0 3px 0;'
      });
      itemsContainer.appendChild(subTitle);
      const gCloud = createElement('div', {
        className: 'muuc-tag-cloud'
      });
      data.ignoredGenres.forEach(name => {
        const tag = createElement('span', {
          className: 'muuc-stat-tag ignored',
          title: `Restore "${name}"`,
          textContent: name
        });
        tag.style.borderColor = "#2b78ff";
        tag.addEventListener('click', () => onGenreToggle(name));
        gCloud.appendChild(tag);
      });
      itemsContainer.appendChild(gCloud);
    }

    if (hasIgnoredCats) {
      const subTitle = createElement('div', {
        textContent: 'Categories:',
        style: `font-size: 11px; font-weight: bold; color: #666; margin: ${hasIgnoredGenres ? '10px' : '5px'} 0 3px 0;`
      });
      itemsContainer.appendChild(subTitle);
      const cCloud = createElement('div', {
        className: 'muuc-tag-cloud'
      });
      data.ignoredCategories.forEach(name => {
        const tag = createElement('span', {
          className: 'muuc-stat-tag ignored',
          title: `Restore "${name}"`,
          textContent: name
        });
        tag.addEventListener('click', () => onCategoryToggle(name));
        cCloud.appendChild(tag);
      });
      itemsContainer.appendChild(cCloud);
    }

    ignoredSection.appendChild(itemsContainer);
    body.appendChild(ignoredSection);
  }

  content.appendChild(body);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  document.getElementById('muuc-modal-close').onclick = () => removeElement(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) removeElement(overlay);
  };
}

function createAccordionSection(title, items, onToggle, titleClass) {
  const wrapper = createElement('div', {
    className: 'muuc-accordion'
  });
  const header = createElement('div', {
    className: 'muuc-accordion-header collapsed'
  });
  const titleSpan = createElement('span', {
    className: titleClass,
    textContent: title + " "
  });
  const countSpan = createElement('span', {
    className: 'muuc-accordion-count',
    textContent: `(${items.length})`
  });
  titleSpan.appendChild(countSpan);
  header.appendChild(titleSpan);
  const body = createElement('div', {
    className: 'muuc-accordion-body hidden'
  });
  const cloud = createElement('div', {
    className: 'muuc-tag-cloud'
  });
  items.forEach(cat => {
    const tag = createElement('span', {
      className: 'muuc-stat-tag',
      title: `Ignore "${cat.label}"`
    });
    tag.innerHTML = `${cat.label} <strong>${cat.count}</strong>`;
    tag.addEventListener('click', () => onToggle(cat.label));
    cloud.appendChild(tag);
  });
  body.appendChild(cloud);
  header.addEventListener('click', () => {
    if (body.classList.contains('hidden')) {
      body.classList.remove('hidden');
      header.classList.remove('collapsed');
    } else {
      body.classList.add('hidden');
      header.classList.add('collapsed');
    }
  });
  wrapper.appendChild(header);
  wrapper.appendChild(body);
  return wrapper;
}

function createChartSection(titleHTML, data, colorPrefix, totalRef, onToggle, initialLimit = 0) {
  const section = createElement('div', {
    className: 'muuc-stat-section'
  });
  const titleDiv = createElement('div', {
    className: 'muuc-stat-title'
  });
  titleDiv.innerHTML = titleHTML;
  section.appendChild(titleDiv);

  if (!data || !data.length) {
    const noData = createElement('div', {
      textContent: "No data available"
    });
    section.appendChild(noData);
    return section;
  }

  const max = Math.max(...data.map(d => d.count));
  const limit = (initialLimit > 0) ? initialLimit : data.length;

  const visibleData = data.slice(0, limit);
  const hiddenData = data.slice(limit);

  const createRow = (item) => {
    const row = createElement('div', {
      className: 'muuc-chart-row'
    });
    if (onToggle) {
      row.classList.add('clickable');
      row.title = `Click to ignore "${item.label}"`;
      row.addEventListener('click', () => onToggle(item.label));
    }
    const pctVal = totalRef > 0 ? ((item.count / totalRef) * 100).toFixed(1) : "0.0";
    const label = createElement('div', {
      className: 'muuc-chart-label'
    });
    label.innerHTML = `${item.label} <small>(${pctVal}%)</small>`;
    const container = createElement('div', {
      className: 'muuc-chart-bar-container'
    });
    const pctWidth = (item.count / max) * 100;
    let cls = colorPrefix === "bar-status" ? `bar-status-${item.label.toLowerCase()}` : colorPrefix;
    const bar = createElement('div', {
      className: `muuc-chart-bar ${cls}`
    });
    bar.style.width = `${pctWidth}%`;
    const value = createElement('div', {
      className: 'muuc-chart-value',
      textContent: item.count
    });
    container.appendChild(bar);
    container.appendChild(value);
    row.appendChild(label);
    row.appendChild(container);
    return row;
  };

  visibleData.forEach(item => section.appendChild(createRow(item)));

  if (hiddenData.length > 0) {
    const hiddenContainer = createElement('div', {});
    hiddenContainer.style.display = 'none';
    hiddenData.forEach(item => hiddenContainer.appendChild(createRow(item)));
    section.appendChild(hiddenContainer);

    const btn = createElement('button', {
      textContent: `Show All (${hiddenData.length} more)`,
      className: 'muuc-sort-btn',
      style: 'width: 100%; margin-top: 8px; text-align: center;'
    });

    btn.onclick = () => {
      if (hiddenContainer.style.display === 'none') {
        hiddenContainer.style.display = 'block';
        btn.textContent = 'Show Less';
      } else {
        hiddenContainer.style.display = 'none';
        btn.textContent = `Show All (${hiddenData.length} more)`;
      }
    };
    section.appendChild(btn);
  }

  return section;
}

// --- Search Helper ---
function createHeaderSearch(onSearch) {
  const input = createElement('input', {
    type: 'text',
    placeholder: 'Search...',
    style: 'float: right; font-size: 11px; padding: 3px 6px; border-radius: 4px; border: 1px solid #ccc; font-weight: normal; margin-top: -3px; width: 120px;'
  });
  input.addEventListener('input', (e) => onSearch(e.target.value.toLowerCase()));
  input.addEventListener('click', (e) => e.stopPropagation()); // Prevents accordion trigger
  return input;
}

export function renderAdvancedFilterModal(data, currentFilters, basicFilters, onApply) {
  const existing = document.getElementById('muuc-adv-filter-modal');
  if (existing) removeElement(existing);

  const overlay = createElement('div', {
    id: 'muuc-adv-filter-modal',
    className: 'muuc-modal-overlay'
  });
  const content = createElement('div', {
    className: 'muuc-modal-content'
  });

  // Header
  const header = createElement('div', {
    className: 'muuc-modal-header'
  });
  header.innerHTML = `<h3 class="muuc-modal-title">Filters</h3><span id="muuc-af-close" class="muuc-modal-close">&times;</span>`;
  content.appendChild(header);

  // Body
  const body = createElement('div', {
    className: 'muuc-modal-body'
  });

  // Instructions
  const intro = createElement('div', {
    style: 'margin-bottom:25px; font-size:13px; color:#555; text-align:center; padding:10px; background:#f9f9f9; border-radius:4px;'
  });
  intro.innerHTML = `Click tag to <b class="muuc-text-include">Include</b>. Click again to <b class="muuc-text-exclude">Exclude</b>. Click again to <b>Reset</b>.`;
  body.appendChild(intro);

  // 1. FILTER BY STATUS (Tags)
  const statusHeader = createElement('div', {
    className: 'muuc-stat-title'
  });
  statusHeader.textContent = "Filter By Status";
  body.appendChild(statusHeader);

  const statusContainer = createElement('div', {
    className: 'muuc-tag-cloud',
    style: 'margin-bottom: 45px; align-items: center;'
  });

  const statusOptions = [{
    label: 'Cancelled',
    value: 'STATUS:cancelled'
  }, {
    label: 'Hiatus',
    value: 'STATUS:hiatus'
  }, {
    label: 'Up to Date',
    value: 'STATUS:uptodate'
  }, {
    label: 'Completed',
    value: 'STATUS:completed'
  }, {
    label: '⚡ Split Chapters',
    value: 'STATUS:splitchapters'
  }];

  // Local State
  const tempFilters = {
    included: new Set(currentFilters.included),
    excluded: new Set(currentFilters.excluded)
  };

  let keepStatsChecked = basicFilters.keepStats !== undefined ? basicFilters.keepStats : true;

  // Helper Toggle
  const toggleTag = (tagEl, value) => {
    if (tempFilters.included.has(value)) {
      tempFilters.included.delete(value);
      tempFilters.excluded.add(value);
      tagEl.className = 'muuc-stat-tag muuc-tag-state-exclude';
    } else if (tempFilters.excluded.has(value)) {
      tempFilters.excluded.delete(value);
      tagEl.className = 'muuc-stat-tag';
    } else {
      tempFilters.included.add(value);
      tagEl.className = 'muuc-stat-tag muuc-tag-state-include';
    }
  };

  statusOptions.forEach(opt => {
    const tag = createElement('span', {
      className: 'muuc-stat-tag',
      textContent: opt.label
    });
    if (tempFilters.included.has(opt.value)) tag.className = 'muuc-stat-tag muuc-tag-state-include';
    if (tempFilters.excluded.has(opt.value)) tag.className = 'muuc-stat-tag muuc-tag-state-exclude';
    tag.addEventListener('click', () => toggleTag(tag, opt.value));
    statusContainer.appendChild(tag);
  });

  const sLbl = createElement('label', {
    textContent: ' Keep Stats Unfiltered',
    style: 'font-size:12px; cursor:pointer; margin-left: 12px; display: inline-flex; align-items: center; user-select: none;'
  });
  const sChk = createElement('input', {
    type: 'checkbox',
    className: 'muuc-checkbox-input',
    style: 'margin: 0 5px 0 0;'
  });
  sChk.checked = keepStatsChecked;
  sChk.addEventListener('change', (e) => keepStatsChecked = e.target.checked);
  sLbl.prepend(sChk);
  statusContainer.appendChild(sLbl);

  body.appendChild(statusContainer);

  // 2. GENRES (WITH SEARCH)
  if (data.topGenres && data.topGenres.length) {
    const genreHeader = createElement('div', {
      className: 'muuc-stat-title'
    });
    genreHeader.textContent = "Filter by Genres ";

    // --- SEARCH INPUT GENRES ---
    const searchInput = createHeaderSearch((term) => {
      const container = body.querySelector('#muuc-genre-cloud');
      if (!container) return;
      const tags = container.querySelectorAll('.muuc-stat-tag');
      tags.forEach(t => {
        const visible = t.textContent.toLowerCase().includes(term);
        t.style.display = visible ? 'inline-block' : 'none';
      });
    });
    genreHeader.appendChild(searchInput);
    body.appendChild(genreHeader);

    const genreCloud = createElement('div', {
      id: 'muuc-genre-cloud',
      className: 'muuc-tag-cloud',
      style: 'margin-bottom: 25px;'
    });
    data.topGenres.forEach(g => {
      const tag = createElement('span', {
        className: 'muuc-stat-tag',
        textContent: g.label
      });
      if (tempFilters.included.has(g.label)) tag.className = 'muuc-stat-tag muuc-tag-state-include';
      if (tempFilters.excluded.has(g.label)) tag.className = 'muuc-stat-tag muuc-tag-state-exclude';
      tag.addEventListener('click', () => toggleTag(tag, g.label));
      genreCloud.appendChild(tag);
    });
    body.appendChild(genreCloud);
  }

  // 3. CATEGORIES (WITH SMART SEARCH)
  const catHeader = createElement('div', {
    className: 'muuc-stat-title'
  });
  catHeader.textContent = "Filter by Categories ";

  // --- SEARCH INPUT CATEGORIES ---
  const catSearch = createHeaderSearch((term) => {
    const accordions = body.querySelectorAll('.muuc-cat-accordion');
    accordions.forEach(acc => {
      const tags = acc.querySelectorAll('.muuc-stat-tag');
      let hasVisible = false;

      tags.forEach(t => {
        const visible = t.textContent.toLowerCase().includes(term);
        t.style.display = visible ? 'inline-block' : 'none';
        if (visible) hasVisible = true;
      });

      // If search is active
      if (term) {
        if (hasVisible) {
          acc.style.display = 'block'; // Show accordion
          acc.querySelector('.muuc-accordion-body').classList.remove('hidden'); // Open
          acc.querySelector('.muuc-accordion-header').classList.remove('collapsed');
        } else {
          acc.style.display = 'none'; // Hide empty accordion
        }
      } else {
        // No search, reset visibility
        acc.style.display = 'block';
        const allTags = acc.querySelectorAll('.muuc-stat-tag');
        allTags.forEach(t => t.style.display = 'inline-block');
      }
    });
  });
  catHeader.appendChild(catSearch);
  body.appendChild(catHeader);

  const groups = [{
      key: 'mostCommon',
      label: 'Most Common',
      cls: 'muuc-text-mostcommon'
    },
    {
      key: 'common',
      label: 'Common',
      cls: 'muuc-text-common'
    },
    {
      key: 'uncommon',
      label: 'Uncommon',
      cls: 'muuc-text-uncommon'
    },
    {
      key: 'rare',
      label: 'Rare',
      cls: 'muuc-text-rare'
    }, {
      key: 'unique',
      label: 'Unique (1x)',
      cls: 'muuc-text-unique'
    }
  ];

  groups.forEach(grp => {
    const items = data.groupedCategories[grp.key];
    if (items && items.length > 0) {
      const wrapper = createElement('div', {
        className: 'muuc-accordion muuc-cat-accordion'
      });
      const head = createElement('div', {
        className: 'muuc-accordion-header collapsed'
      });
      const titleSpan = createElement('span', {
        className: grp.cls,
        textContent: grp.label + " "
      });
      titleSpan.appendChild(createElement('span', {
        className: 'muuc-accordion-count',
        textContent: `(${items.length})`
      }));
      head.appendChild(titleSpan);
      const b = createElement('div', {
        className: 'muuc-accordion-body hidden'
      });
      const cloud = createElement('div', {
        className: 'muuc-tag-cloud'
      });
      items.forEach(cat => {
        const tag = createElement('span', {
          className: 'muuc-stat-tag',
          textContent: cat.label
        });
        if (tempFilters.included.has(cat.label)) tag.className = 'muuc-stat-tag muuc-tag-state-include';
        if (tempFilters.excluded.has(cat.label)) tag.className = 'muuc-stat-tag muuc-tag-state-exclude';
        tag.addEventListener('click', () => toggleTag(tag, cat.label));
        cloud.appendChild(tag);
      });
      b.appendChild(cloud);
      head.addEventListener('click', () => {
        if (b.classList.contains('hidden')) {
          b.classList.remove('hidden');
          head.classList.remove('collapsed');
        } else {
          b.classList.add('hidden');
          head.classList.add('collapsed');
        }
      });
      wrapper.append(head, b);
      body.appendChild(wrapper);
    }
  });

  content.appendChild(body);

  // Footer
  const footer = createElement('div', {
    className: 'muuc-modal-footer'
  });

  const clearBtn = createElement('button', {
    className: 'muuc-btn-secondary',
    textContent: 'Clear All'
  });
  clearBtn.addEventListener('click', () => {
    tempFilters.included.clear();
    tempFilters.excluded.clear();
    keepStatsChecked = true;
    sChk.checked = true;
    const allTags = body.querySelectorAll('.muuc-stat-tag');
    allTags.forEach(t => {
      t.className = 'muuc-stat-tag';
      t.style.display = 'inline-block'; // Reset visibility too
    });
    // Reset Search inputs
    searchInput.value = '';
    catSearch.value = '';
    // Reset accordions visibility
    const accs = body.querySelectorAll('.muuc-cat-accordion');
    accs.forEach(acc => acc.style.display = 'block');
  });

  const applyBtn = createElement('button', {
    className: 'muuc-btn-primary',
    textContent: 'Apply Filters'
  });
  applyBtn.addEventListener('click', () => {
    const newAdv = {
      included: Array.from(tempFilters.included),
      excluded: Array.from(tempFilters.excluded)
    };
    const newBasic = {
      keepStats: keepStatsChecked
    };
    onApply(newBasic, newAdv);
    removeElement(overlay);
  });

  footer.append(clearBtn, applyBtn);
  content.appendChild(footer);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  document.getElementById('muuc-af-close').onclick = () => removeElement(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) removeElement(overlay);
  };
}

export function getFilterState() {
  return {};
}