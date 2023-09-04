resource "kubernetes_namespace" "cachet_namespace" {
  metadata {
    name = "timecalendar-cachet"
  }
}

output "namespace_name" {
  value = kubernetes_namespace.cachet_namespace.metadata[0].name
}
