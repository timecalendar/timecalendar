import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';
import 'package:timecalendar/modules/personal_event/repositories/personal_event_repository.dart';

class PersonalEventsNotifier extends StateNotifier<List<PersonalEvent>> {
  Reader read;

  PersonalEventsNotifier(this.read) : super([]);

  update() async {
    state = await read(personalEventRepositoryProvider).findAll();
  }
}

final personalEventsProvider =
    StateNotifierProvider<PersonalEventsNotifier, List<PersonalEvent>>(
        (ref) => PersonalEventsNotifier(ref.read));
