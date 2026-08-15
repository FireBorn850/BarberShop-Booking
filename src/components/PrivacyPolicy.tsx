import React, { useState } from 'react';
import { Scissors, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarbershopSettings } from '../types';

interface PrivacyPolicyProps {
  settings: BarbershopSettings;
}

// ⚠️ UPDATE THIS if the business becomes a registered legal entity later —
// until then, the actual accountable person must be named here, not just
// the trading name, for the policy to be legally meaningful.
const DATA_CONTROLLER_NAME = 'Jasurbek Azizov';

// ⚠️ UPDATE THIS whenever you materially revise the policy text below.
const LAST_UPDATED = 'August 2026';

interface Section {
  heading: string;
  paragraphs: string[];
}

function getContent(settings: BarbershopSettings): Record<'en' | 'fr', { title: string; sections: Section[] }> {
  const name = settings.barbershop_name || 'Crown & Cut Grooming Co.';
  const address = settings.barbershop_address || '';
  const email = settings.barbershop_email || '';
  const phone = settings.barbershop_phone || '';

  return {
    en: {
      title: 'Privacy Policy',
      sections: [
        {
          heading: '1. Who We Are',
          paragraphs: [
            `This Privacy Policy explains how ${name} ("we," "us," "our") collects, uses, and protects your personal data when you visit our website or book an appointment with us.`,
            `Data Controller: ${DATA_CONTROLLER_NAME}, trading as ${name}.`,
            `Address: ${address}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
          ],
        },
        {
          heading: '2. What Personal Data We Collect',
          paragraphs: [
            'When you book an appointment, we ask you to provide: your full name, email address, phone number, your selected service, barber (if chosen), appointment date and time, and any optional notes or special requests you choose to add.',
            'We also automatically note the language your browser had our website set to (English, French, or German), so we can send you confirmations and reminders in that language, and your appointment status and history (e.g. confirmed, completed, cancelled) for our own scheduling records.',
            'We do not collect payment information through this website — payment is handled in person at the studio.',
          ],
        },
        {
          heading: '3. Why We Collect It',
          paragraphs: [
            'We process your data to create and manage your appointment booking (performance of a contract, Art. 31 FADP), to send you booking confirmations, appointment reminders, and cancellation confirmations, to contact you about your appointment if needed, and to maintain our own internal booking records for legitimate business operations.',
            'We do not use your data for advertising, profiling, or any purpose unrelated to providing our grooming services.',
          ],
        },
        {
          heading: '4. Who We Share It With',
          paragraphs: [
            'We use a small number of trusted service providers ("processors") to run our booking system. We do not sell, rent, or trade your personal data to anyone.',
            'Supabase (database, authentication, and backend hosting) — our booking data is hosted on AWS servers located in the EU (Ireland).',
            'Resend (transactional email delivery) — used solely to send you booking confirmation and reminder emails. Resend is based in the United States; where personal data is transferred outside Switzerland/the EU, we rely on service providers who commit to appropriate data protection safeguards.',
            'Google Calendar — the "Add to Calendar" button in our emails builds a link using your appointment details. Nothing is sent to Google by us; the link only creates an event in your own calendar if and when you choose to click it.',
            'If we begin using SMS or WhatsApp appointment reminders in the future (via Twilio or a similar provider), this policy will be updated accordingly before that feature is activated.',
          ],
        },
        {
          heading: '5. How Long We Keep Your Data',
          paragraphs: [
            'We retain your booking information for as long as necessary to provide our services, maintain accurate business records, and meet any applicable legal or accounting obligations. You may request that we delete your data earlier — see Section 7.',
          ],
        },
        {
          heading: '6. Your Rights',
          paragraphs: [
            'Under the Swiss Federal Act on Data Protection (FADP), and the EU General Data Protection Regulation (GDPR) where applicable, you have the right to: access the personal data we hold about you, request correction of inaccurate data, request deletion of your data, object to or restrict certain processing, request a copy of your data in a portable format, and lodge a complaint with the Swiss Federal Data Protection and Information Commissioner (FDPIC) or your local data protection authority.',
            'To exercise any of these rights, contact us using the details in Section 1.',
          ],
        },
        {
          heading: '7. Data Security',
          paragraphs: [
            'We take reasonable technical and organizational measures to protect your personal data, including access-controlled databases and encrypted connections between your browser and our website. No online system can guarantee absolute security, but we work to keep your information appropriately protected.',
          ],
        },
        {
          heading: '8. Cookies & Local Storage',
          paragraphs: [
            'Our website stores one small piece of information directly on your device: your light/dark theme preference. This is stored locally in your browser only, is never transmitted to us, and contains no personal data. We do not use tracking cookies, analytics scripts, or third-party advertising trackers.',
          ],
        },
        {
          heading: '9. Minors',
          paragraphs: [
            'Our services include grooming appointments for children, but appointments must be booked by a parent or legal guardian, who is responsible for the accuracy of the information provided.',
          ],
        },
        {
          heading: '10. Changes to This Policy',
          paragraphs: [
            'We may update this policy from time to time, for example if we add new features (such as SMS reminders) or change service providers. The "Last updated" date above will reflect the most recent revision.',
          ],
        },
        {
          heading: '11. Contact Us',
          paragraphs: [
            `If you have any questions about this policy or how we handle your data, please contact us at ${email} or ${phone}.`,
          ],
        },
      ],
    },
    fr: {
      title: 'Politique de Confidentialité',
      sections: [
        {
          heading: '1. Qui sommes-nous',
          paragraphs: [
            `La présente politique de confidentialité explique comment ${name} (« nous ») collecte, utilise et protège vos données personnelles lorsque vous visitez notre site web ou réservez un rendez-vous.`,
            `Responsable du traitement : ${DATA_CONTROLLER_NAME}, exploitant sous le nom ${name}.`,
            `Adresse : ${address}`,
            `E-mail : ${email}`,
            `Téléphone : ${phone}`,
          ],
        },
        {
          heading: '2. Quelles données personnelles nous collectons',
          paragraphs: [
            "Lors de la réservation d'un rendez-vous, nous vous demandons de fournir : votre nom complet, votre adresse e-mail, votre numéro de téléphone, le service choisi, le coiffeur (si sélectionné), ainsi que la date et l'heure du rendez-vous, et toute remarque ou demande particulière que vous souhaitez ajouter (facultatif).",
            "Nous enregistrons également automatiquement la langue dans laquelle votre navigateur affichait notre site (anglais, français ou allemand), afin de vous envoyer confirmations et rappels dans cette langue, ainsi que le statut et l'historique de votre rendez-vous (confirmé, terminé, annulé), à des fins de gestion interne.",
            "Nous ne collectons pas d'informations de paiement via ce site — le paiement s'effectue directement en salon.",
          ],
        },
        {
          heading: '3. Pourquoi nous les collectons',
          paragraphs: [
            "Nous traitons vos données afin de créer et gérer votre réservation (exécution d'un contrat, art. 31 LPD), de vous envoyer les confirmations de réservation, les rappels de rendez-vous et, en cas d'annulation, la confirmation correspondante, de vous contacter au sujet de votre rendez-vous si nécessaire, et de tenir nos registres internes de réservation pour les besoins légitimes de notre activité.",
            "Nous n'utilisons jamais vos données à des fins publicitaires, de profilage, ou pour tout autre usage sans rapport avec la prestation de nos services de coiffure.",
          ],
        },
        {
          heading: '4. Avec qui nous les partageons',
          paragraphs: [
            'Nous faisons appel à un nombre restreint de prestataires de confiance (« sous-traitants ») pour faire fonctionner notre système de réservation. Nous ne vendons, ne louons et n\'échangeons jamais vos données personnelles.',
            'Supabase (base de données, authentification et hébergement) — nos données de réservation sont hébergées sur des serveurs AWS situés dans l\'UE (Irlande).',
            'Resend (envoi d\'e-mails transactionnels) — utilisé uniquement pour vous envoyer les e-mails de confirmation et de rappel. Resend est basé aux États-Unis ; lorsque des données personnelles sont transférées hors de Suisse/UE, nous faisons appel à des prestataires s\'engageant à respecter des garanties appropriées de protection des données.',
            'Google Agenda — le bouton « Ajouter à l\'agenda » dans nos e-mails génère un lien à partir des détails de votre rendez-vous. Nous ne transmettons rien à Google ; le lien ne crée un événement dans votre propre agenda que si vous choisissez de cliquer dessus.',
            'Si nous commençons à utiliser des rappels par SMS ou WhatsApp (via Twilio ou un prestataire similaire), cette politique sera mise à jour en conséquence avant l\'activation de cette fonctionnalité.',
          ],
        },
        {
          heading: '5. Durée de conservation',
          paragraphs: [
            'Nous conservons vos informations de réservation aussi longtemps que nécessaire pour assurer nos services, tenir des registres commerciaux exacts, et respecter nos obligations légales ou comptables. Vous pouvez demander une suppression anticipée — voir section 7.',
          ],
        },
        {
          heading: '6. Vos droits',
          paragraphs: [
            'En vertu de la loi fédérale sur la protection des données (LPD) et, le cas échéant, du Règlement général sur la protection des données de l\'UE (RGPD), vous disposez des droits suivants : accéder aux données personnelles que nous détenons à votre sujet, demander la rectification de données inexactes, demander la suppression de vos données, vous opposer à certains traitements ou en demander la limitation, demander une copie de vos données dans un format portable, et déposer une plainte auprès du Préposé fédéral à la protection des données et à la transparence (PFPDT) ou de l\'autorité compétente de votre pays.',
            'Pour exercer l\'un de ces droits, contactez-nous aux coordonnées indiquées à la section 1.',
          ],
        },
        {
          heading: '7. Sécurité des données',
          paragraphs: [
            'Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données personnelles, notamment un accès restreint à la base de données et une connexion chiffrée entre votre navigateur et notre site. Aucun système en ligne ne peut garantir une sécurité absolue, mais nous nous efforçons de protéger vos informations de manière appropriée.',
          ],
        },
        {
          heading: '8. Cookies et stockage local',
          paragraphs: [
            'Notre site enregistre une seule information directement sur votre appareil : votre préférence d\'affichage clair/sombre. Celle-ci est stockée localement dans votre navigateur uniquement, ne nous est jamais transmise, et ne contient aucune donnée personnelle. Nous n\'utilisons ni cookies de suivi, ni scripts d\'analyse, ni traceurs publicitaires tiers.',
          ],
        },
        {
          heading: '9. Mineurs',
          paragraphs: [
            'Nos services incluent des coupes pour enfants, mais toute réservation doit être effectuée par un parent ou représentant légal, responsable de l\'exactitude des informations fournies.',
          ],
        },
        {
          heading: '10. Modifications de la présente politique',
          paragraphs: [
            'Nous pouvons mettre à jour cette politique de temps à autre, par exemple lors de l\'ajout de nouvelles fonctionnalités (rappels SMS) ou d\'un changement de prestataire. La date de « dernière mise à jour » ci-dessus reflétera la révision la plus récente.',
          ],
        },
        {
          heading: '11. Nous contacter',
          paragraphs: [
            `Pour toute question concernant cette politique ou la gestion de vos données, contactez-nous à ${email} ou au ${phone}.`,
          ],
        },
      ],
    },
  };
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ settings }) => {
  const { i18n } = useTranslation();
  const [docLang, setDocLang] = useState<'en' | 'fr'>(i18n.language === 'fr' ? 'fr' : 'en');

  const content = getContent(settings);
  const active = content[docLang];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-stone-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-200 dark:border-stone-800">
          <a
            href={window.location.origin}
            className="flex items-center gap-2 text-xs text-zinc-600 dark:text-stone-400 hover:text-zinc-900 dark:hover:text-stone-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Homepage
          </a>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-stone-900 border border-zinc-200 dark:border-stone-800 rounded-sm overflow-hidden">
            <button
              onClick={() => setDocLang('en')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                docLang === 'en'
                  ? 'bg-amber-600 text-black'
                  : 'text-zinc-600 dark:text-stone-400 hover:text-zinc-900 dark:hover:text-stone-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setDocLang('fr')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                docLang === 'fr'
                  ? 'bg-amber-600 text-black'
                  : 'text-zinc-600 dark:text-stone-400 hover:text-zinc-900 dark:hover:text-stone-200'
              }`}
            >
              FR
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-sm bg-amber-600 flex items-center justify-center shadow-sm shrink-0">
            <Scissors className="w-5 h-5 text-black transform -rotate-45" />
          </div>
          <h1 className="text-3xl font-serif font-light text-zinc-900 dark:text-stone-100">
            {active.title}
          </h1>
        </div>
        <p className="text-xs text-zinc-500 dark:text-stone-500 mb-12 ml-12">
          {docLang === 'fr' ? 'Dernière mise à jour : ' : 'Last updated: '}{LAST_UPDATED}
        </p>

        {/* Sections */}
        <div className="space-y-10">
          {active.sections.map((section) => (
            <div key={section.heading} className="space-y-3">
              <h2 className="text-base font-bold font-serif text-amber-600 dark:text-amber-500">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-zinc-700 dark:text-stone-300 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};