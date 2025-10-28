import { renderResultTable, showCallMessage } from "../ResultTable/ResultTable.js";
import { normalizeForTable } from "../../../utils/normalize.js";
import { addCollection } from "../Collections/Collection.js";

async function streamLocalJson(filePath) {
    try {
        console.log("[QueryBar] Starting stream for:", filePath);
        showCallMessage(`Streaming data from ${filePath}...`);
        addCollection(filePath);

        const rows = [];

        const onChunk = (chunk) => {
            rows.push(chunk);
            if (rows.length % 1000 === 0) {
                const partialTable = normalizeForTable(rows);
                renderResultTable(partialTable);
            }
        };

        const onEnd = () => {
            const table = normalizeForTable(rows);
            renderResultTable(table);
            showCallMessage(`Finished streaming ${rows.length} rows from ${filePath}`);
            console.log("[QueryBar] Stream finished.");
            cleanup();
        };

        const onError = (err) => {
            console.error("[QueryBar] Stream error:", err);
            alert(`Stream error: ${err}`);
            showCallMessage(`Error streaming ${filePath}: ${err}`);
            cleanup();
        };

        const cleanup = () => {
            window.stream.offChunk?.(onChunk);
            window.stream.offEnd?.(onEnd);
            window.stream.offError?.(onError);
        };

        window.stream.onChunk(onChunk);
        window.stream.onEnd(onEnd);
        window.stream.onError(onError);

        await window.stream.openJson(filePath);
    } catch (err) {
        console.error("Stream load error:", err);
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

export async function fetchAndRenderEndpoint(url, method = "GET") {
    const { data } = await window.dbms.maybeSmall(url, { method });
    worker.postMessage({ rows: Array.isArray(data) ? data : [data], cols: null });
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
            await streamLocalJson(value);
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

document.addEventListener("DOMContentLoaded", initQueryBar);
