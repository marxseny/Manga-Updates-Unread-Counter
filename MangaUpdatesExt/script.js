var sortListOptions = document.getElementsByName("sort");

for (var i = 0; i < sortListOptions.length; i++) {
  if (sortListOptions[i].checked) {
    var selectedSortOption = sortListOptions[i].value;
    console.log("Selected sort option:", selectedSortOption);
    
    // Perform actions based on the selected sort option
    if (selectedSortOption === "alpha") {
      // Code for "Alphabetically" option
      console.log("Sorting alphabetically");
      // This is how to single out the chapters from "Your Status", they're the elements with this class:
const rowElements = document.getElementsByClassName('row no-gutters lrow');
// This is how to determine the size of your reading list and use this number to loop the extraction process
const totalSeries = parseInt(document.getElementsByClassName('low_col1')[0].innerText.split(':')[1].trim(), 10);

// Variables to hold the total unread chapters count and entry counts
let totalUnreadChapters = 0;
let entriesWithUnreadChapters = 0;
let entriesUpToDate = 0;

// The extraction loop
for (let i = 0; i < totalSeries; i++) {
  const rowElement = rowElements[i];
  const chapterLastReadWholeElement = rowElement.children[2];
  // This is how to get the chapter number of unread releases
  const newlistElement = rowElement.querySelector('.newlist');

  // This gets rid of unnecessary characters such as c. and v.1 +10 -5
  const chapterLastReadNumber = chapterLastReadWholeElement.textContent.match(/c\.(\d+)/)[1];
  const additionalChapterNumber = newlistElement ? newlistElement.textContent.replace('(c.', '').replace(')', '') : null;

  const chapterLastReadNumberArray = [chapterLastReadNumber];
 
  // It only adds the chapter to the unread release chapter if there's any.
  const unreadChapterNumberArray = additionalChapterNumber ? [additionalChapterNumber] : [];

  console.log(`Chapter Last Read Array ${i + 1}:`, chapterLastReadNumberArray);
  console.log(`Unread Chapter Array ${i + 1}:`, unreadChapterNumberArray);

  // Calculate the unread chapter count
  const unreadChapterCount = unreadChapterNumberArray.length > 0 ? unreadChapterNumberArray[0] - chapterLastReadNumberArray[0] : 0;

  // This is a conditional that adds how many unread chapters text after the latest release number
  if (unreadChapterNumberArray.length > 0) {
    const additionalChapterText = document.createElement('span');
    additionalChapterText.textContent = ` Unread: ${unreadChapterCount}`;
    newlistElement.appendChild(additionalChapterText);

    // Add the unread chapter count to the total
    totalUnreadChapters += unreadChapterCount;
    entriesWithUnreadChapters++;
  } else {
    entriesUpToDate++;
  }
}

// Update the welcome message with the total unread chapters, entries with unread chapters, and entries up to date
const welcomeMessage = document.querySelector('.text b');
welcomeMessage.textContent = `${totalUnreadChapters} Unread Chapters in ${entriesWithUnreadChapters} series. ${entriesUpToDate} are up to date.`;
welcomeMessage.style.color = 'red';
// Alphabetically sort Button
// Select the target element
const seriesElement = document.querySelector('.p-1.col.text.specialtext');

// Create a button element
const sortButton = document.createElement('button');
sortButton.textContent = '↓ A - Z';
sortButton.classList.add('sort-button');

// Add a click event listener to the button
sortButton.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent page reload

  // Get the list table element
  const listTable = document.getElementById('list_table');

  // Get the rows inside the list table
  const rows = Array.from(listTable.getElementsByClassName('row no-gutters lrow'));

  // Sort the rows alphabetically
  rows.sort((a, b) => {
    const titleA = a.querySelector('.col.text.align-self-center').textContent;
    const titleB = b.querySelector('.col.text.align-self-center').textContent;
    return titleA.localeCompare(titleB);
  });

  // Reverse the rows to sort in descending order
  rows.reverse();

  if (sortButton.textContent === '↓ A - Z') {
    sortButton.textContent = '↓ Z - A';
  } else {
    // Reset the button text to default and sort in ascending order
    sortButton.textContent = '↓ A - Z';
    rows.reverse();
  }

  // Append the sorted rows back to the list table
  rows.forEach(row => listTable.appendChild(row));
});

// Insert the button after the "Series" element
seriesElement.insertAdjacentElement('afterend', sortButton);

    } else if (selectedSortOption === "priority") {
      //Arrays for storing each number of Latest Read Chapter from "Your Status" and "Unread Release" if any
var latestReleasedChapter = [];
var latestReadChapter = [];

// Get the manga list 
var table = document.getElementById('list_table');
var rows = table.getElementsByClassName('row');

var diffTotal = 0; // Variable to store the total unread chapters
var diffSeriesCounter = 0; // Variable to count the number of series with unread chapters
var upToDateSeries = 0; // Variable to store the number of series up to date
var totalSeries = 0; // Variable to store the total number of series
const welcomeMessage = document.querySelector('.text b'); // Element for welcome message

// Loop through the reading list to extract chapter information
for (var i = 0; i < rows.length; i++) {
  var row = rows[i];
  var columns = row.getElementsByClassName('text');

  var hasNewList = false; // Flag to check if 'newlist' is present
  var releasedChapterValue = 0; // Default value for latestReleasedChapter

  for (var j = 0; j < columns.length; j++) {
    var column = columns[j];
    var columnText = column.textContent;
    var matches = columnText.match(/c\.\d+/g);

    if (matches) {
      for (var k = 0; k < matches.length; k++) {
        var value = matches[k].replace('c.', '').trim();

        if (column.querySelector('.newlist')) {
          latestReleasedChapter.push(value);
          hasNewList = true;
        } else {
          latestReadChapter.push(value);
        }

        // Store the value for latestReleasedChapter when 'newlist' is not present
        if (!hasNewList && j === columns.length - 1) {
          releasedChapterValue = value;
        }
      }
    }
  }

  if (!hasNewList) {
    latestReleasedChapter.push(releasedChapterValue);
  }
}

// Function to compare chapters and update the unread count in each series
function compareChapters() {
  var maxLength = Math.max(latestReleasedChapter.length, latestReadChapter.length);

  for (var i = 0; i < maxLength; i++) {
    var releasedChapter = latestReleasedChapter[i];
    var readChapter = latestReadChapter[i];
    var diff = releasedChapter - readChapter;

    if (diff > 0) {
      var row = rows[i];
      var newlistElement = row.querySelector('.newlist');

      if (newlistElement) {
        var newText = document.createElement('span');
        newText.textContent = ' Unread: ' + diff;
        newlistElement.appendChild(newText);
        diffTotal += diff;
        diffSeriesCounter++;
      }
    }
  }
}

compareChapters();

// Extract the total number of series
var element = document.querySelector('.low_col1');
if (element) {
  var text = element.textContent;
  var match = text.match(/Total:\s+(\d+)/);

  if (match) {
    totalSeries = parseInt(match[1]);
  }
}

// Calculate the number of series up to date
upToDateSeries = totalSeries - diffSeriesCounter;

// Update the welcome message
welcomeMessage.textContent = `${diffTotal} Unread Chapters in ${diffSeriesCounter} series. ${upToDateSeries} are up to date.`;
welcomeMessage.style.color = 'red';
      console.log("Sorting with priority");
    } else if (selectedSortOption === "rating") {
      // Code for "By Rating" option
      console.log("Sorting by rating");
      // This is how to single out the chapters from "Your Status", they're the elements with this class:
const rowElements = document.getElementsByClassName('row no-gutters lrow');
// This is how to determine the size of your reading list and use this number to loop the extraction process
const totalSeries = parseInt(document.getElementsByClassName('low_col1')[0].innerText.split(':')[1].trim(), 10);

// Variables to hold the total unread chapters count and entry counts
let totalUnreadChapters = 0;
let entriesWithUnreadChapters = 0;
let entriesUpToDate = 0;

// The extraction loop
for (let i = 0; i < totalSeries; i++) {
  const rowElement = rowElements[i];
  const chapterLastReadWholeElement = rowElement.children[2];
  // This is how to get the chapter number of unread releases
  const newlistElement = rowElement.querySelector('.newlist');

  // This gets rid of unnecessary characters such as c. and v.1 +10 -5
  const chapterLastReadNumber = chapterLastReadWholeElement.textContent.match(/c\.(\d+)/)[1];
  const additionalChapterNumber = newlistElement ? newlistElement.textContent.replace('(c.', '').replace(')', '') : null;

  const chapterLastReadNumberArray = [chapterLastReadNumber];
 
  // It only adds the chapter to the unread release chapter if there's any.
  const unreadChapterNumberArray = additionalChapterNumber ? [additionalChapterNumber] : [];

  console.log(`Chapter Last Read Array ${i + 1}:`, chapterLastReadNumberArray);
  console.log(`Unread Chapter Array ${i + 1}:`, unreadChapterNumberArray);

  // Calculate the unread chapter count
  const unreadChapterCount = unreadChapterNumberArray.length > 0 ? unreadChapterNumberArray[0] - chapterLastReadNumberArray[0] : 0;

  // This is a conditional that adds how many unread chapters text after the latest release number
  if (unreadChapterNumberArray.length > 0) {
    const additionalChapterText = document.createElement('span');
    additionalChapterText.textContent = ` Unread: ${unreadChapterCount}`;
    newlistElement.appendChild(additionalChapterText);

    // Add the unread chapter count to the total
    totalUnreadChapters += unreadChapterCount;
    entriesWithUnreadChapters++;
  } else {
    entriesUpToDate++;
  }
}

// Update the welcome message with the total unread chapters, entries with unread chapters, and entries up to date
const welcomeMessage = document.querySelector('.text b');
welcomeMessage.textContent = `${totalUnreadChapters} Unread Chapters in ${entriesWithUnreadChapters} series. ${entriesUpToDate} are up to date.`;
welcomeMessage.style.color = 'red';

// Sorting Button Mechanism

// Select the target element
const seriesElement = document.querySelector('.p-1.col.text.specialtext');

// Create a button element
const sortButton = document.createElement('button');
sortButton.textContent = '↓ Most to Least Rating'; // Change the default text
sortButton.classList.add('sort-button');

// Add a click event listener to the button
sortButton.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent page reload

  // Get the list table element
  const listTable = document.getElementById('list_table');

  // Get the rows inside the list table
  const rows = Array.from(listTable.getElementsByClassName('row no-gutters lrow'));

  // Sort rows based on float rating number in descending order
  rows.sort((a, b) => {
    const ratingAElement = a.querySelector('.p-1.col-md-1.d-none.d-md-block.text-center.text a u b');
    const ratingBElement = b.querySelector('.p-1.col-md-1.d-none.d-md-block.text-center.text a u b');

    const ratingA = ratingAElement ? parseFloat(ratingAElement.textContent) : 0;
    const ratingB = ratingBElement ? parseFloat(ratingBElement.textContent) : 0;

    return ratingB - ratingA; // Sort in descending order
  });

  if (sortButton.textContent === '↓ Most to Least Rating') {
    sortButton.textContent = '↓ Least to Most Rating';
    rows.reverse();
  } else {
    sortButton.textContent = '↓ Most to Least Rating';
  }

  // Append the sorted rows back to the list table
  listTable.innerHTML = ''; // Clear the table

  // Append sorted rows
  rows.forEach((row) => {
    listTable.appendChild(row);
  });
});

