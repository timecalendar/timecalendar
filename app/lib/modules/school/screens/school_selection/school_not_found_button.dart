import 'package:flutter/material.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';

class SchoolNotFoundButton extends StatelessWidget {
  final Function onPressed;

  const SchoolNotFoundButton({Key? key, required this.onPressed})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(15.0),
      child: CustomButton(
        text: 'Je ne trouve pas mon établissement',
        outline: true,
        onPressed: onPressed,
      ),
    );
  }
}
