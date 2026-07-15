terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------------------------
# Networking - a small public/private VPC. The app host sits in the public
# subnet (behind its own security group); RDS sits in the private subnets.
# ---------------------------------------------------------------------------

resource "aws_vpc" "manuflow" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "manuflow-vpc" }
}

resource "aws_internet_gateway" "manuflow" {
  vpc_id = aws_vpc.manuflow.id
  tags   = { Name = "manuflow-igw" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.manuflow.id
  cidr_block              = "10.20.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[0]
  tags                    = { Name = "manuflow-public-a" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.manuflow.id
  cidr_block        = "10.20.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  tags              = { Name = "manuflow-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.manuflow.id
  cidr_block        = "10.20.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
  tags              = { Name = "manuflow-private-b" }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.manuflow.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.manuflow.id
  }
  tags = { Name = "manuflow-public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ---------------------------------------------------------------------------
# Security groups
# ---------------------------------------------------------------------------

resource "aws_security_group" "app" {
  name        = "manuflow-app-sg"
  description = "ManuFlow app host: HTTP/HTTPS in, Django/Node ports for local debugging"
  vpc_id      = aws_vpc.manuflow.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  ingress {
    description = "HTTP (frontend)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Django API"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Notifications / Socket.io"
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "manuflow-app-sg" }
}

resource "aws_security_group" "rds" {
  name        = "manuflow-rds-sg"
  description = "Allow Postgres only from the app security group"
  vpc_id      = aws_vpc.manuflow.id

  ingress {
    description     = "Postgres from app host"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "manuflow-rds-sg" }
}

# ---------------------------------------------------------------------------
# RDS Postgres
# ---------------------------------------------------------------------------

resource "aws_db_subnet_group" "manuflow" {
  name       = "manuflow-db-subnets"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  tags       = { Name = "manuflow-db-subnets" }
}

resource "aws_db_instance" "manuflow" {
  identifier             = "manuflow-db"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  db_name                = "manuflow"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.manuflow.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  publicly_accessible    = false
  storage_encrypted      = true

  tags = { Name = "manuflow-db" }
}

# ---------------------------------------------------------------------------
# EC2 app host - runs docker-compose for the backend, notifications, and
# frontend containers. In practice you'd push images to ECR and pull them
# here; for the "even Minikube is fine" bar this keeps it to one instance.
# ---------------------------------------------------------------------------

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  key_name               = var.key_pair_name

  user_data = templatefile("${path.module}/cloud-init.sh.tftpl", {
    db_host     = aws_db_instance.manuflow.address
    db_name     = aws_db_instance.manuflow.db_name
    db_username = var.db_username
    db_password = var.db_password
  })

  tags = { Name = "manuflow-app-host" }
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"
  tags     = { Name = "manuflow-app-eip" }
}
