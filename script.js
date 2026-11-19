/* Python з нуля — рушій курсу (однаковий для 8 і 9 класу).
   Уроки, автоперевірка й налаштування класу — у lessons.js. Емулятор tkinter/turtle — у py/ */
Object.entries(EXTRA).forEach(([i,o])=>Object.assign(LESSONS[+i],o));

'use strict';
/* ---------- стан і сховище ---------- */
const K=COURSE.key;
/* шкільний режим: прогрес у sessionStorage (зникає після закриття браузера) */
const SKEY=K+'school';
function keysOf(st){const a=[];try{for(let i=0;i<st.length;i++){const k=st.key(i);if(k&&k.startsWith(K)&&k!==SKEY)a.push(k)}}catch(e){}return a}
function wipe(st){keysOf(st).forEach(k=>{try{st.removeItem(k)}catch(e){}})}
const SCH=(()=>{try{
 const u=new URL(location.href),q=u.searchParams.get('school');
 if(q==='1'){localStorage.setItem(SKEY,'1');wipe(localStorage)}
 if(q==='0')localStorage.removeItem(SKEY);
 if(q!==null){u.searchParams.delete('school');history.replaceState(null,'',u.pathname+u.search+u.hash)}
 return localStorage.getItem(SKEY)==='1'}catch(e){return false}})();
const ST=(()=>{try{return SCH?sessionStorage:localStorage}catch(e){return null}})();
/* перенесення: раніше 8 і 9 клас були одним курсом (ключі lpy:, уроки 16–31) */
(()=>{if(!COURSE.migrate)return;try{
 const L=localStorage;if(L.getItem(K+'mig'))return;
 const get=k=>{const v=L.getItem('lpy:'+k);return v===null?null:JSON.parse(v)};
 for(let i=16;i<32;i++)['code:','chk:'].forEach(p=>{const v=L.getItem('lpy:'+p+i);if(v!==null&&L.getItem(K+p+(i-16))===null)L.setItem(K+p+(i-16),v)});
 const d=get('done9')||get('done');if(Array.isArray(d))L.setItem(K+'done',JSON.stringify(d.filter(x=>x>=16).map(x=>x-16)));
 const c=Math.max(+get('cur9')||0,+get('cur')||0);if(c>=16)L.setItem(K+'cur',JSON.stringify(c-16));
 const t=get('ltab');if(t){const o={};Object.keys(t).forEach(i=>{if(+i>=16)o[i-16]=t[i]});L.setItem(K+'ltab',JSON.stringify(o))}
 ['themeC','name','ui','ac','started'].forEach(k=>{const v=L.getItem('lpy:'+k);if(v!==null&&L.getItem(K+k)===null)L.setItem(K+k,v)});
 L.setItem(K+'mig','1')}catch(e){}})();
const store={
 get(k,d){try{const v=ST.getItem(K+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{ST.setItem(K+k,JSON.stringify(v))}catch(e){}},
 del(k){try{ST.removeItem(K+k)}catch(e){}}
};
const N=LESSONS.length;
/* у курсі 8 класу зберігаємо прогрес 9 класу зі спільного курсу, доки його не забере курс 9 класу */
if(COURSE.g===8)try{const L=localStorage;if(L.getItem('lpy:done9')===null){const d=JSON.parse(L.getItem('lpy:done')||'[]');L.setItem('lpy:done9',JSON.stringify(Array.isArray(d)?d.filter(x=>x>=16):[]));L.setItem('lpy:cur9',L.getItem('lpy:cur')||'0')}}catch(e){}
/* нова версія уроків: старий код, відмітки й прогрес стосувалися інших завдань — прибираємо їх */
if(store.get('lv',1)!==(COURSE.ver||1)){try{keysOf(ST).forEach(k=>{if(/^(code|chk):|^(done|cur|ltab)$/.test(k.slice(K.length)))ST.removeItem(k)})}catch(e){}store.set('lv',COURSE.ver||1)}
let cur=store.get('cur',0),done=store.get('done',[]).filter(i=>i>=0&&i<N),file=0;
if(!(cur>=0&&cur<N))cur=0;
const $=s=>document.querySelector(s);
const ta=$('#ta'),gut=$('#gut'),hl=$('#hl'),eband=$('#eband');
const ICON={moon:'<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'};
const CHECK='<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>';
const STAR='<svg viewBox="0 0 24 24"><path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/></svg>';
const PLAY='<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M7 5v14l12-7z"/></svg>';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let tt;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),1800)}
/* ---------- Піксельний сніг на головній (темна тема, з 20 листопада по 1 березня) ---------- */
// Повертає рік початку зими (0 — не сезон снігу).
function winterSeason(d){const m=d.getMonth(),day=d.getDate(),y=d.getFullYear();
 if(m===10&&day>=20||m===11)return y;if(m<=1||m===2&&day===1)return y-1;return 0}
const WINTER=winterSeason(new Date());
const snowBox=document.createElement('div');snowBox.id='snow';snowBox.hidden=true;document.body.prepend(snowBox);
let snowCtl=null,snowState=0; // 0 — не завантажено, 1 — завантажується, 2 — готово, 3 — недоступно
function snowSync(){
 const on=!!WINTER&&snowState!==3&&document.body.classList.contains('home')&&document.documentElement.dataset.theme==='dark'&&!!window.WebGL2RenderingContext;
 snowBox.hidden=!on;
 if(!on)return;
 if(snowState===2){snowCtl.wake();return}
 if(snowState===1)return;
 snowState=1;
 const s=document.createElement('script');s.src='snow.js';s.async=true;
 s.onload=()=>{try{snowCtl=window.PixelSnow&&PixelSnow.mount(snowBox,{color:'#e6ecff',density:.35,opacity:.75,dpr:document.documentElement.classList.contains('lite')?1:0})}catch(e){snowCtl=null}
  snowState=snowCtl?2:3;if(!snowCtl)snowBox.remove();else snowSync()};
 s.onerror=()=>{snowState=3;snowBox.remove()};
 document.head.appendChild(s);
}
function setTheme(t,manual){document.documentElement.dataset.theme=t;$('#theme').innerHTML='<button type="button" data-t="light" aria-pressed="'+(t==='light')+'">'+ICON.sun+'Світла</button><button type="button" data-t="dark" aria-pressed="'+(t==='dark')+'">'+ICON.moon+'Темна</button>';if(manual)store.set('themeC',t);snowSync()}
$('#theme').onclick=e=>{const b=e.target.closest('button');if(b&&b.dataset.t!==document.documentElement.dataset.theme)setTheme(b.dataset.t,true)};
// Темна тема — за замовчуванням; світла лише якщо учень сам її обрав (themeC).
setTheme(store.get('themeC','dark')==='light'?'light':'dark');
const numIn=i=>COURSE.zero?i:i+1;   // zero: курс починається з уроку 0 «Знайомство»

