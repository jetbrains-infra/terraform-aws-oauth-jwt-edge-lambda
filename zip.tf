
locals {
  lambda_base = "${path.module}/lambda-release"
  lambda_files = fileset(local.lambda_base, "**")
}

data "archive_file" "auth_lambda" {
  type = "zip"
  output_path = "${path.module}/.terraform/lambda-release.zip"
  source_dir = local.lambda_base
}
