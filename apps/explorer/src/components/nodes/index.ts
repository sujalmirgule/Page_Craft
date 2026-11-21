import { SystemNode } from './SystemNode';
import { ModuleNode } from './ModuleNode';
import { ServiceNode } from './ServiceNode';
import { DatabaseNode } from './DatabaseNode';
import { ExternalServiceNode } from './ExternalServiceNode';
import { InfrastructureNode } from './InfrastructureNode';
import { SchemaNode } from './SchemaNode';
import { SecurityNode } from './SecurityNode';

export const nodeTypes = {
  system: SystemNode,
  module: ModuleNode,
  service: ServiceNode,
  database: DatabaseNode,
  external: ExternalServiceNode,
  infrastructure: InfrastructureNode,
  schema: SchemaNode,
  security: SecurityNode,
};

export {
  SystemNode,
  ModuleNode,
  ServiceNode,
  DatabaseNode,
  ExternalServiceNode,
  InfrastructureNode,
  SchemaNode,
  SecurityNode,
};
