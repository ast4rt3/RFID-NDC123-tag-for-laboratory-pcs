// Supabase Edge Function for get_summary.php
// This converts your PHP logic to JavaScript for Supabase Edge Functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse query parameters
    const url = new URL(req.url)
    const pcName = url.searchParams.get('pc_name') || ''
    const selectedDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
    const tab = url.searchParams.get('tab') || 'apps'

    let appData = []
    let searchData = []
    let summaryStats = {}

    if (pcName) {
      // Get app usage data
      const { data: appUsageData, error: appError } = await supabase
        .from('app_usage_logs')
        .select('*')
        .eq('pc_name', pcName)
        .gte('start_time', `${selectedDate}T00:00:00`)
        .lte('start_time', `${selectedDate}T23:59:59`)
        .order('start_time', { ascending: false })

      if (!appError) appData = appUsageData || []

      // Get browser search data
      const { data: searchDataResult, error: searchError } = await supabase
        .from('browser_search_logs')
        .select('*')
        .eq('pc_name', pcName)
        .gte('timestamp', `${selectedDate}T00:00:00`)
        .lte('timestamp', `${selectedDate}T23:59:59`)
        .order('timestamp', { ascending: false })

      if (!searchError) searchData = searchDataResult || []

      // Calculate summary stats
      summaryStats = {
        app_sessions: appData.length,
        total_app_time: appData.reduce((sum, row) => sum + (row.duration_seconds || 0), 0),
        total_searches: searchData.length,
        actual_queries: searchData.filter(row => row.search_query && row.search_query.trim() !== '').length
      }
    }

    // Return JSON response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          appData,
          searchData,
          summaryStats,
          pcName,
          selectedDate,
          tab
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
