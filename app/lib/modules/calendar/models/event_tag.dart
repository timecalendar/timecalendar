import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';
import 'package:timecalendar/modules/shared/utils/icons_helper.dart';

class EventTag {
  final String? name;
  final Color? color;
  final String? icon;
  final IconData? iconData;

  EventTag({
    this.name,
    this.color,
    this.icon,
    this.iconData,
  });

  factory EventTag.fromApi(Map<String, dynamic> tag) {
    // Font awesome icon tag
    var icon = (tag['icon'] as String).split('-');
    for (var i = 1; i < icon.length; i++) {
      icon[i] = icon[i][0].toUpperCase() + icon[i].substring(1);
    }
    var iconName = icon.join('');

    return EventTag(
      name: tag['name'],
      color: ColorUtils.hexToColor(tag['color']),
      icon: tag['icon'],
      iconData:
          getIconGuessFavorFA(name: iconName) ?? FontAwesomeIcons.graduationCap,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'color': ColorUtils.colorToHex(color!),
      'icon': '',
    };
  }
}
