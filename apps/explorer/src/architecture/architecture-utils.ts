import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import { MarkerType, Position } from '@xyflow/react';
import { architectureTree } from './architecture-tree.ts';
import { ARCHITECTURE_RELATIONSHIPS } from './architecture-relationships.ts';
import type { ArchitectureNode } from './architecture-types.ts';

export interface LayoutOptions {
  direction: 'TB' | 'LR';
  nodeSpacing?: number;
  rankSpacing?: number;
}

export const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  system: { width: 340, height: 175 },
  module: { width: 300, height: 155 },
  service: { width: 280, height: 150 },
  database: { width: 280, height: 150 },
  external: { width: 280, height: 150 },
  infrastructure: { width: 280, height: 150 },
  schema: { width: 310, height: 165 },
  security: { width: 280, height: 150 },
};

/**
 * Computes visible nodes and edges based on expandedNodes and focusedNodeId
 */
export function getVisibleGraph(
  expandedNodeIds: Set<string>,
  focusedNodeId: string | null
): { visibleNodes: ArchitectureNode[]; structuralEdges: Edge[]; relationshipEdges: Edge[] } {
  const visibleNodesMap = new Map<string, ArchitectureNode>();

  if (focusedNodeId) {
    // Focus mode: show focused node, its ancestors, and immediate children
    const focused = architectureTree.getNode(focusedNodeId);
    if (focused) {
      visibleNodesMap.set(focused.id, focused);
      // add ancestors
      const ancestors = architectureTree.getAncestors(focused.id);
      ancestors.forEach(a => visibleNodesMap.set(a.id, a));
      // add immediate children
      const children = architectureTree.getImmediateChildren(focused.id);
      children.forEach(c => visibleNodesMap.set(c.id, c));

      // Also allow progressive disclosure of children inside the focused subsystem
      let changed = true;
      while (changed) {
        changed = false;
        for (const expandedId of expandedNodeIds) {
          if (visibleNodesMap.has(expandedId)) {
            const kids = architectureTree.getImmediateChildren(expandedId);
            for (const child of kids) {
              if (!visibleNodesMap.has(child.id)) {
                visibleNodesMap.set(child.id, child);
                changed = true;
              }
            }
          }
        }
      }
    }
  } else {
    // Standard progressive disclosure:
    // Root is always included
    const root = architectureTree.getNode('pagecraft-root');
    if (root) {
      visibleNodesMap.set(root.id, root);
    }

    // For any expanded node, if the node itself is visible, include its immediate children
    let changed = true;
    while (changed) {
      changed = false;
      for (const expandedId of expandedNodeIds) {
        if (visibleNodesMap.has(expandedId)) {
          const children = architectureTree.getImmediateChildren(expandedId);
          for (const child of children) {
            if (!visibleNodesMap.has(child.id)) {
              visibleNodesMap.set(child.id, child);
              changed = true;
            }
          }
        }
      }
    }
  }

  const visibleNodes = Array.from(visibleNodesMap.values());
  const visibleIds = new Set(visibleNodesMap.keys());

  // Generate structural parent->child edges
  const structuralEdges: Edge[] = [];
  visibleNodes.forEach(node => {
    if (node.parentId && visibleIds.has(node.parentId)) {
      structuralEdges.push({
        id: `struct-${node.parentId}-${node.id}`,
        source: node.parentId,
        target: node.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#475569', strokeWidth: 1.5, strokeDasharray: '4 4' },
      });
    }
  });

  // Generate relationship edges between visible nodes
  const relationshipEdges: Edge[] = [];
  ARCHITECTURE_RELATIONSHIPS.forEach(rel => {
    if (visibleIds.has(rel.source) && visibleIds.has(rel.target)) {
      relationshipEdges.push({
        id: rel.id,
        source: rel.source,
        target: rel.target,
        type: 'smoothstep',
        label: rel.label,
        animated: rel.animated || false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: getProtocolColor(rel.protocol),
        },
        style: {
          stroke: getProtocolColor(rel.protocol),
          strokeWidth: 2,
        },
        labelStyle: {
          fill: '#cbd5e1',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: '#0f172a',
          fillOpacity: 0.9,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 3],
        data: {
          relation: rel.relation,
          protocol: rel.protocol,
        },
      });
    }
  });

  return { visibleNodes, structuralEdges, relationshipEdges };
}

/**
 * Returns color code corresponding to connection protocol
 */
export function getProtocolColor(protocol?: string): string {
  switch (protocol) {
    case 'WebSocket':
    case 'CRDT':
      return '#38bdf8'; // sky blue
    case 'Persistence':
      return '#34d399'; // emerald green
    case 'Queue':
      return '#fbbf24'; // amber
    case 'Media':
      return '#a78bfa'; // violet
    case 'Payment':
      return '#f43f5e'; // rose
    case 'AI':
      return '#c084fc'; // purple
    case 'OAuth':
      return '#f97316'; // orange
    case 'DNS':
      return '#2dd4bf'; // teal
    case 'HTTPS':
    case 'REST':
    default:
      return '#60a5fa'; // blue
  }
}

/**
 * Calculates dagre coordinates for nodes and returns React Flow nodes & edges
 */
export function calculateLayout(
  nodes: ArchitectureNode[],
  edges: Edge[],
  options: LayoutOptions,
  selectedNodeId: string | null,
  expandedNodeIds: Set<string>,
  onToggleExpand: (nodeId: string) => void
): { layoutedNodes: Node[]; layoutedEdges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = options.direction === 'LR';

  dagreGraph.setGraph({
    rankdir: options.direction,
    nodesep: options.nodeSpacing ?? (isHorizontal ? 50 : 60),
    ranksep: options.rankSpacing ?? (isHorizontal ? 100 : 90),
    marginx: 50,
    marginy: 50,
  });

  // Register nodes into Dagre
  nodes.forEach(node => {
    const dim = NODE_DIMENSIONS[node.type] || { width: 280, height: 150 };
    dagreGraph.setNode(node.id, { width: dim.width, height: dim.height });
  });

  // Register edges into Dagre
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // Map to React Flow Node objects
  const layoutedNodes: Node[] = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dim = NODE_DIMENSIONS[node.type] || { width: 280, height: 150 };

    const isExpanded = expandedNodeIds.has(node.id);
    const hasChildren = (node.children && node.children.length > 0) || false;
    const isSelected = selectedNodeId === node.id;

    return {
      id: node.id,
      type: node.type,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - dim.width / 2,
        y: nodeWithPosition.y - dim.height / 2,
      },
      data: {
        archNode: node,
        direction: options.direction,
        isExpanded,
        hasChildren,
        childCount: node.children?.length || 0,
        isSelected,
        onToggleExpand: () => onToggleExpand(node.id),
      },
    };
  });

  return { layoutedNodes, layoutedEdges: edges };
}
