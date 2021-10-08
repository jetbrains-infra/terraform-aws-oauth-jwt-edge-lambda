
// this text contains an JSON array of JWKS files
const CLIENT_JWKS = {
   'jba' : { keys: [], x : "CALL THE GENERATOR" }
    ,
   'jbt' :  { keys: [], x : "CALL THE GENERATOR" }
}

// "emails" is a list of JB account emails that should have access to the private preview feed
const PREVIEW_JBA_EMAILS = { emails: [], x: "CALL THE GENERATOR" }

exports.CLIENT_SECRET = CLIENT_JWKS;
exports.PREVIEW_JBA_EMAILS = PREVIEW_JBA_EMAILS;
