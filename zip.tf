
locals {
  lambda_base = "${path.module}/lambda-release"
  lambda_template = "template.js"
  lambda_files = [for file in fileset(local.lambda_base, "**"): file if file != local.lambda_template]
}

data "archive_file" "auth_lambda" {
  type = "zip"
  output_path = "${path.module}/.terraform/lambda-release.zip"

  source {
    filename = local.lambda_template
    content = templatefile("${local.lambda_base}/${local.lambda_template}", {
      rsa_key = var.jwt_public_key
    })
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
