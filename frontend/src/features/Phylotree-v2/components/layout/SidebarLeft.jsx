import { useTree } from '../../context/TreeContext.jsx';
import { useUI } from '../../context/UIContext.jsx';

const SidebarLeft = () => {
  const { state: { loading, error } } = useTree();
  const { searchTerm, setSearchTerm } = useUI();

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px' }}>Data & Search</h2>
      
      {/* File Upload handled globally */}
      <div style={{ marginBottom: '20px' }}>
        {loading && <p>Loading tree...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      <hr style={{ margin: '20px 0', borderTop: '1px solid #ddd' }} />

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Search Nodes</label>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Species name..."
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      
      {/* 可以在這裡列出搜尋結果列表 */}
    </div>
  );
};

export default SidebarLeft;