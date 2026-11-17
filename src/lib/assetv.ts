import fs from 'node:fs';
import crypto from 'node:crypto';

/** A public/ file's URL with a content hash, so a browser holding the old copy (Pages caches 10 minutes) fetches the new one. */
export const v = (url: string) => `${url}?v=${crypto.createHash('sha1').update(fs.readFileSync(`public${url}`)).digest('hex').slice(0, 8)}`;
