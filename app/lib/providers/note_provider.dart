import 'package:flutter/widgets.dart';
import 'package:timecalendar/models/note.dart';

class NoteProvider with ChangeNotifier {
  List<Note> notes = [];

  void loadNotes() {
    this.notes = [
      Note(
        id: 1,
        title: 'Test note',
        text: 'Test',
        createdAt: DateTime.now()
      )
    ];
  }
}