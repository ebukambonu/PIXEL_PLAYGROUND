import {Buffer} from 'node:buffer';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export function passwordHash(password){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function passwordMatches(password,hash){if(typeof hash!=='string'||!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash))return false;const [salt,digest]=hash.split(':');return timingSafeEqual(Buffer.from(digest,'hex'),scryptSync(password,salt,64));}
