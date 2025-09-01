import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:provider/provider.dart' as oldprovider;
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/hidden_event/providers/hidden_event_provider.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

class HiddenEventItem extends ConsumerWidget {
  final EventInterface? event;
  final String? namedEvent;
  final int index;
  final Function removeItem;
  const HiddenEventItem({
    Key? key,
    this.event,
    this.namedEvent,
    required this.index,
    required this.removeItem,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hiddenEvents = ref.watch(hiddenEventProvider);
    final namedHiddenEvents = hiddenEvents.namedHiddenEvents;

    Widget? infoText() {
      if (event == null) return null;

      var text = AppDateUtils.eventDateTimeText(event!.startsAt, event!.endsAt);
      return Text(text, style: TextStyle(fontSize: 14));
    }

    Widget getTextCategory(BuildContext context) {
      if (this.index == 0 && namedHiddenEvents.length > 0) {
        return Text('Groupe d\'événements masqués');
      } else {
        return Text('Événements masqués');
      }
    }

    Widget infoCategory(BuildContext context) {
      if (this.index == 0 || this.index == namedHiddenEvents.length) {
        return Padding(
          padding: const EdgeInsets.only(
            top: 20,
            bottom: 10,
            left: 25,
            right: 15,
          ),
          child: getTextCategory(context),
        );
      } else {
        return SizedBox(width: 0.0, height: 0.0);
      }
    }

    final settingsProvider = oldprovider.Provider.of<SettingsProvider>(context);

    return Column(
      children: <Widget>[
        infoCategory(context),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 15),
          child: Container(
            child: Padding(
              padding: const EdgeInsets.all(15.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: <Widget>[
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          (event != null) ? event!.title : this.namedEvent!,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: 10),
                        infoText() ?? SizedBox(),
                      ],
                    ),
                  ),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: <Widget>[
                      Container(
                        padding: EdgeInsets.all(5),
                        decoration: BoxDecoration(shape: BoxShape.circle),
                        child: IconButton(
                          tooltip: (event != null)
                              ? "Afficher l'événement"
                              : "Afficher les événements",
                          icon: Icon(Icons.delete_outline),
                          onPressed: () => this.removeItem(),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            decoration: BoxDecoration(
              color: settingsProvider.currentTheme.cardColor,
              borderRadius: BorderRadius.circular(15),
            ),
          ),
        ),
      ],
    );
  }
}
