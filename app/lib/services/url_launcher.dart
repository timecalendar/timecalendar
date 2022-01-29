import 'package:url_launcher/url_launcher.dart';

class UrlLauncher {
  static void launchUrl(String url) async {
    if (await canLaunch(url)) {
      await launch(url);
    } else {
      throw new Exception('Could not launch the URL $url');
    }
  }
}