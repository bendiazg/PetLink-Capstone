import Cropper from "react-easy-crop";
import { useState } from "react";
import "../style/ImageCropper.css";

function ImageCropper({ image, aspect, onCropComplete, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  return (
    <div className="cropperOverlay">
      <div className="cropperContainer">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={aspect === 1 ? "round" : "rect"}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => onCropComplete(pixels)}
        />
      </div>

      <div className="cropperControls">
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
        />

        <div className="cropperActions">
          <button className="cancelBtn" onClick={onCancel}>
            Cancelar
          </button>
          <button className="confirmBtn" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropper;
