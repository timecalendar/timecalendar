import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/splash/hooks/use_splash_controller.dart';

class SplashScreen extends HookConsumerWidget {
  static const routeName = '/';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    useSplashController(context, ref);

    return Scaffold(
      body: Container(
        width: double.infinity,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Container(
              width: 150,
              child: Image.asset('assets/images/logo.png'),
            ),
          ],
        ),
      ),
    );
  }
}
