import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { MarketingShell, LegalSections } from '@/components/layout/MarketingShell'

const EFFECTIVE_DATE = 'June 5, 2026'
const C = 'support@aplicocv.com'

interface TermsCopy {
  title: string; updated: string; lead: string
  sections: { title: string; paras?: string[]; bullets?: string[] }[]
}

const COPY: Record<Locale, TermsCopy> = {
  en: {
    title: 'Terms of Service', updated: `Last updated: ${EFFECTIVE_DATE}`,
    lead: 'These Terms govern your use of the AplicoCV web application and browser extension (the “Service”). By creating an account or using the Service, you agree to them.',
    sections: [
      { title: 'The Service', paras: ['AplicoCV helps you structure a professional profile and autofill job-application forms. You are responsible for reviewing every field the Service fills or generates before you submit an application — the AI assists, it does not replace your judgment, and it must not be used to misrepresent your experience.'] },
      { title: 'Your account', paras: ['You must provide accurate information and keep your credentials secure. You are responsible for activity under your account. You must be at least 16 years old to use the Service.'] },
      { title: 'Acceptable use', bullets: ['Do not submit false information or impersonate others.', 'Do not abuse, scrape, or attempt to disrupt the Service or the job portals it supports.', 'Do not use the Service for unlawful purposes or to violate any portal’s terms.'] },
      { title: 'Credits, plans & billing', paras: ['Some features consume credits or require a paid plan. Paid plans are billed on a recurring basis and may be cancelled at any time; cancellation stops future renewals. Credits and promotional bonuses have no cash value and may expire. Prices and features may change with notice.'] },
      { title: 'Your content', paras: ['You retain ownership of the CV, profile, and documents you provide or generate. You grant us a limited licence to process them solely to operate the Service (see our Privacy Policy).'] },
      { title: 'AI-generated output', paras: ['AI-generated CVs, cover letters, and answers may contain inaccuracies. You are responsible for reviewing and editing them before use. We make no guarantee of interviews, offers, or employment outcomes.'] },
      { title: 'Disclaimers & liability', paras: ['The Service is provided “as is” without warranties of any kind. To the maximum extent permitted by law, we are not liable for indirect or consequential damages, and our total liability is limited to the amount you paid in the prior 12 months.'] },
      { title: 'Termination', paras: ['You may stop using the Service at any time. We may suspend or terminate accounts that violate these Terms. You can request deletion of your account by contacting us.'] },
      { title: 'Changes', paras: ['We may update these Terms; we will revise the “Last updated” date and, for material changes, notify you through the Service.'] },
      { title: 'Contact', paras: [`Questions about these Terms? ${C}`] },
    ],
  },
  es: {
    title: 'Términos de Servicio', updated: `Última actualización: ${EFFECTIVE_DATE}`,
    lead: 'Estos Términos rigen tu uso de la aplicación web y la extensión de navegador de AplicoCV (el “Servicio”). Al crear una cuenta o usar el Servicio, los aceptas.',
    sections: [
      { title: 'El Servicio', paras: ['AplicoCV te ayuda a estructurar un perfil profesional y a autocompletar formularios de postulación. Eres responsable de revisar cada campo que el Servicio completa o genera antes de enviar una postulación — la IA asiste, no reemplaza tu juicio, y no debe usarse para tergiversar tu experiencia.'] },
      { title: 'Tu cuenta', paras: ['Debes proporcionar información precisa y mantener tus credenciales seguras. Eres responsable de la actividad en tu cuenta. Debes tener al menos 16 años para usar el Servicio.'] },
      { title: 'Uso aceptable', bullets: ['No envíes información falsa ni te hagas pasar por otros.', 'No abuses, extraigas datos ni intentes interrumpir el Servicio o los portales que admite.', 'No uses el Servicio con fines ilícitos ni para violar los términos de ningún portal.'] },
      { title: 'Créditos, planes y facturación', paras: ['Algunas funciones consumen créditos o requieren un plan de pago. Los planes de pago se facturan de forma recurrente y pueden cancelarse en cualquier momento; la cancelación detiene las renovaciones futuras. Los créditos y bonos promocionales no tienen valor en efectivo y pueden caducar. Los precios y funciones pueden cambiar con previo aviso.'] },
      { title: 'Tu contenido', paras: ['Conservas la propiedad del CV, el perfil y los documentos que proporcionas o generas. Nos concedes una licencia limitada para procesarlos únicamente para operar el Servicio (consulta nuestra Política de Privacidad).'] },
      { title: 'Resultados generados por IA', paras: ['Los CVs, cartas y respuestas generados por IA pueden contener imprecisiones. Eres responsable de revisarlos y editarlos antes de usarlos. No garantizamos entrevistas, ofertas ni resultados de empleo.'] },
      { title: 'Renuncias y responsabilidad', paras: ['El Servicio se proporciona “tal cual”, sin garantías de ningún tipo. En la máxima medida permitida por la ley, no somos responsables de daños indirectos o consecuentes, y nuestra responsabilidad total se limita al monto que pagaste en los 12 meses anteriores.'] },
      { title: 'Terminación', paras: ['Puedes dejar de usar el Servicio en cualquier momento. Podemos suspender o cancelar cuentas que violen estos Términos. Puedes solicitar la eliminación de tu cuenta contactándonos.'] },
      { title: 'Cambios', paras: ['Podemos actualizar estos Términos; revisaremos la fecha de “Última actualización” y, para cambios importantes, te notificaremos a través del Servicio.'] },
      { title: 'Contacto', paras: [`¿Preguntas sobre estos Términos? ${C}`] },
    ],
  },
  'pt-BR': {
    title: 'Termos de Serviço', updated: `Última atualização: ${EFFECTIVE_DATE}`,
    lead: 'Estes Termos regem seu uso do aplicativo web e da extensão de navegador da AplicoCV (o “Serviço”). Ao criar uma conta ou usar o Serviço, você os aceita.',
    sections: [
      { title: 'O Serviço', paras: ['A AplicoCV ajuda você a estruturar um perfil profissional e a preencher formulários de candidatura. Você é responsável por revisar cada campo que o Serviço preenche ou gera antes de enviar uma candidatura — a IA auxilia, não substitui seu julgamento, e não deve ser usada para deturpar sua experiência.'] },
      { title: 'Sua conta', paras: ['Você deve fornecer informações precisas e manter suas credenciais seguras. Você é responsável pela atividade na sua conta. Você precisa ter pelo menos 16 anos para usar o Serviço.'] },
      { title: 'Uso aceitável', bullets: ['Não envie informações falsas nem se passe por outra pessoa.', 'Não abuse, extraia dados nem tente interromper o Serviço ou os portais que ele suporta.', 'Não use o Serviço para fins ilegais nem para violar os termos de qualquer portal.'] },
      { title: 'Créditos, planos e faturamento', paras: ['Alguns recursos consomem créditos ou exigem um plano pago. Os planos pagos são cobrados de forma recorrente e podem ser cancelados a qualquer momento; o cancelamento interrompe as renovações futuras. Créditos e bônus promocionais não têm valor em dinheiro e podem expirar. Preços e recursos podem mudar mediante aviso.'] },
      { title: 'Seu conteúdo', paras: ['Você mantém a propriedade do currículo, perfil e documentos que fornece ou gera. Você nos concede uma licença limitada para processá-los apenas para operar o Serviço (consulte nossa Política de Privacidade).'] },
      { title: 'Conteúdo gerado por IA', paras: ['Currículos, cartas e respostas gerados por IA podem conter imprecisões. Você é responsável por revisá-los e editá-los antes de usar. Não garantimos entrevistas, propostas ou resultados de emprego.'] },
      { title: 'Isenções e responsabilidade', paras: ['O Serviço é fornecido “como está”, sem garantias de qualquer tipo. Na máxima extensão permitida por lei, não somos responsáveis por danos indiretos ou consequentes, e nossa responsabilidade total limita-se ao valor que você pagou nos 12 meses anteriores.'] },
      { title: 'Rescisão', paras: ['Você pode parar de usar o Serviço a qualquer momento. Podemos suspender ou encerrar contas que violem estes Termos. Você pode solicitar a exclusão da sua conta entrando em contato conosco.'] },
      { title: 'Alterações', paras: ['Podemos atualizar estes Termos; revisaremos a data de “Última atualização” e, para mudanças relevantes, avisaremos você pelo Serviço.'] },
      { title: 'Contato', paras: [`Dúvidas sobre estes Termos? ${C}`] },
    ],
  },
}

export default function TermsPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell eyebrow="Legal" title={c.title} subtitle={c.updated}>
      <p className="text-navy-600">{c.lead}</p>
      <LegalSections sections={c.sections} />
    </MarketingShell>
  )
}
