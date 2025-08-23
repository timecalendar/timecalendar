import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/hidden_event/providers/hidden_event_provider.dart';
import 'package:timecalendar/modules/hidden_event/widgets/hidden_event_item.dart';

class _HiddenEventDisplayItem {
  final String? namedEvent;
  final dynamic event;
  final int originalNamedIndex;
  final int originalUidIndex;
  final bool isNamedEvent;

  _HiddenEventDisplayItem.named({
    required this.namedEvent,
    required this.originalNamedIndex,
  }) : event = null,
       originalUidIndex = -1,
       isNamedEvent = true;

  _HiddenEventDisplayItem.uid({
    required this.event,
    required this.originalUidIndex,
  }) : namedEvent = null,
       originalNamedIndex = -1,
       isNamedEvent = false;
}

class HiddenEventsScreen extends ConsumerWidget {
  static const routeName = '/hidden_events';

  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();

  List<_HiddenEventDisplayItem> _buildDisplayItems(
    List<String> namedHiddenEvents,
    List<String> uidHiddenEvents,
    List<dynamic> events,
  ) {
    final displayItems = <_HiddenEventDisplayItem>[];

    // Add all named events
    for (int i = 0; i < namedHiddenEvents.length; i++) {
      displayItems.add(
        _HiddenEventDisplayItem.named(
          namedEvent: namedHiddenEvents[i],
          originalNamedIndex: i,
        ),
      );
    }

    // Add only existing uid events
    for (int i = 0; i < uidHiddenEvents.length; i++) {
      final targetUid = uidHiddenEvents[i];
      final event = events.where((event) => event.uid == targetUid).firstOrNull;
      if (event != null) {
        displayItems.add(
          _HiddenEventDisplayItem.uid(event: event, originalUidIndex: i),
        );
      }
    }

    return displayItems;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(eventsProvider);
    final hiddenEvents = ref.watch(hiddenEventProvider);
    final namedHiddenEvents = hiddenEvents.namedHiddenEvents.toList();
    final uidHiddenEvents = hiddenEvents.uidHiddenEvents.toList();

    return eventsAsync.when(
      data: (events) {
        final displayItems = _buildDisplayItems(
          namedHiddenEvents,
          uidHiddenEvents,
          events,
        );

        Widget _itemBuilder(BuildContext context, int index) {
          final item = displayItems[index];

          if (item.isNamedEvent) {
            return HiddenEventItem(
              namedEvent: item.namedEvent!,
              index: index,
              removeItem:
                  () => ref
                      .read(hiddenEventProvider.notifier)
                      .removeNamedEventByIndex(item.originalNamedIndex),
            );
          } else {
            return HiddenEventItem(
              event: item.event,
              index: index,
              removeItem:
                  () => ref
                      .read(hiddenEventProvider.notifier)
                      .removeUidEventByIndex(item.originalUidIndex),
            );
          }
        }

        return _buildScaffold(_itemBuilder, displayItems);
      },
      loading: () => _buildScaffold(null, [], isLoading: true),
      error: (error, stack) => _buildScaffold(null, [], error: error),
    );
  }

  Widget _buildScaffold(
    Widget Function(BuildContext, int)? itemBuilder,
    List<_HiddenEventDisplayItem> displayItems, {
    bool isLoading = false,
    Object? error,
  }) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(title: Text('Événements masqués')),
      body: _buildBody(
        itemBuilder,
        displayItems,
        isLoading: isLoading,
        error: error,
      ),
    );
  }

  Widget _buildBody(
    Widget Function(BuildContext, int)? itemBuilder,
    List<_HiddenEventDisplayItem> displayItems, {
    bool isLoading = false,
    Object? error,
  }) {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    if (error != null) {
      return Center(child: Text('Erreur: $error'));
    }

    if (displayItems.isNotEmpty && itemBuilder != null) {
      return ListView.builder(
        itemBuilder: itemBuilder,
        itemCount: displayItems.length,
      );
    }

    return Center(child: Text('Aucun événement masqué'));
  }
}
