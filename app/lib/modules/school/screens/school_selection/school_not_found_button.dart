import 'package:flutter/material.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';

class SchoolNotFoundButton extends StatelessWidget {
  const SchoolNotFoundButton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(15.0),
      child: CustomButton(
        text: 'Je ne trouve pas mon établissement',
        outline: true,
        onPressed: () {},
        // onPressed: loadSchoolAssistant,
      ),
    );
  }
}