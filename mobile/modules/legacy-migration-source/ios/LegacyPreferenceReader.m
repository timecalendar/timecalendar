#import "LegacyPreferenceReader.h"

@implementation LegacyPreferenceReader
+ (NSDictionary<NSString *, id> *)readKey:(NSString *)key {
  // Swift cannot catch NSException; isolate each platform read at this boundary.
  @try {
    id object = [[NSUserDefaults standardUserDefaults] objectForKey:key];
    return object ? @{ @"object": object } : @{};
  } @catch (NSException *exception) {
    return @{ @"state": @"read_failed" };
  }
}
@end
