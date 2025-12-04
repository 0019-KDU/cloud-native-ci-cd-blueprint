# Production Environment
environment              = "production"
cluster_name            = "ai-incident-assistant"
region                  = "sgp1"
kubernetes_version      = "1.34.1-do.0"
node_size               = "s-4vcpu-8gb"  # Larger nodes for production
node_count              = 3
auto_scale              = true
min_nodes               = 3
max_nodes               = 10
registry_name           = "ai-incident-assistant"
registry_tier           = "professional"  # More storage for production
enable_managed_postgres = false  # Using in-cluster PostgreSQL (or set true for managed DB)
enable_loadbalancer     = false  # Using Kubernetes ingress
