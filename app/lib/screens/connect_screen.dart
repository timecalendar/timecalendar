import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/providers/assistant_provider.dart';
import 'package:timecalendar/screens/assistant_screen.dart';
import 'package:timecalendar/services/url_launcher.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';

class ConnectScreen extends StatelessWidget {
  static const routeName = '/connect';

  void loadAssistant(BuildContext context) {
    var assistantProvider =
        Provider.of<AssistantProvider>(context, listen: false);
    // Show assistant screen
    Navigator.pushNamed(context, AssistantScreen.routeName).then((result) {
      // Callback assistant screen
      assistantProvider.assistantCallback(context, result as Map<String, dynamic>?);
    });
  }

  @override
  Widget build(BuildContext context) {
    var assistantProvider =
        Provider.of<AssistantProvider>(context, listen: false);
    final mediaQuery = MediaQuery.of(context);
    final availableWidth = mediaQuery.size.width - 200;

    return Scaffold(
      body: Column(
        children: <Widget>[
          Expanded(
            child: CustomScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              slivers: <Widget>[
                SliverAppBar(
                  pinned: true,
                  flexibleSpace: FlexibleSpaceBar(
                    title: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: availableWidth,
                      ),
                      child: Text(
                        "Connectez-vous sur votre intranet",
                      ),
                    ),
                  ),
                  expandedHeight: 200.0,
                ),
                SliverList(
                  delegate: SliverChildListDelegate([
                    Padding(
                      padding: const EdgeInsets.all(15.0),
                      child: Column(
                        children: <Widget>[
                          Text(
                            "Sur votre ordinateur, ou dans le navigateur de votre appareil, connectez-vous sur le site de votre établissement afin d'accéder à votre emploi du temps.",
                          ),
                          SizedBox(height: 40),
                          if (assistantProvider.websiteUrl != null &&
                              assistantProvider.websiteUrl!.length > 0)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: <Widget>[
                                CustomButton(
                                  onPressed: () {
                                    UrlLauncher.launchUrl(
                                        assistantProvider.websiteUrl!);
                                  },
                                  icon: FontAwesomeIcons.externalLinkAlt,
                                  text: assistantProvider.schoolName ??
                                      'Se connecter',
                                )
                              ],
                            )
                        ],
                      ),
                    )
                  ]),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(15.0),
            child: Row(
              children: <Widget>[
                CustomButton(
                  text: 'Retour',
                  outline: true,
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                ),
                Expanded(
                  child: Container(),
                ),
                CustomButton(
                  text: 'Suivant',
                  onPressed: () {
                    loadAssistant(context);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
