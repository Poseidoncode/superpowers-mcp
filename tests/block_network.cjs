"use strict";
// Test-only network kill switch: any outbound call fails loudly so "offline"
// tests can prove they never touch the network instead of inheriting it.

const fail = (what) => {
    throw new Error(`network access attempted in offline test: ${what}`);
};

globalThis.fetch = (url) => fail(`fetch(${url})`);

const http = require("http");
const https = require("https");
http.request = () => fail("http.request()");
http.get = () => fail("http.get()");
https.request = () => fail("https.request()");
https.get = () => fail("https.get()");
