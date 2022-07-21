import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/models/selected_calendar.dart';
import 'package:timecalendar/modules/add_grade/providers/add_grade_provider.dart';
import 'package:timecalendar/modules/assistant/providers/assistant_provider.dart';
import 'package:timecalendar/modules/assistant/states/assistant_finished_result.dart';
import 'package:timecalendar/providers/old_assistant_provider.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/screens/tabs_screen.dart';
import 'package:timecalendar/services/notification/notification.dart';
import 'package:timecalendar/utils/constants.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:provider/provider.dart' as oldProvider;

class AssistantScreen extends HookConsumerWidget {
  static const routeName = '/assistant';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(assistantProvider);

    final oldprovider =
        oldProvider.Provider.of<OldAssistantProvider>(context, listen: false);
    final settingsProvider =
        oldProvider.Provider.of<SettingsProvider>(context, listen: false);
    final gradeName = ref.watch(addGradeNameProvider);

    void _onPageChanged(String url) async {
      // Handle assistant return
      if (!url.contains('/embed/loading')) {
        return;
      }

      // Check if the assistant has returned a token
      RegExp regExp = RegExp(r"\/embed\/loading\/\?token=([a-zA-Z0-9-_~]+)");
      var allMatches = regExp.allMatches(url).toList();
      String token = "";
      if (allMatches.length > 0) {
        // The assistant has already generated a token
        // Use it
        token = allMatches[0].group(1)!;
        await oldprovider
            .setSelectedCalendar(SelectedCalendar.fromToken(token));

        // Refresh calendar
        await oldProvider.Provider.of<EventsProvider>(context, listen: false)
            .fetchAndSetEvents();

        // Then redirect to the main page
        await Future.delayed(Duration(milliseconds: 200));

        Navigator.of(context).pushNamedAndRemoveUntil(
            TabsScreen.routeName, (Route<dynamic> route) => false);

        // And ask notification permission
        await NotificationService().subscribeDelay();

        return null;
      }

      // Check if the assistant called the fallback assistant
      regExp = RegExp(r"\/embed\/loading\/\?fallback=true");
      allMatches = regExp.allMatches(url).toList();
      if (allMatches.length > 0) {
        Navigator.of(context).pop(AssistantFinishedResult.fallback());
      } else {
        Navigator.of(context).pop(AssistantFinishedResult.done(token: token));
      }
    }

    final Map<String, dynamic> queryParameters = {
      'embed': 'true',
      ...provider.school != null ? {'schoolCode': provider.school!.code} : {},
      ...provider.fallback ? {'fallback': 'true'} : {},
      ...settingsProvider.darkMode ? {'darkMode': 'true'} : {},
      ...gradeName.length > 0 ? {'gradeName': gradeName} : {},
    };

    var initialUrl = Uri.parse(Constants.mainWebUrl)
        .replace(queryParameters: queryParameters, path: '/creation/connect')
        .toString();

    print(initialUrl);

    return Scaffold(
      appBar: AppBar(
        title: Text('Importer votre calendrier'),
      ),
      body: Column(
        children: [
          Expanded(
            child: WebView(
              initialUrl: initialUrl,
              javascriptMode: JavascriptMode.unrestricted,
              onPageStarted: _onPageChanged,
            ),
          )
        ],
      ),
    );
  }
}
