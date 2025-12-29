import { SELECTORS, DEFAULT_SORT_ORDERS, DELAY_MS, API_DELAY } from './constants.js';
import { query } from './domUtils.js';
import { getSelectedSortOptionValue, calculateUnreadGap } from './extractUtils.js';
import { getAllSeriesDataAndStats, renderSeriesList, extractTotalSeriesCount } from './seriesManager.js';
import { updateSortButtonLabel, removeExistingSortButtonDOM, applyVisualMask, renderToolbar, getStatusControlState, renderFractionalUI, renderStatsModal, injectDataControls, addOrUpdateUnreadSpan, removeUnreadSpan, renderAdvancedFilterModal, updateProgressBar, hideProgressBar } from './uiManager.js';
import { sortByTitle, sortByUnreadDifference, sortByAverageRating, sortByUserRating, sortBySpecificStatus } from './sortStrategies.js';
import { fetchUserProgressMap, persistUserProgressMap, persistFilterSettings, persistIgnoredCategories, persistIgnoredGenres, fetchFullStorage, importStorageData, checkFirstRun, markFirstRunComplete, clearStorageData } from './apiBridge.js';

let currentSortType = null;
let currentSortOrder = null;
let debounceTimer = null;
let statsDebounceTimer = null;
let lastUrl = location.href;
let observer = null;

let globalSeriesData = [];
let globalStats = {};
let userProgressCache = {};
let filterSettingsCache = {};
let ignoredCategoriesCache = [];
let ignoredGenresCache = [];

// Unified State for Filters
let activeAdvFilters = {
  included: [],
  excluded: []
};

// Queue Management System
let clientQueue = [];
let isProcessingClientQueue = false;
let queueTotal = 0;
let queueProcessed = 0;

/**
 * Starts observing DOM changes to handle dynamic content loading.
 */
function startObserver() {
  if (observer) {
    observer.disconnect();
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
  }
}

/**
 * Saves manual user progress (fractional chapters) and updates the UI accordingly.
 */
function saveUserProgress(seriesId, rawValue) {
  if (!seriesId) return;
  stopObserver();
  let value = rawValue ? String(rawValue).trim() : "";
  value = value.replace(/\s*[\(\[]end[\)\]]/gi, "");

  if (value === "") delete userProgressCache[seriesId];
  else userProgressCache[seriesId] = value;

  const series = globalSeriesData.find(s => s.seriesId == seriesId);
  if (series) {
    const latestStr = series.apiLatestStr || String(series.apiLatestInt || 0);
    const realCurrent = value || series.currentChapterText;
    const newGap = calculateUnreadGap(latestStr, realCurrent);
    series.difference = newGap;

    renderFractionalUI(series.rowElement, series.apiLatestStr, value, (newVal) => saveUserProgress(seriesId, newVal));
    applyVisualMask(series.rowElement, String(series.apiLatestInt || ""), value ? null : null, series.apiStatusType);

    if (newGap > 0) addOrUpdateUnreadSpan(series.highestChapterContainer, newGap);
    else removeUnreadSpan(series.highestChapterContainer);
  }

  recalcStatsAndRender();
  fetchUserProgressMap().then(map => {
    const safeMap = map || {};
    if (value === "") delete safeMap[seriesId];
    else safeMap[seriesId] = value;
    persistUserProgressMap(safeMap);
  });
  startObserver();
}

function handleStatusControlChange() {
  stopObserver();
  const sortButton = document.getElementById("muuc-sort-button");
  if (sortButton) {
    determineSortState();
    updateSortButtonLabel(sortButton, currentSortType, currentSortOrder, isStatusModeActive());
    recalcStatsAndRender();
  }
  startObserver();
}

function handleSortClick(e) {
  e.preventDefault();
  e.stopPropagation();
  stopObserver();
  currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
  const sortButton = document.getElementById("muuc-sort-button");
  if (sortButton) updateSortButtonLabel(sortButton, currentSortType, currentSortOrder, isStatusModeActive());
  recalcStatsAndRender();
  startObserver();
}

function handleExportClick(e) {
  e.preventDefault();
  fetchFullStorage().then(data => {
    downloadDataAsJson(data);
  });
}

