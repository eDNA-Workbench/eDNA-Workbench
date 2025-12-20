import React, { useState, useEffect } from "react";
import "../../styles/GeneTable.css";

const CVSTable = ({
  displayedHeaders,
  displayedTableData,
  hapColors,
  selectedLocations,
  onSelectedLocationsChange,
  setFilterMode,
  minPercentage,
  maxPercentage,
  setMinPercentage,
  setMaxPercentage,
}) => {
  // === Location State ===
  const [locations, setLocations] = useState([]);
  const [selectedLocationsState, setSelectedLocationsState] = useState({}); 

  const [Mode, setMode] = useState("all");
  

  // === Effect for Extracting Locations ===
  useEffect(() => {
    const locationNames = displayedTableData.map((row) => row[0]);
    setLocations(locationNames);
  }, [displayedTableData]);

  // === Effect for Initializing Location Selection ===
  useEffect(() => {
    if (locations.length > 0 && Object.keys(selectedLocationsState).length === 0) {
      const initialSelected = locations.reduce((acc, loc) => {
        acc[loc] = true; 
        return acc;
      }, {});
      
      if (JSON.stringify(selectedLocationsState) !== JSON.stringify(initialSelected)) {
        setSelectedLocationsState(initialSelected);
        onSelectedLocationsChange(initialSelected); 
      }
    }
  }, [locations, selectedLocationsState, onSelectedLocationsChange]);

  // === Handle Location Change ===
  const handleLocationChange = (location) => {
    const updatedSelection = { ...selectedLocationsState };

    if (updatedSelection[location]) {
      delete updatedSelection[location]; 
    } else {
      updatedSelection[location] = true; 
    }

    setSelectedLocationsState(updatedSelection);
    onSelectedLocationsChange(updatedSelection); 
  };

  // === Select / Clear All Locations ===
  const handleSelectAllLocations = () => {
    const allSelected = locations.reduce((acc, loc) => {
      acc[loc] = true;
      return acc;
    }, {});
    setSelectedLocationsState(allSelected); 
    onSelectedLocationsChange(allSelected); 
  };

  const handleClearAllLocations = () => {
    const allCleared = locations.reduce((acc, loc) => {
      acc[loc] = false;
      return acc;
    }, {});
    setSelectedLocationsState(allCleared); 
    onSelectedLocationsChange(allCleared); 
  };

  // === Search and Filter Logic ===
  const [showPercentage, setShowPercentage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHeaders = displayedHeaders.filter((header, index) =>
    index < 2 || header.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTableData = displayedTableData.map((row) =>
    row.filter((cell, colIndex) => filteredHeaders.includes(displayedHeaders[colIndex]))
  );

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode); // 更新 filterMode 狀態
    setMode(mode);

    if (mode === "range") {
      setShowPercentage(true);
    }
  };

  return (
  <div className="CVSTable-container">
    {/* Search Bar */}
    <div className="CVSTable-search-container">
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="CVSTable-search-input"
      />
    </div>

    {/* Filter Mode Buttons */}
    <div className="CVSTable-filter-buttons">
      Show on Map:
      <button 
        onClick={() => handleFilterModeChange("all")} 
        className={`CVSTable-button ${Mode === "all" ? "active" : ""}`}
      >
        Show all
      </button>
      <button 
        onClick={() => handleFilterModeChange("range")} 
        className={`CVSTable-button ${Mode === "range" ? "active" : ""}`}
      >
        Show {minPercentage} % ~ {maxPercentage} %
      </button>
    </div>

        {Mode === "range" && (
          <div className="CVSTable-percentage-range">
             <label> Percentage Range: </label>
              <input
                type="number"
                value={minPercentage}
                onChange={(e) => setMinPercentage(Math.max(0.01, Number(e.target.value)))}
                min="0"
                max="100"
                className="CVSTable-percentage-input"
              />
              -
              <input
                type="number"
                value={maxPercentage}
                onChange={(e) => setMaxPercentage(Number(e.target.value))}
                min="0"
                max="100"
                className="CVSTable-percentage-input"
              />
          </div>
        )}

        <div className="CVSTable-percentage-toggle" style={{ whiteSpace: "nowrap" }}>
          <div className="CVSTable-toggle-button">
            <button onClick={() => setShowPercentage((prev) => !prev)}>
              {showPercentage ? "Display Value" : "Display Percentage"}
            </button>
          </div>
        </div>
        

    {/* Gene Table */}
    <div className="CVSTable-gene-table-container">
      <div className="CVSTable-gene-table-wrapper">
        <table className="CVSTable-gene-table">
          <thead>
            <tr>
              {filteredHeaders.map((header, idx) => (
                <th key={idx}>
                  {header === "locations" ? (
                    <>
                      locations
                      <div>
                        <button onClick={handleSelectAllLocations}>All</button>
                        <button onClick={handleClearAllLocations}>Clear</button>
                      </div>
                    </>
                  ) : header === "ASV_total" ? (
                    "total"
                  ) : header.startsWith("ASV_") ? (
                    <span className="CVSTable-header-hap">
                      <span
                        className="CVSTable-color-box"
                        style={{
                          backgroundColor: hapColors[header] || "#101010ff",
                        }}
                      />
                      {header}
                    </span>
                  ) : (
                    header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredTableData.slice(1).map((row, rowIndex) => {
              const total = parseInt(row[1]) || 0;
              const isRowTransparent = total === 0;

              return (
                <tr key={rowIndex} style={{ opacity: isRowTransparent ? 0.3 : 1 }}>
                  {/* First column for checkbox and location */}
                  <td>
                    {rowIndex !== filteredTableData.length && row[0] !== "total count" && (
                      <input
                        type="checkbox"
                        checked={selectedLocationsState[row[0]] || false}
                        onChange={() => handleLocationChange(row[0])}
                      />
                    )}
                    <span>{row[0]}</span>
                  </td>

                  {/* Render other columns */}
                  {row.slice(1).map((cell, colIndex) => {
                    const isHapCol = colIndex >= 1;
                    const rawValue = parseInt(cell) || 0;
                    const displayValue = isHapCol
                      ? showPercentage
                        ? total > 0
                          ? `${((rawValue / total) * 100).toFixed(2)}%`
                          : "0.00%"
                        : rawValue
                      : cell;

                    let bgColor = undefined;
                    if (isHapCol) {
                      if (!showPercentage && rawValue > 0) {
                        bgColor = "var(--chart-4)";
                      } else if (showPercentage && total > 0) {
                        const percent = (rawValue / total) * 100;
                        if (percent >= minPercentage && percent <= maxPercentage) {
                          bgColor = "var(--chart-4)";
                        }
                      }
                    }

                    return (
                      <td
                        key={colIndex}
                        style={{
                          backgroundColor: bgColor,
                          textAlign: "center",
                        }}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

};

export default CVSTable;
