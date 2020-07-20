const jwt = require('jsonwebtoken');
// if the file is missing, make sure build-lambda.js was executed
const {alg: jwtAlgorithm, keys: jwtKeys} = require('./jwks-generated.json');

function jwksGetKey(header, callback) {
    const key = jwtKeys[header.kid];
    if (key == null) {
        callback(new Error("Unknown kid"), null);
    } else {
        callback(null, key);
    }
}

function parseToken(headers) {
    //see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html
    const {authorization = []} = headers;
    if (authorization.length > 0) {
        for (let i = 0; i < authorization.length; i++) {
            const token = authorization[i].value || ''
            const prefix = 'Bearer ';
            if (token.startsWith(prefix)) {
                return token.substring(prefix.length)
            }
        }
    }

    return null;
}

function notAuthorized(callback) {
    callback(null, {
        status: '403',
        statusDescription: 'Not Authorized by JetBrains',
        body: 'Not Authorized by JetBrains'
    });
}

function handler(request, callback) {
    const token = parseToken(request.headers)

    if (!token) {
        notAuthorized(callback)
        return;
    }

    function handleJwtReply(err, payload) {
        if (err != null) {
            // token exists but it-is invalid
            console.log('Failed to verify token.', err);
            notAuthorized(callback);
            return;
        }

        const {sub = ''} = payload;
        if (!sub.toLowerCase().endsWith("@jetbrains.com")) {
            // token exists but it-is invalid
            console.log('Invalid email address', err);
            notAuthorized(callback);
            return;
        }

        //allow the request
        callback(null, request)
    }

    try {
        jwt.verify(token, jwksGetKey, { algorithm: jwtAlgorithm}, (err, payload) => {
            try {
                return handleJwtReply(err, payload);
            } catch (err) {
                // token exists but it-is invalid
                console.log('Failed to handle a token', err);
                notAuthorized(callback);
            }
        })
    } catch (err) {
        // token exists but it-is invalid
        console.log('Crashed to verify a token', err);
        notAuthorized(callback);
    }
}

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    handler(request, callback)
};
