import { scaleLinear } from 'd3-scale';
import { useMemo } from 'react';
import { useTree } from '../../context/TreeContext';
import { useUI } from '../../context/UIContext';
import { useTreeLayout } from '../../hooks/useTreeLayout';
import Branch from './Branch';
import Node from './Node'; // 你需要把 InternalNode 和 NodeLabel 整合進這裡

// 從原本的程式碼中提取的輔助函式
import { collectInternalNodes, getHiddenBranches, shouldHideInternalNode } from '../../utils/tree-utils';

const Phylotree = () => {
  const { state: { treeInstance, collapsedNodes, renamedNodes, merged }, toggleCollapse, openContextMenu, renameNode } = useTree();
  const { settings, searchTerm } = useUI();

  // 1. 計算佈局 (這會給每個節點加上 x, y 座標)
  const processedTree = useTreeLayout(treeInstance, settings, collapsedNodes, merged);

  // 2. 建立 Scales (如果沒有 processedTree 就回傳 null)
  const { xScale, yScale, nodes, links } = useMemo(() => {
    if (!processedTree) return { nodes: [], links: [] };

    // 簡單的 Scale 計算 (依照你的需求調整)
    const padding = 20;
    const rightmost = settings.width - 150; // 預留 Label 空間
    
    const xScale = scaleLinear()
      .domain([0, processedTree.max_x])
      .range([0, rightmost]);
      
    const yScale = scaleLinear()
      .domain([0, processedTree.max_y])
      .range([padding, settings.height - padding]);

    // 過濾掉隱藏的分支
    const hiddenBranches = getHiddenBranches(processedTree.nodes, collapsedNodes);
    const visibleLinks = processedTree.links.filter(
      link => !hiddenBranches.has(link.target.unique_id)
    );
    
    const internalNodesMap = collectInternalNodes(processedTree.nodes);
    const visibleNodes = Array.from(internalNodesMap.entries())
        .filter(([id, nodeInfo]) => !shouldHideInternalNode(id, nodeInfo, collapsedNodes));

    return { xScale, yScale, nodes: visibleNodes, links: visibleLinks };
  }, [processedTree, settings, collapsedNodes]);

  if (!processedTree) return null;

  return (
    <g transform="translate(20, 0)">
      {/* 繪製分支 */}
      {links.map((link, i) => (
        <Branch 
          key={`branch-${i}`}
          link={link}
          xScale={xScale}
          yScale={yScale}
          settings={settings}
          searchTerm={searchTerm}
          onClick={() => console.log('Branch clicked', link)}
          onContextMenu={(e) => openContextMenu(e, link.target.unique_id, link.target, false)}
        />
      ))}

      {/* 繪製節點 (內部節點 + 葉子節點) */}
      {nodes.map(([id, nodeInfo]) => (
        <Node
          key={`node-${id}`}
          id={id}
          data={nodeInfo}
          x={xScale(nodeInfo.x)}
          y={yScale(nodeInfo.y)}
          isCollapsed={collapsedNodes.has(id)}
          renamedLabel={renamedNodes.get(id)}
          onRename={(newName) => renameNode(id, newName)}
          onContextMenu={(e) => openContextMenu(e, id, nodeInfo, collapsedNodes.has(id))}
        />
      ))}
    </g>
  );
};

export default Phylotree;