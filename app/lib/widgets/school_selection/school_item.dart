import 'package:flutter/material.dart';
import 'package:flutter_image/network.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/constants/environment.dart';
import 'package:timecalendar/models/school.dart';
import 'package:timecalendar/providers/settings_provider.dart';

class SchoolItem extends StatelessWidget {
  const SchoolItem({
    Key key,
    @required this.school,
    this.selection,
  }) : super(key: key);

  final School school;
  final Function selection;

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);
    return Container(
      width: 220,
      padding: EdgeInsets.only(
        right: 15,
        left: 15,
        bottom: 7,
        top: 7,
      ),
      child: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              offset: Offset(0, 3),
              color: Color.fromRGBO(0, 0, 0, 0.1),
              blurRadius: 8,
            ),
          ],
        ),
        child: Material(
          color: settingsProvider.currentTheme.cardColor,
          borderRadius: BorderRadius.circular(15),
          child: InkWell(
            onTap: () {
              selection(school);
            },
            borderRadius: BorderRadius.circular(15),
            child: Row(
              children: <Widget>[
                Container(
                  height: 100,
                  width: 100,
                  margin: EdgeInsets.only(right: 10),
                  child: ClipRRect(
                    borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(15),
                        topLeft: Radius.circular(15)),
                    child: Padding(
                      padding: const EdgeInsets.all(5.0),
                      child: Image(
                        image: NetworkImageWithRetry(
                          Environment.mainApiUrl +
                              '/images/schools/' +
                              school.code,
                        ),
                      ),
                    ),
                  ),
                ),
                Flexible(
                  child: Text(
                    school.name,
                    style: TextStyle(fontSize: 18),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
