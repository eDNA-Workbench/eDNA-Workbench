import { useEffect } from 'react';
// import TreeCanvas from './components/canvas/TreeCanvas.jsx';
// import Controls from './components/controls/Controls.jsx';
// import { TreeProvider, useTree } from './contexts/TreeContext.jsx';

const PhylotreeApp = ({ initialNewick }) => {
  const { dispatch } = useTree();

  useEffect(() => {
    if (initialNewick) {
      dispatch({ type: 'LOAD_DATA', payload: initialNewick });
    }
  }, [initialNewick, dispatch]);

  return (
    <div className="app-layout">
      {/* <Controls />
      <TreeCanvas /> */}
    </div>
  );
};

export default function App({ initialNewick }) {
  return (
    <>
      {/* <LeftPanel /> */}
      <PhylotreeApp initialNewick={initialNewick} />
      {/* <RightPanel /> */}
    </>
  );
}