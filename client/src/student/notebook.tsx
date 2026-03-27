import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckSquare, Plus, ArrowLeft, PlayCircle, Loader2, Sparkles, User, Settings2, Share2, MessageSquare, PlusCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface YouTubeVideo {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    url: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    youtubeVideo?: YouTubeVideo;
}

interface SourceDocument {
    id: string;
    name: string;
    wordCount: string;
    selected: boolean;
}

/** Formats large numbers to readable shorthand: 1200000 → 1.2M */
function formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
}

function YouTubeVideoCard({ video }: { video: YouTubeVideo }) {
    return (
        <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block mt-4 rounded-2xl overflow-hidden border border-[#444746]/50 bg-[#1a1b1c] hover:border-red-500/50 transition-all duration-300 hover:shadow-[0_0_24px_rgba(239,68,68,0.15)] no-underline"
            style={{ textDecoration: 'none' }}
        >
            {/* Thumbnail */}
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                    <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
                {/* YouTube badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span className="text-[11px] font-semibold text-white">YouTube</span>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h4 className="text-[14px] font-semibold text-[#e3e3e3] line-clamp-2 leading-snug mb-1.5 group-hover:text-white transition-colors" style={{ textDecoration: 'none' }}>
                    {video.title}
                </h4>
                <p className="text-[12px] text-[#8e918f] mb-3" style={{ textDecoration: 'none' }}>
                    {video.channelTitle}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[12px] text-[#c4c7c5]">
                        <svg className="w-3.5 h-3.5 text-[#8e918f]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        <span className="font-medium">{formatCount(video.viewCount)}</span>
                        <span className="text-[#8e918f]">views</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#c4c7c5]">
                        <svg className="w-3.5 h-3.5 text-[#8e918f]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        <span className="font-medium">{formatCount(video.likeCount)}</span>
                        <span className="text-[#8e918f]">likes</span>
                    </div>
                    <div className="ml-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-[12px] font-medium group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all duration-300">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Watch Now
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
}

export default function Notebook() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const targetDocId = queryParams.get('docId');
    const targetDocName = queryParams.get('name');

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [sources, setSources] = useState<SourceDocument[]>([]);
    const [isLoadingSources, setIsLoadingSources] = useState(true);

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [chatSessions, setChatSessions] = useState<any[]>([]);

    // Mock Student Profile
    const studentProfile = {
        id: 'student_123',
        className: '2nd Year',
        department: 'Computer Science'
    };

    const fetchSessions = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/chat/session/list/${studentProfile.id}`);
            if (res.ok) {
                const data = await res.json();
                setChatSessions(data);
            }
        } catch (err) {}
    };

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/documents?className=${encodeURIComponent(studentProfile.className)}&department=${encodeURIComponent(studentProfile.department)}`);
                if (res.ok) {
                    const data = await res.json();
                    const mappedSources = data.map((doc: any, index: number) => ({
                        id: doc._id,
                        name: doc.title,
                        wordCount: 'Processed File',
                        // Strictly select ONLY the clicked doc if provided, otherwise select first 3
                        selected: targetDocId ? (doc._id.toString() === targetDocId.toString()) : index < 3
                    }));
                    setSources(mappedSources);
                    
                    // Set initial welcome message after sources are loaded
                    const selectedCount = mappedSources.filter((s: any) => s.selected).length;
                    setMessages([{
                        id: '1',
                        role: 'assistant',
                        content: `Hello! I am your AI Socratic Tutor. You currently have ${selectedCount} source${selectedCount !== 1 ? 's' : ''} selected. ${targetDocName ? `I've pre-loaded **${targetDocName}** for you.` : ''} Try asking me anything about these materials!`
                    }]);
                }
            } catch (err) {
                console.error("Failed to load documents:", err);
            } finally {
                setIsLoadingSources(false);
            }
        };
        fetchDocuments();
        fetchSessions();
    }, [targetDocId, targetDocName]);

    const loadSession = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/chat/session/load/${id}`);
            const data = await res.json();
            setSessionId(data.sessionId);
            setMessages(data.messages.map((m: any) => ({
                id: m._id || Math.random().toString(),
                role: m.role,
                content: m.content
            })));
        } catch (err) {
            console.error(err);
        }
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([{
            id: '1',
            role: 'assistant',
            content: "Hello! I am your AI Socratic Tutor. You currently have " + sources.filter((s: SourceDocument) => s.selected).length + " sources selected. How can I help?"
        }]);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleSource = (id: string) => {
        setSources((prev: SourceDocument[]) => prev.map((s: SourceDocument) => s.id === id ? { ...s, selected: !s.selected } : s));
    };

    const simulateAudioGeneration = () => {
        if (isGeneratingAudio) return;
        setIsGeneratingAudio(true);
        setTimeout(() => {
            setIsGeneratingAudio(false);
            // Mock completion
        }, 4000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage.trim()
        };

        setMessages((prev: ChatMessage[]) => [...prev, userMsg]);
        setInputMessage('');
        setIsTyping(true);

        try {
            const response = await fetch('http://localhost:5000/api/chat/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: userMsg.content,
                    department: studentProfile.department,
                    className: studentProfile.className,
                    studentId: studentProfile.id,
                    sessionId: sessionId,
                    sourceIds: sources.filter(s => s.selected).map(s => s.id)
                })
            });

            const data = await response.json();
            if (response.ok && data.answer) {
                if (!sessionId && data.sessionId) {
                    setSessionId(data.sessionId);
                    fetchSessions(); 
                }
                setMessages((prev: ChatMessage[]) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.answer,
                    ...(data.youtubeVideo && { youtubeVideo: data.youtubeVideo })
                }]);
            } else {
                throw new Error(data.error || 'Failed to fetch from backend router');
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev: ChatMessage[]) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting to my neural core right now. Please try again in a moment."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const selectedCount = sources.filter((s: SourceDocument) => s.selected).length;

    return (
        <div className="flex h-screen w-full bg-[#131314] text-[#e3e3e3] overflow-hidden font-sans">
            {/* 1. Left Sidebar (Sources Panel) */}
            <aside className="w-[280px] md:w-[320px] flex flex-col bg-[#1e1f20] shrink-0 border-r border-[#444746]/50 shadow-xl z-20 transition-all duration-300">
                <div className="p-5 flex flex-col gap-4 sticky top-0 bg-[#1e1f20]/95 backdrop-blur-md z-30 border-b border-white/5">
                    <Link to="/student" className="flex items-center gap-2 text-[#c4c7c5] hover:text-[#a8c7fa] transition-all text-sm w-fit font-medium hover:translate-x-[-4px]">
                        <ArrowLeft className="w-4 h-4" /> Back to Student Dashboard
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                        <h1 className="text-[20px] font-semibold text-[#e3e3e3] tracking-tight truncate">{studentProfile.department} Portal</h1>
                    </div>
                </div>

                {/* Sources Header */}
                <div className="px-5 py-2 flex items-center justify-between group">
                    <span className="text-sm font-medium text-[#c4c7c5]">Sources</span>
                    <button className="w-8 h-8 rounded-full hover:bg-[#333537] flex items-center justify-center transition-colors">
                        <Plus className="w-5 h-5 text-[#c4c7c5]" />
                    </button>
                </div>

                {/* Sources List */}
                <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1 scrollbar-hide">
                    {isLoadingSources ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-[#c4c7c5]" />
                        </div>
                    ) : sources.length === 0 ? (
                        <div className="px-3 py-4 text-[13px] text-[#8e918f] text-center">
                            No sources uploaded yet.
                        </div>
                    ) : sources.map(src => (
                        <div
                            key={src.id}
                            onClick={() => toggleSource(src.id)}
                            className={`px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${src.selected
                                ? 'bg-[#282a2c] hover:bg-[#333537]'
                                : 'bg-transparent hover:bg-[#333537]'
                                }`}
                        >
                            <div className="shrink-0 mt-0.5">
                                {src.selected ? (
                                    <div className="w-5 h-5 rounded-[4px] bg-[#a8c7fa] flex items-center justify-center">
                                        <CheckSquare className="w-[14px] h-[14px] text-[#041e49]" strokeWidth={3} fill="#a8c7fa" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-[4px] border-[2px] border-[#8e918f] flex items-center justify-center" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-[14px] font-medium truncate ${src.selected ? 'text-[#e3e3e3]' : 'text-[#c4c7c5]'}`}>
                                    {src.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                    
                    {/* Source Selection Status */}
                    <div className="px-3 pt-2 pb-4 text-xs font-medium text-[#8e918f] border-b border-[#444746]/50 mx-2">
                         {selectedCount} selected
                    </div>

                    {/* Chat History Section */}
                    <div className="px-5 py-2 mt-2 flex items-center justify-between group">
                        <span className="text-sm font-medium text-[#c4c7c5]">Chat History</span>
                        <button onClick={startNewChat} className="w-8 h-8 rounded-full hover:bg-[#333537] flex items-center justify-center transition-colors">
                            <PlusCircle className="w-5 h-5 text-amber-400" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1 px-3 mt-1 pb-4 flex-1 overflow-y-auto scrollbar-hide">
                        {chatSessions.map(sess => (
                            <div 
                                key={sess.sessionId}
                                onClick={() => loadSession(sess.sessionId)}
                                className={`px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                                    sessionId === sess.sessionId ? 'bg-[#282a2c]' : 'bg-transparent hover:bg-[#333537]'
                                }`}
                            >
                                <MessageSquare className="w-4 h-4 text-[#8e918f] shrink-0" />
                                <span className={`text-[13px] truncate ${sessionId === sess.sessionId ? 'text-[#e3e3e3] font-medium' : 'text-[#c4c7c5]'}`}>
                                    {sess.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* 2. Main Studio Area */}
            <main className="flex-1 flex flex-col relative bg-[#131314] overflow-hidden mesh-gradient">
                {/* Navbar */}
                <div className="px-6 py-4 flex items-center justify-between z-40 glass-header shrink-0">
                    <h2 className="text-[15px] font-medium text-[#e3e3e3] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        arynox.llm Guide
                    </h2>
                    <div className="flex items-center gap-2">
                        <button className="text-sm font-medium text-[#c4c7c5] hover:text-[#e3e3e3] px-4 py-2 rounded-full hover:bg-[#282a2c] transition-colors flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                        <button className="p-2 text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#282a2c] rounded-full transition-colors hidden md:block">
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-12 lg:px-24 py-4 flex flex-col pb-32 custom-scrollbar">
                    {/* Notebook Guide section */}
                    <div className="max-w-[800px] w-full mx-auto mb-10 border-b border-[#444746]/50 pb-12">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Audio Overview Card */}
                            <div className="col-span-1 md:col-span-2 bg-[#1e1f20] rounded-[24px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[#282a2c] transition-colors">
                                <div className="flex gap-4 items-center">
                                     <div className="w-12 h-12 rounded-full bg-[#333537] flex items-center justify-center shrink-0">
                                          <PlayCircle className="w-6 h-6 text-[#a8c7fa]" />
                                     </div>
                                     <div>
                                        <h3 className="text-[15px] font-medium text-[#e3e3e3] mb-0.5">Audio Overview</h3>
                                        <p className="text-[13px] text-[#c4c7c5]">Two-speaker podcast summarizing your {selectedCount} sources</p>
                                     </div>
                                </div>
                                <button
                                        onClick={simulateAudioGeneration}
                                        disabled={isGeneratingAudio || selectedCount === 0}
                                        className="shrink-0 px-6 py-2.5 rounded-full bg-[#a8c7fa] hover:bg-[#b9d5ff] text-[#041e49] text-[14px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isGeneratingAudio ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                                    ) : (
                                        'Generate'
                                    )}
                                </button>
                            </div>

                            {/* Utility Cards */}
                            {[
                                { title: 'FAQ', subtitle: 'Frequently asked questions' },
                                { title: 'Study Guide', subtitle: 'Comprehensive overview' },
                                { title: 'Timeline', subtitle: 'Chronological summary' },
                                { title: 'Briefing Doc', subtitle: 'Key points and takeaways' },
                            ].map((card) => (
                                <div 
                                    key={card.title}
                                    className="bg-[#1e1f20] rounded-[20px] p-4 hover:bg-[#282a2c] transition-colors cursor-pointer group" 
                                    onClick={() => setInputMessage(`Create a ${card.title}`)}
                                >
                                    <span className="text-[15px] text-[#e3e3e3] font-medium block mb-1">{card.title}</span>
                                    <span className="text-[13px] text-[#c4c7c5]">{card.subtitle}</span>
                                </div>
                            ))}
                         </div>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="max-w-[800px] w-full mx-auto flex flex-col gap-8 pb-32">
                        {messages.map((msg) => {
                            const isAI = msg.role === 'assistant';
                            return (
                                <div key={msg.id} className="flex gap-4 items-start">
                                    <div className="shrink-0 mt-0.5">
                                        {isAI ? (
                                            <div className="w-8 h-8 rounded-full bg-[#1e1f20] border border-[#444746]/50 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-[#a8c7fa]" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-[#e3e3e3] flex items-center justify-center">
                                                <User className="w-5 h-5 text-[#131314]" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className={`text-[15px] leading-relaxed break-words pt-1 ${isAI ? 'text-[#e3e3e3]' : 'text-[#e3e3e3]'}`}>
                                            {isAI ? (
                                                <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-[#e3e3e3]">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    {msg.youtubeVideo && (
                                                        <YouTubeVideoCard video={msg.youtubeVideo} />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="inline-block bg-[#1e1f20] px-4 py-2.5 rounded-[20px] rounded-tl-sm text-[#e3e3e3]">
                                                    {msg.content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {isTyping && (
                            <div className="flex gap-4 items-start">
                                <div className="shrink-0 mt-0.5">
                                    <div className="w-8 h-8 rounded-full bg-[#1e1f20] border border-[#444746]/50 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-[#a8c7fa]" />
                                    </div>
                                </div>
                                <div className="flex-1 mt-2 flex items-center gap-1.5 h-6">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#c4c7c5] animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#c4c7c5] animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#c4c7c5] animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Bottom Chat Input constraints */}
                <div className="absolute bottom-6 w-full px-4 lg:px-24 pointer-events-none z-30">
                    <div className="max-w-[800px] mx-auto pointer-events-auto flex flex-col gap-3">
                        

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="relative flex items-center bg-[#1e1f20] border border-[#444746]/80 rounded-[32px] shadow-lg p-2 focus-within:border-[#8e918f] transition-colors">
                            <button type="button" className="p-2.5 mx-1 text-[#c4c7c5] hover:text-[#e3e3e3] rounded-full hover:bg-[#333537] transition-colors shrink-0">
                                <Plus className="w-6 h-6" />
                            </button>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Type to chat with your sources"
                                className="flex-1 bg-transparent px-2 py-3 text-[15px] text-[#e3e3e3] outline-none placeholder:text-[#8e918f]"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isTyping}
                                className={`w-10 h-10 mr-1 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                    inputMessage.trim() && !isTyping 
                                        ? 'bg-[#a8c7fa] text-[#041e49] hover:bg-[#b9d5ff]' 
                                        : 'bg-[#333537] text-[#8e918f]'
                                }`}
                            >
                                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                            </button>
                        </form>
                        <div className="text-center text-[12px] text-[#8e918f] font-medium tracking-wide">
                            **arynox.llm** may display inaccurate info, so double-check its responses.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
