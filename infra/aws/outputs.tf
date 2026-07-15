output "app_host_public_ip" {
  description = "Public IP of the EC2 app host (frontend on :80, API on :8000)"
  value       = aws_eip.app.public_ip
}

output "db_endpoint" {
  description = "RDS Postgres connection endpoint"
  value       = aws_db_instance.manuflow.address
}

output "db_port" {
  value = aws_db_instance.manuflow.port
}
