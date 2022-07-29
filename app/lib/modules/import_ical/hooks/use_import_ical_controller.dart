import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:provider/provider.dart' as provider;
import 'package:timecalendar/database/differences_manager.dart';
import 'package:timecalendar/modules/add_school/providers/add_school_provider.dart';
import 'package:timecalendar/modules/assistant/providers/assistant_provider.dart';
import 'package:timecalendar/modules/import_ical/hooks/use_loading_dialog.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/old_assistant_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/providers/suggestion_provider.dart';
import 'package:timecalendar/screens/suggestion_screen.dart';
import 'package:timecalendar/screens/tabs_screen.dart';
import 'package:timecalendar/services/notification/notification.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

void showErrorDialog(BuildContext context, String err) async {
  final value = await showDialog(
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
  );

  if (value == 'reportProblem')
    Navigator.of(context).pushNamed(SuggestionScreen.routeName);
}

class ImportIcalState {
  ImportIcalState({
    required this.loadIcalUrl,
  });

  final void Function(String url) loadIcalUrl;
}

ImportIcalState useImportIcalController(BuildContext context, WidgetRef ref) {
  final loadingDialog = useLoadingDialog(context);

  void loadIcalUrl(String url) async {
    final oldAssistantProvider =
        provider.Provider.of<OldAssistantProvider>(context, listen: false);
    final suggestionProvider =
        provider.Provider.of<SuggestionProvider>(context, listen: false);
    final settingsProvider =
        provider.Provider.of<SettingsProvider>(context, listen: false);

    suggestionProvider.lastUrl = url;
    suggestionProvider.school =
        oldAssistantProvider.schoolCode ?? oldAssistantProvider.schoolName;
    suggestionProvider.grade = oldAssistantProvider.gradeName;
    suggestionProvider.isFailedSuggestion = true;

    loadingDialog.openDialog();

    final assistantState = ref.read(assistantProvider);
    final schoolId = assistantState.school?.id;
    final schoolName =
        assistantState.school == null ? ref.read(addSchoolNameProvider) : null;

    try {
      await ref.read(apiClientProvider).calendarsApi().createCalendar(
            createCalendarDto: CreateCalendarDto(
              (calendar) => calendar
                ..schoolId = schoolId
                ..schoolName = schoolName
                ..url = url,
            ),
          );

      await oldAssistantProvider.createAndSaveCustomCalendar(url);

      // Delete activity
      await DifferencesManager().deleteAll();
      settingsProvider.lastActivityUpdate = 0;

      // Refresh calendar
      await provider.Provider.of<EventsProvider>(context, listen: false)
          .fetchAndSetEvents();

      // First close the dialog
      loadingDialog.closeDialog();

      // Then redirect to the main page
      Future.delayed(Duration(milliseconds: 200)).then((_) {
        Navigator.of(context).pushNamedAndRemoveUntil(
            TabsScreen.routeName, (Route<dynamic> route) => false);

        // And ask notification permission
        return NotificationService().subscribeDelay();
      });
    } catch (e) {
      print(e);
      Future.delayed(Duration(milliseconds: 50)).then((_) {
        loadingDialog.closeDialog();
      });
      await Future.delayed(Duration(milliseconds: 200));
      showErrorDialog(
        context,
        "Aïe, nous n'avons pas réussi à importer votre emploi du temps. Vérifiez l'URL et réessayez. Si le problème persiste, contactez-nous.",
      );
    }
  }

  return ImportIcalState(
    loadIcalUrl: loadIcalUrl,
  );
}
