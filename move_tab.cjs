const fs = require('fs');
const file = 'src/components/pages/admin/AdminLocacoesKanbanPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Extract the grid block from the proponentes tab
const propStartStr = '<TabsContent value="proponentes"';
const propStartIdx = content.indexOf(propStartStr);
const gridStartIdx = content.indexOf('<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">', propStartIdx);
const tabEndIdx = content.indexOf('</TabsContent>', gridStartIdx);
const propGridBlock = content.substring(gridStartIdx, tabEndIdx).trim();

// 2. Remove the proponentes tab completely
const propTabFullStart = content.lastIndexOf('<TabsContent value="proponentes"', gridStartIdx);
const propTabFullEnd = content.indexOf('</TabsContent>', gridStartIdx) + '</TabsContent>'.length;
const propTabBlock = content.substring(propTabFullStart, propTabFullEnd);
content = content.replace(propTabBlock, '');

// 3. Find the old summary card in dados tab
const oldSummaryStartStr = '{/* Partes Vinculadas ao Contrato */}';
const oldSummaryStartIdx = content.indexOf(oldSummaryStartStr);
const oldSummaryEndStr = '{/* Notas Internas Card */}';
const oldSummaryEndIdx = content.indexOf(oldSummaryEndStr, oldSummaryStartIdx);
const oldSummaryBlock = content.substring(oldSummaryStartIdx, oldSummaryEndIdx);

// 4. Replace the old summary block with the new grid block
content = content.replace(oldSummaryBlock, '{/* Partes Vinculadas ao Contrato (Movido) */}\n                                                ' + propGridBlock + '\n\n                                                ' + oldSummaryEndStr);

fs.writeFileSync(file, content);
console.log('Done moving proponentes block to dados tab.');
