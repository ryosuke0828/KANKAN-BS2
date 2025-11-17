module "application" {
  source      = "../../modules/application"
  environment = "staging"
}

output "api_endpoint_url" {
  description = "The URL of the API Gateway endpoint for the staging environment"
  value       = module.application.api_endpoint_url
}
