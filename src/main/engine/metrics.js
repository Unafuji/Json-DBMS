function startTimer() {
    const t0 = Date.now();
    return { end: () => ({ totalMs: Date.now() - t0 }) };
}
module.exports = { startTimer };
