import React,{useEffect,useState}from'react';import{Routes,Route,Navigate,NavLink,useNavigate,useLocation}from'react-router-dom';
import{LayoutDashboard,Users,ClipboardList,FolderKanban,CalendarDays,AlertTriangle,LogOut,Menu,X,Search,Plus,Download,Upload,RefreshCw,CheckCircle2,Clock3,BookOpen,Target,ChevronRight,Filter,FileText,ShieldCheck,BarChart3,Sun,Moon}from'lucide-react';
import api from'./lib/api';
const user=()=>{try{return JSON.parse(localStorage.getItem('l2e_user')||'null')}catch{return null}};
const GROUPS=['Group A','Group B'];
function Protected({children}){return localStorage.getItem('l2e_token')?children:<Navigate to="/login" replace/>}
function AdminOnly({children}){return user()?.role==='admin'?children:<Navigate to="/" replace/>}
function Login(){const[form,setForm]=useState({email:'',password:''}),[error,setError]=useState(''),[busy,setBusy]=useState(false),nav=useNavigate();async function submit(e){e.preventDefault();setBusy(true);setError('');try{const{data}=await api.post('/auth/login',form);localStorage.setItem('l2e_token',data.token);localStorage.setItem('l2e_user',JSON.stringify(data.user));nav('/');}catch(err){setError(err.response?.data?.message||'Unable to sign in. Check the API connection.')}finally{setBusy(false)}}return <div className="login-shell"><div className="login-card"><div className="brand-mark">L2E</div><p className="eyebrow">LEARN2EARN · ABUJA CAMPUS</p><h1>Mentor Portal</h1><p className="muted">Sign in to manage fellow progress, assessments and reporting.</p><form onSubmit={submit}><label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Password<input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>{error&&<div className="error-box">{error}</div>}<button className="primary full" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form><p className="login-hint">Ask your administrator for your sign-in credentials.</p></div></div>}
const logoUrl='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbd071_22NcEVqZ00Vk48O1R2abn2Vb4XK3nhBWn_mEqC2r_dj_IpRIyeo&s=10';
const navItems=[['/','Overview',LayoutDashboard],['/fellows','Fellow register',Users],['/daily','Daily monitoring',ClipboardList],['/projects','Project tracking',FolderKanban],['/assessments','Assessments',Target],['/weekly','Weekly reviews',CalendarDays],['/actions','Action register',AlertTriangle],['/admin/mentor-progress','Mentor progress',BarChart3,'admin'],['/admin/users','User management',ShieldCheck,'admin']];
function Shell({children,theme,onToggleTheme}){
 const[u,setU]=useState(user()),[open,setOpen]=useState(false),loc=useLocation(),nav=useNavigate();
 useEffect(()=>setOpen(false),[loc.pathname]);
 useEffect(()=>{const update=()=>setU(user());window.addEventListener('l2e-profile-updated',update);return()=>window.removeEventListener('l2e-profile-updated',update)},[]);
 useEffect(()=>{let mounted=true;api.get('/auth/me').then(({data})=>{if(!mounted)return;localStorage.setItem('l2e_user',JSON.stringify(data));setU(data)}).catch(error=>{if(error.response?.status!==401)console.error('Unable to refresh account details',error)});return()=>{mounted=false}},[]);
 function logout(){localStorage.clear();nav('/login')}
 return (
  <div className="app-shell">
   <aside className={`sidebar ${open?'show':''}`}>
    <div className="side-brand"><img className="brand-logo" src={logoUrl} alt="Learn2Earn logo"/><div><b>Learn2Earn</b><small>MENTOR PORTAL</small></div><button className="icon-btn mobile-close" onClick={()=>setOpen(false)}><X size={18}/></button></div>
    <div className="campus-pill">ABUJA CAMPUS</div>
    <nav>{navItems.filter(([, , ,role])=>!role||role===u?.role).map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={18}/>{label}</NavLink>)}</nav>
    <div className="sidebar-bottom">
     <NavLink to="/profile" className={({isActive})=>`user-chip ${isActive?'profile-active':''}`} aria-label="Open account profile">
      <div className="avatar">{u?.name?.slice(0,1)||'M'}</div><div><b>{u?.name||'Mentor'}</b><small>{u?.role||'mentor'}</small></div>
     </NavLink>
     <button className="nav-link logout" onClick={logout}><LogOut size={18}/>Sign out</button>
    </div>
   </aside>
   {open&&<div className="scrim" onClick={()=>setOpen(false)}/>}
   <main className="main-area">
    <header className="topbar">
     <button className="icon-btn mobile-menu" onClick={()=>setOpen(true)}><Menu/></button>
     <div>{u?.role==='mentor'&&<p className="eyebrow">{(u.groups||['Group B']).join(' · ').toUpperCase()}</p>}<h2>{loc.pathname==='/profile'?'Profile settings':navItems.find(x=>x[0]===loc.pathname)?.[1]||'Mentor Portal'}</h2></div>
     <div className="topbar-right"><span className="live-dot">●</span><span>{u?.role==='admin'?'Management workspace':'Mentor workspace'}</span><div className="avatar top-avatar">{u?.name?.slice(0,1)||'M'}</div></div>
     <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme==='dark'?'light':'dark'} mode`} title={`Switch to ${theme==='dark'?'light':'dark'} mode`}>{theme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button>
    </header>
    <div className="page-content">{children}</div>
    <footer>Learn2Earn Mentor Portal <span>·</span> Evidence-led mentorship and accountability</footer>
   </main>
  </div>
 )
}
function PageTitle({title,sub,action}){return <div className="page-title"><div><h1>{title}</h1><p>{sub}</p></div>{action}</div>}
function Stat({label,value,sub,icon:Icon,tone='blue'}){return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div><span>{label}</span><strong>{value??'—'}</strong><small>{sub}</small></div></div>}
function Badge({children}){const s=String(children||'Not set').toLowerCase().replaceAll(' ','-');return <span className={`badge ${s}`}>{children||'Not set'}</span>}
function Dashboard(){
 const[data,setData]=useState(null),[loading,setLoading]=useState(true);
 async function load(){setLoading(true);try{setData((await api.get('/dashboard')).data)}catch(error){console.error(error)}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 const currentUser=user(),isAdmin=currentUser?.role==='admin',scope=(currentUser?.groups||['Group B']).join(' and ');
 const mentorRows=[...(data?.byMentor||[])].sort((a,b)=>a._id.localeCompare(b._id));
 return <><PageTitle title={isAdmin?'Campus overview':`${scope} overview`} sub="A live view of fellow progress, mentor workload and outstanding interventions." action={<button className="secondary" onClick={load}><RefreshCw size={16}/> Refresh data</button>}/>
  {loading&&!data?<div className="loading">Loading dashboard…</div>:<><div className="stat-grid"><Stat label="Total fellows" value={data?.total} sub={isAdmin?'Active fellows across all groups':`Active ${scope} roster`} icon={Users}/><Stat label="On track" value={data?.onTrack} sub="Current standing" icon={CheckCircle2} tone="green"/><Stat label="Need attention" value={data?.needsAttention} sub="Follow-up recommended" icon={Clock3} tone="amber"/><Stat label="At risk / escalated" value={(data?.atRisk||0)+(data?.escalated||0)} sub={`${data?.atRisk||0} at risk · ${data?.escalated||0} escalated`} icon={AlertTriangle} tone="red"/></div>
   <div className="two-col"><section className="panel"><div className="panel-head"><div><h3>Mentor allocation</h3><p>Current group distribution</p></div><Users size={19}/></div>
    {mentorRows.length?mentorRows.map((mentor,index)=><div className="mentor-row" key={mentor._id}><div className={`mentor-initial ${index%2?'violet':''}`}>{mentor._id?.slice(0,1).toUpperCase()||'M'}</div><div className="mentor-info"><b>{mentor._id}</b><small>Assigned fellows</small><div className="progress"><i className={index%2?'violet-bar':''} style={{width:`${Math.min(100,mentor.count/Math.max(data?.total||0,1)*100)}%`}}/></div></div><strong>{mentor.count}</strong></div>):<Empty text="No mentor assignments found for this group."/>}
    <div className="split-note">{data?.total||0} active fellows in this view. Assignments can be changed in the Fellow Register.</div>
   </section><section className="panel"><div className="panel-head"><div><h3>Monitoring signals</h3><p>Items requiring mentor attention</p></div><Filter size={18}/></div><div className="signal-list"><div><span><BookOpen size={16}/> LMS inactive</span><b>{data?.lmsInactive??0}</b></div><div><span><FolderKanban size={16}/> Projects blocked</span><b>{data?.blocked??0}</b></div><div><span><AlertTriangle size={16}/> Open follow-up actions</span><b>{data?.openActions??0}</b></div><div><span><ClipboardList size={16}/> Daily entries today</span><b>{data?.dailyToday??0}</b></div></div></section></div>
   <div className="two-col lower-grid"><section className="panel"><div className="panel-head"><div><h3>Open follow-up actions</h3><p>Outstanding fellow interventions</p></div><NavLink to="/actions" className="text-link">View all <ChevronRight size={15}/></NavLink></div>{data?.recentActions?.length?<div className="compact-list">{data.recentActions.map(action=><div className="compact-row" key={action._id}><div><b>{action.fellow?.name||'Fellow'}</b><small>{action.issue}</small></div><Badge>{action.priority}</Badge></div>)}</div>:<Empty text="No outstanding actions. Add an action when a fellow needs follow-up."/>}</section><section className="panel"><div className="panel-head"><div><h3>Recent assessments</h3><p>Latest recorded assessment outcomes</p></div><NavLink to="/assessments" className="text-link">Assess fellows <ChevronRight size={15}/></NavLink></div>{data?.recentAssessments?.length?<div className="compact-list">{data.recentAssessments.map(assessment=><div className="compact-row" key={assessment._id}><div><b>{assessment.fellow?.name||'Fellow'}</b><small>{new Date(assessment.date).toLocaleDateString()} · {assessment.score}%</small></div><Badge>{assessment.outcome}</Badge></div>)}</div>:<Empty text="No assessments recorded yet."/>}</section></div>
  </>}
 </>
}
function Empty({text}){return <div className="empty"><div className="empty-icon"><FileText size={20}/></div>{text}</div>}
function useFellows(initialParams={}){const[data,setData]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState('');async function reload(params={}){setBusy(true);try{const r=await api.get('/fellows',{params});setData(r.data);setError('')}catch(e){setError(e.response?.data?.message||'Could not load fellows')}finally{setBusy(false)}}useEffect(()=>{reload(initialParams)},[]);return{data,busy,error,reload,setData}}
function Modal({title,close,children,wide=false}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className={`modal ${wide?'wide':''}`}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={close}><X size={19}/></button></div>{children}</div></div>}
function Field({label,children,wide=false}){return <label className={`field ${wide?'span-2':''}`}>{label}{children}</label>}
const select=(opts,placeholder='Select…')=><><option value="">{placeholder}</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</>;
function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let index=0;index<text.length;index++){
  const character=text[index];
  if(character==='"'){
   if(quoted&&text[index+1]==='"'){cell+='"';index++}
   else quoted=!quoted;
  }else if(character===','&&!quoted){row.push(cell);cell=''}
  else if((character==='\n'||character==='\r')&&!quoted){
   if(character==='\r'&&text[index+1]==='\n')index++;
   row.push(cell);if(row.some(value=>value.trim()))rows.push(row);
   row=[];cell='';
  }else cell+=character;
 }
 if(quoted)throw new Error('The CSV has an unclosed quoted field.');
 if(cell.length||row.length){row.push(cell);if(row.some(value=>value.trim()))rows.push(row)}
 return rows;
}
const normalizeCSVHeader=value=>String(value||'').replace(/^\uFEFF/,'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
function FellowForm({fellow,onClose,onSaved,initialGroup='Group B'}){
 const currentUser=user();
 const defaultGroup=currentUser?.role==='mentor'?(currentUser.groups?.[0]||initialGroup):initialGroup;
 const[form,setForm]=useState(fellow||{name:'',assignedMentor:currentUser?.role==='mentor'?currentUser.name:'',group:defaultGroup,campus:'Abuja',overallStanding:'On track',projectStatus:'Not started',lmsStatus:'Not checked'});
 const[mentors,setMentors]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const set=(key,value)=>setForm(previous=>({...previous,[key]:value}));
 useEffect(()=>{api.get('/auth/mentors').then(({data})=>{setMentors(data);setForm(previous=>{const eligible=data.filter(mentor=>mentor.groups?.includes(previous.group));return {...previous,assignedMentor:eligible.some(mentor=>mentor.name===previous.assignedMentor)?previous.assignedMentor:eligible[0]?.name||''}})}).catch(err=>setError(err.response?.data?.message||'Unable to load mentor accounts'))},[]);
 const mentorOptions=mentors.filter(mentor=>mentor.groups?.includes(form.group));
 if(form.assignedMentor&&!mentorOptions.some(mentor=>mentor.name===form.assignedMentor))mentorOptions.unshift({name:form.assignedMentor,groups:[form.group]});
 function changeGroup(group){setForm(previous=>({...previous,group,assignedMentor:mentors.find(mentor=>mentor.groups?.includes(group))?.name||''}))}
 async function save(event){event.preventDefault();setBusy(true);setError('');try{if(fellow)await api.patch(`/fellows/${fellow._id}`,form);else await api.post('/fellows',form);onSaved();onClose()}catch(err){setError(err.response?.data?.message||'Unable to save fellow')}finally{setBusy(false)}}
 return <Modal title={fellow?'Edit fellow':'Add fellow'} close={onClose} wide><form onSubmit={save} className="form-grid">
  <Field label="Fellow name"><input required value={form.name} onChange={event=>set('name',event.target.value)}/></Field>
  <Field label="Assigned mentor"><select required disabled={currentUser?.role==='mentor'||!mentorOptions.length} value={form.assignedMentor} onChange={event=>set('assignedMentor',event.target.value)}>{mentorOptions.map(mentor=><option key={mentor.name} value={mentor.name}>{mentor.name}</option>)}</select></Field>
  <Field label="Campus"><input value={form.campus||''} onChange={event=>set('campus',event.target.value)}/></Field><Field label="Group"><select disabled={currentUser?.role==='mentor'} value={form.group||'Group B'} onChange={event=>changeGroup(event.target.value)}>{GROUPS.map(group=><option key={group} value={group}>{group}</option>)}</select></Field>
  <Field label="Current project"><input value={form.currentProject||''} onChange={event=>set('currentProject',event.target.value)}/></Field><Field label="Project status"><select value={form.projectStatus||''} onChange={event=>set('projectStatus',event.target.value)}>{select(['Not started','Planning','In progress','Testing','Completed','Blocked'])}</select></Field>
  <Field label="Development mode"><select value={form.developmentMode||''} onChange={event=>set('developmentMode',event.target.value)}>{select(['Developed from scratch','Vibe coded','Coded along with AI'])}</select></Field><Field label="AI / vibe-coded contribution"><select value={form.aiContribution||''} onChange={event=>set('aiContribution',event.target.value)}>{select(['0%','25%','50%','75%','90%'])}</select></Field>
  <Field label="LMS status"><select value={form.lmsStatus||''} onChange={event=>set('lmsStatus',event.target.value)}>{select(['On track','Behind','Inactive','Not checked'])}</select></Field><Field label="Overall standing"><select value={form.overallStanding||''} onChange={event=>set('overallStanding',event.target.value)}>{select(['On track','Needs attention','At risk','Escalated'])}</select></Field>
  <Field label="Learning progress / modules" wide><textarea rows="2" value={form.learningProgress||''} onChange={event=>set('learningProgress',event.target.value)}/></Field><Field label="Key strengths"><textarea rows="2" value={form.strengths||''} onChange={event=>set('strengths',event.target.value)}/></Field>
  <Field label="Current performance gap"><textarea rows="2" value={form.performanceGap||''} onChange={event=>set('performanceGap',event.target.value)}/></Field><Field label="Evidence / portfolio link"><input value={form.evidenceLink||''} onChange={event=>set('evidenceLink',event.target.value)}/></Field><Field label="Coding mentor remark"><textarea rows="2" value={form.codingMentorRemark||''} onChange={event=>set('codingMentorRemark',event.target.value)}/></Field>
  {error&&<div className="error-box span-2">{error}</div>}<div className="form-actions span-2"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy?'Saving…':'Save fellow'}</button></div>
 </form></Modal>
}
function Fellows(){
 const currentUser=user(),availableGroups=currentUser?.role==='admin'?GROUPS:(currentUser?.groups?.length?currentUser.groups:['Group B']);
 const[group,setGroup]=useState(availableGroups[0]);
 const{data,busy,error,reload}=useFellows({group});
 const[search,setSearch]=useState(''),[mentor,setMentor]=useState(''),[standing,setStanding]=useState(''),[modal,setModal]=useState(null),[message,setMessage]=useState(''),[mentors,setMentors]=useState([]),[mentorError,setMentorError]=useState('');
 const[importing,setImporting]=useState(false),[importNotice,setImportNotice]=useState(null),[importIssues,setImportIssues]=useState([]);
 const fileInput=React.useRef(null);
 useEffect(()=>{api.get('/auth/mentors').then(({data})=>setMentors(data)).catch(err=>setMentorError(err.response?.data?.message||'Unable to load mentor accounts'))},[]);
 const mentorNames=mentors.filter(item=>item.groups?.includes(group)).map(item=>item.name);
 const filtered=data.filter(f=>(!group||f.group===group)&&(!search||f.name.toLowerCase().includes(search.toLowerCase()))&&(!mentor||f.assignedMentor===mentor)&&(!standing||f.overallStanding===standing));
 async function archive(fellow){if(!confirm(`Archive ${fellow.name}?`))return;try{await api.delete(`/fellows/${fellow._id}`);setMessage('Fellow archived');reload({group})}catch(error){setMessage(error.response?.data?.message||'Unable to archive fellow')}}
 function exportCSV(){const rows=[['Fellow ID','Name','Group','Mentor','Project','Project status','LMS status','Standing'],...filtered.map(fellow=>[fellow.fellowId,fellow.name,fellow.group,fellow.assignedMentor,fellow.currentProject,fellow.projectStatus,fellow.lmsStatus,fellow.overallStanding])];const csv=rows.map(row=>row.map(value=>`"${String(value??'').replaceAll('"','""')}"`).join(',')).join('\n');const anchor=document.createElement('a');anchor.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));anchor.download=`learn2earn-${group.toLowerCase().replace(' ','-')}-fellows.csv`;anchor.click();URL.revokeObjectURL(anchor.href)}
 function downloadCSVTemplate(){const anchor=document.createElement('a');anchor.href=URL.createObjectURL(new Blob(['Fellow name,Assigned mentor\n'],{type:'text/csv'}));anchor.download=`${group.toLowerCase().replace(' ','-')}-fellows-template.csv`;anchor.click();URL.revokeObjectURL(anchor.href)}
 async function importCSV(event){
  const file=event.target.files?.[0];if(!file)return;
  setImportNotice(null);setImportIssues([]);setMessage('');
  try{
   const records=parseCSV((await file.text()).replace(/^\uFEFF/,''));
   if(!records.length)throw new Error('The CSV file is empty.');
   if(records.length<2)throw new Error('The CSV contains headers but no fellow rows.');
   if(records.length>501)throw new Error('Import up to 500 fellows at a time.');
   const headers=records[0].map(normalizeCSVHeader);
   const nameIndex=headers.findIndex(header=>['fellowname','name'].includes(header));
   const mentorIndex=headers.findIndex(header=>['assignedmentor','mentor'].includes(header));
   if(nameIndex<0||mentorIndex<0)throw new Error('CSV headers must include “Fellow name” and “Assigned mentor”.');
   const fields={group:'group',campus:'campus',fellowid:'fellowId',currentproject:'currentProject',projectstatus:'projectStatus',developmentmode:'developmentMode',aicontribution:'aiContribution',lmsstatus:'lmsStatus',learningprogress:'learningProgress',overallstanding:'overallStanding',strengths:'strengths',performancegap:'performanceGap',evidencelink:'evidenceLink',codingmentorremark:'codingMentorRemark',attendancereliability:'attendanceReliability'};
   const rows=records.slice(1);let created=0;const issues=[];
   setImporting(true);
   for(let index=0;index<rows.length;index++){
    const row=rows[index],rowNumber=index+2;
    const valueAt=column=>String(row[column]||'').trim();
    const name=valueAt(nameIndex),assignedMentor=valueAt(mentorIndex);
    if(!name||!assignedMentor){issues.push(`Row ${rowNumber}: Fellow name and Assigned mentor are required.`);continue}
    const payload={name,assignedMentor,group};
    headers.forEach((header,column)=>{
     const key=fields[header],value=valueAt(column);
     if(key&&value)payload[key]=key==='group'?(value.toLowerCase()==='group a'?'Group A':value.toLowerCase()==='group b'?'Group B':value):value;
    });
    try{await api.post('/fellows',payload);created++}
    catch(error){issues.push(`Row ${rowNumber} (${name}): ${error.response?.data?.message||'Unable to import this fellow.'}`)}
   }
   setImportIssues(issues.slice(0,20));
   setImportNotice({failed:issues.length>0,text:`Imported ${created} fellow${created===1?'':'s'}${issues.length?`; ${issues.length} row${issues.length===1?'':'s'} need attention`:'.'}`});
   if(created)reload({group});
  }catch(error){setImportNotice({failed:true,text:error.message||'Unable to read this CSV file.'})}
  finally{setImporting(false);event.target.value=''}
 }
 return <><PageTitle title="Fellow register" sub="Manage the roster, mentor assignments and each fellow's current performance profile." action={<><button className="secondary" onClick={exportCSV}><Download size={16}/> Export CSV</button>{currentUser?.role==='admin'&&<><button className="secondary" disabled={importing} onClick={()=>fileInput.current?.click()}><Upload size={16}/>{importing?'Importing…':'Import CSV'}</button><button className="secondary" onClick={downloadCSVTemplate}><Download size={16}/> CSV template</button><input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={importCSV}/><button className="primary" onClick={()=>setModal({})}><Plus size={17}/> Add fellow</button></>}</>}/>
  {message&&<div className="success-box">{message}<button onClick={()=>setMessage('')}>Dismiss</button></div>}{mentorError&&<div className="error-box">{mentorError}</div>}
  {importNotice&&<div className={importNotice.failed?'error-box':'success-box'}>{importNotice.text}</div>}
  {importIssues.length>0&&<div className="error-box import-issues"><strong>First {importIssues.length} import issue{importIssues.length===1?'':'s'}:</strong><ul>{importIssues.map((issue,index)=><li key={index}>{issue}</li>)}</ul></div>}
  <div className="panel table-panel"><div className="table-toolbar"><div className="searchbox"><Search size={17}/><input placeholder="Search fellows by name…" value={search} onChange={event=>setSearch(event.target.value)}/></div>{availableGroups.length>1&&<select value={group} onChange={event=>{setGroup(event.target.value);setMentor('');reload({group:event.target.value})}} aria-label="Group">{availableGroups.map(value=><option key={value} value={value}>{value}</option>)}</select>}<select value={mentor} onChange={event=>setMentor(event.target.value)}>{select(mentorNames,'All mentors')}</select><select value={standing} onChange={event=>setStanding(event.target.value)}>{select(['On track','Needs attention','At risk','Escalated'],'All standings')}</select><button className="icon-btn" onClick={()=>reload({group})}><RefreshCw size={17}/></button></div>
   {busy?<div className="loading">Loading fellows…</div>:error?<div className="error-box">{error}</div>:<div className="table-wrap"><table><thead><tr><th>Fellow</th><th>Group</th><th>Mentor</th><th>Project</th><th>LMS</th><th>Standing</th><th>Actions</th></tr></thead><tbody>{filtered.map(fellow=><tr key={fellow._id}><td><div className="name-cell"><b>{fellow.name}</b><small>{fellow.fellowId}</small></div></td><td>{fellow.group}</td><td>{fellow.assignedMentor}</td><td><div className="name-cell"><span>{fellow.currentProject||'Not specified'}</span><small>{fellow.projectStatus}</small></div></td><td><Badge>{fellow.lmsStatus}</Badge></td><td><Badge>{fellow.overallStanding}</Badge></td><td><div className="row-actions"><button onClick={()=>setModal(fellow)}>Edit</button><button className="danger-text" onClick={()=>archive(fellow)}>Archive</button></div></td></tr>)}</tbody></table>{!filtered.length&&<Empty text={data.length?'No fellows match these filters.':currentUser?.role==='admin'?`No fellows loaded for ${group}. Run npm run seed in the server directory using the same MONGODB_URI as the API to load the seeded roster and mentor accounts.`:'No fellows are currently available in your assigned group.'}/>}</div>}
   <div className="table-foot">Showing {filtered.length} of {data.length} active fellows</div>
  </div>{modal&&<FellowForm fellow={modal._id?modal:null} initialGroup={group} onClose={()=>setModal(null)} onSaved={()=>{reload({group});setMessage('Fellow record saved')}}/>}
 </>
}
const ratingFields=[['problemUnderstanding','Problem understanding'],['technicalExplanation','Technical explanation'],['codeQuality','Code quality / structure'],['debugging','Debugging / problem solving'],['independentModification','Independent modification'],['lmsConsistency','Learning / LMS consistency'],['delivery','Delivery / milestones'],['professionalism','Professionalism / collaboration']];
function RecordPage({kind}){
 const cfg={daily:{title:'Daily monitoring',sub:'Capture attendance, learning activity, project progress, evidence and interventions.',endpoint:'/records/daily'},assessments:{title:'Fellow assessments',sub:'Assess demonstrated understanding, technical ability, independence and delivery.',endpoint:'/records/assessments'},weekly:{title:'Weekly reviews',sub:'Document weekly progress, project milestones, performance gaps and management support.',endpoint:'/records/weekly'},actions:{title:'Action register',sub:'Track interventions, deadlines, accountability and escalations until closure.',endpoint:'/records/actions'},projects:{title:'Project tracking',sub:'Review each fellow’s project status, development approach and evidence of ownership.',endpoint:'/fellows'}}[kind];
 const currentUser=user(),availableGroups=currentUser?.role==='admin'?GROUPS:(currentUser?.groups?.length?currentUser.groups:['Group B']);
 const[group,setGroup]=useState(availableGroups[0]);
 const[rows,setRows]=useState([]),[fellows,setFellows]=useState([]),[busy,setBusy]=useState(true),[modal,setModal]=useState(false),[filter,setFilter]=useState(''),[msg,setMsg]=useState('');
 async function load(selectedGroup=group){setBusy(true);setMsg('');try{const params={group:selectedGroup,limit:500};const [r,f]=await Promise.all([api.get(cfg.endpoint,{params}),api.get('/fellows',{params:{group:selectedGroup}})]);setRows(r.data);setFellows(f.data)}catch(error){setMsg(error.response?.data?.message||'Unable to load records')}finally{setBusy(false)}}
 useEffect(()=>{load(group)},[kind,group]);
 const scopedRows=kind==='projects'?rows.filter(row=>row.group===group):rows.filter(row=>row.fellow?.group===group);
 const shown=scopedRows.filter(row=>{const name=row.fellow?.name||row.name||'';return !filter||name.toLowerCase().includes(filter.toLowerCase())});
 async function remove(id){if(!confirm('Delete this record?'))return;try{await api.delete(`${cfg.endpoint}/${id}`);load()}catch(error){setMsg(error.response?.data?.message||'Unable to delete record')}}
 function csv(){const data=shown.map(row=>({...row,fellow:row.fellow?.name||row.name}));const keys=kind==='projects'?['name','fellowId','group','assignedMentor','currentProject','projectStatus','developmentMode','aiContribution','lmsStatus','overallStanding']:Object.keys(data[0]||{}).filter(key=>!['_id','__v','createdAt','updatedAt'].includes(key));const output=[keys.join(','),...data.map(row=>keys.map(key=>`"${String(row[key]??'').replaceAll('"','""')}"`).join(','))].join('\n');const anchor=document.createElement('a');anchor.href=URL.createObjectURL(new Blob([output],{type:'text/csv'}));anchor.download=`learn2earn-${group.toLowerCase().replace(' ','-')}-${kind}.csv`;anchor.click()}
 const canAdd=kind!=='projects'||currentUser?.role==='admin';
 return <><PageTitle title={cfg.title} sub={cfg.sub} action={<><button className="secondary" onClick={csv}><Download size={16}/> Export CSV</button>{canAdd&&<button className="primary" onClick={()=>setModal(true)}><Plus size={17}/> {kind==='projects'?'Add fellow':kind==='daily'?'Daily entry':kind==='weekly'?'Weekly review':kind==='actions'?'New action':'New assessment'}</button>}</>}/>
  {msg&&<div className="error-box">{msg}</div>}
  <div className="panel table-panel"><div className="table-toolbar"><div className="searchbox"><Search size={17}/><input placeholder="Filter by fellow name…" value={filter} onChange={event=>setFilter(event.target.value)}/></div>{availableGroups.length>1&&<select value={group} onChange={event=>setGroup(event.target.value)} aria-label="Group">{availableGroups.map(value=><option key={value} value={value}>{value}</option>)}</select>}<button className="icon-btn" onClick={()=>load()}><RefreshCw size={17}/></button></div>
   {busy?<div className="loading">Loading…</div>:kind==='projects'?<ProjectTable rows={shown} onEdit={fellow=>setModal(fellow)}/>:<RecordTable kind={kind} rows={shown} onDelete={remove}/>}<div className="table-foot">{shown.length} records</div>
  </div>
  {modal&&kind!=='projects'&&<RecordForm kind={kind} fellows={fellows} onClose={()=>setModal(false)} onSaved={()=>{setModal(false);load()}}/>}
  {modal&&kind==='projects'&&<FellowForm fellow={modal._id?modal:null} initialGroup={group} onClose={()=>setModal(false)} onSaved={()=>{setModal(false);load()}}/>}
 </>
}
function ProjectTable({rows,onEdit}){return <div className="table-wrap"><table><thead><tr><th>Fellow</th><th>Mentor</th><th>Project</th><th>Development mode</th><th>AI contribution</th><th>Status</th><th>Standing</th><th></th></tr></thead><tbody>{rows.map(f=><tr key={f._id}><td><b>{f.name}</b></td><td>{f.assignedMentor}</td><td>{f.currentProject||'Not specified'}</td><td>{f.developmentMode||'Not recorded'}</td><td>{f.aiContribution||'Not recorded'}</td><td><Badge>{f.projectStatus}</Badge></td><td><Badge>{f.overallStanding}</Badge></td><td><button className="table-button" onClick={()=>onEdit(f)}>Update</button></td></tr>)}</tbody></table>{!rows.length&&<Empty text="No project records found."/>}</div>}
function RecordTable({kind,rows,onDelete}){const fields={daily:[['fellow','Fellow'],['date','Date'],['mentor','Mentor'],['attendance','Attendance'],['taskStatus','Task'],['lmsStatus','LMS'],['projectStatus','Project']],assessments:[['fellow','Fellow'],['date','Date'],['mentor','Mentor'],['score','Score'],['outcome','Outcome']],weekly:[['fellow','Fellow'],['weekStarting','Week starting'],['mentor','Mentor'],['projectStatus','Project status'],['managementIntervention','Management support']],actions:[['fellow','Fellow'],['dateRaised','Date raised'],['mentor','Mentor'],['priority','Priority'],['issue','Issue'],['dueDate','Due date'],['status','Status']]}[kind];return <div className="table-wrap"><table><thead><tr>{fields.map(([k,l])=><th key={k}>{l}</th>)}<th>Action</th></tr></thead><tbody>{rows.map(r=><tr key={r._id}>{fields.map(([k])=><td key={k}>{k==='fellow'?r.fellow?.name||'—':k.toLowerCase().includes('date')||k==='weekStarting'?r[k]?new Date(r[k]).toLocaleDateString():'—':k==='score'?r[k]!=null?`${r[k]}%`:'Pending':typeof r[k]==='boolean'?r[k]?'Yes':'No':r[k]||'—'}</td>)}<td><button className="danger-text" onClick={()=>onDelete(r._id)}>Delete</button></td></tr>)}</tbody></table>{!rows.length&&<Empty text="No records yet. Use the button above to create the first entry."/>}</div>}
function RecordForm({kind,fellows,onClose,onSaved}){const[f,setF]=useState({date:new Date().toISOString().slice(0,10),weekStarting:'',weekEnding:'',mentor:'Justin',attendance:'Present',taskStatus:'Not assigned',lmsStatus:'Not checked',projectStatus:'In progress',priority:'Medium',status:'Open',managementIntervention:false,escalationRequired:false,developmentMode:'Developed from scratch',aiContribution:'0%'}),[busy,setBusy]=useState(false),[err,setErr]=useState('');const set=(k,v)=>setF(p=>({...p,[k]:v}));const chosen=fellows.find(x=>x._id===f.fellow);async function submit(e){e.preventDefault();setBusy(true);setErr('');try{const payload={...f,mentor:chosen?.assignedMentor||f.mentor};await api.post(`/records/${kind}`,payload);onSaved()}catch(e){setErr(e.response?.data?.message||'Unable to save. Check required fields and duplicate date entries.')}finally{setBusy(false)}}const field=(label,key,type='text',opts=null,wide=false)=><Field label={label} wide={wide}>{opts?<select value={f[key]??''} onChange={e=>set(key,e.target.value)}>{select(opts)}</select>:type==='textarea'?<textarea rows="2" value={f[key]||''} onChange={e=>set(key,e.target.value)}/>:type==='checkbox'?<input type="checkbox" checked={!!f[key]} onChange={e=>set(key,e.target.checked)}/>:<input type={type} value={f[key]??''} onChange={e=>set(key,e.target.value)} />}</Field>;return <Modal title={kind==='daily'?'Record daily monitoring':kind==='assessments'?'New fellow assessment':kind==='weekly'?'Create weekly review':'Create follow-up action'} close={onClose} wide><form className="form-grid" onSubmit={submit}><Field label="Fellow"><select required value={f.fellow||''} onChange={e=>set('fellow',e.target.value)}><option value="">Select fellow…</option>{fellows.map(x=><option key={x._id} value={x._id}>{x.name} · {x.assignedMentor}</option>)}</select></Field>{kind==='daily'&&<>{field('Date','date','date')}{field('Attendance','attendance','text',['Present','Absent','Late','Approved absence'])}{field('Daily objective / assigned task','objective','textarea',null,true)}{field('Task status','taskStatus','text',['Completed','Partially completed','Not completed','Not assigned'])}{field('Learning / LMS activity','learningActivity','textarea',null,true)}{field('LMS status','lmsStatus','text',['On track','Behind','Inactive','Not checked'])}{field('Project work / milestone','projectWork','textarea',null,true)}{field('Project status','projectStatus','text',['Not started','Planning','In progress','Testing','Completed','Blocked'])}{['productivity','understanding','independence','participation'].map(k=>field(`${k[0].toUpperCase()+k.slice(1)} (1-5)`,k,'number'))}{field('Blocker / challenge','blocker','textarea')}{field('Mentor intervention / support','intervention','textarea')}{field('Evidence checked','evidenceChecked','textarea')}{field('Evidence link','evidenceLink')}{field('Next action / deadline','nextAction','textarea',null,true)}{field('Escalation required','escalationRequired','checkbox')}{field('Mentor notes','notes','textarea',null,true)}</>}{kind==='assessments'&&<>{field('Assessment date','date','date')}{field('Project title','projectTitle')}{field('Development mode','developmentMode','text',['Developed from scratch','Vibe coded','Coded along with AI'])}{field('AI / vibe-coded contribution','aiContribution','text',['0%','25%','50%','75%','90%'])}{ratingFields.map(([k,l])=>field(`${l} (1-5)`,k,'number'))}{field('Evidence reviewed','evidenceReviewed','textarea',null,true)}{field('Assessment remarks','remarks','textarea',null,true)}{field('Improvement plan','improvementPlan','textarea',null,true)}</>}{kind==='weekly'&&<>{field('Week starting','weekStarting','date')}{field('Week ending','weekEnding','date')}{field('Attendance summary','attendanceSummary','textarea',null,true)}{field('Learning / LMS progress','learningProgress','textarea',null,true)}{field('Project milestones achieved','milestones','textarea',null,true)}{field('Project status','projectStatus')}{field('Assessment / demonstration outcome','assessmentOutcome','textarea',null,true)}{field('Strengths','strengths','textarea')}{field('Gaps / reasons for delay','gaps','textarea')}{field('Support / intervention provided','interventions','textarea',null,true)}{field('Management intervention required','managementIntervention','checkbox')}{field('Next week actions','nextWeekActions','textarea',null,true)}{field('Evidence links','evidenceLinks','textarea',null,true)}{field('Mentor weekly summary','summary','textarea',null,true)}</>}{kind==='actions'&&<>{field('Date raised','dateRaised','date')}{field('Issue / performance gap','issue','textarea',null,true)}{field('Priority','priority','text',['Low','Medium','High','Urgent'])}{field('Action required','actionRequired','textarea',null,true)}{field('Owner','owner')}{field('Due date','dueDate','date')}{field('Status','status','text',['Open','In progress','Awaiting response','Closed','Escalated'])}{field('Outcome / evidence','outcomeEvidence','textarea',null,true)}{field('Escalated to','escalatedTo')}{field('Follow-up notes','followUpNotes','textarea',null,true)}</>}{err&&<div className="error-box span-2">{err}</div>}<div className="form-actions span-2"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy?'Saving…':'Save record'}</button></div></form></Modal>}
function AmbientBackground({theme}){
 const canvasRef=React.useRef(null);
 useEffect(()=>{
  const canvas=canvasRef.current,context=canvas?.getContext('2d');
  if(!canvas||!context)return;
  let width=0,height=0,frame=0,lastTime=0,lastDraw=0,baseCanvas,baseContext,nodes=[],edges=[],lights=[];
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const dark=theme==='dark',radius=72,stepX=radius*1.5,stepY=Math.sqrt(3)*radius;
  const palette=[184,171,258,322],trailDuration=1.8,frameInterval=100/30;
  function makeLight(delay,hue,occupiedEdges,occupiedNodes){
   const available=edges.map((edge,index)=>({edge,index}))
    .filter(({edge,index})=>!occupiedEdges.has(index)
     &&!occupiedNodes.has(edge.from)&&!occupiedNodes.has(edge.to));
   if(!available.length)return null;
   const chosen=available[Math.floor(Math.random()*available.length)];
   const reverse=Math.random()<.5;
   occupiedEdges.add(chosen.index);
   occupiedNodes.add(chosen.edge.from);
   occupiedNodes.add(chosen.edge.to);
   return{
    from:reverse?chosen.edge.to:chosen.edge.from,
    to:reverse?chosen.edge.from:chosen.edge.to,
    edge:chosen.index,
    progress:0,
    speed:.22+Math.random()*.06,
    wait:delay,
    hue,
    trail:[]
   };
  }
  function buildGrid(){
   nodes=[];edges=[];
   const nodeIds=new Map(),edgeIds=new Map();
   const getNode=(x,y)=>{
    const key=`${Math.round(x*10)},${Math.round(y*10)}`;
    if(nodeIds.has(key))return nodeIds.get(key);
    const id=nodes.length;
    nodeIds.set(key,id);nodes.push({x,y,neighbors:[]});
    return id;
   };
   const cols=Math.ceil(width/stepX)+2,rows=Math.ceil(height/stepY)+2;
   for(let col=-1;col<cols;col++){
    for(let row=-1;row<rows;row++){
     const cx=col*stepX-radius,cy=row*stepY+((col%2+2)%2)*stepY/2-radius;
     for(let side=0;side<6;side++){
      const a=Math.PI/3*side,b=Math.PI/3*(side+1);
      const from=getNode(cx+radius*Math.cos(a),cy+radius*Math.sin(a));
      const to=getNode(cx+radius*Math.cos(b),cy+radius*Math.sin(b));
      const key=from<to?`${from}:${to}`:`${to}:${from}`;
      if(edgeIds.has(key))continue;
      const edge=edges.length;
      edgeIds.set(key,edge);edges.push({from,to});
      nodes[from].neighbors.push({node:to,edge});
      nodes[to].neighbors.push({node:from,edge});
     }
    }
   }
   const occupiedEdges=new Set(),occupiedNodes=new Set();
   lights=Array.from({length:80},()=>{
    const hue=palette[Math.floor(Math.random()*palette.length)];
    return makeLight(Math.random()*5.4,hue,occupiedEdges,occupiedNodes);
   }).filter(Boolean);
  }
  function drawGrid(){
   baseCanvas.width=canvas.width;baseCanvas.height=canvas.height;
   baseContext.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
   baseContext.clearRect(0,0,width,height);
   baseContext.beginPath();
   for(const edge of edges){
    const from=nodes[edge.from],to=nodes[edge.to];
    baseContext.moveTo(from.x,from.y);baseContext.lineTo(to.x,to.y);
   }
   baseContext.strokeStyle=dark?'rgba(150, 196, 153, 0.16)':'rgba(72,94,129,.13)';
   baseContext.lineWidth=1.1;baseContext.stroke();
  }
  function renderStatic(){
   context.clearRect(0,0,width,height);
   if(baseCanvas)context.drawImage(baseCanvas,0,0,width,height);
  }
  function resize(){
   const ratio=Math.min(window.devicePixelRatio||1,1.25);
   width=window.innerWidth;height=window.innerHeight;
   canvas.width=width*ratio;canvas.height=height*ratio;
   context.setTransform(ratio,0,0,ratio,0,0);
   if(!baseCanvas){baseCanvas=document.createElement('canvas');baseContext=baseCanvas.getContext('2d')}
   buildGrid();drawGrid();lastTime=0;lastDraw=0;
   if(motion.matches||document.hidden)renderStatic();
   else if(!frame)frame=requestAnimationFrame(draw);
  }
  function drawEdge(edgeId,alpha,hue,widthValue,blur){
   const edge=edges[edgeId],a=nodes[edge.from],b=nodes[edge.to];
   context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);
   context.strokeStyle=`hsla(${hue},55%,${dark?68:48}%,${alpha})`;
   context.lineWidth=widthValue;context.shadowColor=`hsla(${hue},65%,60%,${alpha})`;context.shadowBlur=blur;context.stroke();context.shadowBlur=0;
  }
  function advanceLight(light,delta,occupiedEdges,occupiedNodes){
   for(let index=light.trail.length-1;index>=0;index--){
    const trail=light.trail[index];trail.age+=delta;
    if(trail.age>=trailDuration)light.trail.splice(index,1);
   }
   if(light.wait>0){light.wait=Math.max(0,light.wait-delta);return}
   light.progress+=delta*light.speed;
   if(light.progress<1)return;
   light.trail.unshift({edge:light.edge,age:0});
   light.trail.length=Math.min(light.trail.length,1);
   const previous=light.from,current=light.to;
   occupiedEdges.delete(light.edge);
   occupiedNodes.clear();
   for(const edgeId of occupiedEdges){
     occupiedNodes.add(edges[edgeId].from);
     occupiedNodes.add(edges[edgeId].to);
   }
   const options=nodes[current].neighbors.filter(neighbor=>neighbor.node!==previous
    &&!occupiedEdges.has(neighbor.edge)&&!occupiedNodes.has(neighbor.node));
   const choices=options.length?options:nodes[current].neighbors.filter(neighbor=>neighbor.node!==previous
    &&!occupiedEdges.has(neighbor.edge)&&!occupiedNodes.has(neighbor.node));
   if(!choices.length){
    occupiedEdges.add(light.edge);
    occupiedNodes.clear();
    for(const edgeId of occupiedEdges){
     occupiedNodes.add(edges[edgeId].from);
     occupiedNodes.add(edges[edgeId].to);
    }
    light.progress=.99;
    light.wait=.18+Math.random()*.5;
    return;
   }
   const next=choices[Math.floor(Math.random()*choices.length)];
   light.from=current;light.to=next.node;light.edge=next.edge;
   occupiedEdges.add(light.edge);
   occupiedNodes.clear();
   for(const edgeId of occupiedEdges){
    occupiedNodes.add(edges[edgeId].from);
    occupiedNodes.add(edges[edgeId].to);
   }
   light.progress-=1;light.wait=.18+Math.random()*.5;
  }
  function draw(timestamp){
   frame=0;
   if(document.hidden)return;
   if(timestamp-lastDraw<frameInterval-1){frame=requestAnimationFrame(draw);return}
   const delta=lastTime?Math.min((timestamp-lastTime)/100,.05):0;
   lastTime=timestamp;lastDraw=timestamp;
   context.clearRect(0,0,width,height);context.drawImage(baseCanvas,0,0,width,height);
   const occupiedEdges=new Set(),occupiedNodes=new Set();
   for(const light of lights){
    occupiedEdges.add(light.edge);
    occupiedNodes.add(edges[light.edge].from);
    occupiedNodes.add(edges[light.edge].to);
   }
   for(const light of lights){
    advanceLight(light,delta,occupiedEdges,occupiedNodes);
    for(const trail of light.trail){
     const opacity=(1-trail.age/trailDuration)*.22;
     drawEdge(trail.edge,opacity,light.hue,1.8,4);
    }
    const from=nodes[light.from],to=nodes[light.to],progress=light.progress;
    const headX=from.x+(to.x-from.x)*progress,headY=from.y+(to.y-from.y)*progress;
    const tail=Math.min(.9,progress),tailX=from.x+(to.x-from.x)*(progress-tail),tailY=from.y+(to.y-from.y)*(progress-tail);
    context.beginPath();context.moveTo(tailX,tailY);context.lineTo(headX,headY);
    context.strokeStyle=`hsla(${light.hue},55%,${dark?70:48}%,.42)`;context.lineWidth=2;context.shadowColor=`hsla(${light.hue},65%,60%,.6)`;context.shadowBlur=5;context.stroke();context.shadowBlur=0;
    context.beginPath();context.arc(headX,headY,2.1,0,Math.PI*2);
    context.fillStyle=`hsla(${light.hue},65%,${dark?76:54}%,.8)`;context.shadowColor=`hsla(${light.hue},70%,65%,.65)`;context.shadowBlur=6;context.fill();context.shadowBlur=0;
   }
   frame=requestAnimationFrame(draw);
  }
  function visibilityChange(){
   if(document.hidden){cancelAnimationFrame(frame);frame=0;lastTime=0;return}
   if(motion.matches)renderStatic();else if(!frame)frame=requestAnimationFrame(draw);
  }
  function motionChange(){
   cancelAnimationFrame(frame);frame=0;lastTime=0;
   if(motion.matches)renderStatic();else if(!document.hidden)frame=requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',visibilityChange);
  motion.addEventListener('change',motionChange);
  resize();
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibilityChange);motion.removeEventListener('change',motionChange)};
 },[theme]);
 return <div className="ambient-background" aria-hidden="true"><canvas ref={canvasRef}/></div>
}
function ProfilePage(){
 const cached=user()||{};
 const[form,setForm]=useState({name:cached.name||'',email:cached.email||'',currentPassword:'',password:'',confirmPassword:''});
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{api.get('/auth/me').then(({data})=>setForm(previous=>({...previous,...data}))).catch(err=>setError(err.response?.data?.message||'Unable to load your profile'))},[]);
 async function save(event){
  event.preventDefault();setError('');setMessage('');
  if(form.password&&form.password!==form.confirmPassword){setError('New password and confirmation do not match.');return}
  setBusy(true);
  try{
   const payload={name:form.name,email:form.email};
   if(form.password){payload.currentPassword=form.currentPassword;payload.password=form.password}
   const{data}=await api.patch('/auth/me',payload);
   localStorage.setItem('l2e_user',JSON.stringify(data.user));
   if(data.token)localStorage.setItem('l2e_token',data.token);
   window.dispatchEvent(new Event('l2e-profile-updated'));
   setForm(previous=>({...previous,...data.user,currentPassword:'',password:'',confirmPassword:''}));
   setMessage('Profile updated successfully.');
  }catch(err){setError(err.response?.data?.message||'Unable to update your profile')}finally{setBusy(false)}
 }
 return <><PageTitle title="Profile settings" sub="Update your account details and sign-in password."/><section className="panel profile-panel"><form className="form-grid" onSubmit={save}>
  <Field label="Full name"><input required maxLength="120" value={form.name} onChange={event=>setForm({...form,name:event.target.value})}/></Field>
  <Field label="Email address"><input required type="email" value={form.email} onChange={event=>setForm({...form,email:event.target.value})}/></Field>
  <div className="span-2 profile-password-note">Leave the password fields blank if you do not want to change your password. Changing it requires your current password.</div>
  <Field label="Current password"><input type="password" autoComplete="current-password" value={form.currentPassword} onChange={event=>setForm({...form,currentPassword:event.target.value})}/></Field>
  <Field label="New password (at least 12 characters)"><input type="password" autoComplete="new-password" minLength="12" value={form.password} onChange={event=>setForm({...form,password:event.target.value})}/></Field>
  <Field label="Confirm new password"><input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={event=>setForm({...form,confirmPassword:event.target.value})}/></Field>
  <div className="span-2 profile-actions">{error&&<div className="error-box">{error}</div>}{message&&<div className="success-box">{message}</div>}<button className="primary" disabled={busy}>{busy?'Saving…':'Save profile'}</button></div>
 </form></section></>
}