function handleDeleteClick(e) {
  e.preventDefault();
  if (confirm("Are you sure you want to delete your local data?\n\nThe current data will be saved as a JSON just in case.")) {
    fetchFullStorage().then(data => {
      downloadDataAsJson(data);
      clearStorageData();
      alert("Data cleared. Reloading page...");
      setTimeout(() => location.reload(), 1000);
    });
  }
}

function handleAdvFilterClick(e) {
  e.preventDefault();
  fetchFullStorage().then(allData => {
    const genreCounts = {};
    const catCounts = {};

    Object.keys(allData).forEach(key => {
      if (key.startsWith("series_") && allData[key].data) {
        const sData = allData[key].data;
        if (sData.genres) sData.genres.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1);
        if (sData.categories) sData.categories.forEach(c => catCounts[c] = (catCounts[c] || 0) + 1);
      }
    });

    const toSortedArray = (obj) => Object.entries(obj).map(([label, count]) => ({
      label,
      count
    })).sort((a, b) => b.count - a.count);
    const sortedCats = toSortedArray(catCounts);
    const maxCount = sortedCats.length > 0 ? sortedCats[0].count : 0;

    const catGroups = {
      mostCommon: [],
      common: [],
      uncommon: [],
      rare: [],
      unique: []
    };
    sortedCats.forEach(item => {
      if (item.count === 1) catGroups.unique.push(item);
      else {
        const ratio = item.count / maxCount;
        if (ratio >= 0.60) catGroups.mostCommon.push(item);
        else if (ratio >= 0.30) catGroups.common.push(item);
        else if (ratio >= 0.10) catGroups.uncommon.push(item);
        else catGroups.rare.push(item);
      }
    });

    const filterData = {
      topGenres: toSortedArray(genreCounts),
      groupedCategories: catGroups
    };

    renderAdvancedFilterModal(filterData, activeAdvFilters, filterSettingsCache, (newBasic, newAdv) => {
      activeAdvFilters = newAdv;
      filterSettingsCache = {
        ...filterSettingsCache,
        ...newBasic,
        advancedFilters: newAdv
      };
      persistFilterSettings(filterSettingsCache);
      recalcStatsAndRender();
    });
  });
}

