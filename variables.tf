variable "jwt_public_key" {
  type = string
  description = "Pass JWT token verification public key in PEM format"
}

variable "lambda_name" {
  type = string
  description = "Specifies the name of the Lambda@Edge to create"
}
