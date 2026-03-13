import React, { useState, useEffect, useContext, useRef } from 'react';
import { Bell } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../utils/api'; // Assuming standard axios instance
import { SOCKET_URL } from '../utils/runtimeConfig';

function NotificationBell() {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [socket, setSocket] = useState(null);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Fetch Initial Notifications
    useEffect(() => {
        if (!user) return;
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/notifications');
                setNotifications(data);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };
        fetchNotifications();
    }, [user]);

    // Initialize Socket & Listen
    useEffect(() => {
        if (!user) return;

        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        // Register user ID
        newSocket.emit('register', user.user_id || user.id);

        // Listen for realtime push
        newSocket.on('new_notification', (data) => {
            setNotifications(prev => [{
                ...data,
                id: Date.now(), // Local ephemeral ID 
                is_read: 0,
                created_at: new Date().toISOString()
            }, ...prev]);
        });

        return () => newSocket.close();
    }, [user]);

    // Handle Clicks Outside Dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleMarkAsRead = async () => {
        try {
            await api.put('/notifications/mark-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 z-[100] mt-2 w-80 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAsRead}
                                className="text-xs font-medium text-slate-600 hover:text-slate-950"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-3 border-b border-slate-100 p-3 transition hover:bg-slate-50 ${!notification.is_read ? 'bg-slate-50/80' : ''}`}
                                >
                                    {notification.source_image ? (
                                        <img
                                            src={notification.source_image}
                                            alt={notification.source_name || "User"}
                                            className="w-8 h-8 rounded-full object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/40'; }}
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                            <Bell size={14} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-700">
                                            {notification.source_name && <span className="font-semibold text-slate-950">{notification.source_name} </span>}
                                            {notification.message}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
