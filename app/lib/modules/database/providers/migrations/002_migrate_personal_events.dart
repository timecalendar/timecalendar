import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';

Future<void> migratePersonalEvents(Database db) async {
  final store = stringMapStoreFactory.store('personal_events');
  final records = await store.find(db);
  final personalEvents = records
      .where(
    (record) => record.value['uid'] != null,
  )
      .map((record) {
    final Map<String, dynamic> map = record.value;
    return PersonalEvent(
      (event) => event
        ..uid = map['uid']
        ..title = map['title']
        ..startsAt = DateTime.parse(map['start'])
        ..endsAt = DateTime.parse(map['end'])
        ..exportedAt = map['exportedAt'] == null
            ? DateTime.now()
            : DateTime.parse(map['exportedAt'])
        ..location = map['location']
        ..description = map['description']
        ..color = ColorUtils.hexToColor(map['color']),
    );
  });

  for (final event in personalEvents) {
    await store.record(event.uid).put(db, event.toMap());
  }
}
