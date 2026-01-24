import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import PostCard from "../components/PostCard";
import { HiArrowLeft } from "react-icons/hi";

const SinglePostPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            try {
                const docRef = doc(db, "posts", postId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setPost(null);
                }
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    if (loading) {
        return (
            <div className="flex justify-center pt-20 text-neutral-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="pt-20 px-4 text-center">
                <h2 className="text-xl font-bold text-white mb-2">Post not found</h2>
                <p className="text-neutral-500 mb-4">This post may have been deleted.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="text-blue-500 hover:underline"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="pb-20 pt-4 px-4 min-h-screen">
            <header className="flex items-center gap-4 mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-neutral-800 text-white"
                >
                    <HiArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-white">Post</h1>
            </header>

            <PostCard post={post} />
        </div>
    );
};

export default SinglePostPage;
