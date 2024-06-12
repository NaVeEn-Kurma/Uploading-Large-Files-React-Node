const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const uploadDir = path.join(__dirname, "uploads");
const tempDir = path.join(__dirname, "temp");

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend's origin
  })
);

// Ensure upload and temp directories exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log(`Created directory: ${uploadDir}`);
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
  console.log(`Created directory: ${tempDir}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    console.log("File field name:", file.fieldname);
    const [fileName, chunkIndex] = file.originalname.split("-part");
    const chunkFilename = `${fileName}-part${chunkIndex}`;
    console.log(`Saving chunk to: ${chunkFilename}`);
    cb(null, chunkFilename);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.any(), (req, res) => {
  const { totalChunks, fileName } = req.body;

  console.log("Request body in upload route:", req.body);

  const assembleChunks = () => {
    const writeStream = fs.createWriteStream(path.join(uploadDir, fileName));

    for (let i = 0; i < totalChunks; i++) {
      const partPath = path.join(tempDir, `${fileName}-part${i}`);
      console.log(`Checking for chunk: ${partPath}`);
      if (fs.existsSync(partPath)) {
        const data = fs.readFileSync(partPath);
        writeStream.write(data);
        console.log(`Chunk ${i} written.`);
      } else {
        console.error(`Chunk ${i} is missing at path: ${partPath}`);
        writeStream.end();
        res.status(500).send({ error: `Chunk ${i} is missing` });
        return;
      }
    }

    writeStream.end();
    console.log("File assembled successfully");
    res.send({ success: true });
  };

  if (parseInt(req.body.chunkIndex, 10) === totalChunks - 1) {
    console.log("All chunks received. Assembling file...");
    assembleChunks();
  } else {
    res.send({ success: true });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
