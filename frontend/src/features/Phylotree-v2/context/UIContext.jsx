import { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  // Visual settings
  const [settings, setSettings] = useState({
    width: 800,
    height: 600,
    showInternalLabels: false,
    alignTips: 'left', // 'left', 'right'
    sort: null, // 'ascending', 'descending', null
    horizontalSpacing: 20,
    verticalSpacing: 20
  });

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <UIContext.Provider value={{ 
      settings, 
      updateSetting, 
      searchTerm, 
      setSearchTerm,
      searchResults, 
      setSearchResults 
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);