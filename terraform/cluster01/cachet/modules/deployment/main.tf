resource "kubernetes_deployment" "cachet_deployment" {
  metadata {
    name      = "cachet-deployment"
    namespace = var.namespace
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        app = "cachet"
      }
    }

    template {
      metadata {
        labels = {
          app = "cachet"
        }
      }

      spec {
        container {
          name  = "cachet"
          image = "cachethq/docker"
          env {
            name = "DB_HOST"
            value_from {
              secret_key_ref {
                name = var.secret
                key  = "DB_HOST"
              }
            }
          }
          env {
            name = "DB_PORT"
            value_from {
              secret_key_ref {
                name = var.secret
                key  = "DB_PORT"
              }
            }
          }
          env {
            name = "DB_DATABASE"
            value_from {
              secret_key_ref {
                name = var.secret
                key  = "DB_DATABASE"
              }
            }
          }
          env {
            name = "DB_USERNAME"
            value_from {
              secret_key_ref {
                name = var.secret
                key  = "DB_USERNAME"
              }
            }
          }
          env {
            name = "DB_PASSWORD"
            value_from {
              secret_key_ref {
                name = var.secret
                key  = "DB_PASSWORD"
              }
            }
          }
          env {
            name = "APP_KEY"
            value_from {
              secret_key_ref {
                name = var.secret
                key  = "APP_KEY"
              }
            }
          }
        }
      }
    }
  }
}

output "deployment_name" {
  value = kubernetes_deployment.cachet_deployment.metadata[0].name
}