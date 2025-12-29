// background.js
// Service Worker handling API requests to avoid CORS issues in content scripts.

const BASE_URL = 'https://api.mangaupdates.com/v1';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_SERIES_INFO") {
    const target = Array.isArray(request.seriesList) ? request.seriesList[0] : request.seriesList;
    fetchSeriesData(target.title, target.id).then(data => {
      const response = {};
      if (data) response[target.title] = data;
      sendResponse(response);
    });
    return true; // Indicates async response
  }
});

async function fetchSeriesData(title, knownId) {
  try {
    let numericId = knownId;

    // 1. Fetch Series ID if unknown
    if (!numericId) {
      const cleanTitle = title.trim();
      const searchRes = await fetch(`${BASE_URL}/series/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          search: cleanTitle,
          perpage: 1
        })
      });

      if (!searchRes.ok) {
        return null;
      }

      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        numericId = searchData.results[0].record.series_id;
      } else {
        return null;
      }
    }

    // 2. Fetch Details
    const [detailsRes, groupsRes] = await Promise.all([
      fetch(`${BASE_URL}/series/${numericId}`, {
        method: 'GET'
      }),
      fetch(`${BASE_URL}/series/${numericId}/groups`, {
        method: 'GET'
      })
    ]);

    if (!detailsRes.ok) return null;
    const details = await detailsRes.json();

    let latestReleaseString = null;
    let releases = [];

    if (groupsRes.ok) {
      const groupsData = await groupsRes.json();
      releases = (groupsData.release_list || []).slice(0, 5);
      if (releases.length > 0) {
        latestReleaseString = releases[0].chapter;
      }
    }

    const rawStatus = (details.status || "").toLowerCase();
    let computedStatus = "ongoing";
    if (rawStatus.includes("cancel")) computedStatus = "cancelled";
    else if (rawStatus.includes("hiatus")) computedStatus = "hiatus";
    else if (details.completed) computedStatus = "completed";

    return {
      id: details.series_id,
      title: details.title,
      status_type: computedStatus,
      status_text: details.status,
      latest_chapter_number: details.latest_chapter,
      latest_chapter_str: latestReleaseString,
      genres: (details.genres || []).map(g => g.genre),
      categories: (details.categories || []).map(c => c.category),
      release_dates: releases.map(r => r.release_date)
    };
  } catch (e) {
    // Fail silently in production
    return null;
  }
}