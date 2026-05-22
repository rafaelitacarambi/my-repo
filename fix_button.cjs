const fs = require('fs');
const file = 'src/components/pages/admin/AdminLocacoesKanbanPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the badge using line-based approach
const lines = content.split(/\r?\n/);
let found = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold rounded-lg px-2 py-0.5">')) {
        // Confirm this is the right badge by checking next line
        if (lines[i+1].includes('vinculado')) {
            // Replace lines i to i+2
            lines.splice(i, 3, 
                '                                                <div className="flex items-center gap-3">',
                '                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold rounded-lg px-2 py-0.5">',
                '                                                        {atendimentoImoveis.filter(ai => ai.atendimentoRef === selectedCase?._id).length} vinculado',
                '                                                    </Badge>',
                '                                                    <button type="button" onClick={() => setShowVincularImovelModal(true)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">',
                '                                                        <Plus className="w-3.5 h-3.5" /> Vincular Imóvel',
                '                                                    </button>',
                '                                                </div>'
            );
            found = true;
            break;
        }
    }
}

if (found) {
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Button injected successfully!');
} else {
    console.log('Badge not found!');
}
