# ManuFlow infrastructure

Terraform for a minimal AWS deployment: one EC2 host running the full
docker-compose stack, and an RDS Postgres instance for the Django backend.

## Layout

```
infra/
└── aws/
    ├── main.tf                     # VPC, security groups, RDS, EC2, EIP
    ├── variables.tf
    ├── outputs.tf
    ├── cloud-init.sh.tftpl         # bootstraps Docker on the app host
    └── terraform.tfvars.example
```

## Usage

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set db_password, key_pair_name, admin_cidr

terraform init
terraform plan
terraform apply
```

On success, `terraform output app_host_public_ip` gives you the address to
point at once you've deployed the docker-compose stack (see below), and
`db_endpoint` / `db_port` give you the RDS connection details for the
backend's `.env`.

## Deploying the app onto the host

The cloud-init script installs Docker and Docker Compose and writes a
`.env` with the RDS connection details to `/opt/manuflow/.env`, but does not
pull application images — wire that up however fits your workflow, for
example:

1. Build and push `backend`, `frontend`, and `notifications` images to a
   registry (ECR, Docker Hub, GHCR) from the `build-images` job in
   `.github/workflows/ci.yml`.
2. SSH to the app host, `docker compose pull && docker compose up -d`
   against a docker-compose file pointing at those registry images and the
   RDS host from `.env`, instead of the local `db` container.

## Scaling up later

This stack intentionally stays at "one EC2 host + RDS" to match the
2-week build budget. Natural next steps, in rough order:
- Move the frontend to S3 + CloudFront (it's static after `vite build`).
- Put the backend and notifications service behind an ALB, running on
  ECS Fargate or the existing EKS/Kubernetes manifests if you migrate to k8s.
- Add a `staging` and `production` Terraform workspace instead of one flat
  state file.

## GCP alternative

If you'd rather target Cloud Run instead of AWS:
- Swap `aws_db_instance` for a `google_sql_database_instance` (Postgres).
- Swap the EC2 host for three `google_cloud_run_v2_service` resources
  (backend, frontend, notifications), each pointing at an image in
  Artifact Registry.
- Cloud Run's built-in HTTPS load balancing removes the need for the
  nginx/EIP setup used here.
