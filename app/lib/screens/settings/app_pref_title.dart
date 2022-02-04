import 'package:flutter/material.dart';
import 'package:pref/pref.dart';

class AppPrefTitle extends StatelessWidget {
  final Widget? title;

  const AppPrefTitle({Key? key, this.title}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return PrefTitle(
      title: DefaultTextStyle(
        style: theme.textTheme.headline6!,
        child: title!,
      ),
    );
  }
}
