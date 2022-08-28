import 'dart:math';

import 'package:flutter/material.dart';

class SyncScrollController {
  List<ScrollController?> _registeredScrollControllers = [];
  List<Function> _listeners = [];

  ScrollController? _scrollingController;
  bool _scrollingActive = false;
  double currentOffset = 0.0;

  SyncScrollController(List<ScrollController> controllers) {
    controllers.forEach((controller) => registerScrollController(controller));
  }

  void jumpTo(double value) {
    var offset = min(_registeredScrollControllers[0]!.position.maxScrollExtent,
        max(0.0, value));
    _registeredScrollControllers
        .forEach((controller) => controller!.jumpTo(offset));
    _listeners.forEach((listener) => listener(offset));
  }

  void registerScrollController(ScrollController? controller) {
    _registeredScrollControllers.add(controller);
  }

  void unregisterScrollController(ScrollController? controller) {
    _registeredScrollControllers.remove(controller);
  }

  void addListener(Function function) {
    _listeners.add(function);
  }

  void removeListener(Function function) {
    _listeners.remove(function);
  }

  void processNotification(
      ScrollNotification notification, ScrollController? sender) {
    if (notification is ScrollStartNotification && !_scrollingActive) {
      _scrollingController = sender;
      _scrollingActive = true;
      return;
    }

    if (identical(sender, _scrollingController) && _scrollingActive) {
      if (notification is ScrollEndNotification) {
        _scrollingController = null;
        _scrollingActive = false;
        return;
      }

      if (notification is ScrollUpdateNotification) {
        var offset = _scrollingController!.offset;
        _registeredScrollControllers.forEach((controller) => {
              if (!identical(_scrollingController, controller))
                controller!..jumpTo(offset)
            });
        _listeners.forEach((listener) => listener(offset));
        currentOffset = offset;
        return;
      }
    }
  }
}
