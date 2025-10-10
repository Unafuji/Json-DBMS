async function loadComponent(containerId, htmlPath, cssPath, jsPath, initFuncName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const htmlURL = htmlPath ? new URL(htmlPath, window.location.href) : null;
        const cssURL = cssPath ? new URL(cssPath, window.location.href) : null;
        const jsURL = jsPath ? new URL(jsPath, window.location.href) : null;

        if (htmlURL) {
            const res = await fetch(htmlURL);
            if (!res.ok) throw new Error(`Failed to fetch ${htmlURL} (${res.status})`);
            container.innerHTML = await res.text();
        }

        if (cssURL) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssURL.href;
            document.head.appendChild(link);
        }

        if (jsURL && initFuncName) {
            const module = await import(jsURL.href);
            const fn = module[initFuncName];
            if (typeof fn === 'function') {
                fn();
            } else {
                container.innerHTML = `<div style="color:#fff;background:#d32f2f;padding:8px;border-radius:4px;">
          Init function <b>${initFuncName}</b> not found in <code>${jsURL.pathname}</code>
        </div>`;
                console.error(`Function ${initFuncName} not found in ${jsURL.href}`);
            }
        }
    } catch (err) {
        container.innerHTML = `<div style="color:#fff;background:#d32f2f;padding:8px;border-radius:4px;">
      Component failed to load: ${err.message}
    </div>`;
        console.error(err);
    }
}

function setupResizers() {
    // GET ELEMENTS (all must exist)
    const sidebar = document.getElementById('sidebar-container');
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const queryEditor = document.getElementById('queryeditor-container');
    const tableResizer = document.getElementById('table-resizer');
    const resultTable = document.getElementById('resulttable-container');
    const querybar = document.getElementById('query-bar');

    if (!sidebar || !sidebarResizer || !queryEditor || !tableResizer || !resultTable) {
        console.error('One or more resizer elements not found');
        return;
    }

    // Restore persisted sizes (optional but recommended)
    const savedSidebar = localStorage.getItem('sidebarWidth');
    if (savedSidebar) sidebar.style.width = savedSidebar;
    const savedQE = localStorage.getItem('queryEditorHeight');
    if (savedQE) queryEditor.style.height = savedQE;

    // --- SIDE BAR WIDTH (drag left-right) ---
    sidebarResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        document.body.style.userSelect = 'none';

        const layoutLeft = sidebar.parentElement.getBoundingClientRect().left;
        const minWidth = 150;
        const maxWidth = 400;

        function onMouseMove(ev) {
            let newWidth = ev.clientX - layoutLeft; // width relative to layout
            if (newWidth < minWidth) newWidth = minWidth;
            if (newWidth > maxWidth) newWidth = maxWidth;
            sidebar.style.width = newWidth + 'px';
        }

        function onMouseUp() {
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            localStorage.setItem('sidebarWidth', sidebar.style.width);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    // Optional: double-click to snap width
    sidebarResizer.addEventListener('dblclick', () => {
        sidebar.style.width = '280px';
        localStorage.setItem('sidebarWidth', '280px');
    });

    // --- TABLE HEIGHT (drag up-down) ---
    tableResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        document.body.style.userSelect = 'none';

        const container = queryEditor.parentElement;

        function onMouseMove(ev) {
            const top = container.getBoundingClientRect().top;
            const total = container.clientHeight;
            const handle = tableResizer.offsetHeight;
            const min = 100;
            let qe = ev.clientY - top;

            const max = total - min - handle;
            if (qe < min) qe = min;
            if (qe > max) qe = max;

            queryEditor.style.height = qe + 'px';
        }

        function onMouseUp() {
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            localStorage.setItem('queryEditorHeight', queryEditor.style.height);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    setupResizers();
    loadComponent(
        'topbar-container',
        './src/renderer/components/TopBar/TopBar.html',
        './src/renderer/components/TopBar/TopBar.css',
        './src/renderer/components/TopBar/TopBar.js',
        'initTopBar'
    );
    loadComponent(
        'queryeditor-container',
        './src/renderer/components/QueryEditor/QueryEditor.html',
        './src/renderer/components/QueryEditor/QueryEditor.css',
        './src/renderer/components/QueryEditor/QueryEditor.js',
        'initQueryEditor'
    );
    loadComponent(
        'resulttable-container',
        './src/renderer/components/ResultTable/ResultTable.html',
        null,
        './src/renderer/components/ResultTable/ResultTable.js',
        'initResultTable' // or 'renderResultTable'
    );
    loadComponent(
        'collection-container',
        './src/renderer/components/Collections/Collection.html',
        './src/renderer/components/Collections/Collection.css',
        './src/renderer/components/Collections/Collection.js',
        'initCollection'
    );
    loadComponent(
        'respond-container',
        './src/renderer/components/Responds/Respond.html',
        './src/renderer/components/Responds/Respond.css',
        './src/renderer/components/Responds/Respond.js',
        'initResponds'
    );
    // QueryBar
    loadComponent(
        'query-bar',
        './src/renderer/components/QueryBar/QueryBar.html',
        './src/renderer/components/QueryBar/QueryBar.css',
        './src/renderer/components/QueryBar/QueryBar.js',
        'initQueryBar'
    );


});