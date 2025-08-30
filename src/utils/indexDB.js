let db = null;
import _ from "lodash";

export default function dbtransaction() {
  function initDB(tableList) {
    return new Promise((resolve, reject) => {
      const record_events_connection = indexedDB.open("replay_map_data", 2);

      record_events_connection.onupgradeneeded = function () {
        db = record_events_connection.result;
        for (const table of tableList) {
          if (!db.objectStoreNames.contains(table)) {
            db.createObjectStore(table, {
              autoIncrement: true,
            });
            console.log(`${table} créé`);
          }
        }
      };

      record_events_connection.onerror = () => {
        console.log(record_events_connection.error);

        reject(record_events_connection.error);
      };

      record_events_connection.onsuccess = () => {
        db = record_events_connection.result;
        db.onversionchange = () => {
          db.close();
          alert("Database is outdated, please reload the page.");
        };
        console.log("record_events_connection effectué");

        resolve();
      };

      record_events_connection.onblocked = () => {
        console.warn("Database open blocked by another connection.");
      };
    });
  }

  const getEvents = (table) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(table, "readonly");
      const store = transaction.objectStore(table);
      const request = store.openCursor();

      const events_keys = [];
      const events_data = [];

      request.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
          const key = cursor.key;
          const value = cursor.value;

          events_keys.push(key);
          events_data.push(...value);

          cursor.continue();
        } else {
          resolve({ events_data, events_keys });
        }
      };

      request.onerror = function () {
        console.log(request.error);
        reject(request.error);
      };
    });
  };

  const saveEvents = (table, data) => {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(data) || data.length === 0) {
        return resolve(); // rien à enregistrer, on résout quand même
      }

      const transaction = db.transaction(table, "readwrite");
      const store = transaction.objectStore(table);
      console.log("data size", data.length);
      const request = store.add(data);

      request.onsuccess = () => {
        console.log("Events saved");
        resolve();
      };

      request.onerror = () => {
        console.error("Error saving events:", request.error);
        reject(request.error);
      };
    });
  };

  const deleteEventByKeys = (table, keys) => {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(keys) || keys.length === 0) {
        return resolve(); // rien à supprimer
      }

      const transaction = db.transaction(table, "readwrite");
      const store = transaction.objectStore(table);

      let completed = 0;
      let hasError = false;

      keys.forEach((key) => {
        const request = store.delete(key);

        request.onsuccess = () => {
          completed++;
          if (completed === keys.length && !hasError) {
            console.log("tout supprimer", keys.length);

            resolve(); // toutes les suppressions sont terminées
          }
        };

        request.onerror = () => {
          console.log("erreur suppresion", request.error);
          hasError = true;
          reject(request.error);
        };
      });
    });
  };
  return { initDB, deleteEventByKeys, getEvents, saveEvents };
}
