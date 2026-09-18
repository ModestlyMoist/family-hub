// Fail-fast verification: node verify.cjs
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(__dirname+'/app.js','utf8').replace(/\r\n/g,'\n')).digest('hex'),'311311cd6c21f00fd1469afda6b21ecc5fcd21abc8e476a2022ff458da6fafc2','Protected app.js changed');
for(const file of fs.readdirSync(__dirname).filter(x=>x.endsWith('.js'))){const r=cp.spawnSync(process.execPath,['--check',file],{cwd:__dirname,encoding:'utf8'});if(r.status)throw Error(file+' syntax: '+r.stderr)}
const html=fs.readFileSync(__dirname+'/index.html','utf8'),sw=fs.readFileSync(__dirname+'/sw.js','utf8');
for(const [,asset] of html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css)(?:\?v=[^"]+)?)"/g)){assert.ok(fs.existsSync(__dirname+'/'+asset.split('?')[0]),'Missing asset '+asset);assert.ok(sw.includes("'./"+asset+"'"),'Service worker mismatch '+asset)}
for(const file of ['dashboard-model.test.cjs','today-presentation.test.cjs','hub-time.test.cjs','money-improvements.test.cjs','edge-revision.test.cjs','credit-card-budget.test.cjs','credit-card-ui.test.cjs','credit-card-sync.test.cjs','sync-regression.test.cjs']){const r=cp.spawnSync(process.execPath,[file],{cwd:__dirname,encoding:'utf8'});process.stdout.write(r.stdout);if(r.status)throw Error(file+': '+r.stderr)}
console.log('Verified: syntax, cache references and all nine regression suites.');

