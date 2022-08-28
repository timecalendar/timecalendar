import 'package:flutter/material.dart';
import 'package:timecalendar_api/timecalendar_api.dart' as Api;
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';
import 'package:timecalendar/modules/shared/utils/icons_helper.dart';

class EventTag {
  final String name;
  final Color color;
  final String icon;
  late final IconData iconData;

  EventTag({required this.name, required this.color, required this.icon}) {
    this.iconData = this._getIconData(icon);
  }

  _getIconData(String myIcon) {
    var icon = myIcon.split('-');
    for (var i = 1; i < icon.length; i++) {
      icon[i] = icon[i][0].toUpperCase() + icon[i].substring(1);
    }
    var iconName = icon.join('');
    return getIconGuessFavorFA(name: iconName) ??
        FontAwesomeIcons.graduationCap;
  }

  factory EventTag.fromApi(Api.EventTag eventTag) {
    return EventTag(
      name: eventTag.name,
      color: ColorUtils.hexToColor(eventTag.color),
      icon: eventTag.icon,
    );
  }

  factory EventTag.fromDb(Map<String, dynamic> map) {
    return EventTag(
      name: map['name'],
      color: ColorUtils.hexToColor(map['color']),
      icon: map['icon'],
    );
  }

  Map<String, dynamic> toDbMap() {
    return {
      'name': name,
      'color': ColorUtils.colorToHex(color),
      'icon': icon,
    };
  }
}