function downloadDataAsJson(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mangaupdates_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (confirm("This will overwrite your current settings and progress. Are you sure?")) {
        importStorageData(data);
        markFirstRunComplete();
        alert("Data imported! Reloading...");
        setTimeout(() => location.reload(), 1000);
      }
    } catch (err) {
      alert("Error parsing JSON file");
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function isStatusModeActive() {
  return getStatusControlState().isActive;
}

function determineSortState() {
  const statusState = getStatusControlState();
  if (statusState.isActive) currentSortType = statusState.status;
  else currentSortType = getSelectedSortOptionValue(SELECTORS.sortRadioButton);
  currentSortOrder = DEFAULT_SORT_ORDERS[currentSortType] || 'asc';
}

/**
 * Fetches data from storage and calculates statistics for the modal.
 */
function calculateAndShowStats() {
  fetchFullStorage().then(allData => {
    const statusCounts = {
      ongoing: 0,
      completed: 0,
      hiatus: 0,
      cancelled: 0
    };
    const genreCounts = {};
    const catCounts = {};
    let totalCount = 0;

    Object.keys(allData).forEach(key => {
      if (key.startsWith("series_") && allData[key].data) {
        totalCount++;
        const sData = allData[key].data;
        const status = sData.status_type || 'ongoing';
        if (statusCounts[status] !== undefined) statusCounts[status]++;

        if (sData.genres && Array.isArray(sData.genres)) {
          sData.genres.forEach(g => {
            if (!ignoredGenresCache.includes(g)) {
              genreCounts[g] = (genreCounts[g] || 0) + 1;
            }
          });
        }
        if (sData.categories && Array.isArray(sData.categories)) {
          sData.categories.forEach(c => {
            if (!ignoredCategoriesCache.includes(c)) {
              catCounts[c] = (catCounts[c] || 0) + 1;
            }
          });
        }
      }
    });

    const toSortedArray = (obj) => {
      return Object.entries(obj).map(([label, count]) => ({
        label,
        count
      })).sort((a, b) => b.count - a.count);
    };

    const sortedCats = toSortedArray(catCounts);
    const maxCount = sortedCats.length > 0 ? sortedCats[0].count : 0;

    const catGroups = {
      mostCommon: [],
      common: [],
      uncommon: [],
      rare: [],
      unique: []
    };

    sortedCats.forEach(item => {
      if (item.count === 1) {
        catGroups.unique.push(item);
      } else {
        const ratio = item.count / maxCount;
        if (ratio >= 0.60) catGroups.mostCommon.push(item);
        else if (ratio >= 0.30) catGroups.common.push(item);
        else if (ratio >= 0.10) catGroups.uncommon.push(item);
        else catGroups.rare.push(item);
      }
    });

    const statsData = {
      statusCounts: toSortedArray(statusCounts).slice(0, 4),
      topGenres: toSortedArray(genreCounts),
      groupedCategories: catGroups,
      totalSeries: totalCount,
      ignoredCategories: ignoredCategoriesCache,
      ignoredGenres: ignoredGenresCache
    };

    const hideIgnored = filterSettingsCache.hideIgnored || false;

    renderStatsModal(
      statsData,
      toggleCategoryIgnore,
      toggleGenreIgnore,
      hideIgnored,
      (newVal) => {
        filterSettingsCache.hideIgnored = newVal;
        persistFilterSettings(filterSettingsCache);
        calculateAndShowStats();
      },
      () => {
        if (confirm("Restore ALL ignored genres and categories?")) {
          ignoredCategoriesCache = [];
          ignoredGenresCache = [];
          persistIgnoredCategories([]);
          persistIgnoredGenres([]);
          calculateAndShowStats();
        }
      }
    );
  });
}

function toggleCategoryIgnore(catName) {
  if (ignoredCategoriesCache.includes(catName)) ignoredCategoriesCache = ignoredCategoriesCache.filter(c => c !== catName);
  else ignoredCategoriesCache.push(catName);
  persistIgnoredCategories(ignoredCategoriesCache);
  calculateAndShowStats();
}

function toggleGenreIgnore(genreName) {
  if (ignoredGenresCache.includes(genreName)) ignoredGenresCache = ignoredGenresCache.filter(g => g !== genreName);
  else ignoredGenresCache.push(genreName);
  persistIgnoredGenres(ignoredGenresCache);
  calculateAndShowStats();
}

/**
 * Initializes the background queue processing to fetch missing or outdated series data.
 */
function startProcessingQueue(storageData) {
  if (isProcessingClientQueue) return;
  queueTotal = 0;
  queueProcessed = 0;
  const now = Date.now();

  clientQueue = globalSeriesData.filter(s => {
    let cached = null;
    if (s.seriesId) cached = storageData[`series_${s.seriesId}`];
    if (!cached && s.titleText) {
      const foundKey = Object.keys(storageData).find(k =>
        storageData[k]?.title?.toLowerCase().trim() === s.titleText
      );
      if (foundKey) cached = storageData[foundKey];
    }

    if (!cached) return true;
    if (now > cached.nextCheck) return true;
    return false;
  });

  queueTotal = clientQueue.length;
  if (queueTotal > 0) {
    isProcessingClientQueue = true;
    const estMs = queueTotal * API_DELAY;
    updateProgressBar(0, formatEta(estMs));
    processNextItem();
  } else {
    hideProgressBar();
  }
}

function formatEta(ms) {
  if (ms < 1000) return "< 1s";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Recursively processes the next item in the queue with a delay to respect API limits.
 */
function processNextItem() {
  if (clientQueue.length === 0) {
    isProcessingClientQueue = false;
    recalcStatsAndRender();
    hideProgressBar();
    return;
  }

  const item = clientQueue.shift();
  const payload = [{
    title: item.titleText,
    id: item.seriesId
  }];
  const requestId = Date.now() + Math.random().toString();

  const pendingCount = clientQueue.length + 1;
  const processedCount = queueTotal - pendingCount;

  const pct = ((processedCount / queueTotal) * 100).toFixed(1);
  const etaMs = pendingCount * API_DELAY;
  updateProgressBar(pct, formatEta(etaMs));

  const responseHandler = (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === "MUUC_API_RESPONSE" && event.data.requestId === requestId) {
      window.removeEventListener("message", responseHandler);
      const apiInfo = event.data.data ? (event.data.data[item.titleText] || Object.values(event.data.data)[0]) : null;
      if (apiInfo) {
        const freqDays = apiInfo.status_type === 'completed' ? 365 : 7;
        const nextCheck = Date.now() + (freqDays * 24 * 60 * 60 * 1000);
        const storageKey = `series_${apiInfo.id}`;
        const storagePayload = {};
        storagePayload[storageKey] = {
          title: item.titleText,
          nextCheck: nextCheck,
          lastUpdated: Date.now(),
          data: apiInfo
        };
        window.postMessage({
          type: "MUUC_STORAGE_SET",
          data: storagePayload
        }, "*");

        if (!item.seriesId) item.seriesId = apiInfo.id;
        stopObserver();
        updateSingleSeriesLogic(item, apiInfo);
        startObserver();
      }

      queueProcessed++;
      setTimeout(processNextItem, API_DELAY);
    }
  };
  window.addEventListener("message", responseHandler);
  window.postMessage({
    type: "MUUC_API_REQUEST",
    requestId,
    seriesList: payload
  }, "*");
}

function setupNativeUpdateListener() {
  const nativeBtn = query(SELECTORS.nativeUpdateButton);
  if (nativeBtn && !nativeBtn.dataset.muucListening) {
    nativeBtn.dataset.muucListening = "true";
    nativeBtn.addEventListener("click", () => {
      setTimeout(() => {
        determineSortState();
        const mySortButton = document.getElementById("muuc-sort-button");
        if (mySortButton) updateSortButtonLabel(mySortButton, currentSortType, currentSortOrder, isStatusModeActive());
      }, 50);
    });
  }
}

async function initializeOrUpdateView() {
  stopObserver();
  try {
    const tableElement = query(SELECTORS.listTable);
    const insertionPoint = query(SELECTORS.sortButtonInsertionPoint);
    if (!tableElement || !insertionPoint) {
      startObserver();
      return;
    }

    setupNativeUpdateListener();

    // Check if toolbar exists to prevent UI flickering
    let sortButton = document.getElementById("muuc-sort-button");
    const toolbarExists = !!query('#muuc-toolbar');

    if (!toolbarExists) {
      removeExistingSortButtonDOM(); // Safety cleanup

      import('./uiManager.js').then(ui => {
        ui.injectDataControls({
          onExportClick: handleExportClick,
          onImportFile: handleImportFile,
          onDeleteClick: handleDeleteClick
        });
      });
    }

    const isComplete = await checkFirstRun();
    if (!isComplete) {
      if (confirm("Welcome to Manga Updates Unread Counter!\n\nDo you have a backup JSON file to import?")) {
        const input = document.getElementById('muuc-import-input');
        if (input) input.click();
        return;
      } else {
        const total = extractTotalSeriesCount();
        if (total > 0) {
          const timeSec = (total * API_DELAY) / 1000;
          const mins = Math.floor(timeSec / 60);
          const secs = Math.round(timeSec % 60);
          alert(`Okay! The extension will now fetch data for ${total} series.\nEstimated time: ~${mins}m ${secs}s.\n\nThis runs in the background. Enjoy!`);
        }
        markFirstRunComplete();
      }
    }

    import('./apiBridge.js').then(bridge => {
      Promise.all([
        bridge.fetchUserProgressMap(),
        bridge.fetchFilterSettings ? bridge.fetchFilterSettings() : Promise.resolve({}),
        bridge.fetchIgnoredCategories ? bridge.fetchIgnoredCategories() : Promise.resolve([]),
        bridge.fetchIgnoredGenres ? bridge.fetchIgnoredGenres() : Promise.resolve([]),
        bridge.fetchFullStorage()
      ]).then(([progressMap, filtersMap, ignoredCats, ignoredGens, fullStorage]) => {

        userProgressCache = progressMap || {};
        filterSettingsCache = filtersMap || {};
        ignoredCategoriesCache = ignoredCats || [];
        ignoredGenresCache = ignoredGens || [];

        if (filterSettingsCache.advancedFilters) {
          activeAdvFilters = filterSettingsCache.advancedFilters;
        }

        if (globalSeriesData.length === 0) {
          let {
            allSeriesData,
            stats
          } = getAllSeriesDataAndStats(tableElement);
          globalSeriesData = allSeriesData;
          globalStats = stats;
        }

        if (!toolbarExists) {
          import('./uiManager.js').then(ui => {
            sortButton = ui.renderToolbar(insertionPoint, {
              onSortClick: handleSortClick,
              onStatusChange: handleStatusControlChange,
              onFilterChange: (e) => {},
              onStatsClick: (e) => {
                e.preventDefault();
                calculateAndShowStats();
              },
              onExportClick: handleExportClick,
              onImportFile: handleImportFile,
              onAdvFilterClick: handleAdvFilterClick
            }, filterSettingsCache);

            finishSetup(fullStorage, sortButton);
          });
        } else {
          finishSetup(fullStorage, sortButton);
        }
      });
    });

  } catch (e) {
    startObserver();
  }
}

function finishSetup(fullStorage, sortButton) {
  determineSortState();
  updateSortButtonLabel(sortButton, currentSortType, currentSortOrder, isStatusModeActive());

  stopObserver();
  globalSeriesData.forEach(series => {
    let sKey = series.seriesId ? `series_${series.seriesId}` : null;
    let cachedItem = sKey ? fullStorage[sKey] : null;
    if (!cachedItem && series.titleText) {
      const foundKey = Object.keys(fullStorage).find(k =>
        fullStorage[k]?.title?.toLowerCase().trim() === series.titleText
      );
      if (foundKey) cachedItem = fullStorage[foundKey];
    }

    if (cachedItem && cachedItem.data) {
      if (!series.seriesId) series.seriesId = cachedItem.data.id;
      updateSingleSeriesLogic(series, cachedItem.data);
    }
  });
  recalcStatsAndRender();
  startObserver();

  startProcessingQueue(fullStorage);
}

function updateSingleSeriesLogic(series, apiInfo) {
  const sId = series.seriesId;
  series.apiStatusType = apiInfo.status_type;
  series.apiLatestInt = apiInfo.latest_chapter_number;
  series.apiLatestStr = apiInfo.latest_chapter_str;
  series.apiGenres = apiInfo.genres;
  series.apiCategories = apiInfo.categories;

  const finalLatest = series.apiLatestStr || String(series.apiLatestInt);
  const customFraction = userProgressCache[sId];
  const realCurrent = customFraction || series.currentChapterText;

  applyVisualMask(series.rowElement, String(series.apiLatestInt), customFraction ? null : null, apiInfo.status_type);
  renderFractionalUI(series.rowElement, series.apiLatestStr, customFraction, (newVal) => saveUserProgress(sId, newVal));

  const gap = calculateUnreadGap(finalLatest, realCurrent);
  if (series.difference !== gap) {
    series.difference = gap;
    if (gap > 0) addOrUpdateUnreadSpan(series.highestChapterContainer, gap);
    else removeUnreadSpan(series.highestChapterContainer);
    return true;
  }
  return false;
}

function recalcStatsAndRender() {
  stopObserver();
  try {
    const filters = filterSettingsCache;
    const visibleSet = new Set();

    const visibleData = globalSeriesData.filter(series => {
      const status = series.apiStatusType || 'ongoing';

      // Unified Tag Processing
      const seriesTags = new Set([...(series.apiGenres || []), ...(series.apiCategories || [])]);

      // Add virtual tags for status
      seriesTags.add(`STATUS:${status}`);
      if (series.difference <= 0) seriesTags.add('STATUS:uptodate');

      // Detect Split Chapters
      if (series.apiLatestStr && /[\.a-z]/i.test(series.apiLatestStr)) {
        seriesTags.add('STATUS:splitchapters');
      }

      // 1. INCLUDE (AND logic)
      if (activeAdvFilters.included.length > 0) {
        if (!activeAdvFilters.included.every(tag => seriesTags.has(tag))) return false;
      }

      // 2. EXCLUDE (NOT logic)
      if (activeAdvFilters.excluded.length > 0) {
        if (activeAdvFilters.excluded.some(tag => seriesTags.has(tag))) return false;
      }

      return true;
    });

    visibleData.forEach(s => visibleSet.add(s));

    const dataForStats = filters.keepStats ? globalSeriesData : visibleData;
    globalStats.totalUnreadChapters = 0;
    globalStats.seriesWithUnread = 0;
    globalStats.seriesUpToDate = 0;

    dataForStats.forEach(s => {
      if (s.difference > 0) {
        const gapValue = Math.ceil(s.difference);
        globalStats.totalUnreadChapters += gapValue;
        globalStats.seriesWithUnread++;
      } else {
        globalStats.seriesUpToDate++;
      }
    });

    const tableElement = query(SELECTORS.listTable);
    if (tableElement) {
      const sortedAll = applySmartSort(globalSeriesData, currentSortType, currentSortOrder);
      renderSeriesList(tableElement, sortedAll, visibleSet, globalStats);
      reapplyVisualsAfterSort(globalSeriesData);
    }
  } finally {
    startObserver();
  }
}

function reapplyVisualsAfterSort(dataArray) {
  dataArray.forEach(series => {
    if (series.apiStatusType || series.apiLatestInt) {
      const sId = series.seriesId;
      const customFraction = userProgressCache[sId];
      applyVisualMask(series.rowElement, String(series.apiLatestInt || ""), customFraction ? null : null, series.apiStatusType);
      renderFractionalUI(series.rowElement, series.apiLatestStr, customFraction, (newVal) => saveUserProgress(sId, newVal));
    }
  });
}

function applySmartSort(data, type, order) {
  if (['ongoing', 'completed', 'hiatus', 'cancelled'].includes(type)) {
    return sortBySpecificStatus(data, type, order);
  }
  switch (type) {
    case "alpha":
      return sortByTitle(data, order);
    case "unread":
    case "release": // Mapeia nativo "Latest Release" para nossa lógica de Unread
      return sortByUnreadDifference(data, order);
    case "rating":
      return sortByUserRating(data, order);
    case "userRating":
      return sortByAverageRating(data, order);
    default:
      return data;
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data || event.data.type !== "MUUC_LIVE_UPDATE") return;
  handleSingleUpdate(event.data.title, event.data.data);
});

