import { useEffect, useState, useMemo } from 'react';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, Plus, Edit, Trash2, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { BaseCrudService } from '@/integrations';
import { Imveis } from '@/entities';
import PropertyForm from '@/components/admin/properties/PropertyForm';
import * as XLSX from 'xlsx'; // Added Import
import { toast } from 'sonner';

function AdminImoveisContent() {
  const [properties, setProperties] = useState<Imveis[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [duplicatesDialogOpen, setDuplicatesDialogOpen] = useState(false); // New state
  const [potentialDuplicates, setPotentialDuplicates] = useState<Imveis[][]>([]); // New state
  const [importJson, setImportJson] = useState('');
  const [editingProperty, setEditingProperty] = useState<Imveis | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [batchStatusLoading, setBatchStatusLoading] = useState(false);

  // Initialize tab based on URL param or default to 'ativos'
  const [activeTab, setActiveTab] = useState<'ativos' | 'inativos'>(
    (searchParams.get('tab') as 'ativos' | 'inativos') ||
    (searchParams.get('status') === 'Suspenso' ? 'inativos' : 'ativos')
  );

  const handleCheckDuplicates = () => {
    const groups: { [key: string]: Imveis[] } = {};

    properties.forEach(p => {
      // User request: "somente os que contem nome de rua numero e complementos iguais"

      const street = (p.enderecoRua || p.logradouro || '').toLowerCase().trim();
      const number = (p.numero || '').toString().toLowerCase().trim();
      // Complement might be undefined/null, normalize to empty string
      const comp = (p.enderecoComplemento || '').toLowerCase().trim();

      // Only check if we have a valid street name (length > 2)
      // We explicitly include number and complement in the key to ensure strict verification
      if (street && street.length > 2) {
        // Key format: addr:street|number|complement
        const key = `addr:${street}|${number}|${comp}`;

        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      }
    });

    const duplicates = Object.values(groups).filter(g => g.length > 1);

    // Deduplicate groups (just in case, though with one key type it's less likely to overlap unless key collision)
    const uniqueGroups = new Set();
    const finalDuplicates: Imveis[][] = [];

    duplicates.forEach(group => {
      // Sort by ID is arbitrary for dedupe, just need a unique sig for the group content
      const ids = group.map(i => i._id).sort().join(',');
      if (!uniqueGroups.has(ids)) {
        uniqueGroups.add(ids);
        finalDuplicates.push(group);
      }
    });

    setPotentialDuplicates(finalDuplicates);
    setDuplicatesDialogOpen(true);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProperties(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredProperties.map(p => p._id!));
    }
  };

  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (!confirm(`Deseja alterar o status de ${selectedProperties.length} imóveis para ${newStatus}?`)) return;
    setBatchStatusLoading(true);
    try {
      const res = await fetch('/api/v1/imoveis/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProperties, updateData: { statusImovel: newStatus } })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.count || selectedProperties.length} imóveis atualizados para ${newStatus} com sucesso!`);
        setSelectedProperties([]);
        loadProperties();
      } else {
        toast.error(`Erro na atualização em massa: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Erro inesperado: ${e.message}`);
    } finally {
      setBatchStatusLoading(false);
    }
  };

  const filterStatus = searchParams.get('status');
  const filterType = searchParams.get('filter');

  const filteredProperties = useMemo(() => {
    let filtered = [...properties];
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(now.getDate() - 90);

    if (filterStatus) {
      filtered = filtered.filter(p => (p.statusImovel || p.status) === filterStatus);
    }

    if (filterType === 'novos') {
      filtered = filtered.filter(p => {
        const createdDate = p._createdDate ? new Date(p._createdDate) : null;
        return createdDate && createdDate >= sevenDaysAgo;
      });
    }

    if (filterType === 'desatualizados') {
      filtered = filtered.filter(p => {
        const status = (p.statusImovel || p.status || '').toLowerCase();
        const createdDate = p._createdDate ? new Date(p._createdDate) : null;
        const updatedDate = p._updatedDate ? new Date(p._updatedDate) : (createdDate || new Date());
        return (status === 'ativo' || status === 'disponível') && updatedDate < threeMonthsAgo;
      });
    }

    // Apply Tab Filter
    if (activeTab === 'ativos') {
      filtered = filtered.filter(p => (p.statusImovel || p.status) === 'Ativo' || (p.statusImovel || p.status) === 'Disponível');
    } else {
      filtered = filtered.filter(p => (p.statusImovel || p.status) !== 'Ativo' && (p.statusImovel || p.status) !== 'Disponível');
    }

    return filtered;
  }, [properties, filterStatus, filterType, activeTab]);

  const clearFilters = () => {
    setSearchParams({});
  };

  // Duplicate handleImport removed from here. The correct one should be defined elsewhere or consolidated.
  // If the one at 119 was the "JSON Import" legacy one, and 212 is "Excel Import", I should rename one or merge.
  // Looking at the view, 119: JSON.parse(importJson). This is the old JSON text area import.
  // 212: e.target.files. This is the File Input import.
  // They have the SAME NAME.
  // I will rename the one at 119 to `handleJsonImport` (if it's still used by a dialog) or just remove it if it's dead code.
  // However, the UI likely calls `handleImport` for the file input.
  // I will DELETE the `handleImport` at 119 (lines 119-149) if it was indeed the legacy JSON one, OR rename it.
  // Wait, looking at the code interaction 744, line 212 was part of a replace block.
  // The file view 766 shows `handleImport` at 119 (JSON logic) AND at 212 (File logic).
  // I will Rename the one at 119 to `handleJsonImport` and update its usage if any, OR just comment it out if unrelated to current task.
  // Actually, I'll assume the one at 212 is the one we want for the file input (Excel).
  // I will DELETE the one at 119-149.


  const generatePropertyCode = (type: string, allProperties: Imveis[]): string => {
    let prefix = 'C'; // Default to Casa
    const upperType = (type || '').toUpperCase();

    // Map types to prefixes
    if (['APARTAMENTO', 'KITNET', 'COBERTURA', 'FLAT', 'LOFT'].some(t => upperType.includes(t))) {
      prefix = 'A';
    } else if (['TERRENO', 'AREA', 'LOTE'].some(t => upperType.includes(t))) {
      prefix = 'T';
    } else if (['GALPAO', 'LOJA', 'SALA', 'PREDIO', 'COMERCIAL'].some(t => upperType.includes(t))) {
      prefix = 'C'; // Commercial shares 'C' or maybe 'L'? Let's stick to user request C, A, T.
      // User asked: C for Casas, A for Apts, T for Terrenos.
      // What about Commercial? Let's use 'C' for now as it wasn't specified, or maybe 'COM'?
      // Actually, let's stick to the prompt: "C para casas", "A para aptos", "T para terrenos".
      // If none match, I'll default to 'O' for Outros or maybe just 'C' if it's a building?
      // Let's default to 'C' (Casa/Construção) as a fallback.
    }

    // Filter properties with same prefix
    const existingCodes = allProperties
      .filter(p => p.codImovel && p.codImovel.startsWith(prefix))
      .map(p => {
        const numPart = p.codImovel?.substring(1);
        return parseInt(numPart || '0', 10);
      })
      .filter(n => !isNaN(n));

    const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const nextCode = maxCode + 1;

    return `${prefix}${nextCode.toString().padStart(4, '0')}`;
  };

  const handleSave = async (data: Partial<Imveis>) => {
    try {
      if (editingProperty) {
        await BaseCrudService.update('imoveis', {
          _id: editingProperty._id,
          ...data,
          _updatedDate: new Date(),
        });
      } else {
        // Generate Code if new
        const newCode = generatePropertyCode(data.tipoImovel || 'Casa', properties);

        await BaseCrudService.create('imoveis', {
          _id: crypto.randomUUID(),
          ...data,
          codImovel: newCode,
          _createdDate: new Date(),
          _updatedDate: new Date(),
        });
      }
      setDialogOpen(false);
      setEditingProperty(null);
      loadProperties();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Deseja limpar o banco de dados antes de importar? \nCancel = Manter dados e adicionar novos \nOK = Limpar tudo e importar')) {
      // Append mode
    } else {
      // Clear mode
      try {
        setLoading(true);
        const { items } = await BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 1000 });
        await Promise.all(items.map(item => BaseCrudService.delete('imoveis', item._id!)));
      } catch (error) {
        console.error(error);
      }
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        let importedCount = 0;

        // Process sequentially to avoid DB lock
        for (const row of jsonData as any[]) {
          // Assuming 'row' contains property data.
          // This part needs to be filled with actual import logic,
          // mapping 'row' fields to 'Imveis' fields and calling BaseCrudService.create
          const newProperty: Partial<Imveis> = {
            ...row, // Assuming direct mapping for simplicity, adjust as needed
            _id: crypto.randomUUID(),
            statusImovel: row.statusImovel || 'Ativo', // Default to Ativo if not provided
            _createdDate: new Date(),
            _updatedDate: new Date(),
          };
          // Generate code if not present
          if (!newProperty.codImovel) {
            newProperty.codImovel = generatePropertyCode(newProperty.tipoImovel || 'Casa', properties); // Use current 'properties' state for code generation
          }
          await BaseCrudService.create('imoveis', newProperty as Imveis);
          importedCount++;
        }

        loadProperties();
        alert(`Importação concluída! ${importedCount} imóveis importados.`);
      } catch (error) {
        console.error('Erro ao importar:', error);
        alert('Erro ao importar arquivo');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // NEW FUNCTION: Import items from active_reference.json that are missing in DB
  const handleImportMissing = async () => {
    if (!confirm('Isso irá criar novos imóveis para todos os itens "Faltantes" do relatório. Deseja continuar?')) return;

    try {
      setLoading(true);
      const response = await fetch('/active_reference.json');
      const referenceList = await response.json();
      const { items: allProps } = await BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 2000 });

      const activeKeys = new Set<string>();
      // Build keys for current DB items
      allProps.forEach(p => {
        if (p.codigoReference) {
          activeKeys.add(`REF:${p.codigoReference.trim().toUpperCase()}`);
        }
        const street = (p.enderecoRua || p.logradouro || '').toLowerCase().trim();
        const number = (p.numero || '').toString().toLowerCase().trim();
        const comp = (p.enderecoComplemento || '').toLowerCase().trim();
        if (street && street.length > 2) {
          activeKeys.add(`ADDR:${street}|${number}|${comp}`);
        }
      });

      let createdCount = 0;

      for (const p of referenceList) {
        let key = '';
        // Logic to generate key for the Reference Item
        if (p.codigoReference) {
          key = `REF:${p.codigoReference.trim().toUpperCase()}`;
        } else {
          const street = (p.enderecoRua || '').toLowerCase().trim();
          const number = (p.numero || '').toString().toLowerCase().trim();
          const comp = (p.enderecoComplemento || '').toLowerCase().trim();
          if (street && street.length > 2) {
            key = `ADDR:${street}|${number}|${comp}`;
          }
        }

        // If NOT in DB, create it
        if (key && !activeKeys.has(key)) {
          // Calculate creation data
          // We need to map JSON fields to DB fields if they differ.
          // Based on active_reference.json vs DB, they seem effectively identical for our purposes.
          // We need to ensure basic fields are there.

          const newProp: any = {
            ...p,
            _createdDate: new Date(),
            _updatedDate: new Date(),
            statusImovel: 'Ativo' // Force status to Active
          };

          // Remove ID if present in JSON to let DB generate it
          delete newProp._id;

          await BaseCrudService.create('imoveis', newProp);
          createdCount++;

          // Add to set to prevent double creation if JSON has dupes
          activeKeys.add(key);
        }
      }

      alert(`Processo Finalizado! \nForam criados ${createdCount} novos imóveis.`);
      loadProperties();

    } catch (err: any) {
      console.error(err);
      alert('Erro ao importar faltantes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const { items } = await BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 1000 });

      // Sort by date (newest first)
      const sortedItems = [...items].sort((a, b) => {
        const dateA = a._createdDate ? new Date(a._createdDate).getTime() : 0;
        const dateB = b._createdDate ? new Date(b._createdDate).getTime() : 0;
        return dateB - dateA;
      });

      setProperties(sortedItems);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property: Imveis) => {
    setEditingProperty(property);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;

    try {
      await BaseCrudService.delete('imoveis', id);
      loadProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Header */}
      <section className="w-full bg-gradient-to-br from-brandaccent/10 to-secondary/5 py-12">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <Link to="/area-restrita">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:text-secondary hover:bg-primary-foreground/5 font-paragraph mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Área Restrita
            </Button>
          </Link>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl text-secondary mb-4">
                Gestão de Imóveis
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/80">
                Cadastre e gerencie imóveis disponíveis
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingProperty(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph font-semibold h-12 px-6 rounded-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Imóvel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 bg-background">
                <DialogHeader className="px-6 py-4 border-b">
                  <DialogTitle className="font-heading text-2xl text-secondary">
                    {editingProperty ? 'Editar Imóvel' : 'Novo Imóvel'}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0">
                  <PropertyForm
                    initialData={editingProperty || {}}
                    onSubmit={handleSave}
                    onCancel={() => setDialogOpen(false)}
                    isLoading={false}
                  />
                </div>
              </DialogContent>
            </Dialog>



            <Button
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary/10 font-paragraph font-semibold h-12 px-6 rounded-lg ml-2"
              onClick={handleCheckDuplicates}
            >
              Verificar Duplicatas
            </Button>

            <Button
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary/10 font-paragraph font-semibold h-12 px-6 rounded-lg ml-2"
              onClick={async () => {
                if (!confirm('Deseja gerar códigos (Ex: C0001, A0001) para todos os imóveis que ainda não possuem?')) return;

                setLoading(true);
                try {
                  let updatedCount = 0;
                  // Process in chunks to avoid overwhelming correct max code calc
                  // Actually, we can just iterate and update local state then save, but easier to just do it sequentially or simply re-fetch
                  // To ensure uniqueness, we must sort and then assign.

                  // 1. Get all properties again to be sure
                  const { items: allProps } = await BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 5000 });

                  // 2. Identify missing codes
                  const missing = allProps.filter(p => !p.codImovel);

                  if (missing.length === 0) {
                    alert('Todos os imóveis já possuem códigos.');
                    setLoading(false);
                    return;
                  }

                  // 3. Assign codes
                  // We must respect existing generated codes in `allProps` when calculating next
                  // But since we are inside a loop, we need to update `allProps` view as we go?
                  // Easier: specific counters.

                  const getNextCode = (prefix: string, list: Imveis[]) => {
                    const existing = list
                      .filter(p => p.codImovel && p.codImovel.startsWith(prefix))
                      .map(p => parseInt(p.codImovel!.substring(1) || '0', 10))
                      .filter(n => !isNaN(n));
                    return (existing.length > 0 ? Math.max(...existing) : 0) + 1;
                  };

                  // Group by type to batch? No, sequential is safer for uniqueness.
                  // Let's maintan a local simulation of the DB state for code generation
                  const currentList = [...allProps];

                  for (const prop of missing) {
                    let prefix = 'C';
                    const type = (prop.tipoImovel || '').toUpperCase();
                    if (['APARTAMENTO', 'KITNET', 'COBERTURA', 'FLAT', 'LOFT'].some(t => type.includes(t))) prefix = 'A';
                    else if (['TERRENO', 'AREA', 'LOTE'].some(t => type.includes(t))) prefix = 'T';
                    else if (['GALPAO', 'LOJA', 'SALA', 'PREDIO', 'COMERCIAL'].some(t => type.includes(t))) prefix = 'C';

                    // Calculate next based on currentList state
                    const nextNum = getNextCode(prefix, currentList);
                    const newCode = `${prefix}${nextNum.toString().padStart(4, '0')}`;

                    // Update DB
                    await BaseCrudService.update('imoveis', { _id: prop._id, codImovel: newCode });

                    // Update local list for next iteration
                    const idx = currentList.findIndex(p => p._id === prop._id);
                    if (idx !== -1) currentList[idx].codImovel = newCode;

                    updatedCount++;
                  }

                  alert(`${updatedCount} imóveis atualizados com novos códigos!`);
                  loadProperties();

                } catch (e) {
                  console.error(e);
                  alert('Erro ao gerar códigos.');
                } finally {
                  setLoading(false);
                }
              }}
            >
              Gerar Códigos Faltantes
            </Button>



            <Button
              onClick={handleImportMissing}
              variant="outline"
              className="border-secondary text-secondary hover:bg-secondary/10 font-paragraph font-semibold h-12 px-6 rounded-lg ml-2"
            >
              Importar Faltantes
            </Button>

            <Button
              onClick={async () => {
                if (!confirm('Deseja sincronizar logradouros e números dos JSONs para o banco local? Isso corrigirá endereços vazios.')) return;
                setLoading(true);
                try {
                  const response = await fetch('/active_reference.json');
                  const referenceList = await response.json();
                  const { items: currentItems } = await BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 2000 });

                  // Buscar usuários para vincular IDs de captadores
                  const usersResult = await BaseCrudService.getAll<UsuriosdoSistema>('usuariossistema');
                  const users = (usersResult as any).items || (usersResult as any).data || [];
                  const userMap = new Map();
                  users.forEach((u: any) => {
                    if (u.name) userMap.set(u.name.trim().toLowerCase(), u._id);
                    if (u.login) userMap.set(u.login.trim().toLowerCase(), u._id);
                  });

                  const refMap = new Map();
                  referenceList.forEach((p: any) => {
                    const code = (p.codigoReference || p.codImovel || '').toString().trim().toUpperCase();
                    if (code) refMap.set(code, p);
                  });

                  let updated = 0;
                  for (const item of currentItems) {
                    const code = (item.codigoReference || item.codImovel || '').toString().trim().toUpperCase();
                    const ref = refMap.get(code);
                    if (ref) {
                      const updateData: any = {
                        ...item,
                        logradouro: ref.logradouro || item.logradouro,
                        numero: ref.numero || item.numero,
                        enderecoRua: ref.enderecoRua || item.enderecoRua,
                        bairro: ref.bairro || item.bairro,
                        cidade: ref.cidade || item.cidade,
                        estado: ref.estado || item.estado,
                        complemento: ref.complemento || item.complemento,
                        enderecoBairro: ref.enderecoBairro || item.enderecoBairro,
                        enderecoCidade: ref.enderecoCidade || item.enderecoCidade,
                        enderecoComplemento: ref.enderecoComplemento || item.enderecoComplemento,
                        corretorResponsavel: ref.corretorResponsavel || (item as any).corretorResponsavel,
                        dormitorios: ref.dormitorios || item.dormitorios || 0,
                        quartos: ref.dormitorios || item.quartos || 0,
                        suites: ref.suites || item.suites || 0,
                        vagas: ref.vagas || item.vagas || 0,
                        vagasCobertas: ref.vagas || item.vagasCobertas || 0,
                        areaTerreno: ref.areaTerreno || item.areaTerreno || 0,
                        areaTotal: ref.areaTerreno || item.areaTotal || 0,
                        areaConstruida: ref.areaConstruida || item.areaConstruida || 0,
                        areaUtil: ref.areaConstruida || item.areaUtil || 0
                      };

                      // Tentar vincular o ID do corretor se o nome bater com um usuário cadastrado
                      if (ref.corretorResponsavel || !ref.corretorResponsavel) {
                        let captadorName = (ref.corretorResponsavel || '').trim().toLowerCase();

                        // Regra Especial: Rsales ou Vazio vinculado ao login 'rs'
                        if (captadorName === 'rsales' || captadorName === '') {
                          captadorName = 'rs';
                        }

                        const userId = userMap.get(captadorName);
                        if (userId) {
                          updateData.corretorResponsavelId = userId;
                          // Opcional: Atualizar o nome textual também para facilitar visualização
                          if (captadorName === 'rs') {
                            updateData.corretorResponsavel = 'RS';
                          }
                        }
                      }

                      await BaseCrudService.update('imoveis', updateData);
                      updated++;
                    }
                  }
                  alert(`${updated} imóveis sincronizados! Endereços, Captadores e Características atualizados.`);
                  loadProperties();
                } catch (err: any) {
                  alert('Erro na sincronização: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }}
              variant="outline"
              className="border-blue-500 text-blue-500 hover:bg-blue-500/10 font-paragraph font-semibold h-12 px-6 rounded-lg ml-2"
            >
              Sincronizar Logradouros
            </Button>


            <Button
              variant="outline"
              className="border-warning text-warning hover:bg-warning/10 font-paragraph font-semibold h-12 px-6 rounded-lg ml-2"
              onClick={async () => {
                if (!confirm('Deseja sincronizar o status dos imóveis? Imóveis que NÃO estiverem na planilha de referência serão marcados como SUSPENSOS. Os demais permanecerão Ativos.')) return;

                setLoading(true);
                try {
                  // 1. Fetch current DB properties
                  const { items: allProps } = await BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 5000 });

                  // 2. Fetch Reference JSON
                  const response = await fetch('/active_reference.json');
                  if (!response.ok) throw new Error('Arquivo de referência não encontrado.');
                  const referenceList = await response.json();

                  // 3. Create a Set of "Active Keys" for O(1) lookup
                  // 3. Create a Set of "Active Keys" for O(1) lookup
                  const activeKeys = new Set();
                  referenceList.forEach((p: any) => {
                    // Key 1: Code Reference (e.g. CA0149)
                    if (p.codigoReference) activeKeys.add(`REF:${p.codigoReference.trim().toUpperCase()}`);

                    // Key 2: Strict Address Match (Street + Number + Complement)
                    const street = (p.enderecoRua || '').toLowerCase().trim();
                    const number = (p.numero || '').toString().toLowerCase().trim();
                    const comp = (p.enderecoComplemento || '').toLowerCase().trim();

                    if (street && street.length > 2) {
                      activeKeys.add(`ADDR:${street}|${number}|${comp}`);
                    }

                    // Key 3: Full Title Match - REMOVED to prevent false positives
                    // Generic titles like "Apartamento" were matching everything.
                    // const title = (p.resumoImovel || '').toLowerCase().trim();
                    // if (title && title.length > 5) {
                    //      activeKeys.add(`TITLE:${title}`);
                    // }
                  });

                  let suspendedCount = 0;
                  let activeCount = 0;
                  let totalChecked = 0;

                  for (const prop of allProps) {
                    totalChecked++;
                    // Normalized Property Keys
                    const propRef = prop.codigoReference ? `REF:${prop.codigoReference.trim().toUpperCase()}` : null;

                    const street = (prop.enderecoRua || prop.logradouro || '').toLowerCase().trim();
                    const number = (prop.numero || '').toString().toLowerCase().trim();
                    const comp = (prop.enderecoComplemento || '').toLowerCase().trim();
                    const propAddrKey = (street && street.length > 2) ? `ADDR:${street}|${number}|${comp}` : null;

                    // Removed Title Key lookup
                    // const title = (prop.resumoImovel || prop.propertyName || '').toLowerCase().trim();
                    // const propTitleKey = (title && title.length > 5) ? `TITLE:${title}` : null;

                    const isActive = (propRef && activeKeys.has(propRef)) ||
                      (propAddrKey && activeKeys.has(propAddrKey));

                    // Determine if we need to change status
                    // "Suspenso" properties stay suspenso unless found active? 
                    // User request: "colocar todos os outros como inativos".
                    // So if NOT found -> Suspenso.
                    // If Found -> Ensure Ativo (unless manually suspended? User said "Todos... planilha tem 275 ativos").
                    // Let's assume if found in spreadsheet => MUST BE ACTIVE.

                    if (isActive) {
                      if (prop.statusImovel !== 'Ativo') {
                        await BaseCrudService.update('imoveis', { _id: prop._id, statusImovel: 'Ativo', status: 'Ativo' });
                        activeCount++;
                      }
                    } else {
                      if (prop.statusImovel !== 'Suspenso') {
                        await BaseCrudService.update('imoveis', { _id: prop._id, statusImovel: 'Suspenso', status: 'Suspenso' });
                        suspendedCount++;
                      }
                    }
                  }

                  alert(`Sincronização Finalizada!

                - Total Verificados: ${totalChecked}
                - Total na Planilha: ${referenceList.length}
                - Imóveis Suspensos (Não encontrados na planilha): ${suspendedCount}
                - Imóveis Ativados/Confirmados: ${activeCount}

                Nota: Se o número de suspensos for 0 e você acredita que deveriam haver, verifique se os títulos ou endereços correspondem exatamente.`);
                  loadProperties();

                } catch (e: any) {
                  console.error(e);
                  alert(`Erro ao sincronizar: ${e.message}`);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Sincronizar Status
            </Button>

            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 font-paragraph font-semibold h-12 px-6 rounded-lg ml-2"
              onClick={async () => {
                if (!confirm('Isso irá tentar extrair o NÚMERO e definir ESTADO=SP para todos os imóveis. Continuar?')) return;

                setLoading(true);
                try {
                  const { items: allProps } = await BaseCrudService.getAll<Imveis>('imoveis', undefined, { limit: 5000 });
                  let updatedCount = 0;

                  for (const p of allProps) {
                    let updates: any = {};
                    let changed = false;

                    // 1. Default State to SP
                    if (!p.estado || p.estado !== 'SP') {
                      updates.estado = 'SP';
                      changed = true;
                    }

                    // 2. Extract Number from Street if Number is missing
                    const fullAddr = p.enderecoRua || p.logradouro || '';
                    const currentNum = p.numero;

                    if (fullAddr && (!currentNum || currentNum === '')) {
                      const match = fullAddr.match(/,\s*(?:nº|n°|num|number)?\s*(\d+|s\/n)$/i) ||
                        fullAddr.match(/\s+-\s*(\d+)$/);

                      if (match) {
                        const num = match[1];
                        const streetOnly = fullAddr.substring(0, match.index).trim();
                        if (streetOnly.endsWith(',')) {
                          updates.logradouro = streetOnly.slice(0, -1);
                        } else {
                          updates.logradouro = streetOnly;
                        }

                        updates.numero = num;
                        updates.enderecoRua = streetOnly;
                        changed = true;
                      }
                    }

                    // 3. Ensure Bairro/Cidade from legacy fields
                    if (!p.bairro && p.enderecoBairro) { updates.bairro = p.enderecoBairro; changed = true; }
                    if (!p.cidade && p.enderecoCidade) { updates.cidade = p.enderecoCidade; changed = true; }

                    if (changed) {
                      await BaseCrudService.update('imoveis', { _id: p._id, ...updates });
                      updatedCount++;
                    }
                  }

                  alert(`Normalização Concluída! ${updatedCount} imóveis atualizados.`);
                  loadProperties();
                } catch (e: any) {
                  console.error(e);
                  alert('Erro ao normalizar: ' + e.message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Normalizar Endereços
            </Button>

            {/* Old Import Dialog removed. New Import is via direct file input above. */}
          </div>
        </div >
      </section >

      {/* Content */}
      < section className="py-12 bg-primary" >
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
              <p className="mt-4 text-primary-foreground">Carregando imóveis...</p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Tabs */}
              <div className="flex space-x-4 border-b border-primary-foreground/10 pb-2">
                <button
                  onClick={() => {
                    setActiveTab('ativos');
                    setSearchParams({ tab: 'ativos' });
                  }}
                  className={`px-4 py-2 font-heading font-semibold text-lg transition-colors ${activeTab === 'ativos'
                    ? 'text-secondary border-b-2 border-secondary'
                    : 'text-primary-foreground/50 hover:text-primary-foreground'
                    }`}
                >
                  Ativos ({properties.filter(p => (p.statusImovel || p.status) === 'Ativo' || (p.statusImovel || p.status) === 'Disponível').length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('inativos');
                    setSearchParams({ tab: 'inativos' });
                  }}
                  className={`px-4 py-2 font-heading font-semibold text-lg transition-colors ${activeTab === 'inativos'
                    ? 'text-secondary border-b-2 border-secondary'
                    : 'text-primary-foreground/50 hover:text-primary-foreground'
                    }`}
                >
                  Inativos / Suspensos ({properties.filter(p => (p.statusImovel || p.status) !== 'Ativo' && (p.statusImovel || p.status) !== 'Disponível').length})
                </button>
              </div>

              {(filterStatus || filterType) && (
                <div className="flex items-center gap-4 bg-secondary/5 p-4 rounded-lg border border-secondary/20">
                  <div className="flex-1">
                    <p className="text-sm text-secondary font-medium">
                      Filtrando por: <span className="font-bold">{filterStatus || (filterType === 'novos' ? 'Novos' : 'Desatualizados')}</span>
                    </p>
                    <p className="text-xs text-primary-foreground/60">
                      Exibindo {filteredProperties.length} imóveis
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-primary-foreground/60 hover:text-secondary"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              )}

              {selectedProperties.length > 0 && (
                <div className="flex items-center gap-4 bg-primary/10 p-4 rounded-lg border border-primary/20 mb-6 flex-wrap">
                  <span className="font-semibold text-primary">{selectedProperties.length} imóveis selecionados</span>
                  <div className="flex-1" />
                  <span className="text-sm font-medium">Alterar Status para:</span>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => handleBatchStatusUpdate('Ativo')} disabled={batchStatusLoading}>Ativo</Button>
                    <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50" onClick={() => handleBatchStatusUpdate('Suspenso')} disabled={batchStatusLoading}>Suspenso</Button>
                    <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => handleBatchStatusUpdate('Vendido')} disabled={batchStatusLoading}>Vendido</Button>
                    <Button size="sm" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50" onClick={() => handleBatchStatusUpdate('Locado')} disabled={batchStatusLoading}>Locado</Button>
                  </div>
                  <Button size="sm" variant="ghost" className="text-muted-foreground ml-2" onClick={() => setSelectedProperties([])}>Limpar Tudo</Button>
                </div>
              )}

              <div className="flex gap-2 items-center mb-4">
                <Checkbox
                  checked={filteredProperties.length > 0 && selectedProperties.length === filteredProperties.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-primary-foreground/80 cursor-pointer">Selecionar Todos da Página</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={property._id}
                    className="bg-cardbackground rounded-xl p-6 border border-primary-foreground/10 hover:border-secondary/50 transition-all duration-300"
                  >
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2 items-center">
                          <Checkbox checked={selectedProperties.includes(property._id!)} onCheckedChange={() => handleToggleSelect(property._id!)} />
                          <span className="bg-secondary/20 text-secondary text-xs px-2 py-1 rounded-full font-paragraph font-semibold">
                            {property.pretensao || property.transactionType}
                          </span>
                          {property.codImovel && (
                            <span className="bg-primary/10 text-primary-foreground text-xs px-2 py-1 rounded-full font-paragraph font-bold border border-primary/20">
                              {property.codImovel}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(property)}
                            className="h-8 w-8 text-primary-foreground/60 hover:text-secondary hover:bg-secondary/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Cover Image */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4 bg-muted/50">
                        {property.propertyImages || (property.galeriaFotos && property.galeriaFotos.length > 0) ? (
                          <img
                            src={(Array.isArray(property.propertyImages) ? property.propertyImages[0] : property.propertyImages) || (property.galeriaFotos && property.galeriaFotos[0])}
                            alt={property.resumoImovel}
                            className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Sem+Foto';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                            <Building2 className="w-12 h-12 opacity-20" />
                          </div>
                        )}
                      </div>

                      {/* Fallback to legacy field names if new ones are empty */}
                      <h3 className="font-heading text-xl text-primary-foreground mb-1 line-clamp-1">
                        {property.resumoImovel || property.propertyName || 'Imóvel sem título'}
                      </h3>
                      <div className="flex items-center text-primary-foreground/60 text-sm mb-4">
                        <Building2 className="w-4 h-4 mr-1" />
                        {property.tipoImovel || property.propertyType}
                      </div>
                      <p className="font-paragraph text-sm text-primary-foreground/60 mb-4 line-clamp-2">
                        {property.descricaoAnuncio || property.description}
                      </p>
                      <div className="flex justify-between items-center pt-4 border-t border-primary-foreground/10">
                        <span className="font-heading text-lg text-secondary">
                          {property.precoVenda
                            ? `R$ ${property.precoVenda.toLocaleString()}`
                            : (property.precoLocacao
                              ? `R$ ${property.precoLocacao.toLocaleString()}/mês`
                              : (property.price ? `R$ ${property.price.toLocaleString()}` : 'R$ 0,00'))
                          }
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${(property.statusImovel || property.status) === 'Ativo' || (property.statusImovel || property.status) === 'Disponível'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                          {property.statusImovel || property.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          <Dialog open={duplicatesDialogOpen} onOpenChange={setDuplicatesDialogOpen}>
            <DialogContent className="max-w-4xl bg-white text-slate-900 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Imóveis Duplicados Encontrados</DialogTitle>
                <DialogDescription>
                  Encontramos {potentialDuplicates.length} grupos de imóveis potencialmente duplicados.
                </DialogDescription>
                {potentialDuplicates.length > 0 && (
                  <Button
                    variant="destructive"
                    className="mt-2"
                    onClick={async () => {
                      if (!confirm(`Isso manterá apenas o imóvel MAIS ANTIGO de cada grupo e excluirá os outros.\nTotal de grupos: ${potentialDuplicates.length}\n\nTem certeza?`)) return;

                      setLoading(true);
                      try {
                        let deletedCount = 0;
                        let errorCount = 0;

                        // Flat list of IDs to delete
                        const idsToDelete: string[] = [];

                        for (const group of potentialDuplicates) {
                          // Sort by created date ascending (oldest first)
                          const sortedGroup = [...group].sort((a, b) => {
                            const dateA = a._createdDate ? new Date(a._createdDate).getTime() : 0;
                            const dateB = b._createdDate ? new Date(b._createdDate).getTime() : 0;
                            return dateA - dateB;
                          });

                          // To keep: index 0. To delete: index 1..n
                          const toDelete = sortedGroup.slice(1);
                          toDelete.forEach(p => idsToDelete.push(p._id));
                        }

                        // Process sequentially to avoid Race Conditions in the mock DB (Read-Modify-Write)
                        // The mock DB overwrites the whole collection on save, so parallel deletes cause data loss/corruption or errors.
                        for (const id of idsToDelete) {
                          try {
                            await BaseCrudService.delete('imoveis', id);
                            deletedCount++;
                            // Tiny yield to keep UI responsive
                            if (deletedCount % 10 === 0) await new Promise(r => setTimeout(r, 10));
                          } catch (err) {
                            console.error(`Failed to delete ${id}`, err);
                            errorCount++;
                          }
                        }

                        alert(`Processo finalizado!\n${deletedCount} duplicatas excluídas.\n${errorCount} erros.`);
                        setDuplicatesDialogOpen(false);
                        loadProperties();
                      } catch (e: any) {
                        console.error(e);
                        alert(`Erro crítico ao excluir duplicatas: ${e.message}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Resolver Automaticamente (Manter Mais Antigo)
                  </Button>
                )}
              </DialogHeader>
              <div className="space-y-6">
                {potentialDuplicates.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Nenhuma duplicata encontrada!</p>
                ) : (
                  potentialDuplicates.map((group, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-slate-50">
                      <h3 className="font-bold text-sm text-slate-700 mb-2">Grupo {idx + 1}</h3>
                      <div className="space-y-2">
                        {group.map(p => (
                          <div key={p._id} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div>
                              <p className="font-semibold">{p.resumoImovel || p.propertyName || 'Sem Título'}</p>
                              <p className="text-xs text-slate-500">
                                {p.enderecoRua}, {p.numero} - {p.enderecoBairro}
                              </p>
                              <p className="text-xs text-slate-400">ID: {p._id}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(p._id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section >

      <Footer />
    </div >
  );
}

export default function AdminImoveisPage() {
  return (
    <MemberProtectedRoute>
      <AdminImoveisContent />
    </MemberProtectedRoute>
  );
}
