import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEmailsPage() {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    // Simulação do fetch no load: num mundo real, viria do Prisma GET /api/v1/emails
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Endpoint que lista os disparos Prisma
                const res = await fetch('/api/v1/emails');
                const data = await res.json();
                if (data.items) setLogs(data.items);
            } catch (e) {
                console.error('Falha ao puxar logs de email');
            }
        };
        fetchLogs();
    }, []);

    const handleSendTest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/v1/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to,
                    subject,
                    html: `<div style="font-family: Arial; padding: 20px;">
                            <h2>Mensagem da R Sales</h2>
                            <p>${body.replace(/\n/g, '<br/>')}</p>
                           </div>`
                }) // Disparo cru
            });

            const data = await res.json();

            if (data.status === 'SENT') {
                toast.success('E-mail disparado via Resend com sucesso!');
                setTo(''); setSubject(''); setBody('');
                // Recarrega lista
                const newLogs = await (await fetch('/api/v1/emails')).json();
                setLogs(newLogs.items || []);
            } else {
                toast.error('Ocorreu um erro no disparo: ' + data.errorMsg);
            }

        } catch (error: any) {
            toast.error('Falha na comunicação com o servidor de E-mail.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 flex items-center">
                <Mail className="mr-3 w-8 h-8 text-blue-600" />
                Disparos & Logs de E-mail (Transacional)
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* DISPARADOR MANUAL */}
                <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50/50 pb-4">
                        <CardTitle className="text-blue-800 flex items-center">
                            <Send className="w-5 h-5 mr-2" /> Teste de Envio Direto
                        </CardTitle>
                        <CardDescription>Envie um e-mail transacional via Resend. Ele será logado no banco (Prisma).</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSendTest} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Destinatário (To)</Label>
                                <Input
                                    type="email"
                                    required
                                    placeholder="cliente@email.com"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Assunto (Subject)</Label>
                                <Input
                                    required
                                    placeholder="Seu contrato da R Sales"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Corpo do E-mail</Label>
                                <Textarea
                                    required
                                    rows={5}
                                    placeholder="Escreva a mensagem..."
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                                {isLoading ? 'Disparando Resend API...' : 'Disparar E-mail Agora'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* TABELA DE LOGS */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center text-slate-700">
                            <Activity className="w-5 h-5 mr-2" /> Auditoria de Disparos
                        </CardTitle>
                        <CardDescription>Histórico gravado no PostgreSQL (Tabela EmailLog).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {logs.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground border border-dashed rounded bg-slate-50">
                                Nenhum e-mail transacional disparado ainda.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {logs.map((log) => (
                                    <div key={log.id} className="p-3 border rounded text-sm flex items-start justify-between bg-white shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="flex-1">
                                            <p className="font-semibold">{log.subject}</p>
                                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                                Para: {log.to} • {new Date(log.createdAt).toLocaleString()}
                                            </p>
                                            {log.errorMsg && (
                                                <p className="text-xs text-red-500 mt-1 mt-2 p-1 bg-red-50 rounded">Erro: {log.errorMsg}</p>
                                            )}
                                        </div>
                                        <div>
                                            {log.status === 'SENT' ? (
                                                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> ENVIADO
                                                </span>
                                            ) : log.status === 'FAILED' ? (
                                                <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                                    <XCircle className="w-3 h-3 mr-1" /> FALHA
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                                    <Clock className="w-3 h-3 mr-1" /> PENDENTE
                                                </span>
                                            )}
                                            {log.resendId && <div className="text-[9px] text-gray-400 mt-1 text-right" title="Resend ID">ID:{log.resendId.substring(0, 6)}..</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
