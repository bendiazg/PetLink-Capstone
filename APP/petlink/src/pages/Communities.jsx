import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../style/Communities.css";

function Communities() {
  const [myCommunities, setMyCommunities] = useState([]);
  const [otherCommunities, setOtherCommunities] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const memberQ = query(
        collection(db, "communityMembers"),
        where("userId", "==", user.uid)
      );
      const memberSnap = await getDocs(memberQ);
      const myIds = memberSnap.docs.map(d => d.data().communityId);

      const commSnap = await getDocs(collection(db, "communities"));
      const all = commSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setMyCommunities(all.filter(c => myIds.includes(c.id)));
      setOtherCommunities(all.filter(c => !myIds.includes(c.id)));
    };

    load();
  }, [user]);

  const renderCommunity = (c) => (
    <div
      key={c.id}
      className="communityCard"
      onClick={() => navigate(`/communities/${c.id}`)}
    >
      {c.photoURL ? (
        <img src={c.photoURL} alt="comunidad" />
      ) : (
        <div className="communityCard__placeholder">👥</div>
      )}

      <div className="communityCard__info">
        <strong>{c.name}</strong>

        <p className="communityCard__desc">
          {c.description?.length > 80
            ? c.description.slice(0, 80) + "…"
            : c.description}
        </p>

        <div className="communityCard__meta">
          <span>👥 {c.membersCount || 0}</span>
          <span>📝 {c.postsCount || 0}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="communities">
      <button
        className="createCommunityBtn"
        onClick={() => navigate("/communities/create")}
      >
        ➕ Crear comunidad
      </button>

      <h2>Mis comunidades</h2>
      {myCommunities.length === 0 && <p>No perteneces a comunidades.</p>}
      {myCommunities.map(renderCommunity)}

      <h2>Explorar comunidades</h2>
      {otherCommunities.length === 0 && <p>No hay más comunidades.</p>}
      {otherCommunities.map(renderCommunity)}
    </div>
  );
}

export default Communities;
