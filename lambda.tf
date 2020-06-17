
module "function" {
  source = "github.com/jetbrains-infra/terraform-aws-lambda-edge-from-disk?ref=v0.1.2"
  name = var.lambda_name
  handler_name = "lambda.handler"
  archive_path = data.archive_file.auth_lambda.output_path
  runtime = "nodejs12.x"
}

output "arn" {
  value = module.function.arn
}

output "qualified_arn" {
  value = module.function.qualified_arn
}

output "cloudfront_event_type" {
  value = "viewer-request"
}
