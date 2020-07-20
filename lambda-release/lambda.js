const jwt = require('jsonwebtoken');
const { CLIENT_SECRET, CLIENT_ALG } = require('./template');

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

function checkToken(token) {
    if (!token) return false

    try {
        const payload = jwt.verify(token, CLIENT_SECRET, {algorithm: [CLIENT_ALG]});
        //TODO: check the token if necessary
        return true
    } catch (e) {
        // token exists but it-is invalid
        console.log('Failed to verify token', e);
    }
    return false;
}

function handler(request, callback) {
    const token = parseToken(request.headers);
    if (checkToken(token)) {
        callback(null, request);
    } else {
        callback(null, {
            status: '403',
            statusDescription: 'Not Authorized by JetBrains',
            body: 'Not Authorized by JetBrains'
        });
    }
}

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    handler(request, callback)
};
