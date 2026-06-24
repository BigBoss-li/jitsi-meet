/**
 * The maximum size, in bytes, that a serialised custom XMPP payload may occupy
 * on the wire. Payloads above this size are rejected by the middleware before
 * they are sent. The cap is intentionally generous (16 KiB) but small enough
 * to keep individual private messages cheap.
 */
export const MAX_CUSTOM_XMPP_PAYLOAD_BYTES = 16 * 1024;

/**
 * The result of validating a custom XMPP payload.
 *
 * On success, the caller receives the JSON-serialised form which is safe to
 * forward to {@code conference.sendPrivateTextMessage}. On failure, the
 * caller receives a stable string reason that the middleware can log.
 */
export type ValidationResult = {
    ok: true;
    serialised: string;
} | {
    ok: false;
    reason: 'invalidPayload' | 'payloadTooLarge';
};

/**
 * Validates a host-supplied custom XMPP payload and, on success, returns the
 * JSON-serialised form that should be sent to the target participant.
 *
 * A payload is considered valid when:
 *  - it is a non-null, non-array, plain object;
 *  - it carries a non-empty string {@code action} field (per spec FR-005);
 *  - it can be JSON-serialised (catches BigInt, circular refs, etc.);
 *  - the serialised form is no larger than {@link MAX_CUSTOM_XMPP_PAYLOAD_BYTES}.
 *
 * @param {unknown} payload - The payload supplied by the host page.
 * @returns {ValidationResult} The result of the validation.
 */
export function validateCustomXmppPayload(payload: unknown): ValidationResult {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        return {
            ok: false,
            reason: 'invalidPayload'
        };
    }

    const cast = payload as {
        action?: unknown;
    };
    const action = cast.action;

    if (typeof action !== 'string' || action.length === 0) {
        return {
            ok: false,
            reason: 'invalidPayload'
        };
    }

    let serialised: string;

    try {
        serialised = JSON.stringify(payload);
    } catch {
        return {
            ok: false,
            reason: 'invalidPayload'
        };
    }

    if (serialised.length > MAX_CUSTOM_XMPP_PAYLOAD_BYTES) {
        return {
            ok: false,
            reason: 'payloadTooLarge'
        };
    }

    return {
        ok: true,
        serialised
    };
}

/**
 * Attempts to decode a custom XMPP message body into a plain object. The
 * function never throws; any failure (invalid JSON, non-object, array) yields
 * {@code undefined} so the caller can log and move on.
 *
 * @param {string} body - The raw body of the received private message.
 * @returns {Record<string, unknown> | undefined} The decoded object, or
 * {@code undefined} when the body is not a valid custom XMPP payload.
 */
export function tryDecodeCustomXmppMessage(body: string): Record<string, unknown> | undefined {
    try {
        const parsed = JSON.parse(body);

        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return undefined;
        }

        return parsed as Record<string, unknown>;
    } catch {
        return undefined;
    }
}
