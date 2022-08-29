import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/hidden_event/providers/hidden_event_provider.dart';
import 'package:timecalendar/modules/hidden_event/widgets/hidden_event_item.dart';

class HiddenEventsScreen extends ConsumerWidget {
  static const routeName = '/hidden_events';

  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(eventsProvider);
    final hiddenEvents = ref.watch(hiddenEventProvider);
    final namedHiddenEvents = hiddenEvents.namedHiddenEvents;
    final uidHiddenEvents = hiddenEvents.uidHiddenEvents;

    Widget _itemBuilder(BuildContext context, int index) {
      return (index < namedHiddenEvents.length)
          ? HiddenEventItem(
              namedEvent: namedHiddenEvents[index],
              index: index,
              removeItem: () => ref
                  .read(hiddenEventProvider.notifier)
                  .removeNamedEventByIndex(index),
            )
          : HiddenEventItem(
              event: events.firstWhere((event) =>
                  event.uid ==
                  uidHiddenEvents[index - namedHiddenEvents.length]),
              index: index,
              removeItem: () => ref
                  .read(hiddenEventProvider.notifier)
                  .removeUidEventByIndex(index - namedHiddenEvents.length),
            );
    }

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: Text('Événements masqués'),
      ),
      body: (namedHiddenEvents.length + uidHiddenEvents.length > 0)
          ? ListView.builder(
              itemBuilder: _itemBuilder,
              itemCount: namedHiddenEvents.length + uidHiddenEvents.length,
            )
          : Center(
              child: Text('Aucun événement masqué'),
            ),
    );
  }
}
