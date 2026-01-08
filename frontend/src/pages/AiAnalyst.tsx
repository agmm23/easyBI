import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Database, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export function AiAnalyst() {
    const [datasources, setDatasources] = useState<any[]>([]);
    const [selectedSource, setSelectedSource] = useState('');
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: t('ai.subtitle') }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Update initial message when language changes, but only if it's the only message (reset)
    // Or we could just leave the history as is. For simplicity, let's just update if it's the welcome message.
    useEffect(() => {
        setMessages(prev => {
            if (prev.length === 1 && prev[0].role === 'ai') {
                return [{ role: 'ai', content: t('ai.subtitle') }];
            }
            return prev;
        });
    }, [t]);

    useEffect(() => {
        fetch('http://localhost:8000/api/datasources/')
            .then(res => res.json())
            .then(data => {
                setDatasources(data);
                if (data.length > 0) setSelectedSource(data[0].id);
            });
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !selectedSource) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    datasource_id: selectedSource
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to fetch response');
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'ai', content: `${t('ai.error')}: ${error.message || 'Something went wrong.'}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Sparkles className="w-6 h-6 text-indigo-600 mr-2" />
                        {t('ai.title')}
                    </h2>
                    <p className="text-gray-500">Powered by Gemini</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-gray-400" />
                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border min-w-[200px]"
                    >
                        {datasources.map(ds => (
                            <option key={ds.id} value={ds.id}>{ds.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600 ml-2' : 'bg-green-600 mr-2'}`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                </div>
                                <div className={`p-4 rounded-lg shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg rounded-tl-none border border-gray-200 ml-10">
                                <div className="text-sm text-gray-500">{t('ai.analyzing')}</div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t('ai.inputPlaceholder')}
                            disabled={loading || !selectedSource}
                            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !selectedSource || !input.trim()}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
