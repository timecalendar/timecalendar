import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/event.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/screens/add_personal_event.dart';
import 'package:timecalendar/widgets/event_details/event_details_hidden_dialog.dart';

enum EventOption { HideEvent, RemoveEvent, UpdateEvent }

enum ConfirmAction { CANCEL, ACCEPT }

class EventDetailsHeader extends StatelessWidget {
  final Event event;
  EventDetailsHeader({required this.event});

  @override
  Widget build(BuildContext context) {
    Future<void> _hiddenEventDialog() async {
      return showDialog<void>(
        context: context,
        barrierDismissible: false, // user must tap button!
        builder: (BuildContext context) {
          return HiddenOptionsDialog(
            event: event,
          );
        },
      );
    }

    void _updateEvent(BuildContext context) {
      Navigator.of(context).push(
        // With MaterialPageRoute, you can pass data between pages,
        // but if you have a more complex app, you will quickly get lost.
        MaterialPageRoute(
          builder: (context) => AddPersonalEventScreen(event: event),
        ),
      );
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
              )
            ],
          );
        },
      ).then((confirm) async {
        if (confirm == ConfirmAction.ACCEPT) {
          var eventsProvider =
              Provider.of<EventsProvider>(context, listen: false);
          await eventsProvider.removePersonalEvent(event.uid);
          Navigator.of(context).pop();
        }
      });
    }

    List<PopupMenuEntry<EventOption>> menuItemBuilder(BuildContext context) {
      List<PopupMenuEntry<EventOption>> listMenu = [];
      listMenu.add(
        PopupMenuItem(
          child: Text('Masquer'),
          value: EventOption.HideEvent,
        ),
      );

      if (event.unitId == -1) {
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
          Expanded(
            child: Container(),
          ),
          PopupMenuButton(
            icon: Icon(
              Icons.more_vert,
              size: 30,
            ),
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

                default:
                  break;
              }
            },
          ),
        ],
      ),
    );
  }
}
