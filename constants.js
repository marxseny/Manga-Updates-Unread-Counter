// constants.js
export const SELECTORS = {
  // Seletores resilientes usando busca parcial de classe
  listTable: "div[class*='list_table']", 
  seriesRow: ".row.g-0",
  seriesTitleLink: "span[class*='name_underline']",
  
  // O link de lançamentos e o capítulo atual
  highestChapterLink: "a[title='Show releases']",
  currentChapterB: "div.d-inline a:nth-of-type(2) b",
  
  // Ratings (agora são colunas d-md-block)
  averageRatingElementQuery: "div[class*='col-md-1'].d-md-block.text-center.text",
  
  // Inserção da UI e estatísticas
  statsDisplayTarget: ".text.mt-2.mb-3 .mt-3:nth-of-type(2)",
  sortRadioButton: "input[name='sort']:checked",
  sortButtonInsertionPoint: "div.p-1.col-12.text",
  nativeUpdateButton: "button[type='submit'].btn.btn-primary.button",

  // Controles de Status e Filtros
  statusCheckbox: "#muuc-status-checkbox",
  statusSelect: "#muuc-status-select",
  filterToggle: "#muuc-filter-toggle",
  filterCancelled: "#muuc-hide-cancelled",
  filterHiatus: "#muuc-hide-hiatus",
  filterUpToDate: "#muuc-hide-uptodate",
  filterKeepStats: "#muuc-keep-stats",

  // Dashboard e Modais
  statsButton: "#muuc-stats-btn",
  statsModal: "#muuc-stats-modal",
  modalClose: "#muuc-modal-close",

  // Container do rodapé (Total: X)
  totalTextContainer: "div.p-1.col-6"
};

export const CLASSES = {
  sortButton: "sort-button",
  unreadText: "unread-text",
  globalStats: "global-stats",
};

export const DEFAULT_SORT_ORDERS = {
  alpha: "asc",
  unread: "asc",
  release: "asc", // Adicionado para suportar a opção Latest Release
  rating: "desc",
  userRating: "desc",
  ongoing: "asc",
  completed: "asc",
  hiatus: "asc",
  cancelled: "asc"
};

export const DELAY_MS = 500;
export const API_DELAY = 2000; // 1 second between requests