function handleSingleUpdate(title, apiInfo) {
  if (!globalSeriesData.length) return;
  stopObserver();
  try {
    const seriesIndex = globalSeriesData.findIndex(s => s.titleText === title);
    if (seriesIndex === -1) return;
    const series = globalSeriesData[seriesIndex];
    const sId = series.seriesId || apiInfo.id;
    series.seriesId = sId;
    const changed = updateSingleSeriesLogic(series, apiInfo);
    if (changed) {
      clearTimeout(statsDebounceTimer);
      statsDebounceTimer = setTimeout(() => {
        stopObserver();
        try {
          recalcStatsAndRender();
        } finally {
          startObserver();
        }
      }, 500);
    } else {
      // Check if re-render is needed due to active filters
      if (activeAdvFilters.included.length > 0 || activeAdvFilters.excluded.length > 0) {
        clearTimeout(statsDebounceTimer);
        statsDebounceTimer = setTimeout(() => {
          stopObserver();
          try {
            recalcStatsAndRender();
          } finally {
            startObserver();
          }
        }, 500);
      }
    }
  } finally {
    startObserver();
  }
}

function init() {
  observer = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      currentSortType = null;
      currentSortOrder = null;
      globalSeriesData = [];
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      initializeOrUpdateView();
    }, DELAY_MS);
  });
  initializeOrUpdateView();
  const intervalId = setInterval(() => {
    const table = query(SELECTORS.listTable);
    if (table) {
      clearInterval(intervalId);
      if (!observer) startObserver();
    }
  }, 2000);
}

const STARTUP_DELAY = 1500;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, STARTUP_DELAY);
  });
} else {
  setTimeout(init, STARTUP_DELAY);
}