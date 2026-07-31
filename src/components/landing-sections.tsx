import { useState } from "react";
import { ChevronDown, Search, Palette, Type, ShieldCheck, Star, FileText } from "lucide-react";
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
  { n: "03", t: "Ambil hasilnya", d: "Salin DESIGN.md atau preview HTML-nya, langsung tempel ke proyek atau ke asisten AI Anda." },
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

      <section>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Cara kerjanya</h2>
        <p className="mt-3 text-base text-muted-foreground">Tiga langkah, tanpa akun dan tanpa konfigurasi.</p>
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

      <section>
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
                <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
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
