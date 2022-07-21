import 'package:url_launcher/url_launcher.dart';

class UrlLauncher {
  static void openUrl(String stringUrl) async {
    final url = Uri.parse(stringUrl);

    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      throw new Exception('Could not launch the URL $url');
    }
  }
}
