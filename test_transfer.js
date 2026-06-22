const crypto = require('crypto').webcrypto;
global.crypto = crypto;

async function test() {
    const enc = new TextEncoder();
    const password = "testpass";
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // deriveKey
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
    
    // encryptData
    const dataToSave = [{ id: 1, value: "test" }];
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = enc.encode(JSON.stringify(dataToSave));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, encoded);
    
    const savedString = JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(ciphertext)) });
    
    // decryptData
    const parsed = JSON.parse(savedString);
    const ivArray = new Uint8Array(parsed.iv);
    const dataArray = new Uint8Array(parsed.data);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivArray }, key, dataArray);
    const dec = new TextDecoder();
    const decodedResult = dec.decode(decrypted);
    const finalData = JSON.parse(decodedResult);
    
    console.log("Final data:", finalData);
}

test().catch(console.error);
