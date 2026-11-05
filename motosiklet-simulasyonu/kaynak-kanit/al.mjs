// Browser Rendering çıktısını (tool-results dosyası) kanıt klasörüne yazar: node al.mjs <girdi> <cikti-adi>
import fs from 'node:fs';
const [, , src, name] = process.argv;
const d = JSON.parse(fs.readFileSync(src, 'utf8'));
delete d.pad;
fs.writeFileSync(new URL(`./${name}.json`, import.meta.url), JSON.stringify(d, null, 1));
console.log(name, d.pages?.length ?? Object.keys(d).length, 'kayıt');
