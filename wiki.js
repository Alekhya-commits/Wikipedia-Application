// DOM Elements
const searchFormEl = document.getElementById("searchForm");
const searchInputEl = document.getElementById("searchInput");
const searchResultsEl = document.getElementById("searchResults");
const spinnerEl = document.getElementById("spinner");
const themeToggleEl = document.getElementById("themeToggle");
const clearSearchEl = document.getElementById("clearSearch");
const randomButtonEl = document.getElementById("randomButton");
const recentSearchesContainerEl = document.getElementById("recentSearchesContainer");
const recentSearchesListEl = document.getElementById("recentSearchesList");
const clearHistoryBtnEl = document.getElementById("clearHistoryBtn");

// State
let searchHistory = JSON.parse(localStorage.getItem("wiki_search_history")) || [];

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem("wiki_theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    
    document.documentElement.setAttribute("data-theme", initialTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("wiki_theme", newTheme);
}

// --- Loading State ---
function setLoading(isLoading) {
    if (isLoading) {
        spinnerEl.classList.remove("d-none");
    } else {
        spinnerEl.classList.add("d-none");
    }
}

// --- Search History Management ---
function updateHistoryContainer() {
    if (searchHistory.length === 0) {
        recentSearchesContainerEl.classList.add("d-none");
        return;
    }
    
    recentSearchesContainerEl.classList.remove("d-none");
    recentSearchesListEl.innerHTML = "";
    
    searchHistory.forEach((query) => {
        const chip = document.createElement("div");
        chip.className = "recent-chip";
        
        const label = document.createElement("span");
        label.textContent = query;
        label.addEventListener("click", () => {
            searchInputEl.value = query;
            triggerSearch(query);
        });
        chip.appendChild(label);
        
        const deleteBtn = document.createElement("span");
        deleteBtn.className = "recent-chip-delete";
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeFromHistory(query);
        });
        chip.appendChild(deleteBtn);
        
        recentSearchesListEl.appendChild(chip);
    });
}

function addToHistory(query) {
    // Remove if already exists to move it to the front
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase());
    searchHistory.unshift(query);
    
    // Limit to 6 items
    if (searchHistory.length > 6) {
        searchHistory.pop();
    }
    
    localStorage.setItem("wiki_search_history", JSON.stringify(searchHistory));
    updateHistoryContainer();
}

function removeFromHistory(query) {
    searchHistory = searchHistory.filter(item => item !== query);
    localStorage.setItem("wiki_search_history", JSON.stringify(searchHistory));
    updateHistoryContainer();
}

function clearHistory() {
    searchHistory = [];
    localStorage.removeItem("wiki_search_history");
    updateHistoryContainer();
}

// --- Render Search Results ---
function createAndAppendSearchResult(result) {
    const { link, title, description } = result;
    
    // Outer card
    const resultItemEl = document.createElement("div");
    resultItemEl.classList.add("result-item");
    
    // Redirect on click of card
    resultItemEl.addEventListener("click", (e) => {
        // Only open if they didn't click on an explicit link anchor (to avoid double opening)
        if (e.target.tagName !== "A") {
            window.open(link, "_blank", "noopener,noreferrer");
        }
    });

    // Title Link
    const resultTitleEl = document.createElement("a");
    resultTitleEl.classList.add("result-title");
    resultTitleEl.href = link;
    resultTitleEl.target = "_blank";
    resultTitleEl.rel = "noopener noreferrer";
    resultTitleEl.textContent = title || "Untitled article";
    resultItemEl.appendChild(resultTitleEl);

    // URL Link
    const urlEl = document.createElement("a");
    urlEl.classList.add("result-url");
    urlEl.href = link;
    urlEl.target = "_blank";
    urlEl.rel = "noopener noreferrer";
    urlEl.textContent = link;
    resultItemEl.appendChild(urlEl);

    // Description text
    const lineDescription = document.createElement("p");
    lineDescription.classList.add("line-description");
    lineDescription.textContent = description || "No description available for this article.";
    resultItemEl.appendChild(lineDescription);

    searchResultsEl.appendChild(resultItemEl);
}

function showMessage(message, className = "empty-message") {
    searchResultsEl.innerHTML = `<div class="${className}">${message}</div>`;
}

function displayResults(searchResults) {
    searchResultsEl.innerHTML = "";
    
    if (!searchResults || searchResults.length === 0) {
        showMessage("No results found. Try a different keyword.");
        return;
    }

    for (const result of searchResults) {
        createAndAppendSearchResult(result);
    }
}

// --- Fetch Data ---
function triggerSearch(query) {
    if (!query) return;
    
    searchResultsEl.innerHTML = "";
    setLoading(true);
    updateClearButtonVisibility();

    const url = `https://apis.ccbp.in/wiki-search?search=${encodeURIComponent(query)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(jsonData => {
            const results = jsonData.search_results;
            displayResults(results);
            
            // Add to history if results were found
            if (results && results.length > 0) {
                addToHistory(query);
            }
        })
        .catch(error => {
            showMessage("Unable to load search results. Please check your network connection.", "error-message");
            console.error("Search error:", error);
        })
        .finally(() => {
            setLoading(false);
        });
}

// --- Event Handlers & Input Control ---
function handleFormSubmit(event) {
    event.preventDefault();
    const query = searchInputEl.value.trim();
    
    if (query === "") {
        showMessage("Please enter a search keyword to continue.");
        return;
    }
    
    triggerSearch(query);
}

function updateClearButtonVisibility() {
    if (searchInputEl.value.length > 0) {
        clearSearchEl.classList.remove("d-none");
    } else {
        clearSearchEl.classList.add("d-none");
    }
}

function clearSearch() {
    searchInputEl.value = "";
    updateClearButtonVisibility();
    searchResultsEl.innerHTML = "";
    searchInputEl.focus();
}

function openRandomArticle() {
    window.open("https://en.wikipedia.org/wiki/Special:Random", "_blank", "noopener,noreferrer");
}

// --- Initialization ---
function init() {
    initTheme();
    updateHistoryContainer();
    updateClearButtonVisibility();
    
    // Bind Event Listeners
    searchFormEl.addEventListener("submit", handleFormSubmit);
    themeToggleEl.addEventListener("click", toggleTheme);
    clearSearchEl.addEventListener("click", clearSearch);
    randomButtonEl.addEventListener("click", openRandomArticle);
    clearHistoryBtnEl.addEventListener("click", clearHistory);
    
    searchInputEl.addEventListener("input", updateClearButtonVisibility);
}

// Run init
init();
