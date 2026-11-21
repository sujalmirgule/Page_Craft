import { ARCHITECTURE_NODES } from './architecture-data.ts';
import type { ArchitectureNode } from './architecture-types.ts';

export class ArchitectureTree {
  private static instance: ArchitectureTree;
  private nodes: Record<string, ArchitectureNode>;

  private constructor() {
    this.nodes = ARCHITECTURE_NODES;
  }

  public static getInstance(): ArchitectureTree {
    if (!ArchitectureTree.instance) {
      ArchitectureTree.instance = new ArchitectureTree();
    }
    return ArchitectureTree.instance;
  }

  public getNode(id: string): ArchitectureNode | undefined {
    return this.nodes[id];
  }

  public getAllNodes(): ArchitectureNode[] {
    return Object.values(this.nodes);
  }

  public getImmediateChildren(nodeId: string): ArchitectureNode[] {
    const node = this.getNode(nodeId);
    if (!node || !node.children) return [];
    return node.children
      .map(childId => this.getNode(childId))
      .filter((n): n is ArchitectureNode => n !== undefined);
  }

  public getAllDescendantIds(nodeId: string): string[] {
    const descendants: string[] = [];
    const queue = [...(this.getNode(nodeId)?.children || [])];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      descendants.push(currentId);
      const current = this.getNode(currentId);
      if (current && current.children) {
        queue.push(...current.children);
      }
    }

    return descendants;
  }

  public getAncestors(nodeId: string): ArchitectureNode[] {
    const ancestors: ArchitectureNode[] = [];
    let current = this.getNode(nodeId);

    while (current && current.parentId) {
      const parent = this.getNode(current.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return ancestors;
  }

  public getBreadcrumbs(nodeId: string): Array<{ id: string; title: string; level: number }> {
    const ancestors = this.getAncestors(nodeId);
    const current = this.getNode(nodeId);
    const breadcrumbs = ancestors.map(a => ({ id: a.id, title: a.title, level: a.level }));
    if (current) {
      breadcrumbs.push({ id: current.id, title: current.title, level: current.level });
    }
    return breadcrumbs;
  }

  public searchNodes(query: string): ArchitectureNode[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return this.getAllNodes().filter(node => {
      const matchTitle = node.title.toLowerCase().includes(q);
      const matchSubtitle = node.subtitle.toLowerCase().includes(q);
      const matchTech = node.technologies.some(t => t.toLowerCase().includes(q));
      const matchPurpose = node.details.purpose.toLowerCase().includes(q);
      const matchCategory = node.category.toLowerCase().includes(q);
      const matchResp = node.details.responsibilities.some(r => r.toLowerCase().includes(q));
      const matchApis = node.details.apis?.some(a => a.endpoint.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));

      return matchTitle || matchSubtitle || matchTech || matchPurpose || matchCategory || matchResp || matchApis;
    });
  }
}

export const architectureTree = ArchitectureTree.getInstance();
