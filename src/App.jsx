import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Feed from "./pages/Feed";
import Assignments from "./pages/Assignments";
import Roommates from "./pages/Roommates";
import Confessions from "./pages/Confessions";
import UserProfile from "./pages/UserProfile";
import { lazy, Suspense } from "react";
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
import AdminRoute from "./components/AdminRoute";
import Inbox from "./pages/Inbox";
import Chat from "./pages/Chat";
import NotificationsPage from "./pages/NotificationsPage";
import SinglePostPage from "./pages/SinglePostPage";
import StudyLinks from "./pages/StudyLinks";
import Marketplace from "./pages/Marketplace";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Feed />} />
            {/* <Route path="/assignments" element={<Assignments />} /> */}
            <Route path="/roommates" element={<Roommates />} />
            <Route path="/links" element={<StudyLinks />} />
            <Route path="/marketplace" element={<Marketplace />} />
            {/* <Route path="/confessions" element={<Confessions />} /> */}
            <Route path="/post/:postId" element={<SinglePostPage />} />
            <Route path="/u/:userId" element={<UserProfile />} />
            <Route path="/chats" element={<Inbox />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/admin" element={
              <AdminRoute>
                <Suspense fallback={<div className="p-10 text-center">Loading Admin...</div>}>
                  <AdminDashboard />
                </Suspense>
              </AdminRoute>
            } />
          </Route>

          <Route path="/chat/:chatId" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
