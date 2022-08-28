import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/add_school/providers/add_school_provider.dart';
import 'package:timecalendar/modules/assistant/models/assistant_step.dart';
import 'package:timecalendar/modules/assistant/providers/assistant_provider.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';

class AddSchoolScreen extends HookConsumerWidget {
  static const routeName = '/add-school';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(assistantProvider.notifier);
    final formKey = useMemoized(() => GlobalKey<FormState>());
    final name = useState("");

    final mediaQuery = MediaQuery.of(context);
    final availableWidth = mediaQuery.size.width - 200;

    Future<void> _saveForm() async {
      final isValid = formKey.currentState!.validate();
      if (!isValid) return;
      formKey.currentState!.save();
      ref.read(addSchoolNameProvider.notifier).state = name.value;
      provider.navigateToNextStep(context, AssistantStepEnum.ADD_SCHOOL);
    }

    return Scaffold(
      body: Column(
        children: <Widget>[
          Expanded(
            child: CustomScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              slivers: <Widget>[
                SliverAppBar(
                  pinned: true,
                  flexibleSpace: FlexibleSpaceBar(
                    title: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: availableWidth,
                      ),
                      child: Text(
                        "Ajouter un établissement",
                        style: TextStyle(fontSize: 18),
                      ),
                    ),
                  ),
                  expandedHeight: 200.0,
                ),
                SliverList(
                  delegate: SliverChildListDelegate([
                    Padding(
                      padding: const EdgeInsets.all(15.0),
                      child: Form(
                        key: formKey,
                        child: Column(
                          children: <Widget>[
                            Text(
                              'Pour importer votre emploi du temps, entrez le nom de votre établissement.',
                            ),
                            SizedBox(height: 15),
                            TextFormField(
                              decoration: InputDecoration(
                                labelText: 'Nom de votre établissement',
                              ),
                              validator: (value) {
                                return (value!.isEmpty)
                                    ? 'Vous devez entrer le nom de votre établissement.'
                                    : null;
                              },
                              onSaved: (value) => name.value = value ?? '',
                              textInputAction: TextInputAction.next,
                              onFieldSubmitted: (_) {
                                _saveForm();
                              },
                            ),
                          ],
                        ),
                      ),
                    )
                  ]),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(15.0),
            child: Row(
              children: <Widget>[
                CustomButton(
                  text: 'Retour',
                  outline: true,
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                ),
                Expanded(
                  child: Container(),
                ),
                CustomButton(
                  text: 'Suivant',
                  onPressed: () => _saveForm(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
