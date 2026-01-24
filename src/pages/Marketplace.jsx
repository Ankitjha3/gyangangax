import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { HiPlus, HiTag, HiChatAlt, HiCurrencyRupee, HiTrash } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const Marketplace = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [categoryFilter, setCategoryFilter] = useState("All");
    const categories = ["All", "Books", "Electronics", "Stationery", "Lab Coat/Apron", "Tools", "Other"];

    useEffect(() => {
        const q = query(collection(db, "marketplace_items"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const filteredItems = categoryFilter === "All" ? items : items.filter(item => item.category === categoryFilter);

    const handleContact = async (item) => {
        if (!user) return;
        if (user.uid === item.sellerId) return;

        try {
            const participantIds = [user.uid, item.sellerId].sort();
            const chatId = `${participantIds[0]}_${participantIds[1]}`;
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                await setDoc(chatRef, {
                    participants: participantIds,
                    lastMessage: `Hi, I'm interested in buying: ${item.title}`,
                    lastMessageTimestamp: serverTimestamp(),
                    createdAt: serverTimestamp()
                });
            }
            navigate(`/chat/${chatId}`);
        } catch (error) {
            console.error("Error creating chat:", error);
        }
    };

    return (
        <div className="pb-24 pt-4 px-4 min-h-screen">
            <header className="flex justify-between items-center mb-6 sticky top-0 bg-neutral-950/80 backdrop-blur-md py-4 z-10 -mx-4 px-4 border-b border-neutral-800/50">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Marketplace
                </h1>
                <Link to={`/u/${user?.uid}`} className="w-10 h-10 rounded-full overflow-hidden border border-neutral-700">
                    <img
                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || "User"}&background=random`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </Link>
            </header>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === cat ? "bg-white text-black" : "bg-neutral-900 text-neutral-400 border border-neutral-800"}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-20 text-neutral-500">
                    <p>No items for sale.</p>
                    <p className="text-xs mt-2">Sell your old books or stuff!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col relative group">
                            {user?.uid === item.sellerId && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (window.confirm("Delete this item?")) {
                                            deleteDoc(doc(db, "marketplace_items", item.id));
                                        }
                                    }}
                                    className="absolute top-2 right-2 p-2 text-white bg-black/60 rounded-full hover:bg-red-600 transition-colors z-10"
                                    title="Delete Item"
                                >
                                    <HiTrash size={16} />
                                </button>
                            )}

                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover" />
                            ) : (
                                <div className="w-full h-32 bg-neutral-800 flex items-center justify-center text-neutral-600">
                                    <HiTag size={32} />
                                </div>
                            )}
                            <div className="p-3 flex-1 flex flex-col">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] text-yellow-500 bg-yellow-900/20 px-1.5 py-0.5 rounded uppercase tracking-wide font-bold mb-1 block w-fit">
                                        {item.category}
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                        {item.timestamp?.seconds ? formatDistanceToNow(new Date(item.timestamp.seconds * 1000), { addSuffix: true }) : ""}
                                    </span>
                                </div>
                                <h3 className="font-bold text-white text-sm truncate mb-1">{item.title}</h3>
                                <div className="text-green-400 font-bold text-sm mb-2 flex items-center">
                                    <HiCurrencyRupee /> {item.price}
                                </div>

                                <div className="mt-auto pt-3 border-t border-neutral-800 grid gap-2">
                                    {user?.uid === item.sellerId ? (
                                        <div className="flex flex-col gap-1 items-center py-1">
                                            <span className="text-xs text-neutral-500">Your Listing</span>
                                            {item.whatsapp && (
                                                <span className="text-[10px] text-green-500 flex items-center gap-1 bg-green-900/20 px-2 py-0.5 rounded-full">
                                                    <FaWhatsapp /> Linked
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {item.whatsapp && (
                                                <a
                                                    href={`https://wa.me/${item.whatsapp}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <FaWhatsapp size={14} /> WhatsApp
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleContact(item)}
                                                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            >
                                                <HiChatAlt size={14} /> Message
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-24 right-4 w-14 h-14 bg-yellow-500 text-black rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-400 transition-all active:scale-90 z-20"
            >
                <HiPlus size={28} />
            </button>

            {showModal && <SellItemModal onClose={() => setShowModal(false)} categories={categories} />}
        </div>
    );
};

const SellItemModal = ({ onClose, categories }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        price: "",
        category: "Books",
        description: "",
        whatsapp: ""
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async () => {
        if (!image) return null;

        const data = new FormData();
        data.append("file", image);
        data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        data.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: data
            });
            const file = await res.json();
            return file.secure_url;
        } catch (err) {
            console.error("Error uploading image:", err);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = "";
            if (image) {
                imageUrl = await uploadImage();
                if (!imageUrl) {
                    alert("Failed to upload image. Please check your internet or configuration.");
                    setLoading(false);
                    return;
                }
            }

            await addDoc(collection(db, "marketplace_items"), {
                ...formData,
                imageUrl,
                price: Number(formData.price),
                sellerId: user.uid,
                sellerName: user.displayName || "Student",
                timestamp: serverTimestamp()
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to list item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 w-full max-w-md rounded-2xl p-6 border border-neutral-800 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-4">Sell Item</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="flex justify-center mb-4">
                        <label className="cursor-pointer w-full h-40 bg-black border-2 border-dashed border-neutral-800 rounded-xl flex items-center justify-center relative overflow-hidden hover:border-yellow-500 transition-colors">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-neutral-500">
                                    <HiTag className="mx-auto mb-2" size={24} />
                                    <span className="text-xs">Tap to upload photo</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                    </div>

                    <input
                        required
                        placeholder="Item Name (e.g. Scientific Calculator)"
                        className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-yellow-500"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <input
                        type="tel"
                        placeholder="WhatsApp Number (Optional) e.g. 919876543210"
                        className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-yellow-500"
                        value={formData.whatsapp}
                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            required
                            type="number"
                            placeholder="Price (₹)"
                            className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-yellow-500"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                        />
                        <select
                            className="bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <textarea
                        required
                        placeholder="Condition, details, contact info..."
                        className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-yellow-500 h-24 resize-none"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-neutral-400 hover:bg-neutral-800">Cancel</button>
                        <button disabled={loading} type="submit" className="flex-1 py-3 rounded-xl font-bold bg-yellow-500 text-black hover:bg-yellow-400">
                            {loading ? "Listing..." : "List Item"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Marketplace;
