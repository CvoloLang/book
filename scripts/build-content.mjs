import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readToml } from './lib/toml.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'src', 'content');
const generatedDir = path.join(root, 'src', 'lib', 'generated');
const staticDir = path.join(root, 'static');

let groupInfo = {};
let groupIds = new Set();
let configuredLanguages = [];
let configuredVersions = [];
let defaultLanguage = 'en';
let defaultVersion = 'main';

async function loadSiteConfig() {
  const book = await readToml(path.join(root, 'config', 'book.toml'));
  const versionsFile = await readToml(path.join(root, 'config', 'versions.toml'));

  configuredLanguages = Array.isArray(book.languages) ? book.languages : [];
  configuredVersions = Array.isArray(versionsFile.versions) ? versionsFile.versions : [];
  defaultLanguage = String(book.default_language ?? configuredLanguages[0]?.id ?? 'en');
  defaultVersion = String(versionsFile.default ?? book.default_version ?? configuredVersions[0]?.id ?? 'main');

  groupInfo = {};
  for (const language of configuredLanguages) {
    const lang = String(language.id);
    groupInfo[lang] = {};
    for (const section of book.sections ?? []) {
      const id = String(section.id);
      groupInfo[lang][id] = {
        id,
        title: String(section[`title_${lang}`] ?? section.title_en ?? id),
        eyebrow: String(section[`eyebrow_${lang}`] ?? section.eyebrow_en ?? id),
        description: String(section[`description_${lang}`] ?? section.description_en ?? ''),
        order: Number(section.order ?? 99)
      };
    }
  }
  groupIds = new Set((book.sections ?? []).map((section) => String(section.id)));

  return {
    site: {
      title: String(book.title ?? 'Cvolo Docs'),
      name: String(book.site_name ?? 'Cvolo'),
      defaultLanguage,
      defaultVersion
    },
    languages: configuredLanguages.map((language) => ({
      id: String(language.id),
      label: String(language.label ?? language.id),
      short: String(language.short ?? String(language.id).toUpperCase())
    })),
    versions: configuredVersions.map((version) => ({
      id: String(version.id),
      label: String(version.label ?? version.id),
      description: String(version.description ?? '')
    })),
    githubLinks: (book.github_links ?? []).map((link) => ({
      id: String(link.id ?? ''),
      url: String(link.url ?? ''),
      description: String(link.description ?? ''),
      labels: Object.fromEntries(configuredLanguages.map((language) => {
        const lang = String(language.id);
        return [lang, String(link[`label_${lang}`] ?? link.label_en ?? link.id ?? 'GitHub')];
      }))
    })).filter((link) => link.id && link.url),
    sections: (book.sections ?? []).map((section) => ({
      id: String(section.id),
      order: Number(section.order ?? 99),
      labels: Object.fromEntries(configuredLanguages.map((language) => {
        const lang = String(language.id);
        return [lang, {
          title: String(section[`title_${lang}`] ?? section.title_en ?? section.id),
          eyebrow: String(section[`eyebrow_${lang}`] ?? section.eyebrow_en ?? section.id),
          description: String(section[`description_${lang}`] ?? section.description_en ?? '')
        }];
      }))
    })).sort((a, b) => a.order - b.order)
  };
}

