import 'package:flutter/material.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';

class PlanningIndicator extends StatelessWidget {
  const PlanningIndicator({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: ColorUtils.hexToColor('#ff6385'),
            borderRadius: BorderRadius.circular(100),
          ),
        ),
        Expanded(
          child: Container(
            transform: Matrix4.translationValues(-1.0, 0.0, 0.0),
            padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 1.5),
            color: ColorUtils.hexToColor('#ff6385'),
          ),
        ),
      ],
    );
  }
}
