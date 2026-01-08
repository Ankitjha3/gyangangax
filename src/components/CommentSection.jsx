import { useState, useEffect } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { HiPaperAirplane, HiTrash } from "react-icons/hi";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";

const CommentSection = ({ collectionName, postId, isAnonymous = false }) => {
    const { user, userData } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) return;

        const q = query(
            collection(db, collectionName, postId, "comments"),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return unsubscribe;
    }, [collectionName, postId]);

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        try {
            await addDoc(collection(db, collectionName, postId, "comments"), {
                text: newComment,
                authorId: user.uid,
                authorName: isAnonymous ? "Anonymous" : (userData?.name || "Anonymous"),
                timestamp: serverTimestamp(),
            });

            // Update parent document comment count
            const parentRef = doc(db, collectionName, postId);
            await updateDoc(parentRef, {
                commentCount: increment(1)
            });

            // Send Notification
            // Need to know post author ID. It's passed as prop or we need to fetch it?
            // "collectionName" implies we might be on a post or something else.
            // Assuming postId allows us to fetch the post, or we can pass authorId as prop to CommentSection to avoid extra fetch.
            // For now, let's fetch the parent doc to get authorId if we don't have it.
            // Optimization: Pass authorId to CommentSection. But let's check current usage.
            // PostCard passes simple props.
            // Let's do a quick fetch of parent doc to be safe and versatile.

            const parentSnap = await getDoc(parentRef);
            if (parentSnap.exists()) {
                const parentData = parentSnap.data();
                if (parentData.authorId && parentData.authorId !== user.uid) {
                    await addDoc(collection(db, "users", parentData.authorId, "notifications"), {
                        type: "comment",
                        senderId: user.uid,
                        senderName: isAnonymous ? "Anonymous" : (userData?.name || "Anonymous"),
                        senderPhoto: user.photoURL,
                        postId: postId, // Link back to post
                        timestamp: serverTimestamp(),
                        isRead: false
                    });
                }
            }

            setNewComment("");
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm("Delete this reply?")) return;
        try {
            await deleteDoc(doc(db, collectionName, postId, "comments", commentId));

            // Decrement parent document comment count
            const parentRef = doc(db, collectionName, postId);
            await updateDoc(parentRef, {
                commentCount: increment(-1)
            });
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-neutral-800 overflow-hidden"
        >
            <h4 className="text-sm font-semibold text-neutral-400 mb-3">Replies</h4>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
                <AnimatePresence>
                    {loading ? (
                        <p className="text-xs text-neutral-600">Loading replies...</p>
                    ) : comments.length === 0 ? (
                        <p className="text-xs text-neutral-600">No replies yet. Be the first!</p>
                    ) : (
                        comments.map((comment) => (
                            <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-neutral-800/50 rounded-lg p-3 group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-neutral-300">{comment.authorName}</span>
                                        <span className="text-[10px] text-neutral-500">
                                            {comment.timestamp?.seconds
                                                ? formatDistanceToNow(new Date(comment.timestamp.seconds * 1000), { addSuffix: true })
                                                : "Just now"}
                                        </span>
                                    </div>
                                    {/* Admin or Author can delete */}
                                    {(user?.uid === comment.authorId || userData?.email === "ajha10597@gmail.com" || userData?.role === "admin") && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                                            title="Delete Reply"
                                        >
                                            <HiTrash size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-200">{comment.text}</p>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <form onSubmit={handlePostComment} className="relative">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-0 transition-all"
                >
                    <HiPaperAirplane size={14} className="rotate-90" />
                </button>
            </form>
        </motion.div>
    );
};

export default CommentSection;
