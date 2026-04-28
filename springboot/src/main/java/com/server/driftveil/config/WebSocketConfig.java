package com.server.driftveil.config;

import com.server.driftveil.websocket.FeedWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final FeedWebSocketHandler feedWebSocketHandler;

    public WebSocketConfig(FeedWebSocketHandler feedWebSocketHandler) {
        this.feedWebSocketHandler = feedWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Matches the Python /ws/feed/{machine_id} path pattern
        // React connects to: ws://localhost:8080/ws/feed/MCH-01
        registry.addHandler(feedWebSocketHandler, "/ws/feed/*")
                .setAllowedOrigins("*");
    }
}
