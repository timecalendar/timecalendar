import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/assistant/models/assistant_step.dart';
import 'package:timecalendar/modules/assistant/providers/assistant_provider.dart';
import 'package:timecalendar/services/url_launcher.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';

class ConnectScreen extends HookConsumerWidget {
  static const routeName = '/connect';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(assistantProvider);

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
                          if ((provider.school?.intranetUrl?.length ?? 0) > 0)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: <Widget>[
                                CustomButton(
                                  onPressed: () {
                                    UrlLauncher.launchUrl(
                                      provider.school!.intranetUrl!,
                                    );
                                  },
                                  icon: FontAwesomeIcons.externalLinkAlt,
                                  text: provider.school?.name ?? 'Se connecter',
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
                  onPressed: () =>
                      ref.read(assistantProvider.notifier).navigateToNextStep(
                            context,
                            AssistantStepEnum.CONNECT_TO_INTRANET,
                          ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
