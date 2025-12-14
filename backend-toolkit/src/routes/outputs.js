import archiver from "archiver";
import express from "express";
import fs from "fs/promises";
import open from "open";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const safeJoin = (...parts) => path.normalize(path.join(...parts));

const getOutputsRoot = () => {
  return process.env.NODE_ENV === "production"
    ? path.join(os.homedir(), ".dna-barcode-toolkit", "outputs")
    : path.join(__dirname, "../../outputs");
};

async function listDirContents(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const result = {};

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const speciesName = entry.name;
        const speciesPath = safeJoin(dirPath, speciesName);
        const files = await fs.readdir(speciesPath);
        const fileInfos = [];

        for (const f of files) {
          if (path.extname(f) === ".list") continue;
          try {
            const stat = await fs.stat(safeJoin(speciesPath, f));
            fileInfos.push({
              filename: f,
              size: stat.size,
            });
          } catch (e) {
            // skip unreadable files
          }
        }

        result[speciesName] = fileInfos;
      }
    }

    return result;
  } catch (error) {
    return {};
  }
}

// GET /api/outputs/list
router.get("/list", async (req, res, next) => {
  try {
    const outputsRoot = getOutputsRoot();
    const separatedDir = path.join(outputsRoot, "separated");
    const tableDir = path.join(outputsRoot, "table");

    const separated = await listDirContents(separatedDir);
    const table = await listDirContents(tableDir);

    res.json({ success: true, separated, table });
  } catch (error) {
    next(error);
  }
});

router.post("/preview/:category/:species/:filename", async (req, res, next) => {
  try {
    const { category, species, filename } = req.params;

    const outputsRoot = getOutputsRoot();
    const filePath = safeJoin(outputsRoot, category, species, filename);

    if (!filePath.startsWith(path.join(outputsRoot, category, species))) {
      return res.status(400).json({ success: false, error: "Invalid file path" });
    }

    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    const tempDir = path.join(os.tmpdir(), "dna-toolkit-preview");
    await fs.mkdir(tempDir, { recursive: true });

    const tempFilename = `${filename}.txt`;
    const tempFilePath = path.join(tempDir, tempFilename);

    await fs.copyFile(filePath, tempFilePath);

    await open(tempFilePath);

    res.json({ success: true, message: "File opened for preview" });

  } catch (error) {
    console.error("Preview error:", error);

    res.status(500).json({ success: false, error: "Failed to open file: " + error.message });
  }
})

router.get("/download/:category/:species/:filename", async (req, res, next) => {
  try {
    const { category, species, filename } = req.params;

    // Only allow 'sperated' or 'table' as category
    if (!["separated", "table"].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be "separated" or "table"',
      });
    }

    // Build file path
    const outputsRoot = getOutputsRoot();
    const categoryDir = path.join(outputsRoot, category);
    const speciesDir = path.join(categoryDir, species);
    const filePath = safeJoin(speciesDir, filename);

    // 安全性檢查：確保檔案路徑在預期的目錄內
    if (!filePath.startsWith(speciesDir)) {
      return res.status(400).json({
        success: false,
        error: "Invalid file path",
      });
    }

    // 檢查檔案是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // 設定下載標頭
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // 發送檔案
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: "Error downloading file",
          });
        }
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    next(error);
  }
});

router.get("/download-species/:species", async (req, res, next) => {
  try {
    const { species } = req.params;
    const outputsRoot = getOutputsRoot();

    const zipFilename = `${species}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFilename}"`
    );

    const archive = archiver("zip", {
      zlib: { level: 9 }, // compression level (0-9, 9 is highest compression)
    });

    // 錯誤處理
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Error creating ZIP file",
        });
      }
    });

    // 將 archive 的輸出導向 response
    archive.pipe(res);

    // Add separated files
    const separatedDir = path.join(outputsRoot, "separated", species);
    try {
      await fs.access(separatedDir);
      const separatedFiles = await fs.readdir(separatedDir);

      for (const file of separatedFiles) {
        if (path.extname(file) === ".list") continue; // -- skip .list file
        const filePath = path.join(separatedDir, file);
        archive.file(filePath, { name: file });
      }
    } catch (error) {
      console.log(`No separated files for species: ${species}`);
    }

    //Add table file
    const tableDir = path.join(outputsRoot, "table", species);
    try {
      await fs.access(tableDir);
      const tableFiles = await fs.readdir(tableDir);

      for (const file of tableFiles) {
        const filePath = path.join(tableDir, file);
        archive.file(filePath, { name: file });
      }
    } catch (error) {
      console.log(`No table files for species: ${species}`);
    }

    await archive.finalize();
  } catch (error) {
    console.error("Download species ZIP error:", error);
    next(error);
  }
});

router.get("/download-all-files", async (req, res, next) => {
  try {
    const outputsRoot = getOutputsRoot();
    
    // Get project name from query param (e.g. "ZpDL_Candidia_barbatus" -> "ZpDL")
    const projectParam = req.query.project;
    let projectPrefix = "all-files";
    
    if (projectParam) {
      const parts = projectParam.split("_");
      if (parts.length > 0 && parts[0]) {
        projectPrefix = parts[0];
      }
    }

    const zipFilename = `${projectPrefix}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFilename}"`
    );

    const archive = archiver("zip", {
      zlib: { level: 9 }, // compression level (0-9, 9 is highest compression)
    });

    // 錯誤處理
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Error creating ZIP file",
        });
      }
    });

    // 將 archive 的輸出導向 response
    archive.pipe(res);

    const separatedRoot = path.join(outputsRoot, "separated");
    const tableRoot = path.join(outputsRoot, "table");

    try {
      // 1. Get all species directories from separated folder
      await fs.access(separatedRoot);
      const allSpeciesDirs = await fs.readdir(separatedRoot);
      
      // 2. Filter species by project prefix
      const targetSpecies = allSpeciesDirs.filter(dir => 
        dir.startsWith(projectPrefix) || projectPrefix === "all-files"
      );

      for (const species of targetSpecies) {
        // Define source paths
        const speciesSeparatedDir = path.join(separatedRoot, species);
        const speciesTableDir = path.join(tableRoot, species);

        // -- Add files from separated directory
        try {
          await fs.access(speciesSeparatedDir);
          const sepFiles = await fs.readdir(speciesSeparatedDir);
          for (const file of sepFiles) {
             if (path.extname(file) === ".list") continue;
             const filePath = path.join(speciesSeparatedDir, file);
             const stat = await fs.stat(filePath);
             if (!stat.isDirectory()) {
                 // Add to archive under species folder: Species/filename
                 archive.file(filePath, { name: path.join(species, file) });
             }
          }
        } catch (e) {
           // Ignore if directory doesn't exist or is empty
        }

        // -- Add files from table directory
        try {
          await fs.access(speciesTableDir);
          const tableFiles = await fs.readdir(speciesTableDir);
          for (const file of tableFiles) {
             const filePath = path.join(speciesTableDir, file);
             const stat = await fs.stat(filePath);
             if (!stat.isDirectory()) {
                 // Add to archive under species folder: Species/filename
                 archive.file(filePath, { name: path.join(species, file) });
             }
          }
        } catch (e) {
           // Ignore
        }
      }

    } catch (error) {
      console.log(`Error processing directories: ${error.message}`);
    }

    await archive.finalize();
  } catch (error) {
    console.error("Download all files ZIP error:", error);
    next(error);
  }
});

export default router;
