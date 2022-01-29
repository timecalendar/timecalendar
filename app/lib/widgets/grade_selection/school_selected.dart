import 'package:flutter/material.dart';
import 'package:flutter_image/network.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/constants/environment.dart';
import 'package:timecalendar/models/grade.dart';
import 'package:timecalendar/models/school.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/services/url_launcher.dart';

class SchoolSelected extends StatelessWidget {
  final School school;
  final Grade grade;
  SchoolSelected(this.school, this.grade);

  @override
  Widget build(BuildContext context) {
    var settingsProvider = Provider.of<SettingsProvider>(context);

    return Container(
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
        // borderRadius: BorderRadius.circular(15),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Flexible(
              child: Container(
                margin: EdgeInsets.symmetric(
                  horizontal: 8.0,
                ),
                width: 120,
                height: 120,
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: ClipRRect(
                    borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(4),
                        topLeft: Radius.circular(4)),
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
            ),
            Flexible(
              child: Padding(
                padding: const EdgeInsets.all(10.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      school.name,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (grade == null)
                      GestureDetector(
                        onTap: () => UrlLauncher.launchUrl(school.siteurl),
                        child: Text(school.siteurl),
                      )
                    else
                      Text(
                        grade.name,
                      ),
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
