<?php
function fm_plugin_install_tables() {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    // Tabela de cartas
    $table_cards = $wpdb->prefix . 'fm_cards';
    $sql_cards = "CREATE TABLE $table_cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        description TEXT,
        type_card VARCHAR(50),
        type_monster VARCHAR(50),
        attribute VARCHAR(50),
        guardian_star_1 VARCHAR(50),
        guardian_star_2 VARCHAR(50),
        attack INT,
        defense INT,
        password INT,
        starchip_cost INT
    ) $charset_collate;";

    // Tabela de fusões
    $table_fusions = $wpdb->prefix . 'fm_fusions';
    $sql_fusions = "CREATE TABLE $table_fusions (
        id INT PRIMARY KEY,
        matchs JSON
    ) $charset_collate;";

    // Tabela de saves
    $table_saves = $wpdb->prefix . 'fm_saves';
    $sql_saves = "CREATE TABLE $table_saves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED,
        save_data JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    dbDelta($sql_cards);
    dbDelta($sql_fusions);
    dbDelta($sql_saves);
}
