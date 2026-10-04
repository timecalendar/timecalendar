package expo.modules.legacymigrationsource

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class LegacyPreferencesTest {
  private fun read(xml: String, key: String): Map<String, Any> = LegacyPreferences.readXml(xml.byteInputStream(), key)

  @Test fun exactTypesAndIndependentSiblings() {
    val xml = """<map>
      <long name="flutter.current_version" value="134" />
      <string name="flutter.theme">dark</string>
      <boolean name="flutter.dark_mode" value="false" />
      <string name="flutter.notification_calendar">true</string>
      <string name="flutter.startup_screen">calendar</string>
      <boolean name="flutter.show_weekends" value="true" />
      <string name="flutter.ignored_secret">not-returned</string>
    </map>"""
    assertEquals(134L, read(xml, "current_version")["value"])
    assertEquals("dark", read(xml, "theme")["value"])
    assertEquals(false, read(xml, "dark_mode")["value"])
    assertEquals("invalid_type", read(xml, "notification_calendar")["state"])
    assertEquals("calendar", read(xml, "startup_screen")["value"])
    assertEquals(true, read(xml, "show_weekends")["value"])
    assertEquals("absent", read("<map />", "theme")["state"])
    assertEquals(6, LegacyPreferences.keys.size)
  }

  @Test fun rejectsCoercionAndUnsafeIntegers() {
    for (tag in listOf("int", "float", "boolean", "string", "set")) {
      assertEquals("invalid_type", read("""<map><$tag name="flutter.current_version" value="134" /></map>""", "current_version")["state"])
    }
    assertEquals("invalid_type", read("""<map><long name="flutter.current_version" value="9007199254740992" /></map>""", "current_version")["state"])
    assertEquals("invalid_type", read("""<map><boolean name="flutter.dark_mode" value="1" /></map>""", "dark_mode")["state"])
  }

  @Test fun stringDecodingAndDuplicateKeysMatchNativeMap() {
    assertEquals("é & 🌍", read("""<map><string name="flutter.theme">first</string><string name="flutter.theme">é &amp; 🌍</string></map>""", "theme")["value"])
    assertEquals("invalid_type", read("""<map><string name="flutter.theme"><string>nested</string></string></map>""", "theme")["state"])
  }

  @Test fun boundedFailuresDoNotRewriteSourceOrCreateAbsentFiles() {
    val dir = java.nio.file.Files.createTempDirectory("legacy-prefs-test").toFile()
    try {
      val file = File(dir, "FlutterSharedPreferences.xml")
      assertEquals("absent", LegacyPreferences.read(file, "theme")["state"])
      assertFalse(file.exists())
      for (xml in listOf("<map><string", "<!DOCTYPE map [<!ENTITY secret SYSTEM 'file:///etc/passwd'>]><map />", "x".repeat(LegacyPreferences.MAX_PREFERENCE_BYTES + 1))) {
        file.writeText(xml)
        assertEquals("read_failed", LegacyPreferences.read(file, "theme")["state"])
        assertEquals(xml, file.readText())
      }
      file.writeText("<map><string name=\"flutter.theme\">" + "a".repeat(256 * 1024 + 1) + "</string></map>")
      assertEquals("invalid_type", LegacyPreferences.read(file, "theme")["state"])
    } finally { dir.deleteRecursively() }
  }

  @Test fun acceptsTrustedAncestorAliasButRejectsPreferenceFileSymlink() {
    val dir = java.nio.file.Files.createTempDirectory("legacy-prefs-symlink").toFile()
    try {
      val original = File(dir, "original").apply { mkdir() }
      val alias = File(dir, "alias")
      java.nio.file.Files.createSymbolicLink(alias.toPath(), original.toPath())
      val file = File(original, "FlutterSharedPreferences.xml")
      file.writeText("""<map><boolean name="flutter.show_weekends" value="false" /></map>""")
      assertEquals(false, LegacyPreferences.read(File(alias, file.name), "show_weekends")["value"])
      val other = File(dir, "other.xml")
      file.renameTo(other)
      java.nio.file.Files.createSymbolicLink(file.toPath(), other.toPath())
      assertEquals("read_failed", LegacyPreferences.read(file, "show_weekends")["state"])
    } finally { dir.deleteRecursively() }
  }
}
