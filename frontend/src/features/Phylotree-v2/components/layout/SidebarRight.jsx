import { useTree } from '../../context/TreeContext.jsx';
import { useUI } from '../../context/UIContext.jsx';

const SidebarRight = () => {
  const { settings, updateSetting } = useUI();
  const { state: { treeInstance } } = useTree();

  const handleExportNewick = () => {
    // 這裡可以呼叫原本的 ExportService
    if(treeInstance) {
       // Logic to export
       console.log("Exporting Newick...");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px' }}>Controls</h2>

      {/* Layout Style */}
      <div className="control-group" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Layout Style</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={settings.alignTips === 'right'}
              onChange={(e) => updateSetting('alignTips', e.target.checked ? 'right' : 'left')}
            /> Align Tips Right
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
           <label>Sort Order:</label>
           <select 
             value={settings.sort || ''} 
             onChange={(e) => updateSetting('sort', e.target.value || null)}
             style={{ width: '100%', marginTop: '5px' }}
           >
             <option value="">None</option>
             <option value="ascending">Ascending</option>
             <option value="descending">Descending</option>
           </select>
        </div>
      </div>

      <hr style={{ margin: '20px 0', borderTop: '1px solid #ddd' }} />

      {/* Appearance */}
      <div className="control-group" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Appearance</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Width ({settings.width}px)</label>
          <input 
            type="range" min="300" max="2000" step="50"
            value={settings.width}
            onChange={(e) => updateSetting('width', Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Height ({settings.height}px)</label>
          <input 
            type="range" min="300" max="2000" step="50"
            value={settings.height}
            onChange={(e) => updateSetting('height', Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
           <label>
             <input 
               type="checkbox"
               checked={settings.showInternalLabels}
               onChange={(e) => updateSetting('showInternalLabels', e.target.checked)}
             /> Show Internal Labels
           </label>
        </div>
      </div>

      <hr style={{ margin: '20px 0', borderTop: '1px solid #ddd' }} />

      {/* Actions */}
      <div className="control-group">
        <button 
          onClick={handleExportNewick}
          style={{ 
            width: '100%', padding: '10px', 
            background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' 
          }}
        >
          Export Newick
        </button>
      </div>
    </div>
  );
};

export default SidebarRight;