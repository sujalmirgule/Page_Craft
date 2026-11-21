export type NodeCategory = 
  | 'system'
  | 'module'
  | 'service'
  | 'database'
  | 'external'
  | 'infrastructure'
  | 'schema'
  | 'security';

export type NodeStatus = 'core' | 'production-hardened' | 'active';

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS';
  endpoint: string;
  description: string;
}

export interface DataModelDetail {
  name: string;
  description: string;
  schemaSnippet: string;
}

export interface NodeDetails {
  purpose: string;
  responsibilities: string[];
  technologies: string[];
  apis?: ApiEndpoint[];
  dataModel?: DataModelDetail;
  inputs?: string[];
  outputs?: string[];
  permissions?: string[];
  externalIntegrations?: string[];
  failureHandling?: string[];
}

export interface ArchitectureNode {
  id: string;
  parentId?: string;
  type: NodeCategory;
  title: string;
  subtitle: string;
  category: string;
  level: number;
  technologies: string[];
  status: NodeStatus;
  children?: string[]; // IDs of immediate children
  dependencies?: string[]; // IDs of nodes this depends on
  relatedNodes?: string[]; // IDs of related nodes
  details: NodeDetails;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relation: string;
  protocol?: 'HTTPS' | 'REST' | 'WebSocket' | 'CRDT' | 'Persistence' | 'Queue' | 'OAuth' | 'Payment' | 'Media' | 'AI' | 'DNS';
  animated?: boolean;
}
