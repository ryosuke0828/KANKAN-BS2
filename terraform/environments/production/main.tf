module "application" {
  source      = "../../modules/application"
  environment = "production"
}

output "api_endpoint_url" {
  description = "The URL of the API Gateway endpoint for the production environment"
  value       = module.application.api_endpoint_url
}
