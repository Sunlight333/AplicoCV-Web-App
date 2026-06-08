import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell, LegalSections, MarketingSection, linkifyEmails } from '@/components/layout/MarketingShell'
import { useCopy } from './useCopy'

const EFFECTIVE_DATE = 'June 5, 2026'

interface CookiesCopy {
  eyebrow: string; title: string; subtitle: string
  sections: { title: string; paras?: string[]; bullets?: string[] }[]
  moreTitle: string; morePre: string; privacyLabel: string; moreMid: string
}

const COPY: Record<Locale, CookiesCopy> = {
  en: {
    eyebrow: 'Legal', title: 'Cookie Policy', subtitle: `Last updated: ${EFFECTIVE_DATE}`,
    sections: [
      { title: 'What we use', paras: ['AplicoCV uses a minimal set of cookies and similar local-storage technologies to run the service. We do not use advertising or cross-site tracking cookies.'] },
      { title: 'Categories', bullets: [
        'Strictly necessary. Keep you signed in and protect against cross-site request forgery. The service cannot function without these.',
        'Preferences. Remember choices such as your language so the app loads the way you left it. These live in your browser’s local storage.',
        'Aggregate analytics (optional). If enabled, privacy-respecting, aggregated usage metrics help us understand which features to improve. They do not identify you personally.',
      ] },
      { title: 'The browser extension', paras: ['The extension stores your encrypted sign-in token and your preferences locally on your device using the browser’s extension storage. It does not set tracking cookies on the sites you visit.'] },
      { title: 'Managing cookies', paras: ['You can clear or block cookies in your browser settings at any time; note that blocking strictly necessary cookies will sign you out and prevent the app from working. You can also sign out from within AplicoCV to clear your session.'] },
    ],
    moreTitle: 'More information', morePre: 'For how we handle your data overall, see our ', privacyLabel: 'Privacy Policy',
    moreMid: '. Questions? Email support@aplicocv.com.',
  },
  es: {
    eyebrow: 'Legal', title: 'Política de Cookies', subtitle: `Última actualización: ${EFFECTIVE_DATE}`,
    sections: [
      { title: 'Qué usamos', paras: ['AplicoCV usa un conjunto mínimo de cookies y tecnologías de almacenamiento local similares para operar el servicio. No usamos cookies de publicidad ni de seguimiento entre sitios.'] },
      { title: 'Categorías', bullets: [
        'Estrictamente necesarias. Te mantienen con la sesión iniciada y protegen contra la falsificación de solicitudes entre sitios. El servicio no puede funcionar sin estas.',
        'Preferencias. Recuerdan elecciones como tu idioma para que la app cargue como la dejaste. Viven en el almacenamiento local de tu navegador.',
        'Analítica agregada (opcional). Si se activa, métricas de uso agregadas y respetuosas con la privacidad nos ayudan a saber qué mejorar. No te identifican personalmente.',
      ] },
      { title: 'La extensión del navegador', paras: ['La extensión guarda tu token de inicio de sesión cifrado y tus preferencias localmente en tu dispositivo usando el almacenamiento de extensiones del navegador. No coloca cookies de seguimiento en los sitios que visitas.'] },
      { title: 'Gestionar cookies', paras: ['Puedes borrar o bloquear cookies en la configuración de tu navegador en cualquier momento; ten en cuenta que bloquear las estrictamente necesarias cerrará tu sesión e impedirá que la app funcione. También puedes cerrar sesión dentro de AplicoCV para limpiar tu sesión.'] },
    ],
    moreTitle: 'Más información', morePre: 'Para saber cómo manejamos tus datos en general, consulta nuestra ', privacyLabel: 'Política de Privacidad',
    moreMid: '. ¿Preguntas? Escribe a support@aplicocv.com.',
  },
  'pt-BR': {
    eyebrow: 'Jurídico', title: 'Política de Cookies', subtitle: `Última atualização: ${EFFECTIVE_DATE}`,
    sections: [
      { title: 'O que usamos', paras: ['A AplicoCV usa um conjunto mínimo de cookies e tecnologias de armazenamento local semelhantes para operar o serviço. Não usamos cookies de publicidade nem de rastreamento entre sites.'] },
      { title: 'Categorias', bullets: [
        'Estritamente necessários. Mantêm você conectado e protegem contra falsificação de solicitação entre sites. O serviço não funciona sem eles.',
        'Preferências. Lembram escolhas como o seu idioma para o app carregar como você deixou. Ficam no armazenamento local do seu navegador.',
        'Analytics agregado (opcional). Se ativado, métricas de uso agregadas e que respeitam a privacidade nos ajudam a saber o que melhorar. Não identificam você pessoalmente.',
      ] },
      { title: 'A extensão do navegador', paras: ['A extensão guarda seu token de login criptografado e suas preferências localmente no seu dispositivo usando o armazenamento de extensões do navegador. Ela não define cookies de rastreamento nos sites que você visita.'] },
      { title: 'Gerenciar cookies', paras: ['Você pode limpar ou bloquear cookies nas configurações do navegador a qualquer momento; observe que bloquear os estritamente necessários encerrará sua sessão e impedirá o app de funcionar. Você também pode sair da AplicoCV para limpar sua sessão.'] },
    ],
    moreTitle: 'Mais informações', morePre: 'Para saber como tratamos seus dados de modo geral, consulte nossa ', privacyLabel: 'Política de Privacidade',
    moreMid: '. Dúvidas? Escreva para support@aplicocv.com.',
  },
}

export default function CookiesPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell heroImage="/pages/cookies-abstract.png" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <LegalSections sections={c.sections} />
      <MarketingSection title={c.moreTitle}>
        <p>
          {c.morePre}
          <Link className="text-electric-600 hover:underline" to="/privacy">{c.privacyLabel}</Link>
          {linkifyEmails(c.moreMid)}
        </p>
      </MarketingSection>
    </MarketingShell>
  )
}
