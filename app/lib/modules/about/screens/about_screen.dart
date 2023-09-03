import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:provider/provider.dart' as provider;
import 'package:timecalendar/modules/changelog/screens/changelog_screen.dart';
import 'package:timecalendar/modules/debug/screens/debug_screen.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/utils/url_launcher.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';

class AboutScreen extends ConsumerWidget {
  static const routeName = '/about';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var settingsProvider = provider.Provider.of<SettingsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('À propos'),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(15.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                "Politique de confidentialité",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 10),
              CustomButton(
                text: 'Voir la politique de confidentialité',
                outline: true,
                onPressed: () => UrlLauncher.openUrl(
                  'https://timecalendar.app/privacy-policy/privacy-policy',
                ),
              ),
              SizedBox(height: 15),
              Text(
                "A propos de TimeCalendar",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 10),
              Text(
                  "Avec TimeCalendar, accédez facilement à votre emploi du temps universitaire. L'application récupère votre emploi du temps directement auprès du calendrier de votre établissement. Recevez une notification en cas d'ajout, de modification ou de suppression de cours."),
              SizedBox(height: 10),
              Text(
                  "Cette application a été créée dans le but de faciliter l\'accès et la lecture des emplois du temps universitaires, en proposant une interface intuitive."),
              SizedBox(height: 15),
              Text(
                "Nous contacter",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 10),
              Text(
                  "Si vous constatez des problèmes, que vous avez une question ou une suggestion, n'hésitez pas à utiliser le formulaire \"Vos retours et suggestions\", ou à nous contacter par e-mail à hello@timecalendar.app."),
              SizedBox(height: 15),
              Text(
                "Version de l'application",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 10),
              Row(
                children: <Widget>[
                  Expanded(
                    child: GestureDetector(
                        onTap: () {
                          Navigator.of(context)
                              .pushNamed(DebugScreen.routeName);
                        },
                        child: Text("Version " + settingsProvider.version)),
                  ),
                  CustomButton(
                    text: "Changelog",
                    outline: true,
                    onPressed: () {
                      Navigator.of(context).pushNamed(ChangelogScreen.routeName,
                          arguments: {'displayAllChangelog': true});
                    },
                  ),
                ],
              ),
              SizedBox(height: 15),
              Text(
                "Développeurs",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 10),
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: 'Samuel Prak : ',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    TextSpan(
                      text: 'https://www.samuelprak.fr/',
                      style:
                          TextStyle(color: Colors.blue, fontFamily: 'Poppins'),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () {
                          UrlLauncher.openUrl('https://www.samuelprak.fr/');
                        },
                    ),
                  ],
                ),
              ),
              SizedBox(height: 5),
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                        text: 'Eddy Monnot : ',
                        style: Theme.of(context).textTheme.bodyMedium),
                    TextSpan(
                      text: 'https://www.eddymonnot.com/',
                      style:
                          TextStyle(color: Colors.blue, fontFamily: 'Poppins'),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () {
                          UrlLauncher.openUrl('https://www.eddymonnot.com/');
                        },
                    ),
                  ],
                ),
              ),
              // CustomButton(
              //   text: "debug",
              //   onPressed: () {
              //     settingsProvider.currentVersion = 0;
              //   },
              // )
              // Text(
              //   "Bêta privée",
              //   style: TextStyle(
              //     fontSize: 18,
              //     fontWeight: FontWeight.w500,
              //   ),
              // ),
              // SizedBox(height: 10),
              // Text(
              //     "Vous utilisez actuellement une version bêta de l'application. Certaines fonctionnalités peuvent manquer, ou des bugs peuvent être présents dans cette version."),
              // SizedBox(height: 10),
              // Text(
              //     "Dans le cadre de la bêta privée, si vous constatez des problèmes ou que vous avez des suggestions, n'hésitez pas à utiliser le formulaire \"Vos retours et suggestions\", ou à nous contacter par e-mail à hello@timecalendar.app."),
            ],
          ),
        ),
      ),
    );
  }
}
