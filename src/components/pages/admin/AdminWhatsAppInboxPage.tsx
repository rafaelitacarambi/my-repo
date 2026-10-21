import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, Paperclip, MoreVertical, Smartphone, User, FileText, Check, CheckCheck, Archive, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

export default function AdminWhatsAppInboxPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const loadConversations = async () => {
        try {
            const res = await fetch('/api/whatsapp?type=conversations');
            const data = await res.json();
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const loadMessages = async (convId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/whatsapp?type=messages&conversationId=${convId}`);
            const data = await res.json();
            setMessages(data);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to load messages', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();
        // Poll for new conversations every 10s
        const interval = setInterval(loadConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation._id);
        }
    }, [selectedConversation]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const tempMsg = newMessage;


        try {
            const res = await fetch('/api/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: selectedConversation.whatsappNumber,
                    text: tempMsg,
                    conversationId: selectedConversation._id
                })
            });

            if (res.ok) {
                const sentMsg = await res.json();
                setNewMessage('');
                setMessages([...messages, sentMsg]);
                scrollToBottom();
                loadConversations(); // Update preview
            } else {
                const error = await res.json().catch(() => ({}));
                toast({ title: 'Mensagem não enviada', description: error.error || 'Tente novamente mais tarde.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao enviar mensagem', variant: 'destructive' });
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.whatsappNumber.includes(searchTerm) ||
        (c.clientRef && c.clientRef.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Column: Conversations List */}
                <div className="w-80 border-r border-border bg-card flex flex-col">
                    <div className="p-4 border-b border-border bg-muted/30">
                        <h2 className="font-heading text-lg font-semibold mb-3">Inbox WhatsApp</h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar conversa..."
                                className="pl-8 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        {filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                Nenhuma conversa encontrada
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {filteredConversations.map(conv => (
                                    <button
                                        key={conv._id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`flex items-start gap-3 p-4 text-left border-b border-border/50 transition-colors hover:bg-muted/50 ${selectedConversation?._id === conv._id ? 'bg-secondary/10 border-l-4 border-l-secondary' : ''
                                            }`}
                                    >
                                        <Avatar>
                                            <AvatarFallback>{conv.whatsappNumber.slice(-2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium truncate text-sm">
                                                    {conv.clientRef || conv.whatsappNumber}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                    {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {conv.lastMessagePreview}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Middle Column: Chat Area */}
                <div className="flex-1 flex flex-col bg-background relative">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm z-10">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{selectedConversation.whatsappNumber.slice(-2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">{selectedConversation.clientRef || selectedConversation.whatsappNumber}</h3>
                                        <p className="text-xs text-muted-foreground">Via WhatsApp Oficial</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon"><Search className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-black/30" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                <div className="flex flex-col gap-4 max-w-4xl mx-auto py-4">
                                    {messages.map((msg) => {
                                        const isMe = msg.origin === 'Atendente' || msg.origin === 'Sistema' || msg.isSent;
                                        return (
                                            <motion.div
                                                key={msg._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] p-3 rounded-lg shadow-sm text-sm relative group ${isMe
                                                        ? 'bg-secondary text-secondary-foreground rounded-tr-none'
                                                        : 'bg-white dark:bg-card text-card-foreground rounded-tl-none border'
                                                    }`}>
                                                    {!isMe && <p className="text-[10px] font-bold text-muted-foreground mb-1">Cliente</p>}

                                                    <p className="whitespace-pre-wrap leading-relaxed">
                                                        {typeof msg.text === 'string' ? msg.text : msg.text?.body}
                                                    </p>

                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && (
                                                            <span>
                                                                {msg.deliveryStatus === 'read' ? <CheckCheck className="w-3 h-3 text-blue-300" /> : <Check className="w-3 h-3" />}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-card border-t border-border">
                                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                                    <Button type="button" variant="ghost" size="icon" className="shrink-0">
                                        <Paperclip className="w-5 h-5" />
                                    </Button>
                                    <Input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem (Shift+Enter para quebrar linha)"
                                        className="flex-1"
                                    />
                                    <Button type="submit" className="bg-secondary hover:bg-secondary/90 shrink-0">
                                        <Send className="w-4 h-4 mr-2" />
                                        Enviar
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Smartphone className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">WhatsApp Inbox</h3>
                            <p>Selecione uma conversa para iniciar o atendimento</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Context */}
                {selectedConversation && (
                    <div className="w-80 border-l border-border bg-card p-4 hidden xl:block">
                        <div className="flex flex-col items-center mb-6">
                            <Avatar className="w-20 h-20 mb-3">
                                <AvatarFallback className="text-2xl">{selectedConversation.whatsappNumber.slice(-2)}</AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-lg">{selectedConversation.whatsappNumber}</h3>
                            <Badge variant="outline" className="mt-1">Não Vinculado</Badge>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Dados do Cliente
                                </h4>
                                <div className="p-4 border rounded-lg bg-muted/20 text-sm text-center">
                                    <p className="text-muted-foreground mb-2">Este número não está vinculado a um cliente cadastrado.</p>
                                    <Button variant="outline" size="sm" className="w-full">
                                        Vincular Cliente
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Atendimentos Ativos
                                </h4>
                                <div className="space-y-2">
                                    <div className="p-3 border rounded-lg bg-background shadow-sm">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-semibold text-xs text-secondary">Financiamento</span>
                                            <span className="text-[10px] text-muted-foreground">Há 2 dias</span>
                                        </div>
                                        <p className="text-sm font-medium">Processo #1234 - Aguardando Doc</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="w-full text-xs">
                                        Ver todos (3)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
