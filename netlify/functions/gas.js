exports.handler = async (event) => {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzi48h1MgSBgbVmvAgRbB1W9o6bVteh1MfZb89XALVEe7FfX0kc0EQ9-S5ZBCYjqLnA/exec';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : null;
    const params = event.queryStringParameters || {};

    let url = GAS_URL;
    const qp = Object.entries(params).map(([k,v]) => k + '=' + encodeURIComponent(v)).join('&');
    if (qp) url += '?' + qp;

    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null,
      redirect: 'follow'
    });

    const data = await res.text();
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: data };
  } catch(err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
