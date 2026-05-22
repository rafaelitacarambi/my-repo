const fs = require('fs');
const file = 'src/components/pages/admin/AdminLocacoesKanbanPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex-shrink-0"
                                                                            onClick={async () => {
                                                                                if (confirm('Tem certeza que deseja remover esta parte deste processo?')) {`;

const editButtonHtml = `                                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs gap-1 px-2"
                                                                                onClick={() => {
                                                                                    if (client) {
                                                                                        setEditingParte({ parteId: part._id, clientId: client._id });
                                                                                        setEditingParteForm({
                                                                                            clientName: client.clientName || '',
                                                                                            cpfCnpj: client.cpfCnpj || '',
                                                                                            email: client.email || '',
                                                                                            phoneNumber: client.phoneNumber || '',
                                                                                            rg: client.rg || '',
                                                                                            nationality: client.nationality || 'Brasileiro(a)',
                                                                                            profession: client.profession || '',
                                                                                            maritalStatus: client.maritalStatus || 'Solteiro(a)',
                                                                                            address: client.address || '',
                                                                                        });
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                                Editar
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex-shrink-0"
                                                                                onClick={async () => {
                                                                                    if (confirm('Tem certeza que deseja remover esta parte deste processo?')) {`;

content = content.replace(targetStr, editButtonHtml);

// We also need to add a closing </div> after the Trash2 button, which looks like this:
//                                                                             <Trash2 className="w-4 h-4" />
//                                                                         </Button>
//                                                                     </div>
// We find this by looking for the next '</div>' after the targetStr was found.
const trashStr = `                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>`;

const trashReplacementStr = `                                                                            <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>`;

content = content.replace(trashStr, trashReplacementStr);

fs.writeFileSync(file, content);
console.log('Edit button added successfully!');
