import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Calendar, Info, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Imveis } from '@/entities';
import { Link } from 'react-router-dom';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface PropertyAIChatProps {
    property: Imveis;
}

export function PropertyAIChat({ property }: PropertyAIChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            content: `Olá! Sou o assistente virtual da R.Sales. Como posso te ajudar com as dúvidas sobre este imóvel?`,
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        // Simulate AI response delay
        setTimeout(() => {
            const response = generateAIResponse(userMessage, property);
            setMessages((prev) => [...prev, { role: 'ai', content: response }]);
            setIsTyping(false);
        }, 1000);
    };

    const generateAIResponse = (query: string, prop: Imveis): string => {
        const q = query.toLowerCase();

        // Restricted information keywords
        const restrictedKeywords = [
            'endereço', 'rua', 'numero', 'número', 'localização', 'localizacao', 'onde fica',
            'proprietário', 'proprietario', 'dono', 'nome do dono', 'contato do dono', 'telefone do dono',
            'telefone proprietário', 'email proprietário'
        ];

        if (restrictedKeywords.some(key => q.includes(key))) {
            return 'Para informações de endereço exato ou contato direto com o proprietário, por favor agende uma visita com um de nossos corretores clicando no botão abaixo.';
        }

        // Context-based answers
        if (q.includes('preço') || q.includes('valor') || q.includes('quanto custa') || q.includes('aluguel') || q.includes('venda')) {
            const price = prop.price || prop.precoVenda || prop.precoLocacao;
            return price
                ? `O valor deste imóvel é R$ ${price.toLocaleString('pt-BR')}.`
                : 'Para informações sobre o valor, por favor entre em contato conosco.';
        }

        if (q.includes('quarto') || q.includes('dormitório') || q.includes('dormitorio')) {
            const rooms = prop.bedrooms || prop.dormitorios || prop.quartos || 0;
            return `Este imóvel possui ${rooms} ${rooms === 1 ? 'quarto' : 'quartos'}.`;
        }

        if (q.includes('banheiro')) {
            const baths = prop.bathrooms || prop.banheiros || 0;
            return `Este imóvel conta com ${baths} ${baths === 1 ? 'banheiro' : 'banheiros'}.`;
        }

        if (q.includes('área') || q.includes('tamanho') || q.includes('m2') || q.includes('metros')) {
            const area = prop.area || prop.areaUtil || prop.areaTotal || prop.areaConstruida || 0;
            return `A área total deste imóvel é de aproximadamente ${area}m².`;
        }

        if (q.includes('vaga') || q.includes('garagem') || q.includes('estacionamento')) {
            const vagas = prop.vagas || prop.vagasCobertas || 0;
            return vagas > 0
                ? `O imóvel dispõe de ${vagas} ${vagas === 1 ? 'vaga' : 'vagas'} de garagem.`
                : 'Este imóvel não possui vagas de garagem informadas.';
        }

        if (q.includes('piscina')) {
            return prop.piscina || prop.piscinaCondominio
                ? 'Sim, este imóvel/condomínio possui piscina!'
                : 'Não consta informação de piscina para este imóvel.';
        }

        if (q.includes('academia')) {
            return prop.academia
                ? 'Sim, o imóvel/condomínio oferece academia.'
                : 'Este imóvel não possui academia informada.';
        }

        // Default response using description
        if (prop.descricaoAnuncio || prop.description) {
            return `Baseado na descrição do imóvel: ${prop.descricaoAnuncio || prop.description}`;
        }

        return "Desculpe, não tenho informações específicas sobre isso. Posso te ajudar com detalhes sobre quartos, banheiros, área ou valor? Para outras informações, recomendo agendar uma visita.";
    };

    return (
        <Card className="bg-primary-foreground/5 border-primary-foreground/10 flex flex-col h-[400px] overflow-hidden">
            <CardHeader className="bg-secondary/10 py-3 px-4 border-b border-primary-foreground/5">
                <CardTitle className="text-secondary flex items-center gap-2 text-base">
                    <Bot className="w-5 h-5" />
                    Dúvidas sobre o Imóvel?
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                            ? 'bg-secondary text-secondary-foreground rounded-tr-none'
                                            : 'bg-primary-foreground/10 text-primary-foreground rounded-tl-none border border-primary-foreground/5'
                                        }`}
                                >
                                    <p className="leading-relaxed">{msg.content}</p>
                                    {msg.content.includes('agende uma visita') && (
                                        <div className="mt-3">
                                            <Link to="/contato">
                                                <Button size="sm" variant="outline" className="text-xs h-7 border-secondary/50 hover:bg-secondary hover:text-white">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Agendar Visita
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-primary-foreground/10 text-primary-foreground rounded-2xl rounded-tl-none p-3 border border-primary-foreground/5">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-3 bg-secondary/5 border-t border-primary-foreground/5">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pergunte sobre quartos, lazer, valor..."
                            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-sm focus-visible:ring-secondary/50 placeholder:text-primary-foreground/30"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="bg-secondary hover:bg-secondary/90 shrink-0"
                            disabled={!input.trim() || isTyping}
                        >
                            <Send className="w-4 h-4 text-secondary-foreground" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
