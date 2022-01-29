import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/list_item.dart';
import 'package:timecalendar/models/unit.dart';
import 'package:timecalendar/providers/school_provider.dart';

class UnitItem extends ListItem {
  final Unit unit;

  UnitItem(this.unit);

  @override
  Widget buildItem(BuildContext context) {
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);

    return InkWell(
      onTap: () {
        schoolProvider.toggleUnit(unit);
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 5,
        ),
        child: Row(
          children: <Widget>[
            Checkbox(
              key: Key('${unit.id}'),
              onChanged: (bool value) {
                schoolProvider.toggleUnit(unit);
              },
              value: schoolProvider.isSelectedUnit(unit),
            ),
            Expanded(
              child: Text(
                unit.name,
                style: TextStyle(
                  fontSize: 16,
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
