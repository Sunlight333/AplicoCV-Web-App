import { Reveal, RevealGroup } from '@/components/motion/Reveal'
import { useT } from '@/i18n/I18nProvider'

const avatars = ['avatar-01', 'avatar-02', 'avatar-03']

export function Testimonials() {
  const t = useT()
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">{t.testimonials.kicker}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{t.testimonials.title}</h2>
      </Reveal>

      <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
        {t.testimonials.items.map((item, i) => (
          <Reveal key={item.name}>
            <figure className="flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-7 shadow-card">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, s) => (
                  <svg key={s} viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" />
                  </svg>
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-navy-600">“{item.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img
                  src={`/avatars/${avatars[i]}.png`}
                  alt={item.name}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-electric-100"
                />
                <div>
                  <p className="text-sm font-semibold text-navy-900">{item.name}</p>
                  <p className="text-xs text-navy-400">{item.role}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  )
}
