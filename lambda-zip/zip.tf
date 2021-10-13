terraform {
  required_version = ">=0.12"
}

provider "http" {
  version = ">=1.2.0"
}

data "http" "jbt_jwks" {
  url = local.jbt_jwks_url
}

data "http" "jba_jwks" {
  url = local.jba_jwks_url
}

data "local_file" "jba_preview_emails" {
  filename = "${path.module}/../../jba-preview-emails.json"
}

locals {
  jba_jwks_url = "https://oauth.account.jetbrains.com/.well-known/jwks.json"
  jbt_jwks_url = "https://jetbrains.team/oauth/jwks.json"

  lambda_base = "${path.module}/../lambda-release"
  lambda_dev_base = "${path.module}/../lambda"
  lambda_template = "jwks-generated.js"
  lambda_files = [for file in fileset(local.lambda_base, "**"): file if file != local.lambda_template]

  lambda_template_content = templatefile("${local.lambda_base}/jwks-generated.template", {
    jbt_jwks_key = data.http.jbt_jwks.body,
    jba_jwks_key = data.http.jba_jwks.body,
  })
}

variable "generate_template_locally" {
  default = false
  type = bool
  description = "Internal parameter for local debug, do not use"
}

resource "local_file" "lambda_template" {
  count = var.generate_template_locally ? 1 : 0
  filename = "${local.lambda_dev_base}/${local.lambda_template}"
  content = local.lambda_template_content
}

data "archive_file" "auth_lambda" {
  type = "zip"
  output_path = "${path.module}/.terraform/lambda-release.zip"

  source {
    filename = local.lambda_template
    content = local.lambda_template_content
  }

  dynamic "source" {
    for_each = local.lambda_files
    iterator = it
    content {
      filename = it.value
      content = file("${local.lambda_base}/${it.value}")
    }
  }
}

output "auth_lambda_zip_path" {
  value = data.archive_file.auth_lambda.output_path
}

output "auth_lambda_zip_sha" {
  value = data.archive_file.auth_lambda.output_sha
}
