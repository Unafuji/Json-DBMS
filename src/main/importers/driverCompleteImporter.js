// src/main/importers/driverCompleteImporter.js
const fs = require('node:fs/promises');
const { ipcMain } = require('electron');
const { getDb } = require('../db/sqlite');

const has = (o,k) => Object.prototype.hasOwnProperty.call(o || {}, k);
const get = (o,k) => (has(o,k) ? o[k] : null);
const toInt = v => (v==null || v==='') ? null : parseInt(v, 10);

/** Register IPC handler that imports DriverComplete JSON shape. */
function registerDriverCompleteImporter() {
    const db = getDb();

    const upsertDriver = db.prepare(`
    INSERT INTO drivers(driverUID, dFirstName, dLastName, dPhone)
    VALUES (@driverUID, @dFirstName, @dLastName, @dPhone)
    ON CONFLICT(driverUID) DO UPDATE SET
      dFirstName=excluded.dFirstName,
      dLastName=excluded.dLastName,
      dPhone=excluded.dPhone
  `);

    const upsertPkg = db.prepare(`
    INSERT INTO packages_complete(
      pushKey, driverUID, uid, packageID, status, receiving, date,
      assignBy, assignDate, assignLa, assignLong, assignLocation,
      completeDate, completeLa, completeLong, completeLocation,
      bankName, bankCode, senderName, senderPhone,
      phoneNumber, location, latitude, longitude,
      recLatitude, recLongitude, price, qty, note, token, chatid, paidStatus,
      raw_json
    )
    VALUES (
      @pushKey, @driverUID, @uid, @packageID, @status, @receiving, @date,
      @assignBy, @assignDate, @assignLa, @assignLong, @assignLocation,
      @completeDate, @completeLa, @completeLong, @completeLocation,
      @bankName, @bankCode, @senderName, @senderPhone,
      @phoneNumber, @location, @latitude, @longitude,
      @recLatitude, @recLongitude, @price, @qty, @note, @token, @chatid, @paidStatus,
      @raw_json
    )
    ON CONFLICT(pushKey) DO UPDATE SET
      driverUID=excluded.driverUID,
      uid=excluded.uid,
      packageID=excluded.packageID,
      status=excluded.status,
      receiving=excluded.receiving,
      date=excluded.date,
      assignBy=excluded.assignBy, assignDate=excluded.assignDate,
      assignLa=excluded.assignLa, assignLong=excluded.assignLong, assignLocation=excluded.assignLocation,
      completeDate=excluded.completeDate, completeLa=excluded.completeLa,
      completeLong=excluded.completeLong, completeLocation=excluded.completeLocation,
      bankName=excluded.bankName, bankCode=excluded.bankCode,
      senderName=excluded.senderName, senderPhone=excluded.senderPhone,
      phoneNumber=excluded.phoneNumber, location=excluded.location,
      latitude=excluded.latitude, longitude=excluded.longitude,
      recLatitude=excluded.recLatitude, recLongitude=excluded.recLongitude,
      price=excluded.price, qty=excluded.qty,
      note=excluded.note, token=excluded.token, chatid=excluded.chatid, paidStatus=excluded.paidStatus,
      raw_json=excluded.raw_json
  `);

    ipcMain.handle('db:importDriverCompleteFromPath', async (_e, filePath) => {
        if (!filePath || !filePath.toLowerCase().endsWith('.json')) {
            throw new Error('Provide a .json file');
        }
        const text = await fs.readFile(filePath, 'utf-8');
        let root;
        try { root = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON: ' + e.message); }

        if (!root || typeof root !== 'object' || Array.isArray(root)) {
            throw new Error('Expected object keyed by driverUID with child pushKey maps.');
        }

        let drivers = 0, packages = 0;

        const tx = db.transaction(() => {
            for (const [driverUID, pushMap] of Object.entries(root)) {
                if (!pushMap || typeof pushMap !== 'object') continue;

                // Infer driver fields from the first record (best-effort)
                const firstRec = Object.values(pushMap)[0] || {};
                const dFirstName = get(firstRec, 'dFirstName') || get(firstRec, 'dFirstname');
                const dLastName  = get(firstRec, 'dLastName')  || get(firstRec, 'dLastname');
                const dPhone     = get(firstRec, 'dPhone')     || get(firstRec, 'dPhoneNumber');

                const dInfo = upsertDriver.run({ driverUID, dFirstName, dLastName, dPhone });
                if (dInfo.changes) drivers++;

                for (const [pushKey, rec] of Object.entries(pushMap)) {
                    if (!rec || typeof rec !== 'object') continue;

                    const row = {
                        pushKey,
                        driverUID,
                        uid: get(rec, 'uid'),
                        packageID: get(rec, 'packageID'),
                        status: get(rec, 'status'),
                        receiving: get(rec, 'receiving'),
                        date: get(rec, 'date'),

                        assignBy: get(rec, 'assignBy'),
                        assignDate: get(rec, 'assignDate'),
                        assignLa: get(rec, 'assignLa'),
                        assignLong: get(rec, 'assignLong'),
                        assignLocation: get(rec, 'assignLocation'),

                        completeDate: get(rec, 'completeDate'),
                        completeLa: get(rec, 'completeLa'),
                        completeLong: get(rec, 'completeLong'),
                        completeLocation: get(rec, 'completeLocation'),

                        bankName: get(rec, 'bankName'),
                        bankCode: get(rec, 'bankCode'),
                        senderName: get(rec, 'senderName'),
                        senderPhone: get(rec, 'senderPhone'),

                        phoneNumber: get(rec, 'phoneNumber'),
                        location: get(rec, 'location'),
                        latitude: get(rec, 'latitude'),
                        longitude: get(rec, 'longitude'),
                        recLatitude: get(rec, 'recLatitude'),
                        recLongitude: get(rec, 'recLongitude'),

                        price: (rec.price==null ? null : Number(rec.price)),
                        qty: toInt(rec.qty),

                        note: get(rec, 'note'),
                        token: get(rec, 'token'),
                        chatid: get(rec, 'chatid'),
                        paidStatus: get(rec, 'paidStatus'),

                        raw_json: JSON.stringify(rec)
                    };

                    const info = upsertPkg.run(row);
                    if (info.changes) packages++;
                }
            }
        });
        tx();

        return { drivers, packages };
    });
}

module.exports = { registerDriverCompleteImporter };
