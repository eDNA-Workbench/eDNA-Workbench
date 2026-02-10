# ASV Distribution Map
This tool visualizes how ASVs are distributed across different sampling locations using map images and how ASVs are related with each other using haplotype networks.

**Inputs Required:**
*   **ASV Counts Table:** A CSV file where the first column is Location ID, the second is total ASV counts, and subsequent columns represent different ASVs (e.g., `ZpDL_Zacco_platypus.tbl.csv`).
*   **Geographic Coordinates:** An Excel file with **required** column titles: `Location_ID`, `Latitude`, `Longitude` (e.g., `LocationInfo.xlsx`) .
*   **MSA File:** Corresponding multiple sequence alignment file (e.g., `ZpDL_Zacco_platypus.asv.fa`) .
*   **Map Image:** An image file of the map corresponding to the coordinates.

**Functionalities:**
*   **ASVs Distribution Map:** Three ways to visualize the ASVs distribution across sampling sites, "By Location", "By Sequence", "Compare Components". 
*   **Haplotype Networks:** View relationships between haplotypes.
*   **Export:** Save network graphs as PNG files.

**Settings:**
*   Upload the map image and set the image Width and Height.
*   Select "By Location", "By Sequence", "Compare Components" to generate the views.