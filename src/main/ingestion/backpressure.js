export class BackpressureGate {
    constructor({ highWater = 5000, lowWater = 2000 }) {
        this.high = highWater;
        this.low = lowWater;
        this.buffered = 0;
        this.onPause = null;
        this.onResume = null;
    }
    inc(n=1){ this.buffered += n; if (this.buffered >= this.high && this.onPause) this.onPause(); }
    dec(n=1){ this.buffered -= n; if (this.buffered <= this.low && this.onResume) this.onResume(); }
    attach({ onPause, onResume }) { this.onPause = onPause; this.onResume = onResume; }
}
