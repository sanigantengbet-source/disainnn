import { useState } from "react";
import { ChevronDown, Search, Palette, Type, ShieldCheck, Star, FileText, KeyRound, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Search,
    title: "Ekstraksi CSS asli",
    body: "DesignSF membaca CSS yang benar-benar dimuat halaman — stylesheet eksternal, tag <style>, sampai atribut style — bukan menebak lewat AI.",
  },
  {
    icon: Palette,
    title: "Token warna otomatis",
    body: "Semua warna dihitung frekuensinya lalu dipisah menjadi warna utama dan netral, lengkap dengan nilai hex yang siap dipakai.",
  },
  {
    icon: Type,
    title: "Skala tipografi & radius",
    body: "Font family, ukuran, weight, line-height per elemen, plus daftar border-radius yang dipakai di seluruh halaman.",
  },
  {
    icon: ShieldCheck,
    title: "Audit & skor akurasi",
    body: "Setiap sumber CSS dilaporkan: ukuran, jumlah rule, dan skor akurasi warna serta tipografi supaya hasilnya bisa dipercaya.",
  },
];

const STEPS = [
  { n: "01", t: "Tempel URL", d: "Masukkan alamat situs apa pun, aktifkan multi-page bila ingin memindai beberapa halaman sekaligus." },
  { n: "02", t: "DesignSF memindai", d: "Halaman diambil, seluruh CSS diurai, lalu warna, font, dan radius dikumpulkan jadi token." },
  { n: "03", t: "Opsional: pasang token AI", d: "Tekan ikon kunci atau menu titik tiga → Pengaturan AI, tempel API key OpenAI / Gemini / Claude, tes koneksi, lalu simpan. Key hanya disimpan di browser Anda." },
  { n: "04", t: "Ambil hasilnya", d: "Salin DESIGN.md, README hasil AI, atau preview HTML-nya, langsung tempel ke proyek atau ke asisten AI Anda." },
];

const TOKEN_GUIDES = [
  {
    name: "OpenAI",
    prefix: "sk-...",
    url: "https://platform.openai.com/api-keys",
    steps: [
      "Buka platform.openai.com lalu login.",
      "Masuk ke menu API keys → Create new secret key.",
      "Salin key (hanya tampil sekali) dan pastikan billing/kredit aktif.",
    ],
  },
  {
    name: "Google Gemini / AI Studio",
    prefix: "AIza...",
    url: "https://aistudio.google.com/app/apikey",
    steps: [
      "Buka aistudio.google.com dan login dengan akun Google.",
      "Klik Get API key → Create API key, pilih project.",
      "Salin key-nya; tier gratis Gemini sudah cukup untuk DesignSF.",
    ],
  },
  {
    name: "Anthropic Claude",
    prefix: "sk-ant-...",
    url: "https://console.anthropic.com/settings/keys",
    steps: [
      "Buka console.anthropic.com lalu login.",
      "Settings → API keys → Create Key.",
      "Salin key dan isi kredit di halaman Billing bila masih kosong.",
    ],
  },
];


const TESTIMONIALS = [
  { name: "Rizky A.", role: "Frontend Developer", text: "Biasanya saya inspect element satu-satu buat nyari warna. Sekarang tinggal tempel URL, DESIGN.md-nya langsung rapi." },
  { name: "Sinta W.", role: "Product Designer", text: "Skala tipografinya akurat banget. Buat riset kompetitor ini jauh lebih cepat daripada bikin moodboard manual." },
  { name: "Bagas P.", role: "Freelancer", text: "Fitur audit sumber CSS-nya bikin saya percaya sama hasilnya, jelas kelihatan datanya diambil dari mana." },
  { name: "Nadia K.", role: "UI Engineer", text: "Saya copy DESIGN.md-nya lalu kasih ke AI buat bikin komponen. Hasilnya konsisten sama brand aslinya." },
  { name: "Fajar H.", role: "Web Developer", text: "Multi-page scan-nya berguna waktu klien minta gaya yang sama untuk beberapa halaman. Hemat waktu banget." },
  { name: "Ayu L.", role: "Design Lead", text: "Ringan, tanpa daftar akun, dan langsung jalan di HP. Simpel tapi hasilnya serius." },
];

const FAQS = [
  {
    q: "Apa sebenarnya yang dilakukan DesignSF?",
    a: "DesignSF mengambil halaman dari URL yang Anda masukkan, membaca seluruh CSS-nya, lalu menyusun ulang menjadi design system: palet warna, skala tipografi, radius, preview HTML, dan file DESIGN.md.",
  },
  {
    q: "Apakah hasilnya tebakan AI?",
    a: "Tidak. Semua nilai berasal dari CSS asli yang dimuat halaman tersebut. Setiap sumber CSS ditampilkan di bagian audit beserta skor akurasinya.",
  },
  {
    q: "Untuk apa file DESIGN.md itu?",
    a: "DESIGN.md berisi ringkasan token dalam format markdown yang bisa langsung ditempel ke dokumentasi proyek atau diberikan ke asisten AI sebagai acuan gaya.",
  },
  {
    q: "Apa fungsi mode multi-page?",
    a: "Mode multi-page memindai beberapa halaman dari situs yang sama sehingga Anda bisa membandingkan token antar halaman lewat tab hasil.",
  },
  {
    q: "Apakah situs saya perlu izin khusus?",
    a: "Tidak. DesignSF hanya membaca aset publik yang memang sudah bisa diakses browser mana pun, dan tidak menyimpan data Anda.",
  },
  {
    q: "Apakah token AI wajib?",
    a: "Tidak wajib. Tanpa token, Anda tetap dapat ekstraksi penuh dan DESIGN.md versi template. Token AI hanya dipakai untuk menyusun README/DESIGN.md yang lebih rapi dan naratif.",
  },
  {
    q: "Di mana token AI saya disimpan?",
    a: "Hanya di localStorage browser Anda. Token dipakai sekali per permintaan untuk memanggil provider yang Anda pilih (OpenAI, Gemini, atau Claude) dan tidak pernah kami simpan di server.",
  },
  {
    q: "Kenapa muncul error 429 saat pakai AI?",
    a: "Itu berarti kuota atau rate limit provider habis. Aktifkan opsi Auto-switch model di Pengaturan AI supaya DesignSF otomatis mencoba model lain dari provider yang sama.",
  },
];


