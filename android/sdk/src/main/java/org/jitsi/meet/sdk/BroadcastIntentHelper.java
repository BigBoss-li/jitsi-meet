package org.jitsi.meet.sdk;

import android.content.Intent;

public class BroadcastIntentHelper {
    public static Intent buildSetAudioMutedIntent(boolean muted) {
        Intent intent = new Intent(BroadcastAction.Type.SET_AUDIO_MUTED.getAction());
        intent.putExtra("muted", muted);
        return intent;
    }

    public static Intent buildHangUpIntent() {
        return new Intent(BroadcastAction.Type.HANG_UP.getAction());
    }

    public static Intent buildSendEndpointTextMessageIntent(String to, String message) {
        Intent intent = new Intent(BroadcastAction.Type.SEND_ENDPOINT_TEXT_MESSAGE.getAction());
        intent.putExtra("to", to);
        intent.putExtra("message", message);
        return intent;
    }

    public static Intent buildToggleScreenShareIntent(boolean enabled) {
        Intent intent = new Intent(BroadcastAction.Type.TOGGLE_SCREEN_SHARE.getAction());
        intent.putExtra("enabled", enabled);
        return intent;
    }

    public static Intent buildOpenChatIntent(String participantId) {
        Intent intent = new Intent(BroadcastAction.Type.OPEN_CHAT.getAction());
        intent.putExtra("to", participantId);
        return intent;
    }

    public static Intent buildCloseChatIntent() {
        return new Intent(BroadcastAction.Type.CLOSE_CHAT.getAction());
    }

    public static Intent buildSendChatMessageIntent(String participantId, String message) {
        Intent intent = new Intent(BroadcastAction.Type.SEND_CHAT_MESSAGE.getAction());
        intent.putExtra("to", participantId);
        intent.putExtra("message", message);
        return intent;
    }

    /**
     * Builds an Intent for {@link BroadcastAction.Type#SEND_CUSTOM_XMPP_COMMAND}
     * that targets a specific participant with the supplied payload. Mirrors
     * {@link JitsiMeetView#sendCustomXmppCommand(String, String, android.os.Bundle)}
     * for hosts that prefer to dispatch the broadcast directly via the
     * {@link androidx.localbroadcastmanager.content.LocalBroadcastManager}.
     *
     * @param action - A logical action name. May be {@code null}; the SDK
     *                 defaults it to {@code SEND_CUSTOM_XMPP_COMMAND}.
     * @param targetId - The id of the recipient participant. May be
     *                   {@code null}; an empty string is sent in that case.
     * @param payload - An arbitrary payload Bundle. May be {@code null}; no
     *                  extra payload keys will be added in that case.
     * @return A populated Intent with action
     *         {@code org.jitsi.meet.SEND_CUSTOM_XMPP_COMMAND}.
     */
    public static Intent buildSendCustomXmppCommandIntent(
            String action,
            String targetId,
            android.os.Bundle payload) {
        Intent intent = new Intent(BroadcastAction.Type.SEND_CUSTOM_XMPP_COMMAND.getAction());

        if (payload != null) {
            intent.putExtras(payload);
        }
        // Reserved keys are written last so they always win any payload
        // collisions; the JS bridge relies on these to dispatch the action.
        intent.putExtra("action", action != null ? action : ExternalAPIModule.SEND_CUSTOM_XMPP_COMMAND);
        intent.putExtra("target", targetId != null ? targetId : "");

        return intent;
    }

    public static Intent buildSetMeetingSignalsIntent(String meetingSignalsJson) {
        Intent intent = new Intent(BroadcastAction.Type.MEETING_SIGNAL.getAction());
        intent.putExtra("meetingSignals", meetingSignalsJson);
        return intent;
    }

    public static Intent buildSetScreenRecordEnabledIntent(boolean isRecording) {
        Intent intent = new Intent(BroadcastAction.Type.SCREEN_RECORD.getAction());
        intent.putExtra("isRecording", isRecording);
        return intent;
    }

    public static Intent buildSetVideoMutedIntent(boolean muted) {
        Intent intent = new Intent(BroadcastAction.Type.SET_VIDEO_MUTED.getAction());
        intent.putExtra("muted", muted);
        return intent;
    }

    public static Intent buildSetClosedCaptionsEnabledIntent(boolean enabled) {
        Intent intent = new Intent(BroadcastAction.Type.SET_CLOSED_CAPTIONS_ENABLED.getAction());
        intent.putExtra("enabled", enabled);
        return intent;
    }

    public static Intent buildRetrieveParticipantsInfo(String requestId) {
        Intent intent = new Intent(BroadcastAction.Type.RETRIEVE_PARTICIPANTS_INFO.getAction());
        intent.putExtra("requestId", requestId);
        return intent;
    }

    public static Intent buildToggleCameraIntent() {
        return new Intent(BroadcastAction.Type.TOGGLE_CAMERA.getAction());
    }
}
