<?php
/*
Plugin Name: Yu-Gi-Oh FM Remake
Description: A remake of the classic Yu-Gi-Oh Forbidden Memories game with modern web technologies.
Version: 0.11
Author: Felippe Lucena
*/

if (!defined('ABSPATH')) {
    exit;
}

register_activation_hook(__FILE__, 'fm_plugin_activate');

function fm_plugin_activate() {
    //require_once plugin_dir_path(__FILE__) . 'includes/install.php';
    //fm_plugin_install_tables();
}

define('YUGIOH_PLUGIN_FILE', __FILE__);
wp_enqueue_script('jquery');

function main_shortcode()
{
    ob_start();

    wp_enqueue_style('BootstrapCSS', plugins_url('externalLibs/bootstrap-5.2.3-dist/css/bootstrap.css', __FILE__), array(), '1.0.0', 'all');


?>
    <nav class="navbar navbar-expand-lg navbar-light bg-secondary text-white">
        <div class="container">
            <div class="navbar-brand text-white d-flex align-items-center">
                <a class="navbar-brand text-white" href="#/" data-route="/">Início</a>
                <a class="nav-link me-3" href="#/about" data-route="/about">Sobre</a>
                <a class="nav-link me-3" href="#/partida" data-route="/partida">Partida-MVP</a>
            </div>
            <div>
                <h2>Yu-Gi-Oh Forbidden Memories Remake</h2>
            </div>
        </div>
    </nav>
    <main id="app"></main>
    </div>

    <script type="module">
        import {RouterManager} from '/wp-content/plugins/YugiohFMRemake/js/routerManager.js';

        const router = new RouterManager();

        window.showToast = function (title, message, type = 'info') {
            // Verifica se o container já existe
            let toastContainer = document.getElementById('toasts');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toasts';
                toastContainer.className = 'toast-container position-fixed bottom-0 start-0 p-3';
                document.body.appendChild(toastContainer);
            }

            // Cria o toast individual
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
        <div class="toast align-items-center  border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header text-bg-${type}">
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>
    `;

            const toastEl = wrapper.querySelector('.toast');
            toastContainer.appendChild(toastEl);

            // Inicializa e mostra o toast
            const toastBootstrap = new bootstrap.Toast(toastEl);
            toastBootstrap.show();
        }


        function init() {
            router.addRoute('/', {
                template: '/wp-content/plugins/YugiohFMRemake/pages/home/home.html',
                script: '../pages/home/home.js'
            });
            router.addRoute('/about', {
                template: '/wp-content/plugins/YugiohFMRemake/pages/home/about.html'
            });


            router.addRoute('/user/:id', {
                template: '/wp-content/plugins/YugiohFMRemake/pages/user/perfil.html',
                script: '../pages/user/perfil.js'
            });


            router.addRoute('/admin', {
                template: '/wp-content/plugins/YugiohFMRemake/pages/admin/home.html',
                script: '../pages/admin/home.js'
            });


            router.addRoute('/partida', {
                template: '/wp-content/plugins/YugiohFMRemake/pages/partida/partida.html',
                script: '../pages/partida/partida.js'
            });

            window.addEventListener('DOMContentLoaded', () => router.start());
            window.addEventListener('hashchange', () => router.navigate());

        }

        init();
    </script>

<?php

    wp_enqueue_script('BootstrapJS', plugins_url('externalLibs/bootstrap-5.2.3-dist/js/bootstrap.bundle.js', __FILE__), array(), '1.0.0', true);

    return ob_get_clean();
}

// Register shortcode
add_shortcode('main_dashboard', 'main_shortcode');
