import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PrivateRoute from "./components/PrivateRoute";
import EditProfile from "./pages/EditProfile";
import CreatePet from "./pages/CreatePet";
import EditPet from "./pages/EditPet";
import PetSearch from "./pages/PetSearch";
import MyPets from "./pages/MyPets";
import PetDetail from "./pages/PetDetail";
import AdoptionRequests from "./pages/AdoptionRequests";
import Chats from "./pages/Chats";
import ChatDetail from "./pages/ChatDetail";
import AdoptionRequestDetail from "./pages/AdoptionRequestDetail";
import Notifications from "./pages/Notifications";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import CreateCommunity from "./pages/CreateCommunity";
import PostDetail from "./pages/PostDetail";
import CommunityMembers from "./pages/CommunityMembers";
import Map from "./pages/Map";




function App() {
  return (
    <Routes>
    
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/profile/:uid" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/" element={<PrivateRoute> <Home/> </PrivateRoute>}/>
      <Route path="/profile/edit" element={<PrivateRoute> <EditProfile /> </PrivateRoute>}/>
      <Route path="/pets/create" element={<PrivateRoute> <CreatePet /> </PrivateRoute>}/>
      <Route path="/pets/edit/:id" element={<PrivateRoute> <EditPet/> </PrivateRoute>}/>
      <Route path="/pets/search" element={<PrivateRoute> <PetSearch/> </PrivateRoute>}/>
      <Route path="/pets" element={<PrivateRoute> <MyPets/> </PrivateRoute>}/>
      <Route path="/adoption-requests" element={<PrivateRoute> <AdoptionRequests/> </PrivateRoute>}/>
      <Route path="/adoption-requests/:id" element={<PrivateRoute> <AdoptionRequestDetail/> </PrivateRoute>}/>
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/communities" element={<PrivateRoute><Communities /></PrivateRoute>} />
      <Route path="/communities/:id" element={<PrivateRoute><CommunityDetail /></PrivateRoute>} />
      <Route path="/communities/create" element={<PrivateRoute><CreateCommunity /></PrivateRoute>} />
  

      <Route path="/map" element={<Map />} />
      <Route path="/posts/:postId" element={<PrivateRoute><PostDetail /></PrivateRoute>}/>
      <Route path="/communities/:communityId/posts/:postId" element={<PostDetail />}/>
      <Route path="/communities/:id/members" element={<CommunityMembers />}/>
      <Route path="/requests" element={<AdoptionRequests />} />
      <Route path="/chats" element={<Chats />} />
      <Route path="/chat/:id" element={<ChatDetail />} />
      <Route path="/pets/:id" element={<PetDetail />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
