import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordHash,passwordMatches} from '../src/passwords.js';
test('existing scrypt password format verifies without a global Buffer in Edge runtimes',()=>{
const hash=passwordHash('correct password 🔒');assert.match(hash,/^[a-f0-9]{32}:[a-f0-9]{128}$/);
const previous=globalThis.Buffer;try{globalThis.Buffer=undefined;assert.equal(passwordMatches('correct password 🔒',hash),true);assert.equal(passwordMatches('wrong password',hash),false);}finally{globalThis.Buffer=previous;}
});
test('malformed password records return a failed match instead of crashing sign-in',()=>{for(const h of [null,'', 'bad:hash', 'salt'])assert.equal(passwordMatches('password',h),false);});
