import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/add_grade/providers/add_grade_provider.dart';
import 'package:timecalendar/modules/add_school/providers/add_school_provider.dart';
import 'package:timecalendar/modules/assistant/providers/assistant_provider.dart';
import 'package:timecalendar/modules/calendar/services/calendar_creation_service.dart';
import 'package:timecalendar/modules/firebase/services/notification/notification.dart';
import 'package:timecalendar/modules/home/screens/tabs_screen.dart';
import 'package:timecalendar/modules/import_ical/hooks/use_loading_dialog.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar/modules/suggestion/screens/suggestion_screen.dart';
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
    loadingDialog.openDialog();

    final assistantState = ref.read(assistantProvider);
    final schoolId = assistantState.school?.id;
    final schoolName =
        assistantState.school == null ? ref.read(addSchoolNameProvider) : null;
    final gradeName = ref.read(addGradeNameProvider);

    try {
      final rep =
          await ref.read(apiClientProvider).calendarsApi().createCalendar(
                createCalendarDto: CreateCalendarDto(
                  (calendar) => calendar
                    ..schoolId = schoolId
                    ..schoolName = schoolName
                    ..name = gradeName
                    ..url = url,
                ),
              );
      final token = rep.data!.token;

      await ref
          .read(calendarCreationServiceProvider)
          .loadCalendarFromToken(token);
      await Future.delayed(Duration(milliseconds: 200));
      Navigator.of(context).pushNamedAndRemoveUntil(
          TabsScreen.routeName, (Route<dynamic> route) => false);

      loadingDialog.closeDialog();
      Future.delayed(Duration(milliseconds: 200)).then((_) {
        Navigator.of(context).pushNamedAndRemoveUntil(
            TabsScreen.routeName, (Route<dynamic> route) => false);
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
