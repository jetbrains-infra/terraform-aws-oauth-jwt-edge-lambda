const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

// if the file is missing, make sure build-lambda.js was executed
const {CLIENT_SECRET: {jba: jba_keys_data = {}}, PREVIEW_JBA_EMAILS: {emails: previewEmailList = []}} = require('./jwks-generated.js');

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
                alg: ourAlg,
                kid: ourKid,
                pem: keyPem,
                verifyCallback: payload => handler(payload)
            }
        );
    }

    return selectedKeys;
}

const previewEmails = new Set(previewEmailList.map(email => email.toLowerCase()));

const jbaJwtKeys = prepareKey('JBA', jba_keys_data, (payload) => previewEmails.has(payload.email.toLowerCase()));

const allJwtKeys = jbaJwtKeys;

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

function kidMatch(jwtKid, headerKid) {
    return jwtKid === headerKid || (jwtKid === null && headerKid === undefined)
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

    const decodedToken = jwt.decode(token, {complete: true})
    if (!decodedToken) {
        console.log("Failed to decode JWT " + token)
        return errorResponse(401, 'Failed to parse JetBrains authorization token')
    }

    console.log("JWT payload: " + JSON.stringify(decodedToken.payload, null, '  '));

    const matchingKeys = allJwtKeys.filter(jwtKey =>
        kidMatch(jwtKey.kid, decodedToken.header.kid) && jwtKey.alg === decodedToken.header.alg)

    if (matchingKeys.length === 0) {
        console.log("No matching JWKS for JWT.")
        return errorResponse(401, "No keys match the JetBrains authorization token")
    }

    if (matchingKeys.length > 1) {
        console.log("WARN: Several matching JWKS for JWT, the first one will be used.")
    }

    const jwtKey = matchingKeys[0]
    return await new Promise((resolve) => {
        jwt.verify(token, jwtKey.pem, {algorithms: [jwtKey.alg]}, (err, payload) => {
            if (err != null || payload === undefined || payload === null) {
                console.log(jwtKey.modeName + ': Failed to verify token.', (err.message || err));
                let errorMessage;
                if (err.name === "TokenExpiredError") {
                    errorMessage = "JetBrains authorization token expired.\n"
                } else {
                    errorMessage = 'Failed to verify JetBrains authorization token: ' + (err.message || err) + '\n';
                }
                resolve(errorResponse(403, errorMessage))
            } else {
                if (jwtKey.verifyCallback(payload)) {
                    resolve(request);
                } else {
                    console.log("Email " + payload.email + " not in the private preview list")
                    resolve(errorResponse(403, "Email not in the private preview list.\n"))
                }
            }
        });
    });
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
