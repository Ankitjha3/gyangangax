import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, getDocs, setDoc, deleteDoc, updateDoc, increment, serverTimestamp, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import EditProfileModal from "../components/EditProfileModal";
import UserListModal from "../components/UserListModal";
import { HiArrowLeft, HiCalendar, HiLocationMarker } from "react-icons/hi";
import { FaInstagram, FaLinkedin, FaGithub, FaLink } from "react-icons/fa";

const UserProfile = () => {
    const { userId } = useParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [listModalType, setListModalType] = useState(null); // "followers" | "following"
    const [followLoading, setFollowLoading] = useState(false);

    const isOwnProfile = user?.uid === userId;

    // Fetch Profile Data & Stats
    // Fetch Profile Data & Stats (Real-time)
    useEffect(() => {
        if (!userId) return;
        setLoading(true);

        const userRef = doc(db, "users", userId);
        const unsubUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfileData(data);
                setFollowerCount(data.followerCount || 0);
                setFollowingCount(data.followingCount || 0);
            } else {
                setProfileData(null);
            }
            setLoading(false); // First load done
        }, (error) => {
            console.error("Error fetching profile:", error);
            setLoading(false);
        });

        const postsQ = query(
            collection(db, "posts"),
            where("authorId", "==", userId),
            orderBy("timestamp", "desc")
        );

        const unsubPosts = onSnapshot(postsQ, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching posts:", error);
        });

        // Check following status (Real-time)
        let unsubFollow = () => { };
        if (user && !isOwnProfile) {
            const followRef = doc(db, "users", userId, "followers", user.uid);
            unsubFollow = onSnapshot(followRef, (snap) => {
                setIsFollowing(snap.exists());
            });
        }

        return () => {
            unsubUser();
            unsubPosts();
            unsubFollow();
        };
    }, [userId, user, isOwnProfile]);

    const handleMessage = async () => {
        if (!user) return;

        try {
            // Check if chat already exists
            // Note: This requires a composite index or a better data structure for efficiency. 
            // For MVP, we can query "chats" where participants array-contains user.uid, then filter client-side for the other user.
            // Or use a deterministic ID like "uid1_uid2" (sorted). Let's use deterministic ID for simplicity/efficiency!

            const participantIds = [user.uid, userId].sort();
            const chatId = `${participantIds[0]}_${participantIds[1]}`;
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                // Create new chat
                await setDoc(chatRef, {
                    participants: participantIds,
                    lastMessage: "",
                    lastMessageTimestamp: serverTimestamp(),
                    createdAt: serverTimestamp()
                });
            }

            navigate(`/chat/${chatId}`);
        } catch (error) {
            console.error("Error creating chat:", error);
            alert("Could not start chat.");
        }
    };

    const handleFollow = async () => {
        if (!user || followLoading) return;
        setFollowLoading(true);

        const targetUserRef = doc(db, "users", userId);
        const currentUserRef = doc(db, "users", user.uid);

        try {
            if (isFollowing) {
                // Unfollow
                await deleteDoc(doc(db, "users", userId, "followers", user.uid));
                await deleteDoc(doc(db, "users", user.uid, "following", userId));

                await updateDoc(targetUserRef, { followerCount: increment(-1) });
                await updateDoc(currentUserRef, { followingCount: increment(-1) });

                // State updates are handled by onSnapshot listener
            } else {
                // Follow
                await setDoc(doc(db, "users", userId, "followers", user.uid), { timestamp: serverTimestamp() });
                await setDoc(doc(db, "users", user.uid, "following", userId), { timestamp: serverTimestamp() });

                await updateDoc(targetUserRef, { followerCount: increment(1) });
                await updateDoc(currentUserRef, { followingCount: increment(1) });

                // Send Notification
                await addDoc(collection(db, "users", userId, "notifications"), {
                    type: "follow",
                    senderId: user.uid,
                    senderName: user.displayName || "Someone", // Profile data might not be in auth object fully, but usually displayName is there
                    senderPhoto: user.photoURL,
                    timestamp: serverTimestamp(),
                    isRead: false
                });

                // State updates are handled by onSnapshot listener
            }
        } catch (error) {
            console.error("Error updating follow status:", error);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center pt-20 text-neutral-500">Loading profile...</div>;
    }

    if (!profileData) {
        return <div className="flex justify-center pt-20 text-neutral-500">User not found.</div>;
    }

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur-md p-4 -mx-4 z-10 border-b border-neutral-900">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-neutral-800 text-white"
                >
                    <HiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white leading-tight">{profileData.name}</h1>
                    <p className="text-xs text-neutral-500">{posts.length} posts</p>
                </div>
            </div>

            {/* Profile Info */}
            <div className="mb-6 px-2">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-black bg-neutral-800">
                        <img
                            src={profileData.photoUrl || `https://ui-avatars.com/api/?name=${profileData.name}&background=random`}
                            alt={profileData.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {isOwnProfile ? (
                        <>
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="px-4 py-1.5 border border-neutral-600 rounded-full text-white font-bold text-sm hover:bg-neutral-900 transition-colors"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to logout?")) {
                                        logout();
                                        navigate("/login");
                                    }
                                }}
                                className="ml-2 px-4 py-1.5 border border-red-900/50 text-red-500 rounded-full font-bold text-sm hover:bg-red-900/20 transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={`px-6 py-1.5 rounded-full font-bold text-sm transition-all sm:text-base ${isFollowing
                                ? "border border-neutral-600 text-white hover:bg-red-900/20 hover:text-red-500 hover:border-red-900"
                                : "bg-white text-black hover:bg-neutral-200"
                                }`}
                        >
                            {isFollowing ? (followLoading ? "Wait..." : "Unfollow") : (followLoading ? "Wait..." : "Follow")}
                        </button>
                    )}
                    {!isOwnProfile && (
                        <button
                            onClick={handleMessage}
                            className="ml-2 px-4 py-1.5 rounded-full font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 transition-all border border-blue-500"
                        >
                            Message
                        </button>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-white">{profileData.name}</h2>
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-3">
                    {profileData.branch && <span>@{profileData.branch}</span>}
                    {profileData.year && <span>• {profileData.year}</span>}
                </div>

                {profileData.bio && (
                    <p className="text-neutral-200 mb-4 whitespace-pre-wrap">{profileData.bio}</p>
                )}

                {/* Social Links */}
                {profileData.socialLinks && (
                    <div className="flex gap-4 mb-4">
                        {profileData.socialLinks.instagram && (
                            <a
                                href={profileData.socialLinks.instagram.startsWith('http') ? profileData.socialLinks.instagram : `https://instagram.com/${profileData.socialLinks.instagram}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-pink-500 hover:text-pink-400 transition-colors"
                            >
                                <FaInstagram size={20} />
                            </a>
                        )}
                        {profileData.socialLinks.linkedin && (
                            <a
                                href={profileData.socialLinks.linkedin.startsWith('http') ? profileData.socialLinks.linkedin : `https://${profileData.socialLinks.linkedin}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 hover:text-blue-400 transition-colors"
                            >
                                <FaLinkedin size={20} />
                            </a>
                        )}
                        {profileData.socialLinks.github && (
                            <a
                                href={profileData.socialLinks.github.startsWith('http') ? profileData.socialLinks.github : `https://github.com/${profileData.socialLinks.github}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-white hover:text-gray-300 transition-colors"
                            >
                                <FaGithub size={20} />
                            </a>
                        )}
                    </div>
                )}

                <div className="flex gap-4 text-sm text-neutral-400 mb-4">
                    <button
                        onClick={() => setListModalType("following")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                        <span className="font-bold text-white">{followingCount}</span>
                        <span>Following</span>
                    </button>
                    <button
                        onClick={() => setListModalType("followers")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                        <span className="font-bold text-white">{followerCount}</span>
                        <span>Followers</span>
                    </button>
                </div>
            </div>

            {/* User Posts Header */}
            <div className="border-b border-neutral-800 mb-4 pb-2 px-2">
                <h3 className="text-lg font-bold text-white">Posts</h3>
            </div>

            {/* User Posts */}
            <div>
                {posts.length === 0 ? (
                    <div className="text-center py-10 text-neutral-600">
                        No posts yet.
                    </div>
                ) : (
                    posts.map(post => <PostCard key={post.id} post={post} />)
                )}
            </div>

            {isEditOpen && <EditProfileModal onClose={() => setIsEditOpen(false)} />}
            {listModalType && (
                <UserListModal
                    userId={userId}
                    type={listModalType}
                    onClose={() => setListModalType(null)}
                />
            )}
        </div>
    );
};

export default UserProfile;
