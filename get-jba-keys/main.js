const fetch = require('node-fetch');
const jwkToPem = require('jwk-to-pem');
const jwks = "https://public.staging.oauth.intservices.aws.intellij.net/.well-known/jwks.json";

(async () => {
    const json = await fetch(jwks, {method: "Get"}).then(res => res.json())

    console.log("The JWKS:")
    console.log(JSON.stringify(json, null, '  '))

    const {keys:[key]} = json
    console.log("")
    console.log("The Alg: " + key.alg)
    console.log("The PEM:")

    const pem = jwkToPem(key)
    console.log(pem)
    console.log("")
})()
