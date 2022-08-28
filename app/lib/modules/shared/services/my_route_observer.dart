import 'package:flutter/material.dart';
import 'package:timecalendar/modules/home/screens/tabs_screen.dart';
import 'package:timecalendar/modules/shared/services/status_bar.dart';

class MyRouteObserver extends RouteObserver<PageRoute<dynamic>> {
  final bool? darkMode;

  MyRouteObserver({this.darkMode});

  void _sendScreenView(PageRoute<dynamic> route) {
    var screenName = route.settings.name;
    var statusBar = StatusBarService();

    if (screenName == TabsScreen.routeName && !darkMode!) {
      Future.delayed(Duration(milliseconds: 500)).then((_) {
        statusBar.setStatusBarColor(darkTextOnLightBackground: true);
      });
    }
    // else {
    //   Future.delayed(Duration(milliseconds: 500))
    //   .then((_) {
    //   statusBar.setStatusBarColor(darkTextOnLightBackground: false);
    //   });
    // }
    // do something with it, ie. send it to your analytics service collector
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    if (route is PageRoute) {
      _sendScreenView(route);
    }
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    if (newRoute is PageRoute) {
      _sendScreenView(newRoute);
    }
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    if (previousRoute is PageRoute && route is PageRoute) {
      _sendScreenView(previousRoute);
    }
  }
}
