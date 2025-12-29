// loader.js
// Injects the main application logic and styles into the page context.

(function() {
  const mainModulePath = 'appLogic.js';
  const cssPath = 'styles.css';

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    // 1. API Request Proxy
    if (event.data.type === "MUUC_API_REQUEST") {
      const {
        requestId,
        seriesList
      } = event.data;
      chrome.runtime.sendMessage({
        action: "GET_SERIES_INFO",
        seriesList: seriesList
      }, (response) => {
        window.postMessage({
          type: "MUUC_API_RESPONSE",
          requestId: requestId,
          data: response || {},
          error: chrome.runtime.lastError ? chrome.runtime.lastError.message : null
        }, "*");
      });
    }

    // 2. Storage GET Proxy
    if (event.data.type === "MUUC_STORAGE_GET") {
      const {
        requestId,
        keys
      } = event.data;
      chrome.storage.local.get(keys, (result) => {
        window.postMessage({
          type: "MUUC_STORAGE_GET_RESPONSE",
          requestId: requestId,
          data: result
        }, "*");
      });
    }

    // 3. Storage SET Proxy
    if (event.data.type === "MUUC_STORAGE_SET") {
      const {
        data
      } = event.data;
      chrome.storage.local.set(data);
    }

    // 4. Export (Get All)
    if (event.data.type === "MUUC_STORAGE_GET_ALL") {
      const {
        requestId
      } = event.data;
      chrome.storage.local.get(null, (allData) => {
        window.postMessage({
          type: "MUUC_STORAGE_GET_ALL_RESPONSE",
          requestId: requestId,
          data: allData
        }, "*");
      });
    }

    // 5. Import Data
    if (event.data.type === "MUUC_STORAGE_IMPORT") {
      const {
        data
      } = event.data;
      chrome.storage.local.set(data, () => {});
    }

    // 6. Clear Storage
    if (event.data.type === "MUUC_STORAGE_CLEAR") {
      chrome.storage.local.clear(() => {});
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "SERIES_UPDATED_LIVE") {
      window.postMessage({
        type: "MUUC_LIVE_UPDATE",
        title: msg.title,
        data: msg.data
      }, "*");
    }
    // Pass through progress logs if needed
    if (msg.action === "LOG_PROGRESS") {
      window.postMessage({
        type: "MUUC_LOG_PROGRESS",
        message: msg.message
      }, "*");
    }
  });

  async function injectStylesViaFetch() {
    try {
      const cssURL = chrome.runtime.getURL(cssPath);
      const response = await fetch(cssURL);
      const cssText = await response.text();
      const style = document.createElement('style');
      style.id = 'muuc-injected-styles';
      style.textContent = cssText;
      (document.head || document.documentElement).appendChild(style);
    } catch (e) {
      // Silent failure
    }
  }
  injectStylesViaFetch();

  try {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = chrome.runtime.getURL(mainModulePath);
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    // Silent failure
  }
})();