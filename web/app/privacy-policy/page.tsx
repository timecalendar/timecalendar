import { HomeLayout } from "modules/shared/components/layouts/HomeLayout"
import googlePlayImg from "modules/home/assets/google_play.png"
import appStoreImg from "modules/home/assets/app_store.png"
import Image from "next/image"

const PrivacyPolicyPage = () => {
  return (
    <HomeLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mt-4">
            <h2 className="text-3xl font-bold mb-6">
              Politique de confidentialité
            </h2>
          </div>

          <div className="mt-4 mb-4 flex space-x-2">
            <a
              href="https://apps.apple.com/us/app/timecalendar/id1479613630?l=fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                alt="Télécharger dans l'App Store"
                src={appStoreImg}
                height={50}
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=fr.samuelprak.timecalendar"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                alt="Disponible sur Google Play"
                src={googlePlayImg}
                height={50}
              />
            </a>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              L&apos;application a été réalisée par{" "}
              <a
                href="https://www.samuelprak.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Samuel Prak
              </a>
              . Ce service est fourni gratuitement par Samuel Prak et est
              destiné à être utilisé tel quel.
            </p>

            <p>
              Cette page est utilisée pour informer les visiteurs des politiques
              en matière de collecte, d&apos;utilisation et de divulgation de
              renseignements personnels si quelqu&apos;un décide d&apos;utiliser
              ce service.
            </p>

            <p>
              Si vous choisissez d&apos;utiliser TimeCalendar, vous acceptez la
              collecte et l&apos;utilisation d&apos;informations en relation
              avec cette politique. Les renseignements personnels que nous
              recueillons sont utilisés pour fournir et améliorer le service.
              Nous n&apos;utiliserons ni ne partagerons vos informations
              personnelles avec qui que ce soit, sauf tel que décrit dans la
              présente politique de confidentialité.
            </p>

            <div>
              <h2 className="text-xl font-semibold mb-3">
                Collecte et utilisation des informations
              </h2>
              <p>
                Pour une meilleure expérience, lors de l&apos;utilisation de
                TimeCalendar, nous pouvons vous demander de nous fournir
                certaines informations personnelles identifiables. Ces
                informations concernent votre nom et prénom, votre adresse
                e-mail, le nom de votre établissement, le nom de votre
                formation, ainsi que les groupes auxquels vous appartenez. Ces
                informations seront conservées sur votre appareil.
              </p>
            </div>

            <p>
              L&apos;application utilise des services tiers qui peuvent
              collecter des informations utilisées pour vous identifier.
            </p>

            <div>
              <p className="mb-2">
                Lien vers la politique de confidentialité des fournisseurs de
                services tiers utilisés par l&apos;application
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>
                  <a
                    href="https://www.google.com/policies/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Google Play Services
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Logs</h2>
              <p>
                Lorsqu&apos;une erreur se produit dans l&apos;application, des
                données et des informations sont collectées, appelées logs. Ces
                données peuvent inclure des informations telles que
                l&apos;adresse IP de votre appareil, le nom de l&apos;appareil,
                la version du système d&apos;exploitation, la configuration de
                l&apos;application lorsque vous utilisez le service,
                l&apos;heure et la date de votre utilisation du service et
                d&apos;autres statistiques. Ces données sont utilisées
                uniquement dans le but d&apos;améliorer l&apos;application.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Cookies</h2>
              <p className="mb-4">
                Les cookies sont des fichiers contenant une petite quantité de
                données qui sont couramment utilisés comme identifiants uniques
                anonymes. Celles-ci sont envoyées à votre navigateur à partir
                des sites Web suivants que vous visitez et qui sont stockées
                dans la mémoire interne de votre appareil.
              </p>
              <p>
                Le service n&apos;utilise pas explicitement ces
                &quot;cookies&quot;. Toutefois, l&apos;application peut utiliser
                des codes tiers et des bibliothèques qui utilisent des
                &quot;cookies&quot; pour collecter des informations et améliorer
                leurs services. Vous avez la possibilité d&apos;accepter ou de
                refuser ces cookies et de savoir quand un cookie est envoyé à
                votre appareil. Si vous choisissez de refuser nos cookies, il se
                peut que vous ne puissiez pas utiliser certaines parties de ce
                service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">
                Fournisseurs de services
              </h2>
              <p className="mb-2">
                Le service utilise des services tiers pour les raisons suivantes
                :
              </p>
              <ul className="list-disc list-inside ml-4 mb-4">
                <li>Faciliter l&apos;utilisation du service</li>
                <li>Fournir le service en notre nom</li>
                <li>Analyser l&apos;utilisation du service</li>
              </ul>
              <p>
                Nous tenons à informer les utilisateurs de ce service que ces
                tiers ont accès à vos renseignements personnels. La raison est
                d&apos;accomplir les tâches qui leur sont assignées en notre
                nom. Toutefois, ils sont tenus de ne pas divulguer ou utiliser
                ces renseignements à d&apos;autres fins.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Sécurité</h2>
              <p>
                Nous apprécions votre confiance en nous fournissant vos
                renseignements personnels, c&apos;est pourquoi nous nous
                efforçons d&apos;utiliser des moyens commercialement acceptables
                de les protéger. Mais n&apos;oubliez pas qu&apos;aucune méthode
                de transmission sur Internet, ni aucune méthode de stockage
                électronique n&apos;est sûre et fiable à 100 %, et nous ne
                pouvons en garantir la sécurité absolue.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Liens externes</h2>
              <p>
                Ce service peut contenir des liens vers d&apos;autres sites. Si
                vous cliquez sur un lien tiers, vous serez dirigé vers ce site.
                Notez que nous n&apos;exploitons pas ces cites. Par conséquent,
                nous vous conseillons de consulter la politique de
                confidentialité de ces sites Web. Nous n&apos;avons aucun
                contrôle sur le contenu, les politiques de confidentialité ou
                les pratiques des sites ou services de tiers et n&apos;assumons
                aucune responsabilité à cet égard.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">
                Politique concernant les enfants
              </h2>
              <p>
                Ces services ne s&apos;adressent pas aux personnes âgées de
                moins de 13 ans et nous ne recueillons pas volontairement de
                renseignements personnels identifiables auprès d&apos;enfants de
                moins de 13 ans. Si vous êtes un parent ou un tuteur et que vous
                savez que votre enfant nous a fourni des renseignements
                personnels, veuillez nous contacter afin de prendre les mesures
                nécessaires.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">
                Hébergement des données
              </h2>
              <p>
                Le site TimeCalendar est hébergé par : OVH, dont le siège est
                situé à l&apos;adresse ci-après :<br />
                2 rue Kellermann – 59100 Roubaix – France
                <br />
                Les données collectées et traitées par le site sont
                exclusivement hébergées et traitées en France.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">
                Modifications de cette politique de confidentialité
              </h2>
              <p>
                La présente politique de confidentialité peut être consultée à
                tout moment sur cette page. L&apos;éditeur du site se réserve le
                droit de la modifier afin de garantir sa conformité avec le
                droit en vigueur. Par conséquent, l&apos;utilisateur est invité
                à venir consulter régulièrement cette politique de
                confidentialité afin de se tenir informé des derniers
                changements qui lui seront apportés.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p>
                Si vous avez des questions ou des suggestions concernant ma
                politique de confidentialité, n&apos;hésitez pas à nous
                contacter à{" "}
                <a
                  href="mailto:hello@timecalendar.app"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  hello@timecalendar.app
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}

export default PrivacyPolicyPage
