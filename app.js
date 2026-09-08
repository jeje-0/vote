const CANDIDATES = ["김길동", "이길동", "박길동"];
let choices = {};

function buildCandidateArea(){
  const area = document.getElementById('candidateArea');
  area.innerHTML = '';
  CANDIDATES.forEach(name => {
    const div = document.createElement('div');
    div.className = 'candidate';
    div.innerHTML = `
      <div class="name">${name}</div>
      <div class="toggle">
        <button type="button" data-name="${name}" data-val="찬성">찬성</button>
        <button type="button" data-name="${name}" data-val="반대">반대</button>
      </div>
    `;
    area.appendChild(div);
  });
  area.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name, val = btn.dataset.val;
      choices[name] = val;
      area.querySelectorAll(`button[data-name="${name}"]`).forEach(b => {
        b.classList.remove('active-yes','active-no');
      });
      btn.classList.add(val === '찬성' ? 'active-yes' : 'active-no');
      checkReady();
    });
  });
}

function checkReady(){
  const cat = document.getElementById('category').value;
  const allChosen = CANDIDATES.every(n => choices[n]);
  document.getElementById('submitBtn').disabled = !(cat && allChosen);
}

document.getElementById('category').addEventListener('change', checkReady);

function showDone(){
  document.getElementById('formArea').style.display = 'none';
  document.getElementById('doneArea').style.display = 'block';
}

document.getElementById('submitBtn').addEventListener('click', async () => {
  const btn = document.getElementById('submitBtn');
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.style.display = 'none';
  btn.disabled = true;
  btn.textContent = '제출 중...';
  try{
    const category = document.getElementById('category').value;
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, choices })
    });
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || '제출 실패');

    localStorage.setItem('ivf_vote_submitted', 'true');
    showDone();
    await loadResults();
  }catch(e){
    errorMsg.textContent = '제출에 실패했습니다: ' + e.message;
    errorMsg.style.display = 'block';
    btn.disabled = false;
    btn.textContent = '투표 제출하기';
  }
});

async function loadResults(){
  try{
    const res = await fetch('/api/results');
    const data = await res.json();

    document.getElementById('voteCount').textContent = data.count;
    const pct = Math.min(100, Math.round((data.count / data.total) * 100));
    document.getElementById('barFill').style.width = pct + '%';

    const area = document.getElementById('resultsArea');
    area.innerHTML = '';
    Object.keys(data.groups).forEach(g => {
      const card = document.createElement('div');
      card.className = 'result-card';
      let inner = `<h3>${g}</h3>`;
      data.candidates.forEach(name => {
        const yes = data.groups[g][name].찬성, no = data.groups[g][name].반대;
        const total = yes + no;
        const yesPct = total ? Math.round((yes/total)*100) : 0;
        const noPct = total ? 100 - yesPct : 0;
        inner += `
          <div class="cand-result">
            <div class="row-top"><span class="cname">${name}</span><span>${total}표</span></div>
            <div class="vote-bar"><div class="yes" style="width:${yesPct}%"></div><div class="no" style="width:${noPct}%"></div></div>
            <div class="row-count"><span>찬성 ${yes}</span><span>반대 ${no}</span></div>
          </div>
        `;
      });
      card.innerHTML = inner;
      area.appendChild(card);
    });
  }catch(e){
    document.getElementById('resultsArea').innerHTML = '<p class="sub">집계를 불러오지 못했습니다.</p>';
  }
}

function init(){
  buildCandidateArea();
  if(localStorage.getItem('ivf_vote_submitted') === 'true'){
    showDone();
  }
  loadResults();
  setInterval(loadResults, 5000);
}
init();
