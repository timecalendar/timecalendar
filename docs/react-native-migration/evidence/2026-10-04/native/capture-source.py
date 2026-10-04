#!/usr/bin/env python3
"""Capture counts/checksums from this task's synthetic fixture, never raw records."""
import argparse
import hashlib
import json
from pathlib import Path
import plistlib
import subprocess
import xml.etree.ElementTree as ET

APP_ID = 'fr.samuelprak.timecalendar'
KEYS = ('current_version', 'theme', 'dark_mode', 'notification_calendar', 'startup_screen', 'show_weekends')


def command(*args):
    return subprocess.check_output(args)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def validate_marker(marker):
    if marker.get('fixture') not in ('SEED-A', 'SEED-B') or marker.get('source') != 'Flutter models + Sembast + shared_preferences':
        raise ValueError('NOT_THIS_TASKS_SYNTHETIC_FIXTURE')


def capture(platform, device):
    if platform == 'ios':
        container = Path(command('xcrun', 'simctl', 'get_app_container', device, APP_ID, 'data').decode().strip())
        marker = json.loads((container / 'Documents/migration-fixture.json').read_text())
        validate_marker(marker)
        raw = (container / 'Documents/simple_database.db').read_bytes()
        values = plistlib.loads((container / f'Library/Preferences/{APP_ID}.plist').read_bytes())
        preferences = {key: values['flutter.' + key] for key in KEYS}
        logical_path = 'Documents/simple_database.db'
    else:
        def read(relative):
            return command('adb', '-s', device, 'exec-out', 'run-as', APP_ID, 'cat', relative)
        marker = json.loads(read('app_flutter/migration-fixture.json'))
        validate_marker(marker)
        raw = read('app_flutter/simple_database.db')
        preferences = {}
        for element in ET.fromstring(read('shared_prefs/FlutterSharedPreferences.xml')):
            name = element.attrib.get('name', '')
            if not name.startswith('flutter.') or name[8:] not in KEYS:
                continue
            if element.tag == 'boolean':
                value = {'true': True, 'false': False}[element.attrib['value']]
            elif element.tag == 'long':
                value = int(element.attrib['value'])
            elif element.tag == 'string':
                value = element.text or ''
            else:
                raise ValueError('UNEXPECTED_NATIVE_TYPE')
            preferences[name[8:]] = value
        logical_path = 'app_flutter/simple_database.db'
    expected = {'current_version': 1, 'theme': 'dark', 'dark_mode': False, 'notification_calendar': False, 'startup_screen': 'calendar', 'show_weekends': False}
    match = all(type(preferences.get(k)) is type(v) and preferences.get(k) == v for k, v in expected.items())
    lines = raw.splitlines()
    return {
        'platform': platform, 'identity': APP_ID, 'fixture': marker,
        'database': {'logicalPath': logical_path, 'bytes': len(raw), 'lines': len(lines), 'sha256': digest(raw), 'metadata': json.loads(lines[0])},
        'preferences': {'allowlistedCount': len(preferences), 'types': {k: type(v).__name__ for k, v in preferences.items()}, 'syntheticValuesMatch': match, 'allowlistSha256': digest(json.dumps(preferences, sort_keys=True).encode())},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('platform', choices=('ios', 'android'))
    parser.add_argument('device')
    parser.add_argument('output', type=Path)
    parser.add_argument('--before', type=Path)
    args = parser.parse_args()
    result = capture(args.platform, args.device)
    if args.before:
        before = json.loads(args.before.read_text())
        result['retention'] = {
            'databaseBytesUnchanged': before['database']['sha256'] == result['database']['sha256'],
            'allowlistedPreferencesUnchanged': before['preferences']['allowlistSha256'] == result['preferences']['allowlistSha256'],
        }
        if not all(result['retention'].values()):
            raise ValueError('SOURCE_RETENTION_MISMATCH')
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'fixture': result['fixture']['fixture'], 'bytes': result['database']['bytes'], 'preferencesMatch': result['preferences']['syntheticValuesMatch'], 'retention': result.get('retention')}))


if __name__ == '__main__':
    main()
