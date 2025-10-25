
let tableEl, tbodyEl, footerEl, theadEl;

function ensureElements() {
    tableEl  = document.getElementById("data-table");
    tbodyEl  = document.getElementById("result-table-body");
    footerEl = document.getElementById("result-footer");
    theadEl  = tableEl ? tableEl.querySelector("thead") : null;
    return !!(tableEl && tbodyEl && footerEl && theadEl);
}

export function initResultTable() {
    if (!ensureElements()) {
        console.warn("ResultTable: required DOM nodes not found. Check IDs in ResultTable.html.");
        return;
    }
    clearTable();
}

export function clearTable() {
    if (!ensureElements()) return;
    tbodyEl.innerHTML = "";
    if (theadEl) theadEl.innerHTML = `<tr><th style="border:1px solid #ddd;padding:8px;">No data</th></tr>`;
    footerEl.textContent = "0 rows affected";
}

export function renderResultTable(data = []) {
    if (!ensureElements()) {
        console.warn("ResultTable elements not found.");
        return;
    }

    tbodyEl.innerHTML = "";
    theadEl.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        theadEl.innerHTML = `<tr><th style="border:1px solid #ddd;padding:8px;">No data</th></tr>`;
        footerEl.textContent = "0 rows affected";
        switchToTab("result");
        return;
    }

    const keySet = new Set();
    for (const row of data) {
        if (row && typeof row === "object") Object.keys(row).forEach(k => keySet.add(k));
    }
    const keys = Array.from(keySet);

    const headerRow = document.createElement("tr");
    keys.forEach(key => {
        const th = document.createElement("th");
        th.textContent = key;
        th.style.border = "1px solid #ddd";
        th.style.padding = "4px";
        headerRow.appendChild(th);
    });
    theadEl.appendChild(headerRow);

    data.forEach((row, idx) => {
        const tr = document.createElement("tr");
        tr.id = `row-${idx + 1}`;
        keys.forEach(key => {
            const td = document.createElement("td");
            const val = row[key];
            td.textContent = val === undefined ? "" : String(val);
            td.style.border = "1px solid #ddd";
            td.style.padding = "4px";
            tr.appendChild(td);
        });
        tbodyEl.appendChild(tr);
    });

    footerEl.textContent = `${data.length} row${data.length === 1 ? "" : "s"} affected`;
    switchToTab("result");
}

export function showCallMessage(message) {
    const container = document.getElementById("call-message-content");
    if (!container) {
        console.warn("Call message container #call-message-content not found.");
        return;
    }
    container.textContent = message || "";
}

function switchToTab(name /* "result" | "call" */) {
    const resultBtn  = document.getElementById("result-tab");
    const callBtn    = document.getElementById("call-tab");
    const resultPane = document.getElementById("result");
    const callPane   = document.getElementById("call");

    if (window.bootstrap && window.bootstrap.Tab) {
        const btn = document.getElementById(name === "call" ? "call-tab" : "result-tab");
        if (!btn) return;
        new window.bootstrap.Tab(btn).show();
        return;
    }

    const toCall = name === "call";
    resultBtn && resultBtn.classList.toggle("active", !toCall);
    callBtn && callBtn.classList.toggle("active", toCall);
    resultPane && resultPane.classList.toggle("show", !toCall);
    resultPane && resultPane.classList.toggle("active", !toCall);
    callPane && callPane.classList.toggle("show", toCall);
    callPane && callPane.classList.toggle("active", toCall);
}
