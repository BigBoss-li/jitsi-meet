import React, { useRef } from 'react';
import { Button, SafeAreaView, View } from 'react-native';

import type { WebViewRef } from './WebView';

import { WebView } from './index';

const WebViewExample = () => {
    const webViewRef = useRef<WebViewRef>(null);

    const handleGoBack = () => {
        webViewRef.current?.goBack();
    };

    const handleGoForward = () => {
        webViewRef.current?.goForward();
    };

    const handleReload = () => {
        webViewRef.current?.reload();
    };

    const handleInjectScript = () => {
        webViewRef.current?.injectJavaScript('document.body.style.backgroundColor = \'red\';');
    };

    const handlePostMessage = () => {
        webViewRef.current?.postMessage('Hello from React Native!');
    };

    const handleOnMessage = (event: { nativeEvent: { data: string; }; }) => {
        console.log('Received message from WebView:', event.nativeEvent.data);
    };

    return (
        <SafeAreaView style = {{ flex: 1 }}>
            <View style = {{ flex: 1 }}>
                <WebView
                    domStorageEnabled = { true }
                    javaScriptEnabled = { true }
                    onMessage = { handleOnMessage }
                    ref = { webViewRef }
                    source = {{ uri: 'https://reactnative.dev' }} />
            </View>
            <View
                style = {{ flexDirection: 'row',
                    flexWrap: 'wrap',
                    padding: 10 }}>
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
