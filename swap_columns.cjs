const fs = require('fs');
const file = 'src/components/pages/admin/AdminLocacoesKanbanPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const formStartStr = '{/* Adicionar Participante Form */}';
const listStartStr = '{/* List of current parties */}';

const formStartIdx = content.indexOf(formStartStr);
const listStartIdx = content.indexOf(listStartStr);
const listEndIdx = content.indexOf('</Card>', listStartIdx) + '</Card>'.length;

const formBlock = content.substring(formStartIdx, listStartIdx);
const listBlock = content.substring(listStartIdx, listEndIdx);

const newContent = content.substring(0, formStartIdx) + listBlock + '\n\n                                            ' + formBlock.trim() + '\n' + content.substring(listEndIdx);

fs.writeFileSync(file, newContent);
console.log('Swapped successfully!');
