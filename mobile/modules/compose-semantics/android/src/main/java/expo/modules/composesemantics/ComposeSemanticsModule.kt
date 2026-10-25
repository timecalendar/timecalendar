package expo.modules.composesemantics

import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.ModifierRegistry

private const val CLEAR_AND_SET_SEMANTICS = "clearAndSetSemantics"

class ComposeSemanticsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ComposeSemantics")

    OnCreate {
      ModifierRegistry.register(CLEAR_AND_SET_SEMANTICS) { _, _, _, _ ->
        Modifier.clearAndSetSemantics {}
      }
    }

    OnDestroy {
      ModifierRegistry.unregister(CLEAR_AND_SET_SEMANTICS)
    }
  }
}
