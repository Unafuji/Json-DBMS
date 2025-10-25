export function setupResizers() {
    const sidebar = document.getElementById('sidebar-container');
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const queryEditor = document.getElementById('queryeditor-container');
    const tableResizer = document.getElementById('table-resizer');
    const resultTable = document.getElementById('resulttable-container');
    const innerResizer = document.getElementById('sidebar-inner-resizer');
    const collectionContainer = document.getElementById('collection-container');
    const respondContainer = document.getElementById('respond-container');

    if (!sidebar || !sidebarResizer || !queryEditor || !tableResizer || !resultTable) {
        console.error('One or more resizer elements not found');
        return;
    }

    if (innerResizer && collectionContainer && respondContainer) {
        const sidebarHeight = () => sidebar.clientHeight;

        innerResizer.addEventListener('mousedown', function (e) {
            e.preventDefault();
            document.body.style.userSelect = 'none';

            function onMouseMove(ev) {
                const sidebarTop = sidebar.getBoundingClientRect().top;
                const mouseY = ev.clientY;
                const newHeight = mouseY - sidebarTop;

                const minHeight = 50;
                const maxHeight = sidebarHeight() - 100;
                const finalHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

                collectionContainer.style.height = finalHeight + 'px';
            }

            function onMouseUp() {
                document.body.style.userSelect = '';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }

    const savedSidebar = localStorage.getItem('sidebarWidth');
    if (savedSidebar) sidebar.style.width = savedSidebar;

    const savedQE = localStorage.getItem('queryEditorHeight');
    if (savedQE) queryEditor.style.height = savedQE;

    sidebarResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        document.body.style.userSelect = 'none';

        const layoutLeft = sidebar.parentElement.getBoundingClientRect().left;
        const minWidth = 150;
        const maxWidth = 400;

        function onMouseMove(ev) {
            let newWidth = ev.clientX - layoutLeft;
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

    sidebarResizer.addEventListener('dblclick', () => {
        sidebar.style.width = '280px';
        localStorage.setItem('sidebarWidth', '280px');
    });

    tableResizer.addEventListener('mousedown', function (e) {
        e.preventDefault();
        document.body.style.userSelect = 'none';

        const container = queryEditor.parentElement;
        const handleHeight = tableResizer.offsetHeight;
        const minEditorHeight = 100;
        const minResultHeight = 100;

        function onMouseMove(ev) {
            const containerRect = container.getBoundingClientRect();
            const totalHeight = container.clientHeight;

            let editorHeight = ev.clientY - containerRect.top;

            const maxEditorHeight = totalHeight - handleHeight - minResultHeight;
            if (editorHeight < minEditorHeight) editorHeight = minEditorHeight;
            if (editorHeight > maxEditorHeight) editorHeight = maxEditorHeight;

            queryEditor.style.height = editorHeight + 'px';
            resultTable.style.flex = '1';
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
