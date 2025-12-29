import { queryAll, getElementText, query, clearChildren } from './domUtils.js';
import { extractNumberFromString } from './extractUtils.js';
import { SELECTORS } from './constants.js';
import { addOrUpdateUnreadSpan, removeUnreadSpan, displayGlobalStats } from './uiManager.js';

/**
 * Extracts the total number of series from the specific container in the DOM.
 * Returns 0 if not found.
 */
export function extractTotalSeriesCount() {
  const candidates = queryAll(SELECTORS.totalTextContainer);
  const totalEl = candidates.find(el => el.textContent.trim().startsWith("Total:"));
  if (totalEl) {
    const match = totalEl.textContent.match(/Total:\s*(\d+)/i);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Parses a single DOM row to extract series data (title, chapters, ratings, IDs).
 * @param {HTMLElement} rowElement - The TR or div element representing a series row.
 */
function extractSeriesRowData(rowElement) {
  const highestChapterElement = query(SELECTORS.highestChapterLink, rowElement);
  const currentChapterElement = query(SELECTORS.currentChapterB, rowElement);
  const titleLinkElement = query(SELECTORS.seriesTitleLink, rowElement);

  const ratingElements = queryAll(SELECTORS.averageRatingElementQuery, rowElement);
  const userRatingElement = ratingElements.length > 0 ? ratingElements[0] : null;
  const averageRatingElement = ratingElements.length > 1 ? ratingElements[1] : null;

  const highestChapterText = getElementText(highestChapterElement);
  const currentChapterText = getElementText(currentChapterElement);
  const titleTextContent = getElementText(titleLinkElement);

  const highestChapter = extractNumberFromString(highestChapterText);
  const currentChapter = extractNumberFromString(currentChapterText);
  const titleText = titleTextContent ? titleTextContent.normalize("NFKD").toLowerCase() : "";

  // Attempt to extract Series ID from href parameters
  let seriesId = null;
  if (highestChapterElement && highestChapterElement.href) {
    const match = highestChapterElement.href.match(/search=(\d+)/);
    if (match) seriesId = match[1];
  } else if (titleLinkElement && titleLinkElement.href) {
    const idParamMatch = titleLinkElement.href.match(/[?&]id=(\d+)/);
    if (idParamMatch) seriesId = idParamMatch[1];
  }

  // Parse User Rating
  let userRating = 0;
  if (userRatingElement) {
    const text = getElementText(userRatingElement);
    if (text === "Add" || text === "") {
      userRating = 0;
    } else {
      const parsed = parseFloat(text);
      userRating = isNaN(parsed) ? 0 : parsed;
    }
  }

  // Parse Average Rating
  let averageRating = 0;
  if (averageRatingElement) {
    const text = getElementText(averageRatingElement);
    const parsed = parseFloat(text.replace(/[^\d.-]/g, ''));
    if (!isNaN(parsed)) {
      averageRating = parsed;
    }
  }

  // Calculate unread difference
  let difference = 0;
  if (highestChapter !== null && currentChapter !== null && highestChapter > currentChapter) {
    difference = highestChapter - currentChapter;
  }

  // Determine container for unread badge
  let unreadContainer = null;
  if (highestChapterElement) {
    unreadContainer = highestChapterElement.parentNode;
  } else {
    unreadContainer = rowElement.querySelector('.text.col');
  }

  return {
    rowElement,
    titleText,
    seriesId,
    userRating,
    averageRating,
    difference,
    currentChapterText,
    highestChapterContainer: unreadContainer,
  };
}

/**
 * Scans the entire list table and returns structured data for all series
 * plus simplified global statistics.
 */
export function getAllSeriesDataAndStats(listTableElement) {
  if (!listTableElement) return {
    allSeriesData: [],
    stats: {
      totalUnreadChapters: 0,
      seriesWithUnread: 0,
      seriesUpToDate: 0
    }
  };

  const seriesRows = queryAll(SELECTORS.seriesRow, listTableElement);
  const stats = {
    totalUnreadChapters: 0,
    seriesWithUnread: 0,
    seriesUpToDate: 0
  };

  const allSeriesData = seriesRows.map(rowEl => {
    const seriesData = extractSeriesRowData(rowEl);
    if (seriesData.difference > 0) {
      stats.totalUnreadChapters += seriesData.difference;
      stats.seriesWithUnread += 1;
    } else {
      stats.seriesUpToDate += 1;
    }
    return seriesData;
  });

  return {
    allSeriesData,
    stats
  };
}

/**
 * Renders the sorted and filtered list of series into the DOM.
 * handles visibility (hiding rows) based on the visibleSet.
 *
 * @param {HTMLElement} parentElement - The table container.
 * @param {Array} allSeriesSorted - List of series data objects.
 * @param {Set|null} visibleSet - Set of series objects to show (null implies show all).
 * @param {Object} overallStats - Statistics to display in the UI.
 */
export function renderSeriesList(parentElement, allSeriesSorted, visibleSet, overallStats) {
  if (!parentElement) return;

  const fragment = document.createDocumentFragment();

  allSeriesSorted.forEach(series => {
    const row = series.rowElement;

    // Update unread badges
    if (series.difference > 0) {
      addOrUpdateUnreadSpan(series.highestChapterContainer, series.difference);
    } else {
      removeUnreadSpan(series.highestChapterContainer);
    }

    // Handle visibility (Filtering)
    const isVisible = !visibleSet || visibleSet.has(series);

    if (isVisible) {
      if (row.style.display === 'none') row.style.removeProperty('display');
    } else {
      row.style.display = 'none';
    }

    fragment.appendChild(row);
  });

  clearChildren(parentElement);
  parentElement.appendChild(fragment);

  displayGlobalStats(overallStats);
}