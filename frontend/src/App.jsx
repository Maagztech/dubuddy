import React, { useEffect, useState } from 'react'
import './styles.css'

export default function App() {
    const [token, setToken] = useState(null)
    const [user, setUser] = useState(null)
    const [models, setModels] = useState([])
    const [modelJson, setModelJson] = useState(JSON.stringify({
        name: 'Product',
        fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'price', type: 'number' }
        ],
        ownerField: 'ownerId',
        rbac: { Admin: ['all'], Manager: ['create', 'read', 'update'], Viewer: ['read'] }
    }, null, 2))

    useEffect(() => { fetch('/models').then(r => r.json()).then(setModels).catch(() => { }) }, [])

    const login = async (username) => {
        const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) })
        const data = await res.json()
        if (data.token) { setToken(data.token); setUser(data.user); fetchModels() }
        else alert('login failed')
    }

    const fetchModels = () => fetch('/models').then(r => r.json()).then(setModels)

    const publish = async () => {
        if (!token) return alert('login as admin')
        let model
        try { model = JSON.parse(modelJson) } catch (e) { return alert('bad json') }
        const res = await fetch('/admin/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(model) })
        const data = await res.json()
        if (data.ok) { alert('published'); fetchModels() } else alert(JSON.stringify(data))
    }

    return (
        <div className="app-root">
            <header className="app-top">
                <div className="app-brand">Admin UI — Low-Code</div>
                <div className="app-login">
                    <button className="btn" onClick={() => login('alice')}>Alice (Admin)</button>
                    <button className="btn" onClick={() => login('bob')}>Bob (Manager)</button>
                    <button className="btn" onClick={() => login('carol')}>Carol (Viewer)</button>
                    <div className="muted">{user ? `Logged in ${user.username} (${user.role})` : 'Not logged in'}</div>
                </div>
            </header>

            <main className="app-body">
                <aside className="panel sidebar">
                    <h3>Create / Publish</h3>
                    <textarea className="editor" value={modelJson} onChange={e => setModelJson(e.target.value)} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn primary" onClick={publish}>Publish</button>
                        <button className="btn" onClick={() => { try { setModelJson(JSON.stringify(JSON.parse(modelJson), null, 2)) } catch (e) { alert('Invalid JSON') } }}>Prettify</button>
                    </div>
                </aside>

                <section className="panel main">
                    <h3>Models</h3>
                    <div className="modelsList">
                        {models.map(m => (
                            <div className="modelCard" key={m.name}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                                    <div className="muted">{m.table || (m.name.toLowerCase() + 's')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}