function AdminUsers(){
 const[users,setUsers]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
 const[showForm,setShowForm]=useState(false),[editing,setEditing]=useState(null),[form,setForm]=useState({name:'',email:'',role:'mentor',groups:[],password:''});
 async function load(){setBusy(true);setError('');try{const{data}=await api.get('/admin/users');setUsers(data)}catch(err){setError(err.response?.data?.message||'Unable to load user accounts')}finally{setBusy(false)}}
 useEffect(()=>{load()},[]);
 function openForm(account=null){setEditing(account);setForm(account?{name:account.name,email:account.email,role:account.role,groups:account.groups||[],password:''}:{name:'',email:'',role:'mentor',groups:[],password:''});setError('');setMessage('');setShowForm(true)}
 async function save(event){
  event.preventDefault();setError('');
  if(form.role==='mentor'&&!form.groups.length){setError('Assign at least one group to this mentor.');return}
  const payload={name:form.name,email:form.email,role:form.role,groups:form.role==='mentor'?form.groups:[]};
  if(form.password)payload.password=form.password;
  if(!editing&&!form.password){setError('Set an initial password of at least 12 characters.');return}
  setBusy(true);
  try{if(editing)await api.patch(`/admin/users/${editing.id}`,payload);else await api.post('/admin/users',payload);setShowForm(false);setMessage(editing?'User account updated.':'User account created. Share the initial password securely.');await load()}catch(err){setError(err.response?.data?.message||'Unable to save this user')}finally{setBusy(false)}
 }
 async function toggleActive(account){
  const action=account.active?'deactivate':'reactivate';
  if(account.active&&!window.confirm(`Deactivate ${account.name}'s account?`))return;
  setError('');setMessage('');
  try{await api.patch(`/admin/users/${account.id}`,{active:!account.active});setMessage(`${account.name}'s account was ${account.active?'deactivated':'reactivated'}.`);await load()}catch(err){setError(err.response?.data?.message||`Unable to ${action} this account`)}
 }
 async function deleteUser(account){
  if(!window.confirm(`Permanently delete ${account.name}'s account? This cannot be undone.`))return;
  setError('');setMessage('');
  try{await api.delete(`/admin/users/${account.id}`);setMessage(`${account.name}'s account was deleted.`);await load()}
  catch(err){setError(err.response?.data?.message||'Unable to delete this account')}
 }
 const currentId=user()?.id;
 return <><PageTitle title="User management" sub="Create accounts, assign mentor groups and roles, and reset credentials." action={<button className="primary" onClick={()=>openForm()}><Plus size={16}/> Add user</button>}/>
  {message&&<div className="success-box">{message}</div>}{error&&!showForm&&<div className="error-box">{error}</div>}
  <section className="panel table-panel"><div className="table-toolbar"><span>{users.length} accounts</span><button className="icon-btn" onClick={load} aria-label="Refresh users"><RefreshCw size={17}/></button></div>
   {busy?<div className="loading">Loading user accounts…</div>:<div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Groups</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.map(account=><tr key={account.id}><td className="name-cell"><b>{account.name}</b></td><td>{account.email}</td><td><span className="badge">{account.role}</span></td><td>{account.groups?.length?account.groups.join(', '):'—'}</td><td><span className={`badge ${account.active?'present':'inactive'}`}>{account.active?'Active':'Inactive'}</span></td><td><div className="row-actions">{account.id!==currentId?<><button onClick={()=>openForm(account)}>Edit / reset password</button><button className={account.active?'danger-text':''} onClick={()=>toggleActive(account)}>{account.active?'Deactivate':'Reactivate'}</button><button className="danger-text" onClick={()=>deleteUser(account)}>Delete</button></>:'Use My profile'}</div></td></tr>)}</tbody></table>{!users.length&&<Empty text="No user accounts found."/>}</div>}
  </section>
  {showForm&&<Modal title={editing?'Edit user account':'Add user account'} close={()=>setShowForm(false)}><form className="form-grid" onSubmit={save}>
   <Field label="Full name"><input required maxLength="120" value={form.name} onChange={event=>setForm({...form,name:event.target.value})}/></Field>
   <Field label="Email address"><input required type="email" value={form.email} onChange={event=>setForm({...form,email:event.target.value})}/></Field>
   <Field label="Role"><select value={form.role} onChange={event=>setForm({...form,role:event.target.value})}><option value="mentor">Mentor</option><option value="admin">Administrator</option></select></Field>
   {form.role==='mentor'&&<fieldset className="field span-2 group-assignment"><legend>Assigned groups</legend>{GROUPS.map(group=><label key={group}><input type="checkbox" checked={form.groups.includes(group)} onChange={event=>setForm({...form,groups:event.target.checked?[...new Set([...form.groups,group])]:form.groups.filter(value=>value!==group)})}/>{group}</label>)}</fieldset>}
   <Field label={editing?'New password (leave blank to keep current)':'Initial password (at least 12 characters)'}><input type="password" autoComplete="new-password" minLength="12" required={!editing} value={form.password} onChange={event=>setForm({...form,password:event.target.value})}/></Field>
   {error&&<div className="error-box span-2">{error}</div>}<div className="form-actions span-2"><button type="button" className="secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary" disabled={busy}>{busy?'Saving…':editing?'Save changes':'Create account'}</button></div>
  </form></Modal>}
 </>
}

