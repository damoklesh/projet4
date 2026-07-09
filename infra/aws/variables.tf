variable "aws_region" {
  description = "AWS region where the stack will be deployed."
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Name prefix used for AWS resources."
  type        = string
  default     = "datashare"
}

variable "environment" {
  description = "Environment name, for example dev, staging, or prod."
  type        = string
  default     = "dev"
}

variable "api_image_tag" {
  description = "Docker tag to deploy from the API ECR repository."
  type        = string
  default     = "latest"
}

variable "web_image_tag" {
  description = "Docker tag to deploy from the web ECR repository."
  type        = string
  default     = "latest"
}

variable "api_cpu" {
  description = "Fargate CPU units for the API task. 256 is the smallest common value."
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Fargate memory in MiB for the API task."
  type        = number
  default     = 1024
}

variable "web_cpu" {
  description = "Fargate CPU units for the web task."
  type        = number
  default     = 256
}

variable "web_memory" {
  description = "Fargate memory in MiB for the web task."
  type        = number
  default     = 512
}

variable "api_desired_count" {
  description = "Number of API tasks to keep running."
  type        = number
  default     = 1
}

variable "web_desired_count" {
  description = "Number of web tasks to keep running."
  type        = number
  default     = 1
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "datashare"
}

variable "db_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "datashare"
}

variable "db_instance_class" {
  description = "RDS instance class. Keep small for demos; increase for production."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial RDS storage in GiB."
  type        = number
  default     = 20
}

variable "allowed_http_cidrs" {
  description = "CIDR ranges allowed to access the public ALB."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "jwt_expires_in" {
  description = "JWT expiration value passed to the API."
  type        = string
  default     = "1d"
}

variable "default_share_link_ttl_days" {
  description = "Default share-link lifetime in days."
  type        = number
  default     = 7
}
