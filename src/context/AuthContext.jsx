import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../lib/firebase";
import { onAuthStateChanged, signInWithRedirect, signOut, getRedirectResult, setPersistence, browserLocalPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Handle redirect result
    useEffect(() => {
        const checkRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    console.log("Redirect login successful:", result.user.uid);
                }
            } catch (error) {
                console.error("Redirect login error:", error);
                alert("Login failed: " + error.message);
            }
        };
        checkRedirect();
    }, []);

    const login = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithRedirect(auth, googleProvider);
        } catch (error) {
            console.error("Login initiation error:", error);
            alert("Could not start login: " + error.message);
        }
    };

    const logout = () => signOut(auth);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth state changed:", currentUser?.uid);
            setLoading(true);
            try {
                setUser(currentUser);

                if (currentUser) {
                    // Fetch user profile from Firestore
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        if (data.isSuspended) {
                            await signOut(auth);
                            alert("Your account has been suspended by the admin.");
                            return;
                        }
                        setUserData(data);
                    } else {
                        setUserData(null); // Profile not setup yet
                    }
                } else {
                    setUserData(null);
                }
            } catch (error) {
                console.error("Auth state handling error:", error);
            } finally {
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
