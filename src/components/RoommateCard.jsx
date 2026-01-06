import { HiLocationMarker, HiCurrencyRupee, HiChatAlt } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { HiTrash } from "react-icons/hi";
import { useState } from "react";
import CommentSection from "./CommentSection";
import { AnimatePresence } from "framer-motion";

const RoommateCard = ({ post }) => {
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this listing?")) return;
        try {
            await deleteDoc(doc(db, "roommate_posts", post.id));
        } catch (error) {
            console.error("Error deleting listing:", error);
        }
    };
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4 shadow-sm relative overflow-hidden">
            <div className={clsx("absolute top-0 left-0 w-1 h-full",
                post.type === "Hostel" ? "bg-purple-500" : "bg-blue-500"
            )}></div>

            <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className={clsx("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide",
                            post.type === "Hostel" ? "bg-purple-900/30 text-purple-400" : "bg-blue-900/30 text-blue-400"
                        )}>
                            {post.type}
                        </span>
                        <span className="text-xs text-neutral-500 ml-2">
                            • {post.timestamp?.seconds ? formatDistanceToNow(new Date(post.timestamp.seconds * 1000), { addSuffix: true }) : "Just now"}
                            {post.authorId && (
                                <>
                                    {" • "}
                                    <Link to={`/u/${post.authorId}`} className="hover:text-neutral-300 hover:underline">
                                        View Profile
                                    </Link>
                                </>
                            )}
                        </span>
                    </div>
                    <span className="text-xs text-neutral-400 font-medium border border-neutral-800 px-2 py-1 rounded-md">
                        {post.gender} Only
                    </span>
                </div>

                <div className="mb-3">
                    <div className="flex items-center gap-1.5 text-neutral-300 mb-1">
                        <HiLocationMarker className="text-neutral-500 shrink-0" />
                        <h3 className="font-medium text-sm truncate">{post.location}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-400 font-mono text-sm">
                        <HiCurrencyRupee className="shrink-0" />
                        <span>₹{post.budget}/mo</span>
                    </div>
                </div>

                <div className="text-xs text-neutral-400 mb-4 whitespace-pre-wrap">
                    {isExpanded || post.description?.length <= 150 ? (
                        post.description
                    ) : (
                        <>
                            {post.description?.substring(0, 150)}...
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="text-blue-400 hover:text-blue-300 ml-1 font-medium hover:underline"
                            >
                                Read More
                            </button>
                        </>
                    )}
                    {isExpanded && post.description?.length > 150 && (
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-neutral-500 hover:text-neutral-400 ml-2 font-medium hover:underline"
                        >
                            Show Less
                        </button>
                    )}
                </div>

                <a
                    href={`https://wa.me/${post.contact}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-black font-bold py-2 rounded-lg hover:brightness-90 transition-all active:scale-95"
                >
                    <FaWhatsapp size={18} />
                    Chat on WhatsApp
                </a>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors py-2 border border-neutral-800 rounded-lg hover:bg-neutral-800"
                >
                    <HiChatAlt size={16} />
                    {showComments ? "Hide Replies" : `View Replies (${post.commentCount || 0})`}
                </button>

                <AnimatePresence>
                    {showComments && <CommentSection collectionName="roommate_posts" postId={post.id} />}
                </AnimatePresence>

                {user?.uid === post.authorId && (
                    <button
                        onClick={handleDelete}
                        className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors py-2 border border-red-900/30 rounded-lg hover:bg-red-900/10"
                    >
                        <HiTrash size={16} />
                        Delete Listing
                    </button>
                )}
            </div>
        </div >
    );
};

export default RoommateCard;
