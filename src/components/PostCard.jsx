import { formatDistanceToNow } from "date-fns";
import { HiHeart, HiOutlineHeart, HiUserCircle, HiChatAlt, HiTrash } from "react-icons/hi";
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
    // const isLiked = post.likes?.includes(user?.uid); // This will be replaced by hasLiked state

    const [hasLiked, setHasLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(post.likes || []);

    useEffect(() => {
        // Check if the current user has liked this post
        // This would typically involve checking a subcollection or a specific field
        // For now, we'll assume post.likes is an array of user UIDs for initial setup
        // If you move to a subcollection for likes, this logic will need to be updated
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
                    <p className="font-semibold text-sm">
                        {post.isAnonymous ? (
                            "Anonymous GG Student"
                        ) : (
                            <Link to={`/u/${post.authorId}`} className="hover:underline">
                                {post.authorName}
                            </Link>
                        )}
                    </p>
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

                {user?.uid === post.authorId && (
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 transition-colors text-neutral-600 hover:text-red-500 ml-auto"
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
