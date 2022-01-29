import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/database/differences_manager.dart';
import 'package:timecalendar/providers/assistant_provider.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/providers/suggestion_provider.dart';
import 'package:timecalendar/screens/suggestion_screen.dart';
import 'package:timecalendar/screens/tabs_screen.dart';
import 'package:timecalendar/services/notification/notification.dart';
import 'package:timecalendar/widgets/import_ical/ask_for_ical_url.dart';
import 'package:timecalendar/widgets/import_ical/scan_qr_code.dart';

class ImportIcalScreenArguments {
  final bool isInternal;

  ImportIcalScreenArguments(this.isInternal);
}

class ImportIcalScreen extends StatefulWidget {
  static const routeName = '/import-ical';

  @override
  _ImportIcalScreenState createState() => _ImportIcalScreenState();
}

class _ImportIcalScreenState extends State<ImportIcalScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();
  BuildContext dialogContext;

  @override
  void initState() {
    super.initState();
  }

  void loadIcalUrl(String url) async {
    // final ImportIcalScreenArguments args =
    //     ModalRoute.of(context).settings.arguments;
    // final isInternal = args.isInternal;

    final assistantProvider =
        Provider.of<AssistantProvider>(context, listen: false);
    final suggestionProvider =
        Provider.of<SuggestionProvider>(context, listen: false);
    final settingsProvider =
        Provider.of<SettingsProvider>(context, listen: false);

    // if (!assistantProvider.isIcalUrlValidForImportation(url, isInternal)) {
    //   // We have requested an internal QR code
    //   showDialog(
    //     context: context,
    //     builder: (context) {
    //       return AlertDialog(
    //         title: Text("Calendrier invalide"),
    //         content:
    //             Text("Le calendrier fourni n'est pas un lien TimeCalendar."),
    //         actions: <Widget>[
    //           FlatButton(
    //             child: new Text('Fermer'),
    //             onPressed: () {
    //               Navigator.of(context).pop();
    //             },
    //           ),
    //         ],
    //       );
    //     },
    //   );
    //   return;
    // }

    suggestionProvider.lastUrl = url;
    suggestionProvider.school =
        assistantProvider.schoolCode ?? assistantProvider.schoolName;
    suggestionProvider.grade = assistantProvider.gradeName;
    suggestionProvider.isFailedSuggestion = true;

    showLoadingDialog();

    try {
      await assistantProvider.createAndSaveCustomCalendar(url);

      // Delete activity
      await DifferencesManager().deleteAll();
      settingsProvider.lastActivityUpdate = 0;

      // Refresh calendar
      await Provider.of<EventsProvider>(context, listen: false)
          .fetchAndSetEvents();

      // First close the dialog
      closeLoadingDialog();

      // Then redirect to the main page
      Future.delayed(Duration(milliseconds: 200)).then((_) {
        Navigator.of(context).pushNamedAndRemoveUntil(
            TabsScreen.routeName, (Route<dynamic> route) => false);

        // And ask notification permission
        return NotificationService().subscribeDelay();
      });
    } on Exception {
      Future.delayed(Duration(milliseconds: 50)).then((_) {
        closeLoadingDialog();
      });
      await Future.delayed(Duration(milliseconds: 200));
      showErrorDialog(
          "Aïe, nous n'avons pas réussi à importer votre emploi du temps. Vérifiez l'URL et réessayez. Si le problème persiste, contactez-nous.");
    }
  }

  void showErrorDialog(String err) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Erreur d'importation"),
          content: Text(err),
          actions: <Widget>[
            TextButton(
              child: new Text('Signaler un problème'),
              onPressed: () {
                Navigator.of(context).pop('reportProblem');
              },
            ),
            TextButton(
              child: new Text('Fermer'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    ).then((value) {
      if (value == 'reportProblem') {
        Navigator.of(context).pushNamed(SuggestionScreen.routeName);
      }
    });
  }

  void showLoadingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        dialogContext = context;
        return WillPopScope(
          onWillPop: () async => false,
          child: Dialog(
            child: Padding(
              padding: const EdgeInsets.all(30.0),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  Padding(
                    padding: const EdgeInsets.only(left: 15.0),
                    child: Text("Importation en cours..."),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void closeLoadingDialog() {
    if (dialogContext != null) {
      Navigator.of(dialogContext).pop();
      dialogContext = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final ImportIcalScreenArguments args =
        ModalRoute.of(context).settings.arguments;
    final isInternal = args.isInternal;

    final mediaQuery = MediaQuery.of(context);
    final availableWidth = mediaQuery.size.width - 200;

    return Scaffold(
      key: _scaffoldKey,
      body: Column(
        children: <Widget>[
          Expanded(
            child: CustomScrollView(
              slivers: <Widget>[
                SliverAppBar(
                  pinned: true,
                  flexibleSpace: FlexibleSpaceBar(
                    title: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: availableWidth,
                      ),
                      child: Text(
                        isInternal
                            ? "Importer depuis le web"
                            : "Importer votre calendrier",
                        style: TextStyle(fontSize: 18),
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
                              (isInternal
                                      ? 'Pour importer votre calendrier, scannez le QR Code qui s\'affiche sur le site internet de TimeCalendar.'
                                      : 'Pour importer votre calendrier, scannez le QR Code qui s\'affiche sur la page de votre université.') +
                                  '\n\nVous pouvez aussi coller le lien ICal du calendrier en appuyant sur le bouton ci-dessous.',
                              style: TextStyle(fontSize: 16)),
                        ],
                      ),
                    ),
                  ]),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(15.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                ScanQrCode(onScan: loadIcalUrl),
                SizedBox(height: 10),
                AskForIcalUrl(onSubmit: loadIcalUrl),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
