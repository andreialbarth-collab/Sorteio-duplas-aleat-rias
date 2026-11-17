import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowLeftRight, CalendarDays, Check, ChevronDown, CirclePlus, Clock3, Download, Dices, History, Info, Minus, Plus, RotateCcw, ShieldCheck, Trophy, Users, X } from 'lucide-react';
import './style.css';

const STORAGE_KEY = 'padel-match-v1';
const initial = { right: [], left: [], rounds: [], duration: 30, start: '11:00', end: '15:00', nextId: 1 };
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const shuffle = (arr) => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const mins = (t) => { const [h,m]=t.split(':').map(Number); return h*60+m; };
const hhmm = (n) => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const courtsAt = (m) => m < 13*60 ? 3 : 4;
const readStore = () => { try { const v=JSON.parse(localStorage.getItem(STORAGE_KEY)); return v ? {...initial,...v} : initial; } catch { return initial; } };

function App(){
  const [data,setData]=useState(readStore);
  const [rightName,setRightName]=useState(''); const [leftName,setLeftName]=useState('');
  const [tab,setTab]=useState('jogos'); const [notice,setNotice]=useState(''); const [showConfig,setShowConfig]=useState(false);
  useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));},[data]);
  const update=(patch)=>setData(d=>({...d,...patch}));
  const add=(side,name,setName)=>{ const n=name.trim(); if(!n)return; const all=[...data.right,...data.left]; if(all.some(x=>x.name.toLowerCase()===n.toLowerCase())){setNotice('Esse atleta já está cadastrado.');return;} update({[side]:[...data[side],{id:uid(),name:n}]});setName('');setNotice('Atleta adicionado!'); };
  const remove=(side,id)=>{ if(data.rounds.some(r=>r.matches.some(m=>[...m.teamA,...m.teamB].some(p=>p.id===id)))){setNotice('Este atleta já aparece em uma rodada. Apague as rodadas para removê-lo.');return;} update({[side]:data[side].filter(p=>p.id!==id)}); };
  const usedPairs=useMemo(()=>{const s=new Set();data.rounds.forEach(r=>r.matches.forEach(m=>{s.add([m.teamA[0].id,m.teamA[1].id].sort().join('|'));s.add([m.teamB[0].id,m.teamB[1].id].sort().join('|'));}));return s;},[data.rounds]);
  const makeRound=()=>{
    if(data.right.length<2||data.left.length<2){setNotice('Cadastre pelo menos 2 atletas de cada lado para sortear.');return;}
    const count=Math.min(data.right.length,data.left.length); const pairCount=Math.floor(count/2);
    if(pairCount<1){setNotice('São necessários 2 atletas de cada lado para formar um jogo.');return;}
    let best=null,bestScore=Infinity;
    for(let attempt=0;attempt<250;attempt++){
      const rs=shuffle(data.right).slice(0,pairCount*2); const ls=shuffle(data.left).slice(0,pairCount*2);
      const teams=Array.from({length:pairCount},(_,i)=>({team:[rs[i*2],ls[i*2]], other:[rs[i*2+1],ls[i*2+1]]}));
      const matches=shuffle(teams).map(t=>({teamA:t.team,teamB:t.other}));
      let score=0; matches.forEach(m=>{[[m.teamA[0],m.teamA[1]],[m.teamB[0],m.teamB[1]]].forEach(p=>{if(usedPairs.has(p.map(x=>x.id).sort().join('|')))score+=100;});});
      if(score<bestScore){bestScore=score;best=matches;} if(score===0)break;
    }
    const from=mins(data.start),to=mins(data.end),duration=Math.max(10,Number(data.duration)||30); let cursor=from;
    const scheduled=best.map((m,i)=>{while(cursor+duration>to)cursor=from; const courtCount=courtsAt(cursor); const slot=cursor; const court=(i%courtCount)+1; if((i+1)%courtCount===0)cursor+=duration; return {...m,id:uid(),court,time:hhmm(slot),duration,done:false};});
    const round={id:uid(),number:data.rounds.length+1,createdAt:new Date().toISOString(),matches:scheduled};
    update({rounds:[...data.rounds,round]});setTab('jogos');setNotice(bestScore===0?'Nova rodada sorteada sem repetir duplas anteriores.':'Rodada sorteada! Se houver poucas combinações, alguma dupla pode se repetir.');
  };
  const toggleDone=(roundId,matchId)=>update({rounds:data.rounds.map(r=>r.id!==roundId?r:{...r,matches:r.matches.map(m=>m.id===matchId?{...m,done:!m.done}:m)})});
  const deleteRounds=()=>{if(confirm('Apagar todo o histórico de rodadas?')){update({rounds:[]});setNotice('Histórico apagado.');}};
  const exportCsv=()=>{const rows=[['Rodada','Horário','Quadra','Dupla A','Dupla B','Status']];data.rounds.forEach(r=>r.matches.forEach(m=>rows.push([r.number,m.time,m.court,m.teamA.map(p=>p.name).join(' + '),m.teamB.map(p=>p.name).join(' + '),m.done?'Concluído':'Pendente'])));const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));a.download='padel-jogos.csv';a.click();URL.revokeObjectURL(a.href);};
  const total=data.right.length+data.left.length; const latest=data.rounds.at(-1);
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Activity size={21}/></div><div><strong>PADEL<span>MATCH</span></strong><small>GESTÃO DE SORTEIOS</small></div></div><div className="top-actions"><span className="live-dot">SISTEMA PRONTO</span><button className="icon-btn" onClick={()=>setShowConfig(!showConfig)} title="Configurações"><ChevronDown size={18}/></button></div></header>
    <main className="container">
      <section className="hero"><div><div className="eyebrow">TORNEIO • PADEL</div><h1>Que comecem<br/><em>os jogos.</em></h1><p>Cadastre os atletas, sorteie as duplas e organize cada rodada de forma simples e aleatória.</p></div><div className="hero-art"><div className="court-lines"><div className="court-mid"/><div className="court-net"/></div><div className="hero-ball"/></div></section>
      <section className="stats-grid"><Stat icon={<Users/>} label="ATLETAS CADASTRADOS" value={total} sub={`${data.right.length} direitas · ${data.left.length} esquerdas`}/><Stat icon={<Trophy/>} label="RODADAS SORTEADAS" value={data.rounds.length} sub={data.rounds.length?'Histórico salvo neste dispositivo':'Nenhuma rodada ainda'}/><Stat icon={<Activity/>} label="JOGOS NA ÚLTIMA RODADA" value={latest?.matches.length||0} sub={latest?`${latest.matches.filter(m=>m.done).length} concluídos`:'Aguardando sorteio'}/></section>
      {showConfig&&<section className="config-panel"><div className="section-heading"><div><span className="eyebrow">CONFIGURAÇÃO</span><h2>Horários e duração</h2></div><button className="icon-btn" onClick={()=>setShowConfig(false)}><X size={18}/></button></div><div className="config-fields"><label>Duração de cada jogo (minutos)<input type="number" min="10" max="120" value={data.duration} onChange={e=>update({duration:e.target.value})}/></label><label>Início do evento<input type="time" value={data.start} onChange={e=>update({start:e.target.value})}/></label><label>Fim do evento<input type="time" value={data.end} onChange={e=>update({end:e.target.value})}/></label></div><p className="hint"><Info size={14}/> 3 quadras disponíveis antes das 13h e 4 quadras a partir das 13h.</p></section>}
      <nav className="tabs"><button className={tab==='jogos'?'active':''} onClick={()=>setTab('jogos')}><Dices size={16}/> Sorteio & jogos</button><button className={tab==='atletas'?'active':''} onClick={()=>setTab('atletas')}><Users size={16}/> Atletas <span>{total}</span></button></nav>
      {tab==='atletas'?<section className="panel"><div className="section-heading"><div><span className="eyebrow">PARTICIPANTES</span><h2>Cadastro de atletas</h2><p>Comece com 12 direitas e 12 esquerdas — adicione quantos precisar.</p></div><div className="total-pill">{total} atletas</div></div><div className="roster-grid"><Roster title="Direitas" color="green" players={data.right} value={rightName} setValue={setRightName} onAdd={()=>add('right',rightName,setRightName)} onRemove={id=>remove('right',id)}/><Roster title="Esquerdas" color="orange" players={data.left} value={leftName} setValue={setLeftName} onAdd={()=>add('left',leftName,setLeftName)} onRemove={id=>remove('left',id)}/></div><div className="tip"><Info size={16}/><span>O sorteio sempre combina <b>1 direita + 1 esquerda</b> em cada dupla. Para que todos joguem na rodada, mantenha a mesma quantidade de atletas dos dois lados.</span></div></section>:<>
        <section className="draw-panel"><div className="draw-copy"><div className="eyebrow">PRÓXIMA ETAPA</div><h2>{data.rounds.length?'Pronto para outra rodada?':'Monte sua primeira rodada.'}</h2><p>As duplas e os confrontos são embaralhados automaticamente. O sistema tenta evitar repetir duplas de rodadas anteriores.</p><div className="draw-meta"><span><Clock3 size={15}/> {data.start}–{data.end}</span><span><Activity size={15}/> 3 quadras até 13h · 4 depois</span></div></div><button className="draw-button" onClick={makeRound}><Dices size={21}/><span>{data.rounds.length?'Sortear nova rodada':'Sortear 1ª rodada'}</span><small>GERAR JOGOS ALEATÓRIOS</small></button></section>
        {notice&&<div className="notice" onClick={()=>setNotice('')}><Info size={15}/>{notice}<button><X size={14}/></button></div>}
        <div className="section-heading history-heading"><div><span className="eyebrow">CENTRO DE JOGOS</span><h2>Rodadas do torneio</h2></div><div className="heading-actions"><button className="secondary-btn" onClick={exportCsv} disabled={!data.rounds.length}><Download size={15}/> Exportar</button>{data.rounds.length>0&&<button className="text-btn" onClick={deleteRounds}><RotateCcw size={14}/> Limpar</button>}</div></div>
        {data.rounds.length===0?<div className="empty-state"><div className="empty-icon"><Dices size={27}/></div><h3>Nenhum jogo sorteado</h3><p>Cadastre os atletas e clique em “Sortear 1ª rodada” para começar.</p><button className="secondary-btn" onClick={()=>setTab('atletas')}>Cadastrar atletas <ArrowLeftRight size={15}/></button></div>:<div className="round-list">{[...data.rounds].reverse().map(round=><section className="round-card" key={round.id}><div className="round-header"><div className="round-title"><div className="round-number">{String(round.number).padStart(2,'0')}</div><div><h3>Rodada {round.number}</h3><small>{new Date(round.createdAt).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})} · {round.matches.length} jogos</small></div></div><span className="round-progress">{round.matches.filter(m=>m.done).length}/{round.matches.length} concluídos</span></div><div className="matches-grid">{round.matches.map((m,i)=><Match key={m.id} match={m} index={i} onToggle={()=>toggleDone(round.id,m.id)}/>)}</div></section>)}</div>}
      </>}
      <footer><span>PADEL MATCH <b>•</b> SORTEIO INTELIGENTE</span><span>Seus dados ficam salvos neste navegador.</span></footer>
    </main>
  </div>;
}
function Stat({icon,label,value,sub}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div>}
function Roster({title,color,players,value,setValue,onAdd,onRemove}){return <div className={`roster ${color}`}><div className="roster-head"><div className="roster-dot"/><h3>{title}</h3><span>{players.length}</span></div><form className="add-row" onSubmit={e=>{e.preventDefault();onAdd();}}><input value={value} onChange={e=>setValue(e.target.value)} placeholder={`Nome do atleta ${title.toLowerCase()}...`}/><button type="submit" aria-label="Adicionar atleta"><Plus size={18}/></button></form><div className="player-list">{players.length?players.map((p,i)=><div className="player-row" key={p.id}><span className="player-index">{String(i+1).padStart(2,'0')}</span><span>{p.name}</span><button onClick={()=>onRemove(p.id)} aria-label={`Remover ${p.name}`}><X size={14}/></button></div>):<div className="roster-empty">Nenhum atleta cadastrado</div>}</div></div>}
function Match({match,index,onToggle}){return <article className={`match-card ${match.done?'is-done':''}`}><div className="match-top"><span className="match-label">JOGO {String(index+1).padStart(2,'0')}</span><span className="match-time"><Clock3 size={13}/>{match.time}</span></div><div className="match-body"><div className="team"><div className="team-side green-side"><span>D</span></div><div className="team-names"><b>{match.teamA[0].name}</b><b>{match.teamA[1].name}</b></div></div><div className="versus">VS</div><div className="team"><div className="team-side orange-side"><span>E</span></div><div className="team-names"><b>{match.teamB[0].name}</b><b>{match.teamB[1].name}</b></div></div></div><div className="match-bottom"><span>QUADRA {match.court} <i>·</i> {match.duration} MIN</span><button className={match.done?'done-btn':'mark-btn'} onClick={onToggle}>{match.done?<><Check size={13}/> Concluído</>:<>Marcar concluído</>}</button></div></article>}

createRoot(document.getElementById('root')).render(<App/>);
