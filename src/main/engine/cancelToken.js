function makeCancelToken() {
    let cancelled = false;
    return {
        cancel: () => { cancelled = true; },
        throwIfCancelled: () => { if (cancelled) throw new Error('Cancelled'); },
        dispose: () => { cancelled = true; }
    };
}
module.exports = { makeCancelToken };
