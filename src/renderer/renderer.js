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
