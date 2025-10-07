"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/register", { method: "POST", body: new URLSearchParams({ email, password, company, name }) });
    if (res.ok) setStatus("Account created. You can sign in.");
    else setStatus("Failed to register");
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Company</label>
          <input className="w-full rounded border px-3 py-2" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Name</label>
          <input className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input type="password" className="w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="rounded bg-blue-600 px-4 py-2 text-white">Create account</button>
      </form>
      {status ? <div className="mt-3 text-sm">{status}</div> : null}
    </div>
  );
}


