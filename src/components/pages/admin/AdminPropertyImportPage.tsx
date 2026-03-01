
import React, { useState } from 'react';
import { BaseCrudService } from '@/integrations';
import { Imveis } from '@/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Upload, Database, CloudUpload } from 'lucide-react';
import Header from '@/components/Header';

// Import the Kenlo data for specialized sync
import kenloData from '../../../../kenlo_import.json';
import { items as mockDb } from '@/lib/wix-data-mock';

export default function AdminPropertyImportPage() {
    const [jsonInput, setJsonInput] = useState('');
    const [previewData, setPreviewData] = useState<Partial<Imveis>[]>([]);
    const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'importing' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);

    const handlePreview = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            if (Array.isArray(parsed)) {
                setPreviewData(parsed);
                setImportStatus('preview');
                setLogs(['JSON válido. ' + parsed.length + ' itens encontrados.']);
            } else {
                setImportStatus('error');
                setLogs(['O JSON deve ser uma lista (array) de imóveis.']);
            }
        } catch (e) {
            setImportStatus('error');
            setLogs(['Erro ao ler JSON. Verifique a formatação.']);
        }
    };

    const handleImport = async () => {
        setImportStatus('importing');
        const newLogs = [...logs];
        let successCount = 0;

        for (const item of previewData) {
            try {
                // Prepare data for insertion
                const newProperty: Partial<Imveis> = {
                    ...item,
                    _id: crypto.randomUUID(),
                    status: 'Disponível', // Default status
                    _createdDate: new Date(),
                    _updatedDate: new Date()
                };

                await BaseCrudService.create('imoveis', newProperty);
                successCount++;
                newLogs.push(`✅ Importado: ${item.resumoImovel || 'Imóvel sem nome'}`);
            } catch (error) {
                console.error(error);
                newLogs.push(`❌ Erro ao importar: ${item.resumoImovel}`);
            }
            setLogs([...newLogs]);
        }

        setLogs(prev => [...prev, `🏁 Importação concluída! ${successCount} de ${previewData.length} itens salvos.`]);
        setImportStatus('success');
    };

    const handleKenloSync = async () => {
        setImportStatus('importing');
        setLogs(['Iniciando sincronização especializada com base no arquivo Kenlo...']);

        try {
            const result = await BaseCrudService.getAll<Imveis>('imoveis', [], { limit: 2000 });
            const existingProperties = result.items;
            setLogs(prev => [...prev, `Encontrados ${existingProperties.length} imóveis no banco de dados.`]);

            let updatedCount = 0;
            let createdCount = 0;
            let errorCount = 0;

            for (const kenloItem of kenloData) {
                const codigo = kenloItem.codigoReference;
                if (!codigo) continue;

                const existingProperty = existingProperties.find(p => p.codigoReference === codigo);
                const propertyData: Partial<Imveis> = {
                    codigoReference: codigo,
                    resumoImovel: kenloItem.resumoImovel || '',
                    tipoImovel: kenloItem.tipoImovel || 'Apartamento',
                    precoVenda: kenloItem.precoVenda || 0,
                    precoLocacao: kenloItem.precoLocacao || 0,
                    valorCondominio: kenloItem.valorCondominio || 0,
                    valorIPTU: kenloItem.valorIPTU || 0,
                    areaUtil: kenloItem.areaUtil || 0,
                    areaTotal: kenloItem.areaTotal || 0,
                    quartos: kenloItem.quartos || 0,
                    suites: kenloItem.suites || 0,
                    vagas: kenloItem.vagas || 0,
                    logradouro: kenloItem.enderecoRua || '',
                    bairro: kenloItem.enderecoBairro || '',
                    cidade: kenloItem.enderecoCidade || '',
                    complemento: kenloItem.enderecoComplemento || '',
                    estado: 'SP'
                };

                if (kenloItem.precoVenda > 0) {
                    propertyData.price = kenloItem.precoVenda;
                    propertyData.pretensao = 'Venda';
                } else if (kenloItem.precoLocacao > 0) {
                    propertyData.price = kenloItem.precoLocacao;
                    propertyData.pretensao = 'Locacao';
                }

                if (kenloItem.valorCondominio > 0) propertyData.imovelCondominio = true;

                try {
                    if (existingProperty) {
                        await BaseCrudService.update('imoveis', { ...existingProperty, ...propertyData, _updatedDate: new Date() });
                        updatedCount++;
                    } else {
                        await BaseCrudService.create('imoveis', { ...propertyData, _id: crypto.randomUUID(), _createdDate: new Date(), _updatedDate: new Date() } as Imveis);
                        createdCount++;
                    }
                } catch (e) {
                    errorCount++;
                }

                if ((updatedCount + createdCount) % 20 === 0) {
                    setLogs(prev => [...prev, `Processados ${updatedCount + createdCount} imóveis...`]);
                }
            }

            setLogs(prev => [...prev, `🏁 Sincronização concluída! ✅ Atualizados: ${updatedCount}, ✨ Criados: ${createdCount}, ❌ Erros: ${errorCount}`]);
            setImportStatus('success');
        } catch (error) {
            setLogs(prev => [...prev, `❌ Erro fatal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]);
            setImportStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-light-gray flex flex-col">
            <Header />
            <div className="flex-1 p-8 container mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-6">
                    Importação de Imóveis
                </h1>

                <Card className="mb-6 border-blue-200 bg-blue-50/10">
                    <CardHeader>
                        <CardTitle className="text-blue-700">Sincronização Especializada (Kenlo JSON)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Esta opção sincroniza automaticamente os valores de venda, locação, condomínio, IPTU e áreas de todos os imóveis que já estão no sistema, usando os códigos de referência (ex: CA0149).
                        </p>
                        <Button
                            onClick={handleKenloSync}
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            disabled={importStatus === 'importing'}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Sincronizar Todos os Imóveis (via kenlo_import.json)
                        </Button>
                    </CardContent>
                </Card>

                {/* SESSÃO DE MIGRAÇÃO NOTEBOOK A -> NUVEM */}
                <Card className="mb-6 border-purple-200 bg-purple-50/10">
                    <CardHeader>
                        <CardTitle className="text-purple-700 flex items-center">
                            <Database className="w-5 h-5 mr-2" />
                            Migração de Dados (Local para Servidor Prisma)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Quando acessar o sistema pelo <b>Notebook A</b>, clique nos botões abaixo para transferir todos os dados que estavam presos no navegador para o novo Banco de Dados Centralizado (PostgreSQL). Esse processo é seguro e não duplica dados.
                        </p>
                        <div className="flex gap-4 flex-wrap">
                            <Button
                                onClick={async () => {
                                    setImportStatus('importing');
                                    setLogs(prev => [...prev, 'Iniciando extração de Imóveis do Navegador...']);
                                    const allProps = await BaseCrudService.getAll('imoveis', [], { limit: 5000 });
                                    setLogs(prev => [...prev, `Enviando ${allProps.items.length} propriedades para nuvem...`]);

                                    try {
                                        const res = await fetch('/api/sync-to-postgres', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ collectionId: 'imoveis', items: allProps.items })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            setLogs(prev => [...prev, `✅ Sucesso! ${data.imported} imóveis salvos no PostgreSQL.`]);
                                        } else throw new Error(data.error);
                                    } catch (e: any) {
                                        setLogs(prev => [...prev, `❌ Erro no envio: ${e.message}`]);
                                    }
                                    setImportStatus('success');
                                }}
                                variant="outline"
                                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                disabled={importStatus === 'importing'}
                            >
                                <CloudUpload className="w-4 h-4 mr-2" />
                                1. Enviar Imóveis (Vitrine)
                            </Button>

                            <Button
                                onClick={async () => {
                                    setImportStatus('importing');
                                    setLogs(prev => [...prev, 'Iniciando extração de Usuários da Equipe...']);
                                    const allUsers = await BaseCrudService.getAll('usuariossistema', [], { limit: 5000 });

                                    try {
                                        const res = await fetch('/api/sync-to-postgres', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ collectionId: 'usuariossistema', items: allUsers.items })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            setLogs(prev => [...prev, `✅ Sucesso! ${data.imported} usuários salvos no PostgreSQL.`]);
                                        } else throw new Error(data.error);
                                    } catch (e: any) {
                                        setLogs(prev => [...prev, `❌ Erro no envio: ${e.message}`]);
                                    }
                                    setImportStatus('success');
                                }}
                                variant="outline"
                                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                disabled={importStatus === 'importing'}
                            >
                                <CloudUpload className="w-4 h-4 mr-2" />
                                2. Enviar Usuários (Admin)
                            </Button>

                            <Button
                                onClick={async () => {
                                    setImportStatus('importing');
                                    setLogs(prev => [...prev, 'Iniciando extração de Clientes...']);
                                    // Hack manual para puxar dados diretamente caso o baseCrudService tenha limite no backend-less
                                    const rawClientsQuery = mockDb.query('clientes');
                                    const rawClients = await rawClientsQuery.find();

                                    try {
                                        const res = await fetch('/api/sync-to-postgres', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ collectionId: 'clientes', items: rawClients.items })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            setLogs(prev => [...prev, `✅ Sucesso! ${data.imported} clientes salvos no PostgreSQL.`]);
                                        } else throw new Error(data.error);
                                    } catch (e: any) {
                                        setLogs(prev => [...prev, `❌ Erro no envio: ${e.message}`]);
                                    }
                                    setImportStatus('success');
                                }}
                                variant="outline"
                                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                disabled={importStatus === 'importing'}
                            >
                                <CloudUpload className="w-4 h-4 mr-2" />
                                3. Enviar Clientes & Leads
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>1. Importação Manual (Cole o JSON)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='[ { "resumoImovel": "Casa...", "precoVenda": 500000 ... } ]'
                            className="min-h-[200px] font-mono text-xs"
                        />
                        <div className="mt-4 flex gap-2">
                            <Button onClick={handlePreview} disabled={!jsonInput}>
                                <Upload className="w-4 h-4 mr-2" />
                                Carregar Preview
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {importStatus !== 'idle' && importStatus !== 'error' && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>2. Preview ({previewData.length} itens)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[300px] overflow-y-auto space-y-2 mb-4">
                                {previewData.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 border rounded text-sm flex justify-between">
                                        <span className="font-bold">{item.resumoImovel || 'Sem Título'}</span>
                                        <span className="text-green-600">R$ {item.precoVenda}</span>
                                    </div>
                                ))}
                                {previewData.length > 5 && (
                                    <div className="text-center text-gray-500 text-sm">...e mais {previewData.length - 5} itens</div>
                                )}
                            </div>

                            <Button onClick={handleImport} className="w-full bg-green-600 hover:bg-green-700" disabled={importStatus === 'importing' || importStatus === 'success'}>
                                {importStatus === 'importing' ? 'Importando...' : 'Confirmar Importação para o Banco de Dados'}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {logs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Log de Importação</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-black/90 text-green-400 p-4 rounded font-mono text-xs h-[200px] overflow-y-auto">
                                {logs.map((log, i) => (
                                    <div key={i}>{log}</div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div >
    );
}
