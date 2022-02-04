import 'package:uuid/uuid.dart';

class ChecklistItem {
  String? uuid;
  String? eventUid;
  String? content;
  bool? isChecked;
  int? order;
  DateTime? createdAt;
  DateTime? updatedAt;
  DateTime? deletedAt;

  ChecklistItem({
    this.uuid,
    this.eventUid,
    this.content,
    this.isChecked,
    this.order,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  }) {
    if (this.uuid == null) {
      this.uuid = Uuid().v4();
    }
  }

  factory ChecklistItem.fromMap(Map<String, dynamic> map) {
    return ChecklistItem(
      uuid: map['uuid'],
      eventUid: map['eventUid'],
      content: map['content'],
      isChecked: map['isChecked'],
      order: map['order'],
      createdAt:
          map['createdAt'] != null ? DateTime.parse(map['createdAt']) : null,
      updatedAt:
          map['updatedAt'] != null ? DateTime.parse(map['updatedAt']) : null,
      deletedAt:
          map['deletedAt'] != null ? DateTime.parse(map['deletedAt']) : null,
    );
  }

  Map<String, dynamic> toMap() {
    var map = Map<String, dynamic>();
    map['uuid'] = uuid;
    map['eventUid'] = eventUid;
    map['content'] = content;
    map['isChecked'] = isChecked;
    map['order'] = order;
    map['createdAt'] = createdAt != null ? createdAt!.toIso8601String() : null;
    map['updatedAt'] = updatedAt != null ? updatedAt!.toIso8601String() : null;
    map['deletedAt'] = deletedAt != null ? deletedAt!.toIso8601String() : null;
    return map;
  }

  @override
  String toString() {
    return this.toMap().toString();
  }
}
