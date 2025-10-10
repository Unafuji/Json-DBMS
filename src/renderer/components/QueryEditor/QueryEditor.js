export function initQueryEditor() {
    const textarea = document.getElementById('query-textarea');
    const runBtn = document.querySelector('.send-query-btn');

    if (!runBtn || !textarea) {
        console.error('Run button or textarea not found');
        return;
    }

    runBtn.addEventListener('click', () => {
        const query = textarea.value.trim();
        if (!query) {
            return;
        }

        runCustomQuery(query);
    });
}

function runCustomQuery(queryText) {
    const trimmed = queryText.trim();
    const [command] = trimmed.split(/\s+/);
    const payload = trimmed.slice(command.length).trim();

    switch (command.toUpperCase()) {
        case "SELECT":
            handleSelect(payload);
            break;
        case "UPDATE":
            // TODO: Implement update logic here
            alert("UPDATE not implemented yet");
            break;
        default:
            alert("Unsupported command");
    }
}

// Simple parser to get columns and table name
function parseSelect(payload) {
    // Example: "* FROM customers" or "CUSTOMER_ID, NAME FROM customers"
    const fromIndex = payload.toUpperCase().indexOf("FROM");
    if (fromIndex === -1) return null;

    const columnsPart = payload.substring(0, fromIndex).trim();
    const tablePart = payload.substring(fromIndex + 4).trim();

    const columns = columnsPart === "*" ? "*" : columnsPart.split(",").map(c => c.trim().toUpperCase());
    const table = tablePart.toLowerCase(); // assuming lowercase keys in window.database

    return { columns, table };
}

async  function  handleSelect(payload) {
    const parsed = parseSelect(payload);
    if (!parsed) {
        alert("Invalid SELECT syntax. Use: SELECT <columns> FROM <table>");
        return;
    }

    const { columns, table } = parsed;
    const data = window.database && window.database[table];
    if (!data) {
        alert(`Table "${table}" not found in database`);
        return;
    }

    let result;
    if (columns === "*") {
        result = data;
    } else {
        result = data.map(row => {
            let filtered = {};
            columns.forEach(col => {
                filtered[col] = row[col] !== undefined ? row[col] : null;
            });
            return filtered;
        });
    }

    // Show results in your ResultTable component
    const { renderResultTable } = await import('../ResultTable/ResultTable.js');
    renderResultTable(result);
}
