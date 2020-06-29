A Terraform module that creates a Lambda@Edge 
that does validation of JWT token with a given
public key


## Usage Example

```tf


  module "jwt_checker" {
    source = "github.com/jetbrains-infra/terraform-aws-oauth-jwt-edge-lambda?ref=<PUT THE LATEST RELEASE HERE>"
    lambda_name = "jonnyzzz_test_oauth_jwt_lambda"
    jwt_public_key = "TODO - PUBLIC KEY - ask Eugene Petrenko"
  }

  module "webserver" {
    source = "github.com/jetbrains-infra/terraform-aws-static-website?ref=<PUT THE LATEST RELEASE HERE>"
    aws_region = "us-east-1"
    route53_zone_name = "sandbox.intellij.net"
    domain_name = "jonnyzzz-test-aws-site.sandbox.intellij.net"
    website_name = "jonnyzzz-test-aws-site"
    register_ipv6 = true
    use_s3_origin_identity = true
    lambda_associations = [{
        event_type = module.jwt_checker.cloudfront_event_type,
        lambda_arn = module.jwt_checker.qualified_arn
      }]
  }


```
