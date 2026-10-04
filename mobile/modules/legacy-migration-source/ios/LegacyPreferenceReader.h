#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
@interface LegacyPreferenceReader : NSObject
+ (NSDictionary<NSString *, id> *)readKey:(NSString *)key NS_SWIFT_NAME(read(key:));
@end
NS_ASSUME_NONNULL_END
