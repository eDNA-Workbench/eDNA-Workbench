
import { useTree } from '../../context/TreeContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { replaceNodeWithSubtree, rerootTree } from '../../utils/TreeUtils.js';
import Phylotree from '../tree/Phylotree.jsx';
import ContextMenu from '../ui/ContextMenu.jsx';

const TreeViewer = () => {
  const { state, loadNewick, toggleCollapse, unmergeNode, closeContextMenu } = useTree();
  const { treeInstance, contextMenu } = state;
  const { settings } = useUI();
  
  if (!treeInstance) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: '#888' }}>Please upload a Newick file to start.</p>
      </div>
    );
  }

  /* Handlers */
  const handleCollapseSubtree = () => {
    const { nodeId, isNodeCollapsed } = contextMenu;
    if (!nodeId) return closeContextMenu();

    if (isNodeCollapsed) {
       // Expand (Unmerge)
       if (state.merged[nodeId]) {
         const subtreeNewick = state.merged[nodeId].subtreeNewick;
         const updatedNewick = replaceNodeWithSubtree(
           treeInstance, 
           nodeId,
           subtreeNewick
         );
         
         if (updatedNewick) {
           unmergeNode(nodeId);
           loadNewick(updatedNewick);
         }
       } else {
         toggleCollapse(nodeId);
       }
    } else {
      // Collapse (Merge)
      // Logic to calculate subtreeNewick for merge is complex, usually done in NodeRename but here we just collapse visually if no rename
      // If we want detailed Merge like v1, we need to replicate handleNodeRename logic or similar
      // For now, simple toggle
      toggleCollapse(nodeId);
    }
    closeContextMenu();
  };

  const handleMoveToRoot = () => {
    const { nodeId } = contextMenu;
    if (!nodeId) return closeContextMenu();

    const result = rerootTree(treeInstance, state.newick, nodeId);
    if (result.success) {
      loadNewick(result.newNewick);
    } else {
      console.error(result.message);
    }
    closeContextMenu();
  };

  return (
    <div className="viewport-container" style={{ padding: '20px', minWidth: '100%', minHeight: '100%', position: 'relative' }}>
      <ContextMenu 
        visible={contextMenu.visible}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onCollapseSubtree={handleCollapseSubtree}
        onMoveToRoot={handleMoveToRoot}
        isNodeCollapsed={contextMenu.isNodeCollapsed}
      />
      <svg width={settings.width} height={settings.height}>
        <Phylotree />
      </svg>
    </div>
  );
};

export default TreeViewer;