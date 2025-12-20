import { create } from 'zustand';
import { TreeManager } from '../utils/TreeManager';

/**
 * useTreeStore
 * 全局狀態管理 (Global State Management)
 * 負責持有：
 * 1. 核心數據 (Newick 字串, Tree 物件)
 * 2. UI 設定 (寬高, 對齊, 排序)
 * 3. 互動狀態 (折疊, 重命名, 搜尋)
 */
const useTreeStore = create((set, get) => ({
  // ==========================================
  // 1. State (狀態變數)
  // ==========================================
  
  // --- 核心數據 ---
  newick: '',       // 原始 Newick 字串
  tree: null,       // 解析後的 phylotree 物件實例 (含 UUID)
  
  // --- UI 設定 ---
  settings: {
    width: 600,             // 畫布寬度
    height: 600,            // 畫布高度 (隨著展開可能會變大，但這是初始/可視區域)
    showInternalLabels: false,
    alignTips: 'left',      // 'left' | 'right'
    sort: null,             // null | 'ascending' | 'descending'
  },

  // --- 互動狀態 ---
  collapsedNodes: new Set(),   // 被折疊的節點 ID 集合 (Set<string>)
  renamedNodes: new Map(),     // 被重命名的節點 (Map<string, string>)
  highlightedNodes: new Set(), // 搜尋命中的節點 ID 集合 (Set<string>)
  searchTerm: '',              // 目前搜尋的關鍵字

  // ==========================================
  // 2. Actions (操作方法)
  // ==========================================

  /**
   * 設定並解析新的 Newick
   * 這是初始化的入口，每次上傳檔案或重置時呼叫
   */
  setNewick: (newickString) => {
    if (!newickString) return;

    try {
      // 1. 呼叫 TreeManager 進行解析
      // TreeManager.parseNewick 會負責賦予每個節點穩定的 UUID
      const treeInstance = TreeManager.parseNewick(newickString);
      
      set({
        newick: newickString,
        tree: treeInstance,
        // 重置所有互動狀態，因為換了一棵新樹
        collapsedNodes: new Set(),
        renamedNodes: new Map(),
        highlightedNodes: new Set(),
        searchTerm: ''
      });
    } catch (error) {
      console.error("Newick 解析失敗:", error);
      // 實際專案中可以增加一個 errorMsg state 來顯示給使用者
    }
  },

  /**
   * 更新 UI 設定 (支援部分更新)
   * 用法: updateSettings({ width: 800, alignTips: 'right' })
   */
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  /**
   * 切換節點的折疊/展開狀態
   * 這是「虛擬折疊」的核心開關
   */
  toggleNodeCollapse: (nodeId) => set((state) => {
    // 複製一個新的 Set 以觸發 React 更新
    const newSet = new Set(state.collapsedNodes);
    
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId); // 展開
    } else {
      newSet.add(nodeId);    // 折疊
    }
    
    return { collapsedNodes: newSet };
  }),

  /**
   * 批量設定折疊節點 (用於 Branch Length 閾值折疊)
   */
  setCollapsedNodes: (nodeIds) => set({
    collapsedNodes: new Set(nodeIds)
  }),

  /**
   * 重命名節點
   * 我們只更新 Map，不動原始 Tree 物件，保持 ID 穩定
   */
  renameNode: (nodeId, newName) => set((state) => {
    const newMap = new Map(state.renamedNodes);
    
    if (!newName || newName.trim() === "") {
      newMap.delete(nodeId); // 如果名稱為空，視為還原
    } else {
      newMap.set(nodeId, newName);
    }
    
    return { renamedNodes: newMap };
  }),

  /**
   * 搜尋功能
   * 遍歷樹狀結構找出符合名稱的節點 ID
   */
  search: (term) => {
    // 透過 get() 取得當前的樹
    const { tree } = get();
    
    if (!term || !term.trim()) {
      set({ searchTerm: '', highlightedNodes: new Set() });
      return;
    }

    const lowerTerm = term.toLowerCase();
    const matchedIds = new Set();

    // 簡單的遍歷搜尋
    if (tree && tree.nodes) {
       const traverse = (node) => {
         // 檢查原始名稱
         const name = node.data.name || '';
         // 也可以檢查重命名後的名稱 (視需求而定，這裡先檢查原始名稱)
         if (name.toLowerCase().includes(lowerTerm)) {
           matchedIds.add(node.unique_id);
         }
         if (node.children) node.children.forEach(traverse);
       };
       traverse(tree.nodes);
    }

    set({ searchTerm: term, highlightedNodes: matchedIds });
  },

  /**
   * 根據閾值自動折疊
   * 呼叫 Step 1 寫好的邏輯
   */
  collapseByThreshold: (threshold) => {
    const { tree } = get();
    if (!tree) return;

    // 使用 TreeManager 算出哪些 ID 該被折疊
    const nodesToCollapse = TreeManager.getNodesToCollapseByThreshold(tree, threshold);
    
    set({ collapsedNodes: nodesToCollapse });
  }
}));

export default useTreeStore;