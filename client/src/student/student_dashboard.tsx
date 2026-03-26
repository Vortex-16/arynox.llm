import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, CheckSquare, Square, FileText, Plus, ArrowLeft, PlayCircle, Loader2, Sparkles, User, Settings2, Share2, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface SourceDocument {
    id: string;
    name: string;
    wordCount: string;
    selected: boolean;
}

export default function StudentDashboard() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I am your AI Socratic Tutor. You currently have 3 sources selected. Try asking: \"What are the key themes across these documents?\" or request a quiz."
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [sources, setSources] = useState<SourceDocument[]>([
        { id: 'src-1', name: 'Advanced Physics Syllabus 2024.pdf', wordCount: '4,203 words', selected: true },
        { id: 'src-2', name: 'Lecture 3: Thermodynamics Notes.docx', wordCount: '15,820 words', selected: true },
        { id: 'src-3', name: 'Study Guide - Midterm.txt', wordCount: '2,150 words', selected: true },
        { id: 'src-4', name: 'Newtonian Mechanics Summary.pdf', wordCount: '8,400 words', selected: false },
    ]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleSource = (id: string) => {
        setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
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

        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');
        setIsTyping(true);

        try {
            const apiKey = import.meta.env.VITE_GROQ_API_KEY;

            if (!apiKey) {
                setTimeout(() => {
                    const socraticResponses = [
                        "That's an interesting perspective. Considering the sources you've selected, how does that relate to the Second Law of Thermodynamics?",
                        "If we assume that's true, what is the logical consequence for open systems?",
                        "Why do you think the system behaves that way under stress? Look at page 4 of your syllabus for a hint.",
                        "You are on the right track! Can you elaborate on the second part of your thought?"
                    ];
                    const mockResponse: ChatMessage = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: socraticResponses[Math.floor(Math.random() * socraticResponses.length)]
                    };
                    setMessages(prev => [...prev, mockResponse]);
                    setIsTyping(false);
                }, 1500);
                return;
            }

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama3-8b-8192',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a Socratic tutor acting exclusively across selected source materials. You must ask guiding questions. Never give a direct answer if the student can discover it.'
                        },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMsg.content }
                    ]
                })
            });

            const data = await response.json();
            if (response.ok && data.choices?.[0]?.message) {
                setMessages(prev => [...prev, {
                    id: data.id || (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.choices[0].message.content
                }]);
            } else {
                throw new Error(data.error?.message || 'Failed to fetch from Groq');
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting to my neural core right now. Please try again in a moment."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const selectedCount = sources.filter(s => s.selected).length;

    return (
        <div className="flex h-screen w-full bg-[#111] text-white overflow-hidden font-['Outfit']">

            {/* 1. Left Sidebar (Sources Panel) */}
            <aside className="w-[380px] flex flex-col border-r border-white/10 bg-[#0a0a0a] z-20 shrink-0">

                {/* Sidebar Header */}
                <div className="p-6 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-6 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-xl font-bold tracking-tight">Advanced Physics 101</h1>
                        <button className="text-white/40 hover:text-white transition-colors">
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-white/40 mb-6">Notebook • {sources.length} sources</p>

                    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all group">
                        <Plus className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                        Add Source
                    </button>
                </div>

                {/* Sources List */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scrollbar-hide">
                    <div className="px-2 py-1 flex items-center justify-between text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">
                        <span>Sources</span>
                        <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">{selectedCount} Selected</span>
                    </div>

                    {sources.map(src => (
                        <div
                            key={src.id}
                            onClick={() => toggleSource(src.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 group ${src.selected
                                ? 'border-amber-500/30 bg-amber-500/5 shadow-[0_4px_20px_rgba(245,158,11,0.05)]'
                                : 'border-white/5 bg-transparent hover:border-white/10 hover:bg-white/[0.02]'
                                }`}
                        >
                            <div className="mt-0.5 shrink-0">
                                {src.selected ? (
                                    <CheckSquare className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                                ) : (
                                    <Square className="w-5 h-5 text-white/20 group-hover:text-white/40" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-medium truncate mb-1 ${src.selected ? 'text-white' : 'text-white/70'}`}>
                                    {src.name}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-white/40">
                                    <FileText className="w-3 h-3" />
                                    {src.wordCount}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* 2. Main Studio Area */}
            <main className="flex-1 flex flex-col relative bg-[#111] p-4 lg:p-6 overflow-hidden">

                {/* Aesthetic Background Elements inside the Studio */}
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-amber-600/5 blur-[150px] rounded-full pointer-events-none z-0" />
                <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none z-0" />

                {/* The Studio Canvas (matches NotebookLM's rounded floating main area) */}
                <div className="flex-1 bg-[#161616] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col z-10">

                    {/* Top Navbar inside Canvas */}
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#161616]/80 backdrop-blur-md sticky top-0 z-20">
                        <h2 className="text-lg font-medium flex items-center gap-2">
                            Studio Chat <Sparkles className="w-4 h-4 text-amber-500" />
                        </h2>
                        <div className="flex items-center gap-3">
                            <button className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-full"><Share2 className="w-4 h-4" /></button>
                            <button className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-full"><MoreVertical className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 lg:px-24 py-8 scrollbar-hide flex flex-col">

                        {/* Audio Overview Banner (NotebookLM Signature Feature) */}
                        <div className="max-w-3xl w-full mx-auto mb-12">
                            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.01] p-6 group">
                                {/* Banner Glow */}
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none transform -rotate-45" />
                                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-500/10 blur-[50px] rounded-full pointer-events-none transform -rotate-45" />

                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                            <PlayCircle className="w-5 h-5 text-amber-400" /> Audio Overview
                                        </h3>
                                        <p className="text-sm text-white/50 max-w-md">
                                            Generate a dynamic, two-speaker podcast summarizing the core concepts from your {selectedCount} selected sources.
                                        </p>
                                    </div>

                                    <button
                                        onClick={simulateAudioGeneration}
                                        disabled={isGeneratingAudio || selectedCount === 0}
                                        className="shrink-0 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isGeneratingAudio ? (
                                            <><Loader2 className="w-4 h-4 animate-spin text-black" /> Generating...</>
                                        ) : (
                                            'Generate Audio'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="max-w-3xl w-full mx-auto flex flex-col gap-8 pb-10">
                            {messages.map((msg) => {
                                const isAI = msg.role === 'assistant';
                                return (
                                    <div key={msg.id} className="flex gap-4">
                                        {/* Avatar */}
                                        <div className="shrink-0 mt-1">
                                            {isAI ? (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-vermilion-500 flex items-center justify-center shadow-lg">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-white/60" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 mt-1.5">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                                                {isAI ? 'Socratic Tutor' : 'You'}
                                            </h4>
                                            <div className={`text-[15px] leading-relaxed ${isAI ? 'text-white/90' : 'text-white'}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {isTyping && (
                                <div className="flex gap-4">
                                    <div className="shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-vermilion-500 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 mt-1.5 flex items-center gap-2 h-6">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Bottom Chat Input Section */}
                    <div className="px-6 lg:px-24 py-6 bg-gradient-to-t from-[#161616] via-[#161616] to-transparent sticky bottom-0">
                        <div className="max-w-3xl mx-auto flex flex-col gap-3">

                            {/* Suggested Pills (NotebookLM style) */}
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                                {[
                                    "Explain the second law in simple terms",
                                    "Compare my notes to the syllabus",
                                    "Generate a quick quiz",
                                    "Create a study timeline"
                                ].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInputMessage(suggestion)}
                                        className="whitespace-nowrap px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>

                            {/* Chat Input Pill */}
                            <form onSubmit={handleSendMessage} className="relative group">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Ask a question or request a summary..."
                                    className="w-full bg-[#202020] border border-white/10 rounded-[32px] pl-6 pr-16 py-[18px] text-[15px] outline-none focus:border-amber-500/50 focus:bg-[#252525] transition-all text-white placeholder:text-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                                    disabled={isTyping}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim() || isTyping}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-black disabled:opacity-50 disabled:bg-white/10 disabled:text-white/40 transition-all"
                                >
                                    {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
