const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://zflsgtqdveelfyktfoqd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmbHNndHFkdmVlbGZ5a3Rmb3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTc1MDksImV4cCI6MjA4MDAzMzUwOX0.jNuA0G6DsUD7BP-EHrZ5xbZ7N38_7E-lhZE8c0eI4g0';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Test de connexion
const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
            // PGRST116 = table vide, ce n'est pas une erreur
            console.error('❌ Erreur de connexion Supabase:', error.message);
            return false;
        }
        console.log('✅ Connexion Supabase réussie');
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion Supabase:', error.message);
        return false;
    }
};

// Wrapper pour compatibilité avec l'ancien code MySQL
// Ceci permet de garder la même syntaxe pool.query()
const pool = {
    query: async (sql, params = []) => {
        // Convertir les requêtes SQL en appels Supabase
        // Note: Pour les requêtes complexes, il faudra utiliser supabase.rpc() ou adapter
        console.log('SQL Query (legacy):', sql);
        throw new Error('Utilisez directement le client Supabase au lieu de pool.query()');
    }
};

module.exports = {
    supabase,
    pool,
    testConnection
};
