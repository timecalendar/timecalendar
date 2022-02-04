import 'package:flutter/material.dart';

class AppAlertDialogAction {
  final String? text;

  final void Function()? onPressed;

  AppAlertDialogAction({this.text, this.onPressed});
}

class AppAlertDialog extends StatelessWidget {
  final String? title;

  final Widget? content;

  final List<AppAlertDialogAction>? actions;

  const AppAlertDialog({Key? key, this.title, this.content, this.actions})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      contentPadding: const EdgeInsets.all(6.0),
      title: Text(title!),
      content: content,
      actions: actions!
          .map((action) => TextButton(
                child: Text(action.text!),
                onPressed: action.onPressed,
              ))
          .toList(),
    );
  }
}
