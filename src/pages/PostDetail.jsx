import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useParams, useNavigate } from "react-router-dom";
import "../style/PostDetail.css";

function PostDetail() {
  const { communityId, postId } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likedPost, setLikedPost] = useState(false);
  const [postLikeId, setPostLikeId] = useState(null);
  const [commentLikes, setCommentLikes] = useState({});
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [fullscreenImg, setFullscreenImg] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db, "communityPosts", postId), snap => {
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
    });
  }, [postId]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "communityMembers"),
      where("communityId", "==", communityId),
      where("userId", "==", user.uid)
    );

    return onSnapshot(q, snap => {
      if (!snap.empty) {
        setIsAdmin(snap.docs[0].data().role === "admin");
      }
    });
  }, [communityId, user]);

  useEffect(() => {
    const q = query(
      collection(db, "postComments"),
      where("postId", "==", postId)
    );

    return onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [postId]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "postReactions"),
      where("postId", "==", postId),
      where("userId", "==", user.uid)
    );

    return onSnapshot(q, snap => {
      if (!snap.empty) {
        setLikedPost(true);
        setPostLikeId(snap.docs[0].id);
      } else {
        setLikedPost(false);
        setPostLikeId(null);
      }
    });
  }, [postId, user]);

  const togglePostLike = async () => {
    if (!user || !post) return;

    if (likedPost) {
      await deleteDoc(doc(db, "postReactions", postLikeId));
      await updateDoc(doc(db, "communityPosts", postId), {
        reactionsCount: Math.max((post.reactionsCount || 1) - 1, 0)
      });
    } else {
      await addDoc(collection(db, "postReactions"), {
        postId,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "communityPosts", postId), {
        reactionsCount: (post.reactionsCount || 0) + 1
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "commentReactions"),
      where("userId", "==", user.uid)
    );

    return onSnapshot(q, snap => {
      const map = {};
      snap.docs.forEach(d => {
        map[d.data().commentId] = d.id;
      });
      setCommentLikes(map);
    });
  }, [user]);

  const toggleCommentLike = async (comment) => {
    if (!user) return;

    const likeId = commentLikes[comment.id];

    if (likeId) {
      await deleteDoc(doc(db, "commentReactions", likeId));
      await updateDoc(doc(db, "postComments", comment.id), {
        reactionsCount: Math.max((comment.reactionsCount || 1) - 1, 0)
      });
    } else {
      await addDoc(collection(db, "commentReactions"), {
        commentId: comment.id,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "postComments", comment.id), {
        reactionsCount: (comment.reactionsCount || 0) + 1
      });
    }
  };

  const addComment = async () => {
    if (!commentText.trim() || !user) return;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;

    const u = snap.data();

    await addDoc(collection(db, "postComments"), {
      postId,
      communityId,
      authorId: user.uid,
      authorName: `${u.firstName} ${u.lastName}`,
      authorPhotoURL: u.photoURL || "",
      text: commentText,
      parentCommentId: replyTo,
      reactionsCount: 0,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "communityPosts", postId), {
      commentsCount: (post.commentsCount || 0) + 1
    });

    setCommentText("");
    setReplyTo(null);
  };

  const deletePost = async () => {
    if (!isAdmin) return;
    if (!window.confirm("¿Eliminar esta publicación?")) return;

    await updateDoc(doc(db, "communityPosts", postId), {
      hidden: true
    });

    navigate(-1);
  };

  if (!post) return <p>Cargando publicación...</p>;

  const rootComments = comments.filter(c => !c.parentCommentId);
  const replies = id => comments.filter(c => c.parentCommentId === id);

  return (
    <div className="postDetail">
      <header className="postDetail__header">
        <button className="backBtn" onClick={() => navigate(-1)}>⬅ Volver</button>
        <h2>Publicación</h2>

        {isAdmin && (
          <button className="deletePostBtn" onClick={deletePost}>🗑️</button>
        )}
      </header>

      <div className="postCard">
        <div
          className="author"
          onClick={() => navigate(`/profile/${post.authorId}`)}
        >
          <img src={post.authorPhotoURL || "/avatar.png"} />
          <strong>{post.authorName}</strong>
          {post.authorRole === "admin" && <span className="role">ADMIN</span>}
        </div>

        <p className="text">{post.text}</p>

        {post.images?.length > 0 && (
          <div className="imageGrid">
            {post.images.map((img, i) => (
              <img key={i} src={img} onClick={() => setFullscreenImg(img)} />
            ))}
          </div>
        )}

        <div className="actions">
          <button onClick={togglePostLike}>
            {likedPost ? "❤️" : "🤍"} {post.reactionsCount || 0}
          </button>
          <span>💬 {post.commentsCount || 0}</span>
        </div>
      </div>

      <div className="comments">
        {rootComments.map(c => (
          <div key={c.id} className="comment">
            <img src={c.authorPhotoURL || "/avatar.png"} />

            <div className="commentContent">
              <div
                className="commentHeader"
                onClick={() => navigate(`/profile/${c.authorId}`)}
              >
                {c.authorName}
              </div>

              <div className="commentText">{c.text}</div>

              <div className="commentActions">
                <div className="commentActions__left">
                  <button onClick={() => setReplyTo(c.id)}>Responder</button>
                </div>

                <div className="commentActions__right">
                  <button
                    className="likeBtn"
                    onClick={() => toggleCommentLike(c)}
                  >
                    {commentLikes[c.id] ? "❤️" : "🤍"}
                  </button>
                  <span>{c.reactionsCount || 0}</span>
                </div>
              </div>

              {replies(c.id).map(r => (
                <div key={r.id} className="reply">
                  <div className="commentContent">
                    <div className="commentHeader">{r.authorName}</div>
                    <div className="commentText">{r.text}</div>

                    <div className="commentActions">
                      <div className="commentActions__right">
                        <button
                          className="likeBtn"
                          onClick={() => toggleCommentLike(r)}
                        >
                          {commentLikes[r.id] ? "❤️" : "🤍"}
                        </button>
                        <span>{r.reactionsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="commentBox">
        <textarea
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder={replyTo ? "Responder…" : "Escribe un comentario…"}
        />
        <button onClick={addComment}>
          {replyTo ? "Responder" : "Publicar"}
        </button>
      </div>

      {fullscreenImg && (
        <div className="lightbox" onClick={() => setFullscreenImg(null)}>
          <img src={fullscreenImg} />
        </div>
      )}
    </div>
  );
}

export default PostDetail;
