import 'package:flutter/material.dart';
// import 'package:flutter_webview_plugin/flutter_webview_plugin.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/selected_calendar.dart';
import 'package:timecalendar/providers/assistant_provider.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/screens/tabs_screen.dart';
import 'package:timecalendar/services/notification/notification.dart';
import 'package:timecalendar/utils/constants.dart';
import 'package:webview_flutter/webview_flutter.dart';

class AssistantScreen extends StatefulWidget {
  static const routeName = '/assistant';

  @override
  _AssistantScreenState createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  // final flutterWebviewPlugin = new FlutterWebviewPlugin();

  void onPageChanged(String url) async {
    final assistantProvider =
        Provider.of<AssistantProvider>(context, listen: false);

    // Handle assistant return
    if (!url.contains('/embed/loading')) {
      return;
    }

    // Check if the assistant has returned a token
    RegExp regExp = RegExp(r"\/embed\/loading\/\?token=([a-zA-Z0-9-_~]+)");
    var allMatches = regExp.allMatches(url).toList();
    String? token;
    if (allMatches.length > 0) {
      // The assistant has already generated a token
      // Use it
      token = allMatches[0].group(1);
      await assistantProvider
          .setSelectedCalendar(SelectedCalendar.fromToken(token));

      // Refresh calendar
      await Provider.of<EventsProvider>(context, listen: false)
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
      // Redirect to fallback assistant
      Navigator.of(context).pop({'fallback': true});

      return null;
    }

    Navigator.of(context).pop({'assistantDone': true, 'token': token});
  }

  @override
  Widget build(BuildContext context) {
    final assistantProvider =
        Provider.of<AssistantProvider>(context, listen: false);
    final settingsProvider =
        Provider.of<SettingsProvider>(context, listen: false);

    var initialUrl = Constants.mainWebUrl +
        'creation/connect?embed=true' +
        ((assistantProvider.schoolCode != null)
            ? ('&schoolCode=' + assistantProvider.schoolCode!)
            : '') +
        ((assistantProvider.gradeName != null)
            ? ('&gradeName=' + Uri.encodeComponent(assistantProvider.gradeName!))
            : '') +
        ((settingsProvider.darkMode) ? '&darkMode=true' : '') +
        ((assistantProvider.useFallback) ? '&fallback=true' : '');

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
              onPageStarted: this.onPageChanged,
            ),
          )
        ],
      ),
    );
  }
}
