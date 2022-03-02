data "google_client_config" "gcc" {}

provider "google" {
  # credentials = var.GCP_CREDENTIALS
  project = "story-circle-ai"
  region  = "us-east1"
  zone    = "us-east1a"
}

resource "google_sql_database" "db" {
  name     = "faboo"
  instance = google_sql_database_instance.db.name
}

resource "google_sql_database_instance" "db" {
  name             = "yakul"
  region           = data.google_client_config.gcc.region
  database_version = "POSTGRES_11"
  settings {
    tier = "db-f1-micro"
    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }
  }
  deletion_protection = "true"
}

resource "google_service_account" "sa" {
  account_id   = "story-circle-app-sa"
  display_name = "story circle app SA (managed by Terraform)"
}

resource "google_sql_user" "sa" {

  # > Due to the length limit on a database username, you need to omit the .gserviceaccount.com
  # > suffix in the email. For example, the username for the service account
  # > sa-name@project-id.iam.gserviceaccount.com should be sa-name@project-id.iam.

  # https://cloud.google.com/sql/docs/postgres/add-manage-iam-users#creating-a-database-user

  name = replace(google_service_account.sa.email, ".gserviceaccount.com", "")

  instance = google_sql_database_instance.db.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}

resource "google_sql_user" "admin" {
  name     = "jeremy.adams.fisher@gmail.com"
  instance = google_sql_database_instance.db.name
  type     = "CLOUD_IAM_USER"
}

resource "google_project_iam_binding" "sa" {
  project = data.google_client_config.gcc.project
  members = ["serviceAccount:${google_service_account.sa.email}"]
  for_each = toset([
    "roles/cloudsql.client",
    "roles/cloudsql.instanceUser",
    "roles/iam.serviceAccountTokenCreator"
  ])
  role = each.value
}

resource "google_service_account_key" "sa" {
  service_account_id = google_service_account.sa.id
}

output "service_account_key" {
  value     = base64decode(google_service_account_key.sa.private_key)
  sensitive = true
}
