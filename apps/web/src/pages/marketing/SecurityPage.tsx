import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell, LegalSections } from '@/components/layout/MarketingShell'
import { useCopy } from './useCopy'

const C = 'security@aplicocv.com'

interface SecurityCopy {
  eyebrow: string; title: string; subtitle: string
  sections: { title: string; paras?: string[]; bullets?: string[] }[]
}

const COPY: Record<Locale, SecurityCopy> = {
  en: {
    eyebrow: 'Security', title: 'Security at AplicoCV',
    subtitle: 'How we protect your account, your CV, and the credentials you trust us with.',
    sections: [
      { title: 'Encryption everywhere', bullets: [
        'All traffic between you and AplicoCV is encrypted in transit with HTTPS/TLS.',
        'Your AplicoCV account password is stored only as a salted hash — never in plain text.',
        'Saved job-portal passwords are encrypted at rest with authenticated encryption and decrypted only transiently, on our server, when you explicitly confirm an autofill.',
        'The extension stores your sign-in token encrypted on your own device (AES-256-GCM).',
      ] },
      { title: 'Least-privilege extension', paras: [
        'The browser extension requests access only to the job-portal domains it supports, acts only on the page where you click “Autofill” or confirm a login, and contains no remote or dynamically loaded code — all logic ships inside the reviewed package.',
      ] },
      { title: 'Data handling', bullets: [
        'We never sell your personal data and never use it for advertising.',
        'Trusted sub-processors (hosting, storage, AI, payments, email) process data only to run the service.',
        'You can export or delete your account and all associated data at any time from your settings.',
      ] },
      { title: 'Responsible disclosure', paras: [
        `We welcome reports from security researchers. If you believe you’ve found a vulnerability, please email ${C} with steps to reproduce. Please give us a reasonable window to remediate before any public disclosure, and avoid accessing or modifying other users’ data while testing.`,
      ] },
      { title: 'Questions', paras: [`For any security or privacy question, reach us at ${C}.`] },
    ],
  },
  es: {
    eyebrow: 'Seguridad', title: 'Seguridad en AplicoCV',
    subtitle: 'Cómo protegemos tu cuenta, tu CV y las credenciales que nos confías.',
    sections: [
      { title: 'Cifrado en todo', bullets: [
        'Todo el tráfico entre tú y AplicoCV se cifra en tránsito con HTTPS/TLS.',
        'La contraseña de tu cuenta de AplicoCV se guarda solo como un hash con sal — nunca en texto plano.',
        'Las contraseñas de portales guardadas se cifran en reposo con cifrado autenticado y solo se descifran de forma transitoria, en nuestro servidor, cuando confirmas explícitamente un autocompletado.',
        'La extensión guarda tu token de inicio de sesión cifrado en tu propio dispositivo (AES-256-GCM).',
      ] },
      { title: 'Extensión de mínimo privilegio', paras: [
        'La extensión solicita acceso solo a los dominios de portales que admite, actúa solo en la página donde haces clic en “Autocompletar” o confirmas un inicio de sesión, y no contiene código remoto ni cargado dinámicamente — toda la lógica viaja dentro del paquete revisado.',
      ] },
      { title: 'Manejo de datos', bullets: [
        'Nunca vendemos tus datos personales ni los usamos para publicidad.',
        'Los subprocesadores de confianza (hosting, almacenamiento, IA, pagos, correo) procesan datos solo para operar el servicio.',
        'Puedes exportar o eliminar tu cuenta y todos los datos asociados en cualquier momento desde tus ajustes.',
      ] },
      { title: 'Divulgación responsable', paras: [
        `Agradecemos los reportes de investigadores de seguridad. Si crees haber encontrado una vulnerabilidad, escríbenos a ${C} con los pasos para reproducirla. Danos un plazo razonable para corregirla antes de cualquier divulgación pública y evita acceder o modificar datos de otros usuarios durante las pruebas.`,
      ] },
      { title: 'Preguntas', paras: [`Para cualquier pregunta de seguridad o privacidad, contáctanos en ${C}.`] },
    ],
  },
  'pt-BR': {
    eyebrow: 'Segurança', title: 'Segurança na AplicoCV',
    subtitle: 'Como protegemos sua conta, seu currículo e as credenciais que você confia a nós.',
    sections: [
      { title: 'Criptografia em tudo', bullets: [
        'Todo o tráfego entre você e a AplicoCV é criptografado em trânsito com HTTPS/TLS.',
        'A senha da sua conta AplicoCV é guardada apenas como um hash com sal — nunca em texto puro.',
        'As senhas de portais salvas são criptografadas em repouso com criptografia autenticada e só são descriptografadas de forma transitória, no nosso servidor, quando você confirma explicitamente um preenchimento.',
        'A extensão guarda seu token de login criptografado no seu próprio dispositivo (AES-256-GCM).',
      ] },
      { title: 'Extensão de privilégio mínimo', paras: [
        'A extensão solicita acesso apenas aos domínios de portais que suporta, age apenas na página onde você clica em “Preencher” ou confirma um login, e não contém código remoto ou carregado dinamicamente — toda a lógica vai dentro do pacote revisado.',
      ] },
      { title: 'Tratamento de dados', bullets: [
        'Nunca vendemos seus dados pessoais nem os usamos para publicidade.',
        'Subprocessadores confiáveis (hospedagem, armazenamento, IA, pagamentos, e-mail) processam dados apenas para operar o serviço.',
        'Você pode exportar ou excluir sua conta e todos os dados associados a qualquer momento nas configurações.',
      ] },
      { title: 'Divulgação responsável', paras: [
        `Agradecemos relatos de pesquisadores de segurança. Se você acredita ter encontrado uma vulnerabilidade, escreva para ${C} com os passos para reproduzir. Dê-nos um prazo razoável para corrigir antes de qualquer divulgação pública e evite acessar ou modificar dados de outros usuários durante os testes.`,
      ] },
      { title: 'Dúvidas', paras: [`Para qualquer dúvida de segurança ou privacidade, fale conosco em ${C}.`] },
    ],
  },
}

export default function SecurityPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell heroImage="/pages/security-abstract.png" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <LegalSections sections={c.sections} />
    </MarketingShell>
  )
}
