# ---------------------------------------------------------------------------
# PostgreSQL for Strapi. Private subnets only -- nothing outside the VPC can
# open a connection.
# ---------------------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${local.name}-db" }
}

resource "random_password" "db" {
  length = 32
  # RDS rejects '/', '@', '"' and spaces in the master password.
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_parameter_group" "main" {
  name   = "${local.name}-pg16"
  family = "postgres16"

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_instance" "main" {
  identifier = "${local.name}-db"

  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  parameter_group_name   = aws_db_parameter_group.main.name
  publicly_accessible    = false

  multi_az                = var.db_multi_az
  backup_retention_period = var.db_backup_retention_days
  backup_window           = "01:00-02:00"
  maintenance_window      = "sun:02:30-sun:03:30"

  auto_minor_version_upgrade = true
  deletion_protection        = var.db_deletion_protection
  skip_final_snapshot        = false
  final_snapshot_identifier  = "${local.name}-db-final-${formatdate("YYYYMMDDhhmmss", timestamp())}"

  performance_insights_enabled    = false
  enabled_cloudwatch_logs_exports = ["postgresql"]

  lifecycle {
    # The snapshot name embeds a timestamp, which would otherwise show as a diff
    # on every plan.
    ignore_changes = [final_snapshot_identifier]
  }

  tags = { Name = "${local.name}-db" }
}

# ---------------------------------------------------------------------------
# Strapi's own secrets. Generated once here, then handed to the task at runtime
# so they never appear in the task definition or in Terraform output.
# ---------------------------------------------------------------------------

resource "random_password" "app_keys" {
  count   = 4
  length  = 32
  special = false
}

resource "random_password" "strapi_secret" {
  for_each = toset([
    "api_token_salt",
    "admin_jwt_secret",
    "transfer_token_salt",
    "jwt_secret",
    "encryption_key",
    "revalidate_secret",
    "lead_form_secret",
  ])

  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "cms" {
  name        = "${local.name}/cms"
  description = "Runtime secrets for the Strapi CMS"

  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "cms" {
  secret_id = aws_secretsmanager_secret.cms.id

  secret_string = jsonencode({
    DATABASE_PASSWORD   = random_password.db.result
    APP_KEYS            = join(",", random_password.app_keys[*].result)
    API_TOKEN_SALT      = random_password.strapi_secret["api_token_salt"].result
    ADMIN_JWT_SECRET    = random_password.strapi_secret["admin_jwt_secret"].result
    TRANSFER_TOKEN_SALT = random_password.strapi_secret["transfer_token_salt"].result
    JWT_SECRET          = random_password.strapi_secret["jwt_secret"].result
    ENCRYPTION_KEY      = random_password.strapi_secret["encryption_key"].result
    REVALIDATE_SECRET   = random_password.strapi_secret["revalidate_secret"].result
    LEAD_FORM_SECRET    = random_password.strapi_secret["lead_form_secret"].result
  })
}
