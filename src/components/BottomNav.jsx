import { NavLink } from "react-router-dom";
import { HiHome, HiBookOpen, HiUsers, HiChatAlt2, HiUserCircle } from "react-icons/hi";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

const BottomNav = () => {
    const { user } = useAuth();

    const navItems = [
        { name: "Feed", path: "/", icon: HiHome },
        { name: "Assignments", path: "/assignments", icon: HiBookOpen },
        { name: "Roommates", path: "/roommates", icon: HiUsers },
        { name: "Confessions", path: "/confessions", icon: HiChatAlt2 },
        { name: "Profile", path: `/u/${user?.uid}`, icon: HiUserCircle },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800 pb-safe">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                "flex flex-col items-center justify-center w-full h-full transition-colors",
                                isActive ? "text-blue-400" : "text-neutral-500 hover:text-neutral-300"
                            )
                        }
                    >
                        <item.icon size={24} />
                        <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
