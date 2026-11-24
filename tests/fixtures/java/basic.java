package com.example.basic;

import java.util.List;

public class BasicDemo {
    public enum Color {
        RED, GREEN, BLUE
    }

    public static class Point {
        public int x;
        public int y;
    }

    public static int helper(int delta) {
        return delta * 2;
    }

    public int calculate(Point pt) {
        int res = helper(pt.x + pt.y);
        if (res > 50) {
            return 50;
        }
        return res;
    }

    public int add(int a, int b) {
        return a + b;
    }

    public double add(double a, double b) {
        return a + b;
    }
}
