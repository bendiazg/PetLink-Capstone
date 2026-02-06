import { useState } from "react";

const REACTIONS = [
  { type: "like", label: "👍" },
  { type: "love", label: "❤️" },
  { type: "haha", label: "😂" },
  { type: "sad", label: "😢" },
  { type: "angry", label: "😡" }
];

function ReactionButton({ onSelect }) {

  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)}>
        Reaccionar
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "120%",
            display: "flex",
            gap: "6px",
            padding: "6px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "20px"
          }}
        >
          {REACTIONS.map(r => (
            <button
              key={r.type}
              onClick={() => {
                onSelect(r.type);
                setOpen(false);
              }}
              style={{ fontSize: "18px" }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReactionButton;