function transliterateCyrillic(value) {
  const map = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
  return [...value].map((c)=>map[c.toLowerCase()] ?? c).join('');
}
function slugify(value) { return transliterateCyrillic(value).normalize('NFKD').replace(/#U([0-9A-F]{4})/gi,' u$1 ').replace(/[`*_~]/g,'').replace(/&/g,' and ').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-') || 'topic'; }
function looseSourceKey(value) { return value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '); }
function displayTitle(raw) { return raw.replace(/\s+#+\s*$/,'').replace(/^\s*#+\s*/,'').replace(/`([^`]+)`/g,'$1').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*([^*]+)\*/g,'$1').trim(); }
function stripMarkdown(text) { return text.replace(/```[\s\S]*?```/g,' ').replace(/`([^`]+)`/g,'$1').replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]+>/g,' ').replace(/[#>*_~|]/g,' ').replace(/\s+/g,' ').trim(); }
async function walk(dir) { const entries=await readdir(dir,{withFileTypes:true}); const files=[]; for(const e of entries){ const a=path.join(dir,e.name); if(e.isDirectory()) files.push(...await walk(a)); else if(e.isFile()&&e.name.endsWith('.md')) files.push(a);} return files.sort((a,b)=>a.localeCompare(b)); }
function scanHeadings(markdown){ const lines=markdown.replace(/\r\n/g,'\n').split('\n'); const headings=[]; let fence=null; for(let i=0;i<lines.length;i++){ const line=lines[i]; const fm=line.match(/^\s*(`{3,}|~{3,})/); if(fm){const marker=fm[1]; if(!fence) fence={char:marker[0],len:marker.length}; else if(marker[0]===fence.char&&marker.length>=fence.len) fence=null; continue;} if(fence)continue; const m=line.match(/^(#{1,6})\s+(.+?)\s*$/); if(m) headings.push({line:i,level:m[1].length,raw:m[2],title:displayTitle(m[2])}); } return {lines,headings}; }
function hasSectionRoutes(markdown){ return /<!--\s*routes\s*:\s*h2\s*-->/i.test(markdown); }
function routeHeadingsFor(markdown,group,headings){ if(group==='book'||hasSectionRoutes(markdown)) return headings.filter(h=>h.level<=2); return headings.filter(h=>h.level===1); }
function tocMinLevelFor(markdown,group){ return (group==='book'||hasSectionRoutes(markdown)) ? 3 : 2; }
function inPageToc(markdown,minLevel=3){ const {headings}=scanHeadings(markdown); const counts=new Map(); return headings.filter(h=>h.level>=minLevel).map(h=>{const base=slugify(h.title); const count=(counts.get(base)??0)+1;counts.set(base,count);return{id:count===1?base:`${base}-${count}`,title:h.title,level:h.level};}); }
function numberedPrefix(title) {
  const match = title.match(/^([A-Za-z]?\d+(?:\.\d+)*)\b/);
  return match ? match[1].toLowerCase().replace(/\./g, '-') : null;
}
function uniqueSegment(title,used,canonicalBase=null){const base=canonicalBase||numberedPrefix(title)||slugify(title);const count=(used.get(base)??0)+1;used.set(base,count);return count===1?base:`${base}-${count}`;}
function excerpt(markdown,fallback){const plain=stripMarkdown(markdown);return(plain||fallback).slice(0,230);}
function buildDocument(relativePath, markdown, version, lang, group, canonicalSegments=[]){
  const info=groupInfo[lang]?.[group] ?? {id:group,title:group,order:99};
  const fileName=path.basename(relativePath,'.md'); const docSlug=`${group}/${slugify(fileName)}`; const {lines,headings}=scanHeadings(markdown);
  const routeHeadings=routeHeadingsFor(markdown,group,headings); const tocMinLevel=tocMinLevelFor(markdown,group);
  const titleHeading=routeHeadings.find(h=>h.level===1&&h.line<=10)??null; const docTitle=titleHeading?.title||routeHeadings[0]?.title||headings[0]?.title||displayTitle(fileName);
  const firstRelevant=titleHeading??routeHeadings[0]??headings[0]??null; const prefaceEnd=firstRelevant?firstRelevant.line:lines.length; const preface=lines.slice(0,prefaceEnd).join('\n').trim(); const titleIndex=titleHeading?routeHeadings.indexOf(titleHeading):-1; const afterTitleEnd=titleHeading?(routeHeadings[titleIndex+1]?.line??lines.length):0; const afterTitle=titleHeading?lines.slice(titleHeading.line+1,afterTitleEnd).join('\n').trim():''; const rootMarkdown=[preface,afterTitle].filter(Boolean).join('\n\n');
  const groupCrumb={title:info.title,slug:group}; const rootNode={slug:docSlug,title:docTitle,level:0,parentSlug:null,children:[],segment:slugify(fileName),markdown:rootMarkdown,toc:inPageToc(rootMarkdown,tocMinLevel),sourcePath:relativePath,docSlug,groupId:group,version,lang,breadcrumbs:[groupCrumb,{title:docTitle,slug:docSlug}]};
  const topicMap=new Map([[docSlug,rootNode]]); const stack=[{level:0,slug:docSlug,pathSegments:[],used:new Map(),breadcrumbs:rootNode.breadcrumbs}]; const anchorMap={};
  let routedIndex=0;
  routeHeadings.forEach((heading,index)=>{ if(heading===titleHeading){anchorMap[slugify(heading.title)]=docSlug;return;} while(stack.length>1&&stack.at(-1).level>=heading.level)stack.pop(); const parent=stack.at(-1); const segment=uniqueSegment(heading.title,parent.used,canonicalSegments[routedIndex++] ?? null); const pathSegments=[...parent.pathSegments,segment]; const slug=`${docSlug}/${pathSegments.join('/')}`; const nextLine=routeHeadings[index+1]?.line??lines.length; const body=lines.slice(heading.line+1,nextLine).join('\n').trim(); const breadcrumbs=[...parent.breadcrumbs,{title:heading.title,slug}]; const node={slug,title:heading.title,level:heading.level,parentSlug:parent.slug,children:[],segment,markdown:body,toc:inPageToc(body,tocMinLevel),sourcePath:relativePath,docSlug,groupId:group,version,lang,breadcrumbs}; topicMap.set(slug,node); topicMap.get(parent.slug).children.push(slug); anchorMap[slugify(heading.title)]??=slug; stack.push({level:heading.level,slug,pathSegments,used:new Map(),breadcrumbs}); });
  for(const heading of headings){ if(heading===titleHeading||routeHeadings.includes(heading))continue; let ownerSlug=docSlug; if(group==='book'){let owner=null;for(const c of routeHeadings){if(c.line>=heading.line)break;if(c.level===2)owner=c;} if(owner)ownerSlug=[...topicMap.values()].find(t=>t.title===owner.title)?.slug??docSlug;} anchorMap[slugify(heading.title)]??=ownerSlug; }
  function toNav(slug){const t=topicMap.get(slug);return{slug:t.slug,title:t.title,children:t.children.map(toNav)}}
  return{version,lang,group,docSlug,docTitle,sourcePath:relativePath,topics:topicMap,nav:toNav(docSlug),anchorMap};
}
function flattenNav(node,out=[]){out.push(node.slug);for(const c of node.children)flattenNav(c,out);return out;}
export async function buildContent(){
  const siteConfig = await loadSiteConfig();
  await mkdir(generatedDir,{recursive:true}); await mkdir(staticDir,{recursive:true}); const files=await walk(contentDir);
  const manifests={}; const topicObject={}; const allAnchors={}; const allSourceLinks={}; const searchIndex=[]; const routeKeys=[]; let documentCount=0, topicCount=0;
  const contexts=new Map();
  const canonicalByDocument=new Map();
  for(const file of files){
    const rel=path.relative(contentDir,file).split(path.sep).join('/');
    const parts=rel.split('/');
    if(parts.length<4)continue;
    const [version,lang,group,...rest]=parts;
    if(lang!==defaultLanguage||!groupIds.has(group))continue;
    const localPath=[group,...rest].join('/');
    const markdown=await readFile(file,'utf8');
    const {headings}=scanHeadings(markdown);
    const routeHeadings=routeHeadingsFor(markdown,group,headings);
    const titleHeading=routeHeadings.find(h=>h.level===1&&h.line<=10)??null;
    const segments=routeHeadings.filter(h=>h!==titleHeading).map(h=>slugify(h.title));
    canonicalByDocument.set(`${version}/${localPath}`,segments);
  }
  for(const file of files){const rel=path.relative(contentDir,file).split(path.sep).join('/'); const parts=rel.split('/'); if(parts.length<4)continue; const [version,lang,group,...rest]=parts; if(!configuredVersions.some((item)=>String(item.id)===version)||!configuredLanguages.some((item)=>String(item.id)===lang)||!groupIds.has(group))continue; const localPath=[group,...rest].join('/'); const markdown=await readFile(file,'utf8'); const canonicalSegments=canonicalByDocument.get(`${version}/${localPath}`)??[]; const doc=buildDocument(localPath,markdown,version,lang,group,canonicalSegments); const ctxKey=`${version}/${lang}`; if(!contexts.has(ctxKey))contexts.set(ctxKey,{version,lang,documents:[],topics:new Map(),anchors:{},sourceLinks:{}}); const ctx=contexts.get(ctxKey); ctx.documents.push(doc); ctx.anchors[doc.docSlug]=doc.anchorMap; const sourceKey=doc.sourcePath.toLowerCase();const baseKey=path.posix.basename(doc.sourcePath).toLowerCase();ctx.sourceLinks[sourceKey]=doc.docSlug;ctx.sourceLinks[baseKey]??=doc.docSlug;ctx.sourceLinks[`~${looseSourceKey(doc.sourcePath)}`]??=doc.docSlug;ctx.sourceLinks[`~${looseSourceKey(path.posix.basename(doc.sourcePath))}`]??=doc.docSlug;for(const [s,t] of doc.topics)ctx.topics.set(s,t);documentCount++;}
  for(const [ctxKey,ctx] of contexts){ const groups=new Map(); for(const d of ctx.documents){const info=groupInfo[ctx.lang]?.[d.group]??{id:d.group,title:d.group,order:99}; if(!groups.has(info.id))groups.set(info.id,{...info,documents:[]}); groups.get(info.id).documents.push({slug:d.docSlug,title:d.docTitle,sourcePath:d.sourcePath,nav:d.nav,excerpt:excerpt(d.topics.get(d.docSlug)?.markdown ?? '',d.docTitle)});}
    const manifest=[...groups.values()].sort((a,b)=>a.order-b.order).map(g=>({...g,documents:g.documents.sort((a,b)=>a.sourcePath.localeCompare(b.sourcePath,'en',{numeric:true}))})); manifests[ctxKey]=manifest; allAnchors[ctxKey]=ctx.anchors; allSourceLinks[ctxKey]=ctx.sourceLinks;
    for(const group of manifest){const slugs=[];for(const d of group.documents)flattenNav(d.nav,slugs);slugs.forEach((slug,index)=>{const t=ctx.topics.get(slug);const children=t.children.map(cs=>{const c=ctx.topics.get(cs);return{slug:c.slug,title:c.title}});const key=`${ctxKey}/${slug}`;topicObject[key]={...t,children,previous:index>0?{slug:slugs[index-1],title:ctx.topics.get(slugs[index-1]).title}:null,next:index<slugs.length-1?{slug:slugs[index+1],title:ctx.topics.get(slugs[index+1]).title}:null,excerpt:excerpt(t.markdown,t.title)};searchIndex.push({version:ctx.version,lang:ctx.lang,slug,groupId:t.groupId,title:t.title,breadcrumbs:t.breadcrumbs.map(i=>i.title),excerpt:excerpt(t.markdown,t.title),text:stripMarkdown(`${t.title}\n${t.markdown}`).slice(0,5000)});routeKeys.push({version:ctx.version,lang:ctx.lang,slug});topicCount++;});}
  }
  const stats={documents:documentCount,topics:topicCount,contexts:[...contexts.keys()],generatedAt:new Date().toISOString()};
  await Promise.all([writeFile(path.join(generatedDir,'site-config.json'),JSON.stringify(siteConfig,null,2)+'\n'),writeFile(path.join(generatedDir,'manifest.json'),JSON.stringify(manifests,null,2)+'\n'),writeFile(path.join(generatedDir,'topics.json'),JSON.stringify(topicObject)+'\n'),writeFile(path.join(generatedDir,'anchors.json'),JSON.stringify(allAnchors)+'\n'),writeFile(path.join(generatedDir,'source-links.json'),JSON.stringify(allSourceLinks,null,2)+'\n'),writeFile(path.join(generatedDir,'stats.json'),JSON.stringify(stats,null,2)+'\n'),writeFile(path.join(generatedDir,'routes.json'),JSON.stringify(routeKeys,null,2)+'\n'),writeFile(path.join(staticDir,'search-index.json'),JSON.stringify(searchIndex)+'\n')]); return stats;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const s=await buildContent();console.log(`Generated ${s.topics} topic pages from ${s.documents} Markdown documents across ${s.contexts.length} locale/version contexts.`);}
