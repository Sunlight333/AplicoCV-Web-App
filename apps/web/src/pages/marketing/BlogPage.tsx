import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCopy } from './useCopy'

interface Post { tag: string; date: string; title: string; excerpt: string; body: string[] }
interface BlogCopy {
  eyebrow: string; title: string; subtitle: string
  readMore: string; showLess: string; ctaTitle: string; ctaBody: string; ctaLink: string
  posts: Post[]
}

const COPY: Record<Locale, BlogCopy> = {
  en: {
    eyebrow: 'Blog & guides', title: 'Land more interviews',
    subtitle: 'Practical, no-fluff advice on CVs, ATS, cover letters and interviews — written by the team behind AplicoCV.',
    readMore: 'Read more →', showLess: 'Show less', ctaTitle: 'Put these tips to work',
    ctaBody: 'Score your ATS fit, rewrite your CV, and practice interviews — all in one place.', ctaLink: 'Get started free →',
    posts: [
      { tag: 'ATS', date: 'May 2026', title: 'How applicant tracking systems really read your CV', excerpt: 'Most CVs are filtered by software before a human sees them. Here’s how to get past it — honestly.', body: [
        'An ATS parses your CV into fields and scores it against the job description’s keywords. If the words a recruiter searches for aren’t on your CV, you can be filtered out before anyone reads it.',
        'The fix isn’t keyword stuffing — it’s mirroring the language of the posting where it’s genuinely true of you. Use the exact role title in your headline, and make sure the skills the job lists appear naturally in your experience.',
        'AplicoCV’s ATS Simulator shows your match score, which keywords you already cover, and which you’re missing — so every application is targeted, not generic.',
      ] },
      { tag: 'CV', date: 'May 2026', title: 'The X-Y-Z formula for achievement bullets', excerpt: 'Turn flat job duties into measurable accomplishments recruiters actually notice.', body: [
        'Google’s famous advice: write bullets as “Accomplished X, as measured by Y, by doing Z.” It forces a result and a number into every line.',
        'Instead of “Responsible for the checkout page,” write “Increased checkout conversion 14% by rebuilding the payment flow in React.” Same work — far more credible.',
        'Super-CV rewrites your experience with this formula automatically, using only the facts already in your CV.',
      ] },
      { tag: 'Cover letters', date: 'Apr 2026', title: 'Cover letters that don’t sound like everyone else’s', excerpt: 'A focused 250-word letter beats a generic page every time. Here’s the structure.', body: [
        'Open with the specific role and one concrete reason you’re a fit — not “I am writing to express my interest.” Middle: one proof point with a result. Close: a confident, brief call to action.',
        'Keep it to 250–350 words and match the company’s tone. A warm startup and a formal bank want different letters.',
        'AplicoCV generates a 100% personalized letter per posting, referencing the company, the role, and the points you want to emphasize.',
      ] },
      { tag: 'Interviews', date: 'Apr 2026', title: 'Use the STAR method to ace behavioral questions', excerpt: 'Situation, Task, Action, Result — the simple structure that makes answers land.', body: [
        'Behavioral questions (“tell me about a time…”) reward structure. STAR keeps you concrete: set the Situation and Task briefly, spend most of your answer on the Action you personally took, and always end with a measurable Result.',
        'Practice out loud. The gap between knowing a story and telling it well is bigger than people expect.',
        'AplicoCV’s AI mock interview asks role-specific questions and scores your answers with specific feedback so you improve before the real thing.',
      ] },
    ],
  },
  es: {
    eyebrow: 'Blog y guías', title: 'Consigue más entrevistas',
    subtitle: 'Consejos prácticos y sin relleno sobre CVs, ATS, cartas y entrevistas — escritos por el equipo de AplicoCV.',
    readMore: 'Leer más →', showLess: 'Mostrar menos', ctaTitle: 'Pon en práctica estos consejos',
    ctaBody: 'Evalúa tu compatibilidad ATS, reescribe tu CV y practica entrevistas — todo en un solo lugar.', ctaLink: 'Comenzar gratis →',
    posts: [
      { tag: 'ATS', date: 'Mayo 2026', title: 'Cómo leen realmente tu CV los sistemas ATS', excerpt: 'La mayoría de los CVs los filtra un software antes de que los vea una persona. Así puedes superarlo — con honestidad.', body: [
        'Un ATS analiza tu CV en campos y lo evalúa contra las palabras clave de la oferta. Si las palabras que busca un reclutador no están en tu CV, pueden descartarte antes de que alguien lo lea.',
        'La solución no es saturar de palabras clave, sino reflejar el lenguaje de la oferta donde realmente aplica a ti. Usa el título exacto del puesto en tu titular y asegúrate de que las habilidades que pide aparezcan de forma natural en tu experiencia.',
        'El Simulador ATS de AplicoCV muestra tu puntaje de coincidencia, qué palabras clave ya cubres y cuáles te faltan — para que cada postulación sea específica, no genérica.',
      ] },
      { tag: 'CV', date: 'Mayo 2026', title: 'La fórmula X-Y-Z para tus logros', excerpt: 'Convierte tareas planas en logros medibles que los reclutadores sí notan.', body: [
        'El famoso consejo de Google: escribe los puntos como “Logré X, medido por Y, haciendo Z.” Obliga a incluir un resultado y un número en cada línea.',
        'En lugar de “Responsable de la página de pago,” escribe “Aumenté la conversión de pago un 14% reconstruyendo el flujo de pago en React.” El mismo trabajo — mucho más creíble.',
        'Super-CV reescribe tu experiencia con esta fórmula automáticamente, usando solo los hechos que ya están en tu CV.',
      ] },
      { tag: 'Cartas', date: 'Abr 2026', title: 'Cartas que no suenan como las de todos', excerpt: 'Una carta enfocada de 250 palabras gana siempre a una página genérica. Esta es la estructura.', body: [
        'Abre con el puesto específico y una razón concreta de por qué encajas — no con “Escribo para expresar mi interés.” En el medio: una prueba con un resultado. Al cierre: un llamado a la acción breve y seguro.',
        'Mantenla en 250–350 palabras y ajusta el tono de la empresa. Una startup cercana y un banco formal quieren cartas distintas.',
        'AplicoCV genera una carta 100% personalizada por oferta, mencionando la empresa, el puesto y los puntos que quieres destacar.',
      ] },
      { tag: 'Entrevistas', date: 'Abr 2026', title: 'Usa el método STAR para preguntas de comportamiento', excerpt: 'Situación, Tarea, Acción, Resultado — la estructura simple que hace que tus respuestas conecten.', body: [
        'Las preguntas de comportamiento (“cuéntame de una vez que…”) premian la estructura. STAR te mantiene concreto: plantea brevemente la Situación y la Tarea, dedica la mayor parte a la Acción que tú tomaste y termina siempre con un Resultado medible.',
        'Practica en voz alta. La diferencia entre conocer una historia y contarla bien es mayor de lo que la gente cree.',
        'La entrevista simulada con IA de AplicoCV hace preguntas según el puesto y evalúa tus respuestas con feedback específico para que mejores antes de la entrevista real.',
      ] },
    ],
  },
  'pt-BR': {
    eyebrow: 'Blog e guias', title: 'Consiga mais entrevistas',
    subtitle: 'Conselhos práticos e sem enrolação sobre currículos, ATS, cartas e entrevistas — escritos pela equipe da AplicoCV.',
    readMore: 'Ler mais →', showLess: 'Mostrar menos', ctaTitle: 'Coloque essas dicas em prática',
    ctaBody: 'Avalie sua compatibilidade ATS, reescreva seu currículo e treine entrevistas — tudo num só lugar.', ctaLink: 'Começar grátis →',
    posts: [
      { tag: 'ATS', date: 'Maio 2026', title: 'Como os sistemas ATS realmente leem seu currículo', excerpt: 'A maioria dos currículos é filtrada por software antes de uma pessoa ver. Veja como passar — com honestidade.', body: [
        'Um ATS analisa seu currículo em campos e o avalia contra as palavras-chave da vaga. Se as palavras que um recrutador busca não estão no seu currículo, você pode ser filtrado antes de alguém ler.',
        'A solução não é encher de palavras-chave, e sim espelhar a linguagem da vaga onde realmente se aplica a você. Use o título exato do cargo no seu resumo e garanta que as habilidades pedidas apareçam naturalmente na sua experiência.',
        'O Simulador ATS da AplicoCV mostra sua pontuação de compatibilidade, quais palavras-chave você já cobre e quais faltam — para cada candidatura ser específica, não genérica.',
      ] },
      { tag: 'Currículo', date: 'Maio 2026', title: 'A fórmula X-Y-Z para suas conquistas', excerpt: 'Transforme tarefas sem graça em conquistas mensuráveis que os recrutadores notam.', body: [
        'O famoso conselho do Google: escreva os tópicos como “Realizei X, medido por Y, fazendo Z.” Isso força um resultado e um número em cada linha.',
        'Em vez de “Responsável pela página de checkout,” escreva “Aumentei a conversão do checkout em 14% reconstruindo o fluxo de pagamento em React.” O mesmo trabalho — muito mais convincente.',
        'O Super-CV reescreve sua experiência com essa fórmula automaticamente, usando apenas os fatos que já estão no seu currículo.',
      ] },
      { tag: 'Cartas', date: 'Abr 2026', title: 'Cartas que não soam como as de todo mundo', excerpt: 'Uma carta focada de 250 palavras ganha sempre de uma página genérica. Veja a estrutura.', body: [
        'Abra com a vaga específica e um motivo concreto de por que você combina — não com “Escrevo para manifestar meu interesse.” No meio: uma prova com resultado. No fim: uma chamada para ação breve e confiante.',
        'Mantenha entre 250–350 palavras e ajuste ao tom da empresa. Uma startup acolhedora e um banco formal querem cartas diferentes.',
        'A AplicoCV gera uma carta 100% personalizada por vaga, citando a empresa, o cargo e os pontos que você quer destacar.',
      ] },
      { tag: 'Entrevistas', date: 'Abr 2026', title: 'Use o método STAR para perguntas comportamentais', excerpt: 'Situação, Tarefa, Ação, Resultado — a estrutura simples que faz suas respostas funcionarem.', body: [
        'Perguntas comportamentais (“conte sobre uma vez em que…”) recompensam estrutura. O STAR te mantém concreto: defina a Situação e a Tarefa rapidamente, dedique a maior parte à Ação que você tomou e termine sempre com um Resultado mensurável.',
        'Pratique em voz alta. A diferença entre saber uma história e contá-la bem é maior do que as pessoas imaginam.',
        'A entrevista simulada com IA da AplicoCV faz perguntas conforme a vaga e avalia suas respostas com feedback específico para você melhorar antes da entrevista real.',
      ] },
    ],
  },
}

