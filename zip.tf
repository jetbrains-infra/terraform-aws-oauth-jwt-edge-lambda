
locals {
  lambda_base = "${path.module}/lambda-release"
  lambda_files = [for file in fileset(local.lambda_base, "**"): file]
}

data "archive_file" "auth_lambda" {
  type = "zip"
  output_path = "${path.module}/.terraform/lambda-release.zip"

  dynamic "source" {
    for_each = local.lambda_files
    iterator = it
    content {
      filename = it.value
      content = file("${local.lambda_base}/${it.value}")
    }
  }
}
