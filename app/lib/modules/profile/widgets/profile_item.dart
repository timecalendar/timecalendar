import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';

class ProfileItem extends ConsumerWidget {
  final String title;
  final Widget icon;
  final Function action;
  final bool unread;

  const ProfileItem({
    Key? key,
    required this.title,
    required this.icon,
    required this.action,
    this.unread = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);

    return InkWell(
      onTap: () {
        action();
      },
      child: Container(
        padding: const EdgeInsets.all(25.0),
        child: Container(
          child: Row(
            children: <Widget>[
              Expanded(
                child: Row(
                  children: <Widget>[
                    Text(title, style: TextStyle(fontSize: 18)),
                    if (unread) SizedBox(width: 10),
                    if (unread)
                      Container(
                        height: 6,
                        width: 6,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(5),
                          color: Theme.of(context).primaryColor,
                        ),
                      ),
                  ],
                ),
              ),
              IconTheme(data: const IconThemeData(size: 20), child: icon),
            ],
          ),
        ),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: settings.currentTheme.lineColor),
          ),
          color: unread
              ? Theme.of(context).primaryColorLight
              : Colors.transparent,
        ),
      ),
    );
  }
}
