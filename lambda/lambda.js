const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

// if the file is missing, make sure build-lambda.js was executed
const {CLIENT_SECRET: {jba: jba_keys_data = {}, jbt: jbt_keys_data = {}}} = require('./jwks-generated.js');

function prepareKey(modeName, json, handler) {
    console.log("The JWKS for " + modeName + " :")
    console.log(JSON.stringify(json, null, '  '))

    const keys = json.keys || [];
    const selectedKeys = [];
    for (const key of keys) {
        const ourAlg = key.alg;
        if (!ourAlg) throw new Error("Unexpected different key alg: " + ourAlg)
        const ourKid = key.kid || null;
        const keyPem = jwkToPem(key);
        selectedKeys.push({
                modeName: modeName,
                algorithms: [ourAlg],
                jwksGetKey: function (header, callback) {
                    let theirKid = header.kid || null;
                    let theirAlg = header.alg;

                    if (ourAlg !== theirAlg) {
                        callback(new Error("Unknown alg"), null);
                        return;
                    }

                    if (ourKid !== theirKid) {
                        callback(new Error("Unknown kid"), null);
                        return;
                    }

                    callback(null, keyPem);
                },

                verifyCallback: payload => handler(payload)
            }
        );
    }

    return selectedKeys;
}

const jbaJwtKeys = prepareKey('JBA', jba_keys_data, ({email = '', sub = ''}) => sub.toString().toLowerCase().endsWith("@jetbrains.com") || email.toString().toLowerCase().endsWith("@jetbrains.com"));
const jbtJwtKeys = prepareKey('JBT', jbt_keys_data, ({orgDomain = ''}) => orgDomain.toString().toLowerCase() === 'jetbrains');
const allJwtKeys = [...jbtJwtKeys, ...jbaJwtKeys];

function parseAuthorizationHeader(authorization) {
    for (let i = 0; i < authorization.length; i++) {
        const token = authorization[i].value || ''
        const prefix = 'bearer ';
        if (token.toLowerCase().startsWith(prefix)) {
            return token.substring(prefix.length)
        }
    }

    return null;
}

function errorResponse(status, message) {
    return {
        status: status.toString(),
        statusDescription: message,
        body: status.toString() + '. ' + message,
        headers: {
            'cache-control': [{
                key: 'Cache-Control',
                value: 'no-cache, max-age=0'
            }],
            'content-type': [{
                key: 'Content-Type',
                value: 'text/plain; charset=UTF-8'
            }],
            'x-content-type-options': [{
                key: 'X-Content-Type-Options',
                value: 'nosniff'
            }]
        },
    };
}

async function handler(request) {
    //see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html
    const {authorization = []} = request.headers;
    if (authorization.length === 0) {
        return errorResponse(401, 'Missing JetBrains Authorization header')
    }

    const token = parseAuthorizationHeader(authorization)
    if (!token) {
        return errorResponse(401, 'Failed to parse JetBrains authorization token')
    }

    let allErrors = ''

    for (const jwtKey of allJwtKeys) {
        let result = await new Promise((resolve) => {
            jwt.verify(token, jwtKey.jwksGetKey, {algorithms: jwtKey.algorithms}, (err, payload) => {
                if (err != null || payload === undefined || payload === null) {
                    console.log(jwtKey.modeName + ': Failed to verify token.', (err.message || err));
                    allErrors += 'Failed to verify JetBrains authorization token: '+ (err.message || err) + '\n';
                    resolve(false);
                    return;
                }
                console.log(jwtKey.modeName + ": payload " + JSON.stringify(payload, null, '  '));
                // JBA id tokens are valid for an hour and JBT ones for 10 minutes, so the common threshold is set at 3600 seconds 
                if (Math.floor(Date.now() / 1000) + 3600 < payload.exp) {
                    console.log(jwtKey.modeName + ': "Expiration time" (exp) claim is too far in the future');
                    resolve(false);
                    return;
                }
                resolve(jwtKey.verifyCallback(payload));
            });
        });

        if (result === true) return request;
    }

    return errorResponse(403, allErrors)
}

exports.handler = async (event, context) => {
    try {
        const request = event.Records[0].cf.request;
        return await handler(request)
    } catch (err) {
        // token exists but is invalid
        console.log('Crashed to verify a token', err);
        return errorResponse(500, 'Failed to verify JetBrains authorization token: ' + err);
    }
};
