import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/grade.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/screens/units_selection_screen.dart';

class GradeItem extends StatelessWidget {
  const GradeItem({Key key, @required this.grade, this.selectGrade})
      : super(key: key);

  final Grade grade;
  final Function selectGrade;

  @override
  Widget build(BuildContext context) {
    var settingsProvider = Provider.of<SettingsProvider>(context);
    
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
              selectGrade(grade);
              Navigator.pushNamed(
                context,
                UnitsSelectionScreen.routeName,
                arguments: grade.id,
              );
            },
            borderRadius: BorderRadius.circular(15),
            child: Row(
              children: <Widget>[
                Flexible(
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Text(
                      grade.name,
                      style: TextStyle(
                        fontSize: 18,
                      ),
                    ),
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
