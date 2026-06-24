/*
 * Copyright @ 2018-present 8x8, Inc.
 * Copyright @ 2017-2018 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "JitsiMeetConferenceOptions.h"
#import "JitsiMeetViewDelegate.h"

@interface JitsiMeetView : UIView

@property (nonatomic, nullable, weak) id<JitsiMeetViewDelegate> delegate;

/**
 * Joins the conference specified by the given options. The given options will
 * be merged with the defaultConferenceOptions (if set) in JitsiMeet. If there
 * is an already active conference it will be automatically left prior to
 * joining the new one.
 */
- (void)join:(JitsiMeetConferenceOptions *_Nullable)options;
/**
 * Leaves the currently active conference.
 */
- (void)leave;
- (void)hangUp;
- (void)setAudioMuted:(BOOL)muted;
- (void)sendEndpointTextMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to;
- (void)toggleScreenShare:(BOOL)enabled;
- (void)retrieveParticipantsInfo:(void (^ _Nonnull)(NSArray * _Nullable))completionHandler;
- (void)openChat:(NSString * _Nullable)to;
- (void)closeChat;
- (void)sendChatMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to;
- (void)setVideoMuted:(BOOL)muted;
- (void)setClosedCaptionsEnabled:(BOOL)enabled;
- (void)toggleCamera;

/**
 * Sends a custom XMPP command to a remote participant. The native side
 * dispatches an `SEND_CUSTOM_XMPP_COMMAND` event to the JavaScript engine
 * where it is validated and forwarded via the conference's private message
 * channel.
 *
 * @param action - An optional opaque verb describing the command. Currently
 * only the dispatch is performed; the JavaScript side uses this for logging
 * and routing.
 * @param target - The id of the recipient participant. Must be non-nil for
 * delivery; an empty string is forwarded to JS unchanged.
 * @param payload - An arbitrary JSON-serialisable dictionary that becomes the
 * XMPP private message body. nil is replaced with an empty dictionary to
 * avoid NSNull crashes.
 */
- (void)sendCustomXmppCommand:(NSString * _Nullable)action
                      target:(NSString * _Nullable)target
                     payload:(NSDictionary * _Nullable)payload;

@end
