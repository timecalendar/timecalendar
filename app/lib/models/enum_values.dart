class EnumValues<T> {
  Map<String, T> map;
  Map<T, String> reverseMap = {};

  EnumValues(this.map) {
    reverseMap = map.entries.fold(reverseMap, (acc, val) {
      acc[val.value] = val.key;
      return acc;
    });
  }

  String? stringValue(T val) {
    return reverseMap[val];
  }

  T? fromString(String val) {
    return map[val];
  }

  Map<T, String> get reverse {
    return reverseMap;
  }
}