function TestimonialCard({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <article className="mr-4 w-[280px] shrink-0 rounded-2xl border border-border bg-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
        <span className="shrink-0 text-xs text-muted-foreground">{t.role}</span>
      </div>
      <div className="mt-2 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-3.5 fill-primary text-primary" />
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
    </article>
  );
}

export function LandingSections() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mt-20 space-y-20">
      <section>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          DesignSF: ubah situs apa pun jadi design system
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          DesignSF adalah alat gratis yang berjalan sepenuhnya di browser, tanpa instalasi, tanpa API
          key, dan tanpa baris perintah. Tempel URL apa pun dan DesignSF akan membaca CSS yang benar-benar
          dimuat halaman itu, lalu mengembalikan satu laporan berisi warna, tipografi, radius, preview
          HTML, dan file <span className="text-foreground">DESIGN.md</span> yang siap dipakai.
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Cocok untuk riset kompetitor, membangun ulang gaya visual sebuah produk, atau memberi konteks
          desain ke asisten AI. Semua nilai diambil dari sumber aslinya — bukan hasil tebakan — dan setiap
          sumber CSS dilaporkan lengkap dengan skor akurasi.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="grid size-10 place-items-center rounded-xl border border-border bg-secondary text-primary">
                <f.icon className="size-4" />
              </span>
              <p className="mt-4 text-base font-semibold text-foreground">{f.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Cara kerjanya</h2>
        <p className="mt-3 text-base text-muted-foreground">
          Empat langkah, tanpa akun dan tanpa konfigurasi — langkah token AI sifatnya opsional.
        </p>

        <div className="mt-8 space-y-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 font-mono text-sm text-primary">
                {s.n}
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground">{s.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="token-ai" className="scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Token AI: apa & cara ambilnya</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Token AI (API key) adalah kunci pribadi dari penyedia model seperti OpenAI, Google Gemini, atau
          Anthropic Claude. DesignSF memakainya hanya saat Anda menekan tombol generate README/DESIGN.md
          berbasis AI. Tanpa token, semua fitur ekstraksi CSS tetap berjalan normal.
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Token disimpan <span className="text-foreground">hanya di browser Anda</span> (localStorage),
          dikirim langsung ke provider yang Anda pilih, dan tidak pernah menyentuh server kami. Anda bisa
          menghapusnya kapan saja lewat tombol <span className="text-foreground">Clear</span> di dialog
          Pengaturan AI.
        </p>

        <div className="mt-8 space-y-4">
          {TOKEN_GUIDES.map((g) => (
            <div
              key={g.name}
              className="rounded-2xl border border-border bg-card p-5 transition-all duration-500 ease-out hover:border-primary/50"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <p className="truncate text-base font-semibold text-foreground">{g.name}</p>
                <code className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 font-mono text-[11px] text-primary">
                  {g.prefix}
                </code>
              </div>
              <ol className="mt-3 space-y-2">
                {g.steps.map((s, i) => (
                  <li key={s} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-secondary font-mono text-[10px] text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ol>
              <a
                href={g.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-all duration-300 ease-out hover:border-primary hover:bg-primary/10"
              >
                <KeyRound className="size-3.5 text-primary" /> Buka halaman API key
                <ExternalLink className="size-3" />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Setelah token tersimpan, tekan <span className="text-foreground">Test connection</span> di
            dialog Pengaturan AI untuk memastikan key dan model valid. Jika kuota model habis (error 429),
            aktifkan <span className="text-foreground">Auto-switch model</span> agar DesignSF otomatis
            mencoba model lain dari provider yang sama.
          </p>
        </div>
      </section>

      <section>

        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Apa kata pengguna</h2>
        <div className="relative mt-8 -mx-4 overflow-hidden px-4">
          <div className="dsf-marquee">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <TestimonialCard key={`${t.name}-${i}`} t={t} />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Pertanyaan yang sering diajukan</h2>
        <p className="mt-3 text-base text-muted-foreground">
          Hal yang paling sering ditanyakan sebelum memakai DesignSF.
        </p>
        <div className="mt-8 space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-left"
              >
                <span className="text-base font-medium text-foreground">{f.q}</span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    open === i && "rotate-180",
                  )}
                />
              </button>
              {open === i && (
                <p className="animate-in fade-in slide-in-from-top-1 border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground duration-300 ease-out">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <FileText className="size-5" />
        </span>
        <p className="mt-4 text-xl font-semibold text-foreground">Siap mencoba?</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Gulir ke atas, tempel URL situs favorit Anda, dan dapatkan DESIGN.md-nya dalam hitungan detik.
        </p>
      </section>
    </div>
  );
}
