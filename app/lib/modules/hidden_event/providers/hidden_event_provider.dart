import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/hidden_event/models/hidden_event.dart';
import 'package:timecalendar/modules/hidden_event/repositories/hidden_event_repository.dart';

class HiddenEventNotifier extends StateNotifier<HiddenEvent> {
  Ref ref;

  HiddenEventNotifier(this.ref) : super(new HiddenEvent());

  loadFromDatabase() async {
    state = await ref.read(hiddenEventRepositoryProvider).getHiddenEvents();
    print('Load from db');
    print(state);
  }

  saveToDatabase() async {
    return ref.read(hiddenEventRepositoryProvider).setHiddenEvents(state);
  }

  Future<void> addUidEvent(String uidEvent) async {
    state = state
        .rebuild((hiddenEvent) => hiddenEvent..uidHiddenEvents.add(uidEvent));
    await this.saveToDatabase();
  }

  Future<void> addNamedEvent(String namedEvent) async {
    state = state.rebuild(
        (hiddenEvent) => hiddenEvent..namedHiddenEvents.add(namedEvent));
    print(state);
    await this.saveToDatabase();
  }

  Future<void> removeUidEventByIndex(int index) async {
    state = state
        .rebuild((hiddenEvent) => hiddenEvent..uidHiddenEvents.removeAt(index));
    await this.saveToDatabase();
  }

  Future<void> removeNamedEventByIndex(int index) async {
    state = state.rebuild(
        (hiddenEvent) => hiddenEvent..namedHiddenEvents.removeAt(index));
    await this.saveToDatabase();
  }
}

final hiddenEventProvider =
    StateNotifierProvider<HiddenEventNotifier, HiddenEvent>(
        (ref) => HiddenEventNotifier(ref));
