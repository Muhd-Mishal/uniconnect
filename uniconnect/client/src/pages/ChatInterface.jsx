import { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import api, { aiService } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Send, User as UserIcon, Users, MessageSquare, Search, X, Info, Trash2, UserPlus, Bot, Loader2, ArrowLeft } from 'lucide-react';
import ChatSidebar from '../components/ChatSidebar';
import PageHero from '../components/PageHero';
import { usePopup } from '../components/PopupProvider';
import { SOCKET_URL, API_ORIGIN } from '../utils/runtimeConfig';

function ChatInterface() {
    const { user } = useContext(AuthContext);
    const popup = usePopup();
    const location = useLocation();
    const directUserId = location.state?.directUserId;
    const directUserName = location.state?.directUserName;

    const [socket, setSocket] = useState(null);
    const [connections, setConnections] = useState({ groups: [], directChats: [] });
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [showMobileSidebar, setShowMobileSidebar] = useState(true);

    const [showGroupModal, setShowGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [groupSearchQuery, setGroupSearchQuery] = useState('');
    const [groupSearchResults, setGroupSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isSearchingGroup, setIsSearchingGroup] = useState(false);

    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [groupMembers, setGroupMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showAddMemberSearch, setShowAddMemberSearch] = useState(false);
    const [addMemberQuery, setAddMemberQuery] = useState('');
    const [addMemberResults, setAddMemberResults] = useState([]);
    const [isSearchingAddMember, setIsSearchingAddMember] = useState(false);

    const messagesEndRef = useRef(null);
    const geminiEndRef = useRef(null);
    const [geminiMessages, setGeminiMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi, I am Gemini. Ask me anything about interview preparation, coding, or career guidance.'
        }
    ]);
    const [geminiInput, setGeminiInput] = useState('');
    const [geminiLoading, setGeminiLoading] = useState(false);
    const [geminiError, setGeminiError] = useState('');

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const { data } = await api.get('/chat/connections');
            setConnections(data);
            const savedChat = sessionStorage.getItem('activeChat');

            if (directUserId && directUserName) {
                const nextChat = { id: parseInt(directUserId, 10), name: directUserName, type: 'direct' };
                setActiveChat(nextChat);
                setShowMobileSidebar(false);
                sessionStorage.setItem('activeChat', JSON.stringify(nextChat));
            } else if (savedChat) {
                setActiveChat(JSON.parse(savedChat));
                setShowMobileSidebar(false);
            }
        } catch (error) {
            console.error('Failed to fetch chat connections:', error);
        }
    };

    useEffect(() => {
        if (activeChat) sessionStorage.setItem('activeChat', JSON.stringify(activeChat));
    }, [activeChat]);

    useEffect(() => {
        const nextSocket = io(SOCKET_URL);
        setSocket(nextSocket);
        return () => nextSocket.close();
    }, []);

    useEffect(() => {
        if (!activeChat || !socket || !user || activeChat.type === 'ai') return;

        const loadHistory = async () => {
            try {
                const endpoint = activeChat.type === 'group'
                    ? `/chat/history?group_id=${activeChat.id}`
                    : `/chat/history?receiver_id=${activeChat.id}`;
                const { data } = await api.get(endpoint);
                setMessages(data);

                const roomID = activeChat.type === 'group'
                    ? `group_${activeChat.id}`
                    : `direct_${Math.min(user.user_id, activeChat.id)}_${Math.max(user.user_id, activeChat.id)}`;

                socket.emit('joinRoom', roomID);
            } catch (error) {
                console.error('Failed to load chat history', error);
            }
        };

        loadHistory();
    }, [activeChat, socket, user]);

    useEffect(() => {
        if (!socket || !user || activeChat?.type === 'ai') return;

        const handleReceiveMessage = (message) => {
            const matchesGroup = activeChat?.type === 'group' && message.group_id === activeChat.id;
            const matchesDirect = activeChat?.type === 'direct' &&
                ((message.sender_id === activeChat.id && message.receiver_id === user.user_id) ||
                    (message.sender_id === user.user_id && message.receiver_id === activeChat.id));
            if (matchesGroup || matchesDirect) setMessages((current) => [...current, message]);
        };

        socket.on('receiveMessage', handleReceiveMessage);
        return () => socket.off('receiveMessage', handleReceiveMessage);
    }, [socket, activeChat, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        geminiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [geminiMessages, geminiLoading]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (groupSearchQuery.trim() === '') {
                setGroupSearchResults([]);
                setIsSearchingGroup(false);
                return;
            }

            setIsSearchingGroup(true);
            try {
                const { data } = await api.get(`/users/search?q=${encodeURIComponent(groupSearchQuery)}`);
                setGroupSearchResults(data.filter((candidate) => candidate.id !== user.user_id));
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearchingGroup(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [groupSearchQuery, user?.user_id]);

    useEffect(() => {
        if (showGroupInfo && activeChat?.type === 'group') {
            fetchGroupMembers();
        }
    }, [showGroupInfo, activeChat]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (addMemberQuery.trim() === '') {
                setAddMemberResults([]);
                setIsSearchingAddMember(false);
                return;
            }

            setIsSearchingAddMember(true);
            try {
                const { data } = await api.get(`/users/search?q=${encodeURIComponent(addMemberQuery)}`);
                const existingIds = groupMembers.map((member) => member.user_id);
                setAddMemberResults(data.filter((candidate) => !existingIds.includes(candidate.id)));
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearchingAddMember(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [addMemberQuery, groupMembers]);

    const fetchGroupMembers = async () => {
        if (!activeChat || activeChat.type !== 'group') return;
        setLoadingMembers(true);
        try {
            const { data } = await api.get(`/chat/groups/${activeChat.id}/members`);
            setGroupMembers(data);
        } catch (error) {
            console.error('Failed to fetch group members:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const toggleUserSelection = (candidate) => {
        if (selectedUsers.find((selected) => selected.id === candidate.id)) {
            setSelectedUsers((current) => current.filter((selected) => selected.id !== candidate.id));
        } else {
            setSelectedUsers((current) => [...current, candidate]);
        }
    };

    const handleSendMessage = (event) => {
        event.preventDefault();
        if (!inputMessage.trim() || !activeChat || !socket || !user || activeChat.type === 'ai') return;

        const roomID = activeChat.type === 'group'
            ? `group_${activeChat.id}`
            : `direct_${Math.min(user.user_id, activeChat.id)}_${Math.max(user.user_id, activeChat.id)}`;

        const payload = {
            sender_id: user.user_id,
            content: inputMessage,
            roomID,
            ...(activeChat.type === 'group' ? { group_id: activeChat.id } : { receiver_id: activeChat.id })
        };

        socket.emit('sendMessage', payload);
        setInputMessage('');
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || selectedUsers.length === 0) return;
        try {
            const { data } = await api.post('/chat/groups', {
                name: newGroupName,
                userIds: selectedUsers.map((selected) => selected.id)
            });
            setShowGroupModal(false);
            setNewGroupName('');
            setGroupSearchQuery('');
            setSelectedUsers([]);
            await fetchConnections();
            setActiveChat({ id: data.id, name: newGroupName, type: 'group' });
        } catch (error) {
            console.error(error);
            popup.alert('Error creating group.', {
                title: 'Group creation failed',
                tone: 'danger',
            });
        }
    };

    const removeMember = async (memberId) => {
        const confirmed = await popup.confirm('Are you sure you want to remove this member?', {
            title: 'Remove member',
            confirmLabel: 'Remove',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/chat/groups/${activeChat.id}/members/${memberId}`);
            fetchGroupMembers();
        } catch (error) {
            console.error(error);
            popup.alert(error.response?.data?.message || 'Error removing member', {
                title: 'Remove failed',
                tone: 'danger',
            });
        }
    };

    const handleAddMember = async (candidate) => {
        try {
            await api.post('/chat/groups/add', {
                group_id: activeChat.id,
                user_id: candidate.id
            });
            setAddMemberQuery('');
            setShowAddMemberSearch(false);
            fetchGroupMembers();
        } catch (error) {
            console.error(error);
            popup.alert(error.response?.data?.message || 'Error adding member', {
                title: 'Add failed',
                tone: 'danger',
            });
        }
    };

    const handleLeaveGroup = async () => {
        const confirmed = await popup.confirm('Are you sure you want to leave this group?', {
            title: 'Leave group',
            confirmLabel: 'Leave',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/chat/groups/${activeChat.id}/leave`);
            setShowGroupInfo(false);
            setActiveChat(null);
            sessionStorage.removeItem('activeChat');
            await fetchConnections();
        } catch (error) {
            console.error(error);
            popup.alert(error.response?.data?.message || 'Error leaving group', {
                title: 'Leave failed',
                tone: 'danger',
            });
        }
    };

    const handleDeleteGroup = async () => {
        const confirmed = await popup.confirm('Are you sure you want to delete this group? This action cannot be undone.', {
            title: 'Delete group',
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/chat/groups/${activeChat.id}`);
            setShowGroupInfo(false);
            setActiveChat(null);
            sessionStorage.removeItem('activeChat');
            await fetchConnections();
        } catch (error) {
            console.error(error);
            popup.alert(error.response?.data?.message || 'Error deleting group', {
                title: 'Delete failed',
                tone: 'danger',
            });
        }
    };

    const handleGeminiSend = async (event) => {
        event.preventDefault();
        const message = geminiInput.trim();
        if (!message || geminiLoading) return;

        const userEntry = { role: 'user', content: message };
        const nextMessages = [...geminiMessages, userEntry];
        setGeminiMessages(nextMessages);
        setGeminiInput('');
        setGeminiLoading(true);
        setGeminiError('');

        try {
            const historyPayload = nextMessages
                .slice(-12)
                .map((entry) => ({
                    role: entry.role,
                    content: entry.content
                }));

            const { data } = await aiService.chatbotReply(message, historyPayload);
            const reply = data?.reply?.trim() || 'I could not generate a response right now.';
            setGeminiMessages((current) => [...current, { role: 'assistant', content: reply }]);
        } catch (error) {
            setGeminiError(error.response?.data?.message || 'Failed to get Gemini response.');
        } finally {
            setGeminiLoading(false);
        }
    };

    const getInitial = (value) => value?.charAt(0)?.toUpperCase() || 'U';
    const isGroupAdmin = groupMembers.find((member) => member.user_id === user?.user_id)?.is_admin;
    const handleChatSelected = () => setShowMobileSidebar(false);
    const handleShowMobileSidebar = () => setShowMobileSidebar(true);

    return (
        <div className="space-y-6">
            <div className="hidden md:block">
                <PageHero eyebrow="Messaging" title="Conversations, groups, and collaboration" description="A cleaner messaging workspace for direct chat and group coordination." />
            </div>
            <div className="flex h-[calc(100vh-150px)] min-h-[560px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)] lg:h-[calc(100vh-220px)] lg:flex-row">
                <div className={`${showMobileSidebar ? 'flex' : 'hidden'} h-full w-full lg:flex lg:w-[320px] lg:shrink-0`}>
                    <ChatSidebar
                        connections={connections}
                        activeChat={activeChat}
                        setActiveChat={setActiveChat}
                        setShowGroupModal={setShowGroupModal}
                        onChatSelected={handleChatSelected}
                    />
                </div>

                <div className={`${showMobileSidebar ? 'hidden lg:flex' : 'flex'} h-full min-w-0 flex-1 flex-col ${showGroupInfo && activeChat?.type === 'group' ? 'border-r border-slate-200' : ''}`}>
                    {activeChat ? (
                        <>
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-4 sm:px-5">
                                <div className="flex items-center gap-3">
                                    <button onClick={handleShowMobileSidebar} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100">
                                        {activeChat.type === 'group' ? <Users size={20} className="text-slate-700" /> : activeChat.type === 'ai' ? <Bot size={20} className="text-slate-700" /> : <UserIcon size={20} className="text-slate-700" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="truncate text-base font-semibold text-slate-950 sm:text-lg">{activeChat.name}</h3>
                                        <p className="text-xs capitalize text-slate-400">{activeChat.type === 'ai' ? 'AI assistant' : `${activeChat.type} chat`}</p>
                                    </div>
                                </div>
                                {activeChat.type === 'group' && (
                                    <button onClick={() => setShowGroupInfo((current) => !current)} className={`rounded-full p-2 transition ${showGroupInfo ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                        <Info size={20} />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/80 p-3 sm:p-5">
                                {activeChat.type === 'ai' ? (
                                    <>
                                        {geminiMessages.map((message, index) => (
                                            <div key={`${message.role}-${index}`} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-[80%] rounded-[22px] px-4 py-3 text-sm shadow-sm ${message.role === 'assistant' ? 'rounded-bl-sm border border-slate-200 bg-white text-slate-800' : 'rounded-br-sm bg-slate-950 text-white'}`}>
                                                    {message.content}
                                                </div>
                                            </div>
                                        ))}
                                        {geminiLoading && (
                                            <div className="flex justify-start">
                                                <div className="inline-flex items-center gap-2 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Gemini is typing...
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    messages.map((message, index) => {
                                        const isMe = message.sender_id === user?.user_id;
                                        return (
                                            <div key={message.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm shadow-sm sm:max-w-[78%] lg:max-w-[70%] ${isMe ? 'rounded-br-sm bg-slate-950 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'}`}>
                                                    {!isMe && activeChat.type === 'group' && <div className="mb-1 text-xs font-semibold text-slate-500">{message.sender_name}</div>}
                                                    <div className="break-words">{message.content}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={activeChat.type === 'ai' ? geminiEndRef : messagesEndRef} />
                            </div>
                            <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
                                {activeChat.type === 'ai' ? (
                                    <>
                                        {geminiError && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{geminiError}</div>}
                                        <form onSubmit={handleGeminiSend} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={geminiInput}
                                                onChange={(event) => setGeminiInput(event.target.value)}
                                                placeholder="Ask Gemini anything..."
                                                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!geminiInput.trim() || geminiLoading}
                                                className="inline-flex items-center justify-center rounded-full bg-slate-950 p-3 text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                                            >
                                                {geminiLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input type="text" value={inputMessage} onChange={(event) => setInputMessage(event.target.value)} placeholder="Type your message..." className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" />
                                        <button type="submit" disabled={!inputMessage.trim()} className="inline-flex items-center justify-center rounded-full bg-slate-950 p-3 text-white transition hover:bg-slate-800 disabled:bg-slate-300">
                                            <Send size={18} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 text-center text-slate-400">
                            <MessageSquare size={64} className="mb-4 text-slate-300" />
                            <h3 className="text-xl font-medium text-slate-500">Select a chat to start messaging</h3>
                            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Choose a person or group from the list and the conversation will open here.</p>
                        </div>
                    )}
                </div>

                {showGroupInfo && activeChat?.type === 'group' && (
                    <div className="hidden w-[320px] border-l border-slate-200 bg-slate-50 p-4 lg:block">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">Group info</h3>
                            <button onClick={() => setShowGroupInfo(false)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="mb-4 rounded-2xl bg-white p-4">
                            <div className="text-sm font-semibold text-slate-950">{activeChat.name}</div>
                            <div className="mt-1 text-xs text-slate-500">{groupMembers.length} members</div>
                        </div>
                        <div className="space-y-3">
                            {loadingMembers ? (
                                <div className="text-sm text-slate-500">Loading members...</div>
                            ) : (
                                groupMembers.map((member) => (
                                    <div key={member.user_id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-xs font-semibold text-slate-600">
                                                {member.profile_pic ? (
                                                    <img src={`${API_ORIGIN}${member.profile_pic}`} alt={member.username} className="h-full w-full object-cover" />
                                                ) : (
                                                    getInitial(member.username)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium text-slate-900">
                                                    {member.username} {member.user_id === user?.user_id && <span className="text-slate-400">(You)</span>}
                                                </div>
                                                <div className="truncate text-xs text-slate-500">
                                                    {member.is_admin ? 'Group admin' : member.department || 'Member'}
                                                </div>
                                            </div>
                                        </div>
                                        {isGroupAdmin && !member.is_admin && (
                                            <button onClick={() => removeMember(member.user_id)} className="rounded-full p-2 text-rose-600 hover:bg-rose-50">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {isGroupAdmin && (
                            <div className="mt-6 border-t border-slate-200 pt-4">
                                {!showAddMemberSearch ? (
                                    <button
                                        onClick={() => setShowAddMemberSearch(true)}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                                    >
                                        <UserPlus size={16} />
                                        Add member
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-900">Add member</h4>
                                            <button
                                                onClick={() => {
                                                    setShowAddMemberSearch(false);
                                                    setAddMemberQuery('');
                                                }}
                                                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={addMemberQuery}
                                                onChange={(event) => setAddMemberQuery(event.target.value)}
                                                placeholder="Search users..."
                                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70"
                                            />
                                        </div>
                                        {isSearchingAddMember ? (
                                            <div className="py-4 text-center text-sm text-slate-500">Searching...</div>
                                        ) : addMemberResults.length > 0 ? (
                                            <div className="space-y-2">
                                                {addMemberResults.map((candidate) => (
                                                    <div key={candidate.id} className="flex items-center justify-between rounded-2xl bg-white p-3">
                                                        <span className="truncate text-sm font-medium text-slate-900">{candidate.name}</span>
                                                        <button
                                                            onClick={() => handleAddMember(candidate)}
                                                            className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : addMemberQuery.trim() !== '' ? (
                                            <div className="rounded-2xl bg-white p-3 text-center text-xs text-slate-500">No users found</div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleLeaveGroup}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                            >
                                <Trash2 size={16} />
                                Leave group
                            </button>
                            {isGroupAdmin && (
                                <button
                                    onClick={handleDeleteGroup}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
                                >
                                    <Trash2 size={16} />
                                    Delete group
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showGroupInfo && activeChat?.type === 'group' && (
                <div className="fixed inset-0 z-40 bg-slate-950/45 p-4 lg:hidden">
                    <div className="ml-auto h-full max-w-sm overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">Group info</h3>
                            <button onClick={() => setShowGroupInfo(false)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                            <div className="text-sm font-semibold text-slate-950">{activeChat.name}</div>
                            <div className="mt-1 text-xs text-slate-500">{groupMembers.length} members</div>
                        </div>
                        <div className="space-y-3">
                            {loadingMembers ? (
                                <div className="text-sm text-slate-500">Loading members...</div>
                            ) : (
                                groupMembers.map((member) => (
                                    <div key={member.user_id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white text-xs font-semibold text-slate-600">
                                                {member.profile_pic ? (
                                                    <img src={`${API_ORIGIN}${member.profile_pic}`} alt={member.username} className="h-full w-full object-cover" />
                                                ) : (
                                                    getInitial(member.username)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium text-slate-900">{member.username}</div>
                                                <div className="truncate text-xs text-slate-500">{member.is_admin ? 'Group admin' : member.department || 'Member'}</div>
                                            </div>
                                        </div>
                                        {isGroupAdmin && !member.is_admin && (
                                            <button onClick={() => removeMember(member.user_id)} className="rounded-full p-2 text-rose-600 hover:bg-rose-50">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
                    <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-slate-950">Create new group</h3>
                            <button onClick={() => setShowGroupModal(false)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                                <X size={18} />
                            </button>
                        </div>
                        <input type="text" value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="Enter group name..." className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" />
                        <div className="relative mb-4">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={groupSearchQuery} onChange={(event) => setGroupSearchQuery(event.target.value)} placeholder="Search users to add..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70" />
                        </div>
                        {selectedUsers.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {selectedUsers.map((selected) => (
                                    <button key={selected.id} type="button" onClick={() => toggleUserSelection(selected)} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                                        {selected.name}
                                        <X size={14} />
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="max-h-60 space-y-2 overflow-y-auto">
                            {isSearchingGroup ? (
                                <div className="py-8 text-center text-sm text-slate-500">Searching...</div>
                            ) : (
                                groupSearchResults.map((candidate) => {
                                    const isSelected = selectedUsers.some((selected) => selected.id === candidate.id);
                                    return (
                                        <button key={candidate.id} type="button" onClick={() => toggleUserSelection(candidate)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${isSelected ? 'border-slate-950 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-950">{candidate.name}</div>
                                                <div className="text-xs text-slate-500">{candidate.department}</div>
                                            </div>
                                            <div className="text-xs font-semibold text-slate-500">{isSelected ? 'Selected' : 'Add'}</div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowGroupModal(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                Cancel
                            </button>
                            <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || selectedUsers.length === 0} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
                                Create group
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatInterface;
