variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
  default     = "ai-incident-assistant"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "sgp1"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.34.1-do.0"
}

variable "node_size" {
  description = "Node size (droplet type)"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "node_count" {
  description = "Number of nodes"
  type        = number
  default     = 2
}

variable "auto_scale" {
  description = "Enable auto-scaling"
  type        = bool
  default     = true
}

variable "min_nodes" {
  description = "Minimum number of nodes for auto-scaling"
  type        = number
  default     = 1
}

variable "max_nodes" {
  description = "Maximum number of nodes for auto-scaling"
  type        = number
  default     = 5
}

variable "registry_name" {
  description = "Container registry name"
  type        = string
  default     = "ai-incident-assistant"
}

variable "create_registry" {
  description = "Create new container registry (set false if already exists)"
  type        = bool
  default     = true
}

variable "registry_tier" {
  description = "Container registry tier (basic, professional, starter)"
  type        = string
  default     = "basic"
}

variable "enable_managed_postgres" {
  description = "Enable managed PostgreSQL database"
  type        = bool
  default     = false
}

variable "db_size" {
  description = "Database node size"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "db_node_count" {
  description = "Number of database nodes"
  type        = number
  default     = 1
}

variable "enable_loadbalancer" {
  description = "Enable dedicated LoadBalancer"
  type        = bool
  default     = false
}

variable "ssl_certificate_name" {
  description = "SSL certificate name for LoadBalancer HTTPS"
  type        = string
  default     = ""
}
