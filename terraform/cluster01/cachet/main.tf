provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "do-fra1-cluster01"
}

module "namespace" {
  source = "./modules/namespace"
}

module "secret" {
  source        = "./modules/secret"
  namespace     = module.namespace.namespace_name
  db_host       = var.db_host
  db_port       = var.db_port
  db_database   = var.db_database
  db_username   = var.db_username
  db_password   = var.db_password
  app_key       = var.app_key
}

module "deployment" {
  source     = "./modules/deployment"
  namespace  = module.namespace.namespace_name
  image      = "cachethq/docker"
  replicas   = 1
  secret     = module.secret.secret_name
}

module "service" {
  source     = "./modules/service"
  namespace  = module.namespace.namespace_name
  deployment = module.deployment.deployment_name
}

module "ingress" {
  source     = "./modules/ingress"
  namespace  = module.namespace.namespace_name
  host       = "status.timecalendar.app"
  service    = module.service.service_name
}
