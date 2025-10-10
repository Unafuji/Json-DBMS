export async function loadComponent(containerId, htmlPath, cssPath, jsPath, initFuncName) {
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
