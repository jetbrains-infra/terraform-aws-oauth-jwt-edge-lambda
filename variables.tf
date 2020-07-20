variable "jwt_public_key" {
  type = string
  description = "Pass JWT token verification public key in PEM format"
}

variable "jwt_alg" {
  type = string
  description = "The JWT encryption algorithm"
  default = "RS256"
}

variable "lambda_name" {
  type = string
  description = "Specifies the name of the Lambda@Edge to create"
}
