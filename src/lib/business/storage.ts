import type { State } from './model';
export const STORAGE_KEY = 'rapport-business-v1';
export async function archive(state: State) {
 return new Promise<void>((resolve, reject) => {
  const req = indexedDB.open('rapport-business', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('snapshots');
  req.onerror = () => reject(req.error);
  req.onsuccess = () => { const db = req.result; const tx = db.transaction('snapshots', 'readwrite'); tx.objectStore('snapshots').put(state, 'current'); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => { db.close(); reject(tx.error); }; };
 });
}
export async function restore(): Promise<State | undefined> {
 return new Promise((resolve) => { const req = indexedDB.open('rapport-business', 1); req.onupgradeneeded = () => req.result.createObjectStore('snapshots'); req.onerror = () => resolve(undefined); req.onsuccess = () => { const db = req.result; const tx = db.transaction('snapshots'); const read = tx.objectStore('snapshots').get('current'); read.onsuccess = () => resolve(read.result); read.onerror = () => resolve(undefined); tx.oncomplete = () => db.close(); }; });
}
