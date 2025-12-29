export function sortByTitle(seriesArray, order) {
  return [...seriesArray].sort((a, b) => {
    const titleA = a.titleText || "";
    const titleB = b.titleText || "";
    const comparison = titleA.localeCompare(titleB, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
    return order === "asc" ? comparison : -comparison;
  });
}

export function sortByUnreadDifference(seriesArray, order) {
  return [...seriesArray].sort((a, b) => {
    if (a.difference === 0 && b.difference !== 0) return 1;
    if (b.difference === 0 && a.difference !== 0) return -1;
    return order === "asc" ? a.difference - b.difference : b.difference - a.difference;
  });
}

export function sortByAverageRating(seriesArray, order) {
  return [...seriesArray].sort((a, b) => {
    const ratingA = a.averageRating || 0;
    const ratingB = b.averageRating || 0;
    return order === "desc" ? ratingB - ratingA : ratingA - ratingB;
  });
}

export function sortByUserRating(seriesArray, order) {
  return [...seriesArray].sort((a, b) => {
    const ratingA = a.userRating || 0;
    const ratingB = b.userRating || 0;
    if (order === "desc") return ratingB - ratingA;
    else return ratingA - ratingB;
  });
}

export function sortBySpecificStatus(seriesArray, targetStatus, order) {
  return [...seriesArray].sort((a, b) => {
    const statusA = a.apiStatusType === targetStatus;
    const statusB = b.apiStatusType === targetStatus;

    if (statusA === statusB) {
      const titleA = a.titleText || "";
      const titleB = b.titleText || "";
      return titleA.localeCompare(titleB, undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    }

    if (order === "asc") return statusA ? -1 : 1;
    else return statusA ? 1 : -1;
  });
}