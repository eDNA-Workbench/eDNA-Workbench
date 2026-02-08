
/**
 * Traverse the tree and collect all internal nodes (or all nodes) into a Map
 * Key: node unique_id
 * Value: node object (with x, y coordinates from layout)
 */
export const collectInternalNodes = (tree) => {
  const map = new Map();
  if (!tree) return map;

  const traverse = (node) => {
    // Collect ALL nodes
    if (node.unique_id) {
        // Map layout props to x/y for easier consumption
        node.x = node.data.abstract_x;
        node.y = node.data.abstract_y;
        map.set(node.unique_id, node);
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
  };

  traverse(tree);
  return map;
};

/**
 * Determine which branches should be hidden based on collapsed nodes.
 * A branch is hidden if its target node is a descendant of a collapsed node.
 * Returns a Set of hidden node IDs (target IDs of hidden links).
 */
export const getHiddenBranches = (tree, collapsedNodes) => {
  const hiddenNodeIds = new Set();
  if (!tree) return hiddenNodeIds;

  const traverse = (node, isHidden) => {
    if (isHidden) {
      hiddenNodeIds.add(node.unique_id);
    }

    // Check if this node is collapsed
    const currentlyCollapsed = collapsedNodes.has(node.unique_id);
    const nextHidden = isHidden || currentlyCollapsed;

    if (node.children) {
      node.children.forEach(child => traverse(child, nextHidden));
    }
  };

  // Root is never hidden by a parent (it has none), but check if it's collapsed itself for children
  traverse(tree, false);
  return hiddenNodeIds;
};

/**
 * Determine if a node itself should be hidden.
 * A node is hidden if any of its ancestors are collapsed.
 */
export const shouldHideInternalNode = (nodeId, node, collapsedNodes) => {
   // We need to check ancestry. 
   // Since the 'node' object here might come from d3 hierarchy or phylotree which usually links to parent
   // We can traverse up.
   
   let current = node.parent;
   while(current) {
       if (collapsedNodes.has(current.unique_id)) {
           return true;
       }
       current = current.parent;
   }
   return false;
};
