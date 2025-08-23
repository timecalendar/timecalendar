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
    final eventsAsync = ref.watch(eventsProvider);
    final hiddenEvents = ref.watch(hiddenEventProvider);
    final namedHiddenEvents = hiddenEvents.namedHiddenEvents.toList();
    final uidHiddenEvents = hiddenEvents.uidHiddenEvents.toList();

    return eventsAsync.when(
      data: (events) {
        Widget _itemBuilder(BuildContext context, int index) {
          return (index < namedHiddenEvents.length)
              ? HiddenEventItem(
                namedEvent: namedHiddenEvents[index],
                index: index,
                removeItem:
                    () => ref
                        .read(hiddenEventProvider.notifier)
                        .removeNamedEventByIndex(index),
              )
              : HiddenEventItem(
                event: events.firstWhere(
                  (event) =>
                      event.uid ==
                      uidHiddenEvents[index - namedHiddenEvents.length],
                ),
                index: index,
                removeItem:
                    () => ref
                        .read(hiddenEventProvider.notifier)
                        .removeUidEventByIndex(
                          index - namedHiddenEvents.length,
                        ),
              );
        }

        return _buildScaffold(_itemBuilder, namedHiddenEvents, uidHiddenEvents);
      },
      loading:
          () => _buildScaffold(
            null,
            namedHiddenEvents,
            uidHiddenEvents,
            isLoading: true,
          ),
      error:
          (error, stack) => _buildScaffold(
            null,
            namedHiddenEvents,
            uidHiddenEvents,
            error: error,
          ),
    );
  }

  Widget _buildScaffold(
    Widget Function(BuildContext, int)? itemBuilder,
    List<String> namedHiddenEvents,
    List<String> uidHiddenEvents, {
    bool isLoading = false,
    Object? error,
  }) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(title: Text('Événements masqués')),
      body: _buildBody(
        itemBuilder,
        namedHiddenEvents,
        uidHiddenEvents,
        isLoading: isLoading,
        error: error,
      ),
    );
  }

  Widget _buildBody(
    Widget Function(BuildContext, int)? itemBuilder,
    List<String> namedHiddenEvents,
    List<String> uidHiddenEvents, {
    bool isLoading = false,
    Object? error,
  }) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    if (error != null) {
      return Center(child: Text('Erreur: $error'));
    }

    if (namedHiddenEvents.length + uidHiddenEvents.length > 0 &&
        itemBuilder != null) {
      return ListView.builder(
        itemBuilder: itemBuilder,
        itemCount: namedHiddenEvents.length + uidHiddenEvents.length,
      );
    }

    return Center(child: Text('Aucun événement masqué'));
  }
}
