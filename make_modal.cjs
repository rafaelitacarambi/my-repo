const fs = require('fs');
const file = 'src/components/pages/admin/AdminLocacoesKanbanPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state variable
if (!content.includes('setShowVincularParteModal')) {
    content = content.replace(
        'const [showNewClientModal, setShowNewClientModal] = useState(false);',
        'const [showNewClientModal, setShowNewClientModal] = useState(false);\n    const [showVincularParteModal, setShowVincularParteModal] = useState(false);'
    );
}

// 2. Extract the "Adicionar Participante Form"
const formStartStr = '{/* Adicionar Participante Form */}';
const formStartIdx = content.indexOf(formStartStr);
const formEndIdx = content.indexOf('</Card>', formStartIdx) + '</Card>'.length;
const formBlock = content.substring(formStartIdx, formEndIdx);

// Convert to DialogContent
let innerForm = formBlock
    .replace('{/* Adicionar Participante Form */}', '')
    .replace(/<Card className="[^"]+">/, '')
    .replace(/<\/Card>$/, '')
    .trim();

// Add close modal actions
innerForm = innerForm.replace(
    'setShowNewClientModal(true);',
    'setShowNewClientModal(true);\n                                                                                setShowVincularParteModal(false);'
);

innerForm = innerForm.replace(
    "toast.success('Parte vinculada com sucesso!');",
    "toast.success('Parte vinculada com sucesso!');\n                                                                                        setShowVincularParteModal(false);"
);

const dialogBlock = `
                {/* Modal de Vincular Parte */}
                <Dialog open={showVincularParteModal} onOpenChange={setShowVincularParteModal}>
                    <DialogContent className="max-w-[420px] p-6 bg-white border-slate-100 rounded-3xl shadow-xl outline-none border-0">
                        ` + innerForm + `
                    </DialogContent>
                </Dialog>
`;

// 3. Remove the entire proponentes tab
const propTabStartStr = '<TabsContent value="proponentes"';
const propTabStartIdx = content.indexOf(propTabStartStr);
if (propTabStartIdx !== -1) {
    const propTabEndIdx = content.indexOf('</TabsContent>', propTabStartIdx) + '</TabsContent>'.length;
    const propTabBlock = content.substring(propTabStartIdx, propTabEndIdx);
    content = content.replace(propTabBlock, '');
}

// 4. Change the button to open the modal
content = content.replace(
    "onClick={() => setModalTab('proponentes')}",
    "onClick={() => setShowVincularParteModal(true)}"
);

// 5. Append the modal before the end of the main component return
const clientModalStart = '<Dialog open={showNewClientModal}';
if (content.includes(clientModalStart)) {
    content = content.replace(clientModalStart, dialogBlock.trim() + '\n\n                ' + clientModalStart);
}

fs.writeFileSync(file, content);
console.log('Modal transformation applied!');
