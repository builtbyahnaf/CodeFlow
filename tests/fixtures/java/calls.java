package com.example.calls;

import java.io.IOException;

public class CallDemo {
    public static void run() {
        try {
            render();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        } finally {
            cleanup();
        }
    }

    public static void render() {
        // Render
    }

    public static void cleanup() {
        // Cleanup
    }
}
