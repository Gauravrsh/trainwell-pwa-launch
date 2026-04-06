const IconReview = () => {
  const sizes = [512, 192, 128, 64, 48];

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center gap-12">
      <h1 className="text-2xl font-bold tracking-tight">Icon Review</h1>

      {/* Wordmark comparison */}
      <section className="flex flex-col items-center gap-4">
        <p className="text-sm text-neutral-400 uppercase tracking-widest">Wordmark Reference</p>
        <p className="text-6xl font-bold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span className="text-[#BFFF00]">V</span>
          <span className="text-white">ECTO</span>
        </p>
      </section>

      {/* Draft icon large */}
      <section className="flex flex-col items-center gap-4">
        <p className="text-sm text-neutral-400 uppercase tracking-widest">Draft Icon (Full Size)</p>
        <div className="rounded-3xl overflow-hidden border border-neutral-800">
          <img src="/vecto-app-icon-draft.png" alt="Vecto icon draft" width={512} height={512} />
        </div>
      </section>

      {/* Launcher mockups */}
      <section className="flex flex-col items-center gap-6">
        <p className="text-sm text-neutral-400 uppercase tracking-widest">Launcher Size Mockups</p>
        <div className="flex flex-wrap items-end justify-center gap-8">
          {sizes.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className="rounded-2xl overflow-hidden border border-neutral-800" style={{ width: s, height: s }}>
                <img
                  src="/vecto-app-icon-draft.png"
                  alt={`${s}px`}
                  width={s}
                  height={s}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs text-neutral-500">{s}px</span>
            </div>
          ))}
        </div>
      </section>

      {/* Side-by-side V comparison */}
      <section className="flex flex-col items-center gap-4">
        <p className="text-sm text-neutral-400 uppercase tracking-widest">V Comparison (Icon vs Wordmark)</p>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl overflow-hidden border border-neutral-800 w-24 h-24">
              <img src="/vecto-app-icon-draft.png" alt="Icon V" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-neutral-500">Icon</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-[#0a0a0a] border border-neutral-800 rounded-2xl flex items-center justify-center">
              <span className="text-[#BFFF00] text-6xl font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>V</span>
            </div>
            <span className="text-xs text-neutral-500">Wordmark V</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IconReview;
