import 'package:built_collection/built_collection.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/add_grade/providers/add_grade_provider.dart';
import 'package:timecalendar/modules/add_school/providers/add_school_provider.dart';
import 'package:timecalendar/modules/assistant/providers/assistant_provider.dart';
import 'package:timecalendar/modules/calendar/providers/user_calendar_provider.dart';
import 'package:timecalendar/modules/import_ical/providers/ical_url_provider.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar/modules/shared/utils/snackbar.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';
import 'package:timecalendar/modules/suggestion/utils/format_device_info.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

List<String> SUBJECTS = [
  'Signaler un problème',
  'Proposer une fonctionnalité',
  'Autre',
];

class SuggestionScreenArguments {
  final bool fromFailedIcalImport;

  SuggestionScreenArguments({required this.fromFailedIcalImport});
}

class SuggestionScreen extends HookConsumerWidget {
  static const routeName = '/suggestion';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final args =
        ModalRoute.of(context)!.settings.arguments as SuggestionScreenArguments;

    final _messageFocusNode = useMemoized(() => FocusNode());
    final _scaffoldKey = useMemoized(() => GlobalKey<ScaffoldState>());
    final _formKey = useMemoized(() => GlobalKey<FormState>());

    final subject = useState(SUBJECTS[0]);
    final email = useState("");
    final message = useState("");
    final isLoading = useState(false);

    Future<void> _saveForm() async {
      final isValid = _formKey.currentState!.validate();
      if (!isValid) return;
      _formKey.currentState!.save();

      isLoading.value = true;

      final deviceInfoPlugin = DeviceInfoPlugin();
      final deviceInfo = await deviceInfoPlugin.deviceInfo;

      final calendars = await ref.read(userCalendarProvider.future);

      try {
        await ref
            .read(apiClientProvider)
            .contactApi()
            .sendMessage(
              sendMessageDto: SendMessageDto((dto) {
                dto
                  ..email = email.value
                  ..message = message.value
                  ..deviceInfo = formatDeviceInfo(deviceInfo)
                  ..calendarIds.replace(
                    calendars.map((e) => e.id).toBuiltList(),
                  );

                if (args.fromFailedIcalImport) {
                  dto
                    ..calendarUrl = ref.read(icalUrlProvider)
                    ..gradeName = ref.read(addGradeNameProvider)
                    ..schoolName = ref.read(addSchoolNameProvider)
                    ..schoolId = ref.read(assistantProvider).school?.id;
                }
              }),
            );

        subject.value = SUBJECTS[0];
        email.value = "";
        message.value = "";
        _formKey.currentState!.reset();

        showDialog(
          context: context,
          builder: (BuildContext context) {
            // return object of type Dialog
            return AlertDialog(
              title: Text("Message envoyé"),
              content: Text("Merci pour votre message !"),
              actions: <Widget>[
                TextButton(
                  child: Text("Fermer"),
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                ),
              ],
            );
          },
        );
      } on Exception {
        showSnackBar(
          context,
          SnackBar(content: Text('Une erreur est survenue.')),
        );
      } finally {
        isLoading.value = false;
      }
    }

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(title: Text('Vos suggestions')),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(15.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Text(
                  'Merci d\'utiliser TimeCalendar ! Si vous constatez des bugs, ou que vous avez une suggestion, vous pouvez nous contacter ici.',
                ),
                SizedBox(height: 20),
                Text(
                  'Vous souhaitez',
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
                DropdownButton<String>(
                  isExpanded: true,
                  value: subject.value,
                  onChanged: (String? newValue) {
                    if (newValue != null) subject.value = newValue;
                  },
                  items: SUBJECTS.map<DropdownMenuItem<String>>((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    );
                  }).toList(),
                ),
                TextFormField(
                  decoration: InputDecoration(labelText: 'Adresse e-mail'),
                  validator: (value) {
                    if (value!.isEmpty) {
                      return 'Vous devez entrer votre adresse e-mail.';
                    }
                    Pattern pattern =
                        r'^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$';
                    RegExp regex = RegExp(pattern as String);
                    if (!regex.hasMatch(value)) {
                      return 'Votre adresse e-mail est invalide.';
                    }
                    return null;
                  },
                  onSaved: (value) {
                    if (value != null) email.value = value;
                  },
                  textInputAction: TextInputAction.next,
                  keyboardType: TextInputType.emailAddress,
                  onFieldSubmitted: (_) {
                    FocusScope.of(context).requestFocus(_messageFocusNode);
                  },
                ),
                TextFormField(
                  minLines: 3,
                  maxLines: 6,
                  keyboardType: TextInputType.multiline,
                  decoration: InputDecoration(
                    labelText: 'Entrez votre message',
                  ),
                  focusNode: _messageFocusNode,
                  validator: (value) {
                    if (value!.isEmpty) {
                      return 'Vous devez entrer votre message.';
                    }
                    return null;
                  },
                  onSaved: (value) {
                    if (value != null) message.value = value;
                  },
                ),
                SizedBox(height: 15),
                CustomButton(
                  text: 'Envoyer',
                  onPressed: _saveForm,
                  loading: isLoading.value,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
