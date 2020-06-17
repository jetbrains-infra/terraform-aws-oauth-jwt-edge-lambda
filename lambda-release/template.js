
// Lambda@Edge doesn't support environment variables
// write key DER+base64 to key.base64 file
// base64 -d <key.base64 >key.der
// openssl rsa -pubin -inform DER -in key.base64

const rsa_key = "THIS IS MOCK VARIABLE, MAKE SURE TERRAFORM REPLACED IT"

const CLIENT_SECRET = `

${rsa_key}

`.trim();


exports.CLIENT_SECRET = CLIENT_SECRET;
