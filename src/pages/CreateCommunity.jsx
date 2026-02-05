import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  setDoc,
  doc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../services/firebase";
import { useNavigate } from "react-router-dom";

import ImageCropper from "../components/ImageCropper";
import { getCroppedImage } from "../utils/imageCrop";
import "../style/CreateCommunity.css";

function CreateCommunity() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    isPrivate: false
  });

  const [iconSrc, setIconSrc] = useState(null);
  const [bannerSrc, setBannerSrc] = useState(null);
  const [iconPixels, setIconPixels] = useState(null);
  const [bannerPixels, setBannerPixels] = useState(null);
  const [cropType, setCropType] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    const communityRef = await addDoc(collection(db, "communities"), {
      name: form.name.trim(),
      description: form.description,
      isPrivate: form.isPrivate,
      ownerId: user.uid,
      photoURL: "",
      bannerURL: "",
      membersCount: 1,
      postsCount: 0,
      createdAt: serverTimestamp()
    });

    let photoURL = "";
    if (iconSrc && iconPixels) {
      const blob = await getCroppedImage(iconSrc, iconPixels);
      const refIcon = ref(storage, `communities/${communityRef.id}/icon`);
      await uploadBytes(refIcon, blob);
      photoURL = await getDownloadURL(refIcon);
    }

    let bannerURL = "";
    if (bannerSrc && bannerPixels) {
      const blob = await getCroppedImage(bannerSrc, bannerPixels);
      const refBanner = ref(storage, `communities/${communityRef.id}/banner`);
      await uploadBytes(refBanner, blob);
      bannerURL = await getDownloadURL(refBanner);
    }

    await setDoc(
      doc(db, "communities", communityRef.id),
      { photoURL, bannerURL },
      { merge: true }
    );

    await setDoc(
      doc(db, "communityMembers", `${communityRef.id}_${user.uid}`),
      {
        communityId: communityRef.id,
        userId: user.uid,
        role: "admin",
        joinedAt: serverTimestamp()
      }
    );

    navigate(`/communities/${communityRef.id}`);
  };

  return (
    <div className="createCommunity">
      <h2>Crear comunidad</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nombre de la comunidad"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />

        <textarea
          placeholder="Descripción de la comunidad"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />

        <div className="switchRow">
          <span>Comunidad privada</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={e =>
                setForm({ ...form, isPrivate: e.target.checked })
              }
            />
            <span />
          </label>
        </div>

        <div className="uploadSection">
          <div className="uploadPreview icon">
            {iconSrc ? <img src={iconSrc} alt="icon" /> : "👥"}
          </div>

          <label className="uploadBox">
            📸 Subir ícono
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                setIconSrc(URL.createObjectURL(e.target.files[0]));
                setCropType("icon");
              }}
            />
          </label>
        </div>

        <div className="uploadSection">
          <div className="uploadPreview banner">
            {bannerSrc ? <img src={bannerSrc} alt="banner" /> : "🖼️"}
          </div>

          <label className="uploadBox">
            🖼️ Subir banner
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                setBannerSrc(URL.createObjectURL(e.target.files[0]));
                setCropType("banner");
              }}
            />
          </label>
        </div>

        <button type="submit" className="submitBtn">
          Crear comunidad
        </button>
      </form>

      {cropType === "icon" && (
        <ImageCropper
          image={iconSrc}
          aspect={1}
          onCropComplete={setIconPixels}
          onConfirm={() => setCropType(null)}
          onCancel={() => setCropType(null)}
        />
      )}

      {cropType === "banner" && (
        <ImageCropper
          image={bannerSrc}
          aspect={3}
          onCropComplete={setBannerPixels}
          onConfirm={() => setCropType(null)}
          onCancel={() => setCropType(null)}
        />
      )}
    </div>
  );
}

export default CreateCommunity;