function PostCard({ post, readMore, showLess }: { post: Post; readMore: string; showLess: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 text-xs text-navy-400">
        <Badge tone="info">{post.tag}</Badge>
        <span>{post.date}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-navy-900">{post.title}</h3>
      <p className="mt-1.5 text-sm text-navy-500">{post.excerpt}</p>
      {open && (
        <div className="mt-4 space-y-3 border-t border-navy-100 pt-4 text-sm leading-relaxed text-navy-600">
          {post.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="mt-3 text-sm font-semibold text-electric-600 hover:underline">
        {open ? showLess : readMore}
      </button>
    </Card>
  )
}

export default function BlogPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} max="max-w-5xl">
      <div className="grid gap-5 md:grid-cols-2">
        {c.posts.map((p) => (
          <PostCard key={p.title} post={p} readMore={c.readMore} showLess={c.showLess} />
        ))}
      </div>

      <Card className="mt-8 flex flex-col items-center gap-2 p-8 text-center">
        <p className="font-semibold text-navy-900">{c.ctaTitle}</p>
        <p className="max-w-md text-sm text-navy-500">{c.ctaBody}</p>
        <Link to="/register" className="mt-2 text-sm font-semibold text-electric-600 hover:underline">
          {c.ctaLink}
        </Link>
      </Card>
    </MarketingShell>
  )
}
