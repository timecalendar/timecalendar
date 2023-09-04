resource "kubernetes_secret" "cachet_secret" {
  metadata {
    name      = "cachet-secret"
    namespace = var.namespace
  }

  data = {
    DB_HOST     = var.db_host
    DB_PORT     = tostring(var.db_port)
    DB_DATABASE = var.db_database
    DB_USERNAME = var.db_username
    DB_PASSWORD = var.db_password
    APP_KEY     = var.app_key
  }
}


output "secret_name" {
  value = kubernetes_secret.cachet_secret.metadata[0].name
}
