import React, { useCallback, useRef } from 'react';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';

import type { WebViewRef } from './WebView';

import { WebView } from './index';

const styles = StyleSheet.create({
    flexOne: {
        flex: 1
    },
    buttonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10
    }
});

const WebViewExample = () => {
    const webViewRef = useRef<WebViewRef>(null);

    const handleGoBack = useCallback(() => {
        webViewRef.current?.goBack();
    }, []);

    const handleGoForward = useCallback(() => {
        webViewRef.current?.goForward();
    }, []);

    const handleReload = useCallback(() => {
        webViewRef.current?.reload();
    }, []);

    const handleInjectScript = useCallback(() => {
        webViewRef.current?.injectJavaScript('document.body.style.backgroundColor = \'red\';');
    }, []);

    const handlePostMessage = useCallback(() => {
        webViewRef.current?.postMessage('Hello from React Native!');
    }, []);

    const handleOnMessage = useCallback((event: { nativeEvent: { data: string; }; }) => {
        console.log('Received message from WebView:', event.nativeEvent.data);
    }, []);

    return (
        <SafeAreaView style = { styles.flexOne }>
            <View style = { styles.flexOne }>
                <WebView
                    domStorageEnabled = { true }
                    javaScriptEnabled = { true }
                    onMessage = { handleOnMessage }
                    ref = { webViewRef }
                    source = {{ uri: 'https://reactnative.dev' }} />
            </View>
            <View style = { styles.buttonRow }>
                <Button
                    onPress = { handleGoBack }
                    title = 'Go Back' />
                <Button
                    onPress = { handleGoForward }
                    title = 'Go Forward' />
                <Button
                    onPress = { handleReload }
                    title = 'Reload' />
                <Button
                    onPress = { handleInjectScript }
                    title = 'Inject JS' />
                <Button
                    onPress = { handlePostMessage }
                    title = 'Post Message' />
            </View>
        </SafeAreaView>
    );
};

export default WebViewExample;
