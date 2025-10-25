// src/renderer/utils/normalize.js

function isPlainObject(o) {
    return o && typeof o === "object" && !Array.isArray(o);
}

/**
 * Normalize arbitrary JSON (esp. Firebase RTDB) into an array of flat-ish rows.
 * Handles:
 *  - Root array of objects
 *  - Object-of-objects: { key: { ... } }
 *  - User node with package as OBJECT:  { uid: { package: { pushKey: {...} } } }
 *  - User node with package as ARRAY:   { uid: { package: [ {...}, {...} ], ...userFields } }
 *  - Root node with package as ARRAY:   { package: [ {...} ], ...meta }
 */
export function normalizeForTable(input) {
    if (input == null) return [];

    // CASE 0: already an array of rows -> flatten one level
    if (Array.isArray(input)) {
        return input.map(safeFlattenOneLevel);
    }

    // CASE 1: plain object -> sniff structures
    if (isPlainObject(input)) {
        // 1A) Root has a 'package' array → promote items, carry root meta fields
        if (Array.isArray(input.package)) {
            const meta = { ...input };
            delete meta.package;
            return input.package
                .filter(isPlainObject)
                .map(item => safeFlattenOneLevel({ ...meta, ...item }));
        }

        const keys = Object.keys(input);

        // 1B) User map where each value may have package ARRAY or OBJECT
        const looksLikeUserMap = keys.every(k => isPlainObject(input[k]));
        if (looksLikeUserMap) {
            const rows = [];
            for (const uid of keys) {
                const node = input[uid] || {};
                const { package: pkg, ...userMeta } = node;

                if (Array.isArray(pkg)) {
                    // package is ARRAY
                    for (const item of pkg) {
                        if (isPlainObject(item)) {
                            // prefer item.pushKey if present
                            rows.push(safeFlattenOneLevel({ uid, ...userMeta, ...item }));
                        }
                    }
                    continue;
                }

                if (isPlainObject(pkg)) {
                    // package is OBJECT-of-objects
                    for (const pushKey of Object.keys(pkg)) {
                        const item = pkg[pushKey];
                        if (isPlainObject(item)) {
                            rows.push(safeFlattenOneLevel({ uid, pushKey, ...userMeta, ...item }));
                        }
                    }
                    continue;
                }

                // No package, but still a user node with fields → emit one row
                if (Object.keys(userMeta).length) {
                    rows.push(safeFlattenOneLevel({ uid, ...userMeta }));
                }
            }
            return rows;
        }

        // 1C) Generic object-of-objects: { key1: {...}, key2: {...} }
        const valuesAreObjects = Object.values(input).every(isPlainObject);
        if (valuesAreObjects) {
            const rows = [];
            for (const key of Object.keys(input)) {
                rows.push(safeFlattenOneLevel({ key, ...input[key] }));
            }
            return rows;
        }

        // 1D) Single object row
        return [safeFlattenOneLevel(input)];
    }

    // CASE 2: primitives → single-cell row
    return [{ value: String(input) }];
}

/**
 * Flatten one level: primitives pass through; nested objects/arrays → JSON string.
 */
function safeFlattenOneLevel(row) {
    const out = {};
    for (const k of Object.keys(row)) {
        const v = row[k];
        if (v == null) { out[k] = ""; continue; }
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
            out[k] = v;
        } else {
            out[k] = JSON.stringify(v);
        }
    }
    return out;
}
