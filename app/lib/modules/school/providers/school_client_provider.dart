import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timecalendar/modules/school/clients/school_client.dart';

final schoolClientProvider = Provider((ref) => SchoolClient(ref.read));
