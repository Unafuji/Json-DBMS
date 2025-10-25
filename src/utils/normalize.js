function isPlainObject(o) {
    return o && typeof o === "object" && !Array.isArray(o);
}

export function normalizeForTable(input) {
    if (input == null) return [];

    if (Array.isArray(input)) {
        return input.map(safeFlattenOneLevel);
    }

    if (isPlainObject(input)) {
        if (Array.isArray(input.package)) {
            const meta = {...input};
            delete meta.package;
            return input.package
                .filter(isPlainObject)
                .map(item => safeFlattenOneLevel({...meta, ...item}));
        }

        const keys = Object.keys(input);

        const looksLikeUserMap = keys.every(k => isPlainObject(input[k]));
        if (looksLikeUserMap) {
            const rows = [];
            for (const uid of keys) {
                const node = input[uid] || {};
                const {package: pkg, ...userMeta} = node;

                if (Array.isArray(pkg)) {
                    for (const item of pkg) {
                        if (isPlainObject(item)) {
                            // prefer item.pushKey if present
                            rows.push(safeFlattenOneLevel({uid, ...userMeta, ...item}));
                        }
                    }
                    continue;
                }

                if (isPlainObject(pkg)) {
                    // package is OBJECT-of-objects
                    for (const pushKey of Object.keys(pkg)) {
                        const item = pkg[pushKey];
                        if (isPlainObject(item)) {
                            rows.push(safeFlattenOneLevel({uid, pushKey, ...userMeta, ...item}));
                        }
                    }
                    continue;
                }

                if (Object.keys(userMeta).length) {
                    rows.push(safeFlattenOneLevel({uid, ...userMeta}));
                }
            }
            return rows;
        }

        const valuesAreObjects = Object.values(input).every(isPlainObject);
        if (valuesAreObjects) {
            const rows = [];
            for (const key of Object.keys(input)) {
                rows.push(safeFlattenOneLevel({key, ...input[key]}));
            }
            return rows;
        }

        return [safeFlattenOneLevel(input)];
    }

    return [{value: String(input)}];
}

function safeFlattenOneLevel(row) {
    const out = {};
    for (const k of Object.keys(row)) {
        const v = row[k];
        if (v == null) {
            out[k] = "";
            continue;
        }
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
            out[k] = v;
        } else {
            out[k] = JSON.stringify(v);
        }
    }
    return out;
}
