import 'dart:math';

import 'package:flutter/material.dart';

class SnappingListScrollPhysics extends ScrollPhysics {
  final double mainAxisStartPadding;
  final double itemExtent;

  const SnappingListScrollPhysics(
      {ScrollPhysics? parent,
      this.mainAxisStartPadding = 0.0,
      required this.itemExtent})
      : super(parent: parent);

  @override
  SnappingListScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return SnappingListScrollPhysics(
      parent: buildParent(ancestor),
      mainAxisStartPadding: mainAxisStartPadding,
      itemExtent: itemExtent,
    );
  }

  double _getItem(ScrollPosition position) {
    return (position.pixels - mainAxisStartPadding) / itemExtent;
  }

  double _getPixels(ScrollPosition position, double item) {
    return min(item * itemExtent, position.maxScrollExtent);
  }

  double _getTargetPixels(
      ScrollPosition position, Tolerance tolerance, double velocity) {
    double item = _getItem(position);
    if (velocity < -tolerance.velocity) {
      item -= 0.5;
    } else if (velocity > tolerance.velocity) {
      item += 0.5;
    }
    return _getPixels(position, item.roundToDouble());
  }

  @override
  Simulation? createBallisticSimulation(
      ScrollMetrics position, double velocity) {
    if ((velocity <= 0.0 && position.pixels <= position.minScrollExtent) ||
        (velocity >= 0.0 && position.pixels >= position.maxScrollExtent))
      return super.createBallisticSimulation(position, velocity);
    final Tolerance tolerance = this.toleranceFor(position);
    final double target =
        _getTargetPixels(position as ScrollPosition, tolerance, velocity);
    if (target != position.pixels) {
      return ScrollSpringSimulation(
        spring,
        position.pixels,
        target,
        velocity * 2.25,
        tolerance: tolerance,
      );
    }
    return null;
  }

  @override
  bool get allowImplicitScrolling {
    return false;
  }
}
