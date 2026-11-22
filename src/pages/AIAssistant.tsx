import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Trash2,
  Bot,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AIMessage } from '../types';
import { aiService } from '../services/aiService';
import { TypewriterMessage } from '../components/ai/TypewriterMessage';

export const AIAssistant: React.FC = () => {
  const {
    events,
    announcements,
    student,
    registrations,
    activeRole,
    currentAdminUser,
    demoAuthUser,
    firebaseUser,
  } = useApp();

  const currentUserName =
    activeRole !== 'student'
      ? currentAdminUser?.name || demoAuthUser?.name || 'Administrator'
      : firebaseUser?.displayName || demoAuthUser?.name || student?.fullName || 'Mahasiswa';

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);

  // Dynamically generate AI greeting from Gemini on mount or user change
  useEffect(() => {
    let isCancelled = false;
    const fetchGreeting = async () => {
      setLoading(true);
      try {
        const greeting = await aiService.generateGreeting({
          page: '/ai-assistant',
          events,
          announcements,
          student: activeRole === 'student' ? student : null,
          user: {
            name: currentUserName,
            role: activeRole,
            email: firebaseUser?.email || demoAuthUser?.email || student?.email,
            faculty: activeRole === 'student' ? student?.faculty : undefined,
            major: activeRole === 'student' ? student?.studyProgram : undefined,
          },
          registrations,
        });

        if (!isCancelled) {
          setMessages([
            {
              id: `welcome-${Date.now()}`,
              sender: 'ai',
              content: greeting,
              timestamp: 'Now',
            },
          ]);
        }
      } catch {
        if (!isCancelled) {
          setMessages([
            {
              id: `welcome-${Date.now()}`,
              sender: 'ai',
              content: `Halo ${currentUserName.split(' ')[0]}! Saya Asisten AI KlabatSync. Ada agenda kampus, poin chapel, atau kegiatan yang ingin dicek hari ini?`,
              timestamp: 'Now',
            },
          ]);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchGreeting();
    return () => {
      isCancelled = true;
    };
  }, [currentUserName]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleScrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    handleScrollToBottom();
  }, [messages, loading, handleScrollToBottom]);

  const quickPrompts = [
    "What's my schedule tomorrow?",
    'Which events offer chapel points?',
    'Recommend activities for FIK students',
    'Do I have any schedule conflicts?',
    'What are the latest announcements?',
  ];

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat(
        text,
        {
          page: '/ai-assistant',
          events,
          announcements,
          student: activeRole === 'student' ? student : null,
          user: {
            name: currentUserName,
            role: activeRole,
            email: firebaseUser?.email || demoAuthUser?.email || student?.email,
            faculty: activeRole === 'student' ? student?.faculty : undefined,
            major: activeRole === 'student' ? student?.studyProgram : undefined,
          },
          registrations,
        },
        messages
      );
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          content: 'Gagal menghubungi layanan kecerdasan kampus KlabatSync. Silakan coba kembali sesaat lagi.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSimulated: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `clear-${Date.now()}`,
        sender: 'ai',
        content: `Riwayat percakapan telah dibersihkan. Ada yang ingin ${currentUserName.split(' ')[0]} tanyakan lagi seputar kampus UNKLAB?`,
        timestamp: 'Now',
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple" className="text-[10px] font-bold">
              CAMPUS INTELLIGENCE
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Google Gemini 3.5 AI Terhubung
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 flex items-center gap-2">
            KlabatSync AI Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Grounded answers from live events, student agenda, and official campus circulars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="text-xs">
            <Trash2 className="h-3.5 w-3.5 mr-1 text-slate-400" /> Clear Chat
          </Button>
        </div>
      </div>


      {/* Chat Window Container */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col h-[560px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            const isLatest = !isUser && index === messages.length - 1;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-3xl p-4 leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-sm'
                      : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-line text-xs font-normal leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <TypewriterMessage
                      content={msg.content}
                      isLatest={isLatest}
                      onScrollRequested={handleScrollToBottom}
                    />
                  )}

                  {/* Grounded Source Attributions */}
                  {msg.sourceAttributions && msg.sourceAttributions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 text-[10px] space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">
                        Grounded Sources:
                      </span>
                      {msg.sourceAttributions.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                          <span>• {s.title}</span>
                          <span className="text-slate-400 font-normal">({s.module})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`text-[9px] mt-1.5 text-right ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-400">
              <div className="h-8 w-8 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce delay-100" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce delay-200" />
                <span className="ml-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                  Checking campus schedules &amp; rules...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(p)}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors shadow-2xs shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tomorrow's schedule, Pioneer Chapel, hackathons, or curfew..."
              className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <Button
              type="submit"
              variant="purple"
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-2xl font-bold text-xs shrink-0 shadow-md shadow-purple-600/20"
            >
              <Send className="h-4 w-4 mr-1.5" /> Send
            </Button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Synchronized with Universitas Klabat single source of truth</span>
          </div>
        </div>
      </div>
    </div>
  );
};
