package expo.modules.composesemantics

import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.ModifierRegistry

private const val MODIFIER_TYPE = "timecalendarSemantics"

class ComposeSemanticsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ComposeSemantics")

    OnCreate {
      ModifierRegistry.register(MODIFIER_TYPE) { config, _, _, _ ->
        val description = config["contentDescription"] as? String
        val isButton = config["role"] == "button"
        Modifier.clearAndSetSemantics {
          description?.let { contentDescription = it }
          if (isButton) role = Role.Button
        }
      }
    }

    OnDestroy {
      ModifierRegistry.unregister(MODIFIER_TYPE)
    }
  }
}
