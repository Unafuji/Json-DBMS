export function setupResizers() {
    const sidebar = document.getElementById('sidebar-container');
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const queryEditor = document.getElementById('queryeditor-container');
    const tableResizer = document.getElementById('table-resizer');
    const resultTable = document.getElementById('resulttable-container');

    if (!sidebar || !sidebarResizer || !queryEditor || !tableResizer || !resultTable) {
        console.error('One or more resizer elements not found');
        return;
    }

    const savedSidebar = localStorage.getItem('sidebarWidth');
    if (savedSidebar) sidebar.style.width = savedSidebar;
    const savedQE = localStorage.getItem('queryEditorHeight');
    if (savedQE) queryEditor.style.height = savedQE;

    sidebarResizer.addEventListener('mousedown', e => {
        e.preventDefault();
        document.body.style.userSelect = 'none';
        const layoutLeft = sidebar.parentElement.getBoundingClientRect().left;
        const minWidth = 150;
        const maxWidth = 400;

        function onMouseMove(ev) {
            let newWidth = ev.clientX - layoutLeft;
            newWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
            sidebar.style.width = `${newWidth}px`;
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

    sidebarResizer.addEventListener('dblclick', () => {
        sidebar.style.width = '280px';
        localStorage.setItem('sidebarWidth', '280px');
    });

    tableResizer.addEventListener('mousedown', e => {
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
            qe = Math.min(Math.max(qe, min), max);
            queryEditor.style.height = `${qe}px`;
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
