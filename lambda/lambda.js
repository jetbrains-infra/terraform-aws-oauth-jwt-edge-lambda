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
                algorithm: ourAlg,
                kid: ourKid,
                pem: keyPem,
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

    let decodedToken
    try {
        decodedToken = jwt.decode(token)
    } catch (err) {
        console.log("Failed to decode JWT", err)
        return errorResponse(401, 'Failed to parse JetBrains authorization token')
    }

    const matchingKeys = allJwtKeys.filter(jwtKey =>
        jwtKey.kid === decodedToken.kid && jwtKey.algorithm in decodedToken.algorithms)

    if (!matchingKeys) {
        errorResponse(401, "No keys match the JetBrains authorization token")
    }

    let allErrors = ''

    for (const jwtKey of matchingKeys) {
        let result = await new Promise((resolve) => {
            jwt.verify(token, jwtKey.pem, {algorithms: [jwtKey.algorithms]}, (err, payload) => {
                if (err != null || payload === undefined || payload === null) {
                    console.log(jwtKey.modeName + ': Failed to verify token.', (err.message || err));
                    allErrors += 'Failed to verify JetBrains authorization token: '+ (err.message || err) + '\n';
                    resolve(false);
                } else {
                    console.log(jwtKey.modeName + ": payload " + JSON.stringify(payload, null, '  '));
                    resolve(jwtKey.verifyCallback(payload));
                }
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
        console.log('Uncaught exception when verifying a token', err);
        return errorResponse(500, 'Unexpected error verifying JetBrains authorization token: ' + err);
    }
};
