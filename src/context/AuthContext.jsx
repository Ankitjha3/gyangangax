import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../lib/firebase";
import { onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);
            // Force account selection
            googleProvider.setCustomParameters({ prompt: 'select_account' });

            console.log("Starting popup login...");
            const result = await signInWithPopup(auth, googleProvider);
            console.log("Popup login success:", result.user.uid);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error("Login popup error:", error);
            alert("Login failed: " + error.message);
        }
    };

    const logout = () => signOut(auth);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth state changed. Current User UID:", currentUser?.uid);
            // Don't set loading to true immediately if we might just be initializing
            // But usually we want to block UI while fetching profile
            setLoading(true);

            try {
                setUser(currentUser);

                if (currentUser) {
                    // Fetch user profile from Firestore
                    console.log("Fetching profile for:", currentUser.uid);
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        console.log("Profile found:", data);

                        if (data.isSuspended) {
                            console.warn("User suspended. Signing out.");
                            await signOut(auth);
                            alert("Your account has been suspended by the admin.");
                            return; // loading will be set false in finally
                        }
                        setUserData(data);
                    } else {
                        console.log("No profile found for user.");
                        setUserData(null); // Profile not setup yet
                    }
                } else {
                    console.log("No user logged in.");
                    setUserData(null);
                }
            } catch (error) {
                console.error("Auth state handling error:", error);
            } finally {
                console.log("Auth loading finished.");
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        userData,
        isAdmin: user?.email === "ajha10597@gmail.com",
        loading,
        login,
        logout,
        setUserData, // To update after profile creation
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
