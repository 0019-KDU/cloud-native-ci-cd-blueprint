# Development Environment
environment              = "dev"
cluster_name            = "ai-incident-assistant"
region                  = "sgp1"
kubernetes_version      = "1.34.1-do.0"
node_size               = "s-2vcpu-4gb"
node_count              = 1
auto_scale              = false
min_nodes               = 1
max_nodes               = 1
registry_name           = "ai-incident-assistant"
registry_tier           = "basic"
create_registry         = false  # Registry already exists
enable_managed_postgres = false  # Using in-cluster PostgreSQL
enable_loadbalancer     = false  # Using Kubernetes ingress