function AdminMentorProgress(){
 const[mentors,setMentors]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState('');
 async function load(){setBusy(true);setError('');try{const{data}=await api.get('/admin/mentor-progress');setMentors(data)}catch(err){setError(err.response?.data?.message||'Unable to load mentor progress')}finally{setBusy(false)}}
 useEffect(()=>{load()},[]);
 const activeCount=mentors.filter(mentor=>mentor.active).length;
 const fellowCount=mentors.reduce((sum,mentor)=>sum+mentor.totalFellows,0);
 const openActionCount=mentors.reduce((sum,mentor)=>sum+mentor.openActions,0);
 return <><PageTitle title="Mentor progress" sub="Compare active fellow standing, project outcomes, reporting activity, and outstanding actions across mentors." action={<button className="secondary" onClick={load}><RefreshCw size={16}/> Refresh data</button>}/>
  {error&&<div className="error-box">{error}</div>}
  <div className="stat-grid admin-summary"><Stat label="Mentor accounts" value={activeCount} sub="Active accounts" icon={Users}/><Stat label="Assigned fellows" value={fellowCount} sub="Active roster across mentors" icon={CheckCircle2} tone="green"/><Stat label="Open actions" value={openActionCount} sub="Awaiting follow-up" icon={AlertTriangle} tone="amber"/></div>
  <section className="panel table-panel"><div className="table-toolbar"><span>Mentor performance overview</span></div>{busy?<div className="loading">Loading mentor progress…</div>:!mentors.length?<Empty text="No mentor accounts found."/>:<div className="table-wrap"><table><thead><tr><th>Mentor</th><th>Groups</th><th>Fellows</th><th>On track</th><th>Needs attention</th><th>At risk / escalated</th><th>Projects complete / blocked</th><th>Daily logs</th><th>Assessments</th><th>Weekly reviews</th><th>Open actions</th><th>Avg. score</th><th>Last activity</th></tr></thead><tbody>{mentors.map(mentor=><tr key={mentor.id||mentor.name}><td><div className="name-cell"><b>{mentor.name}</b><small>{mentor.email||'No active account'}{!mentor.active?' · Inactive':''}</small></div></td><td>{mentor.groups?.join(', ')||'—'}</td><td>{mentor.totalFellows}</td><td>{mentor.onTrack}</td><td>{mentor.needsAttention}</td><td>{mentor.atRisk} / {mentor.escalated}</td><td>{mentor.completedProjects} / {mentor.blockedProjects}</td><td>{mentor.dailyLogs}</td><td>{mentor.assessments}</td><td>{mentor.weeklyReviews}</td><td>{mentor.openActions}</td><td>{mentor.averageScore==null?'—':`${mentor.averageScore}%`}</td><td>{mentor.lastActivity?new Date(mentor.lastActivity).toLocaleDateString():'—'}</td></tr>)}</tbody></table></div>}</section>
 </>
}

function App(){
 const[theme,setTheme]=useState(()=>localStorage.getItem('l2e_theme')==='dark'?'dark':'light');
 useEffect(()=>{localStorage.setItem('l2e_theme',theme)},[theme]);
 const toggleTheme=()=>setTheme(current=>current==='dark'?'light':'dark');
 return <div className={`app-root theme-${theme}`}><AmbientBackground theme={theme}/><Routes><Route path="/login" element={<Login/>}/><Route path="/*" element={<Protected><Shell theme={theme} onToggleTheme={toggleTheme}><Routes><Route path="/" element={<Dashboard/>}/><Route path="/fellows" element={<Fellows/>}/><Route path="/daily" element={<RecordPage kind="daily"/>}/><Route path="/projects" element={<RecordPage kind="projects"/>}/><Route path="/assessments" element={<RecordPage kind="assessments"/>}/><Route path="/weekly" element={<RecordPage kind="weekly"/>}/><Route path="/actions" element={<RecordPage kind="actions"/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="/admin/users" element={<AdminOnly><AdminUsers/></AdminOnly>}/><Route path="/admin/mentor-progress" element={<AdminOnly><AdminMentorProgress/></AdminOnly>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></Shell></Protected>}/></Routes></div>
}
export default App;
