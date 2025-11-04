
<?php
/**
 * Main template file for React Affiliate Theme
 * This loads the React application built by Vite
 */

get_header(); ?>

<div id="root"></div>

<?php
// Load the built React app assets
$asset_manifest = get_template_directory() . '/dist/.vite/manifest.json';

if (file_exists($asset_manifest)) {
    $manifest = json_decode(file_get_contents($asset_manifest), true);
    
    // Load main JS file
    if (isset($manifest['src/main.tsx'])) {
        $js_file = $manifest['src/main.tsx']['file'];
        $js_path = get_template_directory() . '/dist/' . $js_file;
        $js_version = file_exists($js_path) ? filemtime($js_path) : time();
        
        wp_enqueue_script(
            'react-app-js',
            get_template_directory_uri() . '/dist/' . $js_file,
            array(),
            $js_version,
            true
        );
    }
    
    // Load main CSS file
    if (isset($manifest['src/main.tsx']['css'])) {
        foreach ($manifest['src/main.tsx']['css'] as $css_file) {
            $css_path = get_template_directory() . '/dist/' . $css_file;
            $css_version = file_exists($css_path) ? filemtime($css_path) : time();
            
            wp_enqueue_style(
                'react-app-css',
                get_template_directory_uri() . '/dist/' . $css_file,
                array(),
                $css_version
            );
        }
    }
} else {
    // Fallback for development
    echo '<script type="module" src="' . get_template_directory_uri() . '/src/main.tsx"></script>';
}

get_footer();
?>
