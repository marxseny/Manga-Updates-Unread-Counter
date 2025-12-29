# Manga Updates Unread Counter (MUUC)

**Manga Updates Unread Counter (MUUC)** is a specialized Chrome Extension (v3.2) designed to enhance the "My Lists" experience on MangaUpdates (Baka-Updates). It automatically tracks unread chapters, provides deep statistical insights, and offers advanced sorting and filtering tools to manage your reading library efficiently.

## 🌟 Key Features

### 1. Smart Unread Tracking
* **Automated Gap Calculation:** Automatically determines the numerical difference between the latest release available via the API and your current progress.
* **Complex Chapter Support:** Successfully parses and compares complex chapter strings including fractions (e.g., `12.5`), suffixes (e.g., `10a`), and ranges.
* **Manual Progress Overrides:** Features a manual override system via a "bolt" (⚡) UI, allowing users to set custom fractional chapters that are saved to local storage.

### 2. Advanced Filtering & Sorting
* **Multi-Criteria Sorting:** Sort your lists by title, unread gap, average rating, user rating, or specific series status (Ongoing, Hiatus, etc.).
* **Unified Filter Modal:** Includes a powerful filtering system to **Include** or **Exclude** series based on specific genres, categories, and status tags.
* **Visual Status Tags:** Injects visual badges directly into the list rows to identify series that are `CANCELLED`, `HIATUS`, or `END`.

### 3. Statistics & Analytics
* **Dashboard Overview:** Provides a visual distribution of your library through bar charts for status and genre frequency.
* **Category Clustering:** Automatically groups series categories into rarity tiers like "Most Common," "Rare," or "Unique".
* **Global Reading Totals:** Tracks total unread chapters across your entire collection and identifies how many series are currently up to date.

### 4. Robust Data Management
* **Background Sync Queue:** Features an automated background queue that fetches metadata from the MangaUpdates API while respecting rate limits.
* **Portability:** Offers full backup and restore functionality, allowing you to export your settings and progress as a JSON file.
* **Unlimited Storage:** Utilizes `unlimitedStorage` permissions to ensure your extensive library data is always preserved.

---

## 🛠 Technical Architecture

The extension is built on **Manifest V3** with a modular JavaScript architecture:

* **`manifest.json`**: Configures Manifest V3, permissions for `storage`, `declarativeNetRequest`, and access to the MangaUpdates API.
* **`appLogic.js`**: Serves as the central orchestrator managing application state, the processing queue, and DOM observers.
* **`background.js`**: Operates as a service worker to handle asynchronous API requests to `api.mangaupdates.com`.
* **`rules.json`**: Implements `declarativeNetRequest` rules to safely modify `Origin` and `Referer` headers for API calls, ensuring compatibility and security.
* **`apiBridge.js`**: Facilitates secure communication between the content script and Chrome's storage using `window.postMessage` to bypass context isolation.
* **`uiManager.js` & `domUtils.js`**: Handle the dynamic rendering and injection of all UI components, including toolbars and progress bars.

---

## 🚀 Installation (Developer Mode)

1.  Download or clone this repository to your local machine.
2.  Open your Chrome browser and navigate to `chrome://extensions/`.
3.  Enable **"Developer mode"** using the toggle in the top right corner.
4.  Click the **"Load unpacked"** button and select the project folder containing the `manifest.json`.
5.  Navigate to your "My Lists" page on MangaUpdates to see the MUUC toolbar.

---

## 🛡️ Disclaimer
This project is an independent tool and is not officially affiliated with MangaUpdates. It utilizes the public MangaUpdates V1 API to provide its enhanced features.

**Author:** [marxseny@gmail.com](mailto:marxseny@gmail.com)
