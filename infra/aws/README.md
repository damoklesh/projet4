# AWS ECS/Fargate Terraform

This folder shows an AWS-native deployment for DataShare using:

- ECR for Docker images.
- ECS with Fargate for the API and web containers.
- An Application Load Balancer for public traffic.
- RDS PostgreSQL instead of the local Postgres container.
- EFS for uploaded files, because the current API storage adapter writes to local disk.
- Secrets Manager for database and JWT secrets.
- One NAT gateway for lower demo cost.

The stack is intentionally commented and parameterized so it can be adapted before real production use.

## CI With GitHub Actions

I implemented a GitHub Actions pipeline to run the project checks automatically on pushes and pull requests. This keeps regressions visible before code is merged by running quality checks, API unit and integration tests, web tests, Cypress E2E tests, and a real API E2E flow with Docker Compose.

The workflow is defined in `.github/workflows/ci.yaml`. It installs the Node.js workspace, generates the Prisma client, builds the shared package where needed, runs the test suites, and starts Docker services for the end-to-end scenario that exercises the web app against the real API.

There is no automatic AWS deployment pipeline in GitHub Actions for the MVP. AWS deployment is a manual Terraform and ECR flow documented below and in `nextSteps.md`.

## Dockerisation And AWS Deployment

I implemented Docker images for both deployable applications so the API and web app can run consistently across local development, CI, and AWS. The API image is defined in `apps/api/Dockerfile`, the web image in `apps/web/Dockerfile`, and local multi-service orchestration is available in `docker-compose.yml`.

For cloud deployment, I implemented an AWS ECS Fargate stack with Terraform in `infra/aws`. The deployment provisions ECR repositories for the images, ECS Fargate services for the API and web containers, an Application Load Balancer for public traffic and same-origin API routing, RDS PostgreSQL, EFS for uploaded files, Secrets Manager for runtime secrets, CloudWatch logs, and the required VPC networking.

## Architecture

```text
Internet
  |
Application Load Balancer
  |-- /auth, /file-assets, /share-links, /me, /docs -> API ECS service
  |-- everything else --------------------------------> Web ECS service

API ECS service
  |-- RDS PostgreSQL
  |-- EFS mounted at /repo/apps/api/storage/uploads

Web ECS service
  |-- Nginx serving the React build
```

The private subnets share a single NAT gateway to reduce hourly NAT costs for demos. For production, use one NAT gateway per AZ if outbound availability matters.

## Important Build Detail

Build the web image with a same-origin API base URL:

```bash
docker build \
  -f apps/web/Dockerfile \
  --build-arg VITE_API_BASE_URL="" \
  -t <account-id>.dkr.ecr.<region>.amazonaws.com/datashare-web:<tag> .
```

With an empty `VITE_API_BASE_URL`, the browser calls paths like `/auth/login`. The ALB then routes API paths to the API service and all other paths to the web service.

## First Deployment Flow

1. Create ECR repositories:

   ```bash
   terraform init
   terraform apply "-target=aws_ecr_repository.api" "-target=aws_ecr_repository.web"
   ```

2. Build and push Docker images:

   ```powershell
   $apiRepo = terraform output -raw api_ecr_repository_url
   $registry = $apiRepo.Split("/")[0]
   aws ecr get-login-password --region eu-north-1 \
     | docker login --username AWS --password-stdin $registry

   docker build -f apps/api/Dockerfile -t <api-repo-url>:latest .
   docker push <api-repo-url>:latest

   docker build -f apps/web/Dockerfile --build-arg VITE_API_BASE_URL="" -t <web-repo-url>:latest .
   docker push <web-repo-url>:latest
   ```

3. Create `terraform.tfvars` from `terraform.tfvars.example`.

4. Apply the full stack:

   ```bash
   terraform apply
   ```

## Production Notes

- Add HTTPS with ACM and change the listener from HTTP to HTTPS before exposing real users.
- Keep `enable_deletion_protection = true` for production RDS.
- The API currently applies Prisma migrations at container startup. That is acceptable for a demo, but production usually runs migrations as a separate one-off deployment task.
- EFS keeps the current local-storage implementation working. A future S3 storage adapter would be simpler and usually cheaper for file-sharing workloads.
