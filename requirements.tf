terraform {
  required_version = ">=0.14"
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-west-1"
}
