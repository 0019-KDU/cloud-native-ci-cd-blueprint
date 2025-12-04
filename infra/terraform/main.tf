terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# DigitalOcean Kubernetes Cluster
resource "digitalocean_kubernetes_cluster" "main" {
  name    = "${var.cluster_name}-${var.environment}"
  region  = var.region
  version = var.kubernetes_version

  node_pool {
    name       = "worker-pool"
    size       = var.node_size
    node_count = var.node_count
    auto_scale = var.auto_scale
    min_nodes  = var.min_nodes
    max_nodes  = var.max_nodes
    tags       = ["${var.environment}", "kubernetes", "worker"]
  }

  tags = [var.environment, "managed-by-terraform"]
}

# DigitalOcean Container Registry
resource "digitalocean_container_registry" "main" {
  count = var.create_registry ? 1 : 0

  name                   = var.registry_name
  subscription_tier_slug = var.registry_tier
}

# Grant Kubernetes cluster access to Container Registry
resource "digitalocean_container_registry_docker_credentials" "main" {
  count = var.create_registry ? 1 : 0

  registry_name = digitalocean_container_registry.main[0].name
}

# Save kubeconfig locally
resource "local_file" "kubeconfig" {
  content         = digitalocean_kubernetes_cluster.main.kube_config[0].raw_config
  filename        = "${path.module}/kubeconfig-${var.environment}.yaml"
  file_permission = "0600"
}

# PostgreSQL Database (optional - if not using in-cluster PostgreSQL)
resource "digitalocean_database_cluster" "postgres" {
  count = var.enable_managed_postgres ? 1 : 0

  name       = "${var.cluster_name}-postgres-${var.environment}"
  engine     = "pg"
  version    = "16"
  size       = var.db_size
  region     = var.region
  node_count = var.db_node_count

  tags = [var.environment, "postgres", "managed-by-terraform"]
}

# Database firewall - allow access from Kubernetes cluster
resource "digitalocean_database_firewall" "postgres" {
  count = var.enable_managed_postgres ? 1 : 0

  cluster_id = digitalocean_database_cluster.postgres[0].id

  rule {
    type  = "k8s"
    value = digitalocean_kubernetes_cluster.main.id
  }
}

# LoadBalancer for ingress
resource "digitalocean_loadbalancer" "main" {
  count = var.enable_loadbalancer ? 1 : 0

  name   = "${var.cluster_name}-lb-${var.environment}"
  region = var.region

  forwarding_rule {
    entry_port     = 80
    entry_protocol = "http"

    target_port     = 80
    target_protocol = "http"
  }

  forwarding_rule {
    entry_port     = 443
    entry_protocol = "https"

    target_port     = 80
    target_protocol = "http"

    certificate_name = var.ssl_certificate_name != "" ? var.ssl_certificate_name : null
  }

  healthcheck {
    port     = 80
    protocol = "http"
    path     = "/"
  }
}
