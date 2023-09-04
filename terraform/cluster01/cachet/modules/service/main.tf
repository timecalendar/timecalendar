resource "kubernetes_service" "cachet_service" {
  metadata {
    name      = "cachet-service"
    namespace = var.namespace
  }

  spec {
    selector = {
      app = "cachet"
    }

    port {
      protocol   = "TCP"
      port       = 80
      target_port = 80
    }
  }
}

output "service_name" {
  value = kubernetes_service.cachet_service.metadata[0].name
}
