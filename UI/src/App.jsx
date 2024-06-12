import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const CHUNK_SIZE = 1024 * 1024 * 5; // 1MB chunk size

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) return;

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedChunks = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const chunkFilename = `${file.name}-part${chunkIndex}`; // Construct filename
      const formData = new FormData();
      formData.append("chunk", chunk, chunkFilename); // Pass filename with chunk

      formData.append("chunkIndex", chunkIndex);
      formData.append("totalChunks", totalChunks);
      formData.append("fileName", file.name);

      // Send chunk data to the server
      await axios.post("http://localhost:3000/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((chunkIndex / totalChunks) * 100);
          setUploadProgress(percentCompleted);
        },
      });

      uploadedChunks++;
      setUploadProgress((uploadedChunks / totalChunks) * 100);
    }

    alert("Upload complete");
  };

  return (
    <div className="App">
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadFile}>Upload</button>
      <div>Progress: {uploadProgress}%</div>
    </div>
  );
}

export default App;
