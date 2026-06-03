import { useState } from "react";
import { uploadCrop } from "./api";

export default function UploadCrop() {
  const [name, setName] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [images, setImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("shelfLifeDays", shelfLife);

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    try {
      const res = await uploadCrop(formData);
      alert(" Crop uploaded successfully");
      console.log(res);
    } catch {
      alert(" Upload failed");
    }
  };

  return (
    <div className="card">
      <h2> Upload Crop</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Crop Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Shelf Life (days)"
          value={shelfLife}
          onChange={(e) => setShelfLife(e.target.value)}
          required
        />

        <input
          type="file"
          multiple
          onChange={(e) => setImages(e.target.files)}
          required
        />

        <button type="submit">Upload</button>
      </form>
    </div>
  );
}
