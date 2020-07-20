'use strict';

const fs = require('fs');
const fetch = require('node-fetch');
const jwkToPem = require('jwk-to-pem');
const jwks = 'https://oauth.account.jetbrains.com/.well-known/jwks.json';

(async () => {
    const json = await fetch(jwks, {method: "Get"}).then(res => res.json())

    console.log("The JWKS:")
    console.log(JSON.stringify(json, null, '  '))

    const keys = json.keys || [];
    const selectedKeys = {};

    let alg = '';
    for (const key of keys) {
        if (alg !== '' && alg !== key.alg) {
            throw new Error("Unexpected different key alg: " + key.alg)
        }

        alg = key.alg

        console.log("");
        console.log("The Alg: " + key.alg);
        console.log("The PEM:");

        const pem = jwkToPem(key);
        console.log(pem);
        console.log("");

        selectedKeys[key.kid] = pem;
    }

    const result = {
        generated: new Date().toISOString(),
        alg: alg,
        keys: selectedKeys
    }

    const resultData = JSON.stringify(result, null, '  ');
    console.log(resultData);

    fs.writeFileSync("../lambda/jwks-generated.json", resultData);
})();
