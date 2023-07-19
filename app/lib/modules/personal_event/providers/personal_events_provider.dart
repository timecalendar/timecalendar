import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';
import 'package:timecalendar/modules/personal_event/repositories/personal_event_repository.dart';

class PersonalEventsNotifier extends StateNotifier<List<PersonalEvent>> {
  Ref ref;

  PersonalEventsNotifier(this.ref) : super([]);

  update() async {
    state = await ref.read(personalEventRepositoryProvider).findAll();
  }
}

final personalEventsProvider =
    StateNotifierProvider<PersonalEventsNotifier, List<PersonalEvent>>(
        (ref) => PersonalEventsNotifier(ref));
