const fs = require('fs');
const file = 'src/components/pages/admin/AdminLocacoesKanbanPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the grid wrapper for the property card using regex to ignore newline variations (\r\n vs \n)
content = content.replace(
    /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">\s*{\/\* Left card \(Property detail or placeholder\) \*\/}/,
    '<div className="w-full">\n                                                {/* Left card (Property detail or placeholder) */}'
);

fs.writeFileSync(file, content);
console.log('Grid wrapper fixed!');
