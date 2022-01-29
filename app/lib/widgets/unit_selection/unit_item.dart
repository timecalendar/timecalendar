import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/unit.dart';
import 'package:timecalendar/providers/school_provider.dart';

class UnitItem extends StatelessWidget {
  const UnitItem(
      {Key key, @required this.unit, this.selectUnit, this.isNewSection})
      : super(key: key);

  final Unit unit;
  final Function selectUnit;
  final bool isNewSection;

  @override
  Widget build(BuildContext context) {
    var schoolProvider = Provider.of<SchoolProvider>(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        (isNewSection)
            ? Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 15,
                  vertical: 5,
                ),
                child: Text(
                  unit.typeUnitName,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              )
            : Container(),
        InkWell(
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
                  key: Key('Hello'),
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
        )
      ],
    );
  }
}
