import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './components/nodes';
import { Navbar } from './components/ui/Navbar';
import { Breadcrumbs } from './components/ui/Breadcrumbs';
import { DetailPanel } from './components/ui/DetailPanel';
import { SearchModal } from './components/ui/SearchModal';
import { Legend } from './components/ui/Legend';
import { architectureTree } from './architecture/architecture-tree';
import { getVisibleGraph, calculateLayout } from './architecture/architecture-utils';

const FlowCanvas: React.FC = () => {
  const reactFlow = useReactFlow();

  // State
  // Initially expand root to reveal Level 1 systems
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    new Set(['pagecraft-root'])
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('pagecraft-root');
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [direction, setDirection] = useState<'TB' | 'LR'>('TB');

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Flag to know when layout changes need a camera fitView vs a specific node center
  const targetCenterNodeRef = useRef<string | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Toggle expand / collapse
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        // Collapse: remove node and all its descendants
        const descendants = architectureTree.getAllDescendantIds(nodeId);
        next.delete(nodeId);
        descendants.forEach(id => next.delete(id));
      } else {
        // Expand
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Recalculate graph layout when expansions, focus, or direction change
  useEffect(() => {
    const { visibleNodes, structuralEdges, relationshipEdges } = getVisibleGraph(
      expandedNodeIds,
      focusedNodeId
    );

    const allEdges = [...structuralEdges, ...relationshipEdges];

    const { layoutedNodes, layoutedEdges } = calculateLayout(
      visibleNodes,
      allEdges,
      { direction, nodeSpacing: 50, rankSpacing: 90 },
      selectedNodeId,
      expandedNodeIds,
      handleToggleExpand
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Camera adjustment
    const timer = setTimeout(() => {
      if (targetCenterNodeRef.current) {
        const centerId = targetCenterNodeRef.current;
        targetCenterNodeRef.current = null;
        const targetNode = layoutedNodes.find(n => n.id === centerId);
        if (targetNode) {
          reactFlow.setCenter(
            targetNode.position.x + 150,
            targetNode.position.y + 80,
            { zoom: 1.15, duration: 450 }
          );
          return;
        }
      }

      if (isInitialMount.current) {
        isInitialMount.current = false;
        reactFlow.fitView({ padding: 0.18, duration: 400 });
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [expandedNodeIds, focusedNodeId, direction, handleToggleExpand, setNodes, setEdges, reactFlow]);

  // Update selection highlight on nodes without recomputing Dagre coordinates
  useEffect(() => {
    setNodes(nds =>
      nds.map(node => {
        const isSelected = node.id === selectedNodeId;
        if (node.data.isSelected !== isSelected) {
          return {
            ...node,
            data: {
              ...node.data,
              isSelected,
            },
          };
        }
        return node;
      })
    );
  }, [selectedNodeId, setNodes]);

  // Select node handler
  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsDetailOpen(true);

    // If node is not currently visible, expand its ancestors so it becomes visible
    const ancestors = architectureTree.getAncestors(nodeId);
    if (ancestors.length > 0) {
      setExpandedNodeIds(prev => {
        let hasNew = false;
        const next = new Set(prev);
        ancestors.forEach(a => {
          if (!next.has(a.id)) {
            next.add(a.id);
            hasNew = true;
          }
        });
        return hasNew ? next : prev;
      });
    }

    // Center smoothly on target node
    setTimeout(() => {
      const targetNode = reactFlow.getNode(nodeId);
      if (targetNode) {
        reactFlow.setCenter(
          targetNode.position.x + 150,
          targetNode.position.y + 80,
          { zoom: Math.max(reactFlow.getZoom(), 0.95), duration: 400 }
        );
      }
    }, 80);
  }, [reactFlow]);

  // Focus node handler
  const handleFocusNode = useCallback((nodeId: string) => {
    targetCenterNodeRef.current = nodeId;
    setFocusedNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setIsDetailOpen(true);
  }, []);

  const handleClearFocus = useCallback(() => {
    setFocusedNodeId(null);
    setTimeout(() => {
      reactFlow.fitView({ padding: 0.18, duration: 450 });
    }, 80);
  }, [reactFlow]);

  // Search result handler
  const handleSelectSearchResult = useCallback((nodeId: string) => {
    targetCenterNodeRef.current = nodeId;
    const ancestors = architectureTree.getAncestors(nodeId);
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      ancestors.forEach(a => next.add(a.id));
      return next;
    });

    setFocusedNodeId(null);
    setSelectedNodeId(nodeId);
    setIsDetailOpen(true);
  }, []);

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    const all = architectureTree.getAllNodes().map(n => n.id);
    setExpandedNodeIds(new Set(all));
    setFocusedNodeId(null);
    setTimeout(() => {
      reactFlow.fitView({ padding: 0.18, duration: 500 });
    }, 80);
  }, [reactFlow]);

  // Collapse all to root
  const handleCollapseAll = useCallback(() => {
    setExpandedNodeIds(new Set(['pagecraft-root']));
    setFocusedNodeId(null);
    setSelectedNodeId('pagecraft-root');
    setTimeout(() => {
      reactFlow.fitView({ padding: 0.22, duration: 500 });
    }, 80);
  }, [reactFlow]);

  // Presets
  const handleSelectPreset = useCallback((presetKey: string) => {
    setFocusedNodeId(null);
    if (presetKey === 'overview') {
      setExpandedNodeIds(new Set(['pagecraft-root']));
      setSelectedNodeId('pagecraft-root');
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.18, duration: 450 });
      }, 80);
    } else if (presetKey === 'schema') {
      const schemaSet = new Set([
        'pagecraft-root',
        'backend',
        'portfolio-module',
        'document-engine',
        'portfolio-persistence',
        'portfolio-doc-schema',
        'pages-schema'
      ]);
      setExpandedNodeIds(schemaSet);
      handleSelectNode('blocks-schema');
    } else if (presetKey === 'realtime') {
      const realtimeSet = new Set([
        'pagecraft-root',
        'realtime',
        'frontend'
      ]);
      setExpandedNodeIds(realtimeSet);
      handleSelectNode('crdt-engine');
    } else if (presetKey === 'publishing') {
      const pubSet = new Set([
        'pagecraft-root',
        'publishing',
        'database',
        'mongodb-atlas'
      ]);
      setExpandedNodeIds(pubSet);
      handleSelectNode('slug-router');
    }
  }, [handleSelectNode, reactFlow]);

  // Reset view
  const handleResetView = useCallback(() => {
    reactFlow.fitView({ padding: 0.2, duration: 400 });
  }, [reactFlow]);

  // Keyboard shortcut for search (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '/') {
        const target = document.activeElement as HTMLElement | null;
        const tagName = target?.tagName;
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && !target?.isContentEditable) {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedNodeData = useMemo(() => {
    return selectedNodeId ? architectureTree.getNode(selectedNodeId) || null : null;
  }, [selectedNodeId]);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#080c14] overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        direction={direction}
        onToggleDirection={() => {
          setDirection(d => (d === 'TB' ? 'LR' : 'TB'));
          setTimeout(() => {
            reactFlow.fitView({ padding: 0.18, duration: 450 });
          }, 80);
        }}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onSelectPreset={handleSelectPreset}
        onResetView={handleResetView}
      />

      {/* Main Graph Canvas Area */}
      <div className="relative flex-1 w-full h-full">
        {/* Floating Breadcrumbs Bar */}
        <div className="absolute top-3 left-4 z-20">
          <Breadcrumbs
            selectedNodeId={selectedNodeId}
            focusedNodeId={focusedNodeId}
            onSelectNode={handleSelectNode}
            onClearFocus={handleClearFocus}
          />
        </div>

        {/* React Flow Core Engine */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => handleSelectNode(node.id)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.15}
          maxZoom={2.2}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          className="bg-[#080c14]"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.2}
            color="#1e293b"
          />
          <Controls position="bottom-right" className="!mr-4 !mb-4" />
          <MiniMap
            position="bottom-left"
            className="!ml-4 !mb-16 hidden md:block"
            nodeColor={(n) => {
              switch (n.type) {
                case 'system':
                  return '#06b6d4';
                case 'module':
                  return '#10b981';
                case 'service':
                  return '#3b82f6';
                case 'database':
                  return '#14b8a6';
                case 'external':
                  return '#a855f7';
                case 'infrastructure':
                  return '#f59e0b';
                case 'schema':
                  return '#38bdf8';
                case 'security':
                  return '#f43f5e';
                default:
                  return '#64748b';
              }
            }}
          />
        </ReactFlow>

        {/* Legend Overlay */}
        <Legend />

        {/* Right Detail Panel */}
        <DetailPanel
          node={selectedNodeData}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onFocusNode={handleFocusNode}
          onToggleExpand={handleToggleExpand}
          isExpanded={selectedNodeId ? expandedNodeIds.has(selectedNodeId) : false}
          onSelectNode={handleSelectNode}
        />
      </div>

      {/* Global Architecture Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />
    </div>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
