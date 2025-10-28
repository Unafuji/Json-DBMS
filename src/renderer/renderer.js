import {loadComponent} from '../utils/loadComponent.js';
import {setupResizers} from '../utils/resizers.js';

document.addEventListener('DOMContentLoaded', () => {
    setupResizers();
    loadComponent('topbar-container', './components/TopBar/TopBar.html', './components/TopBar/TopBar.css', './components/TopBar/TopBar.js', 'initTopBar');
    loadComponent('queryeditor-container', './components/QueryEditor/QueryEditor.html', './components/QueryEditor/QueryEditor.css', './components/QueryEditor/QueryEditor.js', 'initQueryEditor');
    loadComponent('resulttable-container', './components/ResultTable/ResultTable.html', null, './components/ResultTable/ResultTable.js', 'initResultTable');
    loadComponent('collection-container', './components/Collections/Collection.html', './components/Collections/Collection.css', './components/Collections/Collection.js', 'initCollection');
    loadComponent('respond-container', './components/Responds/Respond.html', './components/Responds/Respond.css', './components/Responds/Respond.js', 'initResponds');
    loadComponent('query-bar', './components/QueryBar/QueryBar.html', './components/QueryBar/QueryBar.css', './components/QueryBar/QueryBar.js', 'initQueryBar');

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
