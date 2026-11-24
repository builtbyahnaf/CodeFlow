package com.example.shapes;

public class HierarchyDemo {
    public interface Drawable {
        void draw();
    }

    public static abstract class Shape implements Drawable {
        public abstract double area();
    }

    public static class Circle extends Shape {
        private double radius;

        public Circle(double radius) {
            this.radius = radius;
        }

        @Override
        public void draw() {
            // Draw circle
        }

        @Override
        public double area() {
            return 3.14159 * radius * radius;
        }
    }
}
