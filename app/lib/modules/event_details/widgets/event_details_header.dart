import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_hidden_dialog.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';
import 'package:timecalendar/modules/personal_event/providers/personal_events_provider.dart';

import 'package:timecalendar/modules/personal_event/screens/add_personal_event_screen.dart';

enum EventOption { HideEvent, RemoveEvent, UpdateEvent }

enum ConfirmAction { CANCEL, ACCEPT }

class EventDetailsHeader extends ConsumerWidget {
  final EventInterface event;
  final void Function(EventInterface) onEventChange;
  EventDetailsHeader({required this.event, required this.onEventChange});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> _hiddenEventDialog() async {
      return showDialog<void>(
        context: context,
        barrierDismissible: false, // user must tap button!
        builder: (BuildContext context) {
          return HiddenOptionsDialog(event: event);
        },
      );
    }

    void _updateEvent(BuildContext context) {
      Navigator.of(context)
          .push(
            MaterialPageRoute(
              builder: (context) =>
                  AddPersonalEventScreen(event: event as PersonalEvent),
            ),
          )
          .then((value) {
            if (value != null) {
              onEventChange(value);
            }
          });
    }

    // todo put the dialog in widget
    Future<void> _removeEventConfirmDialog(BuildContext context) async {
      return showDialog<ConfirmAction>(
        context: context,
        barrierDismissible: false, // user must tap button for close dialog!
        builder: (BuildContext context) {
          return AlertDialog(
            title: Text('Supprimer événement'),
            content: const Text('L\'événement sera supprimé. Continuer ?'),
            actions: <Widget>[
              TextButton(
                child: const Text('Annuler'),
                onPressed: () {
                  Navigator.of(context).pop(ConfirmAction.CANCEL);
                },
              ),
              TextButton(
                child: const Text('Confirmer'),
                onPressed: () {
                  Navigator.of(context).pop(ConfirmAction.ACCEPT);
                },
              ),
            ],
          );
        },
      ).then((confirm) async {
        if (confirm == ConfirmAction.ACCEPT) {
          await ref
              .read(personalEventsProvider.notifier)
              .deletePersonalEvent(event.uid);
          Navigator.of(context).pop();
        }
      });
    }

    List<PopupMenuEntry<EventOption>> menuItemBuilder(BuildContext context) {
      List<PopupMenuEntry<EventOption>> listMenu = [];

      if (event.kind == EventKind.Calendar) {
        listMenu.add(
          PopupMenuItem(child: Text('Masquer'), value: EventOption.HideEvent),
        );
      }

      if (event.kind == EventKind.Personal) {
        listMenu.add(
          PopupMenuItem(
            child: Text('Modifier'),
            value: EventOption.UpdateEvent,
          ),
        );

        listMenu.add(
          PopupMenuItem(
            child: Text('Supprimer'),
            value: EventOption.RemoveEvent,
          ),
        );
      }

      return listMenu;
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: <Widget>[
          IconButton(
            icon: Icon(Icons.keyboard_arrow_left),
            onPressed: () {
              Navigator.of(context).pop();
            },
            iconSize: 30,
          ),
          Expanded(child: Container()),
          PopupMenuButton(
            icon: Icon(Icons.more_vert, size: 30),
            tooltip: 'Menu',
            itemBuilder: menuItemBuilder,
            onSelected: (EventOption event) {
              switch (event) {
                case EventOption.HideEvent:
                  _hiddenEventDialog();
                  break;

                case EventOption.RemoveEvent:
                  _removeEventConfirmDialog(context);
                  break;

                case EventOption.UpdateEvent:
                  _updateEvent(context);
                  break;
              }
            },
          ),
        ],
      ),
    );
  }
}
