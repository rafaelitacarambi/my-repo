const pdf = require('pdf-parse');
console.log('Exports:', Object.keys(pdf));
console.log('Type of pdf:', typeof pdf);
if (pdf.default) {
    console.log('Type of pdf.default:', typeof pdf.default);
}
