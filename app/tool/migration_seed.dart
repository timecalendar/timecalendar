import 'dart:convert';
import 'dart:io';

import 'package:built_collection/built_collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sembast/sembast.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/modules/event_details/models/checklist_item.dart';
import 'package:timecalendar/modules/hidden_event/models/hidden_event.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  const pack = String.fromEnvironment('MIGRATION_SEED');
  var status = 'Fixture refused';
  if (kDebugMode && (pack == 'SEED-A' || pack == 'SEED-B')) {
    try {
      status = await seed(pack);
    } catch (_) {
      status = 'Fixture refused: existing state or seed failure';
    }
  }
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Center(child: Text(status, textAlign: TextAlign.center)),
      ),
    ),
  );
}

Future<String> seed(String pack) async {
  final documents = await getApplicationDocumentsDirectory();
  final marker = File('${documents.path}/migration-fixture.json');
  if (await marker.exists()) {
    return 'Synthetic Flutter fixture already seeded\n$pack';
  }
  final source = File('${documents.path}/simple_database.db');
  final prefs = await SharedPreferences.getInstance();
  if (await source.exists() || prefs.getKeys().isNotEmpty) {
    throw StateError('EXISTING_STATE');
  }
  final large = pack == 'SEED-B';
  final calendars = large ? 3 : 1;
  final events = large ? 60 : 5;
  final checklist = large ? 134 : 5;
  final hiddenUids = large ? 21 : 1;
  final hiddenNames = large ? 6 : 1;
  final date = DateTime(2026, 10, 4, 9);
  final database = SimpleDatabase();
  await database.init();
  final db = database.db;
  for (var index = 0; index < calendars; index++) {
    final calendar = UserCalendar(
      id: 'migration-fixture-calendar-$index',
      name: 'Synthetic calendar $index',
      token: 'synthetic-offline-token-$index-not-a-service-credential',
      schoolName: index == 0 ? null : 'Synthetic school',
      schoolId: index == 0 ? null : 'synthetic-school',
      lastUpdatedAt: date,
      createdAt: date.subtract(const Duration(days: 30)),
      visible: index != 2,
    );
    await stringMapStoreFactory
        .store('user_calendars')
        .record(calendar.id)
        .put(db, calendar.toDbMap());
  }
  for (var index = 0; index < events; index++) {
    final event = PersonalEvent(
      (builder) => builder
        ..uid = 'migration-fixture-event-$index'
        ..title = 'Synthetic event $index é 🌍'
        ..color = const Color(0xffab23cd)
        ..startsAt = date.add(Duration(days: index))
        ..endsAt = date.add(Duration(days: index, hours: 1))
        ..location = index.isEven ? null : 'Synthetic room'
        ..description = index.isEven
            ? null
            : 'Synthetic description\nUnicode é 🌍'
        ..exportedAt = date,
    );
    await stringMapStoreFactory
        .store('personal_events')
        .record(event.uid)
        .put(db, event.toMap());
  }
  for (var index = 0; index < checklist; index++) {
    final item = ChecklistItem(
      uuid: 'migration-fixture-checklist-$index',
      eventUid: index.isEven
          ? 'migration-fixture-event-${index % events}'
          : 'synthetic-cached-event',
      content: 'Synthetic checklist $index',
      isChecked: index.isEven,
      order: index,
      createdAt: index.isEven ? null : date,
      updatedAt: index.isEven ? null : date.add(const Duration(minutes: 1)),
      deletedAt: index == 4 ? date.add(const Duration(minutes: 2)) : null,
    );
    await stringMapStoreFactory
        .store('checklist_items')
        .record(item.uuid!)
        .put(db, item.toMap());
  }
  final hidden = HiddenEvent(
    (builder) => builder
      ..uidHiddenEvents = ListBuilder(
        List.generate(hiddenUids, (index) => 'synthetic-hidden-uid-$index'),
      )
      ..namedHiddenEvents = ListBuilder(
        List.generate(hiddenNames, (index) => 'Synthetic hidden name $index'),
      ),
  );
  await intMapStoreFactory.store('hidden_events').add(db, hidden.toMap());
  await db.close();
  await prefs.setInt('current_version', 1);
  await prefs.setString('theme', 'dark');
  await prefs.setBool('dark_mode', false);
  await prefs.setBool('notification_calendar', false);
  await prefs.setString('startup_screen', 'calendar');
  await prefs.setBool('show_weekends', false);
  await prefs.setBool('colors_by_group', true);
  await prefs.setString('calendar_view_type', 'Planning');
  await prefs.setDouble('calendar_hour_height', 88.5);
  await prefs.setInt('date_limit', 21);
  await prefs.setBool('new_activity', true);
  await prefs.setInt('last_activity_update', 123456);
  final counts = {
    'fixture': pack,
    'source': 'Flutter models + Sembast + shared_preferences',
    'databaseVersion': 3,
    'calendars': calendars,
    'personalEvents': events,
    'checklistItems': checklist,
    'hiddenUids': hiddenUids,
    'hiddenNames': hiddenNames,
    'allowlistedPreferences': 6,
    'droppedPreferences': 6,
  };
  await marker.writeAsString(jsonEncode(counts), flush: true);
  return 'Synthetic Flutter fixture seeded\n$pack\n$calendars calendars\n$events personal events\n$checklist checklist items\n6 typed preferences';
}
