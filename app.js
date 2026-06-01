// === Prompt Library Data ===
const SEED = [
  {name:'customer_support_classifier', category:'Classification', quality:91, runs:23, lastEdit:'2026-05-30'},
  {name:'doc_summarizer_v2',           category:'Summarization', quality:87, runs:18, lastEdit:'2026-05-28'},
  {name:'invoice_field_extractor',     category:'Extraction',    quality:94, runs:31, lastEdit:'2026-05-29'},
  {name:'product_description_writer',  category:'Generation',    quality:82, runs:12, lastEdit:'2026-05-26'},
  {name:'faq_answerer',                category:'QA',            quality:89, runs:21, lastEdit:'2026-05-31'},
  {name:'sentiment_classifier_v3',     category:'Classification',quality:90, runs:15, lastEdit:'2026-05-24'},
  {name:'meeting_notes_summarizer',    category:'Summarization', quality:84, runs:9,  lastEdit:'2026-05-25'},
  {name:'translation_en_to_es',        category:'Translation',   quality:88, runs:8,  lastEdit:'2026-05-22'},
  {name:'code_review_assistant',       category:'Generation',    quality:79, runs:6,  lastEdit:'2026-05-20'},
  {name:'pii_redactor_prompt',         category:'Extraction',    quality:92, runs:14, lastEdit:'2026-05-29'},
  {name:'tone_adjuster_formal',        category:'Generation',    quality:85, runs:10, lastEdit:'2026-05-27'},
  {name:'tech_support_responder',      category:'QA',            quality:86, runs:11, lastEdit:'2026-05-28'},
];
let LIB = JSON.parse(localStorage.getItem('promptLib') || 'null') || SEED;
function save(){ localStorage.setItem('promptLib', JSON.stringify(LIB)); }

// === Detect template variables ===
document.getElementById('ptext').addEventListener('input', detectVars);
function detectVars(){
  const text = document.getElementById('ptext').value;
  const vars = [...new Set(text.match(/\{(\w+)\}/g) || [])];
  document.getElementById('vars').innerHTML = vars.length
    ? vars.map(v => `<span class="var-pill">${v}</span>`).join('')
    : '<span class="muted">No variables detected — use {variable_name} syntax</span>';
}
detectVars();

// === Run test (simulated LLM call) ===
function runTest(){
  const prompt = document.getElementById('ptext').value;
  const testIn = document.getElementById('ptest').value;
  const expected = document.getElementById('pexpected').value.toLowerCase().trim();
  const res = document.getElementById('testResult');
  res.style.display = 'block';
  res.innerHTML = '<div class="testing">⏳ Running test through LLM...</div>';

  setTimeout(() => {
    // Simulate response (in production: Azure OpenAI / OpenAI API)
    const responses = {
      'refund': 'refund', 'billing': 'billing', 'technical': 'technical',
      'subscription': 'billing', 'charged': 'billing', 'error': 'technical',
      'broken': 'technical', 'login': 'account', 'password': 'account',
    };
    let actual = 'other';
    for(const k of Object.keys(responses)){
      if(testIn.toLowerCase().includes(k)){ actual = responses[k]; break; }
    }
    const match = actual.toLowerCase() === expected;
    const latency = 320 + Math.round(Math.random()*180);
    const tokens = Math.round(prompt.split(/\s+/).length * 1.3);

    res.innerHTML = `
      <div class="test-block ${match?'pass':'fail'}">
        <h3>${match ? '✅ Test Passed' : '❌ Test Failed'}</h3>
        <div class="t-row"><b>Expected:</b><code>${expected}</code></div>
        <div class="t-row"><b>Actual:</b><code>${actual}</code></div>
        <div class="t-grid">
          <div><b>${latency}ms</b><span>Latency</span></div>
          <div><b>${tokens}</b><span>Input Tokens</span></div>
          <div><b>${match?100:0}%</b><span>Accuracy</span></div>
          <div><b>$0.${(tokens*0.003).toFixed(3).slice(2)}</b><span>Est. Cost</span></div>
        </div>
      </div>`;
  }, 800);
}

