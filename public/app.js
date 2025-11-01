const api = (p, opts) => fetch(p, opts).then(r => r.json());
let token = null;
let user = null;

const $ = id => document.getElementById(id);

async function doLogin() {
    const username = $('username').value.trim();
    if (!username) return alert('Enter username');
    const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
    const data = await res.json();
    if (data.token) {
        token = data.token; user = data.user;
        $('userinfo').innerText = `Logged in: ${user.username} (${user.role})`;
        loadModels();
    } else {
        alert('Login failed');
    }
}

$('login').addEventListener('click', doLogin);
$('pretty').addEventListener('click', () => {
    try { const v = JSON.parse($('modelJson').value); $('modelJson').value = JSON.stringify(v, null, 2); } catch (e) { alert('Invalid JSON'); }
});

async function loadModels() {
    const models = await api('/models');
    const list = $('modelsList');
    list.innerHTML = '';
    models.forEach(m => {
        const card = document.createElement('div');
        card.className = 'modelCard';
        const left = document.createElement('div');
        left.innerHTML = `<div style="font-weight:600">${m.name}</div><div class="meta">${m.table || (m.name.toLowerCase() + 's')}</div>`;
        const right = document.createElement('div');
        const btn = document.createElement('button'); btn.className = 'btn'; btn.innerText = 'Open';
        btn.onclick = () => showModel(m.name);
        right.appendChild(btn);
        card.appendChild(left); card.appendChild(right);
        list.appendChild(card);
    });
}

$('publish').addEventListener('click', async () => {
    if (!token) return alert('Login as Admin to publish');
    let model;
    try { model = JSON.parse($('modelJson').value); } catch (e) { return alert('Invalid JSON'); }
    const res = await fetch('/admin/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(model) });
    const data = await res.json();
    if (data.ok) { alert('Published'); loadModels(); } else { alert('Error: ' + JSON.stringify(data)); }
});

async function showModel(name) {
    const m = await api('/models/' + name);
    const area = $('modelArea');
    area.innerHTML = '';
    const header = document.createElement('div'); header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center';
    const h = document.createElement('h2'); h.innerText = m.name;
    header.appendChild(h);
    area.appendChild(header);

    const ctrl = document.createElement('div'); ctrl.style.marginTop = '8px';
    const btnLoad = document.createElement('button'); btnLoad.className = 'btn primary'; btnLoad.innerText = 'Load records';
    btnLoad.onclick = async () => {
        const table = m.table || (m.name.toLowerCase() + 's');
        const res = await fetch('/api/' + table, { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
        const rows = await res.json();
        renderRecords(area, rows, m);
    };
    ctrl.appendChild(btnLoad);

    const addBtn = document.createElement('button'); addBtn.className = 'btn'; addBtn.innerText = 'Add record';
    addBtn.onclick = () => renderAddForm(area, m);
    ctrl.appendChild(addBtn);

    area.appendChild(ctrl);
}

function renderAddForm(area, m) {
    // remove previous form if any
    const existingForm = area.querySelector('.record-form'); if (existingForm) existingForm.remove();
    const form = document.createElement('div'); form.className = 'record-form';
    m.fields.forEach(f => {
        const row = document.createElement('div'); row.className = 'record-row';
        const label = document.createElement('label'); label.innerText = f.name; label.htmlFor = 'fld_' + f.name;
        const type = (f.type || 'string').toLowerCase();
        let input;
        if (type === 'boolean') {
            input = document.createElement('input'); input.type = 'checkbox'; input.className = 'record-input'; input.id = 'fld_' + f.name; input.name = f.name;
        } else if (type === 'number') {
            input = document.createElement('input'); input.type = 'number'; input.className = 'record-input'; input.id = 'fld_' + f.name; input.name = f.name; input.placeholder = '0';
        } else if (type === 'date') {
            input = document.createElement('input'); input.type = 'date'; input.className = 'record-input'; input.id = 'fld_' + f.name; input.name = f.name;
        } else {
            input = document.createElement('input'); input.type = 'text'; input.className = 'record-input'; input.id = 'fld_' + f.name; input.name = f.name; input.placeholder = f.type;
        }
        row.appendChild(label); row.appendChild(input); form.appendChild(row);
    });
    const submit = document.createElement('button'); submit.className = 'btn primary submit'; submit.innerText = 'Create';
    submit.onclick = async () => {
        const values = {};
        m.fields.forEach(f => {
            const el = form.querySelector('[name="' + f.name + '"]');
            if (!el) return;
            if (el.type === 'checkbox') values[f.name] = el.checked;
            else if (el.type === 'number') values[f.name] = el.value ? Number(el.value) : undefined;
            else values[f.name] = el.value;
        });
        if (m.ownerField && user) values[m.ownerField] = user.id;
        const table = m.table || (m.name.toLowerCase() + 's');
        const res = await fetch('/api/' + table, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': 'Bearer ' + token } : {}) }, body: JSON.stringify(values) });
        const out = await res.json();
        alert('Created');
    };
    form.appendChild(submit); area.appendChild(form);
}

function renderRecords(area, rows, model) {
    // clear previous records section
    const prev = area.querySelector('.records'); if (prev) prev.remove();
    const wrap = document.createElement('div'); wrap.className = 'records'; wrap.style.marginTop = '12px';
    if (!rows || rows.length === 0) { const p = document.createElement('div'); p.className = 'placeholder'; p.innerText = 'No records'; wrap.appendChild(p); area.appendChild(wrap); return }
    const table = document.createElement('table'); table.className = 'recordsTable';
    const cols = Object.keys(rows[0].data || {});
    const thead = document.createElement('thead'); const trh = document.createElement('tr');['id', ...cols, 'actions'].forEach(c => { const th = document.createElement('th'); th.innerText = c; trh.appendChild(th) }); thead.appendChild(trh); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach(r => {
        const tr = document.createElement('tr');
        const tdId = document.createElement('td'); tdId.innerText = r.id; tr.appendChild(tdId);
        cols.forEach(k => { const td = document.createElement('td'); td.innerText = r.data[k]; tr.appendChild(td) });
        const tdActions = document.createElement('td'); tdActions.className = 'record-actions';
        const del = document.createElement('button'); del.className = 'btn'; del.innerText = 'Delete';
        del.onclick = async () => { await fetch('/api/' + (model.table || (model.name.toLowerCase() + 's')) + '/' + r.id, { method: 'DELETE', headers: token ? { 'Authorization': 'Bearer ' + token } : {} }); tr.remove(); }
        tdActions.appendChild(del); tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody); wrap.appendChild(table); area.appendChild(wrap);
}

// initial
loadModels();
