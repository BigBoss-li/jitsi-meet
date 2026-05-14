/**
 * WebView Props for React Native.
 */
export interface IWebViewProps {

    allowFileAccess?: boolean;

    allowUniversalAccessFromFileURLs?: boolean;
    allowsInlineMediaPlayback?: boolean;

    // Android specific props
    androidLayerType?: 'none' | 'software' | 'hardware';
    applicationNameForUserAgent?: string;
    automaticallyAdjustContentInsets?: boolean;
    bounces?: boolean;
    cacheEnabled?: boolean;

    // Content props
    contentInset?: { bottom: number; left: number; right: number; top: number; };
    dataDetectorTypes?: string[];
    domStorageEnabled?: boolean;
    geolocationEnabled?: boolean;

    hideKeyboardAccessoryView?: boolean;
    javaScriptEnabled?: boolean;
    mediaPlaybackRequiresUserAction?: boolean;

    mixedContentMode?: 'never' | 'always' | 'compatibility';
    onError?: (event: { nativeEvent: { code: number; description: string; }; }) => void;

    onLoad?: (event: { nativeEvent: { url: string; }; }) => void;

    onLoadEnd?: (event: { nativeEvent: { url: string; }; }) => void;

    // Callbacks
    onLoadStart?: (event: { nativeEvent: { url: string; }; }) => void;
    onMessage?: (event: IWebViewMessageEvent) => void;
    onNavigationStateChange?: (event: {
        nativeEvent: {
            canGoBack: boolean;
            canGoForward: boolean;
            loading: boolean;
            title: string;
            url: string;
        };
    }) => void;
    scalesPageToFit?: boolean;

    scrollEnabled?: boolean;

    showsHorizontalScrollIndicator?: boolean;

    showsVerticalScrollIndicator?: boolean;

    // Source
    source?: {
        body?: string;
        headers?: Record<string, string>;
        html?: string;
        method?: 'GET' | 'POST';
        uri?: string;
    };

    // Basic props
    style?: object;

    // iOS specific props
    useWebKit?: boolean;

    // Auth props
    userAgent?: string;
}

export interface INativeWebViewProps extends IWebViewProps {

    // Native component requires these props
    testID?: string;
}

export interface IWebViewMessageEvent {
    nativeEvent: {
        data: string;
    };
}
