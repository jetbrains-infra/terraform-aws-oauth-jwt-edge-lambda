A Terraform module that creates a Lambda@Edge 
that does validation of JWT token with a given
public key


In this branch we focus on the JetBrains Account support.


See the `get-jba-keys` module to get the actual JBA keys for this script.


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


## Releases

This repository uses NPM to deliver necessary packages to work. It means, we need to have 
a specific process to prepare a code that is able work in AWS Lambda@Edge environment. 

There are a different way to implement the delivery, we decided to pack the binaries into the
release branches. These branches are designed ONLY for use from Terraform, not for a later
development. 

Use the `build-release.sh` script to create a next release branch from the current sources. 
The script runs all necessary tests and preparations. It's by design that we include 
`node_modules` into a release branch

