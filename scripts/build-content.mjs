// @ts-nocheck
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
  let goToDefinitionSource = '';
  try {
    goToDefinitionSource = await readFile(path.join(root, 'config', 'go-to-definition.html'), 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

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
    goToDefinitionSource,
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
function excerpt(markdown,fallback){const plain=stripMarkdown(markdown);return(plain||fallback).slice(0,230);}
function compareNames(a,b){ return a.localeCompare(b,'en',{numeric:true,sensitivity:'base'}); }

async function walk(dir) {
  const entries=await readdir(dir,{withFileTypes:true});
  const files=[];
  for(const e of entries){
    const absolute=path.join(dir,e.name);
    if(e.isDirectory()) files.push(...await walk(absolute));
    else if(e.isFile()&&e.name.endsWith('.md')) files.push(absolute);
  }
  return files.sort((a,b)=>compareNames(a,b));
}

async function walkChapterConfigs(dir) {
  const entries=await readdir(dir,{withFileTypes:true});
  const files=[];
  for(const e of entries){
    const absolute=path.join(dir,e.name);
    if(e.isDirectory()) files.push(...await walkChapterConfigs(absolute));
    else if(e.isFile()&&e.name==='chapter.toml') files.push(absolute);
  }
  return files.sort((a,b)=>compareNames(a,b));
}

function scanHeadings(markdown){
  const lines=markdown.replace(/\r\n/g,'\n').split('\n');
  const headings=[];
  let fence=null;
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    const fm=line.match(/^\s*(`{3,}|~{3,})/);
    if(fm){
      const marker=fm[1];
      if(!fence) fence={char:marker[0],len:marker.length};
      else if(marker[0]===fence.char&&marker.length>=fence.len) fence=null;
      continue;
    }
    if(fence) continue;
    const m=line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if(m) headings.push({line:i,level:m[1].length,raw:m[2],title:displayTitle(m[2])});
  }
  return {lines,headings};
}

function pageToc(markdown){
  const {headings}=scanHeadings(markdown);
  const counts=new Map();
  return headings.filter((h)=>h.level>=2).map((h)=>{
    const base=slugify(h.title);
    const count=(counts.get(base)??0)+1;
    counts.set(base,count);
    return {id:count===1?base:`${base}-${count}`,title:h.title,level:h.level};
  });
}

function anchorMapFor(markdown){
  return Object.fromEntries(pageToc(markdown).map((item)=>[slugify(item.title),item.id]));
}

function pageFromFile(relativePath, markdown, version, lang, group){
  const slash=relativePath.replaceAll('\\','/');
  const groupPrefix=`${group}/`;
  const rest=slash.startsWith(groupPrefix)?slash.slice(groupPrefix.length):slash;
  const parts=rest.split('/');
  const file=parts.at(-1);
  const dirs=parts.slice(0,-1);
  const stem=file.replace(/\.md$/i,'');
  const isIndex=stem.toLowerCase()==='index';
  const routeParts=isIndex?dirs:[...dirs,stem];
  const slug=[group,...routeParts].filter(Boolean).join('/');
  const {lines,headings}=scanHeadings(markdown);
  const h1=headings.find((h)=>h.level===1&&h.line<=10)??headings.find((h)=>h.level===1)??null;
  const title=h1?.title??displayTitle(stem);
  const bodyLines=[...lines];
  if(h1) bodyLines.splice(h1.line,1);
  const body=bodyLines.join('\n').trim();
  return {
    slug,title,sourcePath:slash,groupId:group,version,lang,
    routeParts,dirs,stem,isIndex,
    markdown:body,toc:pageToc(body),anchorMap:anchorMapFor(body),
    parentSlug:null,children:[],breadcrumbs:[]
  };
}

function makeDirNode(name,parent=null){ return {name,parent,page:null,meta:null,dirs:new Map(),files:new Map()}; }
function insertPage(rootNode,page){
  let dir=rootNode;
  for(const segment of page.dirs){
    if(!dir.dirs.has(segment)) dir.dirs.set(segment,makeDirNode(segment,dir));
    dir=dir.dirs.get(segment);
  }
  if(page.isIndex) dir.page=page;
  else dir.files.set(page.stem,page);
}
function numericPrefix(value){
  const match=String(value).match(/^(\d+(?:[.-]\d+)?)/);
  if(!match) return Number.POSITIVE_INFINITY;
  const parts=match[1].split(/[.-]/).map(Number);
  return parts.reduce((value,part,index)=>value+part/Math.pow(100,index),0);
}

function sortedEntries(dir){
  const entries=[];
  for(const [name,node] of dir.dirs) entries.push({kind:'dir',name,node});
  for(const [name,page] of dir.files) entries.push({kind:'file',name,page});
  const explicit=Array.isArray(dir.meta?.pages)?new Map(dir.meta.pages.map((name,index)=>[String(name),index])):null;
  return entries.sort((a,b)=>{
    const ar=explicit?.has(a.name)?explicit.get(a.name):Number.POSITIVE_INFINITY;
    const br=explicit?.has(b.name)?explicit.get(b.name):Number.POSITIVE_INFINITY;
    if(ar!==br) return ar-br;
    const ao=a.kind==='dir'&&Number.isFinite(Number(a.node.meta?.order))?Number(a.node.meta.order):numericPrefix(a.name);
    const bo=b.kind==='dir'&&Number.isFinite(Number(b.node.meta?.order))?Number(b.node.meta.order):numericPrefix(b.name);
    if(ao!==bo) return ao-bo;
    return compareNames(a.name,b.name);
  });
}

function applyChapterMeta(rootNode, metaByPath){
  function visit(dir, parts=[]){
    const key=parts.join('/');
    if(key&&metaByPath.has(key)) dir.meta=metaByPath.get(key);
    for(const [name,child] of dir.dirs) visit(child,[...parts,name]);
  }
  visit(rootNode);
}

function buildGroupNavigation(pages, info, chapterMeta=new Map()){
  const rootNode=makeDirNode('');
  for(const page of pages) insertPage(rootNode,page);
  applyChapterMeta(rootNode,chapterMeta);
  const topics=new Map(pages.map((page)=>[page.slug,page]));
  const documents=[];

  function navForPage(page,parentPage,breadcrumbs,children=[]){
    page.parentSlug=parentPage?.slug??null;
    page.children=children.map((child)=>child.slug);
    page.breadcrumbs=[{title:info.title,slug:info.id},...breadcrumbs,{title:page.title,slug:page.slug}];
    return {slug:page.slug,title:page.title,children};
  }

  function materializeDir(dir,parentPage,breadcrumbs){
    if(!dir.page){
      throw new Error(`Documentation directory requires index.md: ${dir.name || '(root)'}`);
    }
    const page=dir.page;
    const childNav=[];
    for(const entry of sortedEntries(dir)){
      if(entry.kind==='dir') childNav.push(materializeDir(entry.node,page,[...breadcrumbs,{title:page.title,slug:page.slug}]));
      else childNav.push(navForPage(entry.page,page,[...breadcrumbs,{title:page.title,slug:page.slug}]));
    }
    return navForPage(page,parentPage,breadcrumbs,childNav);
  }

  for(const entry of sortedEntries(rootNode)){
    if(entry.kind==='dir'){
      const nav=materializeDir(entry.node,null,[]);
      const page=topics.get(nav.slug);
      documents.push({slug:page.slug,title:page.title,sourcePath:page.sourcePath,nav,excerpt:excerpt(page.markdown,page.title)});
    }else{
      const nav=navForPage(entry.page,null,[]);
      documents.push({slug:entry.page.slug,title:entry.page.title,sourcePath:entry.page.sourcePath,nav,excerpt:excerpt(entry.page.markdown,entry.page.title)});
    }
  }
  return {documents,topics};
}

function flattenNav(node,out=[]){out.push(node.slug);for(const c of node.children)flattenNav(c,out);return out;}

function registerSourceLink(map,page){
  const sourceKey=page.sourcePath.toLowerCase();
  const baseKey=path.posix.basename(page.sourcePath).toLowerCase();
  map[sourceKey]=page.slug;
  map[baseKey]??=page.slug;
  map[`~${looseSourceKey(page.sourcePath)}`]??=page.slug;
  map[`~${looseSourceKey(path.posix.basename(page.sourcePath))}`]??=page.slug;

  // Compatibility for links written before chapter folders became the source of truth:
  // book/05-functions.md -> book/05-functions/index.md, etc.
  if(page.isIndex && page.dirs.length){
    const legacy=[page.groupId,...page.dirs].join('/')+'.md';
    map[legacy.toLowerCase()]??=page.slug;
    map[path.posix.basename(legacy).toLowerCase()]??=page.slug;
    map[`~${looseSourceKey(legacy)}`]??=page.slug;
  }
}

export async function buildContent(){
  const siteConfig=await loadSiteConfig();
  await mkdir(generatedDir,{recursive:true});
  await mkdir(staticDir,{recursive:true});
  const files=await walk(contentDir);
  const chapterConfigFiles=await walkChapterConfigs(contentDir);
  const contexts=new Map();
  let documentCount=0;

  for(const file of files){
    const rel=path.relative(contentDir,file).split(path.sep).join('/');
    const parts=rel.split('/');
    if(parts.length<4) continue;
    const [version,lang,group,...rest]=parts;
    if(!configuredVersions.some((item)=>String(item.id)===version)) continue;
    if(!configuredLanguages.some((item)=>String(item.id)===lang)) continue;
    if(!groupIds.has(group)) continue;
    const localPath=[group,...rest].join('/');
    const markdown=await readFile(file,'utf8');
    const page=pageFromFile(localPath,markdown,version,lang,group);
    const ctxKey=`${version}/${lang}`;
    if(!contexts.has(ctxKey)) contexts.set(ctxKey,{version,lang,pagesByGroup:new Map(),chapterMetaByGroup:new Map(),sourceLinks:{},anchors:{}});
    const ctx=contexts.get(ctxKey);
    if(!ctx.pagesByGroup.has(group)) ctx.pagesByGroup.set(group,[]);
    ctx.pagesByGroup.get(group).push(page);
    registerSourceLink(ctx.sourceLinks,page);
    ctx.anchors[page.slug]=page.anchorMap;
    documentCount++;
  }

  for(const file of chapterConfigFiles){
    const rel=path.relative(contentDir,file).split(path.sep).join('/');
    const parts=rel.split('/');
    if(parts.length<5) continue;
    const [version,lang,group,...rest]=parts;
    if(!configuredVersions.some((item)=>String(item.id)===version)) continue;
    if(!configuredLanguages.some((item)=>String(item.id)===lang)) continue;
    if(!groupIds.has(group)) continue;
    const ctxKey=`${version}/${lang}`;
    if(!contexts.has(ctxKey)) contexts.set(ctxKey,{version,lang,pagesByGroup:new Map(),chapterMetaByGroup:new Map(),sourceLinks:{},anchors:{}});
    const ctx=contexts.get(ctxKey);
    if(!ctx.chapterMetaByGroup.has(group)) ctx.chapterMetaByGroup.set(group,new Map());
    const chapterPath=rest.slice(0,-1).join('/');
    ctx.chapterMetaByGroup.get(group).set(chapterPath,await readToml(file));
  }

  const manifests={};
  const topicObject={};
  const allAnchors={};
  const allSourceLinks={};
  const searchIndex=[];
  const routeKeys=[];
  let topicCount=0;

  for(const [ctxKey,ctx] of contexts){
    const manifest=[];
    const groupTopics=new Map();
    for(const [group,pages] of ctx.pagesByGroup){
      const info=groupInfo[ctx.lang]?.[group]??{id:group,title:group,eyebrow:group,description:'',order:99};
      const built=buildGroupNavigation(pages,info,ctx.chapterMetaByGroup.get(group)??new Map());
      manifest.push({...info,documents:built.documents});
      groupTopics.set(group,built.topics);
    }
    manifest.sort((a,b)=>a.order-b.order);
    manifests[ctxKey]=manifest;
    allAnchors[ctxKey]=ctx.anchors;
    allSourceLinks[ctxKey]=ctx.sourceLinks;

    for(const group of manifest){
      const topics=groupTopics.get(group.id)??new Map();
      const slugs=[];
      for(const doc of group.documents) flattenNav(doc.nav,slugs);
      slugs.forEach((slug,index)=>{
        const t=topics.get(slug);
        if(!t) throw new Error(`Missing topic for nav slug ${ctxKey}/${slug}`);
        const children=t.children.map((childSlug)=>{const child=topics.get(childSlug);return{slug:child.slug,title:child.title};});
        const key=`${ctxKey}/${slug}`;
        topicObject[key]={
          slug:t.slug,title:t.title,sourcePath:t.sourcePath,docSlug:t.slug,groupId:t.groupId,
          version:t.version,lang:t.lang,parentSlug:t.parentSlug,children,
          markdown:t.markdown,toc:t.toc,breadcrumbs:t.breadcrumbs,
          previous:index>0?{slug:slugs[index-1],title:topics.get(slugs[index-1]).title}:null,
          next:index<slugs.length-1?{slug:slugs[index+1],title:topics.get(slugs[index+1]).title}:null,
          excerpt:excerpt(t.markdown,t.title)
        };
        searchIndex.push({
          version:ctx.version,lang:ctx.lang,slug,groupId:t.groupId,title:t.title,
          breadcrumbs:t.breadcrumbs.map((item)=>item.title),excerpt:excerpt(t.markdown,t.title),
          text:stripMarkdown(`${t.title}\n${t.markdown}`).slice(0,5000)
        });
        routeKeys.push({version:ctx.version,lang:ctx.lang,slug});
        topicCount++;
      });
    }
  }

  const stats={documents:documentCount,topics:topicCount,contexts:[...contexts.keys()],generatedAt:new Date().toISOString()};
  await Promise.all([
    writeFile(path.join(generatedDir,'site-config.json'),JSON.stringify(siteConfig,null,2)+'\n'),
    writeFile(path.join(generatedDir,'manifest.json'),JSON.stringify(manifests,null,2)+'\n'),
    writeFile(path.join(generatedDir,'topics.json'),JSON.stringify(topicObject)+'\n'),
    writeFile(path.join(generatedDir,'anchors.json'),JSON.stringify(allAnchors)+'\n'),
    writeFile(path.join(generatedDir,'source-links.json'),JSON.stringify(allSourceLinks,null,2)+'\n'),
    writeFile(path.join(generatedDir,'stats.json'),JSON.stringify(stats,null,2)+'\n'),
    writeFile(path.join(generatedDir,'routes.json'),JSON.stringify(routeKeys,null,2)+'\n'),
    writeFile(path.join(staticDir,'search-index.json'),JSON.stringify(searchIndex)+'\n')
  ]);
  return stats;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const s=await buildContent();
  console.log(`Generated ${s.topics} topic pages from ${s.documents} Markdown documents across ${s.contexts.length} locale/version contexts.`);
}
