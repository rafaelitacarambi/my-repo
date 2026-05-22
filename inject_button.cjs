const fs = require('fs');
const file = 'src/components/pages/admin/AdminLocacoesKanbanPage.tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split(/\r?\n/);

let idx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Imóvel da Locação') && lines[i].includes('Home className=')) {
        // This is the header. The badge is a few lines down.
        for (let j = i; j < i + 10; j++) {
            if (lines[j] && lines[j].includes('</Badge>')) {
                idx = j;
                break;
            }
        }
        if (idx !== -1) break;
    }
}

if (idx !== -1) {
    // We found the closing </Badge> tag
    // We need to wrap the badge and the new button in a div.flex
    // Let's find the start of the <Badge>
    let startIdx = -1;
    for (let j = idx; j >= idx - 5; j--) {
        if (lines[j] && lines[j].includes('<Badge variant="secondary"')) {
            startIdx = j;
            break;
        }
    }

    if (startIdx !== -1) {
        lines.splice(idx + 1, 0, 
            '                                                    <button type="button" onClick={() => setShowVincularImovelModal(true)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">',
            '                                                        <Plus className="w-3.5 h-3.5" /> Vincular Imóvel',
            '                                                    </button>',
            '                                                </div>'
        );
        lines.splice(startIdx, 0, '                                                <div className="flex items-center gap-3">');
        fs.writeFileSync(file, lines.join('\n'));
        console.log('Button successfully injected via line numbers!');
    } else {
        console.log('Badge start not found!');
    }
} else {
    console.log('Badge end not found!');
}
