import { formatDistanceToNow } from "date-fns";
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { HiTrash } from "react-icons/hi";
import { useState } from "react";

const emojis = ["❤️", "😂", "😮", "😢", "😡"];

const ConfessionCard = ({ post }) => {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleReaction = async (emoji) => {
        if (!user) return;
        const postRef = doc(db, "confessions", post.id);

        // Find if user has already reacted with any emoji
        const currentEmoji = Object.keys(post.reactions || {}).find(key =>
            post.reactions[key]?.includes(user.uid)
        );

        if (currentEmoji === emoji) {
            // User clicked the same emoji -> remove it (toggle off)
            await updateDoc(postRef, {
                [`reactions.${emoji}`]: arrayRemove(user.uid)
            });
        } else {
            // User clicked a different emoji OR hasn't reacted yet
            const updates = {
                [`reactions.${emoji}`]: arrayUnion(user.uid)
            };

            // If there was a previous reaction, remove it
            if (currentEmoji) {
                updates[`reactions.${currentEmoji}`] = arrayRemove(user.uid);
            }

            await updateDoc(postRef, updates);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this confession?")) return;
        try {
            await deleteDoc(doc(db, "confessions", post.id));
        } catch (error) {
            console.error("Error deleting confession:", error);
        }
    };

    return (
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border-l-4 border-l-purple-600 rounded-r-xl p-5 mb-4 shadow-lg">
            <p className="text-xs text-purple-400 font-bold tracking-widest uppercase mb-2">Anonymous Confession</p>

            <p className="text-white font-serif text-lg leading-relaxed mb-4 whitespace-pre-wrap">
                "{isExpanded || post.text.length <= 250 ? (
                    post.text
                ) : (
                    <>
                        {post.text.substring(0, 250)}...
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-purple-400 hover:text-purple-300 ml-1 text-base font-bold underline"
                        >
                            Read More
                        </button>
                    </>
                )}"
                {isExpanded && post.text.length > 250 && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-neutral-500 hover:text-neutral-400 block mt-1 text-xs font-medium hover:underline"
                    >
                        Show Less
                    </button>
                )}
            </p>

            <div className="flex justify-between items-end">
                <div className="flex gap-2">
                    {emojis.map(emoji => {
                        const count = post.reactions?.[emoji]?.length || 0;
                        const active = post.reactions?.[emoji]?.includes(user?.uid);
                        return (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all active:scale-90 ${active ? "bg-white/20 text-white" : "text-neutral-500 hover:bg-white/10"}`}
                            >
                                <span>{emoji}</span>
                                {count > 0 && <span>{count}</span>}
                            </button>
                        );
                    })}
                </div>
                <span className="text-[10px] text-neutral-500">
                    {post.timestamp?.seconds ? formatDistanceToNow(new Date(post.timestamp.seconds * 1000), { addSuffix: true }) : "Just now"}
                </span>

                {user?.uid === post.authorId && (
                    <button
                        onClick={handleDelete}
                        className="text-neutral-600 hover:text-red-500 ml-2"
                        title="Delete"
                    >
                        <HiTrash size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ConfessionCard;
