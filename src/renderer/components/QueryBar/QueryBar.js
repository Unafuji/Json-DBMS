import { renderResultTable, showCallMessage } from "../ResultTable/ResultTable.js";
import { normalizeForTable } from "../../utils/normalize.js";
import {addCollection} from "../Collections/Collection.js";

async function loadLocalJson(filePath) {
    try {
        const response = await fetch(`file:///${filePath.replace(/\\/g, "/")}`);
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        const data = await response.json();
        const table = normalizeForTable(data);
        renderResultTable(table);
        showCallMessage(`Loaded ${table.length} rows from local file: ${filePath}`);
        addCollection(filePath);
    } catch (err) {
        console.error("Local file load error:", err);
        alert(`Error: ${err.message}`);
        showCallMessage(`Error: ${err.message}`);
    }
}

async function loadLocalFileObject(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        const table = normalizeForTable(data);
        renderResultTable(table);
        showCallMessage(`Loaded ${table.length} rows from ${file.name}`);
        addCollection(file.name);

    } catch (err) {
        console.error(err);
        alert(`Failed to read file: ${err.message}`);
        showCallMessage(`Failed to read file: ${err.message}`);
    }
}

export function initQueryBar() {
    const methodSelect = document.getElementById("http-method");
    const queryInput = document.getElementById("query-input");
    const sendButton = document.getElementById("send-query");
    const filePicker = document.getElementById("local-file");

    if (!methodSelect || !queryInput || !sendButton) {
        console.warn("QueryBar elements missing");
        return;
    }

    sendButton.addEventListener("click", async () => {
        const method = methodSelect.value || "GET";
        const value = queryInput.value.trim();

        if (!value) {
            alert("Enter an HTTP URL or pick a local file.");
            return;
        }

        if (/^(?:[a-zA-Z]:\\|\\\\|file:\/{2})/.test(value)) {
            await loadLocalJson(value);
        } else {
            await fetchAndRenderEndpoint(value, method);
        }
    });

    if (filePicker) {
        filePicker.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (file) await loadLocalFileObject(file);
        });
    }
}

export async function openAndShow(url) {
    const meta = await window.dbms.openSource({ url, formatHint: "auto" });
    const total = await window.dbms.rowCount();
    const cols = await window.dbms.columns();
    await showPage(0, cols, total);
}

let currentOffset = 0;
const PAGE = 100;

async function showPage(offset, cols, total) {
    const rows = await window.dbms.queryPage({
        offset,
        limit: PAGE,
        sort: [{ col: "createdAt", dir: "desc" }],
        filter: {} // plug in UI filters
    });

    worker.postMessage({ rows, cols }); // worker will normalize
    currentOffset = offset;
    updatePager({ offset, pageSize: PAGE, total });
}

export async function fetchAndRenderEndpoint(url, method = "GET") {
    const { small, data } = await window.dbms.maybeSmall(url, { method });
    if (!small) return openAndShow(url);
    // small path: still virtualize
    worker.postMessage({ rows: Array.isArray(data) ? data : [data], cols: null });
}

document.addEventListener("DOMContentLoaded", initQueryBar);
