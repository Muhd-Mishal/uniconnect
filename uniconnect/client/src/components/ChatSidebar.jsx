import { User as UserIcon, Users, Bot } from 'lucide-react';

const ChatSidebar = ({ connections, activeChat, setActiveChat, setShowGroupModal }) => {
    const itemClass = (active) =>
        `flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

    return (
        <div className="flex w-full flex-col border-b border-slate-200 bg-white lg:h-full lg:w-[320px] lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-950">Messages</h2>
                    <p className="text-xs text-slate-400">Groups and direct chats</p>
                </div>
                <button
                    onClick={() => setShowGroupModal(true)}
                    className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                >
                    New group
                </button>
            </div>

            <div className="max-h-[260px] overflow-y-auto p-3 lg:max-h-none lg:flex-1">
                <div className="mb-4">
                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Assistant</h3>
                    <button
                        type="button"
                        onClick={() => setActiveChat({ id: 'gemini', name: 'Gemini', type: 'ai' })}
                        className={itemClass(activeChat?.type === 'ai')}
                    >
                        <div className={`grid h-10 w-10 place-items-center rounded-2xl ${activeChat?.type === 'ai' ? 'bg-white/15' : 'bg-slate-100'}`}>
                            <Bot size={18} className={activeChat?.type === 'ai' ? 'text-white' : 'text-slate-600'} />
                        </div>
                        <div className="truncate text-sm font-medium">Gemini</div>
                    </button>
                </div>

                {connections.groups?.length > 0 && (
                    <div className="mb-4">
                        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Groups</h3>
                        <div className="space-y-1.5">
                            {connections.groups.map((group) => (
                                <button
                                    type="button"
                                    key={`group_${group.id}`}
                                    onClick={() => setActiveChat(group)}
                                    className={itemClass(activeChat?.type === 'group' && activeChat.id === group.id)}
                                >
                                    <div className={`grid h-10 w-10 place-items-center rounded-2xl ${activeChat?.type === 'group' && activeChat.id === group.id ? 'bg-white/15' : 'bg-slate-100'}`}>
                                        <Users size={18} className={activeChat?.type === 'group' && activeChat.id === group.id ? 'text-white' : 'text-slate-600'} />
                                    </div>
                                    <div className="truncate text-sm font-medium">{group.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {connections.directChats?.length > 0 && (
                    <div>
                        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Direct messages</h3>
                        <div className="space-y-1.5">
                            {connections.directChats.map((dm) => (
                                <button
                                    type="button"
                                    key={`dm_${dm.id}`}
                                    onClick={() => setActiveChat(dm)}
                                    className={itemClass(activeChat?.type === 'direct' && activeChat.id === dm.id)}
                                >
                                    <div className={`grid h-10 w-10 place-items-center rounded-2xl ${activeChat?.type === 'direct' && activeChat.id === dm.id ? 'bg-white/15' : 'bg-slate-100'}`}>
                                        <UserIcon size={18} className={activeChat?.type === 'direct' && activeChat.id === dm.id ? 'text-white' : 'text-slate-600'} />
                                    </div>
                                    <div className="truncate text-sm font-medium">{dm.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {(!connections.groups?.length && !connections.directChats?.length) && (
                    <div className="rounded-[24px] bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        No conversations yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
