import 'package:timecalendar/firebase_options.dart';
import 'package:timecalendar/init.dart';

Future<void> main() {
  return init(
    environment: "preprod",
    firebaseOptions: DefaultFirebaseOptions.currentPlatform,
  );
}
