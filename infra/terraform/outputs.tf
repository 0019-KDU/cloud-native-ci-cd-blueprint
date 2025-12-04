output "cluster_id" {
  description = "Kubernetes cluster ID"
  value       = digitalocean_kubernetes_cluster.main.id
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = digitalocean_kubernetes_cluster.main.name
}

output "cluster_endpoint" {
  description = "Kubernetes cluster endpoint"
  value       = digitalocean_kubernetes_cluster.main.endpoint
}

output "cluster_ipv4" {
  description = "Kubernetes cluster IPv4 address"
  value       = digitalocean_kubernetes_cluster.main.ipv4_address
}

output "kubeconfig_path" {
  description = "Path to kubeconfig file"
  value       = local_file.kubeconfig.filename
}

output "registry_endpoint" {
  description = "Container registry endpoint"
  value       = var.create_registry ? digitalocean_container_registry.main[0].endpoint : "Using existing registry"
}

output "registry_server" {
  description = "Container registry server URL"
  value       = var.create_registry ? digitalocean_container_registry.main[0].server_url : "registry.digitalocean.com/ai-incident-assistant"
}

output "postgres_host" {
  description = "PostgreSQL database host"
  value       = var.enable_managed_postgres ? digitalocean_database_cluster.postgres[0].host : "Using in-cluster PostgreSQL"
}

output "postgres_port" {
  description = "PostgreSQL database port"
  value       = var.enable_managed_postgres ? digitalocean_database_cluster.postgres[0].port : "N/A"
}

output "postgres_connection_string" {
  description = "PostgreSQL connection string"
  value       = var.enable_managed_postgres ? digitalocean_database_cluster.postgres[0].uri : "Using in-cluster PostgreSQL"
  sensitive   = true
}

output "loadbalancer_ip" {
  description = "LoadBalancer IP address"
  value       = var.enable_loadbalancer ? digitalocean_loadbalancer.main[0].ip : "Using Kubernetes LoadBalancer service"
}
