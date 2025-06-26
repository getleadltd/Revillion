
<?php
/**
 * React Affiliate Theme functions
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Theme setup
 */
function react_affiliate_theme_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    
    // Remove admin bar for cleaner React app display
    add_filter('show_admin_bar', '__return_false');
}
add_action('after_setup_theme', 'react_affiliate_theme_setup');

/**
 * Enqueue scripts and styles
 */
function react_affiliate_theme_scripts() {
    // Remove default WordPress styles that might conflict
    wp_dequeue_style('wp-block-library');
    wp_dequeue_style('wp-block-library-theme');
    wp_dequeue_style('classic-theme-styles');
    
    // Ensure React app has clean HTML
    remove_action('wp_head', 'wp_generator');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'rsd_link');
}
add_action('wp_enqueue_scripts', 'react_affiliate_theme_scripts');

/**
 * Clean up WordPress head
 */
function react_affiliate_clean_head() {
    remove_action('wp_head', 'wp_generator');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'rsd_link');
    remove_action('wp_head', 'wp_shortlink_wp_head');
}
add_action('init', 'react_affiliate_clean_head');

/**
 * Disable WordPress admin bar
 */
add_filter('show_admin_bar', '__return_false');

/**
 * Add CORS headers for API requests
 */
function react_affiliate_cors_headers() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
add_action('init', 'react_affiliate_cors_headers');
?>
