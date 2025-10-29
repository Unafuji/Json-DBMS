import { setupResizers } from '../utils/layout-resize.js';
import { initTopBar } from '../components/TopBar/TopBar.js';
import { initQueryEditor } from '../components/QueryEditor/QueryEditor.js';
import { initResultTable } from '../components/ResultTable/ResultTable.js';
import { initCollection } from '../components/Collections/Collection.js';
import { initResponds } from '../components/Responds/Respond.js';
import { initQueryBar } from '../components/QueryBar/QueryBar.js';

document.addEventListener('DOMContentLoaded', () => {
    setupResizers();
    initTopBar();
    initQueryEditor();
    initResultTable();
    initCollection();
    initResponds();
    initQueryBar();
    setupStreamHandlers();
});

function setupStreamHandlers() {
    document.addEventListener('stream:open', async (e) => {
        const {filePath} = e.detail;
        console.log('[renderer] Starting stream for:', filePath);

        try {
            await window.stream.openJson(filePath);
        } catch (err) {
            console.error('[renderer] Stream open failed:', err);
        }
    });

    window.stream.onChunk((chunk) => {
        console.debug('[renderer] Streamed chunk:', chunk);

        const event = new CustomEvent('stream:chunk', {detail: chunk});
        document.dispatchEvent(event);
    });
    window.stream.onEnd(() => {
        console.log('[renderer] Stream finished.');
        document.dispatchEvent(new Event('stream:end'));
    });
    window.stream.onError((err) => {
        console.error('[renderer] Stream error:', err);
        document.dispatchEvent(new CustomEvent('stream:error', {detail: err}));
    });
}
