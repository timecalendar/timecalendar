import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/add_grade/providers/add_grade_provider.dart';
import 'package:timecalendar/modules/assistant/models/assistant_step.dart';
import 'package:timecalendar/modules/assistant/providers/assistant_provider.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';

class AddGradeScreen extends HookConsumerWidget {
  static const routeName = '/add-grade';

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
      print(name.value);
      ref.read(addGradeNameProvider.notifier).state = name.value;
      provider.navigateToNextStep(context, AssistantStepEnum.ADD_GRADE);
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
                        "Importer votre calendrier",
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
                              'Pour importer votre emploi du temps, entrez le nom de votre formation.',
                            ),
                            SizedBox(height: 15),
                            TextFormField(
                              decoration: InputDecoration(
                                labelText: 'Nom de votre formation',
                              ),
                              validator: (value) {
                                return (value!.isEmpty)
                                    ? 'Vous devez entrer le nom de votre formation.'
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
