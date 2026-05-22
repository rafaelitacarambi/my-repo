const fs = require('fs');
const file = 'src/components/pages/admin/AdminLocacoesKanbanPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state variable
if (!content.includes('setShowVincularImovelModal')) {
    content = content.replace(
        'const [showNewImovelModal, setShowNewImovelModal] = useState(false);',
        'const [showNewImovelModal, setShowNewImovelModal] = useState(false);\n    const [showVincularImovelModal, setShowVincularImovelModal] = useState(false);'
    );
}

// 2. Extract the form block
const formStartStr = '{/* Right: Inline Vincular Imóvel */}';
const formStartIdx = content.indexOf(formStartStr);

let formBlock = '';
if (formStartIdx !== -1) {
    const lines = content.split('\n');
    let startLine = -1;
    let endLine = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('{/* Right: Inline Vincular Imóvel */}')) startLine = i;
        if (startLine !== -1 && lines[i].includes('Cadastrar Novo Imóvel')) {
            endLine = i + 3; // "Cadastrar Novo Imóvel" -> "</button>" -> "</div>"
            break;
        }
    }
    if (startLine !== -1 && endLine !== -1) {
        formBlock = lines.slice(startLine, endLine).join('\n');
    }
}

// Clean up formBlock for modal
let innerForm = formBlock
    .replace('{/* Right: Inline Vincular Imóvel */}', '')
    .replace(/<div className="lg:col-span-1[^>]+>/, '')
    .trim();
innerForm = innerForm.substring(0, innerForm.lastIndexOf('</div>')).trim();

// Add close modal action when clicking new imovel
innerForm = innerForm.replace(
    'handleOpenNewImovelModal',
    '() => { handleOpenNewImovelModal(); setShowVincularImovelModal(false); }'
);

const dialogBlock = `
                {/* Modal de Vincular Imóvel */}
                <Dialog open={showVincularImovelModal} onOpenChange={setShowVincularImovelModal}>
                    <DialogContent className="max-w-[420px] p-6 bg-white border-slate-100 rounded-3xl shadow-xl outline-none border-0">
                        ` + innerForm + `
                    </DialogContent>
                </Dialog>
`;

// Remove the extracted block from the main content
if (formBlock) {
    content = content.replace(formBlock, '');
}

// Update the header to include the open modal button using REGEX
content = content.replace(
    /<Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold rounded-lg px-2 py-0\.5">\s*\{atendimentoImoveis\.filter[^}]+\}\.length\} vinculado\s*<\/Badge>/,
    `<div className="flex items-center gap-3">
                                                    $&
                                                    <button type="button" onClick={() => setShowVincularImovelModal(true)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
                                                        <Plus className="w-3.5 h-3.5" /> Vincular Imóvel
                                                    </button>
                                                </div>`
);

// Close modal when adding imovel successfully globally
content = content.replace(
    "toast.success('Imóvel vinculado com sucesso!');",
    "toast.success('Imóvel vinculado com sucesso!');\n            setShowVincularImovelModal(false);"
);

// Append the modal before the end of the main component return
const clientModalStart = '<Dialog open={showNewImovelModal}';
if (content.includes(clientModalStart)) {
    content = content.replace(clientModalStart, dialogBlock.trim() + '\n\n                ' + clientModalStart);
}

fs.writeFileSync(file, content);
console.log('Imovel Modal transformation applied with header button!');
