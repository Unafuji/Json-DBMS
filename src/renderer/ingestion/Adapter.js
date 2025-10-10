

export class AdapterRegistry {
    constructor(adapters = []) { this.adapters = adapters; }
    register(adapter) { this.adapters.push(adapter); }
    find(source) { return this.adapters.find(a => a.canHandle(source)); }

    async fetch(source, options = {}) {
        const ad = this.find(source);
        if (!ad) throw new Error(`No adapter can handle: ${source}`);
        const result = await ad.fetch(source, options);
        const rows = ad.normalize ? ad.normalize(result.data, options) : result.data;
        return { rows, meta: { source, count: rows.length, ...(result.meta||{}) } };
    }
}

export const isJsonMime = (m) => /^application\/(json|x-ndjson)$|^text\/plain$/.test(m || "");
export const parseNdjson = (text) => text.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
