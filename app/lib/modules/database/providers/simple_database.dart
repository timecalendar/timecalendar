import 'dart:io';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sembast/sembast.dart';
import 'package:sembast/sembast_io.dart';
import 'package:timecalendar/modules/database/providers/migrations.dart';

class SimpleDatabase {
  late Database db;

  static final SimpleDatabase _instance = SimpleDatabase._();
  SimpleDatabase._();
  factory SimpleDatabase() {
    return _instance;
  }

  Future<void> init() async {
    Directory directory = await getApplicationDocumentsDirectory();
    String dbPath = join(directory.path, 'simple_database.db');
    DatabaseFactory dbFactory = databaseFactoryIo;
    this.db = await dbFactory.openDatabase(
      dbPath,
      version: CURRENT_VERSION,
      onVersionChanged: (db, oldVersion, newVersion) async {
        for (int currentVersion = oldVersion + 1;
            currentVersion <= newVersion;
            ++currentVersion) {
          final migrationsToRun = migrationsByVersion[currentVersion] ?? [];
          for (final migration in migrationsToRun) {
            await migration(db);
          }
        }
      },
    );
  }
}

final databaseProvider = Provider((ref) => SimpleDatabase().db);