// Insert the button after the "Series" element if it exists
if (seriesElement) {
  seriesElement.insertAdjacentElement('afterend', sortButton);
}

    } else if (selectedSortOption === "userRating") {
      // Code for "By Average" option
      console.log("Sorting by average");
      // This is how to single out the chapters from "Your Status", they're the elements with this class:
const rowElements = document.getElementsByClassName('row no-gutters lrow');
// This is how to determine the size of your reading list and use this number to loop the extraction process
const totalSeries = parseInt(document.getElementsByClassName('low_col1')[0].innerText.split(':')[1].trim(), 10);

// Variables to hold the total unread chapters count and entry counts
let totalUnreadChapters = 0;
let entriesWithUnreadChapters = 0;
let entriesUpToDate = 0;

// The extraction loop
for (let i = 0; i < totalSeries; i++) {
  const rowElement = rowElements[i];
  const chapterLastReadWholeElement = rowElement.children[2];
  // This is how to get the chapter number of unread releases
  const newlistElement = rowElement.querySelector('.newlist');

  // This gets rid of unnecessary characters such as c. and v.1 +10 -5
  const chapterLastReadNumber = chapterLastReadWholeElement.textContent.match(/c\.(\d+)/)[1];
  const additionalChapterNumber = newlistElement ? newlistElement.textContent.replace('(c.', '').replace(')', '') : null;

  const chapterLastReadNumberArray = [chapterLastReadNumber];
 
  // It only adds the chapter to the unread release chapter if there's any.
  const unreadChapterNumberArray = additionalChapterNumber ? [additionalChapterNumber] : [];

  console.log(`Chapter Last Read Array ${i + 1}:`, chapterLastReadNumberArray);
  console.log(`Unread Chapter Array ${i + 1}:`, unreadChapterNumberArray);

  // Calculate the unread chapter count
  const unreadChapterCount = unreadChapterNumberArray.length > 0 ? unreadChapterNumberArray[0] - chapterLastReadNumberArray[0] : 0;

  // This is a conditional that adds how many unread chapters text after the latest release number
  if (unreadChapterNumberArray.length > 0) {
    const additionalChapterText = document.createElement('span');
    additionalChapterText.textContent = ` Unread: ${unreadChapterCount}`;
    newlistElement.appendChild(additionalChapterText);

    // Add the unread chapter count to the total
    totalUnreadChapters += unreadChapterCount;
    entriesWithUnreadChapters++;
  } else {
    entriesUpToDate++;
  }
}

// Update the welcome message with the total unread chapters, entries with unread chapters, and entries up to date
const welcomeMessage = document.querySelector('.text b');
welcomeMessage.textContent = `${totalUnreadChapters} Unread Chapters in ${entriesWithUnreadChapters} series. ${entriesUpToDate} are up to date.`;
welcomeMessage.style.color = 'red';

// Sorting Button Mechanism

// Select the target element
const seriesElement = document.querySelector('.p-1.col.text.specialtext');

// Create a button element
const sortButton = document.createElement('button');
sortButton.textContent = '↓ Most to Least Average'; // Change the default text
sortButton.classList.add('sort-button');

// Add a click event listener to the button
sortButton.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent page reload

  // Get the list table element
  const listTable = document.getElementById('list_table');

  // Get the rows inside the list table
  const rows = Array.from(listTable.getElementsByClassName('row no-gutters lrow'));

  // Check the current sorting order
  const isDescendingOrder = sortButton.textContent.startsWith('↓');

  // Sort rows based on float average number
  rows.sort((a, b) => {
    const averageAElement = a.querySelector('.p-1.col-md-1.d-none.d-md-block.text-center.text');
    const averageBElement = b.querySelector('.p-1.col-md-1.d-none.d-md-block.text-center.text');

    const averageA = averageAElement ? parseFloat(averageAElement.textContent) : 0;
    const averageB = averageBElement ? parseFloat(averageBElement.textContent) : 0;

    if (isDescendingOrder) {
      return averageB - averageA; // Sort in descending order
    } else {
      return averageA - averageB; // Sort in ascending order
    }
  });

  // Reverse the sorting order
  rows.reverse();

  // Toggle the sorting button text
  sortButton.textContent = isDescendingOrder ? '↑ Least to Most Average' : '↓ Most to Least Average';

  // Append the sorted rows back to the list table
  listTable.innerHTML = ''; // Clear the table

  // Append sorted rows
  rows.forEach((row) => {
    listTable.appendChild(row);
  });
});

