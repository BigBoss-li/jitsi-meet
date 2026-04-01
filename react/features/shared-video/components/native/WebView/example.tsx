import React, { useRef } from 'react';
import { Button, SafeAreaView, View } from 'react-native';

import { WebView } from './index';
import type { WebViewRef } from './WebView';

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
    webViewRef.current?.injectJavaScript("document.body.style.backgroundColor = 'red';");
  };

  const handlePostMessage = () => {
    webViewRef.current?.postMessage('Hello from React Native!');
  };

  const handleOnMessage = (event: { nativeEvent: { data: string } }) => {
    console.log('Received message from WebView:', event.nativeEvent.data);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://reactnative.dev' }}
          onMessage={handleOnMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 10 }}>
        <Button title="Go Back" onPress={handleGoBack} />
        <Button title="Go Forward" onPress={handleGoForward} />
        <Button title="Reload" onPress={handleReload} />
        <Button title="Inject JS" onPress={handleInjectScript} />
        <Button title="Post Message" onPress={handlePostMessage} />
      </View>
    </SafeAreaView>
  );
};

export default WebViewExample;
