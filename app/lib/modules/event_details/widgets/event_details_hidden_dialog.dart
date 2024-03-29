import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/hidden_event/providers/hidden_event_provider.dart';

enum HiddenOption { HiddenUid, HiddenNamedEvent }

class HiddenOptionsDialog extends ConsumerStatefulWidget {
  final EventInterface event;
  HiddenOptionsDialog({Key? key, required this.event}) : super(key: key);

  @override
  _HiddenOptionsDialogState createState() => _HiddenOptionsDialogState();
}

class _HiddenOptionsDialogState extends ConsumerState<HiddenOptionsDialog> {
  HiddenOption? _groupValue = HiddenOption.HiddenUid;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
      title: Text(
        'Masquer l\'événement',
        style: TextStyle(fontSize: 20),
      ),
      content: SingleChildScrollView(
        child: ListBody(
          children: <Widget>[
            Column(
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Radio(
                      value: HiddenOption.HiddenUid,
                      groupValue: _groupValue,
                      onChanged: (dynamic value) {
                        setState(() {
                          _groupValue = value;
                        });
                      },
                    ),
                    GestureDetector(
                      child: Text('Masquer cet événement'),
                      onTap: () => {
                        setState(() {
                          _groupValue = HiddenOption.HiddenUid;
                        }),
                      },
                    ),
                  ],
                ),
                Row(
                  children: <Widget>[
                    Radio(
                      value: HiddenOption.HiddenNamedEvent,
                      groupValue: _groupValue,
                      onChanged: (dynamic value) {
                        setState(() {
                          _groupValue = value;
                        });
                      },
                    ),
                    Expanded(
                      child: GestureDetector(
                        child: Text('Masquer tous les événements de même nom'),
                        onTap: () => {
                          setState(() {
                            _groupValue = HiddenOption.HiddenNamedEvent;
                          }),
                        },
                      ),
                    ),
                  ],
                ),
              ],
            )
          ],
        ),
      ),
      actions: <Widget>[
        TextButton(
          child: Text('Annuler'),
          onPressed: () {
            Navigator.of(context).pop();
          },
        ),
        TextButton(
          child: Text('Masquer'),
          onPressed: () {
            if (_groupValue == HiddenOption.HiddenUid) {
              ref
                  .read(hiddenEventProvider.notifier)
                  .addUidEvent(widget.event.uid);
            } else if (_groupValue == HiddenOption.HiddenNamedEvent) {
              ref
                  .read(hiddenEventProvider.notifier)
                  .addNamedEvent(widget.event.title);
            }
            Navigator.of(context).pop();
            Navigator.of(context).pop();
          },
        ),
      ],
    );
  }
}
