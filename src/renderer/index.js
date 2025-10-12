const fileEl = document.getElementById('file');
const startBtn = document.getElementById('start');
const cancelBtn = document.getElementById('cancel');
const countEl = document.getElementById('count');
const previewEl = document.getElementById('preview');

let total = 0;
let previewed = 0;
const MAX_PREVIEW = 20;
const TEST_MODE = true; // set to false for real file streaming

function credit() { window.stream?.credit(); }

// Hard assert: if preload failed, abort now with a clear message
if (!window.stream) {
    previewEl.textContent = '[fatal] preload bridge missing (window.stream is undefined). Fix webPreferences or preload.js.';
    // Do not proceed.
}

window.stream?.onChunk(chunk => {
    console.log('onChunk', chunk.length);
    total += chunk.length;
    countEl.textContent = String(total);
    for (const row of chunk) {
        if (previewed < MAX_PREVIEW) {
            previewEl.textContent += JSON.stringify(row).slice(0, 400) + '\n';
            previewed++;
        }
    }
    credit();
});

window.stream?.onDone(stats => {
    console.log('onDone', stats || {});
    previewEl.textContent += '\n[done]';
});

window.stream?.onError(err => {
    console.error('onError', err);
    previewEl.textContent += `\n[error] ${err}`;
});

startBtn.onclick = async () => {
    total = 0;
    previewed = 0;
    countEl.textContent = '0';
    previewEl.textContent = TEST_MODE ? '[test mode]\n' : '';

    if (TEST_MODE) {
        // Synthetic stream to prove IPC + credits
        await window.stream.startTest();                 // <-- correct API
        for (let i = 0; i < 4; i++) window.stream.credit();
        return;
    }

    // REAL FILE STREAM
    const f = fileEl.files?.[0];
    if (!f || !f.path) { previewEl.textContent = 'Pick a file.'; return; }
    console.log('file chosen:', f.path);

    await window.stream.startFile(f.path, { batchSize: 1000, maxInFlight: 6 });
    for (let i = 0; i < 6; i++) window.stream.credit();
};
cancelBtn.onclick = () => window.stream?.cancel();
