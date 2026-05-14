import React, { useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden'
    },
    webView: {
        flex: 1
    }
});

export interface IWebViewRef {
    goBack: () => void;
    goForward: () => void;
    injectJavaScript: (script: string) => void;
    postMessage: (message: string) => void;
    reload: () => void;
    stopLoading: () => void;
}

interface IWebViewProps {
    domStorageEnabled?: boolean;
    javaScriptEnabled?: boolean;
    onMessage?: (event: any) => void;
    source: {
        html: string;
    };
    style?: object;
}

const WebView = React.forwardRef<IWebViewRef, IWebViewProps>(
    ({ style, source, javaScriptEnabled = true, domStorageEnabled = true, onMessage }, ref) => {
        const webViewRef = useRef<RNWebView>(null);
        const [ key, setKey ] = useState(0);

        useImperativeHandle(
            ref,
            () => {
                return {
                    goBack: () => {
                        webViewRef.current?.goBack?.();
                    },
                    goForward: () => {
                        webViewRef.current?.goForward?.();
                    },
                    reload: () => {
                        setKey(prev => prev + 1);
                        webViewRef.current?.reload?.();
                    },
                    stopLoading: () => {
                        webViewRef.current?.stopLoading?.();
                    },
                    postMessage: (message: string) => {
                        webViewRef.current?.postMessage?.(message);
                    },
                    injectJavaScript: (script: string) => {
                        webViewRef.current?.injectJavaScript?.(script);
                    }
                };
            },
            []
        );

        return (
            <View style = { [ styles.container, style ] }>
                <RNWebView
                    domStorageEnabled = { domStorageEnabled }
                    javaScriptEnabled = { javaScriptEnabled }
                    key = { key }
                    onMessage = { onMessage }
                    ref = { webViewRef }
                    source = { source as any }
                    style = { styles.webView } />
            </View>
        );
    }
);

export default WebView;
