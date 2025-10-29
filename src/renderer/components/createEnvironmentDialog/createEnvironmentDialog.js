// Elements
const localFields = document.getElementById('localFields');
const apiFields = document.getElementById('apiFields');
const typeRadios = document.querySelectorAll('input[name="envType"]');
const cancelBtn = document.getElementById('cancelBtn');
const createBtn = document.getElementById('createBtn');

// Toggle fields based on environment type
typeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.value === 'local') {
            localFields.classList.remove('hidden');
            apiFields.classList.add('hidden');
        } else {
            localFields.classList.add('hidden');
            apiFields.classList.remove('hidden');
        }
    });
});

// Cancel button closes the dialog
cancelBtn.addEventListener('click', () => {
    window.close();
});

// Create button collects data
createBtn.addEventListener('click', () => {
    const envData = {
        name: document.getElementById('envName').value.trim(),
        type: document.querySelector('input[name="envType"]:checked').value,
        localPath: document.getElementById('localPath').value.trim(),
        apiUrl: document.getElementById('apiUrl').value.trim(),
        apiHeaders: document.getElementById('apiHeaders').value.trim()
    };

    console.log('Environment Data:', envData);

    // TODO: send envData to main/renderer process via ipcRenderer
    window.close();
});
