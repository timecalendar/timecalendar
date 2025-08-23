import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/hidden_event/providers/hidden_event_provider.dart';

enum HiddenOption { HiddenUid, HiddenNamedEvent }

class HiddenOptionsDialog extends HookConsumerWidget {
  final EventInterface event;
  const HiddenOptionsDialog({Key? key, required this.event}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupValue = useState<HiddenOption?>(HiddenOption.HiddenUid);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      title: const Text('Masquer l\'événement', style: TextStyle(fontSize: 20)),
      content: SingleChildScrollView(
        child: ListBody(
          children: <Widget>[
            RadioGroup<HiddenOption>(
              groupValue: groupValue.value,
              onChanged: (HiddenOption? value) {
                groupValue.value = value;
              },
              child: Column(
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      const Radio<HiddenOption>(value: HiddenOption.HiddenUid),
                      GestureDetector(
                        child: const Text('Masquer cet événement'),
                        onTap: () {
                          groupValue.value = HiddenOption.HiddenUid;
                        },
                      ),
                    ],
                  ),
                  Row(
                    children: <Widget>[
                      const Radio<HiddenOption>(
                        value: HiddenOption.HiddenNamedEvent,
                      ),
                      Expanded(
                        child: GestureDetector(
                          child: const Text(
                            'Masquer tous les événements de même nom',
                          ),
                          onTap: () {
                            groupValue.value = HiddenOption.HiddenNamedEvent;
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: <Widget>[
        TextButton(
          child: const Text('Annuler'),
          onPressed: () {
            Navigator.of(context).pop();
          },
        ),
        TextButton(
          child: const Text('Masquer'),
          onPressed: () {
            if (groupValue.value == HiddenOption.HiddenUid) {
              ref.read(hiddenEventProvider.notifier).addUidEvent(event.uid);
            } else if (groupValue.value == HiddenOption.HiddenNamedEvent) {
              ref.read(hiddenEventProvider.notifier).addNamedEvent(event.title);
            }
            Navigator.of(context).pop();
            Navigator.of(context).pop();
          },
        ),
      ],
    );
  }
}
