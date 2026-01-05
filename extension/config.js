
// Configurações do Supabase para o Frontend
const SUPABASE_URL = 'https://vxovdbzgfgpcmsuomwor.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4b3ZkYnpnZmdwY21zdW9td29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk1MDUsImV4cCI6MjA4MzIxNTUwNX0.yoLEpCYBiuQj3wCmmsSkZKUUxLpOIeNSepYdUMRNbxg';

// Exporta para uso global ou módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY };
}
