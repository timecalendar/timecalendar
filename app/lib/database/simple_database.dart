import 'dart:io';

import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sembast/sembast.dart';
import 'package:sembast/sembast_io.dart';

class SimpleDatabase {
  Database db;

  static final SimpleDatabase _instance = SimpleDatabase._();
  SimpleDatabase._();
  factory SimpleDatabase() {
    return _instance;
  }

  Future<void> init() async {
    Directory directory = await getApplicationDocumentsDirectory();
    String dbPath = join(directory.path, 'simple_database.db');
    DatabaseFactory dbFactory = databaseFactoryIo;
    this.db = await dbFactory.openDatabase(dbPath);
  }
}
