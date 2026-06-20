export function StatCard({ icon: Icon, label, value, sub, accentClass = "" }) {
  return (
    <div className="premium-card rounded-2xl border border-stone-200 bg-[#fffdf8] p-3 shadow-[0_10px_26px_rgba(41,37,36,0.045)]">
      {accentClass && <div className={`mb-2 h-1 w-10 rounded-full ${accentClass}`} />}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
          <p className="mt-1 text-xl font-semibold leading-none text-stone-950">{value}</p>
          {sub && <p className="mt-1 text-xs leading-snug text-stone-500">{sub}</p>}
        </div>
        <div className="rounded-xl bg-stone-100 p-1.5 text-stone-600"><Icon size={16} /></div>
      </div>
    </div>
  );
}

export function QueueCard({ icon: Icon, label, value, sub, onClick, tone = "stock" }) {
  const tones = {
    stock: "border-[#b7412e]/20 hover:border-[#b7412e]/45 hover:bg-[#b7412e]/8",
    sales: "border-[#e06b2c]/20 hover:border-[#e06b2c]/45 hover:bg-[#e06b2c]/10",
    finance: "border-[#f0be45]/25 hover:border-[#f0be45]/60 hover:bg-[#f0be45]/12",
  };

  return (
    <button type="button" onClick={onClick} className={`premium-card rounded-2xl border bg-[#fffdf8] p-4 text-left shadow-[0_10px_26px_rgba(41,37,36,0.045)] ${tones[tone] || tones.stock}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold leading-none text-stone-950">{value}</p>
          {sub && <p className="mt-2 text-sm leading-snug text-stone-600">{sub}</p>}
        </div>
        <div className="rounded-xl bg-stone-900 p-2 text-amber-50"><Icon size={18} /></div>
      </div>
    </button>
  );
}
