import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(30.0),
      decoration: BoxDecoration(color: Theme.of(context).primaryColor),
      child: Theme(
        data: Theme.of(context).copyWith(
          iconTheme: Theme.of(context).iconTheme.copyWith(color: Colors.white),
        ),
        child: DefaultTextStyle(
          style: DefaultTextStyle.of(
            context,
          ).style.copyWith(color: Colors.white),
          child: SafeArea(
            child: Row(
              children: <Widget>[
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'TimeCalendar',
                        style: TextStyle(
                          fontSize: 25,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 5),
                      Text('Profil', style: TextStyle(fontSize: 18)),
                    ],
                  ),
                ),
                Container(child: Icon(FontAwesomeIcons.user, size: 50)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