// Insert the button after the "Series" element if it exists
if (seriesElement) {
  seriesElement.insertAdjacentElement('afterend', sortButton);
}

    } else if (selectedSortOption === "release") {
      // Code for "By Latest Release" option
      // This is how to single out the chapters from "Your Status", they're the elements with this class:
const rowElements = document.getElementsByClassName('row no-gutters lrow');
// This is how to determine the size of your reading list and use this number to loop the extraction process
const totalSeries = parseInt(document.getElementsByClassName('low_col1')[0].innerText.split(':')[1].trim(), 10);

// Variables to hold the total unread chapters count and entry counts
let totalUnreadChapters = 0;
let entriesWithUnreadChapters = 0;
let entriesUpToDate = 0;

// The extraction loop
for (let i = 0; i < totalSeries; i++) {
  const rowElement = rowElements[i];
  const chapterLastReadWholeElement = rowElement.children[2];
  // This is how to get the chapter number of unread releases
  const newlistElement = rowElement.querySelector('.newlist');

  // This gets rid of unnecessary characters such as c. and v.1 +10 -5
  const chapterLastReadNumber = chapterLastReadWholeElement.textContent.match(/c\.(\d+)/)[1];
  const additionalChapterNumber = newlistElement ? newlistElement.textContent.replace('(c.', '').replace(')', '') : null;

  const chapterLastReadNumberArray = [chapterLastReadNumber];
 
  // It only adds the chapter to the unread release chapter if there's any.
  const unreadChapterNumberArray = additionalChapterNumber ? [additionalChapterNumber] : [];

  console.log(`Chapter Last Read Array ${i + 1}:`, chapterLastReadNumberArray);
  console.log(`Unread Chapter Array ${i + 1}:`, unreadChapterNumberArray);

  // Calculate the unread chapter count
  const unreadChapterCount = unreadChapterNumberArray.length > 0 ? unreadChapterNumberArray[0] - chapterLastReadNumberArray[0] : 0;

  // This is a conditional that adds how many unread chapters text after the latest release number
  if (unreadChapterNumberArray.length > 0) {
    const additionalChapterText = document.createElement('span');
    additionalChapterText.textContent = ` Unread: ${unreadChapterCount}`;
    newlistElement.appendChild(additionalChapterText);

    // Add the unread chapter count to the total
    totalUnreadChapters += unreadChapterCount;
    entriesWithUnreadChapters++;
  } else {
    entriesUpToDate++;
  }
}

// Update the welcome message with the total unread chapters, entries with unread chapters, and entries up to date
const welcomeMessage = document.querySelector('.text b');
welcomeMessage.textContent = `${totalUnreadChapters} Unread Chapters in ${entriesWithUnreadChapters} series. ${entriesUpToDate} are up to date.`;
welcomeMessage.style.color = 'red';


//Sorting Button Mechanism//

// Select the target element
const seriesElement = document.querySelector('.p-1.col.text.specialtext');

// Create a button element
const sortButton = document.createElement('button');
sortButton.textContent = '↓ Most to Least unread chapters'; // Change the default text
sortButton.classList.add('sort-button');

// Add a click event listener to the button
sortButton.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent page reload

  // Get the list table element
  const listTable = document.getElementById('list_table');

  // Get the rows inside the list table
  const rows = Array.from(listTable.getElementsByClassName('row no-gutters lrow'));

  // Separate rows with and without .newlist
  const rowsWithNewList = [];
  const rowsWithoutNewList = [];
  rows.forEach((row) => {
    const newlistElement = row.querySelector('.col.text.align-self-center .newlist');
    if (newlistElement) {
      rowsWithNewList.push(row);
    } else {
      rowsWithoutNewList.push(row);
    }
  });

  // Sort rows with .newlist based on unread number in ascending order
  rowsWithNewList.sort((a, b) => {
    const unreadA = parseInt(a.querySelector('.col.text.align-self-center .newlist span').textContent.split(': ')[1]);
    const unreadB = parseInt(b.querySelector('.col.text.align-self-center .newlist span').textContent.split(': ')[1]);
    return unreadA - unreadB; // Sort in ascending order
  });

  if (sortButton.textContent === '↓ Least to Most unread chapters') {
    sortButton.textContent = '↓ Most to Least unread chapters';
    rowsWithNewList.reverse();
  } else {
    sortButton.textContent = '↓ Least to Most unread chapters';
  }

  // Append the sorted rows back to the list table
  listTable.innerHTML = ''; // Clear the table

  // Append rows with .newlist
  rowsWithNewList.forEach((row) => {
    listTable.appendChild(row);
  });

  // Append rows without .newlist (to keep them at the bottom)
  rowsWithoutNewList.forEach((row) => {
    listTable.appendChild(row);
  });
});

