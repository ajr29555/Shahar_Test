import React, { useState, useRef, useEffect } from 'react';
import { generateExcuseStream } from './services/geminiService';
import { ChatMessage, ExcuseTone } from './types';
import { Send, Bot, User, Copy, Check, Sparkles, AlertCircle, Settings2 } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your professional Excuse Generator. Tell me what you need an excuse for, and I'll handle the rest.",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ExcuseTone>(ExcuseTone.Professional);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Placeholder ID for the streaming response
    const responseId = (Date.now() + 1).toString();
    
    // Initial empty assistant message
    setMessages(prev => [...prev, {
      id: responseId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1
    }]);

    try {
      // Connects to Make.com webhook via the service
      const stream = await generateExcuseStream(userMessage.content, selectedTone);
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        if (chunk.text) {
          fullContent += chunk.text;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === responseId 
                ? { ...msg, content: fullContent } 
                : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("I couldn't generate an excuse at the moment. Please try again.");
      setMessages(prev => prev.filter(msg => msg.id !== responseId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-2xl overflow-hidden md:rounded-xl md:my-4 md:h-[95vh] border border-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ExcuseGen AI</h1>
            <p className="text-xs text-indigo-100 opacity-90">Powered by Make.com</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="hidden md:flex items-center bg-white/10 rounded-full p-1 px-3 text-sm font-medium border border-white/20">
             <Settings2 className="w-4 h-4 mr-2" />
             <select 
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value as ExcuseTone)}
                className="bg-transparent border-none outline-none text-white cursor-pointer [&>option]:text-gray-900"
             >
                <option value={ExcuseTone.Professional}>Professional</option>
                <option value={ExcuseTone.Casual}>Casual</option>
                <option value={ExcuseTone.Funny}>Funny</option>
                <option value={ExcuseTone.Unbelievable}>Absurd</option>
             </select>
           </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 relative scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-purple-600 border border-purple-100'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`
                  p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'}
                `}>
                  {msg.content}
                </div>
                
                {/* Actions for Assistant Messages */}
                {msg.role === 'assistant' && msg.content && (
                  <div className="mt-1 ml-1">
                    <CopyButton text={msg.content} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start w-full">
             <div className="flex gap-3 max-w-[75%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-purple-600 border border-purple-100 flex items-center justify-center shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
             </div>
          </div>
        )}
        
        {error && (
            <div className="flex justify-center my-4">
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center shadow-sm border border-red-100">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                </div>
            </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-4 pb-6 md:pb-4">
        {/* Mobile Tone Selector (Visible only on small screens) */}
        <div className="md:hidden mb-3 flex justify-center">
             <div className="inline-flex items-center bg-gray-100 rounded-full p-1 px-3 text-xs font-medium text-gray-600">
             <Settings2 className="w-3 h-3 mr-2" />
             <select 
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value as ExcuseTone)}
                className="bg-transparent border-none outline-none cursor-pointer"
             >
                <option value={ExcuseTone.Professional}>Professional</option>
                <option value={ExcuseTone.Casual}>Casual</option>
                <option value={ExcuseTone.Funny}>Funny</option>
                <option value={ExcuseTone.Unbelievable}>Absurd</option>
             </select>
           </div>
        </div>

        <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-inner">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g., I'm late for the meeting because..."
            className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-3 px-2 text-gray-800 placeholder-gray-400 text-sm"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-2">
            AI generated content may be inaccurate. Use excuses responsibly.
        </p>
      </div>
    </div>
  );
};

// Helper component for copying text
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors py-1 px-2 rounded-md hover:bg-gray-50"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

export default App;