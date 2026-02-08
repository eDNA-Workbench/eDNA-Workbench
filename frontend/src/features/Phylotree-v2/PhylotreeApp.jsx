import { useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import { TreeProvider, useTree } from './context/TreeContext';
import { UIProvider } from './context/UIContext';
import './styles/phylotree.css';

function TreeLoader({ data }) {
  const { loadNewick } = useTree();

  useEffect(() => {
    if (data) {
      loadNewick(data);
    }
  }, [data, loadNewick]);

  return null;
}

function App({ initialNewick }) {
  return (
    <TreeProvider>
      <UIProvider>
        <TreeLoader data={initialNewick} />
        <MainLayout />
      </UIProvider>
    </TreeProvider>
  );
}

export default App;