// Insert the button after the "Series" element if it exists
if (seriesElement) {
  seriesElement.insertAdjacentElement('afterend', sortButton);

  // Trigger the click event to sort in descending order by default
  sortButton.click();
}

      console.log("Sorting by latest release");
    } else if (selectedSortOption === "unread") {
      // Code for "By Unread Releases" option
      console.log("Sorting by unread releases");
      // This is how to single out the chapters from "Your Status", they're the elements with this class:
const rowElements = document.getElementsByClassName('row no-gutters lrow');
// This is how to determine the size of your reading list and use this number to loop the extraction process
const totalSeries = parseInt(document.getElementsByClassName('low_col1')[0].innerText.split(':')[1].trim(), 10);

// Variables to hold the total unread chapters count and entry counts
let totalUnreadChapters = 0;
let entriesWithUnreadChapters = 0;
let entriesUpToDate = 0;

// The extraction loop
for (let i = 0; i < totalSeries; i++) {
  const rowElement = rowElements[i];
  const chapterLastReadWholeElement = rowElement.children[2];
  // This is how to get the chapter number of unread releases
  const newlistElement = rowElement.querySelector('.newlist');

  // This gets rid of unnecessary characters such as c. and v.1 +10 -5
  const chapterLastReadNumber = chapterLastReadWholeElement.textContent.match(/c\.(\d+)/)[1];
  const additionalChapterNumber = newlistElement ? newlistElement.textContent.replace('(c.', '').replace(')', '') : null;

  const chapterLastReadNumberArray = [chapterLastReadNumber];
 
  // It only adds the chapter to the unread release chapter if there's any.
  const unreadChapterNumberArray = additionalChapterNumber ? [additionalChapterNumber] : [];

  console.log(`Chapter Last Read Array ${i + 1}:`, chapterLastReadNumberArray);
  console.log(`Unread Chapter Array ${i + 1}:`, unreadChapterNumberArray);

  // Calculate the unread chapter count
  const unreadChapterCount = unreadChapterNumberArray.length > 0 ? unreadChapterNumberArray[0] - chapterLastReadNumberArray[0] : 0;

  // This is a conditional that adds how many unread chapters text after the latest release number
  if (unreadChapterNumberArray.length > 0) {
    const additionalChapterText = document.createElement('span');
    additionalChapterText.textContent = ` Unread: ${unreadChapterCount}`;
    newlistElement.appendChild(additionalChapterText);

    // Add the unread chapter count to the total
    totalUnreadChapters += unreadChapterCount;
    entriesWithUnreadChapters++;
  } else {
    entriesUpToDate++;
  }
}

// Update the welcome message with the total unread chapters, entries with unread chapters, and entries up to date
const welcomeMessage = document.querySelector('.text b');
welcomeMessage.textContent = `${totalUnreadChapters} Unread Chapters in ${entriesWithUnreadChapters} series. ${entriesUpToDate} are up to date.`;
welcomeMessage.style.color = 'red';


//Sorting Button Mechanism//

// Select the target element
const seriesElement = document.querySelector('.p-1.col.text.specialtext');

// Create a button element
const sortButton = document.createElement('button');
sortButton.textContent = '↓ Most to Least unread chapters'; // Change the default text
sortButton.classList.add('sort-button');

// Add a click event listener to the button
sortButton.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent page reload

  // Get the list table element
  const listTable = document.getElementById('list_table');

  // Get the rows inside the list table
  const rows = Array.from(listTable.getElementsByClassName('row no-gutters lrow'));

  // Separate rows with and without .newlist
  const rowsWithNewList = [];
  const rowsWithoutNewList = [];
  rows.forEach((row) => {
    const newlistElement = row.querySelector('.col.text.align-self-center .newlist');
    if (newlistElement) {
      rowsWithNewList.push(row);
    } else {
      rowsWithoutNewList.push(row);
    }
  });

  // Sort rows with .newlist based on unread number in ascending order
  rowsWithNewList.sort((a, b) => {
    const unreadA = parseInt(a.querySelector('.col.text.align-self-center .newlist span').textContent.split(': ')[1]);
    const unreadB = parseInt(b.querySelector('.col.text.align-self-center .newlist span').textContent.split(': ')[1]);
    return unreadA - unreadB; // Sort in ascending order
  });

  if (sortButton.textContent === '↓ Least to Most unread chapters') {
    sortButton.textContent = '↓ Most to Least unread chapters';
    rowsWithNewList.reverse();
  } else {
    sortButton.textContent = '↓ Least to Most unread chapters';
  }

  // Append the sorted rows back to the list table
  listTable.innerHTML = ''; // Clear the table

  // Append rows with .newlist
  rowsWithNewList.forEach((row) => {
    listTable.appendChild(row);
  });

  // Append rows without .newlist (to keep them at the bottom)
  rowsWithoutNewList.forEach((row) => {
    listTable.appendChild(row);
  });
});

// Insert the button after the "Series" element if it exists
if (seriesElement) {
  seriesElement.insertAdjacentElement('afterend', sortButton);

  // Trigger the click event to sort in descending order by default
  sortButton.click();
}

    }
    
    break;
  }
}

