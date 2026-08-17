const fs=require('fs'), path=require('path'), dir=path.join('src','content','saints');
fs.readdirSync(dir).filter(f=>f.endsWith('.md')).forEach(f=>{
  const content=fs.readFileSync(path.join(dir,f),'utf8');
  const fm=content.split('---')[1];
  const lines=fm.split('\n');
  let inSeq=false;
  lines.forEach((l,i)=>{
    const trimmed=l.trim();
    // Check for event/text/name fields that are plain scalars with colons inside
    const match=trimmed.match(/^(event|text|name|summary|title|relation):\s+(.+)/);
    if(match && !trimmed.startsWith('>-')){
      const val=match[2];
      // Check if value contains ': ' (colon+space) which breaks YAML plain scalars
      if(val.includes(': ') && !val.startsWith('"') && !val.startsWith("'")){
        console.log(f+':'+(i+1)+': '+match[1]+': '+val.substring(0,90));
      }
    }
  });
});
