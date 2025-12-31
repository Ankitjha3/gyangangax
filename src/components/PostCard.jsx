import { formatDistanceToNow } from "date-fns";
import { HiHeart, HiOutlineHeart, HiUserCircle, HiChatAlt, HiTrash, HiEye, HiCheckCircle } from "react-icons/hi";
import { MdVerified } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, deleteDoc, setDoc, getDoc, collection, addDoc, serverTimestamp, increment, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../lib/firebase";
import CommentSection from "./CommentSection";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const PostCard = ({ post }) => {
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const [hasLiked, setHasLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(post.likes || []);

    // View Counting Logic
    useEffect(() => {
        const incrementView = async () => {
            if (!user || !post.id) return;

            // Simple check: if already viewed, don't write.
            // Note: post.viewedBy comes from DB. For strict real-time View deduplication on client refresh,
            // we rely on the `post` prop being updated via onSnapshot in Feed.
            if (post.viewedBy?.includes(user.uid)) return;

            try {
                const postRef = doc(db, "posts", post.id);
                // Fire and forget
                updateDoc(postRef, {
                    viewedBy: arrayUnion(user.uid)
                });
            } catch (err) {
                console.error("Error tracking view:", err);
            }
        };

        incrementView();
    }, [user, post.id, post.viewedBy]);

    useEffect(() => {
        if (user && post.likes?.includes(user.uid)) {
            setHasLiked(true);
        } else {
            setHasLiked(false);
        }
        setLocalLikes(post.likes || []);
    }, [user, post.likes]);


    const toggleLike = async () => {
        if (!user) return;

        const postRef = doc(db, "posts", post.id);
        const likeRef = doc(db, "posts", post.id, "likes", user.uid);

        try {
            if (hasLiked) {
                // Optimistic UI update
                setLocalLikes(prev => prev.filter(id => id !== user.uid));
                setHasLiked(false);

                // Remove like
                await updateDoc(postRef, {
                    likes: arrayRemove(user.uid)
                });
                await deleteDoc(likeRef);
            } else {
                // Optimistic UI update
                setLocalLikes(prev => [...prev, user.uid]);
                setHasLiked(true);

                // Add like
                await updateDoc(postRef, {
                    likes: arrayUnion(user.uid)
                });
                await setDoc(likeRef, {
                    userId: user.uid,
                    timestamp: serverTimestamp()
                });

                // Send Notification
                if (post.authorId !== user.uid) {
                    await addDoc(collection(db, "users", post.authorId, "notifications"), {
                        type: "like",
                        senderId: user.uid,
                        senderName: user.displayName || user.email.split('@')[0], // Fallback
                        senderPhoto: user.photoURL,
                        postId: post.id,
                        timestamp: serverTimestamp(),
                        isRead: false
                    });
                }
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revert changes if error (not strictly necessary for MVP but good practice)
            setLocalLikes(post.likes || []);
            setHasLiked(post.likes?.includes(user.uid));
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            await deleteDoc(doc(db, "posts", post.id));
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    };

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                {post.isAnonymous ? (
                    <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center">
                        <HiUserCircle size={24} className="text-neutral-500" />
                    </div>
                ) : (
                    <Link to={`/u/${post.authorId}`} className="shrink-0">
                        <img
                            src={post.authorPhoto || "https://ui-avatars.com/api/?name=" + post.authorName}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                        />
                    </Link>
                )}
                <div>
                    <div className="flex items-center gap-1">
                        <p className="font-semibold text-sm">
                            {post.isAnonymous ? (
                                "Anonymous GG Student"
                            ) : (
                                <Link to={`/u/${post.authorId}`} className="hover:underline flex items-center gap-1">
                                    {post.authorName}
                                    {post.authorVerified && <MdVerified className="text-blue-500" size={16} title="Verified Student" />}
                                </Link>
                            )}
                        </p>
                    </div>
                    <p className="text-xs text-neutral-500">
                        {post.timestamp?.seconds
                            ? formatDistanceToNow(new Date(post.timestamp.seconds * 1000), { addSuffix: true })
                            : "Just now"}
                    </p>
                </div>
            </div>

            <div className="text-sm text-neutral-200 mb-3 whitespace-pre-wrap">
                {isExpanded || post.text.length <= 250 ? (
                    post.text
                ) : (
                    <>
                        {post.text.substring(0, 250)}...
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-blue-400 hover:text-blue-300 ml-1 font-medium hover:underline"
                        >
                            Read More
                        </button>
                    </>
                )}
                {isExpanded && post.text.length > 250 && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-neutral-500 hover:text-neutral-400 ml-2 text-xs font-medium hover:underline"
                    >
                        Show Less
                    </button>
                )}
            </div>

            {post.imageUrl && (
                <div className="rounded-lg overflow-hidden mb-3 border border-neutral-800">
                    <img src={post.imageUrl} alt="Post" className="w-full h-auto max-h-96 object-cover" />
                </div>
            )}

            <div className="flex items-center gap-4 text-neutral-400">
                <button
                    onClick={toggleLike}
                    className={`flex items-center gap-1.5 transition-colors ${hasLiked ? "text-pink-500" : "hover:text-pink-500"}`}
                >
                    {hasLiked ? <HiHeart size={20} /> : <HiOutlineHeart size={20} />}
                    <span className="text-sm">{localLikes.length}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-1.5 transition-colors ${showComments ? "text-blue-500" : "hover:text-blue-500"}`}
                >
                    <HiChatAlt size={20} />
                    <span className="text-sm">{post.commentCount || 0}</span>
                </button>

                <div className="flex items-center gap-1.5 text-neutral-500 ml-auto mr-2">
                    <HiEye size={20} />
                    <span className="text-sm">{post.viewedBy?.length || 0}</span>
                </div>

                {user?.uid === post.authorId && (
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 transition-colors text-neutral-600 hover:text-red-500"
                        title="Delete Post"
                    >
                        <HiTrash size={18} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showComments && <CommentSection collectionName="posts" postId={post.id} />}
            </AnimatePresence>
        </div>
    );
};

export default PostCard;
