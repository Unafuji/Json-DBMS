export async function loadComponent(containerId, htmlPath, cssPath, jsPath, initFuncName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        if (htmlPath) {
            const html = await fetch(htmlPath).then(r => r.text());
            container.innerHTML = html;
        }
        if (cssPath) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
        }

        if (jsPath && initFuncName) {
            const module = await import(jsPath);
            const fn = module[initFuncName];
            if (typeof fn === 'function') {
                fn();
            } else {
                container.innerHTML = `<div style="color:#fff;background:#d32f2f;padding:8px;border-radius:4px;">
                    Init function <b>${initFuncName}</b> not found in <code>${jsPath}</code>
                </div>`;
                console.error(`Function ${initFuncName} not found in ${jsPath}`);
            }
        }
    } catch (err) {
        container.innerHTML = `<div style="color:#fff;background:#d32f2f;padding:8px;border-radius:4px;">
            Component failed to load: ${err.message}
        </div>`;
        console.error(err);
    }
}
