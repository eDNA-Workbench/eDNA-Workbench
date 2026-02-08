# Analysis Pipeline
This tool processes raw Next-Generation Sequencing (NGS) reads to separate them into projects, sampling sites, and species.

**Inputs Required:**
*   **Paired-end reads:** FASTQ format. Files must be named with "R1" and "R2" (e.g., `eDNA_R1.fastq`, `eDNA_R2.fastq`).
*   **Tags File:** A comma-separated file (CSV) containing 6 columns **without** titles: Project ID, Location ID, Forward Barcode, Forward Primer, Reverse Barcode, Reverse Primer (e.g., `tags.csv`).
*   **Reference Sequence:** FASTA format file from NCBI with species names in the defline (e.g., `NCBI_ref.fa`). To be uploaded at the workflow page.

**Outputs:**
The pipeline produces summary and species-level files upon completion.
**1. General Summary**
*   **Location vs. Species Table:** A comma-separated (CSV) file summarizing ASV counts for each location against identified species, found at the top of the results page.

**2. Individual Species Files**
For each identified species, the pipeline generates three distinct files:

*   **Multiple Sequence Alignment (MSA):** A FASTA file containing aligned sequences.
    *   *Defline Format:* `>Direction_ReadIndex_ProjectID_LocationID,ASV_Index_Count`
    *   *Example:* `>R1f_139_ZpDL_YTR,ASV_0_5`
    *   *Key:*
        *   **R1f:** Read direction (R1 = from R1 file, f = Forward).
        *   **139:** Read index number from the raw FASTQ file.
        *   **ZpDL:** Project ID.
        *   **YTR:** Location ID.
        *   **ASV_0_5:** ASV information (Index 0, Total of 5 identical reads).
*   **Low-Occurrence Reads:** A file containing reads excluded from the final analysis due to low frequency.
*   **Location vs. ASV Table:** A comma-separated (CSV) file detailing ASV counts per location for that specific species.

Compressed files are provided for convenient download.

**Workflow Steps:**
1.  **Data Preprocessing:** Trims barcode/primer sequences and separates reads by Project ID.
2.  **Merge & Filter:** Merges paired-end reads using PEAR and filters by length.
3.  **Species Assignment:** Identifies species using BLAST (default identity: 98%).
4.  **Alignment:** Performs Multiple Sequence Alignment (MSA) using MAFFT.
5.  **ASV Identification:** Filters for Amplicon Sequence Variants based on copy number (default min: 3).
6.  **Table Generation:** Produces location-ASV tables.

**Key Parameters:**
*   **Project Selection:** Run one project at a time.
*   **Merged-read lengths:** Enter minimum and maximum lengths.
*   **Identity %:** Default is 98% for species assignment.
*   **Min Copies:** Default is 3 to determine an ASV.
