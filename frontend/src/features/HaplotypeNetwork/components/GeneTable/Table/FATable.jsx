import React, { useEffect, useRef, useState } from "react";
import "../../styles/GeneTable.css";

const FATable = ({
  paginatedGenes,
  geneColors,
  locations,
  selectedLocations,
  onSelectedLocationsChange,
  externalSelectedGenes = [],
  onSelectedGenesChange,
  onEditGeneCount,
  onEditGeneCountBulk,
  updateMapData,
  genes, // full list of genes
  viewMode,
  showOnlySelected,
  setShowOnlySelected,
}) => {
  const selectedGenesSet = new Set(externalSelectedGenes);
  const clearClicked = useRef(false);

  // === Pagination State ===
  const [currentPage, setCurrentPage] = useState(1);
  const genesPerPage = 10;

  // === Search State ===
  const [searchQuery, setSearchQuery] = useState("");

  // === Filter Genes ===
  const filteredGenes = showOnlySelected
    ? genes.filter((gene) => selectedGenesSet.has(gene.name))
    : genes;

  const searchFilteredGenes = searchQuery
    ? filteredGenes.filter((gene) =>
        gene.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredGenes;

  // === Genes for Current Page ===
  const indexOfLastGene = currentPage * genesPerPage;
  const indexOfFirstGene = indexOfLastGene - genesPerPage;
  const currentGenes = searchFilteredGenes.slice(indexOfFirstGene, indexOfLastGene);

  // === Handle Location Selection ===
  useEffect(() => {
    if (locations.length > 0 && Object.keys(selectedLocations).length === 0) {
      const initialSelected = locations.reduce((acc, loc) => {
        acc[loc] = true;
        return acc;
      }, {});
      onSelectedLocationsChange?.(initialSelected);
    }
  }, [locations, selectedLocations, onSelectedLocationsChange]);

  // === Select All Genes on Genes Change ===
  useEffect(() => {
    if (genes.length > 0) {
      handleSelectAllGenes();
    }
  }, [genes]);

  // === Gene Selection Logic ===
  const toggleGeneSelection = (geneName) => {
    const currentSelected = externalSelectedGenes || [];
    const newSelected = selectedGenesSet.has(geneName)
      ? currentSelected.filter((name) => name !== geneName)
      : [...currentSelected, geneName];
    onSelectedGenesChange?.(newSelected);
  };

  // === Location Selection Logic ===
  const toggleLocationSelection = (loc) => {
    const updated = { ...selectedLocations };
    updated[loc] = !updated[loc];
    onSelectedLocationsChange?.(updated);
  };

  // === Handle Select All Genes ===
  const handleSelectAllGenes = () => {
    const currentlySelected = new Set(externalSelectedGenes);
    const genesToSelect = searchFilteredGenes.map((gene) => gene.name);
    const allSelectedGenes = [...currentlySelected, ...genesToSelect];
    const uniqueSelectedGenes = [...new Set(allSelectedGenes)];
    onSelectedGenesChange?.(uniqueSelectedGenes);
  };

  // === Handle Clear All Genes ===
  const handleClearAllGenes = () => {
    clearClicked.current = true;
    const genesToDeselect = searchFilteredGenes.map((gene) => gene.name);
    const genesToKeep = externalSelectedGenes.filter((gene) => !genesToDeselect.includes(gene));
    onSelectedGenesChange?.(genesToKeep);
  };

  // === Handle Select All Locations ===
  const handleSelectAllLocations = () =>
    onSelectedLocationsChange?.(
      locations.reduce((acc, loc) => ({ ...acc, [loc]: true }), {})
    );

  // === Handle Clear All Locations ===
  const handleClearAllLocations = () =>
    onSelectedLocationsChange?.(
      locations.reduce((acc, loc) => ({ ...acc, [loc]: false }), {})
    );

  // === Edit Gene Count ===
  const handleEditGeneCount = (geneName, location, newValue) => {
    const updatedCount = Math.max(0, Number(newValue) || 0);
    onEditGeneCount(geneName, location, updatedCount);
    setTimeout(() => updateMapData([location]), 0);
  };

  // === Pagination Handlers ===
  const nextPage = () => {
    if (currentPage < Math.ceil(searchFilteredGenes.length / genesPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="gene-table-container view-count">
      {/* Search Box */}
      <div style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
        <input
          className="gene-table-inputbox"
          type="text"
          placeholder="Search Genes"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); 
          }}
        />
      </div>

      {/* Select / Clear All Genes and Locations */}
      <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
        <div>
          <button onClick={handleSelectAllGenes} style={{ marginRight: "6px" }}>
            All ASV
          </button>
          <button onClick={handleClearAllGenes}>Clear</button>
        </div>
        <div>
          <button onClick={handleSelectAllLocations} style={{ marginRight: "6px" }}>
            All Location
          </button>
          <button onClick={handleClearAllLocations}>Clear</button>
        </div>
      </div>

      {/* Gene Table */}
      <div className="gene-table-wrapper">
        <table className="gene-table">
          <thead>
            <tr>
              <th>
                {viewMode === "count" && (
                  <label style={{ fontSize: 15, display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={showOnlySelected}
                      onChange={() => {
                        const next = !showOnlySelected;
                        if (next) setCurrentPage(1); 
                        setShowOnlySelected(next);
                      }}
                      style={{ marginRight: 6 }}
                    />
                    Show selected
                  </label>
                )}
              </th>
              <th>ASV</th>
              {locations.map((loc) => (
                <th key={loc}>
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={!!selectedLocations[loc]}
                      onChange={() => toggleLocationSelection(loc)}
                    />
                    <span>{loc}</span>
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentGenes.map((gene) => (
              <tr key={gene.name}>
                {/* Gene Selection */}
                <td>
                  <input
                    type="checkbox"
                    checked={selectedGenesSet.has(gene.name)}
                    onChange={() => toggleGeneSelection(gene.name)}
                  />
                </td>
                <td>
                  <span
                    className="color-box"
                    style={{ backgroundColor: geneColors[gene.name] || "black" }}
                  />
                  {gene.name}
                </td>
                {/* Location Data */}
                {locations.map((loc) => (
                  <td key={`${gene.name}-${loc}`}>
                    <input
                      type="number"
                      min="0"
                      value={gene.counts?.[loc] || 0}
                      onChange={(e) => handleEditGeneCount(gene.name, loc, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination">
        <button onClick={prevPage} disabled={currentPage === 1}>
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          {currentPage} / {Math.ceil(searchFilteredGenes.length / genesPerPage)}
        </span>
        <button onClick={nextPage} disabled={currentPage === Math.ceil(searchFilteredGenes.length / genesPerPage)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default FATable;
