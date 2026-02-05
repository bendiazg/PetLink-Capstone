import { useNavigate } from "react-router-dom";
import "../style/CommunityPostPreview.css";

function CommunityPostPreview({ post, communityId }) {
  const navigate = useNavigate();

  const MAX_TEXT_LENGTH = 160;
  const previewText =
    post.text.length > MAX_TEXT_LENGTH
      ? post.text.slice(0, MAX_TEXT_LENGTH) + "…"
      : post.text;

  return (
    <div
      className={`postPreview ${post.pinned ? "pinned" : ""}`}
      onClick={() =>
        navigate(`/communities/${communityId}/posts/${post.id}`)
      }
    >
      <div className="postPreview__header">
        {post.authorPhotoURL && (
          <img src={post.authorPhotoURL} alt="autor" />
        )}

        <div>
          <strong>
            {post.authorName}
            {post.authorRole === "admin" && " · ADMIN"}
            {post.pinned && " 📌"}
          </strong>
        </div>
      </div>

      <p className="postPreview__text">{previewText}</p>

      {post.images?.length > 0 && (
        <img
          src={post.images[0]}
          alt=""
          className="postPreview__image"
        />
      )}

      <div className="postPreview__meta">
        <span>❤️ {post.reactionsCount || 0}</span>
        <span>💬 {post.commentsCount || 0}</span>
      </div>
    </div>
  );
}

export default CommunityPostPreview;
