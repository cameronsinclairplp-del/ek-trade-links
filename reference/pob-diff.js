// node reference/pob-diff.js <old.xml> <new.xml> — diff two PoB XML exports (stats, equipped items, tree sockets, skills, tree nodes, config). Written 05/09/2026; used for every PoB update since.
const fs=require('fs');
function parse(file){
  const x=fs.readFileSync(file,'utf8');
  const out={};
  const b=/<Build ([^>]*)>/.exec(x)[1]; out.build=Object.fromEntries([...b.matchAll(/(\w+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  out.stats={}; for(const m of x.matchAll(/<PlayerStat stat="(\w+)" value="([^"]*)"\/>/g)) out.stats[m[1]]=Number(m[2]);
  // items
  out.items={}; for(const m of x.matchAll(/<Item id="(\d+)">([\s\S]*?)<\/Item>/g)){ out.items[m[1]]=m[2].trim().split('\n').map(s=>s.trim()).filter(Boolean); }
  out.slots={}; for(const m of x.matchAll(/<Slot [^>]*itemId="(\d+)" name="([^"]+)"\/>/g)) if(m[1]!=="0") out.slots[m[2]]=m[1];
  // also active flask etc
  // skills
  out.skills=[]; for(const m of x.matchAll(/<Skill ([^>]*)>([\s\S]*?)<\/Skill>/g)){ const a=Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map(q=>[q[1],q[2]])); const gems=[...m[2].matchAll(/<Gem ([^>]*)\/>/g)].map(g=>Object.fromEntries([...g[1].matchAll(/(\w+)="([^"]*)"/g)].map(q=>[q[1],q[2]]))); out.skills.push({a,gems}); }
  // tree
  const sp=/<Spec [^>]*nodes="([^"]*)"[^>]*>/.exec(x); out.nodes=sp?sp[1].split(',').map(Number):[];
  const spa=/<Spec ([^>]*)>/.exec(x); out.spec=spa?Object.fromEntries([...spa[1].matchAll(/(\w+)="([^"]*)"/g)].map(q=>[q[1],q[2]])):{};
  out.masteries=/masteryEffects="([^"]*)"/.exec(x)?.[1];
  // sockets (jewels in tree)
  out.sockets={}; for(const m of x.matchAll(/<Socket nodeId="(\d+)" itemId="(\d+)"\/>/g)) if(m[2]!=='0') out.sockets[m[1]]=m[2];
  // config
  out.config={}; for(const m of x.matchAll(/<Input name="(\w+)" (\w+)="([^"]*)"\/>/g)) out.config[m[1]]=m[3];
  return out;
}
const a=parse(process.argv[2]), b=parse(process.argv[3]);
console.log('BUILD', a.build.level,'->',b.build.level, a.build.mainSocketGroup,'->',b.build.mainSocketGroup, a.build.pantheonMajorGod,b.build.pantheonMajorGod, a.build.pantheonMinorGod,b.build.pantheonMinorGod);
for(const k of ['TotalDPS','CombinedDPS','Life','EnergyShield','Mana','Speed','CritChance','CritMultiplier','TotalEHP','PhysicalMaximumHitTaken','FireMaximumHitTaken','ColdMaximumHitTaken','LightningMaximumHitTaken','ChaosMaximumHitTaken','BlockChance','SpellBlockChance','SpellSuppressionChance','EffectiveMovementSpeedMod','FireResist','ColdResist','LightningResist','ChaosResist','Armour','Evasion','Str','Dex','Int','EnergyShieldRegen','EnergyShieldRecharge','NetEnergyShieldRegen','PhysicalDamageReduction','MeleeEvadeChance','ProjectileEvadeChance','SpellDodgeChance','AttackDodgeChance','MainHand.Accuracy']) if(a.stats[k]!=null||b.stats[k]!=null) console.log(k.padEnd(28), String(a.stats[k]).slice(0,12).padEnd(14), String(b.stats[k]).slice(0,12));
console.log('\nSLOTS');
const slots=new Set([...Object.keys(a.slots),...Object.keys(b.slots)]);
for(const s of [...slots].sort()){ const ia=a.items[a.slots[s]], ib=b.items[b.slots[s]]; const same=JSON.stringify(ia)===JSON.stringify(ib); console.log((same?'   ':'>> ')+s.padEnd(20), ia?ia.slice(1,3).join(' | '):'-', ' ==> ', ib?ib.slice(1,3).join(' | '):'-'); if(!same&&ib){ console.log('     NEW:'); ib.forEach(l=>console.log('       '+l)); } if(!same&&ia){console.log('     OLD:'); ia.forEach(l=>console.log('       '+l));} }
console.log('\nTREE SOCKETS old', a.sockets, '\n     new', b.sockets);
for(const [n,i] of Object.entries(b.sockets)) console.log(' socket',n,'=>',b.items[i]?b.items[i].slice(0,3).join(' | '):'?');
console.log('\nSKILLS old');
a.skills.forEach(s=>console.log(' ', (s.a.slot||'?').padEnd(12), s.a.enabled, s.gems.map(g=>`${g.nameSpec}${g.gemId?'':''} ${g.level}/${g.quality}${g.enabled==='false'?' OFF':''}`).join(' + ')));
console.log('SKILLS new');
b.skills.forEach(s=>console.log(' ', (s.a.slot||'?').padEnd(12), s.a.enabled, s.gems.map(g=>`${g.nameSpec} ${g.level}/${g.quality}${g.enabled==='false'?' OFF':''}`).join(' + ')));
const A=new Set(a.nodes), B=new Set(b.nodes); console.log('\nTREE nodes', a.nodes.length,'->',b.nodes.length, 'removed', [...A].filter(n=>!B.has(n)), 'added',[...B].filter(n=>!A.has(n)));
console.log('spec', a.spec.treeVersion, b.spec.treeVersion, a.spec.ascendClassId, b.spec.ascendClassId, 'masteries same?', a.masteries===b.masteries);
console.log('\nCONFIG diff'); for(const k of new Set([...Object.keys(a.config),...Object.keys(b.config)])) if(a.config[k]!==b.config[k]) console.log(' ',k, a.config[k],'->',b.config[k]);
console.log('\nALL ITEMS new (unequipped too):'); for(const [id,it] of Object.entries(b.items)){ const eq=Object.entries(b.slots).find(([s,i])=>i===id); const sock=Object.entries(b.sockets).find(([n,i])=>i===id); console.log(' ',id, eq?eq[0]:(sock?'socket '+sock[0]:'(unequipped)'), '|', it.slice(0,3).join(' | ')); }
