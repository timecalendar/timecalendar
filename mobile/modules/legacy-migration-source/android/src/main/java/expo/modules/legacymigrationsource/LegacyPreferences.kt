package expo.modules.legacymigrationsource

import java.io.File
import java.io.FilterInputStream
import java.io.InputStream
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory

internal object LegacyPreferences {
  val keys = listOf("current_version", "theme", "dark_mode", "notification_calendar", "startup_screen", "show_weekends")
  const val MAX_PREFERENCE_BYTES = 1024 * 1024
  private const val MAX_STRING_BYTES = 256 * 1024
  private const val MAX_SAFE_INTEGER = 9007199254740991L

  fun read(file: File, key: String): Map<String, Any> = try {
    require(key in keys)
    if (!file.exists()) {
      state("absent")
    } else if (!file.isFile || file.canonicalFile != File(file.parentFile.canonicalFile, file.name) || file.length() > MAX_PREFERENCE_BYTES) {
      state("read_failed")
    } else {
      file.inputStream().buffered().use { readXml(BoundedInput(it), key) }
    }
  } catch (_: Exception) {
    state("read_failed")
  }

  // SharedPreferencesImpl may restore a .bak by renaming/deleting files on read.
  // Reading its XML directly keeps discovery strictly read-only, including recovery.
  fun readXml(input: InputStream, key: String): Map<String, Any> {
    val parser = XmlPullParserFactory.newInstance().newPullParser()
    parser.setInput(input, "UTF-8")
    var result = state("absent")
    var rootSeen = false
    var event = parser.eventType
    while (event != XmlPullParser.END_DOCUMENT) {
      require(event != XmlPullParser.DOCDECL)
      if (event == XmlPullParser.START_TAG) {
        if (parser.depth == 1) {
          require(!rootSeen && parser.name == "map")
          rootSeen = true
        } else if (parser.depth == 2 && parser.getAttributeValue(null, "name") == "flutter.$key") {
          val tag = parser.name
          val attribute = parser.getAttributeValue(null, "value")
          val text = StringBuilder()
          var nested = false
          while (true) {
            val child = parser.nextToken()
            require(child != XmlPullParser.END_DOCUMENT && child != XmlPullParser.DOCDECL)
            if (child == XmlPullParser.END_TAG && parser.depth == 2) break
            if (child == XmlPullParser.START_TAG) nested = true
            if (child == XmlPullParser.TEXT || child == XmlPullParser.CDSECT || child == XmlPullParser.ENTITY_REF) {
              text.append(parser.text ?: "")
              require(text.length <= MAX_PREFERENCE_BYTES)
            }
          }
          result = if (nested) state("invalid_type") else classify(key, tag, attribute, text.toString())
        }
      }
      event = parser.nextToken()
    }
    require(rootSeen)
    return result
  }

  private fun classify(key: String, tag: String, attribute: String?, text: String): Map<String, Any> {
    val value: Any? = when (key) {
      "current_version" -> if (tag == "long") attribute?.toLongOrNull()?.takeIf { it in -MAX_SAFE_INTEGER..MAX_SAFE_INTEGER } else null
      "theme", "startup_screen" -> if (tag == "string" && text.toByteArray(Charsets.UTF_8).size <= MAX_STRING_BYTES) text else null
      else -> if (tag == "boolean") when (attribute) { "true" -> true; "false" -> false; else -> null } else null
    }
    return if (value == null) state("invalid_type") else mapOf("state" to "value", "value" to value)
  }

  private fun state(value: String): Map<String, Any> = mapOf("state" to value)

  private class BoundedInput(input: InputStream) : FilterInputStream(input) {
    private var count = 0
    override fun read(): Int = super.read().also { if (it >= 0) check(++count <= MAX_PREFERENCE_BYTES) }
    override fun read(buffer: ByteArray, offset: Int, length: Int): Int = `in`.read(buffer, offset, minOf(length, MAX_PREFERENCE_BYTES - count + 1)).also {
      if (it > 0) { count += it; check(count <= MAX_PREFERENCE_BYTES) }
    }
  }
}
