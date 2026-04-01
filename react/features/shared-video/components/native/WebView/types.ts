/**
 * WebView Props for React Native
 */
export interface WebViewProps {
    // Source
    source?: {
        uri?: string;
        html?: string;
        method?: 'GET' | 'POST';
        headers?: Record<string, string>;
        body?: string;
    };

    // Basic props
    style?: object;
    javaScriptEnabled?: boolean;
    domStorageEnabled?: boolean;
    geolocationEnabled?: boolean;
    allowsInlineMediaPlayback?: boolean;
    mediaPlaybackRequiresUserAction?: boolean;
    scalesPageToFit?: boolean;
    bounces?: boolean;
    scrollEnabled?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;

    // Content props
    contentInset?: { top: number; bottom: number; left: number; right: number };
    automaticallyAdjustContentInsets?: boolean;
    dataDetectorTypes?: string[];

    // Auth props
    userAgent?: string;
    applicationNameForUserAgent?: string;

    // Callbacks
    onLoadStart?: (event: { nativeEvent: { url: string } }) => void;
    onLoad?: (event: { nativeEvent: { url: string } }) => void;
    onLoadEnd?: (event: { nativeEvent: { url: string } }) => void;
    onError?: (event: { nativeEvent: { code: number; description: string } }) => void;
    onMessage?: (event: WebViewMessageEvent) => void;
    onNavigationStateChange?: (event: {
        nativeEvent: {
            url: string;
            title: string;
            loading: boolean;
            canGoBack: boolean;
            canGoForward: boolean;
        };
    }) => void;

    // iOS specific props
    useWebKit?: boolean;
    hideKeyboardAccessoryView?: boolean;
    allowFileAccess?: boolean;
    allowUniversalAccessFromFileURLs?: boolean;

    // Android specific props
    androidLayerType?: 'none' | 'software' | 'hardware';
    cacheEnabled?: boolean;
    mixedContentMode?: 'never' | 'always' | 'compatibility';
}

export interface NativeWebViewProps extends WebViewProps {
    // Native component requires these props
    testID?: string;
}

export interface WebViewMessageEvent {
    nativeEvent: {
        data: string;
    };
}
