aws_region  = "eu-north-1"
environment = "dev"

# Keep latest for demos. In CI/CD, use immutable tags such as a Git SHA.
api_image_tag = "latest"
web_image_tag = "latest"

# Small demo sizes. Increase before real production traffic.
api_cpu    = 512
api_memory = 1024
web_cpu    = 256
web_memory = 512

api_desired_count = 1
web_desired_count = 1

db_instance_class    = "db.t4g.micro"
db_allocated_storage = 20

# Restrict this to your IP for non-public demos.
allowed_http_cidrs = ["0.0.0.0/0"]
