import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { MarketingShell, LegalSections } from '@/components/layout/MarketingShell'

const EFFECTIVE_DATE = 'June 4, 2026'
const C = 'support@aplicocv.com'

interface PrivacyCopy {
  title: string; updated: string; lead: string
  sections: { title: string; paras?: string[]; bullets?: string[] }[]
}

const COPY: Record<Locale, PrivacyCopy> = {
  en: {
    title: 'Privacy Policy', updated: `Last updated: ${EFFECTIVE_DATE}`,
    lead: 'This Privacy Policy explains how AplicoCV (“AplicoCV”, “we”, “us”) collects, uses, stores, and protects your information when you use the AplicoCV web application and the AplicoCV browser extension (together, the “Service”). By creating an account or installing the extension, you agree to the practices described here.',
    sections: [
      { title: 'Information we collect', paras: ['We collect only the information needed to autofill job applications on your behalf:'], bullets: [
        'Account details. Your name and email address, and a securely hashed password (or a Google sign-in identifier if you use Google to sign in).',
        'Professional profile. The information you provide or that we extract from a CV you upload — such as work history, education, skills, and contact details — structured into a reusable profile.',
        'Job-portal credentials (optional). If you choose to save sign-in credentials for a job portal, the password is encrypted before storage and is only decrypted on our server, on demand, and only after you explicitly confirm an autofill.',
        'Application activity. Records of applications you track, such as job title, company, portal, and status.',
      ] },
      { title: 'How the browser extension uses your data', paras: ['The extension fills out job-application forms for you. When you trigger autofill on a supported job portal, it reads the form fields on that page and populates them with data from your AplicoCV profile. The extension:'], bullets: [
        'only acts on the page where you click “Autofill” or confirm a login;',
        'stores your sign-in token encrypted on your own device (AES-256-GCM) and never exposes it to the pages you visit;',
        'requests access only to the job-portal domains it supports, in order to fill those portals’ forms;',
        'contains no remote or dynamically loaded code — all logic ships inside the package.',
      ] },
      { title: 'How we use your information', paras: ['We use your information solely to provide the Service. We do not sell your personal data, and we do not use it for advertising. Specifically, we use it to:'], bullets: [
        'structure your CV into a professional profile;',
        'autofill application and login forms when you ask the extension to;',
        'generate documents such as tailored CVs and cover letters at your request;',
        'track the applications you submit;',
        'operate, secure, and improve the Service.',
      ] },
      { title: 'How your data is protected', bullets: [
        'Passwords for your AplicoCV account are stored only as salted hashes.',
        'Saved job-portal passwords are encrypted at rest with authenticated encryption and decrypted only transiently on the server when you confirm an autofill.',
        'Your extension sign-in token is encrypted on your device.',
        'All communication between the Service and our servers uses HTTPS.',
      ] },
      { title: 'Third-party services', paras: ['To deliver the Service, your data may be processed by infrastructure and service providers acting on our behalf, including a cloud hosting provider, an object-storage provider for uploaded documents, an AI provider used to structure profiles and generate documents, a payment processor for subscriptions, and an email provider for transactional messages. These providers process data only to perform their function for us and are not permitted to use it for their own purposes.'] },
      { title: 'Data retention and deletion', paras: [`We keep your information for as long as your account is active. You can request deletion of your account and associated data at any time by contacting us at ${C}. You may also remove saved portal credentials yourself from within the app at any time.`] },
      { title: 'Your rights', paras: [`Depending on your location, you may have the right to access, correct, export, or delete your personal data, and to withdraw consent. To exercise any of these rights, contact us at ${C}.`] },
      { title: 'Children', paras: ['The Service is not directed to children under 16, and we do not knowingly collect personal data from them.'] },
      { title: 'Changes to this policy', paras: ['We may update this Privacy Policy from time to time. When we do, we will revise the “Last updated” date above. Significant changes will be communicated through the Service.'] },
      { title: 'Contact us', paras: [`If you have questions about this Privacy Policy or how your data is handled, contact us at ${C}.`] },
    ],
  },
  es: {
    title: 'Política de Privacidad', updated: `Última actualización: ${EFFECTIVE_DATE}`,
    lead: 'Esta Política de Privacidad explica cómo AplicoCV (“AplicoCV”, “nosotros”) recopila, usa, almacena y protege tu información cuando usas la aplicación web y la extensión de navegador de AplicoCV (juntas, el “Servicio”). Al crear una cuenta o instalar la extensión, aceptas las prácticas aquí descritas.',
    sections: [
      { title: 'Información que recopilamos', paras: ['Solo recopilamos la información necesaria para autocompletar postulaciones en tu nombre:'], bullets: [
        'Datos de la cuenta. Tu nombre y correo electrónico, y una contraseña con hash seguro (o un identificador de inicio de sesión de Google si usas Google).',
        'Perfil profesional. La información que proporcionas o que extraemos de un CV que subes — como historial laboral, educación, habilidades y datos de contacto — estructurada en un perfil reutilizable.',
        'Credenciales de portales (opcional). Si decides guardar credenciales de un portal de empleo, la contraseña se cifra antes de almacenarla y solo se descifra en nuestro servidor, bajo demanda, y únicamente después de que confirmes explícitamente un autocompletado.',
        'Actividad de postulaciones. Registros de las postulaciones que sigues, como el puesto, la empresa, el portal y el estado.',
      ] },
      { title: 'Cómo usa tus datos la extensión', paras: ['La extensión completa los formularios de postulación por ti. Cuando activas el autocompletado en un portal compatible, lee los campos de esa página y los rellena con datos de tu perfil de AplicoCV. La extensión:'], bullets: [
        'solo actúa en la página donde haces clic en “Autocompletar” o confirmas un inicio de sesión;',
        'guarda tu token de inicio de sesión cifrado en tu propio dispositivo (AES-256-GCM) y nunca lo expone a las páginas que visitas;',
        'solicita acceso únicamente a los dominios de portales que admite, para completar sus formularios;',
        'no contiene código remoto ni cargado dinámicamente — toda la lógica viaja dentro del paquete.',
      ] },
      { title: 'Cómo usamos tu información', paras: ['Usamos tu información únicamente para prestar el Servicio. No vendemos tus datos personales y no los usamos para publicidad. En concreto, la usamos para:'], bullets: [
        'estructurar tu CV en un perfil profesional;',
        'autocompletar formularios de postulación e inicio de sesión cuando se lo pides a la extensión;',
        'generar documentos como CVs adaptados y cartas de presentación cuando lo solicitas;',
        'hacer seguimiento de las postulaciones que envías;',
        'operar, asegurar y mejorar el Servicio.',
      ] },
      { title: 'Cómo protegemos tus datos', bullets: [
        'Las contraseñas de tu cuenta de AplicoCV se guardan solo como hashes con sal.',
        'Las contraseñas de portales guardadas se cifran en reposo con cifrado autenticado y solo se descifran de forma transitoria en el servidor cuando confirmas un autocompletado.',
        'Tu token de inicio de sesión de la extensión se cifra en tu dispositivo.',
        'Toda la comunicación entre el Servicio y nuestros servidores usa HTTPS.',
      ] },
      { title: 'Servicios de terceros', paras: ['Para prestar el Servicio, tus datos pueden ser procesados por proveedores de infraestructura y servicios que actúan en nuestro nombre, incluidos un proveedor de hosting en la nube, un proveedor de almacenamiento de objetos para los documentos subidos, un proveedor de IA para estructurar perfiles y generar documentos, un procesador de pagos para las suscripciones y un proveedor de correo para mensajes transaccionales. Estos proveedores procesan los datos solo para cumplir su función y no pueden usarlos para sus propios fines.'] },
      { title: 'Conservación y eliminación de datos', paras: [`Conservamos tu información mientras tu cuenta esté activa. Puedes solicitar la eliminación de tu cuenta y los datos asociados en cualquier momento contactándonos en ${C}. También puedes eliminar tú mismo las credenciales de portales guardadas desde la app en cualquier momento.`] },
      { title: 'Tus derechos', paras: [`Según tu ubicación, puedes tener derecho a acceder, corregir, exportar o eliminar tus datos personales, y a retirar tu consentimiento. Para ejercer cualquiera de estos derechos, contáctanos en ${C}.`] },
      { title: 'Menores', paras: ['El Servicio no está dirigido a menores de 16 años y no recopilamos a sabiendas datos personales de ellos.'] },
      { title: 'Cambios en esta política', paras: ['Podemos actualizar esta Política de Privacidad de vez en cuando. Cuando lo hagamos, revisaremos la fecha de “Última actualización” de arriba. Los cambios importantes se comunicarán a través del Servicio.'] },
      { title: 'Contáctanos', paras: [`Si tienes preguntas sobre esta Política de Privacidad o sobre cómo se manejan tus datos, contáctanos en ${C}.`] },
    ],
  },
  'pt-BR': {
    title: 'Política de Privacidade', updated: `Última atualização: ${EFFECTIVE_DATE}`,
    lead: 'Esta Política de Privacidade explica como a AplicoCV (“AplicoCV”, “nós”) coleta, usa, armazena e protege suas informações quando você usa o aplicativo web e a extensão de navegador da AplicoCV (juntos, o “Serviço”). Ao criar uma conta ou instalar a extensão, você concorda com as práticas descritas aqui.',
    sections: [
      { title: 'Informações que coletamos', paras: ['Coletamos apenas as informações necessárias para preencher candidaturas em seu nome:'], bullets: [
        'Dados da conta. Seu nome e e-mail, e uma senha com hash seguro (ou um identificador de login do Google, se você usar o Google).',
        'Perfil profissional. As informações que você fornece ou que extraímos de um currículo enviado — como histórico profissional, formação, habilidades e contato — estruturadas em um perfil reutilizável.',
        'Credenciais de portais (opcional). Se você optar por salvar credenciais de um portal, a senha é criptografada antes de ser armazenada e só é descriptografada no nosso servidor, sob demanda, e apenas depois que você confirma explicitamente um preenchimento.',
        'Atividade de candidaturas. Registros das candidaturas que você acompanha, como cargo, empresa, portal e status.',
      ] },
      { title: 'Como a extensão usa seus dados', paras: ['A extensão preenche os formulários de candidatura por você. Quando você aciona o preenchimento em um portal compatível, ela lê os campos daquela página e os preenche com dados do seu perfil AplicoCV. A extensão:'], bullets: [
        'só age na página onde você clica em “Preencher” ou confirma um login;',
        'guarda seu token de login criptografado no seu próprio dispositivo (AES-256-GCM) e nunca o expõe às páginas que você visita;',
        'solicita acesso apenas aos domínios de portais que suporta, para preencher os formulários deles;',
        'não contém código remoto ou carregado dinamicamente — toda a lógica vai dentro do pacote.',
      ] },
      { title: 'Como usamos suas informações', paras: ['Usamos suas informações apenas para fornecer o Serviço. Não vendemos seus dados pessoais e não os usamos para publicidade. Especificamente, usamos para:'], bullets: [
        'estruturar seu currículo em um perfil profissional;',
        'preencher formulários de candidatura e login quando você pede à extensão;',
        'gerar documentos como currículos adaptados e cartas de apresentação quando você solicita;',
        'acompanhar as candidaturas que você envia;',
        'operar, proteger e melhorar o Serviço.',
      ] },
      { title: 'Como seus dados são protegidos', bullets: [
        'As senhas da sua conta AplicoCV são guardadas apenas como hashes com sal.',
        'As senhas de portais salvas são criptografadas em repouso com criptografia autenticada e só são descriptografadas de forma transitória no servidor quando você confirma um preenchimento.',
        'Seu token de login da extensão é criptografado no seu dispositivo.',
        'Toda a comunicação entre o Serviço e nossos servidores usa HTTPS.',
      ] },
      { title: 'Serviços de terceiros', paras: ['Para fornecer o Serviço, seus dados podem ser processados por provedores de infraestrutura e serviços que atuam em nosso nome, incluindo um provedor de hospedagem em nuvem, um provedor de armazenamento de objetos para os documentos enviados, um provedor de IA para estruturar perfis e gerar documentos, um processador de pagamentos para assinaturas e um provedor de e-mail para mensagens transacionais. Esses provedores processam os dados apenas para cumprir sua função e não podem usá-los para fins próprios.'] },
      { title: 'Retenção e exclusão de dados', paras: [`Mantemos suas informações enquanto sua conta estiver ativa. Você pode solicitar a exclusão da sua conta e dos dados associados a qualquer momento entrando em contato em ${C}. Você também pode remover você mesmo as credenciais de portais salvas no app a qualquer momento.`] },
      { title: 'Seus direitos', paras: [`Dependendo da sua localização, você pode ter o direito de acessar, corrigir, exportar ou excluir seus dados pessoais, e de retirar o consentimento. Para exercer qualquer um desses direitos, entre em contato em ${C}.`] },
      { title: 'Crianças', paras: ['O Serviço não é direcionado a menores de 16 anos e não coletamos intencionalmente dados pessoais deles.'] },
      { title: 'Alterações nesta política', paras: ['Podemos atualizar esta Política de Privacidade periodicamente. Quando o fizermos, revisaremos a data de “Última atualização” acima. Mudanças significativas serão comunicadas pelo Serviço.'] },
      { title: 'Fale conosco', paras: [`Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como seus dados são tratados, entre em contato em ${C}.`] },
    ],
  },
}

export default function PrivacyPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell eyebrow="Legal" title={c.title} subtitle={c.updated}>
      <p className="text-navy-600">{c.lead}</p>
      <LegalSections sections={c.sections} />
    </MarketingShell>
  )
}