/* ---------- підсвітка Python ---------- */
const E=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const Wp=(c,s)=>'<span class="'+c+'">'+E(s)+'</span>';
const PK=/^(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|match|case)$/;
const PB=/^(?:print|input|int|float|str|bool|list|dict|set|tuple|range|len|sum|min|max|sorted|reversed|abs|round|enumerate|zip|map|filter|open|type|isinstance|ord|chr|any|all|super|self|divmod|pow|hex|bin)$/;
function hlPy(s){
 return s.replace(/(#[^\n]*)|([rRbBfFuU]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?))|(@[\w.]+)|(\b\d+\.?\d*(?:e[+-]?\d+)?\b)|([A-Za-z_Ѐ-ӿ][\wЀ-ӿ]*)|([\s\S])/g,
 (m,c,st,dec,n,w,o,off,str)=>{
  if(c)return Wp('c',m);if(st)return Wp('s',m);if(dec)return Wp('d',m);if(n)return Wp('n',m);
  if(w){
   if(PK.test(m))return Wp('k',m);
   const prev=str.slice(Math.max(0,off-6),off);
   if(/(?:def|class)\s+$/.test(prev))return Wp('f',m);
   if(PB.test(m))return Wp('b',m);
   if(/^\s*\(/.test(str.slice(off+m.length,off+m.length+3)))return Wp('f',m);
   return E(m);
  }
  return E(m);
 });
}

/* ---------- файли уроку ---------- */
const L=()=>LESSONS[cur];
const codeKey=i=>'code:'+i;
function starterFiles(i){
 const l=LESSONS[i];
 if(l.from!==undefined){const p=store.get(codeKey(l.from),null);if(p&&p.length&&p[0][1].trim())return JSON.parse(JSON.stringify(p))}
 return l.files?JSON.parse(JSON.stringify(l.files)):[[l.pgz?'game.py':'main.py',l.c||'']];
}
function getFiles(i){const v=store.get(codeKey(i),null);return (v&&v.length)?v:starterFiles(i)}
let files=[];
let shared=null;
function saveFiles(){if(shared)return;store.set(codeKey(cur),files)}
function curCode(){return files[file]?files[file][1]:''}

/* ---------- редактор ---------- */
let errLine=0;
let gutKey='';
function updateGutter(){
 let n=1;for(let i=ta.value.indexOf('\n');i>=0;i=ta.value.indexOf('\n',i+1))n++;
 if(gutKey!==n+':'+errLine){gutKey=n+':'+errLine;let s='';
  for(let i=1;i<=n;i++)s+=(i===errLine?'<span class="er">'+i+'</span>':i)+'\n';
  gut.innerHTML=s}
 sync();
 hl.innerHTML=hlPy(ta.value)+'\n';
}
function sync(){gut.scrollTop=ta.scrollTop;hl.scrollTop=ta.scrollTop;hl.scrollLeft=ta.scrollLeft;
 if(errLine){eband.style.display='block';eband.style.top=(10+(errLine-1)*21-ta.scrollTop)+'px'}else eband.style.display='none'}
function setErr(line){errLine=line||0;updateGutter()}
function renderTabs(){
 const l=L(),multi=l.multi||files.length>1;
 let h='';
 files.forEach((f,i)=>{h+='<button class="tab" role="tab" data-f="'+i+'" aria-selected="'+(i===file)+'">'+esc(f[0])+(multi&&i>0&&l.multi?'<span class="x" data-del="'+i+'" aria-label="Видалити файл" title="Видалити файл"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></span>':'')+'</button>'});
 if(l.multi)h+='<button class="tab" id="addf" aria-label="Новий файл" title="Новий файл">+</button>';
 $('#ftabs').innerHTML=multi?h:'';
}
function loadEditor(){
 try{AC.hide()}catch(e){}
 ta.value=curCode();errLine=0;updateGutter();ta.scrollTop=0;renderTabs();
 ta.setAttribute('aria-label','Код '+(files[file]?files[file][0]:''));
}
ta.addEventListener('scroll',sync);
let saveT=0;
ta.addEventListener('input',()=>{clearTimeout(chkT);chkT=setTimeout(()=>evalChecks(true),500);if(files[file])files[file][1]=ta.value;clearTimeout(saveT);saveT=setTimeout(saveFiles,300);errLine=0;updateGutter()});
addEventListener('pagehide',()=>{if(saveT){clearTimeout(saveT);saveFiles()}});
ta.addEventListener('keydown',e=>{
 if(AC.key(e))return;
 const s=ta.selectionStart,en=ta.selectionEnd,v=ta.value;
 if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runCode();return}
 if(ta.readOnly)return;
 if(e.key==='Tab'){
  e.preventDefault();
  const ls=v.lastIndexOf('\n',s-1)+1;
  if(s!==en&&v.slice(s,en).includes('\n')||e.shiftKey){
   const le=v.indexOf('\n',en-(en>s&&v[en-1]==='\n'?1:0));const end=le<0?v.length:le;
   const block=v.slice(ls,end);
   const nb=e.shiftKey?block.replace(/^( {1,4}|\t)/gm,''):block.replace(/^/gm,'    ');
   ta.setSelectionRange(ls,end);ins(nb);ta.setSelectionRange(ls,ls+nb.length);
  }else ins('    ');
 }
 else if(e.key==='Enter'&&!e.isComposing){
  e.preventDefault();
  const ls=v.lastIndexOf('\n',s-1)+1,line=v.slice(ls,s);
  let ind=line.match(/^\s*/)[0];
  if(/:\s*(#.*)?$/.test(line))ind+='    ';
  else if(/^\s*(return|break|continue|pass)\b/.test(line))ind=ind.slice(0,Math.max(0,ind.length-4));
  ins('\n'+ind);
 }
 else if(e.key==='Backspace'&&s===en&&s>0){
  const ls=v.lastIndexOf('\n',s-1)+1,before=v.slice(ls,s);
  if(before.length&&/^ +$/.test(before)&&before.length%4===0){e.preventDefault();ta.setSelectionRange(s-4,s);ins('')}
 }
 else if((e.ctrlKey||e.metaKey)&&e.key==='/'){
  e.preventDefault();
  const ls=v.lastIndexOf('\n',s-1)+1,le=v.indexOf('\n',en);const end=le<0?v.length:le;
  const block=v.slice(ls,end),lines=block.split('\n');
  const all=lines.every(x=>!x.trim()||/^\s*#/.test(x));
  const nb=lines.map(x=>!x.trim()?x:all?x.replace(/^(\s*)# ?/,'$1'):x.replace(/^(\s*)/,'$1# ')).join('\n');
  ta.setSelectionRange(ls,end);ins(nb);ta.setSelectionRange(ls,ls+nb.length);
 }
});
function ins(t){ta.focus();if(!document.execCommand||!document.execCommand('insertText',false,t)){ta.setRangeText(t,ta.selectionStart,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input'))}}
/* ---------- Підказки в редакторі ---------- */
const AC=(()=>{
 // назва: 'параметри через | ; опис'. Параметр з … повторюється, з = — іменований.
 const P=o=>{const r={};for(const k in o){const [p,d]=o[k].split(' ; ');r[k]={p:p?p.split('|'):[],d:d||''}}return r};
 const PROP=o=>{const r={};for(const k in o)r[k]={prop:1,d:o[k]};return r};
 const KW='False None True and as break continue def elif else for from global if import in is not or pass return while lambda try except finally with del'.split(' ');
 const B=P({
  print:'значення…|sep=" "|end="\\n" ; виводить значення в консоль',
  input:'підказка ; чекає введення, завжди повертає рядок',
  int:'значення ; перетворює на ціле число',float:'значення ; перетворює на дробове число',
  str:'значення ; перетворює на рядок',bool:'значення ; True або False',
  len:'послідовність ; кількість елементів або символів',
  range:'start|stop|step ; range(5) → 0…4, range(1, 6) → 1…5',
  abs:'x ; модуль числа',round:'число|знаків ; округлення',
  max:'значення… ; найбільше',min:'значення… ; найменше',sum:'список ; сума елементів',
  sorted:'список|reverse=False ; новий відсортований список',type:'значення ; тип значення',
  list:'послідовність ; створює список',dict:' ; створює словник',
  enumerate:'список ; пари (номер, елемент)',ord:'символ ; код символу',chr:'код ; символ за кодом',
  isinstance:'значення|тип ; чи має значення цей тип'
 });
 const MOD={
  random:P({randint:'a|b ; випадкове ціле від a до b',random:' ; випадкове число від 0 до 1',choice:'список ; випадковий елемент',shuffle:'список ; перемішує список',randrange:'start|stop|step ; випадкове з range',uniform:'a|b ; випадкове дробове від a до b'}),
  time:P({sleep:'секунди ; пауза',time:' ; поточний час у секундах'}),
  math:Object.assign(P({sqrt:'x ; квадратний корінь',floor:'x ; округлення вниз',ceil:'x ; округлення вгору',pow:'x|y ; x у степені y'}),PROP({pi:'число π'})),
  tkinter:P({
   Tk:' ; головне вікно',
   Label:'вікно|text=|font=|fg=|bg=|width=|height= ; напис',
   Button:'вікно|text=|command=|font=|fg=|bg=|width=|height= ; кнопка; command — функція без дужок',
   Entry:'вікно|width=|font=|justify= ; поле для одного рядка',
   Canvas:'вікно|width=|height=|bg= ; полотно для малювання',
   Frame:'вікно|bg=|padx=|pady= ; рамка для групи віджетів',
   Text:'вікно|width=|height=|font= ; багаторядкове поле',
   Radiobutton:'вікно|text=|variable=|value=|command= ; перемикач',
   Checkbutton:'вікно|text=|variable=|command= ; прапорець',
   StringVar:'value= ; змінна-рядок для віджетів',IntVar:'value= ; змінна-число для віджетів',BooleanVar:'value= ; змінна True/False для віджетів',
   PhotoImage:'file= ; картинка з файлу'
  }),
  font:P({Font:'family=|size=|weight=|slant=|underline=|overstrike= ; об\'єкт шрифту'}),
  messagebox:P({showinfo:'заголовок|повідомлення ; вікно з повідомленням',showwarning:'заголовок|повідомлення ; попередження',showerror:'заголовок|повідомлення ; помилка',askyesno:'заголовок|питання ; так → True, ні → False'}),
  turtle:P({
   Turtle:' ; нова черепашка',Screen:' ; вікно черепашки',done:' ; залишити вікно відкритим',mainloop:' ; залишити вікно відкритим',
   bgcolor:'колір ; колір фону',onkey:'функція|клавіша ; реакція на клавішу',listen:' ; слухати клавіатуру',
   onscreenclick:'функція ; реакція на клік (x, y)',ontimer:'функція|мс ; виклик через час',exitonclick:' ; закрити кліком',
   tracer:'n ; 0 — малювати миттєво',update:' ; перемалювати'
  })
 };
 const WID=P({config:'параметр=значення… ; змінити властивості',configure:'параметр=значення… ; змінити властивості',
  place:'relx=|rely=|anchor=|x=|y= ; розмістити: relx, rely — від 0 до 1',pack:'side=|padx=|pady=|fill=|expand= ; розмістити один за одним',
  grid:'row=|column=|padx=|pady=|columnspan=|sticky= ; розмістити в таблиці',bind:'подія|функція ; "<Enter>", "<Button-1>", "<Key>"…',
  cget:'параметр ; поточне значення властивості',place_forget:' ; сховати',pack_forget:' ; сховати',grid_forget:' ; сховати',
  destroy:' ; видалити',after:'мс|функція ; виклик функції через час'});
 const T={
  tk:Object.assign(P({title:'текст ; заголовок вікна',geometry:'"ШxВ+x+y" ; розмір і положення: "400x300"',mainloop:' ; запустити вікно (останній рядок)',
   configure:'bg= ; колір фону вікна',config:'bg= ; колір фону вікна',resizable:'ширина|висота ; чи можна змінювати розмір',update:' ; перемалювати вікно',
   after:'мс|функція ; виклик функції через час',bind:'подія|функція ; реакція на подію',bind_all:'подія|функція ; подія для всього вікна',destroy:' ; закрити вікно'})),
  widget:WID,
  entry:Object.assign({},WID,P({get:' ; текст із поля (рядок)',delete:'початок|кінець ; delete(0, "end") — очистити',insert:'позиція|текст ; вставити текст',focus:' ; поставити курсор у поле'})),
  canvas:Object.assign({},WID,P({
   create_oval:'x1|y1|x2|y2|fill=|outline=|width= ; овал у прямокутнику (x1, y1)–(x2, y2)',
   create_rectangle:'x1|y1|x2|y2|fill=|outline=|width= ; прямокутник',
   create_line:'x1|y1|x2|y2…|fill=|width=|smooth= ; лінія через точки',
   create_polygon:'x1|y1|x2|y2|x3|y3…|fill=|outline=|smooth= ; многокутник',
   create_text:'x|y|text=|font=|fill=|anchor= ; текст',create_image:'x|y|image=|anchor= ; картинка',
   create_arc:'x1|y1|x2|y2|start=|extent=|fill= ; дуга або сектор',
   move:'фігура|dx|dy ; зсунути: dx праворуч, dy вниз',coords:'фігура|x1|y1… ; координати фігури',
   itemconfig:'фігура|fill=|state=|text= ; змінити фігуру; state="hidden" — сховати',
   delete:'фігура ; видалити фігуру',bind_all:'подія|функція ; "<Key>", "<Up>", "<Button-1>"…'})),
  vars:P({get:' ; значення змінної',set:'значення ; записати значення'}),
  event:PROP({widget:'віджет, з яким сталася подія',keysym:'назва клавіші: "Up", "space", "a"',char:'введений символ',x:'x курсора',y:'y курсора',num:'номер кнопки миші'}),
  turtle:P({forward:'відстань ; вперед',fd:'відстань ; вперед',backward:'відстань ; назад',back:'відстань ; назад',left:'кут ; поворот ліворуч',lt:'кут ; ліворуч',
   right:'кут ; поворот праворуч',rt:'кут ; праворуч',goto:'x|y ; перейти в точку',penup:' ; підняти перо',pendown:' ; опустити перо',up:' ; підняти перо',down:' ; опустити перо',
   color:'колір_лінії|колір_заливки ; кольори',pencolor:'колір ; колір лінії',fillcolor:'колір ; колір заливки',begin_fill:' ; почати заливку',end_fill:' ; завершити заливку',
   circle:'радіус|extent= ; коло або дуга',dot:'розмір|колір ; крапка',pensize:'товщина ; товщина лінії',width:'товщина ; товщина лінії',speed:'0–10 ; швидкість (0 — найшвидше)',
   shape:'"turtle" ; форма: turtle, circle, arrow…',hideturtle:' ; сховати черепашку',showturtle:' ; показати черепашку',setheading:'кут ; напрямок: 0 — праворуч, 90 — вгору',
   write:'текст|font= ; написати текст',stamp:' ; відбиток',home:' ; у центр',clear:' ; стерти малюнок',xcor:' ; координата x',ycor:' ; координата y',
   onclick:'функція ; клік по черепашці',ondrag:'функція ; перетягування'}),
  str:P({upper:' ; ВЕЛИКІ ЛІТЕРИ',lower:' ; малі літери',strip:' ; прибрати пробіли з країв',split:'роздільник=" " ; розбити на список',
   replace:'старе|нове ; замінити',find:'підрядок ; позиція або -1',count:'підрядок ; скільки разів',startswith:'початок ; чи починається',endswith:'кінець ; чи закінчується',
   join:'список ; з\'єднати список у рядок',isdigit:' ; лише цифри?',isalpha:' ; лише літери?',capitalize:' ; Перша велика',title:' ; Кожне Слово З Великої'}),
  list:P({append:'елемент ; додати в кінець',insert:'позиція|елемент ; вставити',remove:'елемент ; видалити перше входження',pop:'позиція=-1 ; забрати й повернути',
   sort:'reverse=False ; відсортувати',reverse:' ; у зворотному порядку',index:'елемент ; позиція елемента',count:'елемент ; скільки разів',clear:' ; очистити',copy:' ; копія',extend:'список ; додати всі елементи'}),
  dict:P({keys:' ; ключі',values:' ; значення',items:' ; пари (ключ, значення)',get:'ключ|за_замовчуванням ; значення або запасне',pop:'ключ ; забрати й повернути',update:'словник ; додати пари',clear:' ; очистити'})
 };
 T.screen=Object.assign({},MOD.turtle,P({setup:'ширина|висота ; розмір вікна',title:'текст ; заголовок вікна'}));
 delete T.screen.Turtle;delete T.screen.Screen;
 Object.assign(MOD.tkinter,{messagebox:{prop:1,d:'модуль повідомлень'},font:{prop:1,d:'модуль шрифтів'}});
 const TURTLE_FN=Object.assign({},T.turtle,MOD.turtle);   // from turtle import * / turtle.forward()
 MOD.turtle=TURTLE_FN;
 const CLS={Tk:'tk',Toplevel:'tk',Label:'widget',Button:'widget',Frame:'widget',Radiobutton:'widget',Checkbutton:'widget',Entry:'entry',Text:'entry',Canvas:'canvas',
  StringVar:'vars',IntVar:'vars',BooleanVar:'vars',DoubleVar:'vars',Turtle:'turtle',Screen:'screen',input:'str',str:'str',list:'list',sorted:'list',dict:'dict'};
 const MODNAMES=['random','time','math','tkinter','turtle'];

 /* ---- аналіз коду учня ---- */
 function scan(code){
  const g={},alias={},types={},defs={};
  Object.keys(B).forEach(k=>g[k]=B[k]);
  for(const m of code.matchAll(/^[ \t]*import[ \t]+([\w.]+)(?:[ \t]+as[ \t]+(\w+))?/gm)){const n=m[1].replace(/^tkinter\./,'');if(MOD[n])alias[m[2]||m[1].split('.').pop()]=n}
  for(const m of code.matchAll(/^[ \t]*from[ \t]+([\w.]+)[ \t]+import[ \t]+([^\n#]+)/gm)){
   const n=m[1].replace(/^tkinter\./,''),M=MOD[n];if(!M)continue;
   if(m[2].trim()==='*')Object.assign(g,M);
   else m[2].replace(/[()]/g,'').split(',').forEach(x=>{const [a,b]=x.trim().split(/\s+as\s+/);if(!a)return;if(MOD[a]&&M[a]&&M[a].prop)alias[b||a]=a;else if(M[a])g[b||a]=M[a]})
  }
  for(const m of code.matchAll(/^[ \t]*def[ \t]+(\w+)[ \t]*\(([^)]*)\)/gm)){
   const ps=m[2].split(',').map(s=>s.trim()).filter(Boolean);defs[m[1]]={p:ps,d:'твоя функція',own:1};
   ps.forEach(p=>{const n=p.split('=')[0].trim();if(/^(event|e|ev|evt)$/.test(n))types[n]='event'});
  }
  for(const m of code.matchAll(/^[ \t]*(\w+)[ \t]*=(?!=)[ \t]*(?:(\w+)\.)?(\w+)?[ \t]*([(\["'{]|f["']|\d)?/gm)){
   const [,v,,c,ch]=m;
   if(c&&ch==='('&&CLS[c])types[v]=CLS[c];
   else if(!c&&ch&&/^["'f]/.test(ch))types[v]='str';
   else if(!c&&ch==='[')types[v]='list';
   else if(!c&&ch==='{')types[v]='dict';
  }
  const vars=new Set();
  for(const m of code.matchAll(/^[ \t]*(\w+)[ \t]*(?:=(?!=)|\+=|-=)/gm))vars.add(m[1]);
  for(const m of code.matchAll(/\bfor[ \t]+(\w+)(?:[ \t]*,[ \t]*(\w+))?[ \t]+in\b/g)){vars.add(m[1]);if(m[2])vars.add(m[2])}
  for(const m of code.matchAll(/\b(?:global|def\s+\w+\s*\()([^):\n]*)/g))m[1].split(',').forEach(x=>{const n=x.split('=')[0].trim();if(/^\w+$/.test(n))vars.add(n)});
  return {g,alias,types,defs,vars};
 }
 function members(obj,S){
  if(S.alias[obj])return MOD[S.alias[obj]];
  if(S.types[obj])return T[S.types[obj]];
  if(MOD[obj]&&S.g[obj])return MOD[obj];
  return null;
 }
 function lookup(callee,S){
  const i=callee.lastIndexOf('.');
  if(i<0)return S.defs[callee]||S.g[callee]||null;
  const obj=callee.slice(0,i).split('.').pop(),name=callee.slice(i+1),M=members(obj,S);
  if(M)return M[name]||null;
  for(const k of ['canvas','entry','tk','turtle','str','list','dict'])if(T[k][name]&&!T[k][name].prop)return T[k][name];
  return null;
 }

 /* ---- стан тексту до курсора: рядок/коментар, відкриті дужки ---- */
 function ctx(text){
  const st=[];let q=null,i=0,com=false;
  for(;i<text.length;i++){
   const c=text[i];
   if(com){if(c==='\n')com=false;continue}
   if(q){if(c==='\\'){i++;continue}if(text.startsWith(q,i)){i+=q.length-1;q=null}else if(c==='\n'&&q.length===1)q=null;continue}
   if(c==='#'){com=true;continue}
   if(c==='"'||c==="'"){q=text.startsWith(c.repeat(3),i)?c.repeat(3):c;if(q.length===3)i+=2;continue}
   if(c==='('||c==='['||c==='{'){const m=c==='('&&/([A-Za-z_][\w.]*)\s*$/.exec(text.slice(Math.max(0,i-60),i));st.push({c,callee:m?m[1]:'',arg:0,start:i+1});continue}
   if(c===')'||c===']'||c==='}'){st.pop();continue}
   if(c===','&&st.length){const t=st[st.length-1];t.arg++;t.start=i+1}
  }
  let f=null;for(let k=st.length-1;k>=0;k--)if(st[k].c==='('){f=st[k];break}
  return {inStr:!!q,inCom:com,frame:f};
 }

 /* ---- інтерфейс ---- */
 let on=true;try{on=localStorage.getItem('lpy:ac')!=='0'}catch(e){}
 const box=document.createElement('div');box.className='acl';box.hidden=true;box.setAttribute('role','listbox');
 const tip=document.createElement('div');tip.className='act';tip.hidden=true;
 document.body.append(box,tip);
 let items=[],sel=0,moved=false,rng=null,cw=0;
 const charW=()=>{if(cw)return cw;const c=document.createElement('canvas').getContext('2d');c.font=getComputedStyle(ta).font;cw=c.measureText('M'.repeat(20)).width/20||8.4;return cw};
 function caretXY(){
  const s=ta.selectionStart,v=ta.value,ls=v.lastIndexOf('\n',s-1)+1,line=(v.slice(0,s).match(/\n/g)||[]).length,r=ta.getBoundingClientRect();
  const cs=getComputedStyle(ta),lh=parseFloat(cs.lineHeight)||21;
  return {x:r.left+parseFloat(cs.paddingLeft)+(s-ls)*charW()-ta.scrollLeft,y:r.top+parseFloat(cs.paddingTop)+line*lh-ta.scrollTop,lh,r};
 }
 function place(el,below){
  const c=caretXY();if(c.y<c.r.top-c.lh||c.y>c.r.bottom){el.hidden=true;return}
  el.style.left='0px';el.style.top='0px';
  const w=el.offsetWidth,h=el.offsetHeight,vw=document.documentElement.clientWidth;
  let x=Math.max(8,Math.min(c.x-4,vw-w-8)),y=below?c.y+c.lh+2:c.y-h-4;
  if(!below&&y<4)y=c.y+c.lh+2+(box.hidden?0:box.offsetHeight+4);
  if(below&&y+h>innerHeight-4)y=c.y-h-4-(tip.hidden?0:tip.offsetHeight+4);
  el.style.left=x+'px';el.style.top=y+'px';
 }
 const hideList=()=>{box.hidden=true;items=[]};
 const hide=()=>{hideList();tip.hidden=true};
 function sigHTML(s,name,fr,cur){
  const ps=s.p;let a=fr.arg;
  const kw=/^\s*(\w+)\s*=(?!=)/.exec(cur);let act=-1;
  if(kw)act=ps.findIndex(p=>p.split('=')[0].replace('…','')===kw[1]);
  else{const pos=ps.filter(p=>!p.endsWith('=')&&!/^\w+=/.test(p));
   if(!pos.length)act=a<ps.length?a:-1;else if(a<pos.length)act=ps.indexOf(pos[a]);else{const r=pos.findIndex(p=>p.endsWith('…'));if(r>=0)act=ps.indexOf(pos[r])}}
  return '<code>'+esc(name)+'(<span>'+ps.map((p,i)=>i===act?'<b>'+esc(p)+'</b>':esc(p)).join(', ')+'</span>)</code>'+(s.d?'<small>'+esc(s.d)+'</small>':'');
 }
 function updateTip(S){
  const s=ta.selectionStart;if(s!==ta.selectionEnd){tip.hidden=true;return}
  const before=ta.value.slice(Math.max(0,s-3000),s),c=ctx(before);
  const fr=c.frame;if(!fr||!fr.callee){tip.hidden=true;return}
  const sg=lookup(fr.callee,S||scan(ta.value));if(!sg||sg.prop){tip.hidden=true;return}
  tip.innerHTML=sigHTML(sg,fr.callee.split('.').pop(),fr,before.slice(fr.start));
  tip.hidden=false;place(tip,false);
 }
 function updateList(S){
  const s=ta.selectionStart,v=ta.value;if(s!==ta.selectionEnd){hideList();return}
  const ls=v.lastIndexOf('\n',s-1)+1,line=v.slice(ls,s),c=ctx(v.slice(Math.max(0,s-3000),s));
  if(c.inStr||c.inCom||/^\s*(def|class)\s+\w*$/.test(line)||/\d\w*$/.test(line)&&!/[A-Za-z_]\w*$/.test(line)){hideList();return}
  let m,pref,cand=[];
  if((m=/^\s*(import|from)\s+(\w*)$/.exec(line))){pref=m[2];cand=MODNAMES.map(n=>[n,{prop:1,d:'модуль'}])}
  else if((m=/^\s*from\s+([\w.]+)\s+import\s+(?:.*,\s*)?(\w*)$/.exec(line))){const M=MOD[m[1].replace(/^tkinter\./,'')];if(!M){hideList();return}pref=m[2];cand=Object.entries(M)}
  else if((m=/([A-Za-z_]\w*)\.(\w*)$/.exec(line))){
   pref=m[2];const M=members(m[1],S);
   if(M)cand=Object.entries(M);
   else if(pref.length){const seen={};for(const k of ['widget','entry','canvas','tk','str','list','dict','turtle'])for(const [n,x] of Object.entries(T[k]))if(!seen[n])seen[n]=x;cand=Object.entries(seen)}
  }
  else if((m=/(?:^|[^\w.])([A-Za-z_]\w*)$/.exec(line))){
   pref=m[1];if(pref.length<2&&!c.frame){hideList();return}
   const seen=new Map();
   Object.entries(S.defs).forEach(([n,x])=>seen.set(n,x));
   S.vars.forEach(n=>{if(!seen.has(n))seen.set(n,{prop:1,d:'змінна'})});
   Object.keys(S.alias).forEach(n=>{if(!seen.has(n))seen.set(n,{prop:1,d:'модуль'})});
   Object.entries(S.g).forEach(([n,x])=>{if(!seen.has(n))seen.set(n,x)});
   KW.forEach(n=>{if(!seen.has(n))seen.set(n,{kw:1,d:''})});
   cand=[...seen];
   const fr=c.frame,sg=fr&&fr.callee&&lookup(fr.callee,S);
   if(sg&&sg.p)sg.p.filter(x=>/^\w+=$/.test(x)).forEach(x=>cand.unshift([x,{prop:1,arg:1,d:'параметр'}]));
   if(pref.length<2)cand=cand.filter(x=>x[1].arg);
  }else{hideList();return}
  const low=pref.toLowerCase();
  items=cand.filter(([n])=>n.toLowerCase().startsWith(low)&&n!==pref).sort((a,b)=>(b[1].arg?2:b[1].own?1:0)-(a[1].arg?2:a[1].own?1:0)||a[0].length-b[0].length||a[0].localeCompare(b[0])).slice(0,30);
  if(!items.length){hideList();return}
  rng=[s-pref.length,s];sel=0;moved=false;render();
 }
 function render(){
  box.innerHTML=items.map(([n,x],i)=>'<div class="aci'+(i===sel?' on':'')+'" data-i="'+i+'" role="option"><code>'+esc(n)+'</code>'+(x.p?'<span>('+esc(x.p.join(', '))+')</span>':'')+'</div>').join('');
  box.hidden=false;place(box,true);
  const a=box.children[sel];if(a)a.scrollIntoView({block:'nearest'});
 }
 let busy=false;
 function accept(i){
  const [n,x]=items[i];hideList();
  busy=true;ta.setSelectionRange(rng[0],rng[1]);
  const call=x.p&&!x.prop&&!x.kw&&ta.value[rng[1]]!=='(';
  ins(call?n+'()':n);if(call)ta.setSelectionRange(ta.selectionStart-1,ta.selectionStart-1);
  busy=false;refresh(false);
 }
 function refresh(list){
  if(!on||ta.readOnly){hide();return}
  const S=scan(ta.value);
  if(list)updateList(S);else if(!box.hidden)updateList(S);
  updateTip(S);
 }
 ta.addEventListener('input',e=>{if(busy)return;const d=e.data;refresh(e.inputType==='insertText'&&d&&/[\w.]$/.test(d)||e.inputType==='deleteContentBackward'&&!box.hidden)});
 ta.addEventListener('click',()=>{hideList();refresh(false)});
 ta.addEventListener('keyup',e=>{if(/^(Arrow(Left|Right)|Home|End)$/.test(e.key)){hideList();refresh(false)}});
 ta.addEventListener('blur',()=>setTimeout(()=>{if(document.activeElement!==ta)hide()},150));
 ta.addEventListener('scroll',()=>{if(!box.hidden)place(box,true);if(!tip.hidden)place(tip,false)});
 addEventListener('resize',hide);
 box.addEventListener('pointerdown',e=>{e.preventDefault();const r=e.target.closest('.aci');if(r)accept(+r.dataset.i)});
 return {
  key(e){
   if(!on)return false;
   if(!box.hidden&&items.length){
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();sel=(sel+(e.key==='ArrowDown'?1:items.length-1))%items.length;moved=true;render();return true}
    if(e.key==='Tab'&&!e.shiftKey||e.key==='Enter'&&moved){e.preventDefault();accept(sel);return true}
    if(e.key==='Escape'){e.preventDefault();hideList();return true}
    if(e.key==='Enter')hideList();
   }
   if(e.key==='Escape'&&!tip.hidden){e.preventDefault();tip.hidden=true;return true}
   return false;
  },
  hide,
  get on(){return on},
  set on(v){on=v;try{localStorage.setItem('lpy:ac',v?'1':'0')}catch(e){}if(!v)hide()}
 };
})();
$('#ftabs').onclick=e=>{
 const d=e.target.closest('[data-del]');
 if(d){e.stopPropagation();const i=+d.dataset.del;if(!confirm('Видалити файл '+files[i][0]+'?'))return;files.splice(i,1);file=0;saveFiles();loadEditor();return}
 if(e.target.closest('#addf')){
  let n=prompt('Назва нового файлу (модуля):','mymodule.py');if(!n)return;n=n.trim();
  if(!/\.py$/.test(n))n+='.py';
  if(!/^[A-Za-z_][A-Za-z0-9_]*\.py$/.test(n)){toast('Назва: латинські літери, цифри, _');return}
  if(files.some(f=>f[0]===n)){toast('Такий файл уже є');return}
  files.push([n,'']);file=files.length-1;saveFiles();loadEditor();ta.focus();return}
 const b=e.target.closest('.tab');if(b&&b.dataset.f!==undefined){file=+b.dataset.f;loadEditor()}
};
function copyText(t){
 return (navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(t):Promise.reject()).catch(()=>{
  const x=document.createElement('textarea');x.value=t;x.style.cssText='position:fixed;opacity:0';document.body.append(x);x.select();
  const ok=document.execCommand('copy');x.remove();if(!ok)throw new Error('copy');
 });
}
$('#copy').onclick=()=>copyText(ta.value).then(()=>toast('Код скопійовано'),()=>toast('Не вдалося скопіювати'));
/* завантаження поточного файлу як .py: 8-urok-1.py (або 8-urok-1-game.py, якщо файлів кілька) */
$('#dl').onclick=()=>{
 const f=files[file]?files[file][0]:'main.py';
 const base=COURSE.g+'-'+LH(cur).slice(1);
 let name=base+'.py';
 if(files.length>1)name=base+'-'+f.replace(/\.py$/i,'')+'.py';
 const u=URL.createObjectURL(new Blob([ta.value],{type:'text/x-python;charset=utf-8'})),a=document.createElement('a');
 a.href=u;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(u),4000);toast('Файл збережено');
};
$('#reset').onclick=()=>{if(!confirm('Повернути початковий код уроку? Твої зміни буде втрачено.'))return;store.del(codeKey(cur));files=starterFiles(cur);file=0;loadEditor();toast('Код скинуто')};
/* ---------- консоль ---------- */
const con=$('#con');
const CON={
 last:null,lastKind:null,shown:false,pending:null,
 write(s,kind){
  kind=kind||'out';
  if(this.last&&this.lastKind===kind&&this.last.parentNode===con&&con.lastChild===this.last){this.last.textContent+=s}
  else{const sp=document.createElement('span');sp.className=kind;sp.textContent=s;con.append(sp);this.last=sp;this.lastKind=kind}
  this.scroll();
 },
 scroll(){const o=$('#out');o.scrollTop=o.scrollHeight},
 clear(){con.textContent='';this.last=null;if(this.pending){this.pending('');this.pending=null}},
 block(node){con.append(node);this.last=null;this.scroll()},
 ask(p){
  return new Promise(res=>{
   if(p)this.write(p,'out');this.shown=true;
   const inp=document.createElement('input');inp.setAttribute('aria-label','Введення даних');inp.autocomplete='off';inp.spellcheck=false;
   con.append(inp);this.last=null;this.scroll();
   inp.focus({preventScroll:true});
   const fin=v=>{inp.remove();this.pending=null;res(v)};
   this.pending=fin;
   inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();fin(inp.value)}});
  });
 },
 sys(html){const d=document.createElement('div');d.className='sys';d.innerHTML=html;this.block(d);return d}
};
$('#clr').onclick=()=>{CON.clear();if(!R.running){TK.reset();TT.reset()}};

/* ---------- міст для Python ---------- */
const LP={
 disp:null,busy:false,queue:[],stop:false,inDisp:false,
 setDispatcher(f){this.disp=f},
 cmd(s){try{applyBatch(JSON.parse(s))}catch(e){console.error(e)}},
 out(s,k){CON.write(s,k)},
 echo(p,line){if(!CON.shown&&p)CON.write(p,'out');CON.shown=false;CON.write(line+'\n','in')},
 readLine(p){return CON.ask(p)},
 prompt(p){return window.prompt(p||'Введи дані:','')},
 confirm(s){return window.confirm(s)},
 alert(s){window.alert(s)},
 tick(){return new Promise(r=>setTimeout(r,0))},
 sleep(ms){return new Promise(r=>{const t=setTimeout(r,ms);R.sleepT=t;R.sleepR=r})},
 stopped(){return this.stop},
 take(){const q=this.queue;this.queue=[];return JSON.stringify(q)},
 error(s){showError(JSON.parse(s))},
 emit(ev){
  if(!this.disp)return;
  if(this.busy||this.inDisp){this.queue.push(ev);return}
  this.inDisp=true;
  try{this.disp(JSON.stringify(ev))}catch(e){console.error(e)}
  finally{this.inDisp=false}
  if(!this.busy&&this.queue.length){const q=this.queue;this.queue=[];q.forEach(x=>this.emit(x))}
  R.ui();
 }
};
window.LP=LP;
function applyBatch(arr){
 for(const c of arr){const f=OPS[c.op];if(f)try{f(c)}catch(e){console.error(c.op,e)}}
 TK.after();
}
function showError(o){
 const d=document.createElement('div');d.className='eb'+(o.stop?' st':'');
 const where=o.line?(o.file&&o.file!==(files[0]&&files[0][0])?o.file+', рядок '+o.line:'Рядок '+o.line)+': ':'';
 d.innerHTML='<b>'+esc(where+o.title)+'</b>'+(o.hint?'<span class="h">'+esc(o.hint)+'</span>':'')+(o.raw?'<code>'+esc(o.raw)+'</code>':'');
 if(o.line){
  const go=()=>{const fi=files.findIndex(f=>f[0]===o.file);if(fi>=0&&fi!==file){file=fi;loadEditor()}
   setErr(o.line);const ls=ta.value.split('\n');let p=0;for(let i=0;i<o.line-1&&i<ls.length;i++)p+=ls[i].length+1;
   ta.scrollTop=Math.max(0,(o.line-4)*21);sync();
   if(!matchMedia('(max-width:1100px)').matches){ta.focus({preventScroll:true});ta.setSelectionRange(p,p)}};
  d.onclick=go;
  const fi=files.findIndex(f=>f[0]===o.file);
  if(fi===file||(!o.file&&file===0)||(fi<0&&file===0))setErr(o.line);
 }
 CON.block(d);
}

/* ---------- Python (Pyodide) ---------- */
const PYO='https://cdn.jsdelivr.net/pyodide/v0.29.3/full/';
let pyP=null,py=null;
let lastAct=0;
['keydown','pointerdown','wheel','touchstart'].forEach(e=>addEventListener(e,()=>{lastAct=performance.now()},{passive:true,capture:true}));
function preloadPy(){
 if(py||pyP)return;
 const later=()=>setTimeout(attempt,1000),idle=window.requestIdleCallback||(f=>setTimeout(f,50));
 function attempt(){
  if(py||pyP)return;
  if(document.hidden||performance.now()-lastAct<1500)return later();
  idle(()=>{if(py||pyP)return;if(performance.now()-lastAct<1500)return later();loadPy().catch(()=>{})},{timeout:3000});
 }
 setTimeout(attempt,1200);
}
/* Модулі емулятора tkinter/turtle лежать у папці py/ і вантажаться разом із Python */
const PYMODS=['_lpbridge.py','_lp.py','turtle.py','tkinter/__init__.py','tkinter/constants.py','tkinter/messagebox.py','tkinter/simpledialog.py','tkinter/font.py','tkinter/filedialog.py','tkinter/colorchooser.py','tkinter/ttk.py'];
let modsP=null;
function loadPy(){
 if(pyP)return pyP;
 modsP=Promise.all(PYMODS.map(f=>fetch('py/'+f).then(r=>{if(!r.ok)throw new Error('net');return r.text()})));
 pyP=new Promise((res,rej)=>{
  if(window.loadPyodide)return res();
  const s=document.createElement('script');s.src=PYO+'pyodide.js';s.onload=()=>res();s.onerror=()=>rej(new Error('net'));document.head.append(s);
 }).then(()=>loadPyodide({indexURL:PYO,convertNullToNone:true,stdout:t=>CON.write(t+'\n'),stderr:t=>CON.write(t+'\n','err')}))
 .then(p=>{
  return modsP.then(mods=>{PYMODS.forEach((f,i)=>{
   const path='/home/pyodide/lpmods/'+f,dir=path.slice(0,path.lastIndexOf('/'));
   p.FS.mkdirTree(dir);p.FS.writeFile(path,mods[i]);
  });
  p.runPython("import sys\nsys.path.insert(0,'/home/pyodide/lpmods')\nfor _m in ('tkinter','turtle'):\n    sys.modules.pop(_m,None)\nimport _lpbridge, js\n_lpbridge.init(js.LP)\nimport tkinter, turtle, _lp\ndel _m");
  py=p;return p;
 });});
 pyP.catch(()=>{pyP=null;modsP=null});
 return pyP;
}

/* ---------- запуск ---------- */
const R={running:false,sleepT:0,sleepR:null,
 ui(){
  const alive=this.running||TK.alive()||TT.alive();
  $('#stop').hidden=!alive;
 }
};
async function runCode(src){
 if(L().pgz&&!src){toast('Цей код запускається в Thonny або VS Code');return}
 if(R.running){stopCode();await new Promise(r=>setTimeout(r,60))}
 const fl=src?[['main.py',src]]:files.map(f=>[f[0],f[1]]);
 CON.clear();TK.reset();TT.reset();setErr(0);LP.queue=[];LP.stop=false;
 R.running=true;R.ui();$('#run').disabled=true;
 if(matchMedia('(max-width:1100px)').matches&&!src)$('#p-out').scrollIntoView({block:'nearest',behavior:'smooth'});
 let wait=null;
 if(!py){wait=CON.sys('<span class="spin"></span>Завантаження Python…')}
 try{
  await loadPy();
  if(wait)wait.remove();
  LP.busy=true;
  py.globals.set('_lp_payload',JSON.stringify({files:fl,main:fl[0][0]}));
  $('#run').disabled=false;
  await py.runPythonAsync('import _lp\n_lp.run(_lp_payload)');
 }catch(e){
  if(wait)wait.remove();
  if(!py)CON.sys('Не вдалося завантажити Python. Перевір підключення до інтернету й спробуй ще раз.');
  else{console.error(e);CON.write(String(e&&e.message||e)+'\n','err')}
 }finally{
  LP.busy=false;R.running=false;$('#run').disabled=false;
  if(LP.stop){TK.close();TT.stopAnim();LP.stop=false;LP.queue=[]}
  const q=LP.queue;LP.queue=[];q.forEach(x=>LP.emit(x));
  TK.focusFirst();
  R.ui();
 }
}
function stopCode(){
 LP.stop=true;
 if(CON.pending){CON.pending('');}
 if(R.sleepR){clearTimeout(R.sleepT);R.sleepR();R.sleepR=null}
 if(!R.running){TK.close();TT.stopAnim();LP.stop=false}
 R.ui();
}
$('#run').onclick=()=>runCode();
$('#stop').onclick=stopCode;
/* ---------- рендер вікон tkinter ---------- */
const SVGNS='http://www.w3.org/2000/svg';
const winsEl=$('#wins');
const FEATHER='<svg viewBox="0 0 16 16"><path d="M13.5 2.5C9 2.5 5 5.5 4 10l-1.5 3.5L4 12.5c4.5-.5 8-4 9.5-10z" fill="#6f8ad6"/><path d="M4 12.5l5-5" stroke="#fff" stroke-width="1" fill="none"/></svg>';
const XI='<svg viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11"/></svg>';
const KS={ArrowLeft:'Left',ArrowRight:'Right',ArrowUp:'Up',ArrowDown:'Down',' ':'space',Enter:'Return',Escape:'Escape',Backspace:'BackSpace',Tab:'Tab',Delete:'Delete',Shift:'Shift_L',Control:'Control_L',Alt:'Alt_L',Home:'Home',End:'End',PageUp:'Prior',PageDown:'Next',Insert:'Insert',CapsLock:'Caps_Lock',
 '+':'plus','-':'minus','=':'equal',',':'comma','.':'period','/':'slash','\\':'backslash',';':'semicolon',"'":'apostrophe','[':'bracketleft',']':'bracketright','`':'grave','*':'asterisk','!':'exclam','?':'question','(':'parenleft',')':'parenright','_':'underscore',':':'colon','"':'quotedbl','<':'less','>':'greater','#':'numbersign','$':'dollar','%':'percent','&':'ampersand','@':'at','^':'asciicircum','{':'braceleft','}':'braceright','|':'bar','~':'asciitilde'};
function keyEv(e){
 let ks=KS[e.key];
 if(!ks){if(/^F\d+$/.test(e.key))ks=e.key;else if(e.key.length===1)ks=e.key;else ks=e.key}
 const mods=[];if(e.ctrlKey)mods.push('Control');if(e.shiftKey)mods.push('Shift');if(e.altKey)mods.push('Alt');if(e.metaKey)mods.push('Meta');
 return {keysym:ks,char:e.key.length===1?e.key:(e.key==='Enter'?'\r':e.key==='Backspace'?'\b':e.key==='Escape'?'\x1b':e.key==='Tab'?'\t':''),keycode:e.keyCode||0,mods};
}
const CUR={hand2:'pointer',hand1:'pointer',arrow:'default',cross:'crosshair',crosshair:'crosshair',watch:'wait',xterm:'text',fleur:'move',plus:'cell',circle:'pointer',heart:'pointer',question_arrow:'help',none:'none'};

const TK={
 W:new Map(),timers:new Map(),keyWins:0,
 node(id){return this.W.get(id)},
 alive(){for(const n of this.W.values())if(n.win&&!n.dead)return true;return this.timers.size>0},
 reset(){for(const h of this.timers.values())clearTimeout(h);this.timers.clear();this.W.clear();winsEl.textContent='';KP.update();this.dirty=new Set()},
 close(){
  const roots=[...this.W.values()].filter(n=>n.win);
  this.reset();
  if(roots.length)CON.sys('Вікно програми закрито.');
 },
 focusFirst(){
  const w=[...this.W.values()].find(n=>n.win&&n.listen.has('key'))||(TT.win&&TT.keys?null:null);
  if(w&&!matchMedia('(pointer:coarse)').matches)w.el.focus({preventScroll:true});
  else if(TT.win&&TT.keys&&!matchMedia('(pointer:coarse)').matches)TT.win.focus({preventScroll:true});
 },
 dirty:new Set(),
 mark(id){const n=this.node(id);if(n)this.dirty.add(n.win?n.id:id)},
 after(){
  if(!this.dirty.size)return;
  const d=[...this.dirty];this.dirty.clear();
  d.forEach(id=>{const n=this.node(id);if(n&&!n.dead)relayout(n)});
  fitAll();reportSizes();
 }
};

function anc(a){a=String(a||'center').toLowerCase();return a==='center'?'':a}
function el(tag,cls){const e=document.createElement(tag);if(cls)e.className=cls;return e}

/* --- вікно --- */
function newWin(c){
 const wrap=el('div','tkwrap'),w=el('div','tkw'),t=el('div','tkt'),b=el('div','tkb');
 w.tabIndex=0;w.setAttribute('role','application');
 t.innerHTML=FEATHER+'<span></span><button aria-label="Закрити вікно" title="Закрити">'+XI+'</button>';
 t.querySelector('span').textContent=c.title||'tk';
 t.querySelector('button').onclick=()=>LP.emit({ev:'close',id:c.id});
 w.append(t,b);wrap.append(w);winsEl.append(wrap);
 b.dataset.wid=c.id;
 const n={id:c.id,cls:'Tk',win:true,el:w,wrap,box:b,tt:t.querySelector('span'),kids:[],pack:[],o:{},listen:new Set(),gc:{c:{},r:{}},prop:true,geom:null};
 TK.W.set(c.id,n);
 hookWin(n);
 b.classList.add('empty');
 return n;
}

/* --- віджети --- */
function mkWidget(c){
 const id=c.id,cls=c.cls,n={id,cls,parent:c.p,kids:[],pack:[],o:{},mgr:null,mi:{},listen:new Set(),gc:{c:{},r:{}},prop:true};
 let e;
 switch(cls){
  case 'Frame':case 'TFrame':e=el('div','tk-fr');n.box=e;break;
  case 'LabelFrame':e=el('div','tk-lf');n.lt=el('span','tk-lft');n.box=el('div','tk-lfb');e.append(n.lt,n.box);break;
  case 'Label':case 'TLabel':case 'Message':e=el('div','tk-lb');n.tx=el('span');e.append(n.tx);break;
  case 'Button':case 'TButton':e=el('button','tk-bt');e.type='button';n.tx=el('span');e.append(n.tx);e.onclick=()=>LP.emit({ev:'cmd',id});break;
  case 'Entry':case 'TEntry':e=el('input','tk-en');e.type='text';e.autocomplete='off';e.spellcheck=false;
   e.oninput=()=>LP.emit({ev:'ui',id,v:e.value});break;
  case 'Spinbox':{e=el('span','tk-sp');const i=el('input');i.autocomplete='off';const s=el('span');s.innerHTML='<button type="button" tabindex="-1">▲</button><button type="button" tabindex="-1">▼</button>';e.append(i,s);n.inp=i;
   i.oninput=()=>LP.emit({ev:'ui',id,v:i.value});
   const step=d=>{const o=n.o;let v;
    if(o.values&&o.values.length){const k=o.values.indexOf(i.value);v=o.values[Math.max(0,Math.min(o.values.length-1,(k<0?0:k)+d))]}
    else{const inc=+(o.increment||1),f=+(o.from_??0),t=+(o.to??100);let x=parseFloat(i.value);if(isNaN(x))x=f;x=Math.max(f,Math.min(t,x+d*inc));v=String(Number.isInteger(inc)&&Number.isInteger(f)?Math.round(x):+x.toFixed(6))}
    i.value=v;LP.emit({ev:'ui',id,v,step:1})};
   s.children[0].onclick=()=>step(1);s.children[1].onclick=()=>step(-1);break;}
  case 'Text':e=el('textarea','tk-tx');e.spellcheck=false;e.wrap='soft';e.oninput=()=>LP.emit({ev:'ui',id,v:e.value});break;
  case 'Checkbutton':case 'Radiobutton':e=el('div','tk-ck'+(cls==='Radiobutton'?' rb':''));e.setAttribute('role',cls==='Radiobutton'?'radio':'checkbox');e.tabIndex=0;
   n.ind=el('i');n.tx=el('span');e.append(n.ind,n.tx);
   e.onclick=()=>{if(!n.o.state||n.o.state!=='disabled')LP.emit({ev:'cmd',id})};
   e.onkeydown=k=>{if(k.key===' '){k.preventDefault();e.click()}};break;
  case 'Canvas':e=el('div','tk-cv');n.svg=document.createElementNS(SVGNS,'svg');e.append(n.svg);n.items=new Map();break;
  case 'Listbox':e=el('div','tk-lx');e.onclick=k=>{const r=k.target.closest('[data-i]');if(r)LP.emit({ev:'ui',id,i:+r.dataset.i})};n.items=[];n.sel=[];break;
  case 'Scale':{e=el('div','tk-sc');n.lab=el('b');n.inp=el('input');n.inp.type='range';e.append(n.lab,n.inp);n.inp.oninput=()=>{n.lab.textContent=fmtScale(n,n.inp.value);LP.emit({ev:'ui',id,v:+n.inp.value})};break;}
  case 'OptionMenu':case 'Combobox':e=el('select','tk-sel');e.onchange=()=>LP.emit({ev:'ui',id,v:e.value,sel:1});break;
  case 'Progressbar':e=el('div','tk-pb');n.bar=el('i');e.append(n.bar);break;
  case 'Separator':e=el('div','tk-sep');break;
  case 'Scrollbar':case 'Menu':e=el('div','tk-hide');break;
  default:e=el('div','tk-fr');n.box=e;
 }
 e.dataset.wid=id;n.el=e;
 TK.W.set(id,n);
 const p=TK.node(c.p);if(p)p.kids.push(id);
 n.o=c.o||{};apply(n,n.o);
 return n;
}
function fmtScale(n,v){const r=+(n.o.resolution||1);return r>=1?String(Math.round(+v)):String(+(+v).toFixed(Math.max(0,-Math.floor(Math.log10(r)))))}
const DEFBG={Label:'#f0f0f0',Frame:'',TFrame:'',LabelFrame:'',Checkbutton:'#f0f0f0',Radiobutton:'#f0f0f0',Scale:'#f0f0f0',Message:'#f0f0f0',TLabel:''};
const TEXTW={Label:1,TLabel:1,Message:1,Button:1,TButton:1,Checkbutton:1,Radiobutton:1,Entry:1,TEntry:1,Spinbox:1,Combobox:1,OptionMenu:1,Listbox:1,Text:1};
const RELIEF={raised:'outset',sunken:'inset',groove:'groove',ridge:'ridge',solid:'solid',flat:'solid'};
function pad(v,d){if(v===undefined||v===null||v==='')return [d,d];if(Array.isArray(v))return [+v[0]||0,+(v[1]??v[0])||0];const x=parseFloat(v);return [x||0,x||0]}

function apply(n,ch){
 const o=n.o,e=n.el,s=e.style,cls=n.cls;
 if(ch!==o)Object.assign(o,ch);
 const has=k=>k in ch;
 // текст
 if(has('text')){
  const t=o.text==null?'':String(o.text);
  if(n.tx)n.tx.textContent=t;else if(n.lt)n.lt.textContent=t;
  if(cls==='Combobox'||cls==='OptionMenu'){}
 }
 if(has('bg')||has('relief')||has('bd')||has('highlightthickness')){
  if(o.bg!=null&&o.bg!==''){s.background=o.bg;if(n.box&&n.box!==e)n.box.style.background=o.bg;if(n.lt)n.lt.style.background=o.bg;if(cls==='Button'||cls==='TButton'){e.classList.add('cbg');s.borderColor=o.bg}}
  else{s.background=DEFBG[cls]||''}
  const bd=o.bd!=null?+o.bd:null,rel=o.relief;
  if(rel&&rel!=='flat'){const w=bd==null?2:bd;s.border=w+'px '+(RELIEF[rel]||'solid')+' '+(rel==='solid'?'#000':(o.bg||'#d4d4d4'))}
  else if(bd!=null&&cls!=='Button'&&cls!=='TButton'&&!TEXTW[cls]){s.border=''}
  else if(rel==='flat'&&(cls==='Button'||cls==='TButton')){s.border='0';s.background=o.bg||'transparent'}
  if(o.highlightthickness&&o.highlightbackground)s.outline=o.highlightthickness+'px solid '+o.highlightbackground;
 }
 if(has('fg')||has('state')||has('disabledforeground')){
  const dis=o.state==='disabled';
  s.color=dis?(o.disabledforeground||'#a0a0a0'):(o.fg||'');
  if('disabled' in e)e.disabled=dis&&(cls!=='Entry'&&cls!=='TEntry'&&cls!=='Text');
  if(cls==='Entry'||cls==='TEntry'||cls==='Text'){e.readOnly=dis||o.state==='readonly';if(dis)s.background='#f0f0f0'}
  if(n.inp){n.inp.disabled=dis}
  e.classList.toggle('dis',dis);
 }
 if(has('font')&&o.font){s.font=o.font.css;s.textDecoration=(o.font.u?'underline ':'')+(o.font.s?'line-through':'')||''}
 if(has('cursor')){s.cursor=CUR[o.cursor]||o.cursor||''}
 if(has('justify')){s.textAlign=o.justify||'';if(n.tx)n.tx.style.textAlign=o.justify||''}
 if(has('anchor')&&n.tx){const a=anc(o.anchor);s.justifyContent=a.includes('w')?'flex-start':a.includes('e')?'flex-end':'center';s.alignItems=a.includes('n')?'flex-start':a.includes('s')?'flex-end':'center'}
 if(has('wraplength')&&n.tx){const w=parseFloat(o.wraplength)||0;n.tx.style.whiteSpace=w?'pre-wrap':'';n.tx.style.maxWidth=w?w+'px':'';n.tx.style.display=w?'block':''}
 if(cls==='Message'&&has('width')){n.tx.style.whiteSpace='pre-wrap';n.tx.style.maxWidth=(+o.width||200)+'px'}
 // розміри
 if(has('width')||has('height')||has('padx')||has('pady')||has('_ip')||has('font')){
  const ip=n.ip||[0,0];
  if(TEXTW[cls]&&cls!=='Message'){
   const w=parseFloat(o.width);
   if(cls==='Text'){s.width=(w||80)+'ch';s.height=((parseFloat(o.height)||24)*1.35)+'em'}
   else if(cls==='Listbox'){s.width=(w||20)+'ch';s.height=((parseFloat(o.height)||10)*1.3+.3)+'em'}
   else if(cls==='Spinbox'){n.inp.style.width=(w||9)+'ch'}
   else if(w){const wv=w>0?'calc('+w+'ch + '+(cls==='Button'||cls==='TButton'?16:cls==='Entry'||cls==='TEntry'?8:4)+'px + '+(2*ip[0])+'px)':'';s.width=wv;s.minWidth=wv}
   else s.width='';
   const h=parseFloat(o.height);
   if((cls==='Label'||cls==='Button'||cls==='TButton'||cls==='TLabel'||cls==='Checkbutton'||cls==='Radiobutton')&&h)s.height='calc('+(h*1.3)+'em + 6px)';
   else if(cls!=='Text'&&cls!=='Listbox')s.height='';
   if(n.fillX){const cw=s.width||getComputedStyle(e).width;if(s.width&&s.width!=='auto')s.minWidth=s.width;s.width='auto'}
   if(n.fillY&&s.height&&s.height!=='auto'){s.minHeight=s.height;s.height='auto'}
  }else if(cls==='Canvas'){
   s.width=(parseFloat(o.width)||378)+'px';s.height=(parseFloat(o.height)||265)+'px';
   n.svg.setAttribute('viewBox','0 0 '+(parseFloat(o.width)||378)+' '+(parseFloat(o.height)||265));
  }else if(cls==='Frame'||cls==='TFrame'||cls==='LabelFrame'){
   n.fw=parseFloat(o.width)||0;n.fh=parseFloat(o.height)||0;
  }else if(cls==='Scale'){const len=(parseFloat(o.length)||100)+'px';if(o.orient==='horizontal')n.inp.style.width=len;else n.inp.style.height=len}
  else if(cls==='Progressbar'){s.width=(parseFloat(o.length)||100)+'px'}
  if(cls==='Label'||cls==='TLabel'||cls==='Message'||cls==='Button'||cls==='TButton'||cls==='Checkbutton'||cls==='Radiobutton'||cls==='Frame'||cls==='LabelFrame'){
   const dp=(cls==='Button'||cls==='TButton')?[8,2]:[1,1];
   const px=pad(o.padx,dp[0]),py=pad(o.pady,dp[1]);
   s.padding=(py[0]+ip[1])+'px '+(px[1]+ip[0])+'px '+(py[1]+ip[1])+'px '+(px[0]+ip[0])+'px';
  }else if(ip[0]||ip[1]){s.padding=ip[1]+'px '+ip[0]+'px'}
 }
 // окремі класи
 if(cls==='Entry'||cls==='TEntry'||cls==='Combobox'){
  if(has('show'))e.type=o.show?'password':'text';
  if(has('value')&&e.tagName==='INPUT')e.value=o.value==null?'':String(o.value);
 }
 if(cls==='Spinbox'&&has('value'))n.inp.value=o.value==null?'':String(o.value);
 if((cls==='Combobox'||cls==='OptionMenu')&&(has('values')||has('value')||has('text'))){
  const vals=o.values||[];const curv=o.value??o.text??'';
  e.innerHTML=(vals.includes(String(curv))||curv===''?'':'<option>'+esc(curv)+'</option>')+vals.map(v=>'<option>'+esc(v)+'</option>').join('');
  e.value=String(curv);
 }
 if((cls==='Checkbutton'||cls==='Radiobutton')){
  if(has('_on')){e.classList.toggle('on',!!o._on);e.setAttribute('aria-checked',!!o._on)}
  if(has('indicatoron'))e.classList.toggle('btnlike',o.indicatoron===0||o.indicatoron===false)
 }
 if(cls==='Scale'&&(has('from_')||has('to')||has('value')||has('orient')||has('resolution')||has('label')||has('showvalue'))){
  const f=+(o.from_??0),t=+(o.to??100);n.inp.min=Math.min(f,t);n.inp.max=Math.max(f,t);n.inp.step=o.resolution||1;
  if(o.value!=null)n.inp.value=o.value;
  e.classList.toggle('v',o.orient!=='horizontal');
  n.lab.textContent=(o.label?o.label+' ':'')+fmtScale(n,n.inp.value);n.lab.hidden=o.showvalue===0||o.showvalue===false;
 }
 if(cls==='Progressbar'&&(has('value')||has('maximum'))){n.bar.style.width=Math.max(0,Math.min(100,(+o.value||0)/(+o.maximum||100)*100))+'%'}
 if(cls==='Canvas'&&has('bg')&&o.bg){s.background=o.bg}
 if(cls==='Listbox'&&has('_items'))renderLb(n,o._items||[],[]);
}
function renderLb(n,items,sel){
 n.items=items;n.sel=sel;
 n.el.innerHTML=items.map((t,i)=>'<div data-i="'+i+'"'+(sel.includes(i)?' class="sel"':'')+'>'+esc(t||' ')+'</div>').join('');
}

/* --- розміщення --- */
function relayout(n){
 const box=n.box;if(!box)return;
 const kids=n.kids.map(id=>TK.node(id)).filter(k=>k&&!k.dead&&k.mgr);
 const packs=n.pack.map(id=>TK.node(id)).filter(k=>k&&!k.dead&&k.mgr==='pack');
 const grids=kids.filter(k=>k.mgr==='grid'),places=kids.filter(k=>k.mgr==='place');
 const act=document.activeElement,keep=act&&box.contains(act)?act:null,sel=keep&&'selectionStart' in keep?[keep.selectionStart,keep.selectionEnd]:null;
 [...box.children].forEach(c=>c.remove());
 box.style.display='';box.style.gridTemplateColumns='';box.style.gridTemplateRows='';
 const s=box.style;
 if(packs.length){box.append(buildPack(packs))}
 else if(grids.length){
  s.display='grid';s.justifyContent='start';s.alignContent='start';
  let mc=0,mr=0;
  grids.forEach(k=>{mc=Math.max(mc,(k.mi.column||0)+(k.mi.columnspan||1));mr=Math.max(mr,(k.mi.row||0)+(k.mi.rowspan||1))});
  const tpl=(cfg,m)=>{const a=[];for(let i=0;i<m;i++){const c=cfg[i]||{};const w=+c.w||0,mn=+c.m||0;a.push(w>0?'minmax('+mn+'px,'+w+'fr)':(mn?'minmax('+mn+'px,auto)':'auto'))}return a.join(' ')};
  s.gridTemplateColumns=tpl(n.gc.c,mc);s.gridTemplateRows=tpl(n.gc.r,mr);
  if(Object.values(n.gc.c).some(c=>+c.w>0))s.justifyContent='stretch';
  if(Object.values(n.gc.r).some(c=>+c.w>0))s.alignContent='stretch';
  grids.forEach(k=>{
   const c=el('div','gc'),mi=k.mi,st=c.style,sticky=mi.sticky||'';
   st.gridRow=((mi.row||0)+1)+' / span '+(mi.rowspan||1);st.gridColumn=((mi.column||0)+1)+' / span '+(mi.columnspan||1);
   const px=pad(mi.padx,0),py=pad(mi.pady,0);st.padding=py[0]+'px '+px[1]+'px '+py[1]+'px '+px[0]+'px';
   const ew=sticky.includes('e')&&sticky.includes('w'),ns=sticky.includes('n')&&sticky.includes('s');
   st.alignItems=ew?'stretch':sticky.includes('w')?'flex-start':sticky.includes('e')?'flex-end':'center';
   st.justifyContent=ns?'stretch':sticky.includes('n')?'flex-start':sticky.includes('s')?'flex-end':'center';
   k.el.style.flex=ns?'1 1 auto':'';k.el.style.alignSelf='';setFill(k,ew,false);
   setIp(k);c.append(k.el);box.append(c);
  });
 }
 places.forEach(k=>{
  const mi=k.mi,st=k.el.style;st.position='absolute';
  st.left='calc('+((mi.relx||0)*100)+'% + '+(mi.x||0)+'px)';st.top='calc('+((mi.rely||0)*100)+'% + '+(mi.y||0)+'px)';
  if(mi.width!=null||mi.relwidth!=null)st.width='calc('+((mi.relwidth||0)*100)+'% + '+(mi.width||0)+'px)';
  if(mi.height!=null||mi.relheight!=null)st.height='calc('+((mi.relheight||0)*100)+'% + '+(mi.height||0)+'px)';
  const a=anc(mi.anchor||'nw'),tx=a.includes('w')?'0':a.includes('e')?'-100%':'-50%',ty=a.includes('n')?'0':a.includes('s')?'-100%':'-50%';
  st.transform='translate('+tx+','+ty+')';box.append(k.el);
 });
 if(keep&&keep.isConnected&&document.activeElement!==keep){keep.focus({preventScroll:true});if(sel)try{keep.setSelectionRange(sel[0],sel[1])}catch(e){}}
 // розмір контейнера
 const managed=packs.length||grids.length;
 if(n.win){
  box.classList.toggle('empty',!n.geom&&!managed);
  box.classList.toggle('fix',!!n.geom);
  if(n.geom){s.width=n.geom[0]+'px';s.height=n.geom[1]+'px'}else{s.width='';s.height=''}
  if(n.minsize){s.minWidth=n.minsize[0]+'px';s.minHeight=n.minsize[1]+'px'}
 }else if(n.fw!==undefined||n.fh!==undefined){
  const usewh=!managed||!n.prop;
  n.el.style.width=usewh&&n.fw?n.fw+'px':'';n.el.style.height=usewh&&n.fh?n.fh+'px':'';
  if(!managed&&!places.length){n.el.style.minWidth=n.fw?'':'0'}
  n.el.style.overflow=usewh&&(n.fw||n.fh)?'hidden':'';
 }
}
function setFill(k,x,y){if(!!k.fillX!==x||!!k.fillY!==y){k.fillX=x;k.fillY=y;k.el.style.minWidth='';k.el.style.minHeight='';apply(k,{_ip:1})}}
function setIp(k){const mi=k.mi;const ip=[parseFloat(mi.ipadx&&mi.ipadx[0])||0,parseFloat(mi.ipady&&mi.ipady[0])||0];
 if((k.ip||[0,0])[0]!==ip[0]||(k.ip||[0,0])[1]!==ip[1]){k.ip=ip;apply(k,{_ip:1})}}
function buildPack(list){
 const root={dir:null,before:[],after:[],rest:null};let nd=root;
 for(const k of list){
  const side=k.mi.side||'top',ax=(side==='top'||side==='bottom')?'c':'r';
  if(nd.dir===null)nd.dir=ax;else if(nd.dir!==ax){const nn={dir:ax,before:[],after:[],rest:null};nd.rest=nn;nd=nn}
  (side==='top'||side==='left'?nd.before:nd.after).push(k);
 }
 return mkPackNode(root);
}
function mkPackNode(nd){
 const e=el('div','pk pk'+nd.dir);
 nd.before.forEach(k=>e.append(parcel(k,nd.dir)));
 if(nd.rest)e.append(mkPackNode(nd.rest));else if(nd.after.length)e.append(el('div','pk-sp'));
 nd.after.slice().reverse().forEach(k=>e.append(parcel(k,nd.dir)));
 return e;
}
function parcel(k,dir){
 const p=el('div','pcl'),mi=k.mi,st=p.style,fill=mi.fill||'none',a=anc(mi.anchor);
 const px=pad(mi.padx,0),py=pad(mi.pady,0);
 st.padding=py[0]+'px '+px[1]+'px '+py[1]+'px '+px[0]+'px';
 if(mi.expand)st.flex='1 1 auto';
 const fx=fill==='x'||fill==='both',fy=fill==='y'||fill==='both';
 const ks=k.el.style;ks.flex='';ks.alignSelf='';
 if(dir==='c'){
  st.flexDirection='column';
  st.alignItems=fx?'stretch':a.includes('w')?'flex-start':a.includes('e')?'flex-end':'center';
  st.justifyContent=a.includes('n')?'flex-start':a.includes('s')?'flex-end':'center';
  if(fy)ks.flex='1 1 auto';
 }else{
  st.flexDirection='row';
  st.alignItems=fy?'stretch':a.includes('n')?'flex-start':a.includes('s')?'flex-end':'center';
  st.justifyContent=a.includes('w')?'flex-start':a.includes('e')?'flex-end':'center';
  if(fx)ks.flex='1 1 auto';
 }
 setFill(k,dir==='c'&&fx,dir==='r'&&fy);
 setIp(k);
 p.append(k.el);return p;
}

/* --- масштаб вікон під ширину панелі --- */
function fitAll(){
 const avail=Math.max(120,winsEl.clientWidth-28);
 for(const n of TK.W.values()){
  if(!n.win||n.dead)continue;
  const w=n.el.offsetWidth,h=n.el.offsetHeight,sc=Math.min(1,avail/w);
  n.scale=sc;n.el.style.transform=sc<1?'scale('+sc+')':'';
  n.wrap.style.width=Math.ceil(w*sc)+'px';n.wrap.style.height=Math.ceil(h*sc)+'px';
 }
 if(TT.win)TT.fit();
}
new ResizeObserver(()=>fitAll()).observe(winsEl);
function reportSizes(){
 for(const n of TK.W.values()){
  if(n.dead)continue;
  if(!(n.win||n.listen.has('size')))continue;
  const b=n.win?n.box:n.el;const w=b.offsetWidth,h=b.offsetHeight;
  if(w&&(w!==n.rw||h!==n.rh)){n.rw=w;n.rh=h;LP.emit({ev:'size',id:n.id,w,h})}
 }
}

/* --- події миші та клавіатури --- */
function locate(n,ev){
 const r=n.el.getBoundingClientRect(),sc=r.width/(n.el.offsetWidth||1)||1;
 return {x:(ev.clientX-r.left)/sc-(n.el.clientLeft||0),y:(ev.clientY-r.top)/sc-(n.el.clientTop||0)};
}
function chainHas(n,kind){
 let p=n;while(p){if(p.listen.has(kind))return true;p=TK.node(p.parent)}return false;
}
function hookWin(w){
 const body=w.el;
 let hover=null,hoverItem=null,moveQ=null,btns=new Set();
 const target=e=>{const t=e.target.closest&&e.target.closest('[data-wid]');return t?TK.node(+t.dataset.wid):null};
 const send=(n,k,e,extra)=>{const p=locate(n,e);const it=e.target.closest&&e.target.closest('[data-i]');
  LP.emit(Object.assign({ev:'mouse',id:n.id,k,x:p.x,y:p.y,b:e.button+1,btns:[...btns],i:it&&n.items?+it.dataset.i:null,mods:[e.ctrlKey&&'Control',e.shiftKey&&'Shift'].filter(Boolean)},extra||{}))};
 body.addEventListener('pointerdown',e=>{
  const n=target(e);if(!n)return;btns.add(e.button+1);
  if(!e.target.closest('input,textarea,select,button'))body.focus({preventScroll:true});
  if(chainHas(n,'click')||(n.listen.has('items')))send(n,'down',e);
 });
 body.addEventListener('pointerup',e=>{const n=target(e);btns.delete(e.button+1);if(n&&(chainHas(n,'click')||n.listen.has('items')))send(n,'up',e)});
 body.addEventListener('dblclick',e=>{const n=target(e);if(n&&chainHas(n,'click'))send(n,'dbl',e)});
 body.addEventListener('pointermove',e=>{
  const n=target(e);if(!n)return;
  if(n!==hover){if(hover&&hover.listen.has('hover'))send(hover,'leave',e);hover=n;if(n.listen.has('hover'))send(n,'enter',e)}
  if(n.items&&n.listen.has('items')&&n.listen.has('hover')){const it=e.target.closest('[data-i]');const ii=it?+it.dataset.i:null;
   if(ii!==hoverItem){if(hoverItem!=null)LP.emit({ev:'mouse',id:n.id,k:'leave',i:hoverItem,x:0,y:0});hoverItem=ii;if(ii!=null)send(n,'enter',e)}}
  if(chainHas(n,'motion')||(n.listen.has('items')&&n.listen.has('motion'))){
   if(!moveQ)requestAnimationFrame(()=>{const q=moveQ;moveQ=null;if(q&&!q.n.dead)send(q.n,'move',q.e)});
   moveQ={n,e};
  }
 });
 body.addEventListener('pointerleave',e=>{if(hover&&hover.listen.has('hover'))send(hover,'leave',e);hover=null});
 body.addEventListener('wheel',e=>{const n=target(e);if(n&&chainHas(n,'wheel')){e.preventDefault();send(n,'wheel',e,{delta:e.deltaY<0?120:-120})}},{passive:false});
 const key=(e,k)=>{
  const inField=e.target.closest&&e.target.closest('input,textarea,select');
  const f=inField&&e.target.closest('[data-wid]');
  const fn=f?TK.node(+f.dataset.wid):null;
  if(!w.listen.has('key')&&!(fn&&fn.listen.has('key')))return;
  if(!inField&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Tab'].includes(e.key))e.preventDefault();
  if(e.repeat&&k==='up')return;
  LP.emit(Object.assign({ev:'key',k,win:w.id,id:fn?fn.id:null},keyEv(e)));
 };
 body.addEventListener('keydown',e=>key(e,'down'));
 body.addEventListener('keyup',e=>key(e,'up'));
}

/* --- Canvas --- */
function sv(t){return document.createElementNS(SVGNS,t)}
const CDEF={line:{fill:'black',width:1},rectangle:{outline:'black',fill:'',width:1},oval:{outline:'black',fill:'',width:1},arc:{outline:'black',fill:'',width:1,start:0,extent:90,style:'pieslice'},polygon:{fill:'black',outline:'',width:1},text:{fill:'black',anchor:'center'},image:{},window:{}};
function citem(n,c){
 const it={t:c.t,xy:c.xy,o:Object.assign({},CDEF[c.t]||{},c.o||{})};
 it.el=sv('g');it.el.dataset.i=c.i;n.items.set(c.i,it);n.svg.append(it.el);drawItem(it);
}
function paint(e,fill,outline,w,dash){
 e.setAttribute('fill',fill||'none');
 if(outline){e.setAttribute('stroke',outline);e.setAttribute('stroke-width',w)}else e.setAttribute('stroke','none');
 if(dash&&dash.length)e.setAttribute('stroke-dasharray',dash.join(' '));
}
function smoothPath(p,closed){
 if(p.length<6)return 'M'+p.join(' ');
 const pts=[];for(let i=0;i<p.length-1;i+=2)pts.push([p[i],p[i+1]]);
 if(closed){pts.push(pts[0],pts[1])}
 const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 let d='M'+(closed?mid(pts[0],pts[1]):pts[0]).join(' ');
 const start=closed?1:1,end=pts.length-1;
 for(let i=start;i<end-(closed?0:1);i++){const m=mid(pts[i],pts[i+1]);d+=' Q'+pts[i].join(' ')+' '+m.join(' ')}
 if(!closed)d+=' Q'+pts[end-1].join(' ')+' '+pts[end].join(' ');
 return d+(closed?'Z':'');
}
function drawItem(it){
 const g=it.el,o=it.o,xy=it.xy;g.textContent='';
 g.style.display=o.state==='hidden'?'none':'';
 const w=+o.width||1;
 switch(it.t){
  case 'line':{
   if(xy.length<4)break;
   let e;if(o.smooth&&o.smooth!=='0'&&o.smooth!==false){e=sv('path');e.setAttribute('d',smoothPath(xy,false))}else{e=sv('polyline');e.setAttribute('points',xy.join(' '))}
   paint(e,'',o.fill,w,o.dash);
   if(o.capstyle==='round')e.setAttribute('stroke-linecap','round');else if(o.capstyle==='projecting')e.setAttribute('stroke-linecap','square');
   if(o.joinstyle)e.setAttribute('stroke-linejoin',o.joinstyle);
   g.append(e);
   const head=(x1,y1,x2,y2)=>{const sh=o.arrowshape?String(o.arrowshape).split(/[ ,]+/).map(Number):[8,10,3];
    const L=Math.hypot(x2-x1,y2-y1)||1,ux=(x2-x1)/L,uy=(y2-y1)/L,a=sh[0]*(1+w/8),b=sh[1]*(1+w/8),c=sh[2]+w/2;
    const p=sv('polygon');p.setAttribute('points',[x2,y2,x2-ux*b-uy*c,y2-uy*b+ux*c,x2-ux*a,y2-uy*a,x2-ux*b+uy*c,y2-uy*b-ux*c].join(' '));p.setAttribute('fill',o.fill||'black');g.append(p)};
   const n=xy.length;
   if(o.arrow==='last'||o.arrow==='both')head(xy[n-4],xy[n-3],xy[n-2],xy[n-1]);
   if(o.arrow==='first'||o.arrow==='both')head(xy[2],xy[3],xy[0],xy[1]);
   break;}
  case 'rectangle':{if(xy.length<4)break;const e=sv('rect');const x=Math.min(xy[0],xy[2]),y=Math.min(xy[1],xy[3]);
   e.setAttribute('x',x);e.setAttribute('y',y);e.setAttribute('width',Math.abs(xy[2]-xy[0]));e.setAttribute('height',Math.abs(xy[3]-xy[1]));
   paint(e,o.fill,o.outline,w,o.dash);g.append(e);break;}
  case 'oval':{if(xy.length<4)break;const e=sv('ellipse');e.setAttribute('cx',(xy[0]+xy[2])/2);e.setAttribute('cy',(xy[1]+xy[3])/2);
   e.setAttribute('rx',Math.abs(xy[2]-xy[0])/2);e.setAttribute('ry',Math.abs(xy[3]-xy[1])/2);paint(e,o.fill,o.outline,w,o.dash);g.append(e);break;}
  case 'polygon':{if(xy.length<4)break;let e;if(o.smooth&&o.smooth!=='0'&&o.smooth!==false){e=sv('path');e.setAttribute('d',smoothPath(xy,true))}else{e=sv('polygon');e.setAttribute('points',xy.join(' '))}
   paint(e,o.fill,o.outline,w,o.dash);e.setAttribute('stroke-linejoin','round');g.append(e);break;}
  case 'arc':{if(xy.length<4)break;const cx=(xy[0]+xy[2])/2,cy=(xy[1]+xy[3])/2,rx=Math.abs(xy[2]-xy[0])/2,ry=Math.abs(xy[3]-xy[1])/2;
   let st=+o.start||0,ex=+o.extent;if(isNaN(ex))ex=90;ex=Math.max(-359.99,Math.min(359.99,ex));
   const P=a=>[cx+rx*Math.cos(a*Math.PI/180),cy-ry*Math.sin(a*Math.PI/180)];
   const p1=P(st),p2=P(st+ex),large=Math.abs(ex)>180?1:0,sweep=ex>0?0:1;
   let d='M'+p1.join(' ')+' A'+rx+' '+ry+' 0 '+large+' '+sweep+' '+p2.join(' ');
   if(o.style==='pieslice'||!o.style)d='M'+cx+' '+cy+' L'+p1.join(' ')+' A'+rx+' '+ry+' 0 '+large+' '+sweep+' '+p2.join(' ')+' Z';
   else if(o.style==='chord')d+=' Z';
   const e=sv('path');e.setAttribute('d',d);paint(e,o.style==='arc'?'':o.fill,o.outline,w,o.dash);g.append(e);break;}
  case 'text':{
   if(xy.length<2)break;const e=sv('text');const lines=String(o.text==null?'':o.text).split('\n');
   const a=anc(o.anchor);const px=o.font&&o.font.px?o.font.px:12;
   e.setAttribute('fill',o.fill||'black');e.style.font=o.font?o.font.css:'12px "Segoe UI",system-ui,sans-serif';
   if(o.font&&o.font.u)e.setAttribute('text-decoration','underline');
   e.setAttribute('text-anchor',a.includes('w')?'start':a.includes('e')?'end':'middle');
   const lh=px*1.25,total=lines.length*lh;
   let y0=a.includes('n')?xy[1]:a.includes('s')?xy[1]-total:xy[1]-total/2;
   lines.forEach((ln,i)=>{const t=sv('tspan');t.setAttribute('x',xy[0]);t.setAttribute('y',y0+lh*i+px*.95);t.textContent=ln||' ';e.append(t)});
   if(o.angle){e.setAttribute('transform','rotate('+(-o.angle)+' '+xy[0]+' '+xy[1]+')')}
   g.append(e);break;}
 }
}

/* --- кнопки для телефона --- */
const KP={
 el:$('#kp'),
 update(){
  const need=matchMedia('(pointer:coarse)').matches&&([...TK.W.values()].some(n=>n.win&&!n.dead&&n.listen.has('key'))||(TT.win&&TT.keys));
  const B=(L()&&L().kp)||[['Left','←'],['Up','↑'],['Down','↓'],['Right','→'],['space','Пробіл']],sig=B.map(b=>b[0]).join();
  if(need&&this.sig!==sig){
   this.sig=sig;
   this.el.innerHTML=B.map(b=>'<button type="button" data-k="'+b[0]+'"'+(b[0]==='space'?' class="wide"':'')+'>'+b[1]+'</button>').join('');
   this.el.querySelectorAll('button').forEach(b=>{
    const k=b.dataset.k,ch=k==='space'?' ':(k.length===1?k:'');
    const fire=kind=>{
     const w=[...TK.W.values()].find(n=>n.win&&!n.dead&&n.listen.has('key'));
     if(w)LP.emit({ev:'key',k:kind,win:w.id,id:null,keysym:k,char:ch,keycode:0,mods:[]});
     else if(TT.win)LP.emit({ev:'tkey',k:kind,keysym:k,char:ch});
    };
    b.addEventListener('pointerdown',e=>{e.preventDefault();fire('down')});
    b.addEventListener('pointerup',e=>{e.preventDefault();fire('up')});
    b.addEventListener('contextmenu',e=>e.preventDefault());
   });
  }
  this.el.classList.toggle('on',!!need);
 }
};

/* --- повідомлення messagebox --- */
const MSGI={info:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#0067c0"/><rect x="14.5" y="13" width="3" height="11" fill="#fff"/><circle cx="16" cy="9" r="2" fill="#fff"/></svg>',
 warning:'<svg viewBox="0 0 32 32"><path d="M16 2l15 27H1z" fill="#f2c500"/><rect x="14.5" y="11" width="3" height="10" fill="#000"/><circle cx="16" cy="25" r="1.8" fill="#000"/></svg>',
 error:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#d13438"/><path d="M10 10l12 12M22 10L10 22" stroke="#fff" stroke-width="3"/></svg>'};

/* --- команди від Python --- */
const OPS={
 win(c){newWin(c);KP.update()},
 title(c){const n=TK.node(c.id);if(n)n.tt.textContent=c.t},
 geom(c){const n=TK.node(c.id);if(n){n.geom=[c.w,c.h];TK.mark(c.id)}},
 minsize(c){const n=TK.node(c.id);if(n){n.minsize=[c.w,c.h];TK.mark(c.id)}},
 show(c){const n=TK.node(c.id);if(n)n.wrap.style.display=c.v?'':'none'},
 new(c){mkWidget(c)},
 cfg(c){const n=TK.node(c.id);if(!n)return;
  if(n.win){if('bg' in c.o)n.box.style.background=c.o.bg||'';if(c.o.w||c.o.h){if(!n.geom)n.geom=[c.o.w||200,c.o.h||200]}
   if('padx' in c.o||'pady' in c.o){const px=pad(c.o.padx??n.o.padx,0),py=pad(c.o.pady??n.o.pady,0);Object.assign(n.o,c.o);n.box.style.padding=py[0]+'px '+px[0]+'px'}
   if(c.o.cursor)n.box.style.cursor=CUR[c.o.cursor]||c.o.cursor;TK.mark(c.id);return}
  apply(n,c.o);if(n.box&&('width' in c.o||'height' in c.o))TK.mark(n.id)},
 mgr(c){const n=TK.node(c.id);if(!n)return;const p=TK.node(n.parent);
  if(c.m==='pack'){if(!p.pack.includes(n.id)||n.mgr!=='pack'){p.pack=p.pack.filter(x=>x!==n.id);
   if(c.o.before&&p.pack.includes(c.o.before))p.pack.splice(p.pack.indexOf(c.o.before),0,n.id);
   else if(c.o.after&&p.pack.includes(c.o.after))p.pack.splice(p.pack.indexOf(c.o.after)+1,0,n.id);
   else p.pack.push(n.id)}}
  else p.pack=p.pack.filter(x=>x!==n.id);
  if(!c.m){n.el.remove();n.el.style.position='';n.el.style.transform=''}
  if(c.m!=='place'){n.el.style.position='';n.el.style.left='';n.el.style.top='';n.el.style.transform=''}
  n.mgr=c.m;n.mi=c.o||{};TK.mark(n.parent)},
 gcfg(c){const n=TK.node(c.id);if(!n)return;const g=n.gc[c.a];g[c.i]=Object.assign(g[c.i]||{},c.w!=null?{w:c.w}:{},c.m!=null?{m:c.m}:{});TK.mark(c.id)},
 prop(c){const n=TK.node(c.id);if(n){n.prop=c.v;TK.mark(c.id)}},
 del(c){const n=TK.node(c.id);if(!n)return;
  const kill=x=>{x.dead=true;x.kids.forEach(k=>{const m=TK.node(k);if(m)kill(m)});TK.W.delete(x.id)};
  kill(n);
  if(n.win){n.wrap.remove();KP.update();R.ui()}
  else{n.el.remove();const p=TK.node(n.parent);if(p){p.kids=p.kids.filter(x=>x!==n.id);p.pack=p.pack.filter(x=>x!==n.id);TK.mark(p.id)}}},
 focus(c){const n=TK.node(c.id);if(!n)return;const f=n.inp||n.el;if(f&&f.focus&&!matchMedia('(pointer:coarse)').matches)setTimeout(()=>f.focus({preventScroll:true}),0)},
 selall(c){const n=TK.node(c.id);if(n&&n.el.select)n.el.select()},
 listen(c){const n=TK.node(c.id);if(!n)return;c.k.forEach(k=>n.listen.add(k));
  if(c.k.includes('key')){let w=n;while(w&&!w.win)w=TK.node(w.parent);if(w)w.listen.add('key');KP.update()}},
 val(c){const n=TK.node(c.id);if(!n)return;
  if(n.cls==='Scale'){n.inp.value=c.v;n.lab.textContent=(n.o.label?n.o.label+' ':'')+fmtScale(n,n.inp.value);return}
  if(n.cls==='Combobox'||n.cls==='OptionMenu'){apply(n,{value:c.v});return}
  const f=n.inp||n.el;if(f.value!==String(c.v))f.value=String(c.v);
  if(n.cls==='Text')f.scrollTop=f.scrollHeight},
 see(c){const n=TK.node(c.id);if(n)n.el.scrollTop=n.el.scrollHeight},
 items(c){const n=TK.node(c.id);if(n)renderLb(n,c.items,c.sel||[])},
 raise(c){},
 ci(c){const n=TK.node(c.id);if(n&&n.items)citem(n,c)},
 cc(c){const n=TK.node(c.id);const it=n&&n.items&&n.items.get(c.i);if(it){it.xy=c.xy;drawItem(it)}},
 co(c){const n=TK.node(c.id);const it=n&&n.items&&n.items.get(c.i);if(it){Object.assign(it.o,c.o);drawItem(it)}},
 cd(c){const n=TK.node(c.id);const it=n&&n.items&&n.items.get(c.i);if(it){it.el.remove();n.items.delete(c.i)}},
 cz(c){const n=TK.node(c.id);const it=n&&n.items&&n.items.get(c.i);if(it){if(c.top)n.svg.append(it.el);else n.svg.prepend(it.el)}},
 cwin(c){const n=TK.node(c.id),w=TK.node(c.w),it=n&&n.items.get(c.i);if(!it||!w)return;
  const fo=sv('foreignObject');fo.setAttribute('x',it.xy[0]);fo.setAttribute('y',it.xy[1]);fo.setAttribute('width',1);fo.setAttribute('height',1);fo.style.overflow='visible';fo.append(w.el);it.el.append(fo)},
 after(c){const h=setTimeout(()=>{TK.timers.delete(c.t);LP.emit({ev:'timer',t:c.t});R.ui()},c.ms);TK.timers.set(c.t,h);R.ui()},
 cancel(c){const h=TK.timers.get(c.t);if(h){clearTimeout(h);TK.timers.delete(c.t)}},
 bell(){},
 msg(c){
  const m=el('div','tkmsg');m.innerHTML='<div class="tkt">'+FEATHER+'<span></span><button aria-label="Закрити">'+XI+'</button></div><div class="mb">'+(MSGI[c.k]||MSGI.info)+'<div></div></div><div class="mf"><button>OK</button></div>';
  m.querySelector('.tkt span').textContent=c.t||'';m.querySelector('.mb div').textContent=c.m||'';
  const close=()=>m.remove();m.querySelectorAll('button').forEach(b=>b.onclick=close);
  winsEl.append(m);setTimeout(()=>{const b=m.querySelector('.mf button');if(b&&!matchMedia('(pointer:coarse)').matches)b.focus({preventScroll:true})},0);
 },
 tscreen(c){TT.screen(c)},
 tq(c){TT.push(c.ops)}
};
/* ---------- рендер turtle ---------- */
const TSH={
 classic:[[0,0],[-5,-9],[0,-7],[5,-9]],
 arrow:[[-10,0],[10,0],[0,10]],
 turtle:[[0,16],[-2,14],[-1,10],[-4,7],[-7,9],[-9,8],[-6,5],[-7,1],[-5,-3],[-8,-6],[-6,-8],[-4,-5],[0,-7],[4,-5],[6,-8],[8,-6],[5,-3],[7,1],[6,5],[9,8],[7,9],[4,7],[1,10],[2,14]],
 square:[[10,-10],[10,10],[-10,10],[-10,-10]],
 triangle:[[10,-5.77],[0,11.55],[-10,-5.77]],
 circle:Array.from({length:20},(_,i)=>[10*Math.cos(i*Math.PI/10),10*Math.sin(i*Math.PI/10)]),
 blank:[]
};
const TT={
 win:null,wrap:null,cv:null,ov:null,ctx:null,octx:null,W:700,H:520,bg:'white',q:[],items:[],tur:new Map(),tracer:1,raf:0,keys:false,cur:null,dpr:1,
 alive(){return false},
 reset(){this.stopAnim();if(this.wrap)this.wrap.remove();this.win=null;this.wrap=null;this.items=[];this.tur.clear();this.q=[];this.keys=false;this.cur=null;this.tracer=1},
 stopAnim(){cancelAnimationFrame(this.raf);this.raf=0;this.q=[];this.cur=null},
 screen(c){
  this.reset();this.W=c.w;this.H=c.h;this.bg=c.bg;
  const wrap=el('div','tkwrap'),w=el('div','tkw'),t=el('div','tkt'),b=el('div','tkb tt');
  w.tabIndex=0;w.setAttribute('role','application');
  t.innerHTML=FEATHER+'<span></span><button aria-label="Закрити вікно" title="Закрити">'+XI+'</button>';
  t.querySelector('span').textContent=c.t;t.querySelector('button').onclick=()=>{this.reset();R.ui()};
  this.cv=el('canvas');this.ov=el('canvas');b.append(this.cv,this.ov);
  w.append(t,b);wrap.append(w);winsEl.append(wrap);
  this.win=w;this.wrap=wrap;this.box=b;this.ttl=t.querySelector('span');
  this.ctx=this.cv.getContext('2d');this.octx=this.ov.getContext('2d');
  this.size(c.w,c.h);
  b.addEventListener('pointerdown',e=>{w.focus({preventScroll:true});const r=b.getBoundingClientRect();
   const x=(e.clientX-r.left)*this.W/r.width-this.W/2,y=this.H/2-(e.clientY-r.top)*this.H/r.height;
   LP.emit({ev:'tclick',x:Math.round(x*100)/100,y:Math.round(y*100)/100,b:e.button+1})});
  const key=(e,k)=>{if(!this.keys)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.repeat&&k==='up')return;
   const kv=keyEv(e);LP.emit({ev:'tkey',k,keysym:kv.keysym,char:kv.char})};
  w.addEventListener('keydown',e=>key(e,'down'));w.addEventListener('keyup',e=>key(e,'up'));
 },
 size(w,h){
  this.W=w;this.H=h;this.dpr=Math.min(2,window.devicePixelRatio||1);
  for(const c of [this.cv,this.ov]){c.width=Math.round(w*this.dpr);c.height=Math.round(h*this.dpr)}
  this.box.style.width=w+'px';this.box.style.height=h+'px';
  this.redraw();this.fit();
 },
 fit(){if(!this.win)return;const avail=Math.max(120,winsEl.clientWidth-28),w=this.win.offsetWidth,h=this.win.offsetHeight,sc=Math.min(1,avail/w);
  this.win.style.transform=sc<1?'scale('+sc+')':'';this.wrap.style.width=Math.ceil(w*sc)+'px';this.wrap.style.height=Math.ceil(h*sc)+'px'},
 X(x){return this.W/2+x},Y(y){return this.H/2-y},
 push(ops){if(!this.win)return;this.q.push(...ops);if(!this.raf)this.raf=requestAnimationFrame(t=>this.frame(t))},
 T(id){let t=this.tur.get(id);if(!t){t={x:0,y:0,h:0,v:true,s:'classic',pc:'black',fc:'black',z:[1,1],w:1};this.tur.set(id,t)}return t},
 frame(){
  this.raf=0;
  let budget=1,count=0;const c=this.ctx;
  c.setTransform(this.dpr,0,0,this.dpr,0,0);
  while(this.q.length&&count<30000){
   const op=this.q[0];count++;
   if(op.o==='mv'){
    const t=this.T(op.t),a=op.a,len=Math.hypot(a[2]-a[0],a[3]-a[1]);
    const sp=this.tracer===0?0:op.s;
    if(sp===0||len<0.01){this.line(op,a[0],a[1],a[2],a[3]);t.x=a[2];t.y=a[3];this.q.shift();this.cur=null;continue}
    const step=Math.max(1,1.6*Math.pow(sp,1.55));
    if(!this.cur){this.cur={d:0}}
    if(budget<=0)break;
    const d0=this.cur.d,d1=Math.min(len,d0+step*budget);
    const f0=d0/len,f1=d1/len;
    const x0=a[0]+(a[2]-a[0])*f0,y0=a[1]+(a[3]-a[1])*f0,x1=a[0]+(a[2]-a[0])*f1,y1=a[1]+(a[3]-a[1])*f1;
    if(op.p)this.seg(x0,y0,x1,y1,op.c,op.w);
    t.x=x1;t.y=y1;budget-=(d1-d0)/step;this.cur.d=d1;
    if(d1>=len-1e-6){if(op.p)this.items.push({k:'l',t:op.t,a:op.a,c:op.c,w:op.w});this.q.shift();this.cur=null}
    continue;
   }
   this.q.shift();this.apply(op);
   if(op.o==='rot'&&op.s>0&&this.tracer!==0){budget-=0.06*(11-op.s)/10}
   if((op.o==='dot'||op.o==='text')&&op.s>0&&this.tracer!==0)budget-=0.3;
  }
  this.drawTurtles();
  if(this.q.length)this.raf=requestAnimationFrame(()=>this.frame());
 },
 line(op,x0,y0,x1,y1){if(op.p){this.seg(x0,y0,x1,y1,op.c,op.w);this.items.push({k:'l',t:op.t,a:op.a,c:op.c,w:op.w})}},
 seg(x0,y0,x1,y1,c,w){const g=this.ctx;g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(this.X(x0),this.Y(y0));g.lineTo(this.X(x1),this.Y(y1));g.stroke()},
 apply(op){
  const g=this.ctx;
  switch(op.o){
   case 'tur':{const t=this.T(op.t);t.x=op.x;t.y=op.y;t.h=op.h;t.v=op.v;t.s=op.s;t.pc=op.pc;t.fc=op.fc;t.z=op.z;t.w=op.w;break}
   case 'rot':this.T(op.t).h=op.h;break;
   case 'fill':this.items.push({k:'f',t:op.t,p:op.p,c:op.c,g:op.g});this.drawItem(this.items[this.items.length-1]);break;
   case 'dot':{const it={k:'d',t:op.t,x:op.x,y:op.y,d:op.d,c:op.c};this.items.push(it);this.drawItem(it);break}
   case 'text':{const it={k:'x',t:op.t,x:op.x,y:op.y,txt:op.txt,a:op.a,f:op.f,c:op.c};this.items.push(it);this.drawItem(it);break}
   case 'stamp':{const it={k:'s',t:op.t,x:op.x,y:op.y,h:op.h,sh:op.sh,pc:op.pc,fc:op.fc,z:op.z};this.items.push(it);this.drawItem(it);break}
   case 'clear':this.items=this.items.filter(i=>i.t!==op.t);this.redraw();break;
   case 'clearall':this.items=[];this.tur.clear();this.bg='white';this.redraw();break;
   case 'bg':this.bg=op.c;this.redraw();break;
   case 'size':this.size(op.w,op.h);break;
   case 'title':this.ttl.textContent=op.t;break;
   case 'tracer':this.tracer=op.n;break;
   case 'keys':case 'listen':this.keys=true;KP.update();if(!matchMedia('(pointer:coarse)').matches)this.win.focus({preventScroll:true});break;
   case 'bye':this.reset();break;
  }
 },
 drawItem(it){
  const g=this.ctx;g.setTransform(this.dpr,0,0,this.dpr,0,0);
  if(it.k==='l'){this.seg(it.a[0],it.a[1],it.a[2],it.a[3],it.c,it.w)}
  else if(it.k==='f'){g.fillStyle=it.c;g.beginPath();it.p.forEach((p,i)=>i?g.lineTo(this.X(p[0]),this.Y(p[1])):g.moveTo(this.X(p[0]),this.Y(p[1])));g.closePath();g.fill('evenodd');
   (it.g||[]).forEach(s=>this.seg(s[0],s[1],s[2],s[3],s[4],s[5]))}
  else if(it.k==='d'){g.fillStyle=it.c;g.beginPath();g.arc(this.X(it.x),this.Y(it.y),it.d/2,0,Math.PI*2);g.fill()}
  else if(it.k==='x'){g.fillStyle=it.c;g.font=it.f;g.textAlign=it.a==='center'?'center':it.a==='right'?'right':'left';g.textBaseline='alphabetic';g.fillText(it.txt,this.X(it.x),this.Y(it.y))}
  else if(it.k==='s'){this.shape(g,it)}
 },
 redraw(){
  if(!this.ctx)return;const g=this.ctx;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,this.cv.width,this.cv.height);
  g.fillStyle=this.bg;g.fillRect(0,0,this.cv.width,this.cv.height);
  this.items.forEach(it=>this.drawItem(it));this.drawTurtles();
 },
 shape(g,t){
  const pts=TSH[t.sh||t.s]||TSH.classic;if(!pts.length)return;
  const a=t.h*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),wid=t.z?t.z[0]:1,ln=t.z?t.z[1]:1;
  g.beginPath();
  pts.forEach((p,i)=>{const sx=p[0]*wid,sy=p[1]*ln;const fx=t.x+sy*ca+sx*sa,fy=t.y+sy*sa-sx*ca;
   i?g.lineTo(this.X(fx),this.Y(fy)):g.moveTo(this.X(fx),this.Y(fy))});
  g.closePath();g.fillStyle=t.fc;g.fill();g.strokeStyle=t.pc;g.lineWidth=1;g.stroke();
 },
 drawTurtles(){
  const g=this.octx;if(!g)return;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,this.ov.width,this.ov.height);
  g.setTransform(this.dpr,0,0,this.dpr,0,0);
  for(const t of this.tur.values())if(t.v)this.shape(g,t);
 }
};
/* ---------- уроки ---------- */
function renderNav(){
 let h='';
 LESSONS.forEach((l,i)=>{
  h+='<button class="li'+(done.includes(i)?' d':'')+'" data-i="'+i+'" aria-current="'+(i===cur)+'"><b>'+CHECK+'</b><span>'+numIn(i)+'. '+esc(l.s||l.t)+'</span></button>';
 });
  $('#nav').innerHTML=h;
 const p=Math.round(done.length/N*100);
 $('#pct').textContent=p+'%';$('#cnt').textContent='Пройдено '+done.length+' з '+N;
 $('#pbar').firstElementChild.style.width=p+'%';$('#pbar').setAttribute('aria-valuenow',p);
}
const PGZ_STEPS='<h4>Як запустити гру на Pygame Zero</h4><ol>'+
 '<li>Встанови Python з <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer">python.org</a> (під час встановлення познач <b>Add Python to PATH</b>).</li>'+
 '<li>Встанови редактор: <a href="https://thonny.org/" target="_blank" rel="noopener noreferrer">Thonny</a> або <a href="https://code.visualstudio.com/" target="_blank" rel="noopener noreferrer">VS Code</a> з розширенням Python.</li>'+
 '<li>Встанови бібліотеку. У терміналі виконай <code>pip install pgzero</code> (у Thonny: <i>Інструменти → Керувати пакунками</i> → знайди <b>pgzero</b> → Встановити).</li>'+
 '<li>Створи папку для гри і файл <code>game.py</code>. Поруч створи папку <code>images</code> для картинок (назви файлів — малими латинськими літерами).</li>'+
 '<li>Напиши код у редакторі курсу, натисни «Скопіювати» і встав його в <code>game.py</code>.</li>'+
 '<li>Запуск у терміналі: перейди в папку гри і виконай <code>pgzrun game.py</code>.</li>'+
 '<li>Запуск у Thonny: увімкни <i>Запуск → Pygame Zero mode</i> і натисни зелену кнопку Run (F5).</li></ol>'+
 '<p class="hint">Порада: можна додати в кінець файлу рядки <code>import pgzrun</code> і <code>pgzrun.go()</code> — тоді гра запуститься звичайною кнопкою Run у будь-якому редакторі.</p>';
/* ---------- Автоперевірка вимог «Перевір себе» ----------
   Для кожного уроку — масив правил у тому ж порядку, що й пункти вимог.
   null — учень відмічає сам. RegExp — шаблон має знайтися в коді.
   'текст' — фрагмент має бути в коді; 'текст*N' — щонайменше N разів.
   [..] — усі умови разом. Функція (code, files) → true/false. */

function autoTest(x,c,f,r){
 if(!x)return false;
 if(Array.isArray(x))return x.every(y=>autoTest(y,c,f,r));
 if(x instanceof RegExp)return x.test(c);
 if(typeof x==='function')return !!x(c,f,r);
 const m=/^(.*)\*(\d+)$/.exec(x);
 if(m){let n=0,i=-1;while((i=c.indexOf(m[1],i+1))>=0)n++;return n>=+m[2]}
 return c.includes(x);
}

// коментарі не зараховуються як код
function noComments(s){return s.split('\n').map(l=>{let q=null;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='\\'){i++;continue}if(ch===q)q=null}else if(ch==='"'||ch==="'")q=ch;else if(ch==='#')return l.slice(0,i)}return l}).join('\n')}
const isBonus=x=>/^\s*Бонус/i.test(String(x).replace(/<[^>]+>/g,''));
let chkAll=false,chkT=0;
const AUTO_ICON='<svg class="ai" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/></svg>';
function evalChecks(fromEdit){
 if(shared||!$('#lesson .chk'))return;
 const l=L(),rules=AUTO[cur]||[],raw=files.map(f=>f[1]).join('\n'),c=noComments(raw),man=store.get('chk:'+cur,[]);
 let all=true;
 l.ok.forEach((x,i)=>{
  const a=!!rules[i]&&autoTest(rules[i],c,files,raw),on=a||man.includes(i);
  const el=$('#lesson .chk input[data-c="'+i+'"]');if(el)el.checked=on;
  if(!isBonus(x)&&!on)all=false;
 });
 if(fromEdit&&all&&!chkAll&&!done.includes(cur)){done=done.concat(cur);store.set('done',done);renderNav();
  const m=$('#mark');if(m){m.classList.add('done');m.setAttribute('aria-pressed','true');m.innerHTML=CHECK+'Виконано'}
  toast('Усі вимоги виконано — урок завершено!')}
 chkAll=all;
}
/* приклади уроку: exs — кілька маленьких програм {t: назва, d: опис, c: код}; ex — один приклад (старий формат) */
const EXS=l=>l.exs||[{c:l.ex||''}];
function renderLesson(){
 const l=L(),d=done.includes(cur),chk=store.get('chk:'+cur,[]);
 $('#lesson').innerHTML=
 '<div class="lp" id="p-th" role="tabpanel" aria-labelledby="t-th">'+
 '<div class="lhd"><h2 class="t">'+esc(l.t)+'</h2>'+(l.sit?'<p class="sit">'+l.sit+'</p>':'')+'</div>'+
 '<div class="card th">'+l.th+
 '<h3 class="sh">Команди</h3>'+l.cm.map(c=>'<div class="cmd"><code>'+esc(c[0])+'</code><span>'+c[1]+'</span></div>').join('')+
 '<h3 class="sh">'+(EXS(l).length>1?'Приклади':'Приклад')+'</h3>'+EXS(l).map((x,k,a)=>'<div class="exh'+(k?' nx':'')+'"><h4>'+(x.t?esc(x.t):a.length>1?'Приклад '+(k+1):'')+'</h4><div class="acts">'+(l.pgz||l.noRun?'':'<button class="btn" data-run="'+k+'" title="Запустити приклад">'+PLAY+'Запустити</button>')+'<button class="btn" data-cp="'+k+'">Копіювати</button></div></div>'+(x.d?'<p class="exd">'+x.d+'</p>':'')+'<pre><code>'+hlPy(x.c)+'</code></pre>').join('')+
 (l.how?'<details class="more"><summary>Розбір прикладів</summary>'+l.how.map(c=>'<div class="cmd"><code>'+esc(c[0])+'</code><span>'+c[1]+'</span></div>').join('')+'</details>':'')+
 (l.err?'<details class="more"><summary>Часті помилки</summary><ul>'+l.err.map(x=>'<li>'+x+'</li>').join('')+'</ul></details>':'')+'</div>'+
 '<button class="btn pr tonext" id="toTask">До завдання →</button></div>'+
 '<div class="lp" id="p-tk" role="tabpanel" aria-labelledby="t-tk">'+
 '<div class="card task"><p class="tq">'+esc(l.task)+'</p>'+
 (l.io?'<h3 class="sub">Як має працювати</h3><pre class="io">'+esc(l.io)+'</pre>':'')+
 '<h3 class="sub">Вимоги</h3><ul class="chk">'+
  l.ok.map((x,i)=>'<li'+((AUTO[cur]||[])[i]?' class="au" title="Перевіряється автоматично"':'')+'><label><input type="checkbox" data-c="'+i+'"'+(chk.includes(i)?' checked':'')+'><span>'+x+((AUTO[cur]||[])[i]?AUTO_ICON:'')+'</span></label></li>').join('')+'</ul>'+
  (l.hints?'<div class="hints">'+l.hints.map((h,i)=>'<details><summary>Підказка '+(i+1)+'</summary><p>'+h+'</p></details>').join('')+'</div>':'')+
  (l.note?'<p class="hint">'+l.note+'</p>':'')+'</div>'+
 ((cur===15||cur===N-1)?QUESTS.filter(q=>q.m===COURSE.g-8||q.m==null).map(q=>qcard(Object.assign({},q,{d:'Перевір себе: '+q.d}))).join(''):'')+
 (cur===N-1&&COURSE.g===8?'<a class="card promo nx" href="'+COURSE.other.url+'"><span class="pt"><small>Курс 8 класу пройдено</small><b>Продовжити в 9 класі</b></span><span class="btn pr pgo">Далі<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>':'')+
 (cur===N-1?$('#promo').outerHTML.replace(' id="promo"','').replace('card promo','card promo sm'):'')+
 '<div class="nav"><button class="btn" id="prev"'+(cur?'':' disabled')+'>← Назад</button><span class="sp"></span>'+
 '<button class="btn'+(d?' done':'')+'" id="mark" aria-pressed="'+d+'">'+(d?CHECK+'Виконано':'Завершити')+'</button>'+
 '<button class="btn pr" id="next">'+(cur===N-1?'На головну →':'Далі →')+'</button></div></div>';
 setTab(tabs[cur]||'th',true);
 $('#toTask').onclick=()=>setTab('tk');
 $('#prev').onclick=()=>go(cur-1);$('#next').onclick=()=>cur===N-1?showHome():go(cur+1);
 $('#mark').onclick=()=>{done=done.includes(cur)?done.filter(x=>x!==cur):done.concat(cur);store.set('done',done);renderNav();renderLesson();toast(done.includes(cur)?'Урок завершено':'Позначку знято')};
 document.querySelectorAll('#p-th [data-run]').forEach(b=>b.onclick=()=>runCode(EXS(l)[+b.dataset.run].c));
 document.querySelectorAll('#p-th [data-cp]').forEach(b=>b.onclick=()=>copyText(EXS(l)[+b.dataset.cp].c).then(()=>toast('Приклад скопійовано'),()=>toast('Не вдалося скопіювати')));
 $('#lesson .chk').onchange=e=>{const c=+e.target.dataset.c;let a=store.get('chk:'+cur,[]);a=e.target.checked?a.concat(c):a.filter(x=>x!==c);store.set('chk:'+cur,a);evalChecks(true)};
 chkAll=false;evalChecks(false);
 pgzUI(l);
}
function pgzUI(l){
 const pg=!!l.pgz;
 $('#run').hidden=pg;$('#out').hidden=pg;$('#pgz').hidden=!pg;
 $('#outT').textContent=pg?'Як запустити':'Результат';
 if(pg)$('#pgz').innerHTML=PGZ_STEPS;
}
function go(i){
 if(i<0||i>=N)return;
 if(R.running)stopCode();
 cur=i;store.set('cur',i);file=0;files=getFiles(i);
 renderNav();renderLesson();loadEditor();
 CON.clear();TK.reset();TT.reset();R.ui();
 closeMenu();window.scrollTo(0,0);syncHash();
}
$('#nav').onclick=e=>{const b=e.target.closest('.li');if(!b)return;if(!b.dataset.home)hideSide();if(b.dataset.home){closeMenu();showHome();if(b.dataset.home==='quests')setTimeout(()=>$('#quests').scrollIntoView(),50)}else go(+b.dataset.i)};

/* ---------- вкладки «Теорія | Завдання» ---------- */
const tabs=store.get('ltab',{}),tpos={};let ltab='th';
function setTab(t,fresh){
 const lw=$('#lw');
 if(!fresh)tpos[ltab]=lw.scrollTop;
 ltab=t;tabs[cur]=t;store.set('ltab',tabs);
 document.querySelectorAll('#ltabs .tab').forEach(b=>{const on=b.dataset.t===t;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;b.innerHTML=(b.dataset.t==='th'?'Теорія':'Завдання')+(b.dataset.t==='tk'&&done.includes(cur)?'<i aria-label="виконано"></i>':'')});
 document.querySelectorAll('#lesson .lp').forEach(p=>p.hidden=p.id!=='p-'+t);
 if(fresh){tpos.th=tpos.tk=0}
 if(matchMedia('(max-width:1100px)').matches){if(!fresh){const y=lw.getBoundingClientRect().top+scrollY-56;if(scrollY>y)scrollTo(0,y)}}
 else lw.scrollTop=tpos[t]||0;
}
$('#ltabs').onclick=e=>{const b=e.target.closest('.tab');if(b&&b.dataset.t!==ltab)setTab(b.dataset.t)};
$('#ltabs').onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setTab(ltab==='th'?'tk':'th');$('#t-'+ltab).focus()}};

/* ---------- бонус ---------- */
const TOOLS=[
 ['https://www.python.org/downloads/','Python','Завантаження мови для комп\'ютера'],
 ['https://thonny.org/','Thonny','Простий редактор Python для початківців'],
 ['https://code.visualstudio.com/','Visual Studio Code','Редактор коду з розширенням Python'],
 ['https://docs.python.org/uk/3/','Документація Python','Офіційний довідник українською'],
 ['https://pythontutor.com/','Python Tutor','Покрокова візуалізація виконання коду'],
 ['https://docs.python.org/uk/3/library/tkinter.html','tkinter','Довідник з графічних інтерфейсів'],
 ['https://docs.python.org/uk/3/library/turtle.html','turtle','Довідник з графіки черепашки'],
 ['https://pygame-zero.readthedocs.io/','Pygame Zero','Документація для створення ігор'],
 ['https://www.codewars.com/','Codewars','Задачі для тренування'],
 ['https://github.com/','GitHub','Зберігання коду та портфоліо'],
 ['https://coddy.tech/','Coddy','Інтерактивні вправи з Python'],
 ['https://grantjenks.com/docs/freegames/','Free Python Games','Готові ігри з відкритим кодом для навчання']];
const VIDEO=[
 ['https://www.youtube.com/@ProgerSchool/courses','Школа програмування','Курси Python, Java, C#, C++ і розробка ігор'],
 ['https://www.youtube.com/playlist?list=PLv_f6irHIrAgATViHBH5JRwrpIiei7t_6','Вивчаємо Python з нуля','Плейлист уроків українською'],
 ['https://www.youtube.com/playlist?list=PL7vq4D0vOpQb-nious5dTzUF9GEMp6jiL','Уроки Python для початківців','Програмування на Python з нуля'],
 ['https://www.youtube.com/playlist?list=PLH1-5V9At2d_ioe0WSqMeE6n5bRt5pPpg','Python для початківців','Ще один плейлист з основ'],
 ['https://www.youtube.com/watch?v=Gye2Na7C8jg','Повний курс Python','Основи мови в одному відео'],
 ['https://ua.pistacja.tv/video-uroky/informatyka/bazova-serednia-osvita-5-9-klasy/8-klas/plinf524-hrafichne-prohramuvannia','Pi-stacja UA · 8 клас','Відеоуроки: графічне програмування'],
 ['https://ua.pistacja.tv/video-uroky/informatyka/bazova-serednia-osvita-5-9-klasy/9-klas/plinf529-alhorytmy-ta-prohramuvannia','Pi-stacja UA · 9 клас','Відеоуроки: алгоритми та програмування'],
 ['https://www.youtube.com/channel/UCMEn7buEQP7j4g_omj6HoGw','Pi-stacja UA','YouTube-канал з відеоуроками українською']];
const PYLOGO='<svg viewBox="361 102 24 24" style="stroke:none"><path d="M373 103c-4 0-5 1.4-5 3.2v2.6h5.3v1.3h-7.5c-2.2 0-3.6 1.8-3.6 4.4s1.4 4.4 3.6 4.4h2.2v-3.1c0-2.2 1.3-3.5 3.5-3.5h4.8c1.8 0 3.1-1.3 3.1-3.1v-3c0-1.8-1.8-3.2-6.4-3.2z" fill="#6f8ad6"/><path d="M373 125c4 0 5-1.4 5-3.2v-2.6h-5.3v-1.3h7.5c2.2 0 3.6-1.8 3.6-4.4s-1.4-4.4-3.6-4.4H378v3.1c0 2.2-1.3 3.5-3.5 3.5h-4.8c-1.8 0-3.1 1.3-3.1 3.1v3c0 1.8 1.8 3.2 6.4 3.2z" fill="#f0c75e"/><circle cx="370.6" cy="105.6" r=".9" fill="#fff"/><circle cx="375.4" cy="122.4" r=".9" fill="#fff"/></svg>';
const GO='<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>';
const QUESTS=[
 {u:'https://whyuxavier.github.io/python-quiz/',t:'Підсумковий квест: Python-змійка',d:'8 клас, квест з рівнями, базові конструкції, Tkinter',m:0,i:PYLOGO},
 {u:'https://whyuxavier.github.io/it-maysternia/apps/python-quest-9/',t:'Підсумковий квест: Основи Python',d:'9 клас, random, списки, словники, Turtle, Tkinter',m:1,i:PYLOGO},
 {u:'https://whyuxavier.github.io/it-maysternia/apps/bug-storm/',t:'Баг-шторм',d:'Гра й тест: виправ помилки в коді Python',i:'<svg viewBox="0 0 24 24" style="stroke:none"><path d="M9 6.5a3 3 0 0 1 6 0z" fill="#f0c75e"/><rect x="6.5" y="7.5" width="11" height="13" rx="5.5" fill="#6f8ad6"/><path d="M12 8.5v11" stroke="#fff" stroke-width="1.4"/><path d="M6.5 11H3.5M6.5 15H3M7.5 19l-2.5 2M17.5 11h3M17.5 15h3.5M16.5 19l2.5 2M10 4.5 8.5 2.5M14 4.5l1.5-2" stroke="#6f8ad6" stroke-width="1.6" stroke-linecap="round"/><circle cx="9.5" cy="12" r="1" fill="#fff"/><circle cx="14.5" cy="16" r="1" fill="#fff"/></svg>'}];
const qcard=q=>'<a class="card qc" href="'+q.u+'" target="_blank" rel="noopener noreferrer"><span class="qi">'+q.i+'</span><span><b>'+esc(q.t)+'</b><span>'+esc(q.d)+'</span></span><span class="go">'+GO+'</span></a>';
$('#qlist').innerHTML=QUESTS.filter(q=>q.m===COURSE.g-8||q.m==null).map(qcard).join('');
const LNK=a=>a.map(x=>'<a class="lk" href="'+x[0]+'" target="_blank" rel="noopener noreferrer"><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></a>').join('');
$('#bonus').innerHTML='<div class="card"><h2>Інструменти</h2><div class="lks">'+LNK(TOOLS)+'</div></div>'+
 '<div class="card"><h2>Безкоштовні відеокурси на YouTube</h2><div class="lks">'+LNK(VIDEO.filter(v=>!/· [89] клас$/.test(v[1])||v[1].endsWith('· '+COURSE.g+' клас')))+'</div></div>';

/* ---------- головна ---------- */
function renderHome(){
 const started=done.length>0||cur>0||store.get('started',false);
 $('#startTx').textContent=started?'Продовжити: урок '+numIn(cur):'Почати навчання';
 const p=Math.round(done.length/N*100);
 $('#hpr').hidden=!done.length;$('#hprTx').textContent=(store.get('name','')?store.get('name','').split(' ')[0]+', пройдено ':'Пройдено ')+done.length+' з '+N+' уроків';$('#hprBar').style.width=p+'%';
 /* програма курсу: етапи з прогресом; у кожного уроку — що учень створить */
 const nx=LESSONS.findIndex((l,i)=>!done.includes(i));
 const st=COURSE.stages||[[COURSE.title,'start',0,N-1]];
 $('#mods').innerHTML=st.map(([t,ic,a,z])=>{
  const ids=[];for(let i=a;i<=Math.min(z,N-1);i++)ids.push(i);
  const dn=ids.filter(i=>done.includes(i)).length;
  return '<div class="card stg'+(dn===ids.length?' full':'')+'"><div class="sth"><span class="sti">'+(STI[ic]||STI.start)+'</span><div class="stn"><b>'+esc(t)+'</b><small>'+dn+' з '+ids.length+'</small>'+
   '<div class="stb"><i style="width:'+Math.round(dn/ids.length*100)+'%"></i></div></div></div><div class="stl">'+
   ids.map(i=>'<button class="ml'+(done.includes(i)?' d':'')+(i===nx?' nx':'')+'" data-i="'+i+'"><b>'+(done.includes(i)?CHECK:numIn(i))+'</b><span>'+esc(LESSONS[i].s||LESSONS[i].t)+(COURSE.mk&&COURSE.mk[i]?'<small>'+esc(COURSE.mk[i])+'</small>':'')+'</span>'+(i===nx?'<em>далі</em>':'')+'</button>').join('')+'</div></div>';
 }).join('');
}
const STI={
 start:'<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
 data:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5"/></svg>',
 loop:'<svg viewBox="0 0 24 24"><path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/></svg>',
 win:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></svg>',
 game:'<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 13.5h.01"/></svg>',
 list:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',
 fn:'<svg viewBox="0 0 24 24"><path d="M8 4c-2 0-3 1-3 3v2c0 1.5-1 3-2 3 1 0 2 1.5 2 3v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.5 1 3 2 3-1 0-2 1.5-2 3v2c0 2-1 3-3 3"/></svg>',
 file:'<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>'
};
/* окреме посилання на кожен урок: …/#urok-1; старі адреси #8-urok-N і #9-urok-N теж працюють */
const LH=i=>'#urok-'+numIn(i);
const hashLesson=()=>{const m=/^#(?:(8|9)-)?urok-(\d+)$/.exec(location.hash);if(!m)return -1;const n=+m[2];
 if(m[1]&&+m[1]!==COURSE.g){location.replace(COURSE.other.url+'#urok-'+n);return -2}
 const i=COURSE.zero?n:n-1;return i>=0&&i<N?i:-2};
const isCourse=()=>location.hash==='#course'||hashLesson()!==-1;
let routed=false;
function syncHash(){if(routed&&!shared&&isCourse()&&location.hash!==LH(cur))history.replaceState(null,'',location.pathname+location.search+LH(cur))}
let homeSeen=false;
function route(){
 if(location.hash.startsWith('#s=')){openShared(location.hash.slice(3));return}
 if(shared){shared=null;document.body.classList.remove('sv');ta.readOnly=false;go(store.get('cur',0))}
 const h=hashLesson();if(h>=0&&h!==cur)go(h);
 routed=true;syncHash();
 const c=isCourse();
 document.body.classList.toggle('home',!c);
 snowSync();
 if(!c){renderHome();if(!homeSeen){homeSeen=true;setTimeout(()=>$('.art').classList.add('done'),7496)}}
 else{store.set('started',true);preloadPy()}
 window.scrollTo(0,0);
}
function openCourse(i){if(i!==undefined&&i!==cur)go(i);if(isCourse())route();else location.hash=LH(cur).slice(1)}
function showHome(){if(isCourse()||shared)history.pushState(null,'',location.pathname+location.search);route()}
$('#start').onclick=()=>openCourse();
$('#mods').onclick=e=>{const b=e.target.closest('.ml');if(b){hideSide();openCourse(+b.dataset.i)}};
$('#toProg').onclick=e=>{e.preventDefault();$('#program').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
$('#logo').onclick=showHome;$('#homeBtn').onclick=showHome;
addEventListener('popstate',route);addEventListener('hashchange',route);
/* ---------- перемикач класу ---------- */
(()=>{const b=$('#gsb'),p=$('#gpop');if(!b)return;
 const close=()=>{p.hidden=true;b.setAttribute('aria-expanded','false')};
 b.onclick=e=>{e.stopPropagation();const o=p.hidden;p.hidden=!o;b.setAttribute('aria-expanded',o);if(o)p.querySelector('a').focus()};
 document.addEventListener('click',e=>{if(!p.hidden&&!e.target.closest('.gsw'))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!p.hidden){close();b.focus()}});
})();
/* ---------- розмір тексту: 1 / 1.15 / 1.3 ---------- */
function setFs(v){v=[1,1.15,1.3].includes(+v)?+v:1;document.documentElement.style.setProperty('--fs',v);store.set('fs',v);
 document.querySelectorAll('#fsz button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===v))}
setFs(store.get('fs',1));
$('#fsz').onclick=e=>{const b=e.target.closest('button');if(b)setFs(b.dataset.v)};
function closeMenu(){$('#side').classList.remove('open');$('#menu').setAttribute('aria-expanded','false')}
/* після вибору уроку меню ховається й на ПК; відкрити знову — кнопкою ☰ */
function hideSide(){if(!matchMedia('(max-width:1100px)').matches&&!ui.side){ui.side=true;store.set('ui',ui);applyUI();$('#menu').setAttribute('aria-expanded','false')}}
const ui=store.get('ui',{});
function applyUI(){
 [['lw','lw'],['ed','p-ed'],['out','p-out']].forEach(([k,id])=>{
  $('#'+id).classList.remove('shut');
 });
 $('main').classList.toggle('nol',!!ui.lw);
 $('.app').classList.toggle('noside',!!ui.side);
 requestAnimationFrame(fitAll);
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.cv');if(!b)return;ui[b.dataset.k]=!ui[b.dataset.k];store.set('ui',ui);applyUI()});
$('#menu').onclick=()=>{
 if(matchMedia('(max-width:1100px)').matches){const o=$('#side').classList.toggle('open');$('#menu').setAttribute('aria-expanded',o)}
 else{ui.side=!ui.side;store.set('ui',ui);applyUI();$('#menu').setAttribute('aria-expanded',!ui.side)}
};
const modal=$('#modal');
function openInfo(){modal.hidden=false;$('#mclose').focus()}
function closeInfo(){modal.hidden=true;$('#info').focus()}
const rz=$('#rz'),mainEl=$('main');
function setLc(w){const m=mainEl.getBoundingClientRect().width-32-10-12-360;w=Math.max(280,Math.min(w,m));mainEl.style.setProperty('--lc',w+'px');ui.lc=w}
rz.onpointerdown=e=>{
 rz.setPointerCapture(e.pointerId);document.body.classList.add('drag');
 const mv=ev=>setLc(ev.clientX-mainEl.getBoundingClientRect().left-19);
 const up=()=>{rz.removeEventListener('pointermove',mv);rz.removeEventListener('pointerup',up);document.body.classList.remove('drag');store.set('ui',ui);fitAll()};
 rz.addEventListener('pointermove',mv);rz.addEventListener('pointerup',up);
};
rz.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setLc($('#lw').getBoundingClientRect().width+(e.key==='ArrowRight'?24:-24));store.set('ui',ui)}};
rz.ondblclick=()=>{mainEl.style.removeProperty('--lc');delete ui.lc;store.set('ui',ui)};
/* ---------- повзунок висоти: редактор ↔ результат ---------- */
const rzh=$('#rzh'),wsEl=$('.ws'),mob=()=>matchMedia('(max-width:1100px)').matches;
function setEr(r){r=Math.max(.15,Math.min(.85,r));wsEl.style.setProperty('--er',(r*100).toFixed(1)+'%');wsEl.classList.add('sized');ui.er=r;requestAnimationFrame(fitAll)}
function setEh(h){h=Math.round(Math.max(160,Math.min(h,innerHeight*1.5)));wsEl.style.setProperty('--eh',h+'px');wsEl.classList.add('sizedm');ui.eh=h;requestAnimationFrame(fitAll)}
const edH=()=>$('#p-ed .ed').getBoundingClientRect().height;
rzh.onpointerdown=e=>{
 e.preventDefault();rzh.setPointerCapture(e.pointerId);document.body.classList.add('dragy');
 const y0=e.clientY,h0=edH(),r=wsEl.getBoundingClientRect(),p0=$('#p-ed').getBoundingClientRect().height;
 const mv=ev=>{if(mob())setEh(h0+ev.clientY-y0);else setEr((p0+ev.clientY-y0)/(r.height-12))};
 const up=()=>{rzh.removeEventListener('pointermove',mv);rzh.removeEventListener('pointerup',up);rzh.removeEventListener('pointercancel',up);document.body.classList.remove('dragy');store.set('ui',ui)};
 rzh.addEventListener('pointermove',mv);rzh.addEventListener('pointerup',up);rzh.addEventListener('pointercancel',up);
};
rzh.onkeydown=e=>{if(e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;e.preventDefault();const d=e.key==='ArrowDown'?1:-1;
 if(mob())setEh(edH()+d*40);else setEr(($('#p-ed').getBoundingClientRect().height+d*40)/(wsEl.getBoundingClientRect().height-12));store.set('ui',ui)};
rzh.ondblclick=()=>{wsEl.classList.remove('sized','sizedm');wsEl.style.removeProperty('--er');wsEl.style.removeProperty('--eh');delete ui.er;delete ui.eh;store.set('ui',ui);requestAnimationFrame(fitAll)};
if(ui.er)setEr(ui.er);if(ui.eh)setEh(ui.eh);
/* ---------- прогрес: файл і шкільний режим ---------- */
$('#schB').hidden=!SCH;$('#schB').onclick=()=>openInfo();
$('#schT').checked=SCH;
$('#acT').checked=AC.on;$('#acT').onchange=e=>{AC.on=e.target.checked};
$('#schT').onchange=e=>{try{if(e.target.checked){localStorage.setItem(SKEY,'1');wipe(localStorage)}else localStorage.removeItem(SKEY)}catch(x){}location.reload()};
$('#pSave').onclick=()=>{
 const data={};keysOf(ST).forEach(k=>{data[k.slice(K.length)]=ST.getItem(k)});
 const d=new Date(),dt=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const b=new Blob([JSON.stringify({app:K,v:1,d:Date.now(),data})],{type:'application/json'});
 const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='learn-python-progres-'+dt+'.json';
 document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(l.href),1000);toast('Прогрес збережено у файл');
};
$('#pLoad').onclick=()=>$('#pFile').click();
$('#pFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 f.text().then(t=>{const j=JSON.parse(t);if(!j||j.app!==K||typeof j.data!=='object')throw 0;
  wipe(ST);Object.keys(j.data).forEach(k=>{try{ST.setItem(K+k,String(j.data[k]))}catch(x){}});location.reload()})
 .catch(()=>toast('Це не файл прогресу цього курсу'));
};
$('#info').onclick=openInfo;$('#mclose').onclick=closeInfo;modal.onclick=e=>{if(e.target===modal)closeInfo()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();if(!modal.hidden)closeInfo();if(!shm.hidden)closeShare();if(!annm.hidden)closeAnn()}});
/* одноразове оголошення про зміни в курсі */
const annm=$('#annm');
function closeAnn(){annm.hidden=true;store.set('ann1',1)}
$('#annok').onclick=closeAnn;$('#annclose').onclick=closeAnn;annm.onclick=e=>{if(e.target===annm)closeAnn()};
if(!store.get('ann1',0)&&!/^#s=/.test(location.hash))setTimeout(()=>{if(shm.hidden&&modal.hidden){annm.hidden=false;$('#annok').focus()}},600);

/* ---------- здача роботи посиланням ---------- */
const b64u=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const ub64=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');const b=atob(s+'==='.slice((s.length+3)%4));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
const pipe=(u,t)=>new Response(new Blob([u]).stream().pipeThrough(t)).arrayBuffer().then(b=>new Uint8Array(b));
async function pack(o){
 const u=new TextEncoder().encode(JSON.stringify(o));
 if(window.CompressionStream){try{return '1'+b64u(await pipe(u,new CompressionStream('deflate-raw')))}catch(e){}}
 return '0'+b64u(u);
}
async function unpack(s){
 let u=ub64(decodeURIComponent(s.slice(1)));
 if(s[0]==='1'){if(!window.DecompressionStream)throw new Error('old');u=await pipe(u,new DecompressionStream('deflate-raw'))}
 return JSON.parse(new TextDecoder().decode(u));
}
const shm=$('#shm');
/* ---------- оцінка роботи за вимогами «Перевір себе»: 1–12 ----------
   Обов'язкові вимоги разом дають 12 балів (або 10, якщо є бонуси — тоді бонуси дають ще 2). */
function gradeOf(i,fl){
 const l=LESSONS[i],rules=AUTO[i]||[],raw=fl.map(f=>f[1]).join('\n'),c=noComments(raw),man=shared?[]:store.get('chk:'+i,[]);
 const B=l.ok.map(isBonus),nm=B.filter(b=>!b).length,nb=B.length-nm,total=nb?10:12,base=Math.floor(total/nm),rem=total%nm;
 let sc=0,k=0;const miss=[];
 l.ok.forEach((x,j)=>{const w=B[j]?2/nb:base+(++k>nm-rem?1:0);
  if((rules[j]&&autoTest(rules[j],c,fl,raw))||man.includes(j))sc+=w;else if(!B[j])miss.push(j+1)});
 return {s:Math.max(1,Math.round(sc)),miss};
}
/* старі черги надсилання в таблицю більше не потрібні */
try{localStorage.removeItem('lp:queue');localStorage.removeItem('lp:sheet')}catch(e){}
function openShare(){
 $('#shl').textContent=L().t;
 $('#shk').value=store.get('klas','');
 $('#shn').value=store.get('name','');$('#shres').hidden=true;$('#shgo').style.display='';shm.hidden=false;$('#shn').focus();
}
function closeShare(){shm.hidden=true;$('#share').focus()}
const mm=$('#mm'),moreB=$('#more');
function closeMore(){mm.hidden=true;moreB.setAttribute('aria-expanded','false')}
moreB.onclick=e=>{e.stopPropagation();mm.hidden=!mm.hidden;moreB.setAttribute('aria-expanded',!mm.hidden);if(!mm.hidden)mm.querySelector('.mi').focus()};
mm.addEventListener('click',()=>closeMore());
document.addEventListener('click',e=>{if(!mm.hidden&&!e.target.closest('.more'))closeMore()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mm.hidden){closeMore();moreB.focus()}});
$('#share').onclick=openShare;$('#shclose').onclick=closeShare;shm.onclick=e=>{if(e.target===shm)closeShare()};
$('#shn').oninput=()=>{$('#shres').hidden=true;$('#shgo').style.display=''};
$('#shn').onkeydown=e=>{if(e.key==='Enter')$('#shgo').click()};
$('#shk').oninput=()=>{$('#shres').hidden=true;$('#shgo').style.display=''};
$('#shk').onkeydown=e=>{if(e.key==='Enter')$('#shgo').click()};
$('#shgo').onclick=async()=>{
 const n=$('#shn').value.trim().replace(/\s+/g,' ');
 const kl=$('#shk').value.trim().toUpperCase().replace(/\s+/g,'').replace(/^(\d+)([А-ЯІЇЄҐ])$/,'$1-$2');
 if(n.length<3){toast('Введи ім\'я та прізвище');$('#shn').focus();return}
 if(!kl){toast('Вкажи клас');$('#shk').focus();return}
 store.set('name',n);store.set('klas',kl);$('#shk').value=kl;
 const g=gradeOf(cur,files);
 const o={n,k:kl,l:cur,d:Date.now(),f:files.map(f=>[f[0],f[1]]),v:COURSE.ver||1,s:g.s,m:g.miss};
 const link=location.origin+location.pathname+'#s='+await pack(o);
 $('#shu').value=link;
 $('#shsc').textContent='Бал за вимогами: '+g.s+' з 12'+(g.miss.length?'. Не виконано: '+g.miss.join(', '):'. Усі вимоги виконано!');
 $('#shres').hidden=false;$('#shgo').style.display='none';$('#shcp').focus();
};
$('#shcp').onclick=()=>copyText($('#shu').value).then(()=>toast('Посилання скопійовано'),()=>{$('#shu').select();toast('Скопіюй вручну: Ctrl+C')});

async function openShared(s){
 let o;
 try{
  o=await unpack(s);
  if(COURSE.g===8&&Number.isInteger(o.l)&&o.l>=16&&o.l<32){o.l-=16;location.replace(COURSE.other.url+'#s='+await pack(o));return}
  if(!(Number.isInteger(o.l)&&o.l>=0&&o.l<N&&Array.isArray(o.f)&&o.f.length))throw 0;
 }catch(e){toast(e&&e.message==='old'?'Онови браузер, щоб відкрити роботу':'Посилання пошкоджене');history.replaceState(null,'',location.pathname+location.search);route();return}
 if(R.running)stopCode();
 shm.hidden=true;
 shared={n:String(o.n||'Без імені').slice(0,60),k:String(o.k||'').slice(0,10),s:Number.isInteger(o.s)&&o.s>=1&&o.s<=12?o.s:0,m:Array.isArray(o.m)?o.m.filter(Number.isInteger).slice(0,12):[],l:o.l,d:o.d,v:o.v||1,f:o.f.slice(0,20).map(f=>[String(f[0]||'main.py').slice(0,40),String(f[1]||'')])};
 document.body.classList.remove('home');document.body.classList.add('sv');snowSync();closeMenu();
 cur=shared.l;files=shared.f.map(f=>[f[0],f[1]]);file=0;ta.readOnly=true;
 renderShared();loadEditor();CON.clear();TK.reset();TT.reset();R.ui();window.scrollTo(0,0);
 preloadPy();
}
function renderShared(){
 const l=LESSONS[shared.l],dt=shared.d?new Date(shared.d).toLocaleString('uk-UA',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}):'';
 $('#lesson').innerHTML='<div class="card svh"><span class="meta">Робота учня</span><div class="who">'+esc(shared.n)+(shared.k?' <span class="kl">'+esc(shared.k)+'</span>':'')+'</div>'+(shared.s?'<div class="svs"><b>'+shared.s+'</b> з 12'+(shared.m&&shared.m.length?' · не виконано: '+shared.m.join(', '):' · усі вимоги виконано')+'</div>':'')+'<div class="meta">'+(shared.v!==(COURSE.ver||1)?'Попередня версія курсу':esc(l.t))+(dt?' · '+dt:'')+'</div>'+
 '<div class="acts"><button class="btn pr" id="svEd">Відкрити в редакторі</button><button class="btn" id="svX">Закрити перегляд</button></div></div>'+
 (shared.v!==(COURSE.ver||1)?'<div class="card task"><p>Робота з попередньої версії курсу: завдання уроку відтоді змінилося.</p></div>':'<div class="card task"><p class="tq">'+esc(l.task)+'</p>'+
 (l.io?'<h3 class="sub">Як має працювати</h3><pre class="io">'+esc(l.io)+'</pre>':'')+
 '<h3 class="sub">Вимоги</h3><ul>'+l.ok.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>');
 $('#lw').scrollTop=0;pgzUI(l);
 let armed=false;
 $('#svEd').onclick=e=>{
  if(!armed){armed=true;e.target.textContent='Замінити мій код цього уроку?';return}
  store.set(codeKey(shared.l),shared.f);store.set('cur',shared.l);location.hash='course';
 };
 $('#svX').onclick=()=>{history.pushState(null,'',location.pathname+location.search);route()};
}
applyUI();if(ui.lc)setLc(ui.lc);
files=getFiles(cur);renderNav();renderLesson();loadEditor();route();

/* ---------- Офлайн-режим (PWA) ---------- */
(()=>{
 if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
 const PYFILES=['pyodide.js','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'];
 const warm=reg=>{
  const w=reg&&(reg.active||reg.waiting||reg.installing);if(!w||!navigator.onLine)return;
  const fontCss=[...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>l.href).filter(h=>/^https?:/.test(h));
  w.postMessage({type:'warm',urls:PYFILES.map(f=>PYO+f),fontCss});
 };
 addEventListener('load',()=>{
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'})
   .then(()=>navigator.serviceWorker.ready).then(reg=>{
    warm(reg);
    addEventListener('online',()=>{reg.update().catch(()=>{});warm(reg)});
   }).catch(()=>{});
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}
 });
})();

/* ---------- Встановлення як застосунок ---------- */
(()=>{
 const ib=$('#instB'),go=$('#instGo'),sec=$('#instM'),insm=$('#insm');
 const ua=navigator.userAgent,
  ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),
  mac=!ios&&/Macintosh/.test(ua)&&/Safari/.test(ua)&&!/Chrome|Chromium|Edg|OPR|Firefox/.test(ua),
  ff=/Firefox|FxiOS/.test(ua),andr=/Android/.test(ua);
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: window-controls-overlay)').matches||navigator.standalone===true;
 const ok=/^https?:$/.test(location.protocol);
 let dp=null;
 const ic=d=>'<span class="ki"><svg viewBox="0 0 24 24">'+d+'</svg></span>';
 const SH=ic('<path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1"/>'),PL=ic('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>'),DOT=ic('<path d="M12 6h.01M12 12h.01M12 18h.01"/>');
 function help(){
  let h;
  if(ios)h='<p>У Safari на iPhone чи iPad:</p><ol><li>Натисни '+SH+' <b>Поділитися</b> внизу або вгорі екрана.</li><li>Обери '+PL+' <b>На екран «Додому»</b> (прогорни список донизу).</li><li>Натисни <b>Додати</b>.</li></ol>';
  else if(mac)h='<p>У Safari на Mac:</p><ol><li>Відкрий меню <b>Файл</b> або натисни '+SH+' <b>Поділитися</b>.</li><li>Обери <b>Додати в Dock</b>.</li></ol>';
  else if(ff&&!andr)h='<p>Firefox на комп\'ютері поки не вміє встановлювати сайти як застосунки. Відкрий курс у <b>Chrome</b> або <b>Edge</b> і натисни кнопку встановлення ще раз.</p>';
  else if(andr)h='<p>На Android:</p><ol><li>Відкрий меню браузера '+DOT+'.</li><li>Обери <b>Додати на головний екран</b> або <b>Встановити застосунок</b>.</li></ol>';
  else h='<p>У Chrome або Edge:</p><ol><li>Натисни значок встановлення праворуч в адресному рядку або відкрий меню '+DOT+'.</li><li>Обери <b>Встановити «Python з нуля»</b> (в Edge: <b>Застосунки → Установити цей сайт як застосунок</b>).</li></ol>';
  $('#insBody').innerHTML=h;
 }
 function openHelp(){help();if(!modal.hidden)modal.hidden=true;insm.hidden=false;$('#insclose').focus()}
 function closeHelp(){insm.hidden=true;(ib.hidden?$('#info'):ib).focus()}
 function sync(){
  const inst=standalone();
  sec.hidden=inst||!ok;
  ib.hidden=inst||!ok||!(dp||ios);
 }
 async function install(){
  if(!dp){openHelp();return}
  const p=dp;dp=null;p.prompt();
  try{const r=await p.userChoice;if(r&&r.outcome==='accepted'){modal.hidden=true}}catch(e){}
  sync();
 }
 ib.onclick=install;go.onclick=install;
 $('#insclose').onclick=closeHelp;insm.onclick=e=>{if(e.target===insm)closeHelp()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!insm.hidden)closeHelp()});
 addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;sync()});
 addEventListener('appinstalled',()=>{dp=null;modal.hidden=true;insm.hidden=true;sync();toast('Застосунок встановлено')});
 matchMedia('(display-mode: standalone)').addEventListener?.('change',sync);
 sync();
})();
