# Staging Environment
environment              = "staging"
cluster_name            = "ai-incident-assistant"
region                  = "sgp1"
kubernetes_version      = "1.34.1-do.0"
node_size               = "s-2vcpu-4gb"
node_count              = 2
auto_scale              = true
min_nodes               = 2
max_nodes               = 4
registry_name           = "ai-incident-assistant"
registry_tier           = "basic"
enable_managed_postgres = false  # Using in-cluster PostgreSQL
enable_loadbalancer     = false  # Using Kubernetes ingress
