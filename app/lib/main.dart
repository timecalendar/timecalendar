import 'package:timecalendar/firebase_options.dart';
import 'package:timecalendar/init.dart';

void main() {
  return init(
    environment: "development",
    firebaseOptions: DefaultFirebaseOptions.currentPlatform,
  );
}