function savePrompt(){
  const name = document.getElementById('pname').value.trim() || 'untitled_prompt_'+Date.now();
  const category = document.getElementById('pcat').value;
  const existing = LIB.findIndex(p => p.name === name);
  const entry = { name, category, quality: 80 + Math.round(Math.random()*15), runs: 1, lastEdit: new Date().toISOString().slice(0,10) };
  if(existing >= 0) LIB[existing] = entry; else LIB.push(entry);
  save();
  renderLibrary();
  alert(`✅ Saved prompt "${name}" to library`);
}

// === Render library table ===
function renderLibrary(){
  const search = (document.getElementById('search').value || '').toLowerCase();
  const catF = document.getElementById('catFilter').value;
  const rows = LIB.filter(p =>
    (!search || p.name.toLowerCase().includes(search)) &&
    (!catF || p.category === catF)
  );
  const t = document.getElementById('libTable');
  t.innerHTML = `<thead><tr><th>Name</th><th>Category</th><th>Quality</th><th>Runs</th><th>Last Edit</th><th>Actions</th></tr></thead><tbody>` +
    rows.map(p => {
      const cls = p.quality>=90?'high':p.quality>=80?'med':'low';
      return `<tr>
        <td><b>${p.name}</b></td>
        <td><span class="cat-tag">${p.category}</span></td>
        <td><span class="q-pill ${cls}">${p.quality}%</span></td>
        <td>${p.runs}</td>
        <td>${p.lastEdit}</td>
        <td>
          <button class="btn-mini" onclick="loadPrompt('${p.name}')">📂 Load</button>
          <button class="btn-mini danger" onclick="delPrompt('${p.name}')">🗑️</button>
        </td>
      </tr>`;
    }).join('') + '</tbody>';
}
function loadPrompt(name){
  const p = LIB.find(x => x.name===name);
  document.getElementById('pname').value = p.name;
  document.getElementById('pcat').value  = p.category;
  alert('📂 Loaded "' + name + '" — template would be fetched from prompt store.');
}
function delPrompt(name){
  if(confirm('Delete "'+name+'"?')){
    LIB = LIB.filter(p => p.name !== name);
    save(); renderLibrary();
  }
}
renderLibrary();

// === Charts ===
const days = Array.from({length: 30}, (_,i)=> `D-${30-i}`);
const trend = days.map((_,i)=> 78 + Math.sin(i/3)*4 + (i/30)*8 + Math.random()*3);

new Chart(document.getElementById('trendChart'), {
  type:'line',
  data:{labels: days, datasets:[{label:'Avg Quality %', data:trend, borderColor:'#7c3aed', backgroundColor:'rgba(124,58,237,.15)', fill:true, tension:.3}]},
  options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{min:70, max:100}}}
});

new Chart(document.getElementById('catChart'), {
  type:'bar',
  data:{
    labels:['Classification','Summarization','Extraction','Generation','QA','Translation'],
    datasets:[{label:'Avg Quality', data:[90.5, 85.5, 93, 82, 87.5, 88], backgroundColor:['#7c3aed','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899']}]
  },
  options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{min:70, max:100}}}
});

new Chart(document.getElementById('failChart'), {
  type:'doughnut',
  data:{
    labels:['Hallucination','Wrong format','Missing field','Off-topic','Other'],
    datasets:[{data:[34, 22, 18, 14, 12], backgroundColor:['#ef4444','#f59e0b','#7c3aed','#3b82f6','#94a3b8']}]
  },
  options:{responsive:true, plugins:{legend:{position:'bottom'}}}
});

new Chart(document.getElementById('latencyChart'), {
  type:'bar',
  data:{
    labels:['<200ms','200-400ms','400-600ms','600-800ms','>800ms'],
    datasets:[{label:'Requests', data:[12, 67, 41, 19, 8], backgroundColor:'#7c3aed'}]
  },
  options:{responsive:true, plugins:{legend:{display:false}}}
});
