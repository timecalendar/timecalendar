import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';
import 'package:timecalendar/modules/personal_event/repositories/personal_event_repository.dart';

class PersonalEventsNotifier extends AsyncNotifier<List<PersonalEvent>> {
  @override
  Future<List<PersonalEvent>> build() async {
    final repo = ref.read(personalEventRepositoryProvider);
    return repo.findAll();
  }

  Future<void> addPersonalEvent(PersonalEvent event) async {
    final repo = ref.read(personalEventRepositoryProvider);
    await repo.put(event);

    // Refresh state
    state = await AsyncValue.guard(() async {
      return repo.findAll();
    });
  }

  Future<void> deletePersonalEvent(String uid) async {
    final repo = ref.read(personalEventRepositoryProvider);
    await repo.delete(uid);

    // Refresh state
    state = await AsyncValue.guard(() async {
      return repo.findAll();
    });
  }

  Future<void> refresh() async {
    final repo = ref.read(personalEventRepositoryProvider);
    state = await AsyncValue.guard(() async {
      return repo.findAll();
    });
  }
}

final personalEventsProvider =
    AsyncNotifierProvider<PersonalEventsNotifier, List<PersonalEvent>>(
      PersonalEventsNotifier.new,
    );
