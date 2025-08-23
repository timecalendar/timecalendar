import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/widgets/planning_view/planning_rectangle_event.dart';

class PlanningEventTile extends StatelessWidget {
  final EventInterface event;
  final VoidCallback onTap;

  const PlanningEventTile({Key? key, required this.event, required this.onTap})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    // You may want to inject color logic here or pass it from parent
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Material(
        color: Colors.transparent, // Color should be set by parent if needed
        borderRadius: BorderRadius.circular(15),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(15),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 8,
                  ),
                  child: PlanningRectangleEvent(event: event),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    boxShadow: [
                      BoxShadow(
                        offset: Offset(0, 3),
                        color: Color.fromRGBO(0, 0, 0, 0.06),
                        blurRadius: 15,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
