const https=require('https'), zlib=require('zlib');
const id=process.argv[2];
https.get('https://planners.maxroll.gg/profiles/pob/'+id,{headers:{'User-Agent':'Mozilla/5.0'}},r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>{
  try{ let j=JSON.parse(b); let data=j.data; if(typeof data==='string') data=JSON.parse(data); let code=data.pobCode||data.code||data;
    if(typeof code!=='string'){console.log('keys',Object.keys(j),Object.keys(data));process.exit(1);}
    const buf=Buffer.from(code.replace(/-/g,'+').replace(/_/g,'/'),'base64'); const xml=zlib.inflateSync(buf).toString('utf8');
    require('fs').writeFileSync('/tmp/pob.xml',xml); console.log('ok',xml.length);
  }catch(e){console.log('err',e.message,b.slice(0,300));}
});}).on('error',e=>console.log('neterr',e.message));
