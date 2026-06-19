// Native fetch used

async function runTests() {
  console.log('--- TESTING NELUM AI MCP PROXY ENDPOINTS ---');
  
  // 1. Categories
  console.log('\n1. Testing GET /api/categories...');
  const catRes = await fetch('http://localhost:8000/api/categories');
  const categories = await catRes.json();
  console.log('Categories:', categories);

  // 2. Search Products
  console.log('\n2. Testing POST /api/products/search (query: "cake")...');
  const searchRes = await fetch('http://localhost:8000/api/products/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: 'cake' })
  });
  const products = await searchRes.json();
  console.log(`Found ${products.length} products. First product:`);
  if (products.length > 0) {
    console.log(JSON.stringify(products[0], null, 2));
  } else {
    console.log('No products returned.');
    return;
  }

  const targetProductId = products[0].id;

  // 3. Product Details
  console.log(`\n3. Testing POST /api/products/details (id: "${targetProductId}")...`);
  const detailsRes = await fetch('http://localhost:8000/api/products/details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: targetProductId })
  });
  const details = await detailsRes.json();
  console.log('Product details image URL:', details.image);
  console.log('Specs:', details.specs);

  // 4. Delivery Cities
  console.log('\n4. Testing GET /api/delivery/cities (query: "colombo")...');
  const citiesRes = await fetch('http://localhost:8000/api/delivery/cities?q=colombo');
  const cities = await citiesRes.json();
  console.log('Cities found:', cities.slice(0, 5));

  // 5. Check Delivery
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  console.log(`\n5. Testing POST /api/delivery/check (city: "Colombo 03", date: "${tomorrow}", id: "${targetProductId}")...`);
  const checkRes = await fetch('http://localhost:8000/api/delivery/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      city: 'Colombo 03',
      delivery_date: tomorrow,
      product_id: targetProductId
    })
  });
  const checkResult = await checkRes.json();
  console.log('Delivery Check Result:', checkResult);

  // 6. Create Order
  console.log('\n6. Testing POST /api/orders/create...');
  const orderRes = await fetch('http://localhost:8000/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart: [{ product_id: targetProductId }],
      recipient: {
        name: 'John Doe',
        phone: '0771234567'
      },
      delivery: {
        city: 'Colombo 03',
        date: tomorrow,
        address: 'No. 23, Flower Road, Colombo 03'
      },
      sender: {
        name: 'Alice Smith'
      },
      gift_message: 'Happy Birthday!',
      currency: 'LKR'
    })
  });
  const orderResult = await orderRes.json();
  console.log('Order Creation Result:', orderResult);

  if (orderResult.orderId) {
    // 7. Track Order
    console.log(`\n7. Testing POST /api/orders/track (id: "ORD-20260617-4QCI")...`);
    const trackRes = await fetch('http://localhost:8000/api/orders/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_number: 'ORD-20260617-4QCI' })
    });
    const trackResult = await trackRes.json();
    console.log('Order Tracking Result:', trackResult);
  }
}

runTests().catch(err => console.error('Test run failed:', err));
