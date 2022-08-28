import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';

class ProfileItem extends StatelessWidget {
  final String title;
  final IconData icon;
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
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);

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
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 18,
                      ),
                    ),
                    if (unread)
                      SizedBox(
                        width: 10,
                      ),
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
              Icon(
                icon,
                size: 20,
              ),
            ],
          ),
        ),
        decoration: BoxDecoration(
            border: Border(
              bottom:
                  BorderSide(color: settingsProvider.currentTheme.lineColor),
            ),
            color: unread
                ? Theme.of(context).primaryColorLight
                : Colors.transparent),
      ),
    );
  }
}
