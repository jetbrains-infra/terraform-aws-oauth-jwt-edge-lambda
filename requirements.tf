terraform {
  required_version = ">=0.12"
}

provider "aws" {
  region = var.aws_region
  version = ">=2.66"
}

variable "aws_region" {
  default = "us-west-1"
}
