resource "kubernetes_ingress_v1" "cachet_ingress" {
  metadata {
    name      = "cachet-ingress"
    namespace = var.namespace
  }

  spec {
    rule {
      host = var.host
      http {
        path {
          path = "/"
          backend {
            service {
              name = var.service
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }
}
