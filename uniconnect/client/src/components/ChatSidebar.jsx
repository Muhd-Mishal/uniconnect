import { Bot, User as UserIcon, Users } from 'lucide-react';
import { API_ORIGIN } from '../utils/runtimeConfig';

const getInitial = (value) => value?.charAt(0)?.toUpperCase() || 'U';

const ChatSidebar = ({ connections, activeChat, setActiveChat, setShowGroupModal, onChatSelected }) => {
    const handleSelect = (chat) => {
        setActiveChat(chat);
        onChatSelected?.(chat);
    };

    const directChats = connections.directChats || [];
    const groups = connections.groups || [];

    return (
        <div className="flex h-full w-full flex-col bg-white">
            <div className="border-b border-slate-200 px-5 pb-4 pt-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-3xl font-semibold tracking-tight text-slate-950">Chats</div>
                        <p className="mt-1 text-sm text-slate-400">Tap a person to open the conversation.</p>
                    </div>
                    <button
                        onClick={() => setShowGroupModal(true)}
                        className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                        New group
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-3">
                    <button
                        type="button"
                        onClick={() => handleSelect({ id: 'gemini', name: 'Gemini', type: 'ai' })}
                        className={`flex w-full items-center gap-4 rounded-[26px] px-4 py-4 text-left transition ${
                            activeChat?.type === 'ai' ? 'bg-slate-950 text-white' : 'hover:bg-slate-50'
                        }`}
                    >
                        <div className={`grid h-14 w-14 place-items-center rounded-full ${activeChat?.type === 'ai' ? 'bg-white/15' : 'bg-slate-100'}`}>
                            <Bot size={22} className={activeChat?.type === 'ai' ? 'text-white' : 'text-slate-600'} />
                        </div>
                        <div className="min-w-0">
                            <div className={`truncate text-lg font-semibold ${activeChat?.type === 'ai' ? 'text-white' : 'text-slate-950'}`}>Gemini</div>
                            <div className={`truncate text-sm ${activeChat?.type === 'ai' ? 'text-slate-200' : 'text-slate-500'}`}>AI assistant</div>
                        </div>
                    </button>
                </div>

                {groups.length > 0 && (
                    <div className="px-3 pb-2">
                        <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Groups</div>
                        <div className="space-y-1">
                            {groups.map((group) => {
                                const active = activeChat?.type === 'group' && activeChat.id === group.id;
                                return (
                                    <button
                                        type="button"
                                        key={`group_${group.id}`}
                                        onClick={() => handleSelect(group)}
                                        className={`flex w-full items-center gap-4 rounded-[26px] px-4 py-4 text-left transition ${active ? 'bg-slate-950 text-white' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className={`grid h-14 w-14 place-items-center rounded-full ${active ? 'bg-white/15' : 'bg-slate-100'}`}>
                                            <Users size={22} className={active ? 'text-white' : 'text-slate-600'} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`truncate text-lg font-semibold ${active ? 'text-white' : 'text-slate-950'}`}>{group.name}</div>
                                            <div className={`truncate text-sm ${active ? 'text-slate-200' : 'text-slate-500'}`}>Group conversation</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="px-3 pb-6">
                    <div className="px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Direct messages</div>
                    {directChats.length > 0 ? (
                        <div className="space-y-1">
                            {directChats.map((dm) => {
                                const active = activeChat?.type === 'direct' && activeChat.id === dm.id;
                                return (
                                    <button
                                        type="button"
                                        key={`dm_${dm.id}`}
                                        onClick={() => handleSelect(dm)}
                                        className={`flex w-full items-center gap-4 rounded-[26px] px-4 py-4 text-left transition ${active ? 'bg-slate-950 text-white' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className={`grid h-14 w-14 place-items-center overflow-hidden rounded-full ${active ? 'bg-white/15' : 'bg-slate-100 text-slate-600'}`}>
                                            {dm.profile_pic ? (
                                                <img src={`${API_ORIGIN}${dm.profile_pic}`} alt={dm.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <UserIcon size={22} className={active ? 'text-white' : 'text-slate-600'} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`truncate text-lg font-semibold ${active ? 'text-white' : 'text-slate-950'}`}>{dm.name}</div>
                                            <div className={`truncate text-sm ${active ? 'text-slate-200' : 'text-slate-500'}`}>
                                                {dm.department || 'Direct chat'}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-[24px] bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            No conversations yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
