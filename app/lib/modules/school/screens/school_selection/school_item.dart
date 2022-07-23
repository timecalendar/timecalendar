import 'package:flutter/material.dart';
import 'package:flutter_image/network.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class SchoolItem extends StatelessWidget {
  const SchoolItem({
    Key? key,
    required this.school,
    required this.onSchoolSelect,
  }) : super(key: key);

  final SchoolForList school;
  final Function(SchoolForList) onSchoolSelect;

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: 15,
        vertical: 8,
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
            onTap: () => onSchoolSelect(school),
            borderRadius: BorderRadius.circular(15),
            child: Row(
              children: <Widget>[
                Container(
                  height: 100,
                  width: 100,
                  child: ClipRRect(
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(15),
                      topLeft: Radius.circular(15),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(5.0),
                      child: Image(
                        image: NetworkImageWithRetry(school.imageUrl),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 10),
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
