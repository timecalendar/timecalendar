import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/selected_calendar.dart';
import 'package:timecalendar/modules/add_grade/providers/add_grade_provider.dart';
import 'package:timecalendar/modules/assistant/providers/assistant_provider.dart';
import 'package:timecalendar/modules/assistant/states/assistant_finished_result.dart';
import 'package:timecalendar/modules/assistant/providers/old_assistant_provider.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/home/screens/tabs_screen.dart';
import 'package:timecalendar/modules/firebase/services/notification/notification.dart';
import 'package:timecalendar/modules/shared/constants/constants.dart';
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

    void onCalendarCreated(String token) async {
      await oldprovider.setSelectedCalendar(SelectedCalendar.fromToken(token));

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

    final Map<String, dynamic> queryParameters = {
      'embed': 'true',
      ...provider.school != null ? {'schoolId': provider.school!.id} : {},
      ...provider.fallback ? {'fallback': 'true'} : {},
      ...settingsProvider.darkMode ? {'darkMode': 'true'} : {},
      ...gradeName.length > 0 ? {'gradeName': gradeName} : {},
    };

    var initialUrl = Uri.parse(Constants.mainWebUrl)
        .replace(queryParameters: queryParameters, path: '/assistants')
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
              javascriptChannels: {
                JavascriptChannel(
                  name: 'NativeApp',
                  onMessageReceived: (message) async {
                    final parsed = jsonDecode(message.message);
                    if (parsed['name'] == 'calendarCreated')
                      onCalendarCreated(parsed['payload']['token']);
                    else if (parsed['name'] == 'fallbackRequested')
                      Navigator.of(context)
                          .pop(AssistantFinishedResult.fallback());
                    else if (parsed['name'] == 'assistantEnded')
                      Navigator.of(context).pop(AssistantFinishedResult.done());
                  },
                ),
              },
            ),
          )
        ],
      ),
    );
  }
}
