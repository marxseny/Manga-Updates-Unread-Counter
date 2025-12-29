// apiBridge.js
// Handles communication between the Content Script/UI and the Background/Storage
// using window.postMessage to bypass context isolation.

export function fetchSeriesInfoFromBackground(seriesList) {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random().toString();
    // Prepares payload for background processing
    const payload = seriesList.map(s => ({
      title: s.titleText,
      id: s.seriesId
    }));

    const responseHandler = (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.type === "MUUC_API_RESPONSE" && event.data.requestId === requestId) {
        window.removeEventListener("message", responseHandler);
        resolve(event.data.data || {});
      }
    };
    window.addEventListener("message", responseHandler);
    window.postMessage({
      type: "MUUC_API_REQUEST",
      requestId,
      seriesList: payload
    }, "*");
  });
}

// --- STORAGE OPERATIONS ---

export function fetchUserProgressMap() {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random().toString();
    const handler = (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.type === "MUUC_STORAGE_GET_RESPONSE" && event.data.requestId === requestId) {
        window.removeEventListener("message", handler);
        resolve(event.data.data?.user_progress_map || {});
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({
      type: "MUUC_STORAGE_GET",
      requestId,
      keys: ["user_progress_map"]
    }, "*");
  });
}

export function persistUserProgressMap(map) {
  window.postMessage({
    type: "MUUC_STORAGE_SET",
    data: {
      "user_progress_map": map
    }
  }, "*");
}

export function fetchFilterSettings() {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random().toString();
    const handler = (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.type === "MUUC_STORAGE_GET_RESPONSE" && event.data.requestId === requestId) {
        window.removeEventListener("message", handler);
        resolve(event.data.data?.filter_settings || {});
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({
      type: "MUUC_STORAGE_GET",
      requestId,
      keys: ["filter_settings"]
    }, "*");
  });
}

export function persistFilterSettings(settings) {
  window.postMessage({
    type: "MUUC_STORAGE_SET",
    data: {
      "filter_settings": settings
    }
  }, "*");
}

export function fetchIgnoredCategories() {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random().toString();
    const handler = (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.type === "MUUC_STORAGE_GET_RESPONSE" && event.data.requestId === requestId) {
        window.removeEventListener("message", handler);
        resolve(event.data.data?.ignored_categories || []);
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({
      type: "MUUC_STORAGE_GET",
      requestId,
      keys: ["ignored_categories"]
    }, "*");
  });
}

export function persistIgnoredCategories(list) {
  window.postMessage({
    type: "MUUC_STORAGE_SET",
    data: {
      "ignored_categories": list
    }
  }, "*");
}

export function fetchIgnoredGenres() {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random().toString();
    const handler = (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.type === "MUUC_STORAGE_GET_RESPONSE" && event.data.requestId === requestId) {
        window.removeEventListener("message", handler);
        resolve(event.data.data?.ignored_genres || []);
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({
      type: "MUUC_STORAGE_GET",
      requestId,
      keys: ["ignored_genres"]
    }, "*");
  });
}

export function persistIgnoredGenres(list) {
  window.postMessage({
    type: "MUUC_STORAGE_SET",
    data: {
      "ignored_genres": list
    }
  }, "*");
}

// --- BACKUP / RESTORE / CLEAR ---

export function fetchFullStorage() {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random().toString();
    const handler = (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.type === "MUUC_STORAGE_GET_ALL_RESPONSE" && event.data.requestId === requestId) {
        window.removeEventListener("message", handler);
        resolve(event.data.data || {});
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({
      type: "MUUC_STORAGE_GET_ALL",
      requestId
    }, "*");
  });
}

export function importStorageData(data) {
  window.postMessage({
    type: "MUUC_STORAGE_IMPORT",
    data
  }, "*");
}

export function clearStorageData() {
  window.postMessage({
    type: "MUUC_STORAGE_CLEAR"
  }, "*");
}

// --- FIRST RUN CHECKS ---

export function checkFirstRun() {
  return new Promise((resolve) => {
    const requestId = Date.now() + Math.random().toString();
    const handler = (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.type === "MUUC_STORAGE_GET_RESPONSE" && event.data.requestId === requestId) {
        window.removeEventListener("message", handler);
        resolve(event.data.data?.muuc_setup_complete || false);
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({
      type: "MUUC_STORAGE_GET",
      requestId,
      keys: ["muuc_setup_complete"]
    }, "*");
  });
}

export function markFirstRunComplete() {
  window.postMessage({
    type: "MUUC_STORAGE_SET",
    data: {
      "muuc_setup_complete": true
    }
  }, "*");
}