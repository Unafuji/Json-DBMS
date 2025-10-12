import {fetchAndRenderEndpoint} from '../QueryBar/QueryBar.js';
import {clearTable} from '../ResultTable/ResultTable.js';

const collections = [];

function renderCollections() {
    const collectionsList = document.querySelector(".tree-menu ul.nested");
    if (!collectionsList) return;

    collectionsList.innerHTML = "";

    collections.forEach((endpoint, index) => {
        const li = document.createElement("li");
        li.className = "d-flex align-items-center justify-content-between position-relative";

        // LEFT SIDE: Text with truncation
        const leftSpan = document.createElement("div");
        leftSpan.className = "text-truncate me-2 flex-grow-1";
        leftSpan.style.maxWidth = "180px"; // Adjust as needed
        leftSpan.title = endpoint; // Show full text on hover
        leftSpan.innerHTML = `<span class="icon file-icon"></span> ${endpoint}`;
        leftSpan.style.cursor = "pointer";

        leftSpan.addEventListener("click", () => {
            const queryInput = document.getElementById("query-input");
            if (queryInput) {
                queryInput.value = endpoint;
            }
            clearTable();
        });

        // RIGHT SIDE: 3-dot menu button
        const menuBtn = document.createElement("button");
        menuBtn.className = "btn btn-sm p-1 border-0 bg-transparent";
        menuBtn.innerHTML = `<i class="bi bi-three-dots-vertical"></i>`;
        menuBtn.style.cursor = "pointer";

        // Dropdown menu
        const menu = document.createElement("div");
        menu.className = "dropdown-menu p-1 show";
        menu.style.position = "absolute";
        menu.style.top = "100%";
        menu.style.right = "0";
        menu.style.display = "none";
        menu.innerHTML = `<button class="dropdown-item text-danger btn-sm">Delete</button>`;

        // Toggle dropdown menu
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === "none" ? "block" : "none";
        });

        // Close on outside click
        document.addEventListener("click", () => {
            menu.style.display = "none";
        });

        // Handle delete
        menu.querySelector("button").addEventListener("click", () => {
            collections.splice(index, 1);
            localStorage.setItem("savedCollections", JSON.stringify(collections));
            renderCollections();
        });

        // Wrap right controls
        const rightControls = document.createElement("div");
        rightControls.className = "position-relative";
        rightControls.appendChild(menuBtn);
        rightControls.appendChild(menu);

        // Final append
        li.appendChild(leftSpan);       // ✅ This is the truncated text
        li.appendChild(rightControls); // ✅ This is the vertical dots + menu
        collectionsList.appendChild(li);
    });
}
/// (1)
export function addCollection(endpoint) {
    debugger
    if (!collections.includes(endpoint)) {
        collections.push(endpoint);
        localStorage.setItem("savedCollections", JSON.stringify(collections));
        renderCollections();
    }
}

export function initCollection() {
    debugger
    const saved = localStorage.getItem("savedCollections");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                collections.push(...parsed);
            }
        } catch (e) {
            console.error("Failed to parse saved collections:", e);
        }
    }

    renderCollections();

    const caretItems = document.querySelectorAll(".tree-menu .caret");
    caretItems.forEach(caret => {
        caret.addEventListener("click", function () {
            this.classList.toggle("caret-down");
            const nested = this.nextElementSibling;
            if (nested && nested.classList.contains("nested")) {
                nested.classList.toggle("active");
            }
        });
    });
}

export function clearCollections() {
    debugger
    collections.length = 0;
    localStorage.removeItem("savedCollections");
    renderCollections();
}