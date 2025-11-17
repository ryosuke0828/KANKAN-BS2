variable "environment" {
  description = "The deployment environment (e.g., staging, production)"
  type        = string
}

variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "KANKAN-BS2"
}
