import { setupResizers } from '../core/resizer.js';
import { loadComponent } from '../core/loader.js';

document.addEventListener('DOMContentLoaded', () => {
    setupResizers();

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
        'initResultTable'
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

    loadComponent(
        'query-bar',
        './src/renderer/components/QueryBar/QueryBar.html',
        './src/renderer/components/QueryBar/QueryBar.css',
        './src/renderer/components/QueryBar/QueryBar.js',
        'initQueryBar'
    );

    loadComponent(
        'tool-bar',
        './src/renderer/components/toolbar/toolbar.html',
        './src/renderer/components/toolbar/toolbar.css',
        'initQueryBar'
    );
});
