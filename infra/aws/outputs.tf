output "alb_url" {
  description = "Public URL for the web app and same-origin API routes."
  value       = "http://${aws_lb.main.dns_name}"
}

output "api_ecr_repository_url" {
  description = "Push the API Docker image to this repository."
  value       = aws_ecr_repository.api.repository_url
}

output "web_ecr_repository_url" {
  description = "Push the web Docker image to this repository."
  value       = aws_ecr_repository.web.repository_url
}

output "rds_endpoint" {
  description = "Private RDS endpoint used by ECS tasks."
  value       = aws_db_instance.postgres.address
}

output "api_secret_arn" {
  description = "Secrets Manager ARN containing DATABASE_URL and JWT_SECRET."
  value       = aws_secretsmanager_secret.api.arn